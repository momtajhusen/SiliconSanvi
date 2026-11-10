import { TradersProduct } from '../models/TradersProduct.js';
import { TradersPartner } from '../models/TradersPartner.js';
import { TradersJob } from '../models/TradersJob.js';
import { TradersPurchase } from '../models/TradersPurchase.js';
import { StockMove } from '../models/StockMove.js';
import { round2 } from '../utils/http.js';
import { stockState } from '../services/traders.js';
import { dayRange } from './traders.controller.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function bump(map, key, init, fn) {
  if (!map.has(key)) map.set(key, { ...init });
  fn(map.get(key));
}

function roundAll(row) {
  for (const [key, value] of Object.entries(row)) if (typeof value === 'number') row[key] = round2(value);
  return row;
}

/** Stock, sales, payment/profit and partner-wise figures for one date range (defaults to all time). */
export async function tradersReport(req, res) {
  const range = dayRange(req.query.from, req.query.to);
  const inRange = (d) => !range || ((!range.$gte || d >= range.$gte) && (!range.$lte || d <= range.$lte));

  const [products, partners, rangeJobs, payJobs, openJobs, moves, openingRows, rangePurchases, payPurchases, openPurchases] = await Promise.all([
    TradersProduct.find({ deletedAt: null }).sort({ category: 1, name: 1 }),
    TradersPartner.find({ deletedAt: null }).select('name partnerCode phone status'),
    TradersJob.find({ deletedAt: null, ...(range ? { jobDate: range } : {}) }).populate('partnerId', 'name'),
    TradersJob.find({ deletedAt: null, ...(range ? { 'payments.date': range } : { 'payments.0': { $exists: true } }) }).select('billNumber client.name partnerId payments'),
    TradersJob.find({ deletedAt: null, status: { $ne: 'cancelled' }, balance: { $gt: 0 } }).populate('partnerId', 'name').sort({ jobDate: 1 }),
    StockMove.find(range ? { date: range } : {}).select('productId type quantity unitCost purchaseId'),
    range?.$gte
      ? StockMove.aggregate([{ $match: { date: { $lt: range.$gte } } }, { $group: { _id: '$productId', quantity: { $sum: '$quantity' } } }])
      : [],
    TradersPurchase.find({ deletedAt: null, ...(range ? { purchaseDate: range } : {}) }).populate('supplierId', 'name supplierCode phone').sort({ purchaseDate: -1 }),
    TradersPurchase.find({ deletedAt: null, ...(range ? { 'payments.date': range } : { 'payments.0': { $exists: true } }) }).select('payments'),
    TradersPurchase.find({ deletedAt: null, balance: { $gt: 0 } }).populate('supplierId', 'name supplierCode phone').sort({ purchaseDate: 1 }),
  ]);
  const jobs = rangeJobs.filter((job) => job.status !== 'cancelled');

  /* Summary & profit */
  const sum = (key) => round2(jobs.reduce((t, job) => t + (job[key] || 0), 0));
  const payments = [];
  for (const job of payJobs) {
    for (const p of job.payments) {
      if (inRange(p.date)) payments.push({ date: p.date, amount: p.amount, mode: p.mode, reference: p.reference, billNumber: job.billNumber, jobId: job.id, client: job.client?.name, partnerId: job.partnerId ? String(job.partnerId) : null });
    }
  }
  payments.sort((a, b) => b.date - a.date);
  const revenue = round2(jobs.reduce((t, job) => t + job.total - job.taxAmount, 0));
  const summary = {
    bills: jobs.length,
    cancelled: rangeJobs.length - jobs.length,
    billed: sum('total'),
    revenue,
    tax: sum('taxAmount'),
    partsSales: sum('itemsTotal'),
    labour: sum('labourCharge'),
    discount: sum('discount'),
    partsCost: sum('itemsCost'),
    profit: sum('profit'),
    margin: revenue ? round2((sum('profit') / revenue) * 100) : 0,
    collectedOnBills: sum('paid'),
    dueOnBills: sum('balance'),
    collected: round2(payments.reduce((t, p) => t + p.amount, 0)),
    outstanding: round2(openJobs.reduce((t, job) => t + job.balance, 0)),
  };

  /* Sales: by month, product, category */
  const byMonth = new Map();
  const byProduct = new Map();
  const byCategory = new Map();
  const productMeta = new Map(products.map((p) => [p.id, p]));
  for (const job of jobs) {
    bump(byMonth, monthKey(job.jobDate), { month: monthKey(job.jobDate), bills: 0, billed: 0, profit: 0, collected: 0 }, (row) => {
      row.bills += 1;
      row.billed += job.total;
      row.profit += job.profit;
    });
    for (const item of job.items) {
      const meta = item.productId ? productMeta.get(String(item.productId)) : null;
      const key = item.productId ? String(item.productId) : `custom:${item.name.toLowerCase()}`;
      const category = meta?.category || 'other';
      const sales = item.quantity * item.unitPrice;
      const cost = item.quantity * (item.unitCost || 0);
      bump(byProduct, key, { productId: item.productId || null, name: item.name, sku: item.sku, category, unit: item.unit, quantity: 0, sales: 0, cost: 0, profit: 0, bills: 0 }, (row) => {
        row.quantity += item.quantity;
        row.sales += sales;
        row.cost += cost;
        row.profit += sales - cost;
        row.bills += 1;
      });
      bump(byCategory, category, { category, quantity: 0, sales: 0, cost: 0, profit: 0 }, (row) => {
        row.quantity += item.quantity;
        row.sales += sales;
        row.cost += cost;
        row.profit += sales - cost;
      });
    }
  }
  for (const p of payments) {
    bump(byMonth, monthKey(p.date), { month: monthKey(p.date), bills: 0, billed: 0, profit: 0, collected: 0 }, (row) => { row.collected += p.amount; });
  }

  /* Payments by mode & dues ageing */
  const byMode = {};
  for (const p of payments) byMode[p.mode] = round2((byMode[p.mode] || 0) + p.amount);
  const now = Date.now();
  const dues = openJobs.map((job) => ({
    id: job.id,
    billNumber: job.billNumber,
    jobDate: job.jobDate,
    client: job.client,
    partnerId: job.partnerId?._id || null,
    total: job.total,
    paid: job.paid,
    balance: job.balance,
    days: Math.max(0, Math.floor((now - job.jobDate.getTime()) / DAY_MS)),
  }));
  const ageing = [
    { label: '0–30 days', min: 0, max: 30 },
    { label: '31–60 days', min: 31, max: 60 },
    { label: '61–90 days', min: 61, max: 90 },
    { label: '90+ days', min: 91, max: Infinity },
  ].map((bucket) => {
    const rows = dues.filter((d) => d.days >= bucket.min && d.days <= bucket.max);
    return { label: bucket.label, bills: rows.length, amount: round2(rows.reduce((t, d) => t + d.balance, 0)) };
  });

  /* Partner-wise */
  const partnerRows = new Map(partners.map((p) => [p.id, {
    partnerId: p.id, name: p.name, partnerCode: p.partnerCode, phone: p.phone, status: p.status,
    bills: 0, installed: 0, scheduled: 0, parts: 0, billed: 0, paid: 0, balance: 0, profit: 0, collected: 0,
  }]));
  const partnerOf = (id) => (id && partnerRows.get(String(id))) || null;
  for (const job of jobs) {
    const row = partnerOf(job.partnerId?._id || job.partnerId);
    if (!row) continue;
    row.bills += 1;
    if (job.status === 'installed') row.installed += 1;
    if (job.status === 'scheduled') row.scheduled += 1;
    row.parts += job.items.reduce((t, item) => t + item.quantity, 0);
    row.billed += job.total;
    row.paid += job.paid;
    row.balance += job.balance;
    row.profit += job.profit;
  }
  for (const p of payments) {
    const row = partnerOf(p.partnerId);
    if (row) row.collected += p.amount;
  }

  /* Purchases */
  const purchases = rangePurchases;
  const supplierPayments = [];
  for (const purchase of payPurchases) for (const p of purchase.payments) if (inRange(p.date)) supplierPayments.push(p);
  const psum = (key) => round2(purchases.reduce((t, p) => t + (p[key] || 0), 0));
  const purchaseSummary = {
    bills: purchases.length,
    total: psum('total'),
    itemsTotal: psum('itemsTotal'),
    freight: psum('freight'),
    tax: psum('taxAmount'),
    discount: psum('discount'),
    units: round2(purchases.reduce((t, p) => t + p.items.reduce((u, i) => u + i.quantity, 0), 0)),
    paidOnBills: psum('paid'),
    dueOnBills: psum('balance'),
    paidInPeriod: round2(supplierPayments.reduce((t, p) => t + p.amount, 0)),
    owed: round2(openPurchases.reduce((t, p) => t + p.balance, 0)),
  };
  summary.purchased = purchaseSummary.total;
  summary.supplierPaid = purchaseSummary.paidInPeriod;
  summary.supplierDue = purchaseSummary.owed;
  const purchaseByMonth = new Map();
  const bySupplier = new Map();
  const purchaseByProduct = new Map();
  for (const purchase of purchases) {
    bump(purchaseByMonth, monthKey(purchase.purchaseDate), { month: monthKey(purchase.purchaseDate), bills: 0, total: 0 }, (row) => {
      row.bills += 1;
      row.total += purchase.total;
    });
    const supplier = purchase.supplierId;
    bump(bySupplier, String(supplier?._id || 'none'), { supplierId: supplier?.id || null, name: supplier?.name || 'Unknown', supplierCode: supplier?.supplierCode, phone: supplier?.phone, bills: 0, units: 0, total: 0, paid: 0, balance: 0 }, (row) => {
      row.bills += 1;
      row.units += purchase.items.reduce((t, i) => t + i.quantity, 0);
      row.total += purchase.total;
      row.paid += purchase.paid;
      row.balance += purchase.balance;
    });
    for (const item of purchase.items) {
      bump(purchaseByProduct, String(item.productId), { productId: String(item.productId), name: item.name, sku: item.sku, unit: item.unit, quantity: 0, value: 0, minCost: item.unitCost, maxCost: item.unitCost, bills: 0 }, (row) => {
        row.quantity += item.quantity;
        row.value += item.quantity * item.unitCost;
        row.minCost = Math.min(row.minCost, item.unitCost);
        row.maxCost = Math.max(row.maxCost, item.unitCost);
        row.bills += 1;
      });
    }
  }
  const purchaseBills = purchases.map((p) => ({
    id: p.id, purchaseNumber: p.purchaseNumber, supplierInvoice: p.supplierInvoice, purchaseDate: p.purchaseDate, supplier: p.supplierId?.name,
    items: p.items.length, units: round2(p.items.reduce((t, i) => t + i.quantity, 0)), itemsTotal: p.itemsTotal, freight: p.freight, taxAmount: p.taxAmount,
    discount: p.discount, total: p.total, paid: p.paid, balance: p.balance,
  }));
  const supplierDues = openPurchases.map((p) => ({
    id: p.id, purchaseNumber: p.purchaseNumber, supplierInvoice: p.supplierInvoice, purchaseDate: p.purchaseDate, supplier: p.supplierId?.name,
    supplierId: p.supplierId?.id, total: p.total, paid: p.paid, balance: p.balance,
    days: Math.max(0, Math.floor((now - p.purchaseDate.getTime()) / DAY_MS)),
  }));

  /* Stock register: opening + bought + added − sold ± corrections = closing, per product */
  const opening = new Map(openingRows.map((row) => [String(row._id), row.quantity]));
  const flow = new Map();
  for (const m of moves) {
    bump(flow, String(m.productId), { added: 0, purchased: 0, purchaseValue: 0, sold: 0, adjusted: 0 }, (row) => {
      if (m.type === 'opening') row.added += m.quantity;
      else if (m.type === 'purchase' || m.type === 'purchase_return') {
        row.purchased += m.quantity;
        if (!m.purchaseId) row.purchaseValue += m.quantity * (m.unitCost || 0);
      } else if (m.type === 'job' || m.type === 'job_return') row.sold -= m.quantity;
      else row.adjusted += m.quantity;
    });
  }
  const stockRows = products.map((p) => {
    const f = { ...(flow.get(p.id) || { added: 0, purchased: 0, purchaseValue: 0, sold: 0, adjusted: 0 }) };
    f.purchaseValue += purchaseByProduct.get(p.id)?.value || 0;
    const sale = byProduct.get(p.id);
    const openingQty = opening.get(p.id) || 0;
    const closing = openingQty + f.added + f.purchased - f.sold + f.adjusted;
    return roundAll({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      brand: p.brand,
      unit: p.unit,
      status: p.status,
      stock: p.stock,
      reorderLevel: p.reorderLevel,
      stockState: stockState(p),
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      costValue: Math.max(0, p.stock) * p.costPrice,
      saleValue: Math.max(0, p.stock) * p.sellingPrice,
      opening: openingQty,
      added: f.added,
      purchased: f.purchased,
      purchaseValue: f.purchaseValue,
      sold: f.sold,
      adjusted: f.adjusted,
      closing,
      closingValue: Math.max(0, closing) * p.costPrice,
      sales: sale?.sales || 0,
      soldCost: sale?.cost || 0,
      profit: sale?.profit || 0,
      inQty: f.added + f.purchased,
      outQty: f.sold,
    });
  });
  const stockByCategory = new Map();
  for (const row of stockRows) {
    bump(stockByCategory, row.category, { category: row.category, products: 0, units: 0, costValue: 0, saleValue: 0, low: 0, out: 0 }, (c) => {
      c.products += 1;
      c.units += Math.max(0, row.stock);
      c.costValue += row.costValue;
      c.saleValue += row.saleValue;
      if (row.stockState === 'low') c.low += 1;
      if (row.stockState === 'out') c.out += 1;
    });
  }

  res.json({
    range: { from: req.query.from || null, to: req.query.to || null },
    summary,
    sales: {
      byMonth: [...byMonth.values()].map(roundAll).sort((a, b) => a.month.localeCompare(b.month)),
      byProduct: [...byProduct.values()].map(roundAll).sort((a, b) => b.sales - a.sales),
      byCategory: [...byCategory.values()].map(roundAll).sort((a, b) => b.sales - a.sales),
      bills: jobs.map((job) => ({
        id: job.id, billNumber: job.billNumber, jobDate: job.jobDate, status: job.status, client: job.client?.name,
        partnerId: job.partnerId?._id || null, total: job.total, paid: job.paid, balance: job.balance, profit: job.profit,
        itemsCost: job.itemsCost, taxAmount: job.taxAmount,
      })),
    },
    payments: { list: payments, byMode, dues, ageing },
    partners: [...partnerRows.values()].map(roundAll).sort((a, b) => b.billed - a.billed),
    stock: {
      rows: stockRows,
      byCategory: [...stockByCategory.values()].map(roundAll),
      totals: roundAll({
        products: stockRows.length,
        units: stockRows.reduce((t, r) => t + Math.max(0, r.stock), 0),
        costValue: stockRows.reduce((t, r) => t + r.costValue, 0),
        saleValue: stockRows.reduce((t, r) => t + r.saleValue, 0),
        low: stockRows.filter((r) => r.stockState === 'low').length,
        out: stockRows.filter((r) => r.stockState === 'out').length,
        inQty: stockRows.reduce((t, r) => t + r.inQty, 0),
        outQty: stockRows.reduce((t, r) => t + r.outQty, 0),
        opening: stockRows.reduce((t, r) => t + r.opening, 0),
        purchased: stockRows.reduce((t, r) => t + r.purchased, 0),
        purchaseValue: stockRows.reduce((t, r) => t + r.purchaseValue, 0),
        added: stockRows.reduce((t, r) => t + r.added, 0),
        sold: stockRows.reduce((t, r) => t + r.sold, 0),
        adjusted: stockRows.reduce((t, r) => t + r.adjusted, 0),
        closing: stockRows.reduce((t, r) => t + r.closing, 0),
        closingValue: stockRows.reduce((t, r) => t + r.closingValue, 0),
        sales: stockRows.reduce((t, r) => t + r.sales, 0),
        soldCost: stockRows.reduce((t, r) => t + r.soldCost, 0),
        profit: stockRows.reduce((t, r) => t + r.profit, 0),
      }),
    },
    purchases: {
      summary: purchaseSummary,
      byMonth: [...purchaseByMonth.values()].map(roundAll).sort((a, b) => a.month.localeCompare(b.month)),
      bySupplier: [...bySupplier.values()].map(roundAll).sort((a, b) => b.total - a.total),
      byProduct: [...purchaseByProduct.values()].map((row) => roundAll({ ...row, avgCost: row.quantity ? row.value / row.quantity : 0 })).sort((a, b) => b.value - a.value),
      bills: purchaseBills,
      dues: supplierDues,
    },
  });
}
