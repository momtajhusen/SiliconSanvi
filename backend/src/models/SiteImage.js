import mongoose from 'mongoose';
import { IMAGE_SOURCE } from '../constants/siteImages.js';

const siteImageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, maxlength: 160 },
    /** Prompt last used to generate this image, or the admin's edited prompt. */
    prompt: { type: String, trim: true, maxlength: 4000 },
    source: { type: String, enum: IMAGE_SOURCE, default: 'upload' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'site_images' }
);

siteImageSchema.index({ key: 1 }, { unique: true });

export const SiteImage = mongoose.model('SiteImage', siteImageSchema);
