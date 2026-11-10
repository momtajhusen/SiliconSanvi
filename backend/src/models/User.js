import mongoose from 'mongoose';
import { ENTITY_STATUS, USER_ROLE } from '../constants/enums.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLE, default: 'admin' },
    status: { type: String, enum: ENTITY_STATUS, default: 'active' },
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.model('User', userSchema);
