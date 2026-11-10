import mongoose from 'mongoose';
import { STOCK_MOVE_TYPE } from '../constants/enums.js';

const stockMoveSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradersProduct', required: true },
    type: { type: String, enum: STOCK_MOVE_TYPE, required: true },
    /** Signed: + stock in, − stock out. */
    quantity: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    unitCost: { type: Number, min: 0 },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradersJob' },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TradersPurchase' },
    note: { type: String, trim: true },
    date: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'traders_stock_moves' }
);

stockMoveSchema.index({ productId: 1, date: -1 });
stockMoveSchema.index({ date: -1 });

export const StockMove = mongoose.model('StockMove', stockMoveSchema);
