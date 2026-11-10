import { TradersProduct } from '../models/TradersProduct.js';
import { StockMove } from '../models/StockMove.js';
import { HttpError, round2 } from '../utils/http.js';

/** Recomputes the stored bill totals, payment state and profit of a job document in place. */
export function computeJobTotals(job) {
  const itemsTotal = round2(job.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const itemsCost = round2(job.items.reduce((sum, item) => sum + item.quantity * (item.unitCost || 0), 0));
  const taxable = Math.max(0, round2(itemsTotal + (job.labourCharge || 0) - (job.discount || 0)));
  const taxAmount = round2((taxable * (job.taxRate || 0)) / 100);
  const total = job.status === 'cancelled' ? 0 : round2(taxable + taxAmount);
  const paid = round2(job.payments.reduce((sum, payment) => sum + payment.amount, 0));
  job.itemsTotal = itemsTotal;
  job.itemsCost = itemsCost;
  job.taxAmount = job.status === 'cancelled' ? 0 : taxAmount;
  job.total = total;
  job.paid = paid;
  job.balance = round2(Math.max(0, total - paid));
  job.paymentStatus = paid <= 0 ? 'unpaid' : paid + 0.01 >= total ? 'paid' : 'partial';
  job.profit = job.status === 'cancelled' ? 0 : round2(taxable - itemsCost);
  return job;
}

/** Stock a job holds per product (none once cancelled). */
export function consumption(job) {
  const map = new Map();
  if (!job || job.status === 'cancelled') return map;
  for (const item of job.items) {
    if (!item.productId) continue;
    const key = String(item.productId);
    map.set(key, round2((map.get(key) || 0) + item.quantity));
  }
  return map;
}

/**
 * Moves stock from the `before` holding to the `after` holding of a job.
 * Deductions are checked against available stock and rolled back if any product runs short.
 */
export async function reconcileStock(before, after, { jobId, billNumber, userId, date }) {
  const deltas = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const delta = round2((after.get(key) || 0) - (before.get(key) || 0));
    if (delta) deltas.push([key, delta]);
  }
  const applied = [];
  try {
    for (const [productId, delta] of deltas.filter(([, d]) => d > 0)) {
      const product = await TradersProduct.findOneAndUpdate(
        { _id: productId, deletedAt: null, stock: { $gte: delta } },
        { $inc: { stock: -delta } },
        { returnDocument: 'after' }
      );
      if (!product) {
        const current = await TradersProduct.findById(productId).select('name stock unit');
        throw new HttpError(409, current
          ? `Only ${current.stock} ${current.unit || 'pcs'} of ${current.name} in stock`
          : 'A product on this bill no longer exists');
      }
      applied.push([productId, delta, product]);
    }
  } catch (err) {
    for (const [productId, delta] of applied) await TradersProduct.updateOne({ _id: productId }, { $inc: { stock: delta } });
    throw err;
  }
  const returns = [];
  for (const [productId, delta] of deltas.filter(([, d]) => d < 0)) {
    const product = await TradersProduct.findOneAndUpdate({ _id: productId }, { $inc: { stock: -delta } }, { returnDocument: 'after' });
    if (product) returns.push([productId, delta, product]);
  }
  const now = date || new Date();
  const moves = [...applied, ...returns].map(([productId, delta, product]) => ({
    productId,
    type: delta > 0 ? 'job' : 'job_return',
    quantity: -delta,
    balanceAfter: product.stock,
    unitCost: product.costPrice,
    jobId,
    note: `${delta > 0 ? 'Installed on' : 'Returned from'} bill ${billNumber}`,
    date: now,
    createdBy: userId,
  }));
  if (moves.length) await StockMove.insertMany(moves);
}

/** Recomputes a purchase bill's totals and what is still owed to the supplier. */
export function computePurchaseTotals(purchase) {
  purchase.itemsTotal = round2(purchase.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0));
  purchase.total = Math.max(0, round2(purchase.itemsTotal + (purchase.freight || 0) + (purchase.taxAmount || 0) - (purchase.discount || 0)));
  purchase.paid = round2(purchase.payments.reduce((sum, payment) => sum + payment.amount, 0));
  purchase.balance = round2(Math.max(0, purchase.total - purchase.paid));
  purchase.paymentStatus = purchase.paid <= 0 ? 'unpaid' : purchase.paid + 0.01 >= purchase.total ? 'paid' : 'partial';
  return purchase;
}

/** Quantity and buying value a purchase bill holds per product. */
export function purchaseHolding(purchase) {
  const map = new Map();
  for (const item of purchase?.items || []) {
    const key = String(item.productId);
    const row = map.get(key) || { quantity: 0, value: 0 };
    row.quantity = round2(row.quantity + item.quantity);
    row.value = round2(row.value + item.quantity * item.unitCost);
    map.set(key, row);
  }
  return map;
}

/** Weighted-average cost after `quantity` units worth `value` are added (or removed, when negative). */
export function averageCost(stock, cost, quantity, value) {
  const remaining = round2(stock + quantity);
  if (remaining <= 0) return cost;
  return round2(Math.max(0, (Math.max(0, stock) * cost + value) / remaining));
}

/**
 * Moves stock from the `before` holding to the `after` holding of a purchase bill and keeps each
 * product's cost price as a weighted average. Removing stock that was already sold is refused.
 */
export async function reconcilePurchase(before, after, { purchaseId, label, userId, date }) {
  const deltas = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    const b = before.get(key) || { quantity: 0, value: 0 };
    const a = after.get(key) || { quantity: 0, value: 0 };
    const quantity = round2(a.quantity - b.quantity);
    const value = round2(a.value - b.value);
    if (quantity || value) deltas.push({ productId: key, quantity, value });
  }
  const applied = [];
  try {
    for (const delta of deltas) {
      const guard = delta.quantity < 0 ? { stock: { $gte: -delta.quantity } } : {};
      const old = await TradersProduct.findOneAndUpdate({ _id: delta.productId, ...guard }, { $inc: { stock: delta.quantity } }, { returnDocument: 'before' });
      if (!old) {
        const current = await TradersProduct.findById(delta.productId).select('name stock unit');
        throw new HttpError(409, current
          ? `Only ${current.stock} ${current.unit || 'pcs'} of ${current.name} left in stock — the rest is already sold, so this purchase cannot be reduced by ${-delta.quantity}`
          : 'A product on this purchase no longer exists');
      }
      const costPrice = averageCost(old.stock, old.costPrice, delta.quantity, delta.value);
      if (costPrice !== old.costPrice) await TradersProduct.updateOne({ _id: old._id }, { $set: { costPrice } });
      applied.push({ ...delta, old, stock: round2(old.stock + delta.quantity), costPrice });
    }
  } catch (err) {
    for (const row of applied) await TradersProduct.updateOne({ _id: row.old._id }, { $inc: { stock: -row.quantity }, $set: { costPrice: row.old.costPrice } });
    throw err;
  }
  const moves = applied.filter((row) => row.quantity).map((row) => ({
    productId: row.productId,
    type: row.quantity > 0 ? 'purchase' : 'purchase_return',
    quantity: row.quantity,
    balanceAfter: row.stock,
    unitCost: round2(Math.abs(row.value / row.quantity)),
    purchaseId,
    note: `${row.quantity > 0 ? 'Received on' : 'Removed from'} purchase ${label}`,
    date: date || new Date(),
    createdBy: userId,
  }));
  if (moves.length) await StockMove.insertMany(moves);
}

export function stockState(product) {
  if (product.stock <= 0) return 'out';
  if (product.stock <= (product.reorderLevel || 0)) return 'low';
  return 'ok';
}
