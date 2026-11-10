import mongoose from 'mongoose';
import { JOB_PAYMENT_STATUS, JOB_STATUS, PAYMENT_MODE } from '../constants/enums.js';

const itemSchema = new mongoose.Schema(
  {
    /** Empty for one-off lines (e.g. cable by the metre) that are not tracked in stock. */
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradersProduct' },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    unit: { type: String, trim: true, default: 'pcs' },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    /** Cost snapshot at billing time, used for profit. */
    unitCost: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const jobPaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  mode: { type: String, enum: PAYMENT_MODE, default: 'cash' },
  date: { type: Date, required: true },
  reference: { type: String, trim: true },
  note: { type: String, trim: true },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

/** One installation at a partner's (client's) site: parts installed, the bill, payments and profit. */
const jobSchema = new mongoose.Schema(
  {
    billNumber: { type: String, required: true, trim: true },
    jobDate: { type: Date, required: true },
    status: { type: String, enum: JOB_STATUS, default: 'installed' },
    /** The partner (client) this bill is for. */
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradersPartner' },
    /** The partner's details as printed on this bill, copied from the partner record on save. */
    client: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      address: { type: String, trim: true },
      gstin: { type: String, trim: true, uppercase: true },
    },
    items: { type: [itemSchema], default: [] },
    labourCharge: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 28 },
    payments: { type: [jobPaymentSchema], default: [] },
    itemsTotal: { type: Number, default: 0 },
    itemsCost: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: JOB_PAYMENT_STATUS, default: 'unpaid' },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'traders_jobs' }
);

jobSchema.index({ billNumber: 1 }, { unique: true });
jobSchema.index({ jobDate: -1 });
jobSchema.index({ partnerId: 1, jobDate: -1 });

export const TradersJob = mongoose.model('TradersJob', jobSchema);
