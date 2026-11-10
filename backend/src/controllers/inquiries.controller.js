import { Inquiry } from '../models/Inquiry.js';
import { Enrollment } from '../models/Enrollment.js';
import { Student } from '../models/Student.js';
import { nextCode } from '../models/Counter.js';
import {
  ACTIVE_ENROLLMENT, ENQUIRY_TYPE, GENDER, INQUIRY_STATUS, LEAD_PRIORITY, LEAD_SOURCE, PREFERRED_BATCH,
} from '../constants/enums.js';
import { HttpError, assertId, bool, date, escapeRegex, num, optionalId, requireFields, str } from '../utils/http.js';
import { createStudentRecord } from '../services/students.js';

const TEXT = ['name', 'phone', 'email', 'fatherName', 'address', 'qualification', 'schoolName', 'parentMobile', 'courseInterest', 'remarks'];
const ENUMS = {
  enquiryType: ENQUIRY_TYPE,
  gender: GENDER,
  leadSource: LEAD_SOURCE,
  priority: LEAD_PRIORITY,
  status: INQUIRY_STATUS,
  preferredBatch: PREFERRED_BATCH,
};

function inquiryFields(body) {
  const out = {};
  for (const key of TEXT) if (body[key] !== undefined) out[key] = str(body[key]);
  for (const [key, allowed] of Object.entries(ENUMS)) {
    if (body[key] === undefined) continue;
    if (body[key] === '' || body[key] === null) out[key] = undefined;
    else if (!allowed.includes(body[key])) throw new HttpError(400, `Invalid ${key}`);
    else out[key] = body[key];
  }
  if (body.courseId !== undefined) out.courseId = optionalId(body.courseId) ?? null;
  if (body.followUpDate !== undefined) out.followUpDate = date(body.followUpDate) ?? null;
  if (body.dob !== undefined) out.dob = date(body.dob) ?? null;
  if (body.age !== undefined) out.age = body.age === '' || body.age === null ? undefined : num(body.age);
  for (const key of ['computerAtHome', 'previousCourse']) {
    if (body[key] !== undefined) out[key] = bool(body[key]);
  }
  return out;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function listInquiries(req, res) {
  const base = { deletedAt: null };
  if (req.query.enquiryType) base.enquiryType = req.query.enquiryType;
  if (req.query.webForm) base.webForm = req.query.webForm;
  if (req.query.priority) base.priority = req.query.priority;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    base.$or = [{ name: rx }, { phone: rx }, { inquiryNumber: rx }, { courseInterest: rx }];
  }
  if (req.query.followUp === 'due') {
    const end = startOfToday();
    end.setDate(end.getDate() + 1);
    base.followUpDate = { $lt: end };
    base.status = { $in: ['new', 'in-process'] };
  }

  const filter = { ...base };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  else if (!req.query.status && !filter.status) filter.status = { $in: ['new', 'in-process'] };

  const [items, countRows] = await Promise.all([
    Inquiry.find(filter).populate('courseId', 'courseName courseCode').sort({ createdAt: -1 }).limit(500),
    Inquiry.aggregate([{ $match: { ...base, status: { $exists: true } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(INQUIRY_STATUS.map((status) => [status, 0]));
  for (const row of countRows) counts[row._id] = row.count;
  res.json({ items, counts });
}

export async function getInquiry(req, res) {
  const inquiry = await Inquiry.findOne({ _id: assertId(req.params.id), deletedAt: null })
    .populate('courseId', 'courseName courseCode baseFee durationMonths')
    .populate('convertedToStudentId', 'name studentId')
    .populate('handledBy', 'name')
    .populate('followUps.by', 'name');
  if (!inquiry) throw new HttpError(404, 'Inquiry not found');
  res.json({ inquiry });
}

/** POST /inquiries/:id/follow-ups — log a call/visit note and set the next follow-up. */
export async function addFollowUp(req, res) {
  requireFields(req.body, ['note']);
  const inquiry = await Inquiry.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!inquiry) throw new HttpError(404, 'Inquiry not found');
  const nextFollowUpDate = date(req.body.nextFollowUpDate) ?? null;
  let statusAfter = req.body.status || undefined;
  if (statusAfter && !['new', 'in-process', 'closed'].includes(statusAfter)) throw new HttpError(400, 'Invalid status');
  if (!statusAfter && inquiry.status === 'new') statusAfter = 'in-process';
  inquiry.followUps.push({ note: str(req.body.note), nextFollowUpDate, statusAfter, by: req.auth.sub });
  inquiry.followUpDate = nextFollowUpDate;
  if (statusAfter && inquiry.status !== 'converted') inquiry.status = statusAfter;
  await inquiry.save();
  await inquiry.populate([
    { path: 'courseId', select: 'courseName courseCode baseFee durationMonths' },
    { path: 'convertedToStudentId', select: 'name studentId' },
    { path: 'handledBy', select: 'name' },
    { path: 'followUps.by', select: 'name' },
  ]);
  res.status(201).json({ inquiry });
}

export async function createInquiry(req, res) {
  requireFields(req.body, ['name', 'phone']);
  const inquiry = await Inquiry.create({
    ...inquiryFields(req.body),
    inquiryNumber: await nextCode('INQ', 5),
    handledBy: req.auth.sub,
  });
  res.status(201).json({ inquiry });
}

export async function updateInquiry(req, res) {
  const inquiry = await Inquiry.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!inquiry) throw new HttpError(404, 'Inquiry not found');
  const fields = inquiryFields(req.body);
  if (fields.status === 'converted' && !inquiry.convertedToStudentId) {
    throw new HttpError(400, 'Use “Convert to student” to admit this inquiry');
  }
  Object.assign(inquiry, fields);
  await inquiry.save();
  res.json({ inquiry });
}

export async function deleteInquiry(req, res) {
  const inquiry = await Inquiry.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!inquiry) throw new HttpError(404, 'Inquiry not found');
  inquiry.deletedAt = new Date();
  await inquiry.save();
  res.json({ ok: true });
}

/** POST /inquiries/:id/convert — admit the inquiry as a student (optionally enroll in the same step). */
export async function convertInquiry(req, res) {
  const inquiry = await Inquiry.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!inquiry) throw new HttpError(404, 'Inquiry not found');
  if (inquiry.convertedToStudentId) throw new HttpError(409, 'This inquiry is already converted');
  if (inquiry.enquiryType !== 'course') throw new HttpError(400, 'Only course inquiries can be converted to students');

  const fromInquiry = {
    name: inquiry.name,
    phone: inquiry.phone,
    email: inquiry.email,
    gender: inquiry.gender,
    dob: inquiry.dob,
    fatherName: inquiry.fatherName,
    address: inquiry.address,
    qualification: inquiry.qualification,
    schoolName: inquiry.schoolName,
    parentMobile: inquiry.parentMobile,
    computerAtHome: inquiry.computerAtHome,
    previousCourse: inquiry.previousCourse,
    courseId: inquiry.courseId ? String(inquiry.courseId) : undefined,
  };
  const input = { ...fromInquiry, ...req.body };
  const source = inquiry.webForm === 'online-admission' ? 'online-admission' : 'inquiry';
  const result = await createStudentRecord(input, { source, inquiry });
  res.status(201).json(result);
}

/** GET /admissions/online — website applications waiting for approval + approved students not yet enrolled. */
export async function onlineAdmissionQueue(_req, res) {
  const pending = await Inquiry.find({
    deletedAt: null,
    webForm: 'online-admission',
    status: { $in: ['new', 'in-process'] },
  })
    .populate('courseId', 'courseName courseCode baseFee')
    .sort({ createdAt: -1 })
    .limit(300);

  const admittedStudents = await Student.find({ deletedAt: null, source: 'online-admission', status: 'active' })
    .populate('courseId', 'courseName courseCode')
    .sort({ admissionDate: -1 })
    .limit(300);
  const enrolledIds = new Set(
    (await Enrollment.distinct('studentId', {
      studentId: { $in: admittedStudents.map((student) => student._id) },
      deletedAt: null,
      status: { $in: [...ACTIVE_ENROLLMENT, 'completed'] },
    })).map(String)
  );
  const awaitingEnrollment = admittedStudents.filter((student) => !enrolledIds.has(student.id));

  const rejected = await Inquiry.countDocuments({ deletedAt: null, webForm: 'online-admission', status: 'closed' });
  res.json({ pending, awaitingEnrollment, counts: { pending: pending.length, awaitingEnrollment: awaitingEnrollment.length, rejected } });
}
