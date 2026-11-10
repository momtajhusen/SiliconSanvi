import mongoose from 'mongoose';
import {
  ENQUIRY_TYPE, GENDER, INQUIRY_STATUS, LEAD_PRIORITY, LEAD_SOURCE, PREFERRED_BATCH, WEB_FORM,
} from '../constants/enums.js';

const inquirySchema = new mongoose.Schema(
  {
    inquiryNumber: { type: String, required: true, trim: true },
    enquiryType: { type: String, enum: ENQUIRY_TYPE, default: 'course' },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true },
    gender: { type: String, enum: GENDER },
    dob: { type: Date },
    age: { type: Number, min: 0 },
    fatherName: { type: String, trim: true },
    address: { type: String, trim: true },
    qualification: { type: String, trim: true },
    schoolName: { type: String, trim: true },
    parentMobile: { type: String, trim: true, maxlength: 20 },
    computerAtHome: { type: Boolean },
    previousCourse: { type: Boolean },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    courseInterest: { type: String, trim: true },
    preferredBatch: { type: String, enum: PREFERRED_BATCH },
    /** CCTV / product enquiry details from the website (property, package, category). */
    details: { type: mongoose.Schema.Types.Mixed },
    webForm: { type: String, enum: WEB_FORM },
    leadSource: { type: String, enum: LEAD_SOURCE, default: 'walk-in' },
    priority: { type: String, enum: LEAD_PRIORITY, default: 'warm' },
    status: { type: String, enum: INQUIRY_STATUS, default: 'new' },
    followUpDate: { type: Date },
    remarks: { type: String, trim: true },
    followUps: {
      type: [
        new mongoose.Schema(
          {
            note: { type: String, required: true, trim: true },
            nextFollowUpDate: { type: Date },
            statusAfter: { type: String, enum: INQUIRY_STATUS },
            by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            at: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    convertedToStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    convertedDate: { type: Date },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'inquiries' }
);

inquirySchema.index({ inquiryNumber: 1 }, { unique: true });
inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ webForm: 1, status: 1 });

export const Inquiry = mongoose.model('Inquiry', inquirySchema);
