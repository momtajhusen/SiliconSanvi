import { FeeStructure } from '../models/FeeStructure.js';
import { Payment } from '../models/Payment.js';
import { Student } from '../models/Student.js';
import { nextCode } from '../models/Counter.js';
import { PAYMENT_FOR, PAYMENT_MODE, PAYMENT_STATUS } from '../constants/enums.js';
import { HttpError, assertId, date, escapeRegex, num, requireFields, round2, str } from '../utils/http.js';
import { feeState, paidTotal, syncFeeStructure, withFeeState } from '../services/fees.js';
import { removeUpload } from '../middleware/upload.js';

const POPULATE = [
  { path: 'studentId', select: 'name studentId phone photo fatherName address' },
  {
    path: 'enrollmentId',
    select: 'enrollmentNumber courseId batchId',
    populate: [
      { path: 'courseId', select: 'courseName courseCode' },
      { path: 'batchId', select: 'batchName timingFrom timingTo' },
    ],
  },
  { path: 'collectedBy', select: 'name' },
];

function paymentFields(body) {
  const out = {};
  if (body.amount !== undefined) {
    out.amount = round2(num(body.amount));
    if (out.amount <= 0) throw new HttpError(400, 'Amount must be more than 0');
  }
  if (body.lateFee !== undefined) {
    out.lateFee = round2(num(body.lateFee, 0));
    if (out.lateFee < 0) throw new HttpError(400, 'Late fee cannot be negative');
  }
  for (const [key, allowed] of [['paymentMode', PAYMENT_MODE], ['paymentFor', PAYMENT_FOR], ['status', PAYMENT_STATUS]]) {
    if (body[key] === undefined) continue;
    if (!allowed.includes(body[key])) throw new HttpError(400, `Invalid ${key}`);
    out[key] = body[key];
  }
  for (const key of ['transactionId', 'receivedFrom', 'remarks']) if (body[key] !== undefined) out[key] = str(body[key]);
  if (body.proofUrl !== undefined) {
    const proof = str(body.proofUrl);
    if (proof && !proof.startsWith('/uploads/')) throw new HttpError(400, 'Invalid payment proof');
    out.proofUrl = proof;
  }
  if (body.paymentDate !== undefined) {
    const now = new Date();
    const picked = date(body.paymentDate) || now;
    out.paymentDate = picked.toDateString() === now.toDateString() ? now : picked;
  }
  if (body.installmentNumber !== undefined) out.installmentNumber = body.installmentNumber ? Math.round(num(body.installmentNumber)) : undefined;
  return out;
}

function dayRange(from, to) {
  const range = {};
  if (from) {
    const start = date(from);
    start.setHours(0, 0, 0, 0);
    range.$gte = start;
  }
  if (to) {
    const end = date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
}

async function sumBetween(start, end) {
  const [row] = await Payment.aggregate([
    { $match: { deletedAt: null, status: 'success', paymentDate: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: { $add: ['$amount', { $ifNull: ['$lateFee', 0] }] } }, count: { $sum: 1 } } },
  ]);
  return { total: round2(row?.total || 0), count: row?.count || 0 };
}

export async function listPayments(req, res) {
  const filter = { deletedAt: null };
  const range = dayRange(req.query.from, req.query.to);
  if (range) filter.paymentDate = range;
  if (req.query.mode) filter.paymentMode = req.query.mode;
  if (req.query.paymentFor) filter.paymentFor = req.query.paymentFor;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.studentId) filter.studentId = assertId(req.query.studentId, 'student');
  if (req.query.feeStructureId) filter.feeStructureId = assertId(req.query.feeStructureId, 'fee');
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    const studentIds = await Student.distinct('_id', { deletedAt: null, $or: [{ name: rx }, { phone: rx }, { studentId: rx }] });
    filter.$or = [{ receiptNumber: rx }, { transactionId: rx }, { studentId: { $in: studentIds } }];
  }
  const items = await Payment.find(filter).populate(POPULATE).sort({ paymentDate: -1, createdAt: -1 }).limit(1000);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [today, month] = await Promise.all([sumBetween(todayStart, todayEnd), sumBetween(monthStart, todayEnd)]);
  const success = items.filter((p) => p.status === 'success');
  const byMode = {};
  for (const p of success) byMode[p.paymentMode] = round2((byMode[p.paymentMode] || 0) + p.amount + (p.lateFee || 0));

  res.json({
    items,
    summary: {
      today,
      month,
      filtered: { total: round2(success.reduce((t, p) => t + p.amount + (p.lateFee || 0), 0)), count: success.length },
      byMode,
    },
  });
}

export async function getPayment(req, res) {
  const payment = await Payment.findOne({ _id: assertId(req.params.id), deletedAt: null }).populate(POPULATE);
  if (!payment) throw new HttpError(404, 'Payment not found');
  const fee = payment.feeStructureId ? await FeeStructure.findById(payment.feeStructureId) : null;
  res.json({ payment, fee: withFeeState(fee) });
}

async function loadFee(feeStructureId, studentId) {
  const fee = await FeeStructure.findOne({ _id: assertId(feeStructureId, 'fee'), deletedAt: null });
  if (!fee) throw new HttpError(400, 'Fee structure not found');
  if (studentId && String(fee.studentId) !== String(studentId)) throw new HttpError(400, 'This fee belongs to a different student');
  return fee;
}

function assertNotOverpaying(fee, alreadyPaid, amount) {
  const balance = round2(fee.netFee - alreadyPaid);
  if (amount > balance + 0.01) {
    throw new HttpError(400, balance <= 0 ? 'This fee is already fully paid' : `Amount is more than the balance due (₹${balance})`);
  }
}

export async function createPayment(req, res) {
  requireFields(req.body, ['amount']);
  const fields = paymentFields({ paymentDate: new Date(), ...req.body });
  let studentId = req.body.studentId;
  let fee = null;

  if (req.body.feeStructureId) {
    fee = await loadFee(req.body.feeStructureId, studentId);
    studentId = fee.studentId;
    if ((fields.status || 'success') === 'success') {
      const paid = await paidTotal(fee._id);
      assertNotOverpaying(fee, paid, fields.amount);
      if (!fields.installmentNumber) {
        const next = feeState(fee.toJSON(), paid).installments.find((row) => row.remaining > 0);
        if (next && fee.installments > 1) fields.installmentNumber = next.number;
      }
    }
  }
  assertId(studentId, 'student');
  if (!(await Student.exists({ _id: studentId, deletedAt: null }))) throw new HttpError(400, 'Student not found');

  const payment = await Payment.create({
    ...fields,
    receiptNumber: await nextCode('RCP', 5),
    studentId,
    feeStructureId: fee?._id,
    enrollmentId: fee?.enrollmentId,
    paymentFor: fields.paymentFor || (fee && fee.installments > 1 ? 'installment' : 'course_fee'),
    collectedBy: req.auth.sub,
  });
  if (fee) await syncFeeStructure(fee._id);
  res.status(201).json({ payment: await payment.populate(POPULATE) });
}

export async function updatePayment(req, res) {
  const payment = await Payment.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!payment) throw new HttpError(404, 'Payment not found');
  const fields = paymentFields(req.body);
  const oldProof = payment.proofUrl;
  Object.assign(payment, fields);
  if (payment.feeStructureId && payment.status === 'success') {
    const fee = await loadFee(payment.feeStructureId);
    assertNotOverpaying(fee, await paidTotal(fee._id, { excludePaymentId: payment._id }), payment.amount);
  }
  await payment.save();
  if (oldProof && oldProof !== payment.proofUrl) removeUpload(oldProof);
  if (payment.feeStructureId) await syncFeeStructure(payment.feeStructureId);
  res.json({ payment: await payment.populate(POPULATE) });
}

export async function deletePayment(req, res) {
  const payment = await Payment.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!payment) throw new HttpError(404, 'Payment not found');
  payment.deletedAt = new Date();
  await payment.save();
  if (payment.feeStructureId) await syncFeeStructure(payment.feeStructureId);
  res.json({ ok: true });
}
