import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { jwtSecret } from '../middleware/auth.js';
import { HttpError, requireFields } from '../utils/http.js';

export async function login(req, res) {
  requireFields(req.body, ['email', 'password']);
  const user = await User.findOne({ email: String(req.body.email).trim().toLowerCase() });
  const ok = user && user.status === 'active' && (await bcrypt.compare(String(req.body.password), user.passwordHash));
  if (!ok) throw new HttpError(401, 'Wrong email or password');
  const token = jwt.sign({ sub: user.id, role: user.role, name: user.name, email: user.email }, jwtSecret(), { expiresIn: '7d' });
  res.json({ token, user });
}

export async function me(req, res) {
  const user = await User.findById(req.auth.sub);
  if (!user || user.status !== 'active') throw new HttpError(401, 'Account not found');
  res.json({ user });
}
