import api from './api';
import { applyCompanyProfile } from '../constants/site';

const CACHE_KEY = 'silicon-company';

function readCache() {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function writeCache(json) {
  try {
    localStorage.setItem(CACHE_KEY, json);
  } catch {
    /* private mode: details still apply for this visit */
  }
}

/** Applies the last saved company details from this browser. Returns false on a first visit. */
export function applyCachedCompany() {
  const raw = readCache();
  if (!raw) return false;
  try {
    applyCompanyProfile(JSON.parse(raw));
    return true;
  } catch {
    return false;
  }
}

/** Fetches the latest company details and applies them. Resolves `true` when they differ from the cache. */
export async function refreshCompany() {
  const { data } = await api.get('/public/company', { timeout: 4000 });
  return storeCompany(data.profiles || {});
}

export function storeCompany(profiles) {
  const json = JSON.stringify(profiles);
  const changed = json !== readCache();
  writeCache(json);
  applyCompanyProfile(profiles);
  return changed;
}
