import path from 'node:path';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { HttpError } from '../utils/http.js';

export async function uploadImage(req, res) {
  if (!req.file) throw new HttpError(400, 'Choose an image to upload');
  const relative = path.relative(UPLOAD_DIR, req.file.path).split(path.sep).join('/');
  res.status(201).json({ url: `/uploads/${relative}` });
}
