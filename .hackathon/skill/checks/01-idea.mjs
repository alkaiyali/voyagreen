// GATE 1 — idea: a real HACKATHON.md, and evidence the idea came from the user.
//
// This gate exists to stop the agent inventing a product nobody asked for. The
// idea phase cannot pass until the intake answers are recorded, which means the
// questions were actually put to a human.
import path from 'node:path';
import { placeholders, readIf, section, exists, layout } from '../lib.mjs';

export default function gate({ proj }) {
  const pass = [], fail = [], warn = [];

  // ── the intake record ────────────────────────────────────────────────────
  const answersPath = path.join(proj, '.hackathon', 'answers.json');
  if (!exists(answersPath)) {
    fail.push('no intake recorded — you have not asked the user yet');
    fail.push('    run: harness.mjs ask   then put those questions to the user');
    fail.push('    then: harness.mjs intake --answers answers.json');
    return { pass, fail, warn };
  }

  let a = {};
  try { a = JSON.parse(readIf(answersPath)); } catch {
    fail.push('.hackathon/answers.json is not valid JSON');
    return { pass, fail, warn };
  }
  for (const k of ['idea', 'who', 'core']) {
    if (String(a[k] || '').trim()) pass.push(`answered: ${k}`);
    else fail.push(`intake is missing a real answer for "${k}" — ask the user`);
  }
  if (a.demoProposed) {
    warn.push('the demo path was proposed by the harness, not the user — confirm it with them');
  } else if (Array.isArray(a.demo) && a.demo.length >= 3) {
    pass.push(`user gave a ${a.demo.length}-step demo path`);
  }

  // ── the state file ───────────────────────────────────────────────────────
  const f = layout(proj).hackathon;
  if (!exists(f)) {
    fail.push('HACKATHON.md is missing — run: harness.mjs intake --answers answers.json');
    return { pass, fail, warn };
  }
  pass.push('HACKATHON.md exists');

  const md = readIf(f) || '';
  const idea = section(md, /idea/i).replace(/^\s*$/gm, '').trim();
  if (idea.length < 40) fail.push(`the "Idea" section is only ${idea.length} chars — write the actual idea (40+)`);
  else pass.push(`idea has substance (${idea.length} chars)`);

  const hits = placeholders(md);
  if (hits.length) fail.push(`${hits.length} unfilled placeholder(s): ${hits.slice(0, 4).map(h => h.token).join(', ')}`);
  else pass.push('no unfilled placeholders');

  const spec = readIf(layout(proj).spec) || '';
  if (/core feature|the one thing/i.test(md + spec)) pass.push('a single core feature is named');
  else fail.push('no "core feature" commitment — one feature must be chosen');

  return { pass, fail, warn };
}

// Goal metadata — the human-readable twin of the gate above. The harness
// renders GOALS.md from this, so the checklist can never drift from the code.
export const meta = {
  title: 'Lock the idea',
  owner: 'all three',
  criteria: [
    'intake recorded — idea, who, and core feature answered by the user',
    'HACKATHON.md exists with a 40+ character idea',
    'one core feature named',
    'no unfilled placeholders',
  ],
};
