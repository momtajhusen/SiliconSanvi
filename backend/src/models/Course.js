import mongoose from 'mongoose';
import { COURSE_LEVEL, COURSE_TYPE, ENTITY_STATUS } from '../constants/enums.js';

const courseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, trim: true, uppercase: true },
    /** Matches the public website course slug so website forms can reference it. */
    slug: { type: String, trim: true, lowercase: true },
    courseName: { type: String, required: true, trim: true },
    shortDescription: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    /** One topic per line. */
    syllabus: { type: String, trim: true },
    prerequisites: { type: String, trim: true },
    learningOutcomes: { type: String, trim: true },
    durationMonths: { type: Number, required: true, min: 0 },
    baseFee: { type: Number, required: true, min: 0 },
    admissionFee: { type: Number, default: 0, min: 0 },
    examFee: { type: Number, default: 0, min: 0 },
    courseType: { type: String, enum: COURSE_TYPE, default: 'certificate' },
    level: { type: String, enum: COURSE_LEVEL, default: 'beginner' },
    status: { type: String, enum: ENTITY_STATUS, default: 'active' },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'courses' }
);

courseSchema.index({ courseCode: 1 }, { unique: true });
courseSchema.index({ slug: 1 }, { unique: true, sparse: true });
courseSchema.index({ sortOrder: 1, courseName: 1 });

export const Course = mongoose.model('Course', courseSchema);
