import mongoose from 'mongoose';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function assertId(id, label = 'id') {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, `Invalid ${label}`);
  return id;
}

export function optionalId(id) {
  return id && mongoose.isValidObjectId(id) ? id : undefined;
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
  if (missing.length) throw new HttpError(400, `Required: ${missing.join(', ')}`);
}

export function str(value) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
}

/** Optional yes/no flag: true/'true'/'yes'/1 → true, false/'false'/'no'/0 → false, ''/null → null (clears). */
export function bool(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value === 'boolean') return value;
  const text = String(value).trim().toLowerCase();
  if (['true', 'yes', '1'].includes(text)) return true;
  if (['false', 'no', '0'].includes(text)) return false;
  throw new HttpError(400, 'Expected yes or no');
}

export function num(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new HttpError(400, `Invalid number: ${value}`);
  return n;
}

export function date(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const dayOnly = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = dayOnly ? new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3])) : new Date(value);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, `Invalid date: ${value}`);
  return d;
}

export function pick(body, keys) {
  return Object.fromEntries(keys.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));
}

export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
