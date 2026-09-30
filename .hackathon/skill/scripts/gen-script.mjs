#!/usr/bin/env node
// Generate script.md, synced to the actual deck.
//
// The deck is the source of truth: we read deck/slides.html, take its real slide
// titles and order, and emit one beat per slide plus a "hold" beat for each live
// demo step. Every beat carries an explicit advance cue so the operator knows
// exactly when to move. Because slide numbers and titles come from the rendered
// deck, the script cannot drift from the slides.
import fs from 'node:fs';
import path from 'node:path';
import { readIf, deckSlides, LIMIT_Q, layout } from '../lib.mjs';

// Re-export for callers that still import it from here.
export { deckSlides };

const lastWords = (sentence, n = 4) => {
  const w = String(sentence || '').replace(/[“”"]/g, '').split(/\s+/).filter(Boolean);
  return w.slice(-n).join(' ');
};

const lastSentence = (s) => {
  const parts = String(s || '').trim().replace(/\s+/g, ' ').split(/(?<=[.!?])\s/).filter(Boolean);
  return parts.length ? parts[parts.length - 1].replace(/[.]$/, '') : String(s || '').trim();
};

const clampSay = (s, max = 190) => {
  const t = String(s || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length <= max ? t : t.slice(0, max).replace(/\s+\S*$/, '') + '…';
};

// Any line the generator had to AUTHOR rather than take from the user is marked
// as a draft. The script gate refuses to pass while a DRAFT remains, so generic
// phrasing cannot reach the stage wearing the team's voice.
const DRAFT = ' **[DRAFT — rewrite in your own voice]**';
const draft = (s) => `${s}${DRAFT}`;

export function generateScript({ answers, deckText, name }) {
  const a = answers || {};
  const slides = deckSlides(deckText || '');
  if (!slides.length) throw new Error('no slides found in the deck — generate the deck first');

  const demo = (a.demo || []).filter(Boolean);
  const painPoints = (a.painPoints || []).filter(Boolean);
  const next = (a.next || []).filter(Boolean);
  const impact = (a.impact || []).filter(i => i && i.metric && i.value);
  const proof = (a.proof || []).filter(p => p && p.claim && p.source);
  const character = String(a.character || '').trim();
  const firstName = (/^[A-Z][A-Za-z'-]+/.exec(character) || [''])[0];
  const hook = String(a.hook || '').trim();
  // did the opening already introduce the person?
  const openedWithPerson = !hook || (firstName && hook.includes(firstName));

  const beats = []; // {slide, title, screen, say, do, click, cue, advance}

  // The live demo, in the middle of the pitch: turn to the app, walk the steps,
  // come back to the SAME slide. Every switch to the app has a switch back, so
  // the operator is never stranded on the app. Emitted once, on the first slide
  // that is "what we built" or a demo slide.
  let demoDone = false;
  const demoBeats = (n, t) => {
    demoDone = true;
    beats.push({
      slide: n, title: t, say: "Let me show you it working.", do: 'Turn to the app screen.',
      cue: `⇄ SWITCH to the app after "...show you it working"`,
    });
    demo.forEach((step, k) => {
      const lastStep = k === demo.length - 1;
      const say = clampSay(lastStep ? `And here's the moment that matters: ${step}.` : `${step}.`);
      beats.push({
        slide: n, title: t, screen: 'App', say, click: step,
        do: lastStep ? 'Pause. Let them look at the result.' : '',
        cue: lastStep ? `⇄ SWITCH back to the deck, Slide ${n}, after "...${lastWords(say)}"` : 'HOLD — stay on the app',
      });
    });
  };

  slides.forEach((s, i) => {
    const n = i + 1;
    const t = s.title;
    const last = i === slides.length - 1;

    if (i === 0) {
      // The first 30 seconds belong to one named person with the problem. The
      // opening line is pure voice: use the user's, else build it from their
      // character and mark it a draft.
      const say = hook ? clampSay(hook)
        : character ? draft(clampSay(`${character.replace(/[.]$/, '')}.`))
        : draft(clampSay(a.pitch30 || a.oneLiner || a.idea));
      beats.push({
        slide: n, title: t, say,
        do: 'Stand still. Tell it like a story, not a feature list. Team name comes later, if at all.',
      });
    } else if (/problem/i.test(t)) {
      beats.push({
        slide: n, title: t,
        // the person first, if the hook did not already introduce them
        say: clampSay([!openedWithPerson && character ? `${character.replace(/[.]$/, '')}.` : '',
          a.pain, painPoints[0]].filter(Boolean).join(' '), 240),
        do: 'Point at the headline.',
      });
    } else if (/reveal-video/.test(s.body)) {
      // the motion reveal: silence — it speaks for itself, then moves on alone
      beats.push({
        slide: n, title: t, say: '',
        do: 'Silence. Let it play — do not talk over the video.',
        cue: `AUTO — the video advances to Slide ${n + 1} by itself when it ends`,
      });
    } else if (/show you|demo|agenda/i.test(t) && !demoDone) {
      if (demo.length) demoBeats(n, t);
      else beats.push({ slide: n, title: t, say: draft('Walk them through the three things on screen.'), do: 'Gesture at the three lines.' });
    } else if (/how it works/i.test(t)) {
      // never invent the explanation: use theirs, else propose-and-flag
      const say = a.how || `Under the hood, ${String(a.core || '').replace(/^./, c => c.toLowerCase())}.`;
      beats.push({
        slide: n, title: t,
        say: a.how ? clampSay(say) : draft(clampSay(say)),
        do: 'Trace the diagram left to right.',
      });
    } else if (/built/i.test(t)) {
      // demo first — proof before explanation — then back on this slide for
      // how it was built
      if (demo.length && !demoDone) demoBeats(n, t);
      const stack = /decide for me/i.test(a.stack || '') ? 'vanilla JS in a single file' : a.stack;
      const say = `We built it with ${stack || 'a deliberately small stack'}${a.hardPart ? `; the hard part was ${a.hardPart}` : ''}.`;
      beats.push({
        slide: n, title: t,
        say: a.hardPart ? clampSay(say) : draft(clampSay(say)),
        do: 'One line per bullet, no lingering.',
      });
    } else if (/impact/i.test(t)) {
      // measured first — real and local beats any national statistic — then any
      // projection, said out loud as a projection
      const said = [];
      if (proof.length) said.push(proof.map(p => p.claim.replace(/[.]$/, '')).join('. ') + '.');
      if (impact.length) said.push(`Projected from our demo data: ${impact.map(i => `${i.metric} — ${i.value}`).join(', ')}.`);
      beats.push({
        slide: n, title: t,
        say: clampSay(said.join(' '), 240),
        do: proof.length
          ? `Point at the number. If asked how: ${proof.map(p => p.source).join('; ')}.`
          : 'Point at the numbers. Be honest that they are projections.',
      });
    } else if (/next/i.test(t) || last) {
      // closing line: use the punchy one-liner, else just the idea's last
      // sentence — never repeat the whole hook we opened with
      // judges remember the last line: the team's closer, or a flagged draft
      const closer = String(a.closer || '').trim();
      // only narrate next steps when the deck actually shows them
      const nextLine = next.length && /next/i.test(t) ? `Next we'd add ${next.slice(0, 3).join(', ')}.` : '';
      beats.push({
        slide: n, title: t,
        say: closer
          ? clampSay([nextLine, closer].filter(Boolean).join(' '), 240)
          : draft(clampSay([nextLine, a.oneLiner || lastSentence(a.idea)].filter(Boolean).join(' '))),
        do: 'Land the closing line. Stop talking. Do not say "thank you, any questions" — let the line hang.',
      });
    } else {
      beats.push({ slide: n, title: t, say: clampSay(a.oneLiner || a.idea), do: '' });
    }
  });

  // attach explicit advance cues: the operator moves when they hear the trigger
  beats.forEach((b, i) => {
    const nextBeat = beats[i + 1];
    if (b.cue) {
      b.advance = b.cue;                     // switches, holds on the app, auto-advance
    } else if (!nextBeat) {
      b.advance = 'END — stop on this slide';
    } else if (nextBeat.slide === b.slide) {
      b.advance = `HOLD — stay on Slide ${b.slide}`;
    } else {
      b.advance = `▶ ADVANCE to Slide ${nextBeat.slide} after "...${lastWords(b.say)}"`;
    }
  });

  const totalSlides = slides.length;
  const spoken = beats.map(b => b.say).filter(Boolean).join(' ');
  const spokenWords = spoken.split(/\s+/).filter(Boolean).length;
  const est = Math.max(1, Math.round(spokenWords / 150 * 60));

  const cueRows = beats.map((b, i) =>
    `| ${i + 1} | ${b.screen === 'App' ? '**App**' : `Slide ${b.slide}`} | ${b.title} | ${b.advance} |`).join('\n');

  const out = [];
  out.push(`# Demo script — ${name || 'Untitled'}`);
  out.push('');
  out.push(`**Presenter** speaks. **Operator** advances. ${totalSlides} slides, ${beats.length} beats, ~${est}s (${spokenWords} spoken words).`);
  out.push('');
  out.push('> Operator: keep this open on the slide deck machine. Advance only when you hear the trigger.');
  out.push('');
  out.push('## Operator cue sheet');
  out.push('');
  out.push('| Beat | Screen | Slide title | Cue |');
  out.push('|------|--------|-------------|-----|');
  out.push(cueRows);
  out.push('');
  out.push('## Beats');
  out.push('');
  beats.forEach((b, i) => {
    out.push(`### Beat ${i + 1} · Slide ${b.slide} — ${b.title}`);
    if (b.screen === 'App') out.push('**Screen:** the app (the deck waits on this slide)');
    if (b.say) out.push(`**Say:** "${b.say}"`);
    if (b.click) out.push(`**Click:** ${b.click}`);
    if (b.do) out.push(`**Do:** ${b.do}`);
    out.push(`**Operator:** ${b.advance}`);
    out.push('');
  });

  out.push('## 30-second short version');
  out.push('');
  if (a.pitch30) {
    out.push(`"${clampSay(a.pitch30, 300)}"`);
  } else {
    out.push(`"${draft(clampSay([a.pain, a.core || a.idea, a.oneLiner].filter(Boolean).join(' '), 260))}"`);
  }
  out.push('');
  out.push('Do this one if the timer is already red: say it over Slides 1, 2 and the last slide.');
  out.push('');
  out.push('## Likely Q&A');
  out.push('');
  if ((a.qa || []).length) {
    // the user's own answers — these are the ones that hold up under pressure
    a.qa.forEach((pair, i) => {
      out.push(`${i + 1}. **Q:** ${pair.q}`);
      out.push(`   **A:** ${pair.a}`);
      out.push('');
    });
    // one judge always probes what is not real yet; a calm, true answer beats
    // a dodge — so if the team has not prepared one, it is a draft to fill
    if (!a.qa.some(p => LIMIT_Q.test(p.q))) {
      out.push(`${a.qa.length + 1}. **Q:** What doesn't work yet — what's faked or seeded in the demo?`);
      out.push(`   **A:** ${draft('The honest answer, in one calm line.')}`);
      out.push('');
    }
  } else {
    // we do not know what the judges will ask, so we flag placeholders instead
    // of putting invented answers in the team's mouth
    const guesses = [
      ['How is this different from what exists today?', 'What makes this different — one sentence.'],
      ['What about scale?', `Why the answer is "fine" — e.g. ${(/decide for me/i.test(a.stack || '') ? '' : a.stack) || 'your architecture'} handles it.`],
      ['How did you build this so fast?', 'Your honest answer about your process.'],
      ["What doesn't work yet — what's faked or seeded in the demo?", 'The honest answer, in one calm line.'],
    ];
    guesses.forEach((g, i) => {
      out.push(`${i + 1}. **Q:** ${draft(g[0])}`);
      out.push(`   **A:** ${draft(g[1])}`);
      out.push('');
    });
  }

  return out.join('\n');
}

// ── CLI: node scripts/gen-script.mjs [projectDir] [--force] ────────────────
if (process.argv[1]?.endsWith('gen-script.mjs')) {
  const args = process.argv.slice(2);
  const proj = path.resolve(args.find(x => !x.startsWith('--')) || process.cwd());
  const force = args.includes('--force');
  const answersPath = path.join(proj, '.hackathon', 'answers.json');
  const statePath = path.join(proj, '.hackathon', 'state.json');
  const htmlPath = path.join(layout(proj).deck, 'slides.html');
  const deckPath = fs.existsSync(htmlPath) ? htmlPath : null;
  if (!fs.existsSync(answersPath)) { console.error('gen-script: no .hackathon/answers.json — run the intake first'); process.exit(1); }
  if (!deckPath) { console.error('gen-script: no deck/slides.html — generate the deck first (harness.mjs deck --init)'); process.exit(1); }
  const out = layout(proj).script;
  if (fs.existsSync(out) && !force) { console.error('gen-script: script.md already exists (--force to overwrite)'); process.exit(1); }
  const answers = JSON.parse(readIf(answersPath));
  const state = fs.existsSync(statePath) ? JSON.parse(readIf(statePath)) : {};
  fs.writeFileSync(out, generateScript({ answers, deckText: readIf(deckPath), name: state.name }));
  console.log(`gen-script: wrote ${path.relative(proj, out)}`);
  process.exit(0);
}
