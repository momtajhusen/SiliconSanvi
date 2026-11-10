import { create } from 'zustand';
import api from '../lib/api';

const CACHE_KEY = 'silicon-site-images';

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCache(images) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(images));
  } catch {
    /* private mode: images still show for this visit */
  }
}

/** Images saved for the public website slots, keyed by slot. Cached so repeat visits paint instantly. */
const useSiteImageStore = create((set, get) => ({
  images: readCache(),
  loading: false,
  loaded: false,
  load: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const { data } = await api.get('/public/site-images', { timeout: 6000 });
      const images = data.images || {};
      writeCache(images);
      set({ images, loaded: true });
    } catch {
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  put: (key, image) => {
    const images = { ...get().images, [key]: { url: image.url, alt: image.alt, updatedAt: image.updatedAt } };
    writeCache(images);
    set({ images });
  },
  remove: (key) => {
    const images = { ...get().images };
    delete images[key];
    writeCache(images);
    set({ images });
  },
}));

export default useSiteImageStore;
