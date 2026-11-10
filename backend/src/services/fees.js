import mongoose from 'mongoose';
import { FeeStructure } from '../models/FeeStructure.js';
import { Payment } from '../models/Payment.js';
import { HttpError, date, num, round2, str } from '../utils/http.js';

export const FEE_COMPONENTS = ['courseFee', 'admissionFee', 'examFee', 'certificateFee', 'otherFees'];

function addMonths(base, months) {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

function endOfDay(value) {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

function buildSchedule(custom, count, netFee, firstDue) {
  if (Array.isArray(custom) && custom.length) {
    const rows = custom.map((row, index) => ({
      number: index + 1,
      title: str(row.title) || `Installment ${index + 1}`,
      amount: round2(num(row.amount)),
      dueDate: date(row.dueDate),
    }));
    if (rows.some((row) => row.amount < 0)) throw new HttpError(400, 'Installment amount cannot be negative');
    const sum = round2(rows.reduce((total, row) => total + row.amount, 0));
    if (Math.abs(sum - netFee) > 1) {
      throw new HttpError(400, `Installments add up to ₹${sum}, but the net fee is ₹${netFee}`);
    }
    return rows;
  }
  const base = Math.floor(netFee / count);
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    title: count === 1 ? 'Full payment' : `Installment ${index + 1}`,
    amount: index === count - 1 ? round2(netFee - base * (count - 1)) : base,
    dueDate: addMonths(firstDue, index),
  }));
}

/** Validates fee inputs and returns the stored amounts, totals and installment schedule. */
export function buildFeeAmounts(input, { firstDue = new Date() } = {}) {
  const amounts = Object.fromEntries(FEE_COMPONENTS.map((key) => [key, round2(num(input[key], 0))]));
  if (Object.values(amounts).some((value) => value < 0)) throw new HttpError(400, 'Fee amounts cannot be negative');
  const totalFee = round2(Object.values(amounts).reduce((total, value) => total + value, 0));
  const discount = round2(num(input.discount, 0));
  const scholarship = round2(num(input.scholarship, 0));
  if (discount < 0 || scholarship < 0) throw new HttpError(400, 'Discount cannot be negative');
  if (discount + scholarship > totalFee) throw new HttpError(400, 'Discount and scholarship cannot exceed the total fee');
  const netFee = round2(totalFee - discount - scholarship);
  const custom = Array.isArray(input.installmentSchedule) && input.installmentSchedule.length ? input.installmentSchedule : null;
  const installments = custom ? custom.length : Math.max(1, Math.min(36, Math.round(num(input.installments, 1))));
  return {
    ...amounts,
    totalFee,
    discount,
    scholarship,
    netFee,
    installments,
    installmentSchedule: buildSchedule(custom, installments, netFee, firstDue),
  };
}

/** Live fee position: balance, what is due next, and pending / partial / paid / overdue. */
export function feeState(fee, totalPaid = fee.totalPaid, now = new Date()) {
  const net = round2(fee.netFee);
  const paid = round2(totalPaid);
  const balance = round2(Math.max(0, net - paid));
  const schedule = [...(fee.installmentSchedule || [])].sort((a, b) => a.number - b.number);

  let cumulative = 0;
  let nextDueDate = null;
  let nextDueAmount = 0;
  let overdueAmount = 0;
  const installments = schedule.map((row) => {
    const start = cumulative;
    cumulative = round2(cumulative + row.amount);
    const paidAmount = round2(Math.min(row.amount, Math.max(0, paid - start)));
    const remaining = round2(row.amount - paidAmount);
    const isOverdue = remaining > 0 && row.dueDate && endOfDay(row.dueDate) < now;
    if (isOverdue) overdueAmount = round2(overdueAmount + remaining);
    if (remaining > 0 && !nextDueDate) {
      nextDueDate = row.dueDate || null;
      nextDueAmount = remaining;
    }
    const status = remaining <= 0 ? 'paid' : isOverdue ? 'overdue' : paidAmount > 0 ? 'partial' : 'due';
    return { number: row.number, title: row.title, amount: row.amount, dueDate: row.dueDate, paidAmount, remaining, status };
  });

  if (balance > 0 && !nextDueDate && fee.nextPaymentDueDate) {
    nextDueDate = fee.nextPaymentDueDate;
    nextDueAmount = balance;
  }

  let feeStatus = 'pending';
  if (net <= 0 || balance <= 0) feeStatus = 'paid';
  else if (overdueAmount > 0 || (nextDueDate && endOfDay(nextDueDate) < now)) feeStatus = 'overdue';
  else if (paid > 0) feeStatus = 'partial';

  return { totalPaid: paid, balance, nextDueDate, nextDueAmount, overdueAmount, feeStatus, installments };
}

export function withFeeState(fee) {
  if (!fee) return null;
  const json = typeof fee.toJSON === 'function' ? fee.toJSON() : fee;
  const { installments, ...state } = feeState(json);
  return { ...json, ...state, installmentProgress: installments };
}

export async function paidTotal(feeStructureId, { excludePaymentId } = {}) {
  const match = {
    feeStructureId: new mongoose.Types.ObjectId(String(feeStructureId)),
    status: 'success',
    deletedAt: null,
  };
  if (excludePaymentId) match._id = { $ne: new mongoose.Types.ObjectId(String(excludePaymentId)) };
  const [row] = await Payment.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return round2(row?.total || 0);
}

/** Recalculates totalPaid / feeStatus / next due date from the payment ledger. */
export async function syncFeeStructure(feeStructureId) {
  if (!feeStructureId) return null;
  const fee = await FeeStructure.findById(feeStructureId);
  if (!fee) return null;
  const state = feeState(fee.toJSON(), await paidTotal(fee._id));
  fee.totalPaid = state.totalPaid;
  fee.feeStatus = state.feeStatus;
  fee.nextPaymentDueDate = state.nextDueDate;
  await fee.save();
  return fee;
}
