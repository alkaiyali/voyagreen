import { createContext, useContext, useState, type ReactNode } from 'react';
import { DESTINATIONS, INDICATORS, type Destination, type Activity, type Slot } from '@/data/destinations';

// ── scoring (seeded, illustrative indicators — shown as "demo data") ──────
type IndicatorId = keyof Destination['indicators'];

export function score(d: Destination) {
  return Math.round(INDICATORS.reduce((s, i) => s + d.indicators[i.id as IndicatorId] * i.weight, 0));
}

export type Tone = 'danger' | 'warning' | 'success';
export function level(n: number): { label: string; short: string; tone: Tone } {
  if (n >= 65) return { label: 'High pressure', short: 'High', tone: 'danger' };
  if (n >= 45) return { label: 'Moderate pressure', short: 'Moderate', tone: 'warning' };
  return { label: 'Low pressure', short: 'Low', tone: 'success' };
}

// The indicator that pushes the score up the most — the one-line "why".
export function topFactor(d: Destination) {
  const i = [...INDICATORS].sort((a, b) => d.indicators[b.id as IndicatorId] - d.indicators[a.id as IndicatorId])[0];
  return { label: i.label, value: d.indicators[i.id as IndicatorId] };
}

// Plain-language phrase for an indicator when it runs high — the verdict line.
const HIGH_PHRASE: Record<IndicatorId, string> = {
  density: 'packed with visitors',
  capacity: 'past what it can absorb',
  environment: 'reef, water and waste under strain',
  peak: 'crowds bunched into peak season',
};

export function verdict(d: Destination) {
  const sc = score(d), lv = level(sc);
  if (lv.tone === 'success') return 'Few visitors for its size — your trip adds little strain.';
  const top = [...INDICATORS].sort((a, b) => d.indicators[b.id as IndicatorId] - d.indicators[a.id as IndicatorId]).slice(0, 2);
  const txt = top.map((i) => HIGH_PHRASE[i.id as IndicatorId]).join(', ');
  return txt[0].toUpperCase() + txt.slice(1) + '.';
}

// Greener places with the same vibe: low pressure, shares ≥2 vibes with the
// original, the seeded pairing first, then by fit with the traveler, then score.
export function alternatives(fromId: string, interests: string[], n = 3) {
  const from = DESTINATIONS[fromId];
  if (!from || score(from) < 45) return [];
  const fit = (id: string) => {
    const d = DESTINATIONS[id];
    const shared = d.vibe.filter((v) => from.vibe.includes(v)).length;
    const liked = interests.filter((x) => d.vibe.includes(x) || d.activities.some((a) => a.tags.includes(x))).length;
    return { shared, rank: (id === from.alt ? 100 : 0) + shared * 2 + liked * 3 - score(d) / 20 };
  };
  return Object.keys(DESTINATIONS)
    .filter((id) => id !== fromId && score(DESTINATIONS[id]) < 45 && fit(id).shared >= 2)
    .sort((a, b) => fit(b).rank - fit(a).rank)
    .slice(0, n);
}

export function matchPct(dest: Destination, interests: string[], fallback: string[]) {
  const want = interests.length ? interests : fallback;
  const hit = want.filter((w) => dest.vibe.includes(w) || dest.activities.some((a) => a.tags.includes(w))).length;
  return Math.round((hit / want.length) * 100);
}

export type Stop = { slot: Slot; t: string; tags: string[] };
export function buildItinerary(dest: Destination, days: number, interests: string[]): Stop[][] {
  const want = new Set(interests);
  const rank = (a: Activity) => a.tags.filter((t) => want.has(t)).length;
  const used = new Set<Activity>();
  const out: Stop[][] = [];
  for (let d = 0; d < days; d++) {
    out.push((['am', 'pm', 'eve'] as Slot[]).map((slot) => {
      const free = dest.activities.filter((a) => !used.has(a));
      const pick = [...free.filter((a) => a.slot === slot)].sort((a, b) => rank(b) - rank(a))[0]
        ?? [...free].sort((a, b) => rank(b) - rank(a))[0];
      if (!pick) {
        return { slot, t: slot === 'eve' ? 'Slow evening — dinner wherever the locals eat' : 'Free time — explore at your own pace', tags: [] };
      }
      used.add(pick);
      return { slot, t: pick.t, tags: pick.tags };
    }));
  }
  return out;
}

export const dest = (id: string | undefined) => (id && DESTINATIONS[id]) || DESTINATIONS.boracay;

// ── app state (in memory — no accounts in the MVP) ────────────────────────
export type SavedTrip = { id: string; from: string; days: number; savedAt: number };
type Ctx = {
  name: string; setName: (s: string) => void;
  interests: string[]; toggleInterest: (id: string) => void;
  days: number; setDays: (n: number) => void;
  trips: SavedTrip[]; saveTrip: (t: SavedTrip) => void;
  isSaved: (id: string, from: string) => boolean;
};

const TripCtx = createContext<Ctx | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('Kyla');
  const [interests, setInterests] = useState<string[]>(['beach', 'food', 'snorkeling']);
  const [days, setDays] = useState(3);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const toggleInterest = (id: string) =>
    setInterests((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const saveTrip = (t: SavedTrip) => setTrips((xs) => [t, ...xs.filter((x) => x.id !== t.id)]);
  const isSaved = (id: string, from: string) => trips.some((t) => t.id === id && t.from === from);
  return (
    <TripCtx.Provider value={{ name, setName, interests, toggleInterest, days, setDays, trips, saveTrip, isSaved }}>
      {children}
    </TripCtx.Provider>
  );
}

export function useTrip() {
  const c = useContext(TripCtx);
  if (!c) throw new Error('useTrip outside TripProvider');
  return c;
}
