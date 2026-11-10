import mongoose from 'mongoose';
import { ENTITY_STATUS, PRODUCT_CATEGORY } from '../constants/enums.js';

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: PRODUCT_CATEGORY, default: 'other' },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    unit: { type: String, trim: true, default: 'pcs' },
    /** Purchase cost per unit — never sent to the public website. */
    costPrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    mrp: { type: Number, min: 0 },
    /** Only changed through stock moves so the history always adds up. */
    stock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 2, min: 0 },
    warranty: { type: String, trim: true },
    showOnWebsite: { type: Boolean, default: true },
    showPrice: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ENTITY_STATUS, default: 'active' },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'traders_products' }
);

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category: 1, sortOrder: 1, name: 1 });

export const TradersProduct = mongoose.model('TradersProduct', productSchema);
