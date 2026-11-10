import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { FeeStructure } from '../models/FeeStructure.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { FEE_STATUS } from '../constants/enums.js';
import { HttpError, assertId, date, escapeRegex, num, round2, str } from '../utils/http.js';
import { FEE_COMPONENTS, buildFeeAmounts, paidTotal, syncFeeStructure, withFeeState } from '../services/fees.js';

const POPULATE = [
  { path: 'studentId', select: 'name studentId phone photo' },
  { path: 'courseId', select: 'courseName courseCode' },
  { path: 'enrollmentId', select: 'enrollmentNumber status batchId enrollmentDate', populate: { path: 'batchId', select: 'batchName' } },
];

export async function listFees(req, res) {
  const filter = { deletedAt: null };
  if (req.query.courseId) filter.courseId = assertId(req.query.courseId, 'course');
  if (req.query.studentId) filter.studentId = assertId(req.query.studentId, 'student');
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.studentId = { $in: await Student.distinct('_id', { deletedAt: null, $or: [{ name: rx }, { phone: rx }, { studentId: rx }] }) };
  }
  const fees = await FeeStructure.find(filter).populate(POPULATE).sort({ createdAt: -1 }).limit(1000);
  let items = fees.map(withFeeState);

  const summary = items.reduce(
    (acc, fee) => {
      acc.netFee = round2(acc.netFee + fee.netFee);
      acc.totalPaid = round2(acc.totalPaid + fee.totalPaid);
      acc.balance = round2(acc.balance + fee.balance);
      acc.overdueAmount = round2(acc.overdueAmount + fee.overdueAmount);
      acc.counts[fee.feeStatus] += 1;
      return acc;
    },
    { netFee: 0, totalPaid: 0, balance: 0, overdueAmount: 0, counts: Object.fromEntries(FEE_STATUS.map((s) => [s, 0])) }
  );
  if (req.query.status === 'unpaid') items = items.filter((fee) => fee.balance > 0);
  else if (req.query.status) items = items.filter((fee) => fee.feeStatus === req.query.status);
  res.json({ items, summary });
}

export async function getFee(req, res) {
  const fee = await FeeStructure.findOne({ _id: assertId(req.params.id), deletedAt: null }).populate(POPULATE);
  if (!fee) throw new HttpError(404, 'Fee structure not found');
  const payments = await Payment.find({ feeStructureId: fee._id, deletedAt: null }).sort({ paymentDate: -1, createdAt: -1 });
  res.json({ fee: withFeeState(fee), payments });
}

/** For enrollments that were created without a fee structure (e.g. after one was deleted). */
export async function createFee(req, res) {
  const enrollment = await Enrollment.findOne({ _id: assertId(req.body.enrollmentId, 'enrollment'), deletedAt: null });
  if (!enrollment) throw new HttpError(400, 'Enrollment not found');
  if (await FeeStructure.exists({ enrollmentId: enrollment._id })) {
    throw new HttpError(409, 'This enrollment already has a fee structure. Edit it instead.');
  }
  const course = await Course.findById(enrollment.courseId);
  const amounts = buildFeeAmounts(
    { courseFee: course?.baseFee, admissionFee: course?.admissionFee, examFee: course?.examFee, ...req.body },
    { firstDue: date(req.body.firstDueDate) || enrollment.enrollmentDate }
  );
  const fee = await FeeStructure.create({
    ...amounts,
    enrollmentId: enrollment._id,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    remarks: str(req.body.remarks),
  });
  await syncFeeStructure(fee._id);
  res.status(201).json({ fee: withFeeState(await FeeStructure.findById(fee._id).populate(POPULATE)) });
}

export async function updateFee(req, res) {
  const fee = await FeeStructure.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!fee) throw new HttpError(404, 'Fee structure not found');
  const current = fee.toJSON();
  const merged = {
    ...Object.fromEntries(FEE_COMPONENTS.map((key) => [key, current[key]])),
    discount: current.discount,
    scholarship: current.scholarship,
    installments: current.installments,
    ...req.body,
  };
  const scheduleChanged = req.body.installmentSchedule !== undefined || req.body.installments !== undefined
    || FEE_COMPONENTS.some((key) => req.body[key] !== undefined) || req.body.discount !== undefined || req.body.scholarship !== undefined;
  if (!scheduleChanged) merged.installmentSchedule = current.installmentSchedule;

  const firstDue = date(req.body.firstDueDate) || current.installmentSchedule?.[0]?.dueDate || new Date();
  const amounts = buildFeeAmounts(merged, { firstDue });
  const paid = await paidTotal(fee._id);
  if (amounts.netFee < paid) throw new HttpError(400, `Net fee (₹${amounts.netFee}) cannot be less than the amount already paid (₹${paid})`);

  Object.assign(fee, amounts);
  if (req.body.remarks !== undefined) fee.remarks = str(req.body.remarks);
  if (req.body.nextPaymentDueDate !== undefined) fee.nextPaymentDueDate = date(req.body.nextPaymentDueDate) ?? null;
  await fee.save();
  await syncFeeStructure(fee._id);
  res.json({ fee: withFeeState(await FeeStructure.findById(fee._id).populate(POPULATE)) });
}

export async function deleteFee(req, res) {
  const fee = await FeeStructure.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!fee) throw new HttpError(404, 'Fee structure not found');
  const payments = await Payment.countDocuments({ feeStructureId: fee._id, deletedAt: null });
  if (payments) throw new HttpError(409, 'Payments are recorded against this fee. Delete those payments first.');
  await FeeStructure.deleteOne({ _id: fee._id });
  res.json({ ok: true });
}

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/**
 * GET /fees/dues?days=7&bucket=overdue|today|upcoming&courseId=
 * Unpaid installments grouped as overdue / due today / upcoming (within `days`), plus a monthly forecast.
 */
export async function feeDues(req, res) {
  const days = Math.min(365, Math.max(0, Math.round(num(req.query.days, 7))));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  const until = new Date(todayEnd);
  until.setDate(until.getDate() + days);

  const filter = { deletedAt: null, feeStatus: { $ne: 'paid' } };
  if (req.query.courseId) filter.courseId = assertId(req.query.courseId, 'course');
  const fees = await FeeStructure.find(filter).populate(POPULATE);
  const onHold = new Set(
    (await Student.distinct('_id', { _id: { $in: fees.map((fee) => fee.studentId?._id).filter(Boolean) }, status: { $in: ['dropped', 'on_hold'] } })).map(String)
  );

  const rows = [];
  const buckets = {
    overdue: { count: 0, amount: 0 },
    today: { count: 0, amount: 0 },
    upcoming: { count: 0, amount: 0 },
    totalPending: { count: 0, amount: 0 },
  };
  const forecast = new Map();
  const add = (bucket, amount) => {
    buckets[bucket].count += 1;
    buckets[bucket].amount = round2(buckets[bucket].amount + amount);
  };

  for (const fee of fees) {
    if (onHold.has(String(fee.studentId?._id))) continue;
    const state = withFeeState(fee);
    for (const row of state.installmentProgress) {
      if (!(row.remaining > 0)) continue;
      add('totalPending', row.remaining);
      if (!row.dueDate) continue;
      const due = new Date(row.dueDate);
      const bucket = due < todayStart ? 'overdue' : due <= todayEnd ? 'today' : due <= until ? 'upcoming' : null;
      if (due >= todayStart) {
        const key = monthKey(due);
        const entry = forecast.get(key) || { month: key, count: 0, amount: 0 };
        entry.count += 1;
        entry.amount = round2(entry.amount + row.remaining);
        forecast.set(key, entry);
      }
      if (!bucket) continue;
      add(bucket, row.remaining);
      if (req.query.bucket && req.query.bucket !== bucket) continue;
      rows.push({
        feeId: state.id,
        student: state.studentId,
        course: state.courseId,
        enrollment: state.enrollmentId,
        installment: row.number,
        title: row.title,
        dueDate: row.dueDate,
        scheduled: row.amount,
        paid: row.paidAmount,
        amountDue: row.remaining,
        bucket,
        overdue: bucket === 'overdue',
        daysLate: bucket === 'overdue' ? Math.max(1, Math.ceil((todayStart - due) / 86400000)) : 0,
      });
    }
  }
  rows.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  res.json({
    items: rows,
    buckets,
    forecast: [...forecast.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(0, 12),
    totals: {
      due: round2(rows.reduce((total, row) => total + row.amountDue, 0)),
      overdue: buckets.overdue.amount,
    },
  });
}
