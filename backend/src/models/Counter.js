import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: 'counters', versionKey: false }
);

export const Counter = mongoose.model('Counter', counterSchema);

/** Atomic, human-friendly document numbers: STU-0001, RCP-00042 … */
export async function nextCode(prefix, pad = 4) {
  const doc = await Counter.findByIdAndUpdate(prefix, { $inc: { seq: 1 } }, { returnDocument: 'after', upsert: true });
  return `${prefix}-${String(doc.seq).padStart(pad, '0')}`;
}
