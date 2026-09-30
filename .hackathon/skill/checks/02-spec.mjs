// GATE 2 — spec: SPEC.md with five decisions and a concrete demo path.
import path from 'node:path';
import { placeholders, readIf, section, exists, layout } from '../lib.mjs';

export default function gate({ proj }) {
  const pass = [], fail = [], warn = [];
  const f = layout(proj).spec;

  if (!exists(f)) { fail.push('SPEC.md is missing'); return { pass, fail, warn }; }
  pass.push('SPEC.md exists');

  const md = readIf(f) || '';

  const hits = placeholders(md);
  if (hits.length) fail.push(`${hits.length} unfilled placeholder(s): ${hits.slice(0, 4).map(h => h.token).join(', ')}`);
  else pass.push('no unfilled placeholders');

  const needed = [
    ['elevator pitch', /pitch|one[- ]sentence|one[- ]liner/i],
    ['core feature', /core feature|the one thing|must work/i],
    ['demo path', /demo path|demo flow|users?\s*&\s*flow|user flow/i],
    ['stack', /\bstack\b|tech|vite|react|framework|static/i],
    ['cut list', /cut list|non[- ]goals|out of scope|not doing/i],
  ];
  for (const [label, re] of needed) {
    if (re.test(md)) pass.push(`${label} is decided`);
    else fail.push(`${label} is missing from SPEC.md`);
  }

  const demo = section(md, /demo|flow/i);
  const steps = (demo.match(/^\s*(\d+[.)]|[-*])\s+\S/gm) || []).length;
  const arrows = (md.match(/→/g) || []).length;
  if (steps >= 3) pass.push(`demo path has ${steps} steps`);
  else if (arrows >= 2) pass.push(`demo path expressed as a flow (${arrows} arrows)`);
  else fail.push(`demo path needs 3 concrete steps (found ${steps})`);

  return { pass, fail, warn };
}

// Goal metadata — the human-readable twin of the gate above. The harness
// renders GOALS.md from this, so the checklist can never drift from the code.
export const meta = {
  title: 'Write the spec',
  owner: 'all three',
  criteria: [
    'pitch, core feature, demo path, stack, and cut list decided in SPEC.md',
    'demo path has 3 concrete ordered steps',
    'no unfilled placeholders',
  ],
};
