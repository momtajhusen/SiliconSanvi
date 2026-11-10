import mongoose from 'mongoose';
import { JOB_PAYMENT_STATUS, PAYMENT_MODE } from '../constants/enums.js';

const purchaseItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradersProduct', required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    unit: { type: String, trim: true, default: 'pcs' },
    quantity: { type: Number, required: true, min: 0.01 },
    /** Buying rate per unit before GST; feeds the product's average cost. */
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const supplierPaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0.01 },
  mode: { type: String, enum: PAYMENT_MODE, default: 'cash' },
  date: { type: Date, required: true },
  reference: { type: String, trim: true },
  note: { type: String, trim: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

/** A supplier's bill: goods received into stock, what it cost and what is still owed to the supplier. */
const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: { type: String, required: true, trim: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradersSupplier', required: true },
    /** The supplier's own invoice number. */
    supplierInvoice: { type: String, trim: true },
    purchaseDate: { type: Date, required: true },
    items: { type: [purchaseItemSchema], default: [] },
    freight: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    payments: { type: [supplierPaymentSchema], default: [] },
    itemsTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: JOB_PAYMENT_STATUS, default: 'unpaid' },
    attachment: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'traders_purchases' }
);

purchaseSchema.index({ purchaseNumber: 1 }, { unique: true });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ supplierId: 1, purchaseDate: -1 });

export const TradersPurchase = mongoose.model('TradersPurchase', purchaseSchema);
