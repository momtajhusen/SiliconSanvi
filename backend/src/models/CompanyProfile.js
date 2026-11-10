import mongoose from 'mongoose';
import { COMPANY_KEY, SOCIAL_NETWORKS } from '../constants/enums.js';

const text = { type: String, trim: true, default: '' };

const companyProfileSchema = new mongoose.Schema(
  {
    key: { type: String, enum: COMPANY_KEY, required: true },
    name: text,
    short: text,
    kind: text,
    tagline: text,
    text,
    logo: text,
    favicon: text,
    phone: text,
    whatsapp: text,
    email: text,
    address: text,
    mapUrl: text,
    hours: text,
    registration: text,
    social: Object.fromEntries(SOCIAL_NETWORKS.map((network) => [network, text])),
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'company_profiles' }
);

companyProfileSchema.index({ key: 1 }, { unique: true });

export const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema);
