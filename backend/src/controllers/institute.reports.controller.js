import { Enrollment } from '../models/Enrollment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Inquiry } from '../models/Inquiry.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { round2 } from '../utils/http.js';
import { withFeeState } from '../services/fees.js';
import { dayRange } from './traders.controller.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const received = (p) => round2(p.amount + (p.lateFee || 0));

function bump(map, key, init, fn) {
  if (!map.has(key)) map.set(key, { ...init });
  fn(map.get(key));
}

/** Open fee structures with their live balance, oldest due first. */
async function openDues() {
  const fees = await FeeStructure.find({ deletedAt: null, feeStatus: { $ne: 'paid' } })
    .populate('studentId', 'name studentId phone')
    .populate('courseId', 'courseName');
  const now = Date.now();
  return fees
    .map(withFeeState)
    .filter((fee) => fee.balance > 0)
    .map((fee) => ({
      id: fee.id,
      student: fee.studentId,
      course: fee.courseId?.courseName || '—',
      courseId: fee.courseId?.id || null,
      netFee: fee.netFee,
      paid: fee.totalPaid,
      balance: fee.balance,
      overdueAmount: fee.overdueAmount,
      nextDueDate: fee.nextDueDate,
      nextDueAmount: fee.nextDueAmount,
      feeStatus: fee.feeStatus,
      daysOverdue: fee.overdueAmount > 0 && fee.nextDueDate ? Math.max(0, Math.floor((now - new Date(fee.nextDueDate)) / DAY_MS)) : 0,
    }))
    .sort((a, b) => new Date(a.nextDueDate || 8.64e15) - new Date(b.nextDueDate || 8.64e15));
}

/** Institute-only snapshot: this month's numbers, dues coming up and today's follow-ups. */
export async function instituteOverview(_req, res) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(todayEnd.getTime() + 7 * DAY_MS);

  const [monthPayments, admissions, enrollments, inquiries, converted, activeStudents, activeEnrollments, followUps, recentPayments, dues] = await Promise.all([
    Payment.find({ deletedAt: null, status: 'success', paymentDate: { $gte: monthStart } }).select('amount lateFee'),
    Student.countDocuments({ deletedAt: null, admissionDate: { $gte: monthStart } }),
    Enrollment.countDocuments({ deletedAt: null, enrollmentDate: { $gte: monthStart } }),
    Inquiry.countDocuments({ deletedAt: null, enquiryType: 'course', createdAt: { $gte: monthStart } }),
    Inquiry.countDocuments({ deletedAt: null, convertedDate: { $gte: monthStart } }),
    Student.countDocuments({ deletedAt: null, status: 'active' }),
    Enrollment.countDocuments({ deletedAt: null, status: { $in: ['enrolled', 'in_progress'] } }),
    Inquiry.find({ deletedAt: null, status: { $in: ['new', 'in-process'] }, followUpDate: { $lte: todayEnd } })
      .select('inquiryNumber name phone courseInterest followUpDate status').populate('courseId', 'courseName').sort({ followUpDate: 1 }).limit(8),
    Payment.find({ deletedAt: null, status: 'success' })
      .populate('studentId', 'name studentId').sort({ paymentDate: -1, createdAt: -1 }).limit(8),
    openDues(),
  ]);

  const upcoming = dues.filter((d) => d.overdueAmount <= 0 && d.nextDueDate && new Date(d.nextDueDate) <= weekEnd);
  res.json({
    kpis: {
      monthCollected: round2(monthPayments.reduce((t, p) => t + received(p), 0)),
      monthPayments: monthPayments.length,
      monthAdmissions: admissions,
      monthEnrollments: enrollments,
      monthInquiries: inquiries,
      monthConverted: converted,
      activeStudents,
      activeEnrollments,
      outstanding: round2(dues.reduce((t, d) => t + d.balance, 0)),
      overdue: round2(dues.reduce((t, d) => t + d.overdueAmount, 0)),
      overdueStudents: dues.filter((d) => d.overdueAmount > 0).length,
      dueThisWeek: round2(upcoming.reduce((t, d) => t + d.nextDueAmount, 0)),
      followUpsDue: followUps.length,
    },
    upcoming: upcoming.slice(0, 8),
    followUps,
    recentPayments: recentPayments.map((p) => ({
      id: p.id, receiptNumber: p.receiptNumber, paymentDate: p.paymentDate, student: p.studentId, mode: p.paymentMode, amount: received(p),
    })),
  });
}

/** Fee collection, dues, admissions, enrollments and inquiry figures for one date range (defaults to all time). */
export async function instituteReport(req, res) {
  const range = dayRange(req.query.from, req.query.to);
  const within = (field) => (range ? { [field]: range } : {});

  const [payments, students, enrollments, inquiries, convertedRows, fees, dues] = await Promise.all([
    Payment.find({ deletedAt: null, status: 'success', ...within('paymentDate') })
      .populate('studentId', 'name studentId')
      .populate({ path: 'enrollmentId', select: 'courseId', populate: { path: 'courseId', select: 'courseName' } })
      .sort({ paymentDate: -1 }),
    Student.find({ deletedAt: null, ...within('admissionDate') }).select('admissionDate source courseId status').populate('courseId', 'courseName'),
    Enrollment.find({ deletedAt: null, ...within('enrollmentDate') }).select('enrollmentDate courseId status').populate('courseId', 'courseName'),
    Inquiry.find({ deletedAt: null, enquiryType: 'course', ...within('createdAt') }).select('leadSource status createdAt'),
    Inquiry.countDocuments({ deletedAt: null, convertedDate: range || { $ne: null } }),
    FeeStructure.find({ deletedAt: null, ...within('createdAt') }).select('netFee totalFee discount scholarship courseId'),
    openDues(),
  ]);

  /* Fee collection */
  const byMode = {};
  const byFor = {};
  const months = new Map();
  const courses = new Map();
  const courseRow = { name: '', admissions: 0, enrollments: 0, collected: 0, billed: 0, outstanding: 0 };
  const monthRow = { collected: 0, payments: 0, admissions: 0, enrollments: 0 };
  let lateFees = 0;
  const list = payments.map((p) => {
    const amount = received(p);
    lateFees += p.lateFee || 0;
    byMode[p.paymentMode] = round2((byMode[p.paymentMode] || 0) + amount);
    byFor[p.paymentFor] = round2((byFor[p.paymentFor] || 0) + amount);
    bump(months, monthKey(p.paymentDate), monthRow, (m) => { m.collected += amount; m.payments += 1; });
    const course = p.enrollmentId?.courseId;
    if (course) bump(courses, course.id, { ...courseRow, name: course.courseName }, (c) => { c.collected += amount; });
    return {
      id: p.id, receiptNumber: p.receiptNumber, paymentDate: p.paymentDate, student: p.studentId, course: course?.courseName || '—',
      paymentFor: p.paymentFor, installmentNumber: p.installmentNumber, mode: p.paymentMode, transactionId: p.transactionId, amount: p.amount, lateFee: p.lateFee || 0, total: amount,
    };
  });

  /* Admissions & enrollments */
  const bySource = {};
  for (const s of students) {
    bySource[s.source] = (bySource[s.source] || 0) + 1;
    bump(months, monthKey(s.admissionDate), monthRow, (m) => { m.admissions += 1; });
    if (s.courseId) bump(courses, s.courseId.id, { ...courseRow, name: s.courseId.courseName }, (c) => { c.admissions += 1; });
  }
  const enrollmentStatus = {};
  for (const e of enrollments) {
    enrollmentStatus[e.status] = (enrollmentStatus[e.status] || 0) + 1;
    bump(months, monthKey(e.enrollmentDate), monthRow, (m) => { m.enrollments += 1; });
    if (e.courseId) bump(courses, e.courseId.id, { ...courseRow, name: e.courseId.courseName }, (c) => { c.enrollments += 1; });
  }
  for (const f of fees) {
    if (courses.has(String(f.courseId))) courses.get(String(f.courseId)).billed += f.netFee;
  }
  for (const d of dues) {
    if (d.courseId && courses.has(d.courseId)) courses.get(d.courseId).outstanding += d.balance;
  }

  /* Inquiries */
  const leadSources = new Map();
  for (const q of inquiries) {
    bump(leadSources, q.leadSource || 'other', { source: q.leadSource || 'other', inquiries: 0, converted: 0, open: 0 }, (row) => {
      row.inquiries += 1;
      if (q.status === 'converted') row.converted += 1;
      if (q.status === 'new' || q.status === 'in-process') row.open += 1;
    });
  }

  const ageing = [
    { label: 'Not yet due', test: (d) => d.overdueAmount <= 0 },
    { label: '1–30 days overdue', test: (d) => d.overdueAmount > 0 && d.daysOverdue <= 30 },
    { label: '31–90 days overdue', test: (d) => d.daysOverdue > 30 && d.daysOverdue <= 90 },
    { label: '90+ days overdue', test: (d) => d.daysOverdue > 90 },
  ].map(({ label, test }) => {
    const rows = dues.filter(test);
    return { label, students: rows.length, amount: round2(rows.reduce((t, d) => t + d.balance, 0)) };
  });

  const collected = round2(list.reduce((t, p) => t + p.total, 0));
  const billed = round2(fees.reduce((t, f) => t + f.netFee, 0));
  res.json({
    summary: {
      collected,
      payments: list.length,
      lateFees: round2(lateFees),
      billed,
      grossFees: round2(fees.reduce((t, f) => t + f.totalFee, 0)),
      discounts: round2(fees.reduce((t, f) => t + f.discount + f.scholarship, 0)),
      feeStructures: fees.length,
      admissions: students.length,
      enrollments: enrollments.length,
      inquiries: inquiries.length,
      converted: convertedRows,
      conversionRate: inquiries.length ? round2((inquiries.filter((q) => q.status === 'converted').length / inquiries.length) * 100) : 0,
      outstanding: round2(dues.reduce((t, d) => t + d.balance, 0)),
      overdue: round2(dues.reduce((t, d) => t + d.overdueAmount, 0)),
      overdueStudents: dues.filter((d) => d.overdueAmount > 0).length,
    },
    byMonth: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, m]) => ({ month, ...m, collected: round2(m.collected) })),
    byMode,
    byFor,
    byCourse: [...courses.entries()]
      .map(([courseId, c]) => ({ courseId, ...c, collected: round2(c.collected), billed: round2(c.billed), outstanding: round2(c.outstanding) }))
      .sort((a, b) => b.collected - a.collected || b.enrollments - a.enrollments),
    bySource,
    enrollmentStatus,
    leadSources: [...leadSources.values()].sort((a, b) => b.inquiries - a.inquiries),
    payments: list,
    ageing,
    dues,
  });
}
