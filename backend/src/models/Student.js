import mongoose from 'mongoose';
import { DOCUMENT_TYPE, GENDER, STUDENT_SOURCE, STUDENT_STATUS } from '../constants/enums.js';

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true },
    photo: { type: String, trim: true },
    gender: { type: String, enum: GENDER, required: true },
    dob: { type: Date },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    qualification: { type: String, trim: true },
    schoolName: { type: String, trim: true },
    parentName: { type: String, trim: true },
    parentMobile: { type: String, trim: true, maxlength: 20 },
    guardianRelation: { type: String, trim: true },
    /** Citizenship / Aadhaar / other ID number. */
    idNumber: { type: String, trim: true },
    computerAtHome: { type: Boolean },
    previousCourse: { type: Boolean },
    documents: {
      type: [
        new mongoose.Schema(
          {
            docType: { type: String, enum: DOCUMENT_TYPE, default: 'other' },
            name: { type: String, trim: true },
            url: { type: String, required: true, trim: true },
            remarks: { type: String, trim: true },
            uploadedAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
    admissionDate: { type: Date, required: true },
    status: { type: String, enum: STUDENT_STATUS, default: 'active' },
    /** Course chosen at admission, before an enrollment exists. */
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    inquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inquiry' },
    source: { type: String, enum: STUDENT_SOURCE, default: 'office' },
    remarks: { type: String, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'students' }
);

studentSchema.index({ studentId: 1 }, { unique: true });
studentSchema.index({ status: 1, createdAt: -1 });

export const Student = mongoose.model('Student', studentSchema);
