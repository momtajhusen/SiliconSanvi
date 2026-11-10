import mongoose from 'mongoose';
import { PAYMENT_FOR, PAYMENT_MODE, PAYMENT_STATUS } from '../constants/enums.js';

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, trim: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    feeStructureId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStructure' },
    amount: { type: Number, required: true, min: 0.01 },
    lateFee: { type: Number, default: 0, min: 0 },
    paymentMode: { type: String, enum: PAYMENT_MODE, default: 'cash' },
    paymentFor: { type: String, enum: PAYMENT_FOR, default: 'course_fee' },
    transactionId: { type: String, trim: true },
    paymentDate: { type: Date, required: true },
    installmentNumber: { type: Number, min: 1 },
    receivedFrom: { type: String, trim: true },
    remarks: { type: String, trim: true },
    /** Uploaded payment proof (eSewa / Khalti / Fonepay screenshot, bank voucher, cheque photo). */
    proofUrl: { type: String, trim: true },
    status: { type: String, enum: PAYMENT_STATUS, default: 'success' },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'payments' }
);

paymentSchema.index({ receiptNumber: 1 }, { unique: true });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ feeStructureId: 1, status: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
