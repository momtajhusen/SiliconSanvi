import mongoose from 'mongoose';
import { BATCH_STATUS, BATCH_TYPE, WEEK_DAYS } from '../constants/enums.js';

const batchSchema = new mongoose.Schema(
  {
    batchCode: { type: String, required: true, trim: true, uppercase: true },
    batchName: { type: String, required: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    timingFrom: { type: String, required: true, trim: true },
    timingTo: { type: String, required: true, trim: true },
    days: [{ type: String, enum: WEEK_DAYS }],
    room: { type: String, trim: true },
    faculty: { type: String, trim: true },
    maxStrength: { type: Number, default: 20, min: 1 },
    batchType: { type: String, enum: BATCH_TYPE, default: 'regular' },
    status: { type: String, enum: BATCH_STATUS, default: 'upcoming' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'batches' }
);

batchSchema.index({ batchCode: 1 }, { unique: true });
batchSchema.index({ courseId: 1, status: 1 });

export const Batch = mongoose.model('Batch', batchSchema);
