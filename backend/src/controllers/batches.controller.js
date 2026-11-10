import { Batch } from '../models/Batch.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { nextCode } from '../models/Counter.js';
import { ACTIVE_ENROLLMENT, BATCH_STATUS, BATCH_TYPE, WEEK_DAYS } from '../constants/enums.js';
import { HttpError, assertId, date, escapeRegex, num, requireFields, str } from '../utils/http.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { batchStrengths } from '../services/enrollments.js';
import { withFeeState } from '../services/fees.js';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function batchFields(body) {
  const out = {};
  for (const key of ['batchName', 'room', 'faculty']) if (body[key] !== undefined) out[key] = str(body[key]);
  if (body.batchCode !== undefined && str(body.batchCode)) out.batchCode = str(body.batchCode);
  for (const key of ['timingFrom', 'timingTo']) {
    if (body[key] !== undefined) {
      if (!TIME.test(String(body[key]))) throw new HttpError(400, `${key} must be HH:MM`);
      out[key] = body[key];
    }
  }
  if (body.startDate !== undefined) out.startDate = date(body.startDate);
  if (body.endDate !== undefined) out.endDate = date(body.endDate) ?? null;
  if (body.maxStrength !== undefined) out.maxStrength = Math.max(1, Math.round(num(body.maxStrength, 20)));
  if (body.days !== undefined) {
    const days = Array.isArray(body.days) ? body.days : [];
    if (days.some((day) => !WEEK_DAYS.includes(day))) throw new HttpError(400, 'Invalid day');
    out.days = WEEK_DAYS.filter((day) => days.includes(day));
  }
  if (body.batchType !== undefined) {
    if (!BATCH_TYPE.includes(body.batchType)) throw new HttpError(400, 'Invalid batch type');
    out.batchType = body.batchType;
  }
  if (body.status !== undefined) {
    if (!BATCH_STATUS.includes(body.status)) throw new HttpError(400, 'Invalid batch status');
    out.status = body.status;
  }
  if (out.timingFrom && out.timingTo && out.timingFrom >= out.timingTo) throw new HttpError(400, 'End time must be after start time');
  if (out.startDate && out.endDate && out.endDate < out.startDate) throw new HttpError(400, 'End date must be after start date');
  return out;
}

/** Planned end: the batch end date, else start + course duration. */
function plannedEnd(batch) {
  if (batch.endDate) return new Date(batch.endDate);
  const months = batch.courseId?.durationMonths;
  if (!months || !batch.startDate) return null;
  const end = new Date(batch.startDate);
  end.setMonth(end.getMonth() + months);
  return end;
}

/** % of the planned duration that has passed (where the class should be by now). */
function expectedProgress(batch) {
  const end = plannedEnd(batch);
  if (!end || !batch.startDate) return null;
  if (batch.status === 'completed') return 100;
  const start = new Date(batch.startDate).getTime();
  const span = end.getTime() - start;
  if (span <= 0) return null;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / span) * 100)));
}

function shape(batch, strengths, progress = new Map()) {
  const currentStrength = strengths.get(batch.id) || 0;
  const end = plannedEnd(batch);
  return {
    ...batch.toJSON(),
    currentStrength,
    seatsLeft: Math.max(0, batch.maxStrength - currentStrength),
    plannedEndDate: end,
    expectedProgress: expectedProgress(batch),
    avgProgress: progress.has(batch.id) ? progress.get(batch.id) : null,
  };
}

async function averageProgress(batchIds) {
  if (!batchIds.length) return new Map();
  const rows = await Enrollment.aggregate([
    { $match: { batchId: { $in: batchIds }, deletedAt: null, status: { $in: [...ACTIVE_ENROLLMENT, 'completed'] } } },
    { $group: { _id: '$batchId', avg: { $avg: '$progressPercentage' } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), Math.round(row.avg || 0)]));
}

export async function listBatches(req, res) {
  const filter = { deletedAt: null };
  if (req.query.courseId) filter.courseId = assertId(req.query.courseId, 'course');
  if (req.query.status) filter.status = { $in: String(req.query.status).split(',') };
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ batchName: rx }, { batchCode: rx }, { faculty: rx }, { room: rx }];
  }
  const batches = await Batch.find(filter).populate('courseId', 'courseName courseCode durationMonths').sort({ startDate: -1 });
  const ids = batches.map((batch) => batch._id);
  const [strengths, progress, statusRows, studentsInBatches] = await Promise.all([
    batchStrengths(ids),
    averageProgress(ids),
    Batch.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Enrollment.countDocuments({ deletedAt: null, batchId: { $ne: null }, status: { $in: ACTIVE_ENROLLMENT } }),
  ]);
  const counts = Object.fromEntries(BATCH_STATUS.map((status) => [status, 0]));
  for (const row of statusRows) counts[row._id] = row.count;
  res.json({
    items: batches.map((batch) => shape(batch, strengths, progress)),
    summary: { counts, total: statusRows.reduce((sum, row) => sum + row.count, 0), studentsInBatches },
  });
}

export async function getBatch(req, res) {
  const batch = await Batch.findOne({ _id: assertId(req.params.id), deletedAt: null }).populate('courseId', 'courseName courseCode durationMonths');
  if (!batch) throw new HttpError(404, 'Batch not found');
  const enrollments = await Enrollment.find({ batchId: batch._id, deletedAt: null })
    .populate('studentId', 'name studentId phone photo')
    .sort({ enrollmentDate: -1 });
  const fees = await FeeStructure.find({ enrollmentId: { $in: enrollments.map((row) => row._id) }, deletedAt: null });
  const feeMap = new Map(fees.map((fee) => [String(fee.enrollmentId), withFeeState(fee)]));
  const [strengths, progress] = await Promise.all([batchStrengths([batch._id]), averageProgress([batch._id])]);
  res.json({
    batch: shape(batch, strengths, progress),
    enrollments: enrollments.map((row) => {
      const fee = feeMap.get(row.id);
      return { ...row.toJSON(), fee: fee ? { id: fee.id, balance: fee.balance, feeStatus: fee.feeStatus } : null };
    }),
  });
}

/** POST /batches/:id/complete — finish the batch and mark its running students completed. */
export async function completeBatch(req, res) {
  const batch = await Batch.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!batch) throw new HttpError(404, 'Batch not found');
  if (batch.status === 'completed') throw new HttpError(409, 'This batch is already completed');
  const now = new Date();
  const result = await Enrollment.updateMany(
    { batchId: batch._id, deletedAt: null, status: { $in: ['enrolled', 'in_progress'] } },
    { $set: { status: 'completed', progressPercentage: 100, actualCompletionDate: now } }
  );
  batch.status = 'completed';
  if (!batch.endDate || batch.endDate > now) batch.endDate = now;
  await batch.save();
  res.json({ batch, completedStudents: result.modifiedCount });
}

export async function createBatch(req, res) {
  requireFields(req.body, ['batchName', 'courseId', 'startDate', 'timingFrom', 'timingTo']);
  const course = await Course.findOne({ _id: assertId(req.body.courseId, 'course'), deletedAt: null });
  if (!course) throw new HttpError(400, 'Course not found');
  const fields = batchFields(req.body);
  const batch = await Batch.create({ ...fields, courseId: course._id, batchCode: fields.batchCode || (await nextCode('BAT', 3)) });
  res.status(201).json({ batch });
}

export async function updateBatch(req, res) {
  const batch = await Batch.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!batch) throw new HttpError(404, 'Batch not found');
  const fields = batchFields(req.body);
  if (req.body.courseId && String(req.body.courseId) !== String(batch.courseId)) {
    const enrolled = await Enrollment.countDocuments({ batchId: batch._id, deletedAt: null });
    if (enrolled) throw new HttpError(409, 'Students are already in this batch, so its course cannot change');
    fields.courseId = assertId(req.body.courseId, 'course');
  }
  Object.assign(batch, fields);
  if (batch.timingFrom >= batch.timingTo) throw new HttpError(400, 'End time must be after start time');
  await batch.save();
  res.json({ batch });
}

export async function deleteBatch(req, res) {
  const batch = await Batch.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!batch) throw new HttpError(404, 'Batch not found');
  const active = await Enrollment.countDocuments({ batchId: batch._id, deletedAt: null, status: { $in: ACTIVE_ENROLLMENT } });
  if (active) throw new HttpError(409, `${active} student(s) are in this batch. Move them first or mark the batch completed.`);
  batch.deletedAt = new Date();
  batch.batchCode = `${batch.batchCode}-DEL-${Date.now()}`;
  await batch.save();
  res.json({ ok: true });
}
