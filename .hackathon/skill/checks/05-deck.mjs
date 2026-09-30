// GATE 5 — deck: RENDERS clean, no placeholders, sane slide count,
// and no unlabelled traction claims.
//
// The deck is deck/slides.html, parsed by lib.deckSlides — the same parser the
// script generator uses, so slide titles and order are read identically.
import path from 'node:path';
import { readIf, exists, placeholders, designTells, deckSlides, deckText, cutList, cutClaims, layout } from '../lib.mjs';
import { buildDeck } from '../scripts/build-deck.mjs';
import { readTokens, tokenFailures, isDarkTheme } from '../scripts/palette.mjs';

export default function gate({ proj }) {
  const pass = [], fail = [], warn = [];
  const deckDir = layout(proj).deck;
  const srcPath = path.join(deckDir, 'slides.html');

  if (!exists(srcPath)) {
    fail.push('present/deck/slides.html is missing — run: node harness.mjs deck --init --force');
    if (exists(path.join(deckDir, 'slides.md'))) fail.push('    (deck/slides.md is an old Marp source — it is no longer used)');
    return { pass, fail, warn };
  }
  pass.push('deck/slides.html exists');

  const src = readIf(srcPath) || '';
  const hits = placeholders(src);
  if (hits.length) {
    fail.push(`${hits.length} unfilled placeholder(s) — fix these before presenting:`);
    fail.push(...hits.slice(0, 8).map(h => `    line ${h.line}: ${h.token}`));
  } else {
    pass.push('no unfilled placeholders');
  }

  // Design rules: the deck must not ship the generic defaults either.
  const tells = designTells(src + '\n' + (readIf(path.join(deckDir, 'theme.css')) || ''));
  if (tells.length) {
    fail.push('generic design defaults in slides.html — the Design rules forbid these:');
    fail.push(...tells.map(t => `    ${t}`));
    fail.push('    swap --font-display / --font-body / --font-mono for a distinctive pairing');
  } else {
    pass.push('no generic fonts or icon packs');
  }

  // Palette: the deck's final colours (template defaults, then palette.css,
  // then theme.css) must clear AA — and should be the same palette as the app.
  const pal = readIf(path.join(deckDir, 'palette.css'));
  const theme = readIf(path.join(deckDir, 'theme.css')) || '';
  if (!pal) warn.push('no deck/palette.css — run: node harness.mjs palette "#<accent>" so the deck and the app share one palette');
  else pass.push('deck uses the shared palette');
  const redefined = pal ? [...theme.matchAll(/(--(?:bg|surface|text|text-muted|accent|ink|ink-2|paper|muted|glow)\b)\s*:/g)].map(m => m[1]) : [];
  if (redefined.length) warn.push(`theme.css redefines palette tokens (${[...new Set(redefined)].join(', ')}) — rerun palette with a new accent instead`);
  const deckTokens = readTokens(src, pal || '', theme);
  if (isDarkTheme(deckTokens)) warn.push('the deck is dark — a projector in a lit room washes dark themes to grey. Light is the default: node harness.mjs palette "<accent>" (only use --dark for a dark room)');
  const lowContrast = tokenFailures(deckTokens);
  if (lowContrast.length) {
    fail.push('deck colours fail WCAG AA contrast — unreadable on a projector:');
    for (const r of lowContrast) fail.push(`    ${r.name}: ${r.fg} on ${r.bg} is ${r.ratio.toFixed(2)}:1, needs ${r.min}:1`);
  } else pass.push('deck colours clear WCAG AA contrast');

  const slides = deckSlides(src);
  const rc = buildDeck({ deckDir, quiet: true });
  if (rc !== 0) {
    fail.push('deck check failed — run `node harness.mjs deck` to see why');
  } else if (slides.length < 4) {
    fail.push(`only ${slides.length} slides — a deck needs at least 4`);
  } else if (slides.length > (slides.some(sl => /reveal-video/.test(sl.body)) ? 6 : 5)) {
    fail.push(`${slides.length} slides is too many (max 5, plus the reveal video if you have one) — cut it down`);
  } else {
    pass.push(`${slides.length} slides`);
  }

  const text = deckText(src);
  for (const topic of ['problem', 'what we built', 'next']) {
    if (new RegExp(topic, 'i').test(text)) pass.push(`covers: ${topic}`);
    else warn.push(`deck has no '${topic}' slide`);
  }

  if (/traction|users|ARR|revenue/i.test(text) && !/project|demo|simulat|estimate|we asked|poll|survey/i.test(text))
    fail.push('slides imply real traction without saying where the number came from');
  else pass.push('numbers are sourced (measured) or labelled a projection');

  // one named person beats any statistic — they belong on the problem slide
  let answers = {};
  try { answers = JSON.parse(readIf(path.join(proj, '.hackathon', 'answers.json')) || '{}'); } catch { /* none */ }
  const firstName = (/^[A-Z][A-Za-z'-]+/.exec(String(answers.character || '').trim()) || [''])[0];
  if (!answers.character) warn.push('no named person recorded — intake --character "Bea, Grade 11, …" puts one on the problem slide');
  else if (!text.includes(firstName)) warn.push(`${firstName} (your named person) is not on any slide`);
  else pass.push(`${firstName} is on the deck`);

  // everything on a slide must be true. The What's-next slide is where cut
  // features belong, so it is the one place they may appear.
  // one line per block element, so "not" in one bullet cannot excuse another
  const lined = s => s.body.replace(/<\/(p|li|h[1-6]|tr|pre|div)>/gi, '\n').replace(/<[^>]*>/g, ' ');
  const shown = slides.filter(s => !/next/i.test(s.title)).map(lined).join('\n');
  const lies = cutClaims(shown, cutList(readIf(layout(proj).spec)));
  if (lies.length) {
    fail.push(`${lies.length} slide line(s) present a cut-list feature as built — move it to What's next, or build it:`);
    for (const h of lies.slice(0, 4)) fail.push(`    "${h.term}": ${h.text}`);
  } else pass.push('no cut-list feature is presented as built');

  return { pass, fail, warn };
}

// Goal metadata — the human-readable twin of the gate above. The harness
// renders GOALS.md from this, so the checklist can never drift from the code.
export const meta = {
  title: 'Build the deck',
  owner: 'pitcher',
  criteria: [
    'deck/slides.html exists, generated from the recorded answers',
    'zero unfilled placeholders',
    'no generic fonts or downloaded icon packs',
    '4–5 slides',
    'numbers are measured with a source, or labelled a projection — never implied traction',
    'nothing on the SPEC cut list is presented as built (only on What\'s next)',
  ],
};
