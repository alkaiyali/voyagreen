#!/usr/bin/env node
// hackathon harness — the loop as code, not as advice.
// Cross-platform (Windows / macOS / Linux). Node built-ins only.
//
//   node harness.mjs start <dir> [--name n] [--context files…]   bootstrap + init + stash context, one step
//   node harness.mjs install [--force]  make /hackathon available everywhere (Claude Code + OpenCode)
//   node harness.mjs next --json        one loop step for an agent: gate result, action, human-only items
//   node harness.mjs handoff            write HANDOFF.md: what is ready, what only a human can do
//   node harness.mjs tidy [--apply]     move an older project into present/ + .hackathon/ and refresh its skill copy
//   node harness.mjs bootstrap <dir>    install the skill into a new project
//   node harness.mjs init <name> [--hours 4] [--deadline 18:00]
//   node harness.mjs ask [--json]       the intake questions (schema; agents render it)
//   node harness.mjs ask --pending [--user]  only the answers still missing or thin (--user: only what a person must answer)
//   node harness.mjs intake --answers answers.json [--report]   record (merges; --fresh resets)
//   node harness.mjs palette <#accent> [--dark]     pro-grade palette.css for the app AND the deck (light by default)
//   node harness.mjs impact "metric=value" ...       record demo numbers for the deck
//   node harness.mjs deck --init [--force]  generate deck/slides.html from answers
//   node harness.mjs script --init [--force]         generate script.md synced to the deck
//   node harness.mjs status [--json]
//   node harness.mjs check [phase]      run the gates for a phase
//   node harness.mjs done [--note "..."] advance ONLY if the gates pass
//   node harness.mjs next               the single next action
//   node harness.mjs deck [--images]    build the deck through its gate
//   node harness.mjs smoke              start the app, hit it, stop it
//   node harness.mjs verify             run every gate up to the current phase
//   node harness.mjs log <message>      append to the decision log
//   node harness.mjs goals              show the goal list with owners
//   node harness.mjs timeline           show the phase windows against the clock
//   node harness.mjs note "..."        append to NOTES.md (decisions, learnings)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { red, green, yellow, dim, bold, blue, run, startApp, readIf, isWin, OPENER_BAD, CLOSER_BAD, LIMIT_Q, layout } from './lib.mjs';

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
// What a project's copy of the skill contains. The skill's own folder can hold
// other things (a website, .git), so copies are whitelisted, never wholesale.
const SKILL_FILES = ['SKILL.md', 'harness.mjs', 'lib.mjs', 'checks', 'scripts', 'templates'];
const ENTRY = `// Project entry point — pure Node, identical on Windows / macOS / Linux.\n// Run from this directory: node harness.mjs <command>\nimport './.hackathon/skill/harness.mjs';\n`;
function copySkill(dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of SKILL_FILES) fs.cpSync(path.join(SKILL_DIR, f), path.join(dest, f), { recursive: true });
}
const PROJ = process.env.HACKATHON_DIR ? path.resolve(process.env.HACKATHON_DIR) : process.cwd();
const STATE_DIR = path.join(PROJ, '.hackathon');
const STATE_FILE = path.join(STATE_DIR, 'state.json');
const LOG_FILE = path.join(STATE_DIR, 'log.jsonl');
const EVID = path.join(STATE_DIR, 'evidence');
// where everything lives: present/ (what you show) and .hackathon/ (what the agent uses)
const L = layout(PROJ);

export const PHASES = ['idea', 'spec', 'build', 'ui', 'deck', 'script', 'rehearse', 'done'];
const DEADLINE_MIN = { idea: 8, spec: 15, build: 135, ui: 165, deck: 195, script: 210, rehearse: 240, done: 240 };

const die = msg => { console.error(red(`harness: ${msg}`)); process.exit(2); };

// ── state ──────────────────────────────────────────────────────────────────
function load() {
  const raw = readIf(STATE_FILE);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { die(`${STATE_FILE} is corrupt — fix or delete it`); }
}
function save(s) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  s.updatedAt = Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2) + '\n');
}
function requireInit() {
  const s = load();
  if (!s) die('not initialised here. run: node harness.mjs init <name>');
  if (oldLayout().length) console.error(yellow(`harness: old layout (${oldLayout().slice(0, 3).join(', ')} at the root) — run: node harness.mjs tidy --apply`));
  return s;
}
// files a pre-`present/` project keeps at its root
function oldLayout() {
  return ['SPEC.md', 'HACKATHON.md', 'GOALS.md', 'deck', 'script.md', 'index.html', 'package.json', '.pi']
    .filter(f => fs.existsSync(path.join(PROJ, f)));
}
function logEvent(event, phase, detail) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, JSON.stringify({ at: Date.now(), event, phase, detail }) + '\n');
}

// ── goals, timeline, notes ─────────────────────────────────────────────────
// Human- and agent-readable twins of the machine state. GOALS.md criteria come
// straight from each check's `meta` export, so the checklist can never drift
// from the gates that enforce it.
function checkFile(phase) {
  return path.join(SKILL_DIR, 'checks', `${String(phaseIdx(phase) + 1).padStart(2, '0')}-${phase}.mjs`);
}
async function loadMetas() {
  const out = {};
  for (const p of PHASES) {
    if (p === 'done') continue;
    try {
      const mod = await import(pathToFileURL(checkFile(p)).href);
      out[p] = mod.meta || { title: p, owner: '?', criteria: [] };
    } catch { out[p] = { title: p, owner: '?', criteria: [] }; }
  }
  return out;
}
const hhmm = ts => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
function completions() {
  const done = {};
  const raw = readIf(LOG_FILE);
  if (!raw) return done;
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if ((e.event === 'advance' || e.event === 'force-advance') && typeof e.detail === 'string') {
        const m = /^from=([a-z]+)/.exec(e.detail);
        if (m) done[m[1]] = e.at;
      }
    } catch { /* ignore corrupt lines */ }
  }
  return done;
}
async function renderGoals(s) {
  const metas = await loadMetas();
  const doneAt = completions();
  const cur = s.phase;
  const L = [`# Goals — ${s.name}`, ''];
  if (cur === 'done') {
    L.push(`All 7 goals complete in ${fmtClock(elapsedMin(s))}. Ship it.`, '');
  } else {
    const m = metas[cur];
    L.push(`**Current goal: ${phaseIdx(cur) + 1}/7 · ${cur} — ${m.title}** (owner: ${m.owner}).`, '');
    L.push('Success looks like:', ...m.criteria.map(c => `- [ ] ${c}`), '');
    L.push(`Verify with \`node harness.mjs check ${cur}\`, advance with \`node harness.mjs done\`.`, '');
  }
  L.push('## All goals', '');
  for (const p of PHASES) {
    if (p === 'done') continue;
    const i = phaseIdx(p), m = metas[p];
    const isDone = cur === 'done' || i < phaseIdx(cur);
    const mark = isDone ? 'x' : ' ';
    const when = doneAt[p] ? ` (done ${hhmm(doneAt[p])})` : '';
    const arrow = p === cur ? ' ← current' : '';
    L.push(`- [${mark}] **${i + 1} · ${p} — ${m.title}** · ${m.owner}${when}${arrow}`);
    for (const c of m.criteria) L.push(`  - [${isDone ? 'x' : ' '}] ${c}`);
  }
  L.push('', `_Regenerated ${new Date().toISOString()} by the harness from the gate definitions. Don't hand-edit the checkboxes — run the gates._`);
  fs.writeFileSync(layout(PROJ).goals, L.join('\n') + '\n');
}
async function renderTimeline(s) {
  const metas = await loadMetas();
  const scale = (s.hours || 4) / 4;
  const L = [`# Timeline — ${s.hours || 4}h${s.deadline ? ` · deadline ${s.deadline}` : ''}${s.startedAt ? ` · started ${hhmm(s.startedAt)}` : ''}`, ''];
  L.push('| Elapsed | Clock | Phase | Owner |', '|---|---|---|---|');
  let prev = 0;
  for (const p of PHASES) {
    if (p === 'done') continue;
    const end = DEADLINE_MIN[p] * scale;
    const clock = s.startedAt ? `${hhmm(s.startedAt + prev * 60000)}–${hhmm(s.startedAt + end * 60000)}` : '—';
    L.push(`| ${fmtClock(prev)}–${fmtClock(end)} | ${clock} | ${p} — ${metas[p].title} | ${metas[p].owner} |`);
    prev = end;
  }
  L.push('', '_Windows are budgets, not appointments. Past a window? Cut scope — deck and script outrank UI polish._');
  fs.writeFileSync(layout(PROJ).timeline, L.join('\n') + '\n');
}
function cmdNote(args) {
  const msg = args.join(' ').trim();
  if (!msg) die('usage: harness.mjs note "what we decided or learned"');
  const f = L.notes;
  if (!fs.existsSync(f)) {
    const s = load();
    fs.writeFileSync(f, `# Notes — ${(s && s.name) || path.basename(PROJ)}\n\nDecisions, learnings, and things the next session must know. Newest at the bottom. The harness never overwrites this file.\n`);
  }
  fs.appendFileSync(f, `\n## ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n${msg}\n`);
  logEvent('note', (load() || {}).phase || '?', msg.slice(0, 120));
  console.log(`noted in ${path.relative(process.cwd(), f) || 'NOTES.md'}`);
  return 0;
}
async function cmdGoals() {
  const s = requireInit();
  await renderGoals(s);
  console.log(readIf(L.goals));
  return 0;
}
async function cmdTimeline() {
  const s = requireInit();
  await renderTimeline(s);
  console.log(readIf(L.timeline));
  return 0;
}
export function elapsedMin(s) {
  if (!s.startedAt) return 0;
  const e = Math.floor((Date.now() - s.startedAt) / 60000);
  if (e < 0 || e > (s.hours || 4) * 60 * 3) return 0;
  return e;
}
export const fmtClock = min => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
const phaseIdx = p => PHASES.indexOf(p);

// ── gate runner ────────────────────────────────────────────────────────────
async function runGate(phase) {
  const file = checkFile(phase);
  if (!fs.existsSync(file)) return { pass: [], fail: [`no gate script for '${phase}'`], warn: [] };
  const mod = await import(pathToFileURL(file).href);
  const cfg = loadConfig();
  const ctx = { proj: PROJ, evid: EVID, stateDir: STATE_DIR, cfg, phase };
  try {
    const r = await mod.default(ctx);
    return { pass: r.pass || [], fail: r.fail || [], warn: r.warn || [], evidence: r.evidence };
  } catch (err) {
    return { pass: [], fail: [`gate crashed: ${err.message}`], warn: [] };
  }
}
function loadConfig() {
  const f = path.join(STATE_DIR, 'config.json');
  const raw = readIf(f);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
function printResult(r) {
  for (const p of r.pass) console.log(`  ${green('✓')} ${p}`);
  for (const w of r.warn) console.log(`  ${yellow('!')} ${w}`);
  for (const f of r.fail) console.log(`  ${red('✗')} ${f}`);
}

// ── intake questions ───────────────────────────────────────────────────────
// Structured so an AI agent's question tool (Claude Code's AskUserQuestion, the
// `question` tool, a dialog UI) can render them directly: id + header + options
// + required + why. `ask --json` emits this array; `ask --json --pending` emits
// only what is still missing or thin, so the AGENT conducts the interview and
// the harness stays the contract, not the interviewer.
const QUESTIONS = [
  {
    id: 'idea', header: 'The idea', type: 'text', required: true,
    question: "What's the idea, in a sentence or two?",
    why: 'your elevator pitch and the deck’s one-liner',
  },
  {
    id: 'who', header: 'Who & the win', type: 'text', required: true,
    question: 'Who uses it, and what do they win? ("<who> uses it to <win>")',
    why: 'who the pitch speaks to, and the framing of the problem slide',
  },
  {
    id: 'core', header: 'Core feature', type: 'text', required: true,
    question: 'What is the ONE thing that must work in the live demo?',
    why: 'the feature the whole build and demo path protect',
  },
  {
    id: 'demo', header: 'Demo path', type: 'text', required: false,
    question: 'What are the 3 steps of the live demo? (screen 1 → screen 2 → the wow moment)',
    why: 'the script’s beats and the what-we-built slide',
  },
  {
    id: 'domainObject', header: 'Domain object', type: 'text', required: false,
    question: "Pick ONE object from the product's world to repeat everywhere (UI, icon, deck) — an image, SVG or 3D model. e.g. \"capsule\", \"blister pack\", \"pulse trace\". What is it?",
    why: 'the single object repeated across the UI, the icon and the deck',
  },
  {
    id: 'stack', header: 'Stack', type: 'select', required: false,
    question: 'Any preference for the stack? (single-file static HTML is the default — zero install, fastest to a demo)',
    why: 'how the build gate starts your app',
    options: ['single-file static HTML (recommended)', 'React Native (Expo) — the brief asks for a mobile app', 'decide for me', 'Vite + React', 'Vite + Svelte', 'Next.js', 'Python (FastAPI / Flask)'],
  },
  {
    id: 'hours', header: 'Time budget', type: 'select', required: false,
    question: 'How long do you have?',
    why: 'the phase timeline',
    options: ['4 hours', '8 hours', '12 hours', '24 hours', 'other'],
  },
  {
    id: 'pain', header: 'The pain', type: 'text', required: false,
    question: 'What is the pain today, in ONE sentence? (this is your problem slide)',
    why: 'the problem slide headline',
  },
  {
    id: 'character', header: 'The person', type: 'text', required: false,
    question: 'Who is ONE real person with this problem? A first name, who they are, and one vivid moment. e.g. "Bea, Grade 11, refreshing five Facebook pages at 5 AM to find out if classes are suspended"',
    why: 'the opening line and the problem slide — one named person beats any statistic',
  },
  {
    id: 'painPoints', header: 'Pain bullets', type: 'text', required: false,
    question: 'Two or three supporting pain bullets, comma-separated. (optional)',
    why: 'the problem slide bullets',
  },
  {
    id: 'hook', header: 'Opening line', type: 'text', required: false,
    question: 'Your opening line for the demo — the first sentence out of your mouth. (optional)',
    why: 'the first line of the script',
  },
  {
    id: 'proof', header: 'Local proof', type: 'text', required: false,
    question: 'Any evidence you gathered yourselves? e.g. poll 20–30 people who have the problem. Format: "result | how you got it", separated by ; — e.g. "23 of 30 students we asked had gone to school on a suspended day | hallway poll, Grade 11, Sep 30"',
    why: 'the impact slide, as MEASURED — real and local beats any national statistic',
  },
  {
    id: 'closer', header: 'Closing line', type: 'text', required: false,
    question: 'Your last line: the impact, plus a tagline. Judges remember the last thing they hear. (never "thank you, any questions?")',
    why: 'the final beat of the script and the closing line on the last slide',
  },
  {
    id: 'qa', header: 'Hard questions', type: 'text', required: false,
    question: 'The 3 hardest questions you expect, and your one-line answers — include the one you fear most: what does not work yet, or what is faked in the demo. Format: "question | answer", separated by ;',
    why: 'the likely-questions section — at least one judge probes, and a calm, true answer wins the room',
  },
  {
    id: 'pitch30', header: '30-second pitch', type: 'text', required: false,
    question: 'If you had 30 seconds and no demo, what would you say? (optional)',
    why: 'the 30-second fallback if the clock runs out',
  },
  {
    id: 'event', header: 'Event', type: 'text', required: false,
    question: 'What is the hackathon called? (shown on the cover — e.g. "DevCon Kids Hackathon 2026")',
    why: 'the cover kicker — without it the cover names no event',
  },
  {
    id: 'next', header: "What's next", type: 'text', required: false,
    question: "Two or three things you'd build next, comma-separated. (optional)",
    why: "the what's-next slide",
  },
  {
    id: 'team', header: 'Team', type: 'text', required: false,
    question: "Your teammates' names, as they should appear on the slides (comma-separated; roles in brackets if you like — driver / pitcher / runner)",
    why: 'the byline on the cover and closing slides, and HACKATHON.md roles',
  },
];

// Who can answer each question. Only the user knows the idea, the event, the
// team, the time budget, and real proof. Everything else an agent can derive
// from the idea with common sense — so in autopilot it drafts those itself
// (listing them in `decided`) instead of asking.
const USER_ONLY = new Set(['idea', 'event', 'team', 'hours', 'proof']);
for (const q of QUESTIONS) q.by = USER_ONLY.has(q.id) ? 'user' : 'agent';

// A present-but-weak answer is as costly as a missing one: it produces a deck
// and a script that say nothing. These are the "ask again" cases. Kept next to
// the questions so the schema and the bar never drift apart.
const wordCount = v => String(v || '').trim().split(/\s+/).filter(Boolean).length;
const countOf = v => Array.isArray(v) ? v.filter(Boolean).length : (String(v || '').trim() ? 1 : 0);
const THIN = {
  idea: v => wordCount(v) < 6 ? 'needs a sentence or two — right now it is a fragment' : null,
  who: v => wordCount(v) < 4 ? 'say who uses it and what they win' : null,
  core: v => wordCount(v) < 2 ? 'name the ONE feature, specifically' : null,
  demo: v => countOf(v) < 2 ? 'give at least two steps of the demo' : null,
  pain: v => wordCount(v) < 4 ? 'one sentence that makes the pain land' : null,
  painPoints: v => countOf(v) < 2 ? 'two or three supporting bullets' : null,
  hook: v => wordCount(v) < 3 ? 'the first sentence you will actually say'
    : OPENER_BAD.test(String(v).trim()) ? 'open with the person and the problem, not your team name or a greeting' : null,
  character: v => wordCount(v) < 6 ? 'give them a first name and ONE specific, vivid moment'
    : !/^[A-Z][a-z]+/.test(String(v).trim()) ? 'start with their first name — "Bea, Grade 11, …"' : null,
  proof: v => {
    const items = parseProof(v);
    if (!items.length) return 'each item needs "result | how you got it" — unsourced numbers are not proof';
    if (!items.some(i => /\d/.test(i.claim))) return 'give the number — "23 of 30 students…", not "most students"';
    return null;
  },
  closer: v => wordCount(v) < 5 ? 'the impact plus a tagline — the line they will remember'
    : CLOSER_BAD.test(String(v)) ? 'end on the impact, not "thank you" or "any questions"' : null,
  qa: v => {
    const items = parseQa(v);
    if (items.length < 3) return 'at least 3 — the probing judge asks the one you skipped';
    if (!items.some(i => LIMIT_Q.test(i.q))) return 'add the one you fear: what does not work yet, or what is faked in the demo';
    return null;
  },
  next: v => countOf(v) < 2 ? 'two or three concrete items' : null,
};

// Optional answers that are not required to pass the idea gate, but each one
// directly unlocks something downstream (see its `why`). Missing them is why a
// thin intake produces a thin pitch — so the interviewer is told now, not at
// deck time. A value here is an extra *consequence* worth spelling out.
const RECOMMEND = {
  demo: null,
  character: 'without a named person the opening falls back to the idea — a statistic, not a story',
  pain: null,
  painPoints: null,
  hook: null,
  qa: null,
  proof: 'a 20-minute poll of real people is the most persuasive number you can have',
  closer: 'without it the last line is generated and the script gate will block',
  team: 'the cover and closing slides show your names — ask for them, never invent them',
  event: 'the cover names the event — ask for it, never fill in a generic "Hackathon"',
};

// The open questions an AI interviewer should ask next, given what is recorded.
// `missing` blocks the gate; `thin` is present but too vague to pitch;
// `recommended` is absent and would cost you a slide or a beat.
function gapsFor(a) {
  const gaps = [];
  for (const q of QUESTIONS) {
    const raw = (a || {})[q.id];
    const present = countOf(raw) > 0;
    if (!present) {
      if (q.required) gaps.push({ id: q.id, header: q.header, question: q.question, why: q.why, by: q.by, kind: 'missing' });
      else if (q.id in RECOMMEND) gaps.push({ id: q.id, header: q.header, question: q.question, why: q.why, by: q.by, kind: 'recommended', hint: RECOMMEND[q.id] || undefined });
      continue;
    }
    const check = THIN[q.id];
    const hint = check ? check(raw) : null;
    if (hint) gaps.push({ id: q.id, header: q.header, question: q.question, why: q.why, by: q.by, kind: 'thin', hint });
  }
  return gaps;
}


// "Question | Answer" (repeatable, or ;-separated) -> [{q,a}]
// Split "a | b; c | d" into pairs — but only at a `;` that starts a new pair,
// so an answer may itself contain a semicolon.
const splitPairs = val => (Array.isArray(val) ? val : String(val || '').split(/\s*;\s*(?=[^;|]*\|)/)).filter(Boolean);

function parseQa(val) {
  const items = splitPairs(val);
  return items.map(v => {
    if (v && typeof v === 'object') return v;
    const [q, ...rest] = String(v).split('|');
    return { q: (q || '').trim(), a: rest.join('|').trim() };
  }).filter(i => i.q && i.a);
}

// "23 of 30 students … | hallway poll, Sep 30" or {claim,source} -> {claim,source}.
// A claim without a source is dropped: an unsourced number is not proof.
function parseProof(val) {
  const items = splitPairs(val);
  return items.map(v => {
    if (v && typeof v === 'object') return { claim: String(v.claim || '').trim(), source: String(v.source || '').trim() };
    const [claim, ...rest] = String(v).split('|');
    return { claim: (claim || '').trim(), source: rest.join('|').trim() };
  }).filter(i => i.claim && i.source);
}

// "Minutes saved per week=40" or {metric,value} -> {metric,value}
function parseImpact(val) {
  const items = Array.isArray(val) ? val : [val];
  return items.map(v => {
    if (v && typeof v === 'object') return v;
    const [metric, ...rest] = String(v).split('=');
    return { metric: (metric || '').trim(), value: rest.join('=').trim() };
  }).filter(i => i.metric && i.value);
}

function cmdAsk(args) {
  const asJson = args.includes('--json');
  const pending = args.includes('--pending') || args.includes('--gaps');
  const ai = args.indexOf('--answers');

  // ── pending mode: only what is missing or thin, for an AI interviewer ────
  if (pending) {
    const file = ai >= 0 ? path.resolve(args[ai + 1]) : path.join(STATE_DIR, 'answers.json');
    let recorded = {};
    if (fs.existsSync(file)) { try { recorded = JSON.parse(readIf(file)); } catch { recorded = {}; } }
    // --user: only what a person must answer; the agent drafts the rest
    const gaps = gapsFor(recorded).filter(g => !args.includes('--user') || g.by === 'user');
    if (asJson) {
      console.log(JSON.stringify({ recorded: fs.existsSync(file), count: gaps.length, gaps }, null, 2));
      return 0;
    }
    if (!gaps.length) {
      console.log(`${green('✓')} nothing pending — every answer is present and specific.`);
      console.log(dim('  next   node harness.mjs intake --answers answers.json'));
      return 0;
    }
    console.log(bold('Re-ask only these — everything else is already recorded.'));
    console.log('');
    gaps.forEach((g, i) => {
      console.log(`${bold(String(i + 1))}. [${g.kind}] ${g.question}`);
      console.log(dim(`     feeds: ${g.why}${g.hint ? ` · ${g.hint}` : ''}`));
    });
    console.log('');
    console.log(`Record with ${bold('harness.mjs intake --answers answers.json')} (merges over what is there)`);
    return 0;
  }

  if (asJson) {
    console.log(JSON.stringify(QUESTIONS, null, 2));
    return 0;
  }
  console.log(bold('Ask the user these before writing anything.') +
    dim('  (an agent can render them with its question tool; ask --json)'));
  console.log('');
  QUESTIONS.forEach((q, i) => {
    console.log(`${bold(String(i + 1))}. ${q.question}${q.required ? red(' *required') : ''}`);
    if (q.options) console.log(dim(`     ${q.options.map((o, j) => `${String.fromCharCode(97 + j)}) ${o}`).join('   ')}`));
  });
  console.log('');
  console.log(`Record the answers with ${bold('harness.mjs intake --answers answers.json')}`);
  console.log(dim('After a first pass, re-ask only what is weak: harness.mjs ask --pending'));
  return 0;
}

// "a; b; c", "1. a 2. b", "a → b → c" or one per line -> [a, b, c]. Commas split only
// when nothing else does, and never for the demo path (its steps contain commas).
function toList(v, key = '') {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
  const t = String(v || '').trim();
  if (!t) return [];
  const numbered = t.split(/\s*(?:^|\s)\d+[.)]\s+/).map(x => x.trim()).filter(Boolean);
  if (numbered.length > 1) return numbered.map(x => x.replace(/[;,]\s*$/, ''));
  const strong = t.split(/\s*(?:;|\n|→|->)\s*/).filter(Boolean);
  if (strong.length > 1 || key === 'demo') return strong;
  return t.split(/\s*,\s*/).filter(Boolean);
}

// Accept answers from a JSON file, inline JSON, or flags. Writes the intake
// record and scaffolds HACKATHON.md + SPEC.md from the user's own words.
function cmdIntake(args) {
  let a = {};
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    if (k === '--fresh' || k === '--report') continue;      // valueless output/mode flags
    if (k === '--force') { a.force = true; continue; }
    if (k === '--answers' || k === '--json') {
      const v = args[++i];
      if (!v) die(`${k} needs a value`);
      let raw = v;
      if (!/^\s*[{[]/.test(v)) raw = readIf(path.resolve(v)) || die(`cannot read ${v}`);
      try { Object.assign(a, JSON.parse(raw)); } catch (e) { die(`bad JSON in ${v}: ${e.message}`); }
    } else if (k.startsWith('--')) {
      const key = k.slice(2);
      const val = args[++i];
      if (val === undefined) die(`${k} needs a value`);
      if (['demo', 'painPoints', 'next'].includes(key)) {
        a[key] = toList(val, key);
      } else if (key === 'qa') {
        a.qa = [...(a.qa || []), ...parseQa(val)];
      } else if (key === 'impact') {
        a.impact = [...(a.impact || []), ...parseImpact(val)];
      } else if (key === 'decided' || key === 'sources') {
        a[key] = [...(a[key] || []), ...String(val).split(/\s*,\s*/).filter(Boolean)];
      } else if (key === 'proof') {
        const items = parseProof(val);
        if (!items.length) die('--proof needs "result | how you got it" — an unsourced number is not proof');
        a.proof = [...(a.proof || []), ...items];
      } else {
        a[key] = val;
      }
    }
  }

  // Merge over anything already recorded, so an agent that re-asks only the
  // weak answers (ask --pending) does not wipe the rest. `--fresh` opts out.
  // Provenance lists (decided, sources) accumulate instead of being replaced.
  const answersFile = path.join(STATE_DIR, 'answers.json');
  const hadAnswers = fs.existsSync(answersFile);
  if (!args.includes('--fresh') && hadAnswers) {
    try {
      const old = JSON.parse(readIf(answersFile));
      const union = k => [...new Set([...(old[k] || []), ...toList(a[k] ?? [])])];
      const decided = union('decided'), sources = union('sources');
      a = Object.assign({}, old, a, { decided, sources });
    } catch { /* keep a */ }
  }
  // List answers may arrive as one string from a JSON file too — never drop them silently.
  for (const k of ['demo', 'painPoints', 'next', 'decided', 'sources']) if (a[k] != null) a[k] = toList(a[k], k);

  const report = args.includes('--report');
  // In report mode stdout is the JSON contract; the human prose goes nowhere,
  // so an agent can parse the output without stripping commentary.
  const say = (...m) => { if (!report) console.log(...m); };

  const gaps = gapsFor(a);
  const missing = gaps.filter(g => g.kind === 'missing').map(g => g.id);
  if (missing.length) {
    if (report) {
      console.log(JSON.stringify({ ok: false, recorded: false, missing, gaps }, null, 2));
    } else {
      console.log(red('intake: missing required answers:') + ' ' + missing.join(', '));
      console.log('');
      cmdAsk([]);
    }
    return 1;
  }

  // normalise the demo path into 3 steps, proposing one if the user had none
  let demo = Array.isArray(a.demo) ? a.demo.map(s => String(s).trim()).filter(Boolean) : [];
  let demoProposed = false;
  if (demo.length < 3) {
    demo = [`Open the app with the ${String(a.core).trim().toLowerCase()} flow ready`,
            String(a.core).trim(),
            'See the result on screen, live'];
    demoProposed = true;
  }

  const rec = {
    at: Date.now(),
    idea: String(a.idea).trim(),
    who: String(a.who).trim(),
    core: String(a.core).trim(),
    demo: demo.slice(0, 3),
    demoProposed,
    domainObject: String(a.domainObject || '').trim(),
    pain: String(a.pain || '').trim(),
    painPoints: (Array.isArray(a.painPoints) ? a.painPoints : []).filter(Boolean).slice(0, 3),
    hook: String(a.hook || '').trim(),
    character: String(a.character || '').trim(),
    closer: String(a.closer || '').trim(),
    proof: parseProof(a.proof || []).slice(0, 2),
    how: String(a.how || '').trim(),
    hardPart: String(a.hardPart || '').trim(),
    pitch30: String(a.pitch30 || '').trim(),
    qa: parseQa(a.qa || []).slice(0, 4),
    event: String(a.event || '').trim(),
    // the product's name exactly as written on the slides ("VoyaGreen"), and an
    // optional short one-liner for the cover (else the idea's first sentence)
    appName: String(a.appName || '').trim(),
    oneLiner: String(a.oneLiner || '').trim(),
    next: (Array.isArray(a.next) ? a.next : []).filter(Boolean).slice(0, 3),
    impact: Array.isArray(a.impact) ? a.impact.slice(0, 2) : [],
    stack: a.stack || 'decide for me',
    hours: a.hours || '',
    team: a.team || '',
    // provenance: which answers the agent wrote (autopilot) rather than the
    // user, and which context files the facts came from — handoff lists both
    decided: [...new Set(Array.isArray(a.decided) ? a.decided : [])],
    sources: [...new Set(Array.isArray(a.sources) ? a.sources : [])],
  };

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(path.join(STATE_DIR, 'answers.json'), JSON.stringify(rec, null, 2) + '\n');

  // scaffold HACKATHON.md (never clobber a file the team has edited)
  const hk = L.hackathon;
  if (!fs.existsSync(hk) || a.force) {
    fs.writeFileSync(hk, `# Hackathon: ${String(a.name || 'unnamed').trim()}\n\n` +
      `## Idea\n${rec.idea}\n\n` +
      `Who it is for: ${rec.who}\n\n` +
      `## Core feature\n${rec.core}\n\n` +
      `## Demo path\n${rec.demo.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
      `## Team\n${rec.team || 'see HACKATHON team split'}\n\n` +
      `## Source\nIntake answers recorded in .hackathon/answers.json (from the user, ${new Date().toISOString()}).\n`);
    say(`  ${green('✓')} wrote HACKATHON.md`);
  } else {
    say(`  ${dim('-')} HACKATHON.md exists, left alone (--force to rewrite)`);
  }

  // scaffold SPEC.md
  const sp = L.spec;
  if (!fs.existsSync(sp) || a.force) {
    const stack = /decide for me|single-file static/i.test(rec.stack)
      ? 'Single-file static HTML + vanilla JS (fastest to demo). Add a backend only if the wow moment needs it.'
      : rec.stack;
    fs.writeFileSync(sp, `# Spec\n\n` +
      `## Elevator pitch\n${rec.idea}\n\n` +
      `## Core feature\n${rec.core}\nThis is the one thing that must work live.\n\n` +
      `## Demo path\n${rec.demo.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
      `## Stack\n${stack}\n\n` +
      `## Design\n` +
      (rec.domainObject
        ? `- **Domain object**: ${rec.domainObject} — the same object, repeated at different crops, scales and angles across the UI and the deck. One object reads as identity; a family reads as stock.\n`
        : `- **Domain object**: pick ONE object from the product's world and repeat it everywhere (UI, deck, favicon). One object reads as identity; a family reads as stock.\n`) +
      `- **One accent colour**, emphasis only — never a blue→purple gradient.\n` +
      `- **Type**: Lane A (default) **Satoshi** + **Azeret Mono** · Lane B (dense/technical) **IBM Plex Sans** + **IBM Plex Mono**. Never Inter, Roboto, JetBrains Mono or a bare system font.\n` +
      `- **Icons**: inline SVG, never a downloaded default pack (Lucide, Heroicons, Feather, Font Awesome, Material, Bootstrap, Phosphor, Tabler). Lane A: **Mynaui** (MIT) · Lane B: **Fluent** (MIT, regular + filled for active states).\n\n` +
      `## Cut list (non-goals)\n- Auth, accounts, persistence\n- Deployment polish\n- Tests beyond the demo path\n`);
    say(`  ${green('✓')} wrote SPEC.md`);
  } else {
    say(`  ${dim('-')} SPEC.md exists, left alone (--force to rewrite)`);
  }

  // if the clock is already running, let the answers set hours/deadline
  const s = load();
  if (s) {
    const h = /(\d+)\s*hour/i.exec(rec.hours);
    if (h) { s.hours = Number(h[1]); if (a.deadline) s.deadline = a.deadline; save(s); }
  }
  logEvent('intake', (load() || {}).phase || 'idea', `core=${rec.core}`);

  // Machine-readable report for an AI interviewer: what is now recorded, and
  // which optional answers are still thin enough to be worth one more pass.
  if (args.includes('--report')) {
    console.log(JSON.stringify({ ok: true, recorded: true, merged: hadAnswers && !args.includes('--fresh'), gaps: gapsFor(rec) }, null, 2));
    return 0;
  }

  say('');
  say(`${green(bold('intake recorded'))} — .hackathon/answers.json`);
  if (demoProposed) {
    say(yellow('  ! the demo path was proposed by the harness, not the user.'));
    say(yellow('    Confirm it with them before you present.'));
  }
  say(`  next   ${bold('node harness.mjs done')}  (advances idea -> spec)`);
  return 0;
}

// One accent in, a complete palette out — written once for the app (./palette.css)
// and once for the deck (deck/palette.css), so both are the same product.
async function cmdPalette(args) {
  requireInit();
  const accent = args.find(a => !a.startsWith('--'));
  if (!accent) die('usage: harness.mjs palette <#accent> [--dark]   e.g. palette "#E8A33D"   (light is the default — projectors)');
  const { generatePalette, checks, renderCss, renderJs } = await import(pathToFileURL(path.join(SKILL_DIR, 'scripts', 'palette.mjs')).href);
  let p;
  try { p = generatePalette(accent, { mode: args.includes('--dark') ? 'dark' : 'light' }); } catch (e) { die(e.message); }
  const css = renderCss(p);
  fs.mkdirSync(L.app, { recursive: true });
  fs.writeFileSync(path.join(L.app, 'palette.css'), css);
  fs.writeFileSync(path.join(L.app, 'palette.js'), renderJs(css));
  fs.mkdirSync(L.deck, { recursive: true });
  fs.writeFileSync(path.join(L.deck, 'palette.css'), css);
  const t = p.tokens;
  console.log(`${green('✓')} present/app/palette.css + palette.js + present/deck/palette.css — ${p.mode}, accent ${t.accent}${t.accentText !== t.accent ? dim(` · accent-coloured text uses --accent-text ${t.accentText} to stay readable`) : ''}`);
  console.log(dim(`  neutrals ${p.warm ? 'cool slate (the accent is warm — warm on warm reads as mud)' : 'tinted toward the accent'}`));
  for (const r of checks(p)) console.log(`  ${r.ok ? green('✓') : red('✗')} ${r.name.padEnd(20)} ${r.ratio.toFixed(2)}:1 ${dim(`(AA ${r.min})`)}`);
  for (const c of p.clashes) console.log(yellow(`  ! ${c}`));
  console.log('');
  console.log(`  ${bold('app')}   <link rel="stylesheet" href="palette.css"> before your own CSS; use var(--bg), var(--text); var(--accent) for fills, var(--accent-text) for accent-coloured text`);
  console.log(`  ${bold('native')} React Native / Expo: import { palette } from './palette' (palette.bg, palette.accent, palette.successBg…)`);
  console.log(`  ${bold('deck')}  already linked — theme.css must not redefine these tokens`);
  console.log(`  ${bold('svg')}   inline SVGs cannot read CSS variables — use these hexes: accent ${t.accent} · ${[300, 500, 700, 900].map(k => `${k} ${t.ramp[k]}`).join(' · ')} · surface ${t.surface}`);
  logEvent('palette', load().phase, `accent=${t.accent} mode=${p.mode}`);
  return 0;
}

// Record demo/seed numbers after the build so the deck can show them.
function cmdImpact(args) {
  const file = path.join(STATE_DIR, 'answers.json');
  if (!fs.existsSync(file)) die('no intake yet — run: harness.mjs intake first');
  const a = JSON.parse(readIf(file));
  const items = parseImpact(args.filter(x => !x.startsWith('--')));
  if (!items.length) {
    console.log('usage: harness.mjs impact "Minutes saved per week=40" "Blockers surfaced=3"');
    console.log(dim(a.impact?.length ? `currently recorded: ${a.impact.map(i => `${i.metric}=${i.value}`).join(', ')}` : 'none recorded yet'));
    return 1;
  }
  a.impact = items.slice(0, 2);
  fs.writeFileSync(file, JSON.stringify(a, null, 2) + '\n');
  console.log(`${green(bold('impact recorded'))} — ${a.impact.map(i => `${i.metric}=${i.value}`).join(', ')}`);
  console.log(`  ${dim('demo numbers are labelled as a projection on the slide')}`);
  console.log(`  next   ${bold('node harness.mjs deck --init --force')}  to put them on the impact slide`);
  return 0;
}

// ── script generation ──────────────────────────────────────────────────────
async function cmdScript(args) {
  requireInit();
  if (args.includes('--init')) {
    const answersPath = path.join(STATE_DIR, 'answers.json');
    const htmlPath = path.join(L.deck, 'slides.html');
    const deckPath = fs.existsSync(htmlPath) ? htmlPath : null;
    if (!fs.existsSync(answersPath)) {
      console.log(red('  ✗ no intake recorded'));
      return 1;
    }
    if (!deckPath) {
      console.log(red('  ✗ no deck source — the script is synced to the deck'));
      console.log(dim('      run: harness.mjs deck --init --force'));
      return 1;
    }
    const out = L.script;
    if (fs.existsSync(out) && !args.includes('--force')) {
      console.log(`  ${dim('-')} script.md exists, left alone (--force to regenerate)`);
    } else {
      const { generateScript, deckSlides } = await import(pathToFileURL(path.join(SKILL_DIR, 'scripts', 'gen-script.mjs')).href);
      const answers = JSON.parse(readIf(answersPath));
      const s = load() || {};
      const deckSrc = readIf(deckPath) || '';
      fs.writeFileSync(out, generateScript({ answers, deckText: deckSrc, name: s.name }));
      const slides = deckSlides(deckSrc).length;
      console.log(`  ${green('✓')} generated script.md synced to ${slides} slides, one beat each`);
      console.log(`  ${dim('the operator cue sheet is at the top — open it on the deck machine')}`);
    }
  }
  return 0;
}

// Install this skill into a new project dir so the project is self-contained
// (committable, and every teammate gets the same harness).
function cmdBootstrap(args, { quiet = false } = {}) {
  const target = args.find(a => !a.startsWith('--'));
  if (!target) die('usage: harness.mjs bootstrap <new-project-dir>');
  const dest = path.resolve(target);
  const skillDest = path.join(layout(dest).agent, 'skill');     // the project's own copy, with the agent's files

  if (fs.existsSync(skillDest)) {
    console.log(`  ${dim('-')} skill already installed at ${path.relative(process.cwd(), skillDest)}`);
  } else {
    copySkill(skillDest);
    console.log(`  ${green('✓')} installed the hackathon skill into ${path.relative(process.cwd(), skillDest)}`);
  }

  // Claude Code discovers skills under .claude/skills — point it at the same
  // copy rather than a second one that can drift. Relative symlink on POSIX (so
  // it survives a clone); a junction on Windows (no admin needed); copy if both fail.
  const claudeSkill = path.join(dest, '.claude', 'skills', 'hackathon');
  if (!fs.existsSync(claudeSkill)) {
    fs.mkdirSync(path.dirname(claudeSkill), { recursive: true });
    try {
      if (isWin) fs.symlinkSync(skillDest, claudeSkill, 'junction');
      else fs.symlinkSync(path.relative(path.dirname(claudeSkill), skillDest), claudeSkill);
      console.log(`  ${green('✓')} linked the skill for Claude Code (.claude/skills/hackathon)`);
    } catch {
      fs.cpSync(skillDest, claudeSkill, { recursive: true });   // skillDest is already the whitelisted copy
      console.log(`  ${green('✓')} copied the skill for Claude Code (.claude/skills/hackathon)`);
    }
  }

  // install the subagents (image-scout, deck-designer) for whichever harness
  // the project uses — Claude Code and OpenCode each read their own folder
  const agentTpl = path.join(SKILL_DIR, 'templates', 'agents');
  const HARNESSES = [['claude', '.claude'], ['opencode', '.opencode']];
  const installed = [];
  for (const agent of ['image-scout', 'deck-designer']) {
    for (const [tool, dir] of HARNESSES) {
      const src = path.join(agentTpl, `${agent}.${tool}.md`);
      const f = path.join(dest, dir, 'agents', `${agent}.md`);
      if (!fs.existsSync(src) || fs.existsSync(f)) continue;
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.copyFileSync(src, f);
      installed.push(`${agent} (${tool})`);
    }
  }
  if (installed.length) console.log(`  ${green('✓')} installed subagents: ${installed.join(', ')}`);

  // phase transitions commit if this is a git repo — give the project one
  if (!fs.existsSync(path.join(dest, '.git'))) {
    const g = run('git', ['init', '-q'], { cwd: dest });
    if (g.status === 0) console.log(`  ${green('✓')} git initialised (phase transitions will commit)`);
    else console.log(`  ${dim('-')} not a git repo — phase transitions will skip committing`);
  }

  fs.mkdirSync(path.join(dest, '.hackathon', 'evidence'), { recursive: true });
  // the two places things go: what you show, and what the agent uses
  for (const d of [layout(dest).app, layout(dest).deck]) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(dest, 'harness.mjs'),
    ENTRY);
  console.log(`  ${green('✓')} entry point: ${path.join(path.relative(process.cwd(), dest) || '.', 'harness.mjs')} (no shell, no wrappers — just node)`);
  const rel = path.relative(process.cwd(), dest) || '.';
  if (quiet) return 0;
  console.log('');
  console.log(`${bold('next:')}`);
  console.log(`  cd ${rel}`);
  console.log(`  node harness.mjs ask       ${dim('# put these to the user')}`);
  console.log(`  node harness.mjs init <name> --hours 4 --deadline <HH:MM>`);
  console.log(`  node harness.mjs intake --answers answers.json`);
  console.log('');
  console.log(dim('  then just run: harness.mjs done   — it advances only when the gates pass'));
  return 0;
}

// ── commands ───────────────────────────────────────────────────────────────
async function cmdInit(args) {
  const name = args[0];
  if (!name) die('usage: harness.mjs init <name> [--hours 4] [--deadline 18:00]');
  let hours = 4, deadline = '';
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--hours') hours = Number(args[++i]);
    else if (args[i] === '--deadline') deadline = args[++i];
    else die(`unknown option: ${args[i]}`);
  }
  fs.mkdirSync(EVID, { recursive: true });
  const st = { name, phase: 'idea', startedAt: Date.now(), hours, deadline, skips: [] };
  save(st);
  logEvent('init', 'idea', `name=${name} hours=${hours} deadline=${deadline}`);
  await renderGoals(st);
  await renderTimeline(st);
  console.log(`${bold('harness initialised')} — ${name}`);
  console.log(`  project : ${PROJ}`);
  console.log(`  deadline: ${deadline || 'none set'}   budget: ${hours}h`);
  console.log(`  state   : ${path.relative(PROJ, STATE_FILE)}`);
  console.log('');
  console.log(`next: write HACKATHON.md, then ${bold('node harness.mjs done')}`);
}

async function cmdStatus(args) {
  const s = requireInit();
  const e = elapsedMin(s);
  const bd = DEADLINE_MIN[s.phase];
  if (args.includes('--json')) {
    console.log(JSON.stringify({
      name: s.name, phase: s.phase, elapsedMin: e, phaseBudgetMin: bd,
      remainingMin: bd - e, overBudget: e > bd, totalMin: s.hours * 60,
    }));
    return 0;
  }
  const total = s.hours * 60;
  if (s.phase === 'done') {
    console.log(`${bold(s.name)}  ${dim('·')}  ${green('all phases complete')}`);
    console.log(`  clock  ${dim(`${fmtClock(e)} elapsed of ${s.hours}h`)}`);
    if (s.skips?.length) console.log(`  ${yellow(`${s.skips.length} gate(s) were force-skipped — see .hackathon/log.jsonl`)}`);
    console.log('');
    console.log(`  next   ${bold('node harness.mjs verify — then go present')}`);
    return 0;
  }
  console.log(`${bold(s.name)}  ${dim('·')}  phase ${blue(s.phase)}  ${dim(`(${phaseIdx(s.phase) + 1}/7)`)}`);
  if (e > bd) {
    console.log(`  clock  ${red(`${fmtClock(e)} elapsed — ${bold(fmtClock(e - bd))} past the ${s.phase} budget`)}`);
    console.log(`  ${yellow('-> cut polish, jump to the deck')}`);
  } else {
    console.log(`  clock  ${dim(`${fmtClock(e)} elapsed · ${fmtClock(bd - e)} left here · ${fmtClock(total - e)} of ${s.hours}h left`)}`);
  }
  console.log('');
  printResult(await runGate(s.phase));
  if (s.skips?.length) console.log(yellow(`  ${s.skips.length} gate(s) force-skipped — see .hackathon/log.jsonl`));
  console.log('');
  console.log(`  next   ${bold(nextAction(s.phase))}`);
  console.log(dim('  goals  GOALS.md · timeline TIMELINE.md · note it: node harness.mjs note "..."'));
  return 0;
}

async function cmdCheck(args) {
  const s = requireInit();
  const phase = args[0] || s.phase;
  console.log(bold(`gates: ${phase}`));
  const r = await runGate(phase);
  printResult(r);
  console.log('');
  if (r.fail.length) {
    console.log(`${red(bold('GATES FAILED'))} — fix the ✗ lines. You cannot advance.`);
    return 1;
  }
  console.log(`${green(bold('ALL GATES PASS'))} — ready to advance.`);
  return 0;
}

async function cmdDone(args) {
  const s = requireInit();
  let note = '', force = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--note') note = args[++i];
    else if (args[i] === '--force') force = true;
  }
  if (s.phase === 'done') { console.log('already done.'); return cmdVerify([]); }

  console.log(bold(`checking gates for '${s.phase}'`));
  let r = await runGate(s.phase);

  if (r.fail.length) {
    printResult(r);
    console.log('');
    const from = s.phase;
    const next = PHASES[phaseIdx(from) + 1];
    if (force) {
      s.skips = [...(s.skips || []), { from, at: Date.now(), note }];
      s.phase = next;
      save(s);
      logEvent('force-advance', next, `from=${from} note=${note}`);
      await renderGoals(s);
      await renderTimeline(s);
      console.log(yellow(`GATES FAILED — advanced anyway to '${next}'. This skip is recorded.`));
      return 0;
    }
    console.log(`${red(bold('REFUSED'))} — phase stays '${s.phase}'.`);
    console.log(`Fix the ✗ lines, then run ${bold('node harness.mjs done')} again.`);
    console.log(dim('(--force advances anyway and writes a skip record to the log)'));
    return 1;
  }

  // gate may also need to stop a server it started — gates handle that themselves
  printResult(r);
  const from = s.phase;
  const next = PHASES[phaseIdx(from) + 1];
  s.phase = next;
  save(s);
  logEvent('advance', next, `from=${from} note=${note}`);
  await renderGoals(s);
  await renderTimeline(s);

  if (fs.existsSync(path.join(PROJ, '.git'))) {
    run('git', ['add', '-A'], { cwd: PROJ });
    const c = run('git', ['commit', '-qm', `phase: ${next}${note ? ' — ' + note : ''}`], { cwd: PROJ });
    if (c.status === 0) console.log(dim(`  committed: phase: ${next}`));
  }

  console.log('');
  console.log(`${green(bold('ADVANCED'))}  ${from} -> ${blue(next)}`);
  console.log(`  next   ${bold(nextAction(next))}`);
  return 0;
}

// ── autopilot: one prompt in, pitch-ready out ─────────────────────────────
// The harness cannot write the app — the agent does. These commands make the
// agent's loop mechanical: `start` sets everything up in one step, `next --json`
// is one loop iteration's worth of truth, and `handoff` is the stopping point.

// What only a human can do. The autopilot stops here instead of faking it.
function humanItems(s, a = {}) {
  const items = [];
  if (!(a.proof || []).length)
    items.push({ id: 'proof', do: 'Poll 20–30 people who have the problem, then: node harness.mjs intake --proof "23 of 30 … | how you asked"  and regenerate deck + script', why: 'real local proof beats any statistic — and it must not be invented' });
  const blank = ['event', 'team'].filter(k => !String(a[k] || '').trim());
  if (blank.length)
    items.push({ id: 'title', do: `Add ${blank.join(' and ')} for the title slide: node harness.mjs intake ${blank.map(k => `--${k} "…"`).join(' ')}, then regenerate the deck`, why: 'only you know these' });
  if (a.demoProposed)
    items.push({ id: 'demo', do: 'Confirm the demo path in SPEC.md — the harness proposed it', why: 'you will click it live' });
  const decided = (a.decided || []).filter(Boolean);
  if (decided.length)
    items.push({ id: 'voice', do: `Read and rewrite in your own voice: ${decided.join(', ')} (agent-written, see .hackathon/answers.json)`, why: 'you are the one saying it on stage' });
  if (decided.includes('character'))
    items.push({ id: 'character', do: 'The named person is a composite from your context — swap in someone real you know, or present them as an example, never as a real user', why: 'everything you say has to be true' });
  if (fs.existsSync(path.join(L.deck, 'slides.html')) && !fs.existsSync(path.join(L.deck, 'theme.css')))
    items.push({ id: 'design', do: 'The design pass has not run — it belongs to @deck-designer (the pinned design model). Run `node ~/repos/hackathon/harness.mjs install`, restart the session, then ask for the deck design pass', why: 'the deck is still the bare template' });
  if (phaseIdx(s.phase) >= phaseIdx('rehearse')) {
    items.push({ id: 'video', do: 'Screen-record the 3-step demo path as present/demo-backup.mp4 (15s+)', why: 'live demos fail; video does not' });
    items.push({ id: 'rehearse', do: 'Run the full pitch out loud, timed, with a teammate playing the judge who probes', why: 'confidence and energy cannot be generated' });
  }
  return items;
}

async function cmdNext(args) {
  const s = requireInit();
  if (!args.includes('--json')) { console.log(nextAction(s.phase)); return 0; }
  let a = {};
  try { a = JSON.parse(readIf(path.join(STATE_DIR, 'answers.json')) || '{}'); } catch { /* none */ }
  const done = s.phase === 'done';
  const gate = done ? { pass: [], fail: [], warn: [] } : await runGate(s.phase);
  const human = humanItems(s, a);
  console.log(JSON.stringify({
    phase: s.phase, index: phaseIdx(s.phase) + 1, of: 7,
    gatesPass: !gate.fail.length,
    fail: gate.fail, warn: gate.warn,
    action: nextAction(s.phase),
    // autopilot stops at rehearse: what is left there is human work
    stop: done || s.phase === 'rehearse',
    human,
  }, null, 2));
  return 0;
}

function cmdStart(args) {
  const opt = { context: [] };
  let dir = null;
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    if (k === '--context') { while (args[i + 1] && !args[i + 1].startsWith('--')) opt.context.push(args[++i]); }
    else if (['--name', '--hours', '--deadline'].includes(k)) opt[k.slice(2)] = args[++i];
    else if (!k.startsWith('--') && !dir) dir = k;
    else die(`unknown option: ${k}`);
  }
  if (!dir) die('usage: harness.mjs start <dir> [--name n] [--hours 4] [--deadline 18:00] [--context file-or-dir …]');
  const dest = path.resolve(dir);
  const name = opt.name || path.basename(dest);

  cmdBootstrap([dest], { quiet: true });

  if (!fs.existsSync(path.join(dest, '.hackathon', 'state.json'))) {
    const init = ['init', name, '--hours', String(opt.hours || 4), ...(opt.deadline ? ['--deadline', opt.deadline] : [])];
    const r = run(process.execPath, [path.join(dest, 'harness.mjs'), ...init], { cwd: dest });
    if (r.status !== 0) die(`init failed:\n${r.out}`);
    console.log(`  ${green('✓')} clock started — ${name}, ${opt.hours || 4}h${opt.deadline ? `, deadline ${opt.deadline}` : ''}`);
  }

  // Context is the user's own words: copy it in, so the facts are committed
  // next to the answers built from them.
  const ctxDir = layout(dest).context;
  const copied = [];
  for (const c of opt.context) {
    const src = path.resolve(c);
    if (!fs.existsSync(src)) { console.log(yellow(`  ! context not found: ${c}`)); continue; }
    const to = path.join(ctxDir, path.basename(src));
    fs.mkdirSync(ctxDir, { recursive: true });
    fs.cpSync(src, to, { recursive: true });
    copied.push(path.relative(dest, to));
  }
  if (copied.length) console.log(`  ${green('✓')} context copied: ${copied.join(', ')}`);

  console.log('');
  console.log(`${bold('ready.')} project: ${dest}`);
  console.log(`  autopilot: in Claude Code, from ${path.relative(process.cwd(), dest) || '.'}:  ${bold('/hackathon autopilot')}`);
  return 0;
}

// Make the skill available everywhere: Claude Code (~/.claude/skills) and
// OpenCode (~/.config/opencode/skills, plus a /hackathon command — OpenCode
// only puts commands, not skills, on the slash menu). An existing link that
// points somewhere else is left alone unless --force.
function cmdInstall(args = []) {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) die('cannot find your home directory');
  const force = args.includes('--force');
  const real = p => { try { return fs.realpathSync(p); } catch { return null; } };

  const link = (to, label) => {
    const st = fs.lstatSync(to, { throwIfNoEntry: false });   // also sees a dangling link
    if (st) {
      const cur = real(to);
      if (cur === real(SKILL_DIR)) { console.log(`  ${dim('-')} ${label}: already linked`); return; }
      if (!force) { console.log(yellow(`  ! ${label}: ${to} points to ${cur || 'nothing'} — rerun with --force to relink`)); return; }
      if (!st.isSymbolicLink()) { console.log(yellow(`  ! ${label}: ${to} is a real directory, not a link — left alone`)); return; }
      fs.unlinkSync(to);
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.symlinkSync(SKILL_DIR, to, isWin ? 'junction' : 'dir');
    console.log(`  ${green('✓')} ${label}: linked ${to} -> ${SKILL_DIR}`);
  };

  link(path.join(home, '.claude', 'skills', 'hackathon'), 'Claude Code skill');

  // The subagents go in the GLOBAL agent folders too. /hackathon runs from the
  // folder that will contain the project, so project-level agent files do not
  // exist yet when the session starts — and a tool only loads agents at startup.
  // Without this, @deck-designer (and its pinned design model) is invisible.
  const agentTpl = path.join(SKILL_DIR, 'templates', 'agents');
  const putAgents = (dir, tool, label) => {
    for (const agent of ['deck-designer', 'image-scout']) {
      const src = path.join(agentTpl, `${agent}.${tool}.md`), dst = path.join(dir, `${agent}.md`);
      if (!fs.existsSync(src)) continue;
      if (fs.existsSync(dst) && !force) { console.log(`  ${dim('-')} ${label} @${agent}: exists (--force to update)`); continue; }
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(src, dst);
      console.log(`  ${green('✓')} ${label} @${agent}: ${dst}`);
    }
  };
  putAgents(path.join(home, '.claude', 'agents'), 'claude', 'Claude Code');

  const oc = path.join(home, '.config', 'opencode');
  if (fs.existsSync(oc)) {
    link(path.join(oc, 'skills', 'hackathon'), 'OpenCode skill');
    putAgents(path.join(oc, 'agents'), 'opencode', 'OpenCode');
    const cmd = path.join(oc, 'commands', 'hackathon.md');
    if (fs.existsSync(cmd) && !force) {
      console.log(`  ${dim('-')} OpenCode /hackathon command: exists (--force to rewrite)`);
    } else {
      fs.mkdirSync(path.dirname(cmd), { recursive: true });
      fs.writeFileSync(cmd, [
        '---',
        'description: Run a hackathon end-to-end — idea or context files in, working app + HTML deck + synced demo script out (autopilot).',
        'agent: build',
        '---',
        'Call skill({ name: "hackathon" }) and follow it. Input: $ARGUMENTS',
        '',
        'If the input is an idea, context files, or "autopilot", run its Autopilot section end-to-end.',
        'The input IS the idea: do not ask for it. Infer who it is for, the core feature and the demo path yourself (the `by: "agent"` questions) — ask only `ask --pending --user` items that block.',
        'If there is no input and a .hackathon/ directory exists here, resume: node harness.mjs status, then continue the loop.',
        '',
      ].join('\n'));
      console.log(`  ${green('✓')} OpenCode /hackathon command: ${cmd}`);
    }
  }
  console.log(`  restart Claude Code / OpenCode, then: ${bold('/hackathon <your idea, or @notes.md>')}`);
  return 0;
}

// Move an older project into the clean layout. Shows the plan; --apply moves.
// Moves are renames (git sees them as renames); nothing is deleted.
function cmdTidy(args) {
  if (!load()) die(`not a hackathon project (no .hackathon/state.json in ${PROJ}) — run tidy from inside a project`);
  const apply = args.includes('--apply');
  const KEEP = new Set(['HANDOFF.md', 'harness.mjs', 'present', '.hackathon', '.git', '.gitignore', '.claude', '.opencode', '.pi', '.DS_Store']);   // .pi is migrated below
  const AGENT = ['SPEC.md', 'HACKATHON.md', 'GOALS.md', 'TIMELINE.md', 'NOTES.md'];
  const moves = [];
  for (const name of fs.readdirSync(PROJ)) {
    if (KEEP.has(name)) continue;
    let to;
    if (AGENT.includes(name)) to = path.join(L.agent, name);
    else if (name === 'answers.json') to = path.join(L.agent, 'intake.json');      // the agent's scratch answers
    else if (name === 'context') to = L.context;
    else if (name === 'deck') to = L.deck;          // review PNGs inside it are moved to evidence below
    else if (name === 'script.md') to = L.script;
    else if (/^demo-backup\./.test(name)) to = path.join(L.present, name);
    else to = path.join(L.app, name);                                            // everything else is the app
    moves.push([path.join(PROJ, name), to]);
  }
  if (!moves.length) console.log(`  ${green('✓')} already tidy: present/ (what you show) and .hackathon/ (what the agent uses)`);
  for (const [from, to] of moves) {
    const rel = p => path.relative(PROJ, p);
    // an empty folder created by a newer bootstrap is fine to replace
    const empty = fs.existsSync(to) && fs.statSync(to).isDirectory() && !fs.readdirSync(to).length;
    if (fs.existsSync(to) && !empty) { console.log(yellow(`  ! ${rel(from)} → ${rel(to)}: target exists, left alone`)); continue; }
    console.log(`  ${apply ? green('✓') : dim('→')} ${rel(from)}  →  ${rel(to)}`);
    if (apply) { if (empty) fs.rmdirSync(to); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.renameSync(from, to); }
  }
  // deck review images are evidence, not deliverables
  const deckNow = fs.existsSync(L.deck) ? L.deck : path.join(PROJ, 'deck');
  if (fs.existsSync(deckNow)) for (const f of fs.readdirSync(deckNow).filter(f => /^slides\.\d+\.png$/.test(f))) {
    const to = path.join(L.evidence, 'deck', f);
    console.log(`  ${apply ? green('✓') : dim('→')} ${path.relative(PROJ, path.join(deckNow, f))}  →  ${path.relative(PROJ, to)}`);
    if (apply) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.renameSync(path.join(deckNow, f), to); }
  }
  // the project's own copy of the skill lives in .hackathon/skill — bring it up
  // to date with this one, and retire the old .pi/ home
  const local = path.join(L.agent, 'skill');
  if (!fs.existsSync(local) || fs.realpathSync(local) !== fs.realpathSync(SKILL_DIR)) {
    console.log(`  ${apply ? green('✓') : dim('→')} refresh .hackathon/skill from ${SKILL_DIR}`);
    if (apply) { fs.rmSync(local, { recursive: true, force: true }); copySkill(local); }
  }
  const entry = path.join(PROJ, 'harness.mjs');
  if ((readIf(entry) || '') !== ENTRY) {
    console.log(`  ${apply ? green('✓') : dim('→')} harness.mjs → loads .hackathon/skill`);
    if (apply) fs.writeFileSync(entry, ENTRY);
  }
  const claudeLink = path.join(PROJ, '.claude', 'skills', 'hackathon');
  const linkOk = fs.lstatSync(claudeLink, { throwIfNoEntry: false }) && (() => { try { return fs.realpathSync(claudeLink) === fs.realpathSync(local); } catch { return false; } })();
  if (!linkOk) {
    console.log(`  ${apply ? green('✓') : dim('→')} .claude/skills/hackathon → .hackathon/skill`);
    if (apply) {
      fs.rmSync(claudeLink, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(claudeLink), { recursive: true });
      try { fs.symlinkSync(isWin ? local : path.relative(path.dirname(claudeLink), local), claudeLink, isWin ? 'junction' : undefined); }
      catch { fs.cpSync(local, claudeLink, { recursive: true }); }
    }
  }
  if (fs.existsSync(path.join(PROJ, '.pi'))) {
    console.log(`  ${apply ? green('✓') : dim('→')} remove .pi/ (the skill now lives in .hackathon/skill)`);
    if (apply) fs.rmSync(path.join(PROJ, '.pi'), { recursive: true, force: true });
  }
  if (!apply && moves.length) console.log(dim('\n  nothing moved yet — run again with --apply'));
  if (apply) { fs.mkdirSync(L.app, { recursive: true }); fs.mkdirSync(L.deck, { recursive: true }); logEvent('tidy', (load() || {}).phase, `moved=${moves.length}`); }
  return 0;
}

function cmdHandoff() {
  const s = requireInit();
  let a = {};
  try { a = JSON.parse(readIf(path.join(STATE_DIR, 'answers.json')) || '{}'); } catch { /* none */ }
  const have = f => fs.existsSync(path.join(PROJ, f));
  const ready = [
    have('present/app/index.html') || have('present/app/package.json') ? '- **App** — `present/app/` · `node harness.mjs smoke` starts it' : '- App — not built yet',
    have('present/deck/slides.html') ? '- **Deck** — `present/deck/slides.html` (open in a browser, `f` for fullscreen)' : '- Deck — not generated yet',
    have('present/script.md') ? '- **Script** — `present/script.md` (operator cue sheet at the top)' : '- Script — not generated yet',
    have('present/demo-backup.mp4') ? '- **Backup video** — `present/demo-backup.mp4`' : null,
  ].filter(Boolean);
  const human = humanItems(s, a);
  const L = [
    `# Handoff — ${s.name}`, '',
    `Phase **${s.phase}** (${phaseIdx(s.phase) + 1}/7).${s.skips?.length ? ` ${s.skips.length} gate(s) were force-skipped — see .hackathon/log.jsonl.` : ''}`, '',
    '## Ready', '', ...ready, '',
    '## Only you can do these', '',
    ...(human.length ? human.map((h, i) => `${i + 1}. ${h.do}  \n   _${h.why}_`) : ['Nothing — go present.']), '',
    '## Then', '', '```bash', 'node harness.mjs done      # rehearse -> done, once the video exists', 'node harness.mjs verify    # every gate, one last time', '```', '',
  ];
  fs.writeFileSync(layout(PROJ).handoff, L.join('\n'));
  console.log(L.join('\n'));
  return 0;
}

function nextAction(phase) {
  return {
    idea: 'ASK the user for the idea: node harness.mjs ask  →  node harness.mjs intake',
    spec: 'write SPEC.md (pitch, core feature, 3-step demo path, stack, cut list)',
    build: 'build the demo path in order, then run: node harness.mjs smoke',
    ui: 'seed real data, make the wow moment loud, then: node harness.mjs check ui',
    deck: 'deck --init --force (places the app screenshot), then: node harness.mjs deck --images and look at the PNGs',
    script: 'generate the script from the deck, then check it: node harness.mjs script --init --force',
    rehearse: 'cold-restart the app, record present/demo-backup.mp4, then: node harness.mjs check rehearse',
    done: 'node harness.mjs verify — then go present',
  }[phase] || 'node harness.mjs status';
}

async function cmdDeck(args) {
  requireInit();

  // --init generates deck/slides.html from the recorded intake answers. The
  // file IS the presentation — self-contained, no render step, no network.
  if (args.includes('--init')) {
    const answersPath = path.join(STATE_DIR, 'answers.json');
    if (!fs.existsSync(answersPath)) {
      console.log(red('  ✗ no intake recorded — the deck is built from the user\'s answers'));
      console.log(dim('      run: harness.mjs ask   then   harness.mjs intake --answers answers.json'));
      return 1;
    }
    const out = path.join(L.deck, 'slides.html');
    if (fs.existsSync(out) && !args.includes('--force')) {
      console.log(`  ${dim('-')} deck/slides.html exists, left alone (--force to regenerate)`);
    } else {
      // a leftover Marp source from an older harness is dead weight — say so
      if (fs.existsSync(path.join(L.deck, 'slides.md')))
        console.log(dim('      deck/slides.md (old Marp source) is no longer used — safe to delete'));
      const mod = await import(pathToFileURL(path.join(SKILL_DIR, 'scripts', 'gen-deck.mjs')).href);
      const answers = JSON.parse(readIf(answersPath));
      const s = load() || {};
      fs.mkdirSync(path.dirname(out), { recursive: true });
      // the real app is the hero image: take the ui gate's screenshot if there is one
      const ui = path.join(EVID, 'ui.png'), app = path.join(L.deck, 'assets', 'app.png');
      if (fs.existsSync(ui)) { fs.mkdirSync(path.dirname(app), { recursive: true }); fs.copyFileSync(ui, app); }
      const shot = fs.existsSync(app);
      const reveal = fs.existsSync(path.join(L.deck, 'assets', 'reveal.mp4'));
      mod.installDeckFonts(L.deck);
      fs.writeFileSync(out, mod.generateDeck({ answers, name: s.name, shot, reveal }));
      console.log(`  ${green('✓')} generated present/deck/slides.html from .hackathon/answers.json`);
      console.log(shot ? `  ${green('✓')} app screenshot placed on "What we built" (present/deck/assets/app.png)`
        : dim('      no app screenshot yet — it is placed automatically once the ui gate captures one (rerun deck --init --force)'));
      console.log(reveal ? `  ${green('✓')} reveal slide after the problem plays present/deck/assets/reveal.mp4, then advances itself`
        : dim('      no reveal slide — drop a ~10 s motion piece at present/deck/assets/reveal.mp4 and rerun to add one after the problem'));
      const missing = [];
      if (!answers.pain) missing.push('pain  (the problem slide has no headline)');
      if (!(answers.painPoints || []).length) missing.push('painPoints  (no supporting bullets)');
      if (!answers.character) missing.push('character  (no named person on the problem slide — the opening is a statement, not a story)');
      if (!(answers.proof || []).length && !(answers.impact || []).length)
        missing.push('proof / impact  (no numbers slide — poll 20–30 real people: intake --proof "23 of 30 … | how you asked")');
      if (!answers.closer) missing.push('closer  (the last line is the one they remember)');
      if (!(answers.next || []).length) missing.push('next  (no what-next slide)');
      if (missing.length) {
        console.log(yellow('  ! recorded nothing for:'));
        for (const m of missing) console.log(yellow(`      ${m}`));
        console.log(dim('      sharpen the pitch by answering these, then --force to regenerate'));
      }
      console.log(dim('      present with: open deck/slides.html (arrow keys / f for fullscreen)'));
    }
  }

  const { buildDeck } = await import(pathToFileURL(path.join(SKILL_DIR, 'scripts', 'build-deck.mjs')).href);
  const rc = buildDeck({
    deckDir: L.deck,
    images: args.includes('--images'),
  });
  return rc;
}

async function cmdSmoke() {
  requireInit();
  const r = await startApp({ proj: L.app, evid: EVID, cfg: loadConfig() });
  if (!r.ok) {
    console.log(`  ${red('✗')} ${r.why}`);
    if (r.log) console.log(dim(r.log.split('\n').map(l => '      ' + l).join('\n')));
    return 1;
  }
  const { fetchBody } = await import('./lib.mjs');
  const body = await fetchBody(r.url);
  console.log(`  ${green('✓')} app serves at ${r.url} ${dim(`(${r.cmd})`)}`);
  console.log(`  ${green('✓')} responded with ${body.length} bytes`);
  r.stop();
  return 0;
}

async function cmdVerify() {
  const s = requireInit();
  const upto = phaseIdx(s.phase);
  let failed = 0;
  for (let i = 0; i <= upto; i++) {
    const p = PHASES[i];
    if (p === 'done') break;
    console.log(bold(`\n── ${p} ──`));
    const r = await runGate(p);
    printResult(r);
    if (r.fail.length) failed = 1;
  }
  console.log('');
  if (!failed) console.log(`${green(bold('EVERYTHING GREEN'))} — gates pass through '${s.phase}'.`);
  else console.log(`${red(bold('SOMETHING IS RED'))} — see ✗ lines above.`);
  return failed;
}

function cmdLog(args) {
  const s = requireInit();
  const msg = args.join(' ');
  if (!msg) die('usage: harness.mjs log <message>');
  logEvent('note', s.phase, msg);
  console.log(`logged: ${msg}`);
  return 0;
}

// ── dispatch ───────────────────────────────────────────────────────────────
const [cmd, ...args] = process.argv.slice(2);
let rc = 0;
switch (cmd) {
  case 'init': rc = await cmdInit(args); break;
  case 'bootstrap': rc = cmdBootstrap(args); break;
  case 'ask': rc = cmdAsk(args); break;
  case 'intake': rc = cmdIntake(args); break;
  case 'impact': rc = cmdImpact(args); break;
  case 'palette': rc = await cmdPalette(args); break;
  case 'status': rc = await cmdStatus(args); break;
  case 'check': rc = await cmdCheck(args); break;
  case 'done': rc = await cmdDone(args); break;
  case 'next': rc = await cmdNext(args); break;
  case 'start': rc = cmdStart(args); break;
  case 'install': rc = cmdInstall(args); break;
  case 'handoff': rc = cmdHandoff(); break;
  case 'tidy': rc = cmdTidy(args); break;
  case 'deck': rc = await cmdDeck(args); break;
  case 'script': rc = await cmdScript(args); break;
  case 'smoke': rc = await cmdSmoke(); break;
  case 'verify': rc = await cmdVerify(); break;
  case 'log': rc = cmdLog(args); break;
  case 'goals': rc = await cmdGoals(); break;
  case 'timeline': rc = await cmdTimeline(); break;
  case 'note': rc = cmdNote(args); break;
  case undefined:
  case 'help':
  case '-h':
  case '--help':
    { const ls = readIf(fileURLToPath(import.meta.url)).split('\n').slice(1);
      console.log(ls.slice(0, ls.findIndex(l => !l.startsWith('//'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); }
    break;
  default:
    die(`unknown command: ${cmd}  (try: node harness.mjs help)`);
}
process.exit(rc);
