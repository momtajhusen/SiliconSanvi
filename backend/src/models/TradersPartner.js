import mongoose from 'mongoose';
import { ENTITY_STATUS } from '../constants/enums.js';

/** A Sanvi partner is the client: the person or business at whose site parts are installed and who is billed. */
const partnerSchema = new mongoose.Schema(
  {
    partnerCode: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    /** Installation site / billing address. */
    address: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    notes: { type: String, trim: true },
    status: { type: String, enum: ENTITY_STATUS, default: 'active' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'traders_partners' }
);

partnerSchema.index({ partnerCode: 1 }, { unique: true });

export const TradersPartner = mongoose.model('TradersPartner', partnerSchema);
