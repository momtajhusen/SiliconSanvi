import { Batch } from '../models/Batch.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { ACTIVE_ENROLLMENT, COURSE_LEVEL, COURSE_TYPE, ENROLLMENT_STATUS, ENTITY_STATUS } from '../constants/enums.js';
import { HttpError, assertId, escapeRegex, num, requireFields, round2, str } from '../utils/http.js';
import { batchStrengths } from '../services/enrollments.js';
import { removeUpload } from '../middleware/upload.js';

function courseFields(body) {
  const out = {};
  for (const key of ['courseCode', 'courseName', 'shortDescription', 'description', 'slug', 'image', 'syllabus', 'prerequisites', 'learningOutcomes']) {
    if (body[key] !== undefined) out[key] = str(body[key]);
  }
  for (const key of ['durationMonths', 'baseFee', 'admissionFee', 'examFee', 'sortOrder']) {
    if (body[key] !== undefined) {
      out[key] = num(body[key]);
      if (out[key] < 0) throw new HttpError(400, `${key} cannot be negative`);
    }
  }
  if (body.courseType !== undefined && !COURSE_TYPE.includes(body.courseType)) throw new HttpError(400, 'Invalid course type');
  if (body.level !== undefined && !COURSE_LEVEL.includes(body.level)) throw new HttpError(400, 'Invalid level');
  if (body.status !== undefined && !ENTITY_STATUS.includes(body.status)) throw new HttpError(400, 'Invalid status');
  for (const key of ['courseType', 'level', 'status']) if (body[key] !== undefined) out[key] = body[key];
  return out;
}

async function countsByCourse(model, ids, extra = {}) {
  const rows = await model.aggregate([
    { $match: { courseId: { $in: ids }, deletedAt: null, ...extra } },
    { $group: { _id: '$courseId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

export async function listCourses(req, res) {
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ courseName: rx }, { courseCode: rx }];
  }
  const courses = await Course.find(filter).sort({ sortOrder: 1, courseName: 1 });
  const ids = courses.map((course) => course._id);
  const [batches, students] = await Promise.all([
    countsByCourse(Batch, ids, { status: { $in: ['upcoming', 'active'] } }),
    countsByCourse(Enrollment, ids, { status: { $in: ACTIVE_ENROLLMENT } }),
  ]);
  res.json({
    items: courses.map((course) => ({
      ...course.toJSON(),
      openBatches: batches.get(course.id) || 0,
      activeStudents: students.get(course.id) || 0,
    })),
  });
}

export async function getCourse(req, res) {
  const course = await Course.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!course) throw new HttpError(404, 'Course not found');
  const [batches, statusRows, feeRows, recent] = await Promise.all([
    Batch.find({ courseId: course._id, deletedAt: null }).sort({ startDate: -1 }),
    Enrollment.aggregate([
      { $match: { courseId: course._id, deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    FeeStructure.aggregate([
      { $match: { courseId: course._id, deletedAt: null } },
      { $group: { _id: null, net: { $sum: '$netFee' }, paid: { $sum: '$totalPaid' } } },
    ]),
    Enrollment.find({ courseId: course._id, deletedAt: null })
      .populate('studentId', 'name studentId phone photo')
      .populate('batchId', 'batchName')
      .sort({ enrollmentDate: -1 })
      .limit(10),
  ]);
  const strengths = await batchStrengths(batches.map((batch) => batch._id));
  const enrollmentCounts = Object.fromEntries(ENROLLMENT_STATUS.map((status) => [status, 0]));
  for (const row of statusRows) enrollmentCounts[row._id] = row.count;
  res.json({
    course,
    batches: batches.map((batch) => ({ ...batch.toJSON(), currentStrength: strengths.get(batch.id) || 0 })),
    enrollmentCounts,
    fees: { netFee: round2(feeRows[0]?.net || 0), collected: round2(feeRows[0]?.paid || 0), balance: round2(Math.max(0, (feeRows[0]?.net || 0) - (feeRows[0]?.paid || 0))) },
    recentEnrollments: recent,
  });
}

export async function createCourse(req, res) {
  requireFields(req.body, ['courseCode', 'courseName', 'durationMonths', 'baseFee']);
  const course = await Course.create(courseFields(req.body));
  res.status(201).json({ course });
}

export async function updateCourse(req, res) {
  const course = await Course.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!course) throw new HttpError(404, 'Course not found');
  const fields = courseFields(req.body);
  const oldImage = course.image;
  Object.assign(course, fields);
  await course.save();
  if (oldImage && oldImage !== course.image) removeUpload(oldImage);
  res.json({ course });
}

export async function deleteCourse(req, res) {
  const course = await Course.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!course) throw new HttpError(404, 'Course not found');
  const active = await Enrollment.countDocuments({ courseId: course._id, deletedAt: null, status: { $in: ACTIVE_ENROLLMENT } });
  if (active) throw new HttpError(409, `${active} student(s) are still enrolled. Mark the course inactive instead.`);
  course.deletedAt = new Date();
  course.courseCode = `${course.courseCode}-DEL-${Date.now()}`;
  course.slug = undefined;
  await course.save();
  await Batch.updateMany({ courseId: course._id, deletedAt: null }, { $set: { deletedAt: new Date() } });
  res.json({ ok: true });
}
