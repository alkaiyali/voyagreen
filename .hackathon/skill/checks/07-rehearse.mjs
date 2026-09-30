// GATE 7 — rehearse: a fallback recording exists, the app survives a COLD
// restart, and the deck + script gates still hold after last-minute edits.
import fs from 'node:fs';
import path from 'node:path';
import { startApp, exists, run, readIf, layout } from '../lib.mjs';

export default async function gate(ctx) {
  const { proj, evid, cfg } = ctx;
  const pass = [], fail = [], warn = [];

  // 1. the backup recording — the highest-value insurance on stage
  const vids = ['demo-backup.mp4', 'demo-backup.mov', 'demo-backup.webm', 'demo-backup.mkv'];
  const vid = vids.map(v => path.join(layout(proj).present, v)).find(exists);
  if (!vid) {
    fail.push('no present/demo-backup.mp4 — record the demo path; live demos fail and video does not');
  } else {
    const kb = Math.round(fs.statSync(vid).size / 1024);
    if (kb < 20) fail.push(`demo-backup is only ${kb}KB — that is not a full recording`);
    else pass.push(`backup recording present (${kb}KB)`);

    const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', vid]);
    if (probe.status === 0) {
      const dur = Math.round(Number(probe.out.trim()));
      if (dur >= 15) pass.push(`recording is ${dur}s long`);
      else fail.push(`recording is only ${dur}s — too short to contain the demo path`);
    } else {
      warn.push('ffprobe not installed — skipped the video duration check');
    }
  }

  // 2. cold restart: prove it runs from scratch, not from a warm cache
  const app = await startApp({ proj: layout(proj).app, evid, cfg });
  if (app.ok) { pass.push(`cold restart passed (${app.url})`); app.stop(); }
  else fail.push(`cold restart FAILED — the demo may not survive: ${app.why}`);

  // 3. earlier gates must still hold
  for (const g of ['05-deck', '06-script']) {
    const mod = await import(new URL(`./${g}.mjs`, import.meta.url).href);
    const r = await mod.default(ctx);
    if (r.fail.length) fail.push(`gate '${g}' regressed: ${r.fail[0]}`);
    else pass.push(`gate '${g}' still green`);
  }

  // 4. every beat should map to a real screen
  const script = readIf(layout(proj).script);
  if (script === null) fail.push('no script.md — run `node harness.mjs script --init --force`');
  else if (/click|screen|button/i.test(script)) pass.push('script references concrete screens/buttons');
  else fail.push('script never says what to click — it will not survive contact with the demo');

  return { pass, fail, warn };
}

// Goal metadata — the human-readable twin of the gate above. The harness
// renders GOALS.md from this, so the checklist can never drift from the code.
export const meta = {
  title: 'Rehearse',
  owner: 'all three',
  criteria: [
    'backup recording (demo-backup.mp4) of the full demo path, 15s+',
    'cold restart passes — the app survives being killed and restarted',
    'deck and script gates still green after last-minute edits',
  ],
};
