import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/http.js';

export function jwtSecret() {
  return process.env.JWT_SECRET || 'silicon-dev-secret-change-me';
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please sign in');
  try {
    req.auth = jwt.verify(token, jwtSecret());
  } catch {
    throw new HttpError(401, 'Session expired. Please sign in again.');
  }
  next();
}
