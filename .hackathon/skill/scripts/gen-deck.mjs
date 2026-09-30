#!/usr/bin/env node
// Generate deck/slides.html — a self-contained HTML deck — from the recorded
// intake answers.
//
// Structure comes from templates/deck.html so there is ONE source of truth for
// the slide list. Tokens we have data for get filled; lines we have no data for
// are dropped rather than faked; slides left with no content are removed.
// The result never contains a placeholder, so the deck gate passes on real
// content instead of an agent's imagination.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readIf, layout } from '../lib.mjs';

const firstSentence = (s, max = 96) => {
  const t = String(s || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const cut = t.split(/(?<=[.!?])\s/)[0];
  const out = cut.length <= max ? cut : t.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out.replace(/[.]$/, '');
};

const short = (s, max = 34) => {
  const t = String(s || '').trim().replace(/\s+/g, ' ');
  return t.length <= max ? t : t.slice(0, max).replace(/\s+\S*$/, '') + '…';
};

// The byline is the team's names, as they gave them: "Ana Cruz, Ben Reyes" -> "Ana Cruz · Ben Reyes".
// Role notes in parentheses are dropped; a long free-form answer is shortened.
const teamNames = (s) => {
  const raw = Array.isArray(s) ? s.join(', ') : String(s || '').trim();
  if (!raw) return '';
  const parts = raw.replace(/\([^)]*\)/g, '').split(/\s*(?:[,;·\n]|\band\b)\s*/).map(p => p.trim()).filter(Boolean);
  if (parts.length >= 1 && parts.length <= 6 && parts.every(p => p.split(/\s+/).length <= 4)) return parts.join(' · ');
  return short(raw, 72);
};

// The closing slide's title: the closer's tagline ("… Travel greener, not less." -> "Travel greener, not less").
const closingTitle = (closer) => {
  const sentences = String(closer || '').trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const tag = (sentences[sentences.length - 1] || '').replace(/[.!]$/, '');
  return tag && tag.length <= 40 ? tag : 'The close';
};

// Fonts ship with the skill so the deck never waits on a font CDN.
export function installDeckFonts(deckDir) {
  const src = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'fonts');
  const dst = path.join(deckDir, 'assets', 'fonts');
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dst, f));
}

// "voicetasks" -> "Voicetasks", "voice-tasks" -> "Voice Tasks", "IRCite" left alone
const titleCase = (s) => {
  const t = String(s || '').trim();
  if (!t) return 'Untitled';
  if (/[A-Z]/.test(t)) return t;
  return t.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// The intake answers, shaped once into the ordered token substitutions the
// deck template uses.
export function buildSubs(a, name, date = new Date()) {
  const demo = (a.demo || []).filter(Boolean);
  const painPoints = (a.painPoints || []).filter(Boolean);
  const next = (a.next || []).filter(Boolean);
  const impact = (a.impact || []).filter(i => i && i.metric && i.value);
  // measured evidence the team gathered — only ever shown with its source
  const proof = (a.proof || []).filter(p => p && p.claim && p.source);
  const stack = /decide for me/i.test(a.stack || '') ? 'Vanilla JS, single file' : (a.stack || '');
  const oneLiner = a.oneLiner ? String(a.oneLiner).trim() : firstSentence(a.idea, 96);

  const subs = [
    ['<PROJECT NAME>', a.appName ? String(a.appName).trim() : titleCase(name)],
    ['<CLOSING TITLE>', closingTitle(a.closer)],
    ['<one-liner: "X for Y, without Z">', oneLiner],
    ['<TEAM>', teamNames(a.team)],
    // the event's name, as the team gave it — never a generic "Hackathon · <month>" filler
    ['<HACKATHON>', String(a.event || '').trim()],
    ['<The person — name, who, one vivid moment>', String(a.character || '').trim()],
    ['<One bold statement of the pain.>', String(a.pain || '').trim()],
    ['<Pain point 1 — make it hurt>', painPoints[0] || ''],
    ['<Pain point 2>', painPoints[1] || ''],
    ['<Why now>', painPoints[2] || ''],
    ['<Demo step 1 — e.g. "Create a project in 10 seconds">', demo[0] || ''],
    ['<Demo step 2>', demo[1] || ''],
    ['<Demo step 3 — the wow moment>', demo[2] || ''],
    ['[ input ] ──▶ [ our magic ] ──▶ [ output ]',
      String(a.core || '').trim() ? `[ input ] ──▶ [ ${short(a.core, 30)} ] ──▶ [ result ]` : ''],
    ['<One sentence explaining the middle box.>', String(a.how || '').trim()],
    ['<stack>', stack],
    ['<stack or "none, clever client">',
      a.backend || (/static|single[- ]file|vanilla|client/i.test(stack) ? 'None — everything runs in the browser' : '')],
    ['<what was actually tricky>', String(a.hardPart || '').trim()],
    ['<Ambitious but plausible item 1>', next[0] || ''],
    ['<Item 2>', next[1] || ''],
    ['<Item 3>', next[2] || ''],
    ['<Proof 1>', proof[0]?.claim || ''],
    ['<Proof source 1>', proof[0]?.source || ''],
    ['<Proof 2>', proof[1]?.claim || ''],
    ['<Proof source 2>', proof[1]?.source || ''],
    // seeded numbers are labelled as what they are, on the slide itself
    ['<Projection note>', impact.length ? 'Projected from our seeded demo data — not traction.' : ''],
    ['<Repeating one-liner as closing beat.>', String(a.closer || '').trim() || oneLiner],
  ];
  return { demo, painPoints, next, impact, proof, stack, oneLiner, subs };
}

// Fill one line of any template: the ordered tokens, then the impact rows
// (which carry two identical `<big number>` tokens and must be filled in order).
export function fillTokens(text, subs, impact, impactState) {
  let out = text;
  for (const [tok, val] of subs) {
    if (!out.includes(tok)) continue;
    out = out.split(tok).join(val || '');
  }
  while (out.includes('<big number>')) {
    const row = impact[impactState.row] || impact[impactState.row - 1];
    out = out.replace('<big number>', row ? String(row.value) : '');
    impactState.row += 1;
  }
  while (out.includes('<metric from seed data>') || out.includes('<metric>')) {
    const idx = impactState.row >= 2 ? 1 : 0;
    const row = impact[idx];
    out = out.replace('<metric from seed data>', row ? row.metric : '')
             .replace('<metric>', row ? row.metric : '');
  }
  return out;
}

// Remove a whole <section|div|figure data-needs="key">…</…> when we have no
// data for it. None nests its own tag inside, so the non-greedy match is safe.
function dropSection(html, key) {
  const re = new RegExp(`\\n?\\s*<(section|div|figure)\\b[^>]*data-needs=["']${key}["'][^>]*>[\\s\\S]*?<\\/\\1>`, 'i');
  return html.replace(re, '');
}

// Fill templates/deck.html from the answers. Produces a finished,
// self-contained deck — no build step, because the file is the presentation.
// Hollow slides (no impact data, no next steps) are removed rather than faked.
export function generateDeck({ answers, name, date = new Date(), shot = false, reveal = false }) {
  const a = answers || {};
  const { impact, proof, next, subs } = buildSubs(a, name, date);

  const templatePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'deck.html');
  let template = readIf(templatePath);
  if (!template) throw new Error('templates/deck.html not found');

  if (!impact.length && !proof.length) template = dropSection(template, 'evidence');
  if (!impact.length) template = dropSection(template, 'impact');
  if (!shot) template = dropSection(template, 'shot');   // no screenshot yet: no empty frame
  if (!reveal) template = dropSection(template, 'reveal'); // no motion piece: no reveal slide
  if (!next.length) template = dropSection(template, 'next');

  const impactState = { row: 0 };
  template = template.split('\n')
    .map(line => fillTokens(line, subs, impact, impactState))
    .filter(line => {
      // hollow elements left behind by missing data are not content
      if (/^\s*<li>\s*<\/li>\s*$/.test(line)) return false;
      if (/^\s*<li>\s*<strong>[^<]*<\/strong>\s*[—–-]\s*<\/li>\s*$/.test(line)) return false;
      if (/^\s*<li>\s*<strong>\s*<\/strong>/.test(line)) return false;
      if (/<tr>/.test(line) && /<td>\s*<\/td>/.test(line)) return false;
      if (/^\s*<p[^>]*>\s*<\/p>\s*$/.test(line)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n\s*<pre[^>]*><code>\s*<\/code><\/pre>/g, '')
    .replace(/\n\s*<(ul|ol)\b[^>]*>\s*<\/\1>/g, '')
    .replace(/\n{3,}/g, '\n\n');
  return template;
}

// ── CLI: node scripts/gen-deck.mjs [projectDir] [--force] ──────────────────
if (process.argv[1]?.endsWith('gen-deck.mjs')) {
  const args = process.argv.slice(2);
  const proj = path.resolve(args.find(x => !x.startsWith('--')) || process.cwd());
  const force = args.includes('--force');
  const answersPath = path.join(proj, '.hackathon', 'answers.json');
  const statePath = path.join(proj, '.hackathon', 'state.json');
  if (!fs.existsSync(answersPath)) {
    console.error('gen-deck: no .hackathon/answers.json — run the intake first');
    process.exit(1);
  }
  const answers = JSON.parse(readIf(answersPath));
  const state = fs.existsSync(statePath) ? JSON.parse(readIf(statePath)) : {};
  const out = path.join(layout(proj).deck, 'slides.html');
  if (fs.existsSync(out) && !force) {
    console.error(`gen-deck: ${path.relative(proj, out)} already exists (--force to overwrite)`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const assets = path.join(layout(proj).deck, 'assets');
  installDeckFonts(layout(proj).deck);
  fs.writeFileSync(out, generateDeck({ answers, name: state.name, shot: fs.existsSync(path.join(assets, 'app.png')), reveal: fs.existsSync(path.join(assets, 'reveal.mp4')) }));
  console.log(`gen-deck: wrote ${path.relative(proj, out)}`);
  process.exit(0);
}
