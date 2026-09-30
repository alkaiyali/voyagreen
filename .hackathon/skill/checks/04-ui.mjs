// GATE 4 — ui: demo-ready. Real seed data, no filler copy, and a screenshot
// that was actually captured.
import fs from 'node:fs';
import path from 'node:path';
import { startApp, screenshot, walk, readIf, exists, designTells, layout } from '../lib.mjs';
import { readTokens, tokenFailures, isDarkTheme } from '../scripts/palette.mjs';

export default async function gate({ proj, evid, cfg }) {
  const pass = [], fail = [], warn = [];

  const L = layout(proj);
  const src = walk(L.app, n => /\.(html|js|jsx|ts|tsx|vue|svelte|css)$/.test(n));
  if (!src.length) {
    fail.push('no UI source files in present/app/');
    return { pass, fail, warn };
  }

  let filler = [];
  for (const f of src) {
    const t = readIf(f) || '';
    const m = t.match(/lorem ipsum|dolor sit amet|foo bar baz|john doe|jane smith/gi);
    if (m) filler.push(`${path.relative(proj, f)}: ${[...new Set(m.map(s => s.toLowerCase()))].join(', ')}`);
  }
  if (filler.length) {
    fail.push(`filler copy found in ${filler.length} file(s) — the demo path needs real data: ${filler.slice(0, 3).join(' · ')}`);
  } else pass.push('no lorem ipsum / filler names');

  let todos = 0;
  for (const f of src) todos += ((readIf(f) || '').match(/TODO:|FIXME/g) || []).length;
  if (todos) warn.push(`${todos} TODO/FIXME markers in UI source — make sure none are on the demo path`);
  else pass.push('no TODO/FIXME in UI source');

  // Design rules: no generic fonts, no downloaded icon packs. The defaults are
  // the loudest "untouched template" tell, so this blocks rather than warns.
  const tells = [];
  for (const f of src) {
    for (const tell of designTells(readIf(f) || '')) tells.push(`${path.relative(proj, f)}: ${tell}`);
  }
  if (tells.length) {
    fail.push('generic design defaults found — the Design rules forbid these:');
    fail.push(...tells.slice(0, 8).map(t => `    ${t}`));
    fail.push('    pick a distinctive font pairing; draw icons as inline SVG from the domain object');
  } else pass.push('no generic fonts or icon packs');

  // Palette: the app and the deck share palette.css, and every text colour
  // clears WCAG AA on the background it sits on.
  const pal = readIf(path.join(L.app, 'palette.css'));
  const cssSrc = src.filter(f => /\.(html|css)$/.test(f) && path.basename(f) !== 'palette.css').map(f => readIf(f) || '');
  const linksPalette = cssSrc.some(t => /palette\.css/.test(t));
  if (!pal) warn.push('no palette.css — run: node harness.mjs palette "#<accent>"  (the app and the deck then share one palette)');
  else if (!linksPalette) warn.push('palette.css exists but the app never links it — <link rel="stylesheet" href="palette.css"> before your own CSS');
  else pass.push('app uses the shared palette.css');
  const appTokens = readTokens(linksPalette ? pal : '', ...cssSrc);
  if (isDarkTheme(appTokens)) warn.push('the app is dark — a projector in a lit room washes dark themes to grey. Light is the default: node harness.mjs palette "<accent>" (only use --dark for a dark room)');
  const lowContrast = tokenFailures(appTokens);
  if (lowContrast.length) {
    fail.push('colours fail WCAG AA contrast — unreadable on a projector:');
    for (const r of lowContrast) fail.push(`    ${r.name}: ${r.fg} on ${r.bg} is ${r.ratio.toFixed(2)}:1, needs ${r.min}:1`);
    fail.push('    use the palette tokens (node harness.mjs palette) instead of hand-picked hexes');
  } else if (pal || linksPalette) pass.push('text colours clear WCAG AA contrast');

  const app = await startApp({ proj: L.app, evid, cfg });
  if (!app.ok) {
    fail.push(app.why);
  } else {
    const shot = path.join(evid, 'ui.png');
    const r = screenshot(app.url, shot);
    if (r.ok && r.size < 8000) fail.push(`screenshot is suspiciously small (${r.size} bytes) — the page may be blank`);
    else if (r.ok) {
      pass.push(`screenshot captured (${Math.round(r.size / 1024)}KB) at .hackathon/evidence/ui.png`);
      fs.writeFileSync(path.join(evid, 'ui.json'), JSON.stringify({ at: Date.now(), gate: 'ui', url: app.url, bytes: r.size }, null, 2));
    } else {
      warn.push(`could not capture a screenshot: ${r.why}`);
      warn.push('open the app yourself and confirm it is demo-ready before advancing');
    }
    app.stop();
  }

  const plan = (readIf(L.spec) || '') + (readIf(L.hackathon) || '');
  if (/seed|demo data|fixtures/i.test(plan)) pass.push('seed/demo data is mentioned in the plan');
  else warn.push('no mention of seed data in SPEC.md — confirm the demo path is populated');
  if (/domain object/i.test(plan)) pass.push('domain object chosen for the visual identity');
  else warn.push('no domain object in SPEC.md — one repeated object is what stops the UI looking generic');

  return { pass, fail, warn };
}

// Goal metadata — the human-readable twin of the gate above. The harness
// renders GOALS.md from this, so the checklist can never drift from the code.
export const meta = {
  title: 'Make it demo-ready',
  owner: 'driver',
  criteria: [
    'no lorem ipsum or filler copy anywhere on the demo path',
    'real-looking seed data so nothing is ever empty on stage',
    'no generic fonts (Inter, Roboto, JetBrains Mono…) or downloaded icon packs',
    'screenshot captured at .hackathon/evidence/ui.png',
  ],
};
