import mongoose from 'mongoose';
import { Batch } from '../models/Batch.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Student } from '../models/Student.js';
import { nextCode } from '../models/Counter.js';
import { ACTIVE_ENROLLMENT, ENROLLMENT_STATUS } from '../constants/enums.js';
import { HttpError, assertId, date, num, str } from '../utils/http.js';
import { buildFeeAmounts, syncFeeStructure } from './fees.js';

/** Active-enrollment counts per batch id. */
export async function batchStrengths(batchIds) {
  const ids = batchIds.filter(Boolean).map((id) => new mongoose.Types.ObjectId(String(id)));
  if (!ids.length) return new Map();
  const rows = await Enrollment.aggregate([
    { $match: { batchId: { $in: ids }, deletedAt: null, status: { $in: ACTIVE_ENROLLMENT } } },
    { $group: { _id: '$batchId', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

/** Validates that a batch can take this enrollment (same course, open, not full). */
export async function assertBatchAvailable(batchId, courseId, { allowOverCapacity = false, ignoreEnrollmentId } = {}) {
  assertId(batchId, 'batch');
  const batch = await Batch.findOne({ _id: batchId, deletedAt: null });
  if (!batch) throw new HttpError(400, 'Batch not found');
  if (courseId && String(batch.courseId) !== String(courseId)) throw new HttpError(400, 'This batch belongs to a different course');
  if (['completed', 'cancelled'].includes(batch.status)) throw new HttpError(400, `Batch is ${batch.status}`);
  if (!allowOverCapacity) {
    const filter = { batchId: batch._id, deletedAt: null, status: { $in: ACTIVE_ENROLLMENT } };
    if (ignoreEnrollmentId) filter._id = { $ne: ignoreEnrollmentId };
    const strength = await Enrollment.countDocuments(filter);
    if (strength >= batch.maxStrength) {
      throw new HttpError(409, `Batch ${batch.batchName} is full (${strength}/${batch.maxStrength}). Choose another batch or allow over capacity.`);
    }
  }
  return batch;
}

/** Creates an enrollment together with its fee structure (defaults come from the course). */
export async function createEnrollmentRecord(input) {
  const studentId = assertId(input.studentId, 'student');
  const student = await Student.findOne({ _id: studentId, deletedAt: null });
  if (!student) throw new HttpError(400, 'Student not found');

  let courseId = input.courseId;
  let batch = null;
  if (input.batchId) {
    batch = await Batch.findOne({ _id: assertId(input.batchId, 'batch'), deletedAt: null });
    if (!batch) throw new HttpError(400, 'Batch not found');
    courseId = courseId || batch.courseId;
  }
  assertId(courseId, 'course');
  const course = await Course.findOne({ _id: courseId, deletedAt: null });
  if (!course) throw new HttpError(400, 'Course not found');
  if (course.status !== 'active') throw new HttpError(400, 'Course is inactive');
  if (batch) await assertBatchAvailable(batch._id, course._id, { allowOverCapacity: Boolean(input.allowOverCapacity) });

  const duplicate = await Enrollment.findOne({
    studentId,
    courseId: course._id,
    deletedAt: null,
    status: { $in: ACTIVE_ENROLLMENT },
  });
  if (duplicate) {
    throw new HttpError(409, `${student.name} is already enrolled in ${course.courseName} (${duplicate.enrollmentNumber})`);
  }

  const enrollmentDate = date(input.enrollmentDate) || new Date();
  const expected = date(input.expectedCompletionDate) || (() => {
    const d = new Date(enrollmentDate);
    d.setMonth(d.getMonth() + Math.max(1, Math.round(course.durationMonths || 1)));
    return d;
  })();
  const status = ENROLLMENT_STATUS.includes(input.status) ? input.status : 'enrolled';

  const feeInput = {
    courseFee: course.baseFee,
    admissionFee: course.admissionFee,
    examFee: course.examFee,
    ...(input.fee || {}),
  };
  const feeAmounts = buildFeeAmounts(feeInput, { firstDue: date(input.fee?.firstDueDate) || enrollmentDate });

  const enrollment = await Enrollment.create({
    enrollmentNumber: await nextCode('ENR'),
    studentId,
    courseId: course._id,
    batchId: batch?._id,
    enrollmentDate,
    expectedCompletionDate: expected,
    status,
    progressPercentage: Math.min(100, Math.max(0, num(input.progressPercentage, 0))),
    remarks: str(input.remarks),
  });

  let fee;
  try {
    fee = await FeeStructure.create({
      ...feeAmounts,
      enrollmentId: enrollment._id,
      studentId,
      courseId: course._id,
      remarks: str(input.fee?.remarks),
    });
  } catch (err) {
    await Enrollment.deleteOne({ _id: enrollment._id });
    throw err;
  }
  await syncFeeStructure(fee._id);

  if (!student.courseId) {
    student.courseId = course._id;
    await student.save();
  }
  return { enrollment, fee };
}
