import mongoose from 'mongoose';
import { Course } from '../models/Course.js';
import { Inquiry } from '../models/Inquiry.js';
import { nextCode } from '../models/Counter.js';
import { ENQUIRY_TYPE, GENDER, PREFERRED_BATCH } from '../constants/enums.js';
import { HttpError, date, requireFields, str } from '../utils/http.js';

const PHONE = /^[0-9+\s-]{10,15}$/;

async function resolveCourse(ref) {
  if (!ref) return null;
  const or = [{ slug: String(ref).toLowerCase() }];
  if (mongoose.isValidObjectId(ref)) or.push({ _id: ref });
  return Course.findOne({ deletedAt: null, status: 'active', $or: or });
}

function validatePhone(phone) {
  if (!PHONE.test(String(phone || '').trim())) throw new HttpError(400, 'Please enter a valid phone number');
}

export async function publicCourses(_req, res) {
  const items = await Course.find({ deletedAt: null, status: 'active' })
    .select('courseCode slug courseName shortDescription image durationMonths baseFee admissionFee courseType level')
    .sort({ sortOrder: 1, courseName: 1 });
  res.json({ items });
}

/** POST /public/inquiries — website contact form (course, CCTV or product enquiry). */
export async function publicInquiry(req, res) {
  requireFields(req.body, ['name', 'phone']);
  validatePhone(req.body.phone);
  const enquiryType = ENQUIRY_TYPE.includes(req.body.enquiryType) ? req.body.enquiryType : 'course';
  const course = enquiryType === 'course' ? await resolveCourse(req.body.course) : null;
  if (enquiryType === 'course' && !course) throw new HttpError(400, 'Please choose a course');

  const details = enquiryType === 'cctv'
    ? { property: str(req.body.property), package: str(req.body.package) }
    : enquiryType === 'products'
      ? { item: str(req.body.item) }
      : undefined;

  const inquiry = await Inquiry.create({
    inquiryNumber: await nextCode('INQ', 5),
    enquiryType,
    name: str(req.body.name),
    phone: str(req.body.phone),
    email: str(req.body.email),
    courseId: course?._id,
    courseInterest: course?.courseName,
    preferredBatch: PREFERRED_BATCH.includes(req.body.batch) ? req.body.batch : undefined,
    details,
    remarks: str(req.body.message),
    webForm: 'contact',
    leadSource: 'website',
  });
  res.status(201).json({ ok: true, inquiryNumber: inquiry.inquiryNumber });
}

/** POST /public/admissions — website online admission form. */
export async function publicAdmission(req, res) {
  requireFields(req.body, ['name', 'phone', 'gender', 'course']);
  validatePhone(req.body.phone);
  if (!GENDER.includes(req.body.gender)) throw new HttpError(400, 'Please select gender');
  const course = await resolveCourse(req.body.course);
  if (!course) throw new HttpError(400, 'Please choose a course');

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await Inquiry.findOne({
    deletedAt: null,
    webForm: 'online-admission',
    phone: str(req.body.phone),
    courseId: course._id,
    createdAt: { $gte: since },
  });
  if (existing) {
    res.json({ ok: true, inquiryNumber: existing.inquiryNumber, duplicate: true });
    return;
  }

  const inquiry = await Inquiry.create({
    inquiryNumber: await nextCode('INQ', 5),
    enquiryType: 'course',
    name: str(req.body.name),
    phone: str(req.body.phone),
    email: str(req.body.email),
    gender: req.body.gender,
    dob: date(req.body.dob),
    fatherName: str(req.body.fatherName),
    address: str(req.body.address),
    qualification: str(req.body.qualification),
    courseId: course._id,
    courseInterest: course.courseName,
    preferredBatch: PREFERRED_BATCH.includes(req.body.preferredBatch) ? req.body.preferredBatch : undefined,
    remarks: str(req.body.message),
    webForm: 'online-admission',
    leadSource: 'website',
    priority: 'hot',
  });
  res.status(201).json({ ok: true, inquiryNumber: inquiry.inquiryNumber });
}
