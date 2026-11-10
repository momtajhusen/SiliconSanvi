import mongoose from 'mongoose';
import { ENROLLMENT_STATUS } from '../constants/enums.js';

const enrollmentSchema = new mongoose.Schema(
  {
    enrollmentNumber: { type: String, required: true, trim: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    enrollmentDate: { type: Date, required: true },
    expectedCompletionDate: { type: Date },
    actualCompletionDate: { type: Date },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ENROLLMENT_STATUS, default: 'enrolled' },
    remarks: { type: String, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'enrollments' }
);

enrollmentSchema.index({ enrollmentNumber: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1, courseId: 1 });
enrollmentSchema.index({ batchId: 1, status: 1 });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
