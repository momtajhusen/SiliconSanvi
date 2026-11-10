import { CompanyProfile } from '../models/CompanyProfile.js';
import { COMPANY_KEY, SOCIAL_NETWORKS } from '../constants/enums.js';
import { HttpError } from '../utils/http.js';
import { removeUpload } from '../middleware/upload.js';

/** Max length per editable text field. */
const LIMITS = {
  name: 80,
  short: 30,
  kind: 40,
  tagline: 120,
  text: 600,
  phone: 20,
  whatsapp: 20,
  email: 120,
  address: 240,
  mapUrl: 500,
  hours: 80,
  registration: 60,
  logo: 200,
  favicon: 200,
};
const IDENTITY_FIELDS = ['name', 'short', 'kind', 'tagline', 'text', 'logo', 'registration'];
const CONTACT_FIELDS = ['favicon', 'phone', 'whatsapp', 'email', 'address', 'mapUrl', 'hours'];
const IMAGE_FIELDS = ['logo', 'favicon'];
const FIELDS_BY_KEY = {
  institute: [...IDENTITY_FIELDS, ...CONTACT_FIELDS],
  traders: [...IDENTITY_FIELDS, ...CONTACT_FIELDS],
  site: CONTACT_FIELDS,
};

const PHONE = /^[0-9+\s()-]{7,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL = /^https?:\/\/[^\s]+$/i;

function clean(value, field) {
  if (value === undefined || value === null) return '';
  const out = String(value).trim();
  if (out.length > (LIMITS[field] || 300)) throw new HttpError(400, `${field} is too long (max ${LIMITS[field] || 300} characters)`);
  return out;
}

function profileFields(key, body) {
  const out = {};
  for (const field of FIELDS_BY_KEY[key]) {
    if (body[field] === undefined) continue;
    const value = clean(body[field], field);
    if (value && (field === 'phone' || field === 'whatsapp') && !PHONE.test(value)) throw new HttpError(400, `Enter a valid ${field === 'phone' ? 'phone' : 'WhatsApp'} number`);
    if (value && field === 'email' && !EMAIL.test(value)) throw new HttpError(400, 'Enter a valid email address');
    if (value && field === 'mapUrl' && !URL.test(value)) throw new HttpError(400, 'Map link must start with http:// or https://');
    if (value && IMAGE_FIELDS.includes(field) && !value.startsWith('/uploads/company/')) throw new HttpError(400, `Upload the ${field} image again`);
    out[field] = value;
  }
  if (body.social !== undefined) {
    if (typeof body.social !== 'object' || body.social === null) throw new HttpError(400, 'Invalid social links');
    for (const network of SOCIAL_NETWORKS) {
      if (body.social[network] === undefined) continue;
      const value = clean(body.social[network], network);
      if (value && !URL.test(value)) throw new HttpError(400, `${network} link must start with http:// or https://`);
      out[`social.${network}`] = value;
    }
  }
  return out;
}

function serialize(doc) {
  if (!doc) return {};
  const out = {};
  for (const field of FIELDS_BY_KEY[doc.key]) out[field] = doc[field] || '';
  out.social = Object.fromEntries(SOCIAL_NETWORKS.map((network) => [network, doc.social?.[network] || '']));
  return out;
}

async function allProfiles() {
  const docs = await CompanyProfile.find({ key: { $in: COMPANY_KEY } });
  const byKey = new Map(docs.map((doc) => [doc.key, doc]));
  return { byKey, profiles: Object.fromEntries(COMPANY_KEY.map((key) => [key, serialize(byKey.get(key))])) };
}

/** GET /public/company — saved company details; the website falls back to its defaults for blank fields. */
export async function publicCompany(_req, res) {
  const { profiles } = await allProfiles();
  res.set('Cache-Control', 'no-cache');
  res.json({ profiles });
}

/** GET /admin/company */
export async function getCompany(_req, res) {
  const { byKey, profiles } = await allProfiles();
  const updatedAt = Object.fromEntries(COMPANY_KEY.map((key) => [key, byKey.get(key)?.updatedAt || null]));
  res.json({ profiles, updatedAt });
}

/** PUT /admin/company/:key — admins only. */
export async function updateCompany(req, res) {
  if (req.auth?.role !== 'admin') throw new HttpError(403, 'Only admins can change company details');
  const { key } = req.params;
  if (!COMPANY_KEY.includes(key)) throw new HttpError(404, 'Unknown company');

  const fields = profileFields(key, req.body || {});
  const before = await CompanyProfile.findOne({ key });
  const doc = await CompanyProfile.findOneAndUpdate(
    { key },
    { $set: { ...fields, updatedBy: req.auth.sub }, $setOnInsert: { key } },
    { new: true, upsert: true, runValidators: true }
  );

  for (const field of IMAGE_FIELDS) {
    const previous = before?.[field];
    if (previous && previous !== doc[field]) removeUpload(previous);
  }
  res.json({ profile: serialize(doc), updatedAt: doc.updatedAt });
}
