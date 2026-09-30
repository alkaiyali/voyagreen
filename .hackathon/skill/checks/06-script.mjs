// GATE 6 — script: short enough to memorise, structured as beats, with the
// 30-second fallback and Q&A answers.
//
// It also enforces that the script is SYNCED TO THE DECK: every beat names a
// real slide, the slide numbers cover the deck, and the slide titles match what
// is actually on screen. A script that drifts from the slides is unmatched on
// stage, which is exactly when the operator advances at the wrong moment.
import path from 'node:path';
import { readIf, exists, placeholders, OPENER_BAD, CLOSER_BAD, cutList, cutClaims, layout } from '../lib.mjs';
import { deckSlides } from '../scripts/gen-script.mjs';

export default function gate({ proj }) {
  const pass = [], fail = [], warn = [];
  const f = layout(proj).script;

  if (!exists(f)) { fail.push('present/script.md is missing'); return { pass, fail, warn }; }
  pass.push('script.md exists');

  const md = readIf(f) || '';

  const hits = placeholders(md);
  if (hits.length) fail.push(`${hits.length} unfilled placeholder(s): ${hits.slice(0, 4).map(h => h.token).join(', ')}`);
  else pass.push('no unfilled placeholders');

  // ── spoken length ────────────────────────────────────────────────────────
  const sayLines = md.split('\n').filter(l => /\*\*say:?\*\*/i.test(l));
  let words, label;
  if (sayLines.length) {
    words = sayLines.join(' ').replace(/\*\*[^*]*\*\*/g, ' ').split(/\s+/).filter(Boolean).length;
    label = 'spoken words';
  } else {
    words = md.split(/\s+/).filter(Boolean).length;
    label = 'words (no **Say:** lines found)';
  }
  if (words > 340) fail.push(`${label}: ${words} — too long for 2 minutes (aim ~250)`);
  else if (words < 100) {
    fail.push(`${label}: ${words} — about ${Math.round(words / 150 * 60)}s of speech; a 2-minute demo needs ~250`);
    // point at the beats that need writing, so the fix is obvious
    const thin = md.split('\n')
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => /\*\*say:?\*\*/i.test(l))
      .map(([ln, l]) => [ln, l.replace(/.*\*\*say:?\*\*:?/i, '').replace(/\*\*/g, '').trim()])
      .filter(([, t]) => t.split(/\s+/).filter(Boolean).length < 10);
    if (thin.length) {
      fail.push(`    ${thin.length} beat(s) are a bare sentence — write them out:`);
      for (const [ln, t] of thin.slice(0, 4)) fail.push(`      line ${ln}: ${t.slice(0, 70)}`);
    }
    fail.push('    fill the intake prose (--hook, --how, --hardPart, --qa) or write the lines yourself');
  } else pass.push(`${label}: ${words} (target ~250, 2-min ceiling)`);

  // ── beats ────────────────────────────────────────────────────────────────
  const beats = sayLines.length || (md.match(/^###+ /gim) || []).length;
  if (beats >= 4) pass.push(`${beats} beats — enough structure to memorise`);
  else fail.push(`only ${beats} beats — break the script into per-slide beats`);

  if (/30[- ]?second/i.test(md)) pass.push('has a 30-second fallback');
  else fail.push('no 30-second short version');

  if (/Q\s*&\s*A|questions/i.test(md)) pass.push('has Q&A answers');
  else fail.push('no likely-questions section');

  const clicks = (md.match(/click(ed)?\s*:|\*\*(click|do|action)\*?\*?:/gi) || []).length;
  if (clicks >= 3) pass.push(`${clicks} beats have a concrete action`);
  else warn.push(`only ${clicks} beats specify what to click — the demo may drift`);

  // ── story: open on the person, end on the impact ─────────────────────────
  // The first 30 seconds decide a lot, and judges remember the last line.
  const beatsPart = md.split(/^##\s+30[- ]?second/im)[0];
  const said = beatsPart.split('\n')
    .filter(l => /\*\*say:?\*\*/i.test(l))
    .map(l => l.replace(/.*\*\*say:?\*\*:?\s*/i, '').replace(/\*\*\[DRAFT[^\]]*\]\*\*/g, '').replace(/^["“]|["”]\s*$/g, '').trim());
  if (said.length) {
    if (OPENER_BAD.test(said[0])) {
      fail.push(`opening line starts with an introduction: "${said[0].slice(0, 60)}"`);
      fail.push('    open with the person and the problem — the team name can wait (or never come)');
    } else pass.push('opens on the story, not an introduction');

    const last = said[said.length - 1];
    if (CLOSER_BAD.test(last)) {
      fail.push(`closing line ends on housekeeping: "${last.slice(-60)}"`);
      fail.push('    end on the impact and a tagline (intake --closer "...") — judges remember the last line');
    } else pass.push('closes on a line, not a "thank you"');

    let answers = {};
    try { answers = JSON.parse(readIf(path.join(proj, '.hackathon', 'answers.json')) || '{}'); } catch { /* none */ }
    const firstName = (/^[A-Z][A-Za-z'-]+/.exec(String(answers.character || '').trim()) || [''])[0];
    if (firstName) {
      if (said.slice(0, 2).some(s => s.includes(firstName))) pass.push(`${firstName} is in the first 30 seconds`);
      else warn.push(`${firstName} (your named person) is not in the first two beats — one named person beats any statistic`);
    }
  }

  // ── everything said must be true: nothing cut is presented as built ───────
  const lies = cutClaims(beatsPart, cutList(readIf(layout(proj).spec)));
  if (lies.length) {
    fail.push(`${lies.length} line(s) present a cut-list feature as if it exists — one judge question exposes it:`);
    for (const h of lies.slice(0, 4)) fail.push(`    line ${h.line} ("${h.term}"): ${h.text}`);
    fail.push('    say it is next / not built yet, or build it and take it off the cut list in SPEC.md');
  } else pass.push('no cut-list feature is presented as built');

  // ── no generated voice may survive ───────────────────────────────────────
  const drafts = (md.match(/\[DRAFT/g) || []).length;
  if (drafts) {
    const lines = md.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /\[DRAFT/.test(l));
    fail.push(`${drafts} line(s) are still generated drafts, not your words:`);
    for (const [ln, l] of lines.slice(0, 5)) {
      fail.push(`    line ${ln}: ${l.trim().slice(0, 90)}`);
    }
    fail.push('    the generator supplies structure and facts — the voice is yours (or the agent\'s, given the answers)');
  } else {
    pass.push('every spoken line is authored, not generated filler');
  }

  // ── sync with the deck ───────────────────────────────────────────────────
  const deckPath = path.join(layout(proj).deck, 'slides.html');
  if (!exists(deckPath)) {
    warn.push('no deck/slides.html — cannot verify the script is synced to the slides');
    return { pass, fail, warn };
  }

  const slides = deckSlides(readIf(deckPath));
  const total = slides.length;

  // slide references in the script, e.g. "### Beat 3 · Slide 4 — What we built"
  const refs = [...md.matchAll(/^###+\s*Beat[^\n]*?Slide\s+(\d+)\s*(?:—|-)\s*(.+?)\s*$/gim)]
    .map(m => ({ n: Number(m[1]), title: m[2].trim() }));

  if (!refs.length) {
    fail.push('no beat references a slide — the operator has no cue to advance on');
    fail.push('    each beat needs a line like: ### Beat 1 · Slide 1 — Title');
    return { pass, fail, warn };
  }
  pass.push(`${refs.length} beats reference a slide`);

  const nums = refs.map(r => r.n);
  const bad = nums.filter(n => n < 1 || n > total);
  if (bad.length) {
    fail.push(`script references slide(s) ${[...new Set(bad)].join(', ')} but the deck has ${total}`);
  } else {
    pass.push(`all slide references are within the deck (1–${total})`);
  }

  const missing = [];
  for (let i = 1; i <= total; i++) if (!nums.includes(i)) missing.push(i);
  if (missing.length) fail.push(`no beat covers slide(s) ${missing.join(', ')} — those would pass in silence`);

  // monotonic: the operator only ever moves forward
  let backwards = 0;
  for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) backwards++;
  if (backwards) fail.push(`the script jumps backwards ${backwards} time(s) — the operator cannot follow that`);
  else pass.push('slide order only moves forward');

  // titles must match what is actually on screen
  const mismatch = [];
  for (const r of refs) {
    const want = slides[r.n - 1]?.title;
    if (!want) continue;
    if (r.title.toLowerCase() !== want.toLowerCase()) mismatch.push(`slide ${r.n}: script says "${r.title}", deck says "${want}"`);
  }
  if (mismatch.length) {
    fail.push(`${mismatch.length} slide title(s) do not match the deck:`);
    fail.push(...mismatch.slice(0, 4).map(m => '    ' + m));
  } else pass.push('every beat title matches the deck');

  // ── advance cues ─────────────────────────────────────────────────────────
  const cues = (md.match(/^\*\*Operator:\*\*/gim) || []).length;
  if (cues >= refs.length) pass.push(`${cues} explicit advance cues for the operator`);
  else fail.push(`${refs.length} beats but only ${cues} operator cues — the operator needs one per beat`);

  const holds = (md.match(/HOLD|ADVANCE|END|SWITCH|AUTO/gi) || []).length;
  if (holds >= refs.length) pass.push('every cue says ADVANCE / HOLD / SWITCH / AUTO / END');
  else warn.push('some cues do not say ADVANCE, HOLD, SWITCH, AUTO or END explicitly');

  // the demo: every switch to the app needs a switch back — never strand the
  // operator on the app, and never end the pitch on it
  let onApp = false, strand = null;
  for (const [, cue] of md.matchAll(/^\*\*Operator:\*\*\s*(.+)$/gim)) {
    if (/SWITCH to the app/i.test(cue)) { if (onApp) strand = strand || 'switches to the app twice without coming back'; onApp = true; }
    else if (/SWITCH back/i.test(cue)) { if (!onApp) strand = strand || 'switches back to the deck without having left it'; onApp = false; }
  }
  if (onApp) strand = strand || 'switches to the app and never switches back — the pitch would end on the app';
  if (strand) fail.push(`demo switching is broken: the script ${strand}`);
  else if (/SWITCH to the app/i.test(md)) pass.push('the demo switches to the app and back to the deck');

  if (/cue sheet/i.test(md)) pass.push('has an operator cue sheet');
  else warn.push('no operator cue sheet table at the top');

  return { pass, fail, warn };
}

// Goal metadata — the human-readable twin of the gate above. The harness
// renders GOALS.md from this, so the checklist can never drift from the code.
export const meta = {
  title: 'Write the demo script',
  owner: 'pitcher',
  criteria: [
    '100–340 spoken words (~2 minutes, memorizable)',
    'at least 4 beats, plus a 30-second fallback and Q&A',
    'every beat names a real slide and tells the operator when to advance',
    'slide numbers cover the whole deck and only move forward',
    'the live demo switches to the app and back to the same slide — never stranded on the app',
    'opens on a named person and the problem — never a greeting or the team name',
    'ends on the impact and a tagline — never "thank you, any questions"',
    'nothing on the SPEC cut list is presented as built',
  ],
};
