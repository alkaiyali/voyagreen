// Live occupancy signals — the app's one live-data feature.
//
// There is no public API for tourism occupancy, so this module *estimates*
// today's occupancy from real open signals, always labelled as an estimate:
//   · Wikipedia pageviews  — how much the place is being looked up (12 mo)
//   · Nager.Date           — upcoming PH public holidays / long weekends
//   · Open-Meteo           — rain probability and air quality at the place
// plus a time-of-day curve. Every fetch is independent: whatever succeeds is
// shown, and if nothing does the estimate falls back to a deterministic
// offline model (still labelled, never presented as measured).

import { useEffect, useState } from 'react';
import { DESTINATIONS, type Destination } from '@/data/destinations';
import { score } from '@/lib/trip';

export type Interest = {
  latest: number; avg: number; deltaPct: number; series: number[]; peakMonth: string;
};
export type Holiday = { name: string; date: string; daysAway: number; longWeekend: boolean };
export type Weather = { rainyDays: number; days: number; avgRain: number };
export type Air = { pm25: number; label: string };

export type LiveSignals = {
  offline: boolean;
  at: number;
  base: number;
  occupancy: number;
  reason: string;
  interest: Interest | null;
  holiday: Holiday | null;
  holidaysAhead: number;
  weather: Weather | null;
  air: Air | null;
  sources: string[];
};

const TTL = 30 * 60 * 1000;
const cache = new Map<string, LiveSignals>();
const inflight = new Map<string, Promise<LiveSignals>>();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const DAY = 86400000;

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

// The offline model needs a number that is stable per place + day, not random.
function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 997) / 997;
}

async function fetchInterest(d: Destination): Promise<Interest | null> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 13, 1);
  const from = `${start.getFullYear()}${pad(start.getMonth() + 1)}0100`;
  const to = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}00`;
  const title = encodeURIComponent(d.wiki.replace(/ /g, '_'));
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${title}/monthly/${from}/${to}`;
  const data = await getJSON<{ items?: { timestamp: string; views: number }[] }>(url);
  const thisMonth = `${now.getFullYear()}${pad(now.getMonth() + 1)}`;
  const items = (data.items ?? [])
    .filter((i) => i.timestamp.slice(0, 6) !== thisMonth)
    .slice(-12);
  if (items.length < 3) return null;
  const series = items.map((i) => i.views);
  const latest = series[series.length - 1];
  const avg = series.reduce((a, b) => a + b, 0) / series.length;
  let peak = 0;
  series.forEach((v, i) => { if (v > series[peak]) peak = i; });
  return {
    latest,
    avg: Math.round(avg),
    deltaPct: Math.round(((latest - avg) / Math.max(avg, 1)) * 100),
    series,
    peakMonth: MONTHS[Number(items[peak].timestamp.slice(4, 6)) - 1] ?? '',
  };
}

async function fetchHolidays(): Promise<{ holiday: Holiday | null; count: number }> {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const years = [now.getFullYear()];
  if (now.getMonth() === 11) years.push(now.getFullYear() + 1);
  const lists = await Promise.all(
    years.map((y) => getJSON<{ date: string; name: string; localName: string }[]>(`https://date.nager.at/api/v3/PublicHolidays/${y}/PH`)),
  );
  const upcoming = lists
    .flat()
    .map((h) => ({ ...h, at: new Date(`${h.date}T00:00:00`).getTime() }))
    .filter((h) => h.at >= midnight)
    .sort((a, b) => a.at - b.at);
  const first = upcoming[0];
  if (!first) return { holiday: null, count: 0 };
  const dow = new Date(first.at).getDay();
  return {
    holiday: {
      name: first.localName || first.name,
      date: `${MONTHS[new Date(first.at).getMonth()]} ${new Date(first.at).getDate()}`,
      daysAway: Math.round((first.at - midnight) / DAY),
      longWeekend: dow === 1 || dow === 5,
    },
    count: upcoming.filter((h) => (h.at - midnight) / DAY <= 60).length,
  };
}

async function fetchWeather(d: Destination): Promise<Weather | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${d.geo.lat}&longitude=${d.geo.lon}&daily=precipitation_probability_max&forecast_days=7&timezone=auto`;
  const data = await getJSON<{ daily?: { precipitation_probability_max?: number[] } }>(url);
  const probs = (data.daily?.precipitation_probability_max ?? []).filter((n) => typeof n === 'number');
  if (!probs.length) return null;
  return {
    rainyDays: probs.filter((p) => p >= 55).length,
    days: probs.length,
    avgRain: Math.round(probs.reduce((a, b) => a + b, 0) / probs.length),
  };
}

export function airLabel(aqi: number | null | undefined): string {
  if (aqi == null) return '—';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Poor for some';
  return 'Unhealthy';
}

async function fetchAir(d: Destination): Promise<Air | null> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${d.geo.lat}&longitude=${d.geo.lon}&current=pm2_5,us_aqi&timezone=auto`;
  const data = await getJSON<{ current?: { pm2_5?: number; us_aqi?: number } }>(url);
  const pm = data.current?.pm2_5;
  const aqi = data.current?.us_aqi;
  if (pm == null && aqi == null) return null;
  return { pm25: Math.round(pm ?? 0), label: airLabel(aqi) };
}

// The estimate: seeded baseline ± what the live signals say about *today*.
function estimate(id: string, base: number, interest: Interest | null, holiday: Holiday | null, weather: Weather | null) {
  const now = new Date();
  const season = interest
    ? clamp(Math.round((interest.latest / Math.max(interest.avg, 1) - 1) * 25), -14, 16)
    : Math.round(hash01(id + now.getMonth()) * 16 - 8);
  const holidayLift = !holiday ? 0
    : holiday.daysAway <= 7 ? 12 : holiday.daysAway <= 14 ? 8 : holiday.daysAway <= 30 ? 4 : 0;
  const weekendLift = holiday && holiday.longWeekend && holiday.daysAway <= 30 ? 3 : 0;
  const rainDrop = weather ? clamp(Math.round((weather.avgRain - 25) / 7.5), 0, 10) : 0;
  const hour = now.getHours();
  const time = hour < 7 ? -10 : hour < 10 ? -3 : hour < 16 ? 6 : hour < 19 ? 1 : -5;

  const occupancy = clamp(Math.round(base + season + holidayLift + weekendLift - rainDrop + time), 4, 98);
  const reason =
    holiday && holiday.daysAway <= 14
      ? `A public holiday ${holiday.daysAway === 0 ? 'today' : `in ${holiday.daysAway} day${holiday.daysAway > 1 ? 's' : ''}`} usually lifts visits.`
      : season >= 6
        ? 'Interest is above its yearly average this month.'
        : season <= -6 || rainDrop >= 6
          ? 'Low season and wet days keep this quieter than usual.'
          : 'About typical for this time of year.';
  return { occupancy, reason };
}

async function compute(id: string): Promise<LiveSignals> {
  const d = DESTINATIONS[id] ?? DESTINATIONS.boracay;
  const [ri, rh, rw, ra] = await Promise.allSettled([
    fetchInterest(d), fetchHolidays(), fetchWeather(d), fetchAir(d),
  ]);
  const interest = ri.status === 'fulfilled' ? ri.value : null;
  const hol = rh.status === 'fulfilled' ? rh.value : null;
  const weather = rw.status === 'fulfilled' ? rw.value : null;
  const air = ra.status === 'fulfilled' ? ra.value : null;

  const sources: string[] = [];
  if (interest) sources.push('Wikipedia pageviews');
  if (hol?.holiday) sources.push('Nager.Date holidays');
  if (weather) sources.push('Open-Meteo forecast');
  if (air) sources.push('Open-Meteo air');
  const offline = !interest && !hol?.holiday && !weather && !air;

  const base = score(d);
  const { occupancy, reason } = estimate(id, base, interest, hol?.holiday ?? null, weather);
  return {
    offline, at: Date.now(), base, occupancy, reason,
    interest, holiday: hol?.holiday ?? null, holidaysAhead: hol?.count ?? 0,
    weather, air, sources,
  };
}

export function getLiveSignals(id: string): Promise<LiveSignals> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL) return Promise.resolve(hit);
  const busy = inflight.get(id);
  if (busy) return busy;
  const p = compute(id).then(
    (s) => { cache.set(id, s); inflight.delete(id); return s; },
    () => { inflight.delete(id); return compute(id); },
  );
  inflight.set(id, p);
  return p;
}

export function useLiveSignals(id: string | undefined) {
  const [state, setState] = useState<{ id: string; data: LiveSignals } | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true;
    getLiveSignals(id).then((data) => { if (alive) setState({ id, data }); });
    return () => { alive = false; };
  }, [id]);
  // Derive rather than reset: a different id is "loading" until its data lands.
  return state && state.id === id ? { loading: false, data: state.data } : { loading: true, data: null };
}
