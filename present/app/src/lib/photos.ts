// Destination photos — Wikimedia Commons (no API key, CORS-friendly, CC-licensed).
//
// Every destination has a curated Commons file and a search query. At runtime
// we try the curated file first (deterministic, verified), then a search
// (always available), and return null if the network is down — callers fall
// back to the procedural gradient so the demo never shows a broken image.
// Requests run a few at a time so a list screen fills in fast without
// hammering the Commons API (strictly serial was too slow).

import { DESTINATIONS } from '@/data/destinations';

export type Photo = {
  url: string;
  width: number;
  height: number;
  artist: string;
  license: string;
  file: string;
  page: string;
};

// Thumbs for lists (56–88 px), hero art for detail screens. Requesting a
// 1200 px file for a 56 px row is the difference between "instant" and "slow".
export const WIDTHS = { thumb: 400, hero: 1400 } as const;
export type PhotoSize = keyof typeof WIDTHS;

const cache = new Map<string, Photo | null>();
const inflight = new Map<string, Promise<Photo | null>>();

// A few parallel requests keep the list filling in fast without hammering
// the Commons API — serial was too slow (ten rows queued one by one).
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];
  constructor(n: number) { this.permits = n; }
  async acquire() {
    if (this.permits > 0) { this.permits--; return; }
    await new Promise<void>((release) => this.queue.push(release));
  }
  release() {
    const next = this.queue.shift();
    if (next) next(); else this.permits++;
  }
}
const slots = new Semaphore(3);

async function getJSON<T>(url: string, ms = 9000): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

type ImageInfo = {
  thumburl?: string;
  url?: string;
  thumbwidth?: number;
  width?: number;
  height?: number;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: string }>;
};
type Page = { title?: string; index?: number; imageinfo?: ImageInfo[] };

const stripTags = (s: string) =>
  s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// Maps, seals, logos and satellite shots are not destination photos.
const BAD = /map|location|logo|seal|flag|coat.of.arms|diagram|chart|poster|stamp|banknote|360|\.svg|sentinel|satellite/i;

function fromPage(p: Page): Photo | null {
  const ii = p.imageinfo?.[0];
  if (!ii) return null;
  const url = ii.thumburl || ii.url;
  if (!url) return null;
  const meta = ii.extmetadata ?? {};
  return {
    url,
    width: ii.thumbwidth ?? ii.width ?? 0,
    height: ii.height ?? 0,
    artist: stripTags(meta.Artist?.value ?? '') || 'Wikimedia Commons contributor',
    license: stripTags(meta.LicenseShortName?.value ?? '') || 'CC',
    file: p.title ?? '',
    page: ii.descriptionurl ?? '',
  };
}

async function byFile(file: string, width: number): Promise<Photo | null> {
  const title = file.startsWith('File:') ? file : `File:${file}`;
  const params = new URLSearchParams({
    action: 'query', titles: title, prop: 'imageinfo',
    iiprop: 'url|size|extmetadata', iiurlwidth: String(width), format: 'json', origin: '*',
  });
  const data = await getJSON<{ query?: { pages?: Record<string, Page> } }>(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  );
  for (const p of Object.values(data.query?.pages ?? {})) {
    const photo = fromPage(p);
    if (photo) return photo;
  }
  return null;
}

async function bySearch(query: string, width: number): Promise<Photo | null> {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6', gsrlimit: '8', prop: 'imageinfo',
    iiprop: 'url|size|extmetadata', iiurlwidth: String(width), format: 'json', origin: '*',
  });
  const data = await getJSON<{ query?: { pages?: Record<string, Page> } }>(
    `https://commons.wikimedia.org/w/api.php?${params}`,
  );
  const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  for (const p of pages) {
    if (BAD.test(p.title ?? '')) continue;
    if ((p.imageinfo?.[0]?.width ?? 0) < 900) continue;
    const photo = fromPage(p);
    if (photo) return photo;
  }
  return null;
}

async function resolveOne(d: { photo: { file?: string; query: string } }, width: number): Promise<Photo | null> {
  if (d.photo.file) {
    try {
      const photo = await byFile(d.photo.file, width);
      if (photo) return photo;
    } catch { /* fall through to search */ }
  }
  try {
    return await bySearch(d.photo.query, width);
  } catch {
    return null;
  }
}

export function resolvePhoto(id: string, size: PhotoSize = 'thumb'): Promise<Photo | null> {
  const key = `${id}:${size}`;
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);
  const busy = inflight.get(key);
  if (busy) return busy;
  const d = DESTINATIONS[id];
  if (!d) return Promise.resolve(null);
  const p = slots.acquire()
    .then(async () => {
      try {
        return await resolveOne(d, WIDTHS[size]);
      } finally {
        slots.release();
      }
    })
    .then(
      (photo) => { cache.set(key, photo); inflight.delete(key); return photo; },
      () => { cache.set(key, null); inflight.delete(key); return null; },
    );
  inflight.set(key, p);
  return p;
}
