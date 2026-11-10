import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { HttpError } from '../utils/http.js';

export const UPLOAD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../uploads');

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const DOCUMENT_TYPES = { ...IMAGE_TYPES, 'application/pdf': '.pdf' };
/** Folders that also accept PDFs (student documents, payment proofs). */
const DOCUMENT_FOLDERS = ['documents', 'payments', 'purchases'];
const FOLDERS = ['students', 'courses', 'company', 'products', 'partners', 'site', ...DOCUMENT_FOLDERS];
export const MAX_UPLOAD_MB = 5;

const folderOf = (req) => (FOLDERS.includes(req.query.folder) ? req.query.folder : 'misc');
const typesFor = (req) => (DOCUMENT_FOLDERS.includes(folderOf(req)) ? DOCUMENT_TYPES : IMAGE_TYPES);

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(UPLOAD_DIR, folderOf(req));
    fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${typesFor(req)[file.mimetype]}`);
  },
});

const fileUpload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (typesFor(req)[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, DOCUMENT_FOLDERS.includes(folderOf(req)) ? 'Only JPG, PNG, WEBP or PDF files are allowed' : 'Only JPG, PNG or WEBP images are allowed'));
  },
}).single('file');

export function uploadImage(req, res, next) {
  fileUpload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(new HttpError(400, err.code === 'LIMIT_FILE_SIZE' ? `File must be smaller than ${MAX_UPLOAD_MB} MB` : err.message));
    }
    return next(err);
  });
}

/** Deletes a previously uploaded file; ignores URLs that are not ours. */
export function removeUpload(url) {
  if (typeof url !== 'string' || !url.startsWith('/uploads/')) return;
  const file = path.resolve(UPLOAD_DIR, url.slice('/uploads/'.length));
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return;
  fs.unlink(file, () => {});
}
