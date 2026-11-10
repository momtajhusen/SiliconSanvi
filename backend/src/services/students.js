import { Student } from '../models/Student.js';
import { nextCode } from '../models/Counter.js';
import { GENDER, STUDENT_STATUS } from '../constants/enums.js';
import { HttpError, bool, date, optionalId, requireFields, str } from '../utils/http.js';
import { createEnrollmentRecord } from './enrollments.js';

const TEXT_FIELDS = [
  'name', 'phone', 'email', 'fatherName', 'motherName', 'address', 'city',
  'qualification', 'schoolName', 'parentName', 'parentMobile', 'remarks', 'photo', 'guardianRelation', 'idNumber',
];

export function studentFields(input, { partial = false } = {}) {
  const out = {};
  for (const key of TEXT_FIELDS) {
    if (input[key] !== undefined) out[key] = str(input[key]) ?? (partial ? '' : undefined);
  }
  if (input.gender !== undefined) {
    if (!GENDER.includes(input.gender)) throw new HttpError(400, 'Gender must be male, female or other');
    out.gender = input.gender;
  }
  if (input.status !== undefined) {
    if (!STUDENT_STATUS.includes(input.status)) throw new HttpError(400, 'Invalid student status');
    out.status = input.status;
  }
  for (const key of ['computerAtHome', 'previousCourse']) {
    if (input[key] !== undefined) out[key] = bool(input[key]);
  }
  if (input.dob !== undefined) out.dob = date(input.dob) ?? null;
  if (input.admissionDate !== undefined && input.admissionDate !== '') out.admissionDate = date(input.admissionDate);
  if (input.courseId !== undefined) out.courseId = optionalId(input.courseId) ?? null;
  return out;
}

/**
 * Admits a student. When `inquiry` is given it is marked converted; when `input.enrollment`
 * has a course or batch, the enrollment + fee structure are created in the same step.
 */
export async function createStudentRecord(input, { source = 'office', inquiry = null } = {}) {
  requireFields(input, ['name', 'phone', 'gender']);
  if (!/^[0-9+\s-]{10,15}$/.test(String(input.phone).trim())) throw new HttpError(400, 'Enter a valid phone number');

  const student = await Student.create({
    ...studentFields(input),
    studentId: await nextCode('STU'),
    admissionDate: date(input.admissionDate) || new Date(),
    inquiryId: inquiry?._id,
    source,
  });

  let enrollment = null;
  let fee = null;
  if (input.enrollment && (input.enrollment.courseId || input.enrollment.batchId)) {
    try {
      ({ enrollment, fee } = await createEnrollmentRecord({ ...input.enrollment, studentId: student._id }));
    } catch (err) {
      await Student.deleteOne({ _id: student._id });
      throw err;
    }
  }

  if (inquiry) {
    inquiry.status = 'converted';
    inquiry.convertedToStudentId = student._id;
    inquiry.convertedDate = new Date();
    await inquiry.save();
  }
  return { student, enrollment, fee };
}
