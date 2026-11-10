import mongoose from 'mongoose';
import { FEE_STATUS } from '../constants/enums.js';

const installmentSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, min: 1 },
    title: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
  },
  { _id: false }
);

const feeStructureSchema = new mongoose.Schema(
  {
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    courseFee: { type: Number, required: true, min: 0 },
    admissionFee: { type: Number, default: 0, min: 0 },
    examFee: { type: Number, default: 0, min: 0 },
    certificateFee: { type: Number, default: 0, min: 0 },
    otherFees: { type: Number, default: 0, min: 0 },
    totalFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    scholarship: { type: Number, default: 0, min: 0 },
    netFee: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    installments: { type: Number, default: 1, min: 1, max: 36 },
    installmentSchedule: { type: [installmentSchema], default: [] },
    nextPaymentDueDate: { type: Date, default: null },
    feeStatus: { type: String, enum: FEE_STATUS, default: 'pending' },
    remarks: { type: String, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'feeStructures' }
);

feeStructureSchema.index({ enrollmentId: 1 }, { unique: true });
feeStructureSchema.index({ studentId: 1 });
feeStructureSchema.index({ feeStatus: 1 });

export const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
