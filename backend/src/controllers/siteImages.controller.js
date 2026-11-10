import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { SiteImage } from '../models/SiteImage.js';
import { IMAGE_SOURCE, SITE_IMAGE_SLOTS } from '../constants/siteImages.js';
import { UPLOAD_DIR, removeUpload } from '../middleware/upload.js';
import { HttpError, str } from '../utils/http.js';

const SITE_PREFIX = '/uploads/site/';
const GENERATE_SIZES = { landscape: '1536x1024', square: '1024x1024' };
const GENERATE_TIMEOUT_MS = 150_000;

const generationEnabled = () => Boolean(process.env.OPENAI_API_KEY);

function slotKey(value) {
  const key = String(value || '');
  if (!Object.hasOwn(SITE_IMAGE_SLOTS, key)) throw new HttpError(404, 'Unknown image slot');
  return key;
}

function cleanAlt(value) {
  return (str(value) || '').slice(0, 160);
}

function cleanPrompt(value) {
  return (str(value) || '').slice(0, 4000);
}

async function assertSiteFile(url) {
  if (typeof url !== 'string' || !url.startsWith(SITE_PREFIX)) throw new HttpError(400, 'Upload the image first');
  const file = path.resolve(UPLOAD_DIR, url.slice('/uploads/'.length));
  if (!file.startsWith(path.join(UPLOAD_DIR, 'site') + path.sep)) throw new HttpError(400, 'Invalid image');
  await fs.access(file).catch(() => { throw new HttpError(400, 'That image file no longer exists. Upload it again.'); });
}

/** Deletes an old slot image unless another slot still shows the same file. */
async function releaseFile(url, exceptKey) {
  if (!url || !url.startsWith(SITE_PREFIX)) return;
  const inUse = await SiteImage.exists({ url, key: { $ne: exceptKey } });
  if (!inUse) removeUpload(url);
}

function shape(row) {
  return { key: row.key, url: row.url, alt: row.alt || '', prompt: row.prompt || '', source: row.source, updatedAt: row.updatedAt, updatedBy: row.updatedBy?.name || null };
}

async function store(key, { url, alt, prompt, source }, userId) {
  const previous = await SiteImage.findOne({ key });
  const row = await SiteImage.findOneAndUpdate(
    { key },
    { $set: { url, alt, prompt, source, updatedBy: userId } },
    { returnDocument: 'after', upsert: true, runValidators: true }
  ).populate('updatedBy', 'name');
  if (previous && previous.url !== url) await releaseFile(previous.url, key);
  return row;
}

export async function publicSiteImages(_req, res) {
  const rows = await SiteImage.find({ key: { $in: Object.keys(SITE_IMAGE_SLOTS) } }).select('key url alt updatedAt');
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ images: Object.fromEntries(rows.map((row) => [row.key, { url: row.url, alt: row.alt || '', updatedAt: row.updatedAt }])) });
}

export async function listSiteImages(_req, res) {
  const rows = await SiteImage.find().populate('updatedBy', 'name').sort({ key: 1 });
  res.json({ items: rows.map(shape), generationEnabled: generationEnabled() });
}

/** Puts an uploaded (or library) image into a slot. */
export async function saveSiteImage(req, res) {
  const key = slotKey(req.params.key);
  const url = String(req.body.url || '');
  await assertSiteFile(url);
  const source = IMAGE_SOURCE.includes(req.body.source) ? req.body.source : 'upload';
  const row = await store(key, { url, alt: cleanAlt(req.body.alt), prompt: cleanPrompt(req.body.prompt), source }, req.auth.sub);
  res.json({ image: shape(row) });
}

export async function updateSiteImage(req, res) {
  const key = slotKey(req.params.key);
  const row = await SiteImage.findOne({ key });
  if (!row) throw new HttpError(404, 'This slot has no image yet');
  if (req.body.alt !== undefined) row.alt = cleanAlt(req.body.alt);
  if (req.body.prompt !== undefined) row.prompt = cleanPrompt(req.body.prompt);
  row.updatedBy = req.auth.sub;
  await row.save();
  await row.populate('updatedBy', 'name');
  res.json({ image: shape(row) });
}

export async function deleteSiteImage(req, res) {
  const key = slotKey(req.params.key);
  const row = await SiteImage.findOneAndDelete({ key });
  if (row) await releaseFile(row.url, key);
  res.json({ ok: true });
}

const hideKeys = (message) => String(message || '').replace(/sk-[\w-]{6,}/g, '[key]');

async function requestImage(prompt, size) {
  let response;
  try {
    response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt, size, n: 1 }),
      signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
    });
  } catch (err) {
    throw new HttpError(504, err?.name === 'TimeoutError' ? 'Image generation took too long. Try again.' : 'Could not reach the image generation service.');
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) throw new HttpError(502, 'The image generation key was rejected. Check OPENAI_API_KEY in backend/.env.');
  if (!response.ok) throw new HttpError(502, `Image generation failed: ${hideKeys(body?.error?.message) || response.statusText}`);
  const item = body?.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) {
    const file = await fetch(item.url, { signal: AbortSignal.timeout(60_000) });
    if (file.ok) return Buffer.from(await file.arrayBuffer());
  }
  throw new HttpError(502, 'Image generation returned no image.');
}

/** Generates an image from a prompt and puts it into the slot. Needs OPENAI_API_KEY on the server. */
export async function generateSiteImage(req, res) {
  const key = slotKey(req.params.key);
  const prompt = cleanPrompt(req.body.prompt);
  if (prompt.length < 10) throw new HttpError(400, 'Write a prompt of at least a few words');
  if (!generationEnabled()) {
    throw new HttpError(503, 'Image generation is not set up on the server. Add OPENAI_API_KEY to backend/.env, or copy the prompt into ChatGPT and upload the result.');
  }
  const buffer = await requestImage(prompt, GENERATE_SIZES[SITE_IMAGE_SLOTS[key]]);
  const dir = path.join(UPLOAD_DIR, 'site');
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.png`;
  await fs.writeFile(path.join(dir, name), buffer);
  const row = await store(key, { url: `${SITE_PREFIX}${name}`, alt: cleanAlt(req.body.alt), prompt, source: 'generated' }, req.auth.sub);
  res.status(201).json({ image: shape(row) });
}
