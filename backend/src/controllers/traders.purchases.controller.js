import { TradersProduct } from '../models/TradersProduct.js';
import { TradersSupplier } from '../models/TradersSupplier.js';
import { TradersPurchase } from '../models/TradersPurchase.js';
import { nextCode } from '../models/Counter.js';
import { ENTITY_STATUS } from '../constants/enums.js';
import { HttpError, assertId, date, escapeRegex, num, requireFields, round2, str } from '../utils/http.js';
import { computePurchaseTotals, purchaseHolding, reconcilePurchase } from '../services/traders.js';
import { dayRange, money, paymentFields } from './traders.controller.js';

const PHONE_RX = /^[0-9+\s()-]{7,20}$/;

/* ───────────── Suppliers ───────────── */

function supplierFields(body) {
  const out = {};
  for (const key of ['name', 'contactPerson', 'phone', 'email', 'address', 'gstin', 'notes']) if (body[key] !== undefined) out[key] = str(body[key]) || '';
  if (body.status !== undefined) {
    if (!ENTITY_STATUS.includes(body.status)) throw new HttpError(400, 'Invalid status');
    out.status = body.status;
  }
  if (out.name === '') throw new HttpError(400, 'Supplier name is required');
  if (out.phone && !PHONE_RX.test(out.phone)) throw new HttpError(400, 'Enter a valid phone number');
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) throw new HttpError(400, 'Enter a valid email');
  return out;
}

async function supplierStats(match = {}) {
  const rows = await TradersPurchase.aggregate([
    { $match: { deletedAt: null, ...match } },
    {
      $group: {
        _id: '$supplierId',
        bills: { $sum: 1 },
        purchased: { $sum: '$total' },
        paid: { $sum: '$paid' },
        balance: { $sum: '$balance' },
        lastPurchase: { $max: '$purchaseDate' },
      },
    },
  ]);
  return new Map(rows.map((row) => [String(row._id), { bills: row.bills, purchased: round2(row.purchased), paid: round2(row.paid), balance: round2(row.balance), lastPurchase: row.lastPurchase }]));
}

const EMPTY_STATS = { bills: 0, purchased: 0, paid: 0, balance: 0, lastPurchase: null };

export async function listSuppliers(req, res) {
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { supplierCode: rx }, { contactPerson: rx }, { gstin: rx }];
  }
  const [suppliers, stats] = await Promise.all([TradersSupplier.find(filter).sort({ name: 1 }), supplierStats()]);
  res.json({ items: suppliers.map((s) => ({ ...s.toJSON(), stats: stats.get(s.id) || EMPTY_STATS })) });
}

export async function createSupplier(req, res) {
  requireFields(req.body, ['name']);
  const supplier = await TradersSupplier.create({ ...supplierFields(req.body), supplierCode: await nextCode('SUP', 3) });
  res.status(201).json({ supplier: { ...supplier.toJSON(), stats: EMPTY_STATS } });
}

export async function updateSupplier(req, res) {
  const supplier = await TradersSupplier.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!supplier) throw new HttpError(404, 'Supplier not found');
  Object.assign(supplier, supplierFields(req.body));
  await supplier.save();
  res.json({ supplier });
}

export async function deleteSupplier(req, res) {
  const supplier = await TradersSupplier.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!supplier) throw new HttpError(404, 'Supplier not found');
  const bills = await TradersPurchase.countDocuments({ supplierId: supplier._id, deletedAt: null });
  if (bills) throw new HttpError(409, `${bills} purchase bill(s) are recorded from this supplier. Mark the supplier inactive instead.`);
  supplier.deletedAt = new Date();
  await supplier.save();
  res.json({ ok: true });
}

/* ───────────── Purchase bills ───────────── */

const PURCHASE_POPULATE = [
  { path: 'supplierId', select: 'name phone supplierCode gstin address contactPerson' },
  { path: 'payments.paidBy', select: 'name' },
  { path: 'createdBy', select: 'name' },
];

async function purchaseItems(rawItems, previous = []) {
  if (!Array.isArray(rawItems) || !rawItems.length) throw new HttpError(400, 'Add at least one product to the purchase');
  const ids = rawItems.map((item) => assertId(item.productId, 'product'));
  const onBill = new Set(previous.map((item) => String(item.productId)));
  const products = new Map((await TradersProduct.find({ _id: { $in: ids } })).map((p) => [p.id, p]));
  return rawItems.map((raw) => {
    const product = products.get(String(raw.productId));
    if (!product || (product.deletedAt && !onBill.has(product.id))) throw new HttpError(400, 'A selected product no longer exists');
    const quantity = round2(num(raw.quantity));
    if (quantity <= 0) throw new HttpError(400, `Enter the quantity received for ${product.name}`);
    return { productId: product._id, name: product.name, sku: product.sku, unit: product.unit || 'pcs', quantity, unitCost: money(raw.unitCost ?? 0, 'Buying rate') };
  });
}

async function purchaseFields(body, existing) {
  const out = {};
  if (body.supplierId !== undefined) {
    out.supplierId = assertId(body.supplierId, 'supplier');
    if (!(await TradersSupplier.exists({ _id: out.supplierId, deletedAt: null }))) throw new HttpError(400, 'Supplier not found');
  }
  if (body.purchaseDate !== undefined) out.purchaseDate = date(body.purchaseDate) || new Date();
  if (body.supplierInvoice !== undefined) out.supplierInvoice = str(body.supplierInvoice) || '';
  if (body.items !== undefined) out.items = await purchaseItems(body.items, existing?.items);
  for (const [key, label] of [['freight', 'Freight'], ['discount', 'Discount'], ['taxAmount', 'GST']]) {
    if (body[key] !== undefined) out[key] = money(body[key], label);
  }
  if (body.attachment !== undefined) {
    const url = str(body.attachment) || '';
    if (url && !url.startsWith('/uploads/purchases/')) throw new HttpError(400, 'Invalid attachment');
    out.attachment = url;
  }
  if (body.notes !== undefined) out.notes = str(body.notes) || '';
  return out;
}

function assertPaid(purchase) {
  if (purchase.paid > purchase.total + 0.01) throw new HttpError(400, `Payments (₹${purchase.paid}) are more than the purchase bill (₹${purchase.total})`);
}

const label = (purchase, supplierName) => `${purchase.purchaseNumber}${supplierName ? ` · ${supplierName}` : ''}${purchase.supplierInvoice ? ` (inv. ${purchase.supplierInvoice})` : ''}`;

async function supplierName(id) {
  return (await TradersSupplier.findById(id).select('name'))?.name;
}

export async function listPurchases(req, res) {
  const filter = { deletedAt: null };
  const range = dayRange(req.query.from, req.query.to);
  if (range) filter.purchaseDate = range;
  if (req.query.supplierId) filter.supplierId = assertId(req.query.supplierId, 'supplier');
  if (req.query.productId) filter['items.productId'] = assertId(req.query.productId, 'product');
  if (req.query.paymentStatus === 'due') filter.balance = { $gt: 0 };
  else if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    filter.$or = [{ purchaseNumber: rx }, { supplierInvoice: rx }, { 'items.name': rx }, { 'items.sku': rx }, { notes: rx }];
  }
  const items = await TradersPurchase.find(filter).populate(PURCHASE_POPULATE).sort({ purchaseDate: -1, createdAt: -1 }).limit(1000);
  const sum = (key) => round2(items.reduce((t, p) => t + (p[key] || 0), 0));
  res.json({
    items,
    summary: {
      count: items.length,
      total: sum('total'),
      paid: sum('paid'),
      balance: sum('balance'),
      units: round2(items.reduce((t, p) => t + p.items.reduce((u, i) => u + i.quantity, 0), 0)),
    },
  });
}

export async function getPurchase(req, res) {
  const purchase = await TradersPurchase.findOne({ _id: assertId(req.params.id), deletedAt: null }).populate(PURCHASE_POPULATE);
  if (!purchase) throw new HttpError(404, 'Purchase not found');
  res.json({ purchase });
}

export async function createPurchase(req, res) {
  requireFields(req.body, ['supplierId', 'items']);
  const fields = await purchaseFields({ purchaseDate: new Date(), ...req.body });
  const purchase = new TradersPurchase({ ...fields, purchaseNumber: 'PENDING', createdBy: req.auth.sub });
  if (req.body.payment && Number(req.body.payment.amount) > 0) purchase.payments.push({ ...paymentFields(req.body.payment), paidBy: req.auth.sub });
  computePurchaseTotals(purchase);
  assertPaid(purchase);
  purchase.purchaseNumber = await nextCode('PUR', 5);
  const ctx = { purchaseId: purchase._id, label: label(purchase, await supplierName(purchase.supplierId)), userId: req.auth.sub, date: purchase.purchaseDate };
  await reconcilePurchase(new Map(), purchaseHolding(purchase), ctx);
  try {
    await purchase.save();
  } catch (err) {
    await reconcilePurchase(purchaseHolding(purchase), new Map(), ctx);
    throw err;
  }
  res.status(201).json({ purchase: await purchase.populate(PURCHASE_POPULATE) });
}

export async function updatePurchase(req, res) {
  const purchase = await TradersPurchase.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!purchase) throw new HttpError(404, 'Purchase not found');
  const before = purchaseHolding(purchase);
  Object.assign(purchase, await purchaseFields(req.body, purchase));
  computePurchaseTotals(purchase);
  assertPaid(purchase);
  const ctx = { purchaseId: purchase._id, label: label(purchase, await supplierName(purchase.supplierId)), userId: req.auth.sub, date: purchase.purchaseDate };
  await reconcilePurchase(before, purchaseHolding(purchase), ctx);
  try {
    await purchase.save();
  } catch (err) {
    await reconcilePurchase(purchaseHolding(purchase), before, ctx);
    throw err;
  }
  res.json({ purchase: await purchase.populate(PURCHASE_POPULATE) });
}

export async function deletePurchase(req, res) {
  const purchase = await TradersPurchase.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!purchase) throw new HttpError(404, 'Purchase not found');
  if (purchase.paid > 0) throw new HttpError(400, 'Remove the supplier payments on this purchase before deleting it');
  await reconcilePurchase(purchaseHolding(purchase), new Map(), {
    purchaseId: purchase._id, label: label(purchase, await supplierName(purchase.supplierId)), userId: req.auth.sub, date: purchase.purchaseDate,
  });
  purchase.deletedAt = new Date();
  await purchase.save();
  res.json({ ok: true });
}

export async function addPurchasePayment(req, res) {
  const purchase = await TradersPurchase.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!purchase) throw new HttpError(404, 'Purchase not found');
  const payment = paymentFields(req.body);
  if (payment.amount > purchase.balance + 0.01) {
    throw new HttpError(400, purchase.balance <= 0 ? 'This purchase is already fully paid' : `Amount is more than the balance owed (₹${purchase.balance})`);
  }
  purchase.payments.push({ ...payment, paidBy: req.auth.sub });
  computePurchaseTotals(purchase);
  await purchase.save();
  res.status(201).json({ purchase: await purchase.populate(PURCHASE_POPULATE) });
}

export async function deletePurchasePayment(req, res) {
  const purchase = await TradersPurchase.findOne({ _id: assertId(req.params.id), deletedAt: null });
  if (!purchase) throw new HttpError(404, 'Purchase not found');
  const payment = purchase.payments.id(assertId(req.params.paymentId, 'payment'));
  if (!payment) throw new HttpError(404, 'Payment not found');
  payment.deleteOne();
  computePurchaseTotals(purchase);
  await purchase.save();
  res.json({ purchase: await purchase.populate(PURCHASE_POPULATE) });
}
