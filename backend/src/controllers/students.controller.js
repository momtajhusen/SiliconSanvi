import { Enrollment } from '../models/Enrollment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Inquiry } from '../models/Inquiry.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { ACTIVE_ENROLLMENT, DOCUMENT_TYPE } from '../constants/enums.js';
import { HttpError, assertId, escapeRegex, optionalId, round2, str } from '../utils/http.js';
import { createStudentRecord, studentFields } from '../services/students.js';
import { withFeeState } from '../services/fees.js';
import { removeUpload } from '../middleware/upload.js';

export async function listStudents(req, res) {
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.source) filter.source = req.query.source;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { studentId: rx }, { fatherName: rx }];
  }
  if (req.query.courseId) {
    const courseId = assertId(req.query.courseId, 'course');
    const enrolled = await Enrollment.distinct('studentId', { courseId, deletedAt: null });
    filter.$and = [{ $or: [{ courseId }, { _id: { $in: enrolled } }] }];
  }

  const students = await Student.find(filter).populate('courseId', 'courseName courseCode').sort({ admissionDate: -1, createdAt: -1 }).limit(1000);
  const ids = students.map((student) => student._id);
  const [enrollRows, feeRows] = await Promise.all([
    Enrollment.aggregate([
      { $match: { studentId: { $in: ids }, deletedAt: null, status: { $in: ACTIVE_ENROLLMENT } } },
      { $group: { _id: '$studentId', count: { $sum: 1 } } },
    ]),
    FeeStructure.aggregate([
      { $match: { studentId: { $in: ids }, deletedAt: null } },
      { $group: { _id: '$studentId', net: { $sum: '$netFee' }, paid: { $sum: '$totalPaid' } } },
    ]),
  ]);
  const enrollMap = new Map(enrollRows.map((row) => [String(row._id), row.count]));
  const feeMap = new Map(feeRows.map((row) => [String(row._id), row]));

  const [statusRows, enrolledActive, dueRows] = await Promise.all([
    Student.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Enrollment.distinct('studentId', { deletedAt: null, status: { $in: ACTIVE_ENROLLMENT } }),
    FeeStructure.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: null, net: { $sum: '$netFee' }, paid: { $sum: '$totalPaid' } } },
    ]),
  ]);
  const byStatus = Object.fromEntries(statusRows.map((row) => [row._id, row.count]));
  const enrolledSet = new Set(enrolledActive.map(String));
  const activeIds = await Student.distinct('_id', { deletedAt: null, status: 'active' });
  const summary = {
    total: statusRows.reduce((sum, row) => sum + row.count, 0),
    byStatus,
    notEnrolled: activeIds.filter((sid) => !enrolledSet.has(String(sid))).length,
    balanceDue: round2(Math.max(0, (dueRows[0]?.net || 0) - (dueRows[0]?.paid || 0))),
  };

  res.json({
    summary,
    items: students.map((student) => {
      const fee = feeMap.get(student.id);
      return {
        ...student.toJSON(),
        activeEnrollments: enrollMap.get(student.id) || 0,
        netFee: round2(fee?.net || 0),
        totalPaid: round2(fee?.paid || 0),
        balance: round2(Math.max(0, (fee?.net || 0) - (fee?.paid || 0))),
      };
    }),
  });
}

export async function getStudent(req, res) {
  const student = await Student.findOne({ _id: assertId(req.params.id), deletedAt: null })
    .populate('courseId', 'courseName courseCode')
    .populate('inquiryId', 'inquiryNumber webForm');
  if (!student) throw new HttpError(404, 'Student not found');

  const [enrollments, fees, payments] = await Promise.all([
    Enrollment.find({ studentId: student._id, deletedAt: null })
      .populate('courseId', 'courseName courseCode durationMonths')
      .populate('batchId', 'batchName batchCode timingFrom timingTo')
      .sort({ enrollmentDate: -1 }),
    FeeStructure.find({ studentId: student._id, deletedAt: null }),
    Payment.find({ studentId: student._id, deletedAt: null }).sort({ paymentDate: -1, createdAt: -1 }).limit(100),
  ]);
  const feeByEnrollment = new Map(fees.map((fee) => [String(fee.enrollmentId), withFeeState(fee)]));
  const enriched = enrollments.map((enrollment) => ({ ...enrollment.toJSON(), fee: feeByEnrollment.get(enrollment.id) || null }));
  const totals = enriched.reduce(
    (acc, row) => ({
      netFee: round2(acc.netFee + (row.fee?.netFee || 0)),
      totalPaid: round2(acc.totalPaid + (row.fee?.totalPaid || 0)),
      balance: round2(acc.balance + (row.fee?.balance || 0)),
    }),
    { netFee: 0, totalPaid: 0, balance: 0 }
  );
  res.json({ student, enrollments: enriched, payments, totals });
}

export async function createStudent(req, res) {
  let inquiry = null;
  if (req.body.inquiryId) {
    inquiry = await Inquiry.findOne({ _id: assertId(req.body.inquiryId, 'inquiry'), deletedAt: null });
    if (!inquiry) throw new HttpError(400, 'Inquiry not found');
    if (inquiry.convertedToStudentId) throw new HttpError(409, 'This inquiry is already converted');
  }
  const source = inquiry ? (inquiry.webForm === 'online-admission' ? 'online-admission' : 'inquiry') : 'office';
  const result = await createStudentRecord(req.body, { source, inquiry });
  res.status(201).json(result);
}

export async function updateStudent(req, res) {
  const student = await Student.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!student) throw new HttpError(404, 'Student not found');
  const fields = studentFields(req.body, { partial: true });
  for (const key of ['name', 'phone']) {
    if (key in fields && !fields[key]) throw new HttpError(400, `${key} is required`);
  }
  if (fields.courseId !== undefined) fields.courseId = optionalId(fields.courseId) ?? null;
  const oldPhoto = student.photo;
  Object.assign(student, fields);
  await student.save();
  if (oldPhoto && oldPhoto !== student.photo) removeUpload(oldPhoto);
  res.json({ student });
}

export async function addDocument(req, res) {
  const student = await Student.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!student) throw new HttpError(404, 'Student not found');
  const url = str(req.body.url);
  if (!url || !url.startsWith('/uploads/')) throw new HttpError(400, 'Upload the file first');
  const docType = req.body.docType || 'other';
  if (!DOCUMENT_TYPE.includes(docType)) throw new HttpError(400, 'Invalid document type');
  student.documents.push({ docType, url, name: str(req.body.name), remarks: str(req.body.remarks) });
  await student.save();
  res.status(201).json({ documents: student.documents });
}

export async function removeDocument(req, res) {
  const student = await Student.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!student) throw new HttpError(404, 'Student not found');
  const doc = student.documents.id(assertId(req.params.docId, 'document'));
  if (!doc) throw new HttpError(404, 'Document not found');
  const { url } = doc;
  doc.deleteOne();
  await student.save();
  removeUpload(url);
  res.json({ documents: student.documents });
}

export async function deleteStudent(req, res) {
  const student = await Student.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!student) throw new HttpError(404, 'Student not found');
  const payments = await Payment.countDocuments({ studentId: student._id, deletedAt: null });
  if (payments) throw new HttpError(409, `${student.name} has ${payments} payment(s). Mark the student as dropped instead of deleting.`);
  const now = new Date();
  await Promise.all([
    Enrollment.updateMany({ studentId: student._id, deletedAt: null }, { $set: { deletedAt: now } }),
    FeeStructure.updateMany({ studentId: student._id, deletedAt: null }, { $set: { deletedAt: now } }),
    Inquiry.updateMany({ convertedToStudentId: student._id }, { $set: { convertedToStudentId: null, status: 'in-process' } }),
  ]);
  student.deletedAt = now;
  student.studentId = `${student.studentId}-DEL-${Date.now()}`;
  await student.save();
  res.json({ ok: true });
}
