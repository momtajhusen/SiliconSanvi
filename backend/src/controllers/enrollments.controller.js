import { Enrollment } from '../models/Enrollment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { ENROLLMENT_STATUS } from '../constants/enums.js';
import { HttpError, assertId, date, escapeRegex, num, str } from '../utils/http.js';
import { assertBatchAvailable, createEnrollmentRecord } from '../services/enrollments.js';
import { withFeeState } from '../services/fees.js';

const POPULATE = [
  { path: 'studentId', select: 'name studentId phone photo status fatherName email' },
  { path: 'courseId', select: 'courseName courseCode durationMonths baseFee image courseType' },
  { path: 'batchId', select: 'batchName batchCode timingFrom timingTo days faculty room startDate endDate status' },
];

export async function listEnrollments(req, res) {
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.courseId) filter.courseId = assertId(req.query.courseId, 'course');
  if (req.query.batchId) filter.batchId = req.query.batchId === 'none' ? null : assertId(req.query.batchId, 'batch');
  if (req.query.studentId) filter.studentId = assertId(req.query.studentId, 'student');
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    const studentIds = await Student.distinct('_id', { deletedAt: null, $or: [{ name: rx }, { phone: rx }, { studentId: rx }] });
    filter.$or = [{ enrollmentNumber: rx }, { studentId: { $in: studentIds } }];
  }
  const enrollments = await Enrollment.find(filter).populate(POPULATE).sort({ enrollmentDate: -1, createdAt: -1 }).limit(1000);
  const fees = await FeeStructure.find({ enrollmentId: { $in: enrollments.map((row) => row._id) }, deletedAt: null });
  const feeMap = new Map(fees.map((fee) => [String(fee.enrollmentId), withFeeState(fee)]));
  const statusRows = await Enrollment.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(ENROLLMENT_STATUS.map((status) => [status, 0]));
  for (const row of statusRows) counts[row._id] = row.count;
  res.json({ items: enrollments.map((row) => ({ ...row.toJSON(), fee: feeMap.get(row.id) || null })), counts });
}

export async function getEnrollment(req, res) {
  const enrollment = await Enrollment.findOne({ _id: assertId(req.params.id), deletedAt: null }).populate(POPULATE);
  if (!enrollment) throw new HttpError(404, 'Enrollment not found');
  const fee = await FeeStructure.findOne({ enrollmentId: enrollment._id, deletedAt: null });
  const payments = await Payment.find({ enrollmentId: enrollment._id, deletedAt: null }).sort({ paymentDate: -1, createdAt: -1 });
  res.json({ enrollment, fee: withFeeState(fee), payments });
}

export async function createEnrollment(req, res) {
  const { enrollment, fee } = await createEnrollmentRecord(req.body);
  res.status(201).json({ enrollment, fee });
}

export async function updateEnrollment(req, res) {
  const enrollment = await Enrollment.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!enrollment) throw new HttpError(404, 'Enrollment not found');
  const b = req.body;

  if (b.batchId !== undefined) {
    if (!b.batchId) enrollment.batchId = undefined;
    else if (String(b.batchId) !== String(enrollment.batchId || '')) {
      const batch = await assertBatchAvailable(b.batchId, enrollment.courseId, {
        allowOverCapacity: Boolean(b.allowOverCapacity),
        ignoreEnrollmentId: enrollment._id,
      });
      enrollment.batchId = batch._id;
    }
  }
  if (b.status !== undefined) {
    if (!ENROLLMENT_STATUS.includes(b.status)) throw new HttpError(400, 'Invalid enrollment status');
    if (b.status === 'completed' && enrollment.status !== 'completed') {
      enrollment.actualCompletionDate = enrollment.actualCompletionDate || new Date();
      if (b.progressPercentage === undefined) enrollment.progressPercentage = 100;
    }
    enrollment.status = b.status;
  }
  if (b.progressPercentage !== undefined) {
    const progress = num(b.progressPercentage);
    if (progress < 0 || progress > 100) throw new HttpError(400, 'Progress must be between 0 and 100');
    enrollment.progressPercentage = progress;
    if (progress > 0 && enrollment.status === 'enrolled' && b.status === undefined) enrollment.status = 'in_progress';
  }
  if (b.enrollmentDate !== undefined) enrollment.enrollmentDate = date(b.enrollmentDate) || enrollment.enrollmentDate;
  if (b.expectedCompletionDate !== undefined) enrollment.expectedCompletionDate = date(b.expectedCompletionDate) ?? null;
  if (b.actualCompletionDate !== undefined) enrollment.actualCompletionDate = date(b.actualCompletionDate) ?? null;
  if (b.remarks !== undefined) enrollment.remarks = str(b.remarks);

  await enrollment.save();
  await enrollment.populate(POPULATE);
  res.json({ enrollment });
}

export async function deleteEnrollment(req, res) {
  const enrollment = await Enrollment.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!enrollment) throw new HttpError(404, 'Enrollment not found');
  const payments = await Payment.countDocuments({ enrollmentId: enrollment._id, deletedAt: null });
  if (payments) throw new HttpError(409, `This enrollment has ${payments} payment(s). Mark it dropped instead of deleting.`);
  const now = new Date();
  await FeeStructure.updateMany({ enrollmentId: enrollment._id, deletedAt: null }, { $set: { deletedAt: now } });
  enrollment.deletedAt = now;
  await enrollment.save();
  res.json({ ok: true });
}
