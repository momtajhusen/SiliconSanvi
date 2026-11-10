import mongoose from 'mongoose';
import { ENTITY_STATUS } from '../constants/enums.js';

/** Wholesaler / distributor Sanvi buys stock from. */
const supplierSchema = new mongoose.Schema(
  {
    supplierCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ENTITY_STATUS, default: 'active' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'traders_suppliers' }
);

supplierSchema.index({ supplierCode: 1 }, { unique: true });

export const TradersSupplier = mongoose.model('TradersSupplier', supplierSchema);
