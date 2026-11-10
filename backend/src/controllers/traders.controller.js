import { TradersProduct } from '../models/TradersProduct.js';
import { TradersPartner } from '../models/TradersPartner.js';
import { TradersJob } from '../models/TradersJob.js';
import { TradersPurchase } from '../models/TradersPurchase.js';
import { StockMove } from '../models/StockMove.js';
import { nextCode } from '../models/Counter.js';
import { ENTITY_STATUS, JOB_STATUS, PAYMENT_MODE, PRODUCT_CATEGORY } from '../constants/enums.js';
import { HttpError, assertId, bool, date, escapeRegex, num, requireFields, round2, str } from '../utils/http.js';
import { averageCost, computeJobTotals, consumption, reconcileStock, stockState } from '../services/traders.js';
import { removeUpload } from '../middleware/upload.js';

const PHONE_RX = /^[0-9+\s()-]{7,20}$/;

export function money(value, label) {
  const n = round2(num(value));
  if (n < 0) throw new HttpError(400, `${label} cannot be negative`);
  return n;
}

function image(value, folder) {
  const url = str(value) || '';
  if (url && !url.startsWith(`/uploads/${folder}/`)) throw new HttpError(400, 'Invalid image');
  return url;
}

export function dayRange(from, to) {
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

/* ───────────── Products ───────────── */

function productFields(body) {
  const out = {};
  for (const key of ['name', 'brand', 'model', 'description', 'unit', 'warranty']) if (body[key] !== undefined) out[key] = str(body[key]) || '';
  if (body.sku !== undefined) out.sku = str(body.sku);
  if (body.image !== undefined) out.image = image(body.image, 'products');
  if (body.category !== undefined) {
    if (!PRODUCT_CATEGORY.includes(body.category)) throw new HttpError(400, 'Invalid category');
    out.category = body.category;
  }
  if (body.status !== undefined) {
    if (!ENTITY_STATUS.includes(body.status)) throw new HttpError(400, 'Invalid status');
    out.status = body.status;
  }
  if (body.costPrice !== undefined) out.costPrice = money(body.costPrice, 'Cost price');
  if (body.sellingPrice !== undefined) out.sellingPrice = money(body.sellingPrice, 'Selling price');
  if (body.mrp !== undefined) out.mrp = body.mrp === '' || body.mrp === null ? undefined : money(body.mrp, 'MRP');
  if (body.reorderLevel !== undefined) out.reorderLevel = Math.max(0, Math.round(num(body.reorderLevel, 0)));
  if (body.sortOrder !== undefined) out.sortOrder = Math.round(num(body.sortOrder, 0));
  for (const key of ['showOnWebsite', 'showPrice', 'featured']) {
    if (body[key] !== undefined) out[key] = Boolean(bool(body[key]));
  }
  if (out.name === '') throw new HttpError(400, 'Product name is required');
  return out;
}

const withStock = (product) => ({
  ...product.toJSON(),
  stockState: stockState(product),
  stockValue: round2(product.stock * product.costPrice),
});

export async function listProducts(req, res) {
  const filter = { deletedAt: null };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }, { model: rx }];
  }
  let items = (await TradersProduct.find(filter).sort({ sortOrder: 1, name: 1 })).map(withStock);
  if (req.query.stock) items = items.filter((p) => (req.query.stock === 'low' ? p.stockState !== 'ok' : p.stockState === req.query.stock));
  const all = await TradersProduct.find({ deletedAt: null }).select('stock costPrice sellingPrice reorderLevel');
  res.json({
    items,
    summary: {
      products: all.length,
      units: round2(all.reduce((t, p) => t + Math.max(0, p.stock), 0)),
      costValue: round2(all.reduce((t, p) => t + Math.max(0, p.stock) * p.costPrice, 0)),
      saleValue: round2(all.reduce((t, p) => t + Math.max(0, p.stock) * p.sellingPrice, 0)),
      low: all.filter((p) => stockState(p) === 'low').length,
      out: all.filter((p) => stockState(p) === 'out').length,
    },
  });
}

export async function getProduct(req, res) {
  const product = await TradersProduct.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!product) throw new HttpError(404, 'Product not found');
  const moves = await StockMove.find({ productId: product._id })
    .populate('jobId', 'billNumber client.name')
    .populate('purchaseId', 'purchaseNumber supplierInvoice')
    .populate('createdBy', 'name')
    .sort({ date: -1, createdAt: -1 })
    .limit(100);
  res.json({ product: withStock(product), moves });
}

export async function createProduct(req, res) {
  requireFields(req.body, ['name']);
  const fields = productFields(req.body);
  if (!fields.sku) fields.sku = await nextCode('PRD', 4);
  const opening = Math.max(0, round2(num(req.body.stock, 0)));
  const product = await TradersProduct.create({ ...fields, stock: opening });
  if (opening > 0) {
    await StockMove.create({
      productId: product._id, type: 'opening', quantity: opening, balanceAfter: opening,
      unitCost: product.costPrice, note: 'Opening stock', date: new Date(), createdBy: req.auth.sub,
    });
  }
  res.status(201).json({ product: withStock(product) });
}

export async function updateProduct(req, res) {
  const product = await TradersProduct.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!product) throw new HttpError(404, 'Product not found');
  const fields = productFields(req.body);
  if (fields.sku === undefined) delete fields.sku;
  const oldImage = product.image;
  Object.assign(product, fields);
  await product.save();
  if (oldImage && oldImage !== product.image) removeUpload(oldImage);
  res.json({ product: withStock(product) });
}

export async function deleteProduct(req, res) {
  const product = await TradersProduct.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!product) throw new HttpError(404, 'Product not found');
  product.deletedAt = new Date();
  product.sku = `${product.sku}-DEL-${Date.now()}`;
  await product.save();
  res.json({ ok: true });
}

/** Stock in (purchase) or a ± correction after counting. */
export async function addStock(req, res) {
  const type = req.body.type === 'adjustment' ? 'adjustment' : 'purchase';
  const quantity = round2(num(req.body.quantity));
  if (!quantity || (type === 'purchase' && quantity < 0)) throw new HttpError(400, 'Enter a valid quantity');
  const unitCost = req.body.unitCost === undefined || req.body.unitCost === '' ? undefined : money(req.body.unitCost, 'Unit cost');
  const guard = quantity < 0 ? { stock: { $gte: -quantity } } : {};
  const product = await TradersProduct.findOneAndUpdate(
    { _id: assertId(req.params.id), deletedAt: null, ...guard },
    { $inc: { stock: quantity } },
    { returnDocument: 'after' }
  );
  if (!product) {
    if (await TradersProduct.exists({ _id: req.params.id, deletedAt: null })) throw new HttpError(409, 'Stock cannot go below zero');
    throw new HttpError(404, 'Product not found');
  }
  if (type === 'purchase' && unitCost !== undefined) {
    product.costPrice = averageCost(product.stock - quantity, product.costPrice, quantity, quantity * unitCost);
    await TradersProduct.updateOne({ _id: product._id }, { $set: { costPrice: product.costPrice } });
  }
  const move = await StockMove.create({
    productId: product._id, type, quantity, balanceAfter: product.stock,
    unitCost: unitCost ?? product.costPrice, note: str(req.body.note),
    date: date(req.body.date) || new Date(), createdBy: req.auth.sub,
  });
  res.status(201).json({ product: withStock(product), move });
}

export async function listStockMoves(req, res) {
  const filter = {};
  const range = dayRange(req.query.from, req.query.to);
  if (range) filter.date = range;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.productId) filter.productId = assertId(req.query.productId, 'product');
  const items = await StockMove.find(filter)
    .populate('productId', 'name sku unit')
    .populate('jobId', 'billNumber client.name')
    .populate('purchaseId', 'purchaseNumber supplierInvoice')
    .populate('createdBy', 'name')
    .sort({ date: -1, createdAt: -1 })
    .limit(500);
  res.json({ items });
}

/* ───────────── Partners ───────────── */

function partnerFields(body) {
  const out = {};
  for (const key of ['name', 'phone', 'email', 'address', 'gstin', 'notes']) if (body[key] !== undefined) out[key] = str(body[key]) || '';
  if (body.status !== undefined) {
    if (!ENTITY_STATUS.includes(body.status)) throw new HttpError(400, 'Invalid status');
    out.status = body.status;
  }
  if (out.name === '') throw new HttpError(400, 'Partner name is required');
  if (out.phone !== undefined && !PHONE_RX.test(out.phone)) throw new HttpError(400, 'Enter a valid phone number');
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw new HttpError(400, 'Enter a valid email');
  return out;
}

async function partnerStats(match = {}) {
  const rows = await TradersJob.aggregate([
    { $match: { deletedAt: null, status: { $ne: 'cancelled' }, partnerId: { $ne: null }, ...match } },
    {
      $group: {
        _id: '$partnerId',
        jobs: { $sum: 1 },
        billed: { $sum: '$total' },
        paid: { $sum: '$paid' },
        balance: { $sum: '$balance' },
        profit: { $sum: '$profit' },
        lastJob: { $max: '$jobDate' },
      },
    },
  ]);
  return new Map(rows.map((row) => [String(row._id), row]));
}

const EMPTY_STATS = { jobs: 0, billed: 0, paid: 0, balance: 0, profit: 0, lastJob: null };

export async function listPartners(req, res) {
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { partnerCode: rx }, { address: rx }];
  }
  const [partners, stats] = await Promise.all([TradersPartner.find(filter).sort({ name: 1 }), partnerStats()]);
  res.json({
    items: partners.map((p) => {
      const s = stats.get(p.id) || EMPTY_STATS;
      return { ...p.toJSON(), stats: { ...EMPTY_STATS, ...s, _id: undefined } };
    }),
  });
}

export async function getPartner(req, res) {
  const partner = await TradersPartner.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!partner) throw new HttpError(404, 'Partner not found');
  const [jobs, stats] = await Promise.all([
    TradersJob.find({ partnerId: partner._id, deletedAt: null }).sort({ jobDate: -1 }).limit(500),
    partnerStats({ partnerId: partner._id }),
  ]);
  res.json({ partner, jobs, stats: { ...EMPTY_STATS, ...(stats.get(partner.id) || {}), _id: undefined } });
}

export async function createPartner(req, res) {
  requireFields(req.body, ['name', 'phone']);
  const partner = await TradersPartner.create({ ...partnerFields(req.body), partnerCode: await nextCode('PTR', 3) });
  res.status(201).json({ partner });
}

export async function updatePartner(req, res) {
  const partner = await TradersPartner.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!partner) throw new HttpError(404, 'Partner not found');
  Object.assign(partner, partnerFields(req.body));
  await partner.save();
  await TradersJob.updateMany(
    { partnerId: partner._id, deletedAt: null },
    { $set: { client: { name: partner.name, phone: partner.phone, email: partner.email, address: partner.address, gstin: partner.gstin } } }
  );
  res.json({ partner });
}

export async function deletePartner(req, res) {
  const partner = await TradersPartner.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!partner) throw new HttpError(404, 'Partner not found');
  const open = await TradersJob.countDocuments({ partnerId: partner._id, deletedAt: null, status: { $ne: 'cancelled' }, balance: { $gt: 0 } });
  if (open) throw new HttpError(409, `${open} bill(s) of this partner still have money due. Mark the partner inactive instead.`);
  partner.deletedAt = new Date();
  await partner.save();
  res.json({ ok: true });
}

/* ───────────── Installation jobs & bills ───────────── */

const JOB_POPULATE = [
  { path: 'partnerId', select: 'name phone email address gstin partnerCode' },
  { path: 'payments.receivedBy', select: 'name' },
  { path: 'createdBy', select: 'name' },
];

export function paymentFields(body) {
  const amount = round2(num(body.amount));
  if (amount <= 0) throw new HttpError(400, 'Amount must be more than 0');
  const mode = body.mode || 'cash';
  if (!PAYMENT_MODE.includes(mode)) throw new HttpError(400, 'Invalid payment mode');
  return { amount, mode, date: date(body.date) || new Date(), reference: str(body.reference), note: str(body.note) };
}

async function jobItems(rawItems, previous = []) {
  if (!Array.isArray(rawItems)) throw new HttpError(400, 'Items must be a list');
  const ids = rawItems.map((item) => item.productId).filter(Boolean).map((id) => assertId(id, 'product'));
  const products = new Map((await TradersProduct.find({ _id: { $in: ids } })).map((p) => [p.id, p]));
  const oldCost = new Map(previous.filter((item) => item.productId).map((item) => [String(item.productId), item.unitCost]));
  return rawItems.map((raw) => {
    const product = raw.productId ? products.get(String(raw.productId)) : null;
    if (raw.productId && !product) throw new HttpError(400, 'A selected product no longer exists');
    const quantity = round2(num(raw.quantity));
    if (quantity <= 0) throw new HttpError(400, 'Each item needs a quantity');
    const name = str(raw.name) || product?.name;
    if (!name) throw new HttpError(400, 'Each item needs a name');
    return {
      productId: product?._id,
      name,
      sku: product?.sku || str(raw.sku),
      unit: product?.unit || str(raw.unit) || 'pcs',
      quantity,
      unitPrice: money(raw.unitPrice ?? product?.sellingPrice ?? 0, 'Price'),
      unitCost: raw.unitCost !== undefined && raw.unitCost !== ''
        ? money(raw.unitCost, 'Cost')
        : oldCost.get(String(product?._id)) ?? product?.costPrice ?? 0,
    };
  });
}

async function jobFields(body, existing) {
  const out = {};
  if (body.jobDate !== undefined) out.jobDate = date(body.jobDate) || new Date();
  if (body.status !== undefined) {
    if (!JOB_STATUS.includes(body.status)) throw new HttpError(400, 'Invalid status');
    out.status = body.status;
  }
  if (body.partnerId !== undefined) {
    if (!body.partnerId) throw new HttpError(400, 'Choose the partner this bill is for');
    const partner = await TradersPartner.findOne({ _id: assertId(body.partnerId, 'partner'), deletedAt: null });
    if (!partner) throw new HttpError(400, 'Partner not found');
    out.partnerId = partner._id;
    out.client = { name: partner.name, phone: partner.phone, email: partner.email, address: partner.address, gstin: partner.gstin };
  }
  if (body.items !== undefined) out.items = await jobItems(body.items, existing?.items);
  for (const [key, label] of [['labourCharge', 'Installation charge'], ['discount', 'Discount']]) {
    if (body[key] !== undefined) out[key] = money(body[key], label);
  }
  if (body.taxRate !== undefined) {
    out.taxRate = money(body.taxRate, 'GST rate');
    if (out.taxRate > 28) throw new HttpError(400, 'GST rate cannot be more than 28%');
  }
  if (body.notes !== undefined) out.notes = str(body.notes) || '';
  return out;
}

function assertPayable(job) {
  if (job.status === 'cancelled' && job.paid > 0) throw new HttpError(400, 'Remove (refund) the payments on this bill before cancelling it');
  if (job.paid > job.total + 0.01) {
    throw new HttpError(400, job.total <= 0 ? 'This bill has no amount due' : `Payments (₹${job.paid}) are more than the bill (₹${job.total})`);
  }
}

/** Early, friendly check so a short bill does not use up a bill number; `reconcileStock` still guards atomically. */
async function assertInStock(needed) {
  if (!needed.size) return;
  const products = await TradersProduct.find({ _id: { $in: [...needed.keys()] }, deletedAt: null }).select('name stock unit');
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const [id, qty] of needed) {
    const p = byId.get(id);
    if (!p) throw new HttpError(400, 'A product on this bill no longer exists');
    if (p.stock < qty) throw new HttpError(409, `Only ${p.stock} ${p.unit || 'pcs'} of ${p.name} in stock`);
  }
}

export async function listJobs(req, res) {
  const filter = { deletedAt: null };
  const range = dayRange(req.query.from, req.query.to);
  if (range) filter.jobDate = range;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.partnerId) filter.partnerId = assertId(req.query.partnerId, 'partner');
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ billNumber: rx }, { 'client.name': rx }, { 'client.phone': rx }, { 'items.name': rx }];
  }
  const items = await TradersJob.find(filter).populate(JOB_POPULATE).sort({ jobDate: -1, createdAt: -1 }).limit(1000);
  const live = items.filter((job) => job.status !== 'cancelled');
  const sum = (key) => round2(live.reduce((t, job) => t + (job[key] || 0), 0));
  res.json({
    items,
    summary: { count: live.length, billed: sum('total'), paid: sum('paid'), balance: sum('balance'), profit: sum('profit') },
  });
}

export async function getJob(req, res) {
  const job = await TradersJob.findOne({ _id: assertId(req.params.id), deletedAt: null }).populate(JOB_POPULATE);
  if (!job) throw new HttpError(404, 'Bill not found');
  res.json({ job });
}

export async function createJob(req, res) {
  requireFields(req.body, ['partnerId']);
  const fields = await jobFields({ jobDate: new Date(), ...req.body });
  if (!fields.items?.length && !fields.labourCharge) throw new HttpError(400, 'Add at least one part or an installation charge');
  const job = new TradersJob({ ...fields, billNumber: 'PENDING', createdBy: req.auth.sub });
  if (req.body.payment && Number(req.body.payment.amount) > 0) job.payments.push({ ...paymentFields(req.body.payment), receivedBy: req.auth.sub });
  computeJobTotals(job);
  assertPayable(job);
  await assertInStock(consumption(job));
  job.billNumber = await nextCode('SNV', 5);
  await reconcileStock(new Map(), consumption(job), { jobId: job._id, billNumber: job.billNumber, userId: req.auth.sub, date: job.jobDate });
  try {
    await job.save();
  } catch (err) {
    await reconcileStock(consumption(job), new Map(), { jobId: job._id, billNumber: job.billNumber, userId: req.auth.sub, date: job.jobDate });
    throw err;
  }
  res.status(201).json({ job: await job.populate(JOB_POPULATE) });
}

export async function updateJob(req, res) {
  const job = await TradersJob.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!job) throw new HttpError(404, 'Bill not found');
  const before = consumption(job);
  Object.assign(job, await jobFields(req.body, job));
  computeJobTotals(job);
  assertPayable(job);
  const ctx = { jobId: job._id, billNumber: job.billNumber, userId: req.auth.sub, date: job.jobDate };
  await reconcileStock(before, consumption(job), ctx);
  try {
    await job.save();
  } catch (err) {
    await reconcileStock(consumption(job), before, ctx);
    throw err;
  }
  res.json({ job: await job.populate(JOB_POPULATE) });
}

export async function deleteJob(req, res) {
  const job = await TradersJob.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!job) throw new HttpError(404, 'Bill not found');
  await reconcileStock(consumption(job), new Map(), { jobId: job._id, billNumber: job.billNumber, userId: req.auth.sub, date: job.jobDate });
  job.deletedAt = new Date();
  await job.save();
  res.json({ ok: true });
}

export async function addJobPayment(req, res) {
  const job = await TradersJob.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!job) throw new HttpError(404, 'Bill not found');
  if (job.status === 'cancelled') throw new HttpError(400, 'This bill is cancelled');
  const payment = paymentFields(req.body);
  if (payment.amount > job.balance + 0.01) {
    throw new HttpError(400, job.balance <= 0 ? 'This bill is already fully paid' : `Amount is more than the balance due (₹${job.balance})`);
  }
  job.payments.push({ ...payment, receivedBy: req.auth.sub });
  computeJobTotals(job);
  assertPayable(job);
  await job.save();
  res.status(201).json({ job: await job.populate(JOB_POPULATE) });
}

export async function deleteJobPayment(req, res) {
  const job = await TradersJob.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!job) throw new HttpError(404, 'Bill not found');
  const payment = job.payments.id(assertId(req.params.paymentId, 'payment'));
  if (!payment) throw new HttpError(404, 'Payment not found');
  payment.deleteOne();
  computeJobTotals(job);
  await job.save();
  res.json({ job: await job.populate(JOB_POPULATE) });
}

/* ───────────── Overview (dashboard) ───────────── */

export async function tradersOverview(_req, res) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [products, monthJobs, monthPayments, dues, recent, scheduled, monthPurchases, supplierDues] = await Promise.all([
    TradersProduct.find({ deletedAt: null }).select('name sku stock unit reorderLevel costPrice sellingPrice image status'),
    TradersJob.aggregate([
      { $match: { deletedAt: null, status: { $ne: 'cancelled' }, jobDate: { $gte: monthStart } } },
      { $group: { _id: null, count: { $sum: 1 }, billed: { $sum: '$total' }, profit: { $sum: '$profit' } } },
    ]),
    TradersJob.aggregate([
      { $match: { deletedAt: null, 'payments.date': { $gte: monthStart } } },
      { $unwind: '$payments' },
      { $match: { 'payments.date': { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$payments.amount' } } },
    ]),
    TradersJob.aggregate([
      { $match: { deletedAt: null, status: { $ne: 'cancelled' }, balance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$balance' }, count: { $sum: 1 } } },
    ]),
    TradersJob.find({ deletedAt: null }).populate('partnerId', 'name').sort({ jobDate: -1, createdAt: -1 }).limit(6),
    TradersJob.countDocuments({ deletedAt: null, status: 'scheduled' }),
    TradersPurchase.aggregate([
      { $match: { deletedAt: null, purchaseDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    TradersPurchase.aggregate([
      { $match: { deletedAt: null, balance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$balance' }, count: { $sum: 1 } } },
    ]),
  ]);
  const lowStock = products
    .filter((p) => p.status === 'active' && stockState(p) !== 'ok')
    .sort((a, b) => a.stock - b.stock)
    .map((p) => ({ ...p.toJSON(), stockState: stockState(p) }));
  res.json({
    kpis: {
      products: products.length,
      stockUnits: round2(products.reduce((t, p) => t + Math.max(0, p.stock), 0)),
      stockValue: round2(products.reduce((t, p) => t + Math.max(0, p.stock) * p.costPrice, 0)),
      lowStock: lowStock.length,
      monthJobs: monthJobs[0]?.count || 0,
      monthBilled: round2(monthJobs[0]?.billed || 0),
      monthProfit: round2(monthJobs[0]?.profit || 0),
      monthCollected: round2(monthPayments[0]?.total || 0),
      outstanding: round2(dues[0]?.total || 0),
      outstandingBills: dues[0]?.count || 0,
      scheduled,
      monthPurchased: round2(monthPurchases[0]?.total || 0),
      monthPurchases: monthPurchases[0]?.count || 0,
      supplierDue: round2(supplierDues[0]?.total || 0),
      supplierDueBills: supplierDues[0]?.count || 0,
    },
    lowStock: lowStock.slice(0, 8),
    recentJobs: recent,
  });
}

/* ───────────── Public catalogue ───────────── */

export async function publicProducts(_req, res) {
  const products = await TradersProduct.find({ deletedAt: null, status: 'active', showOnWebsite: true })
    .sort({ featured: -1, sortOrder: 1, name: 1 })
    .limit(500);
  res.set('Cache-Control', 'no-cache');
  res.json({
    items: products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      brand: p.brand,
      model: p.model,
      description: p.description,
      image: p.image,
      unit: p.unit,
      warranty: p.warranty,
      featured: p.featured,
      price: p.showPrice ? p.sellingPrice : null,
      mrp: p.showPrice && p.mrp > p.sellingPrice ? p.mrp : null,
      availability: stockState(p) === 'out' ? 'out' : stockState(p) === 'low' ? 'few' : 'in',
    })),
  });
}
