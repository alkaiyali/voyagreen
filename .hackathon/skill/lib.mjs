// Shared helpers for hackathon harness gates.
// Cross-platform: Windows / macOS / Linux. Node built-ins only.
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

export const isWin = process.platform === 'win32';

// ── terminal colour ────────────────────────────────────────────────────────
const on = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (c, s) => (on ? `\u001b[${c}m${s}\u001b[0m` : s);
export const green = s => wrap('32', s);
export const red = s => wrap('31', s);
export const yellow = s => wrap('33', s);
export const dim = s => wrap('2', s);
export const bold = s => wrap('1', s);
export const blue = s => wrap('34', s);

// ── template placeholder detection ─────────────────────────────────────────
// A template token looks like <PROSE>, not like markup or code. We treat a
// <...> as a placeholder only when it is NOT a real HTML tag, NOT a comment,
// and NOT code (no operators, braces, parens or semicolons).
const HTML_TAGS = new Set((
  'a abbr address area article aside audio b base bdi bdo blockquote body br button canvas ' +
  'caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed ' +
  'fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i ' +
  'iframe img input ins kbd label legend li link main map mark menu meta meter nav noscript ' +
  'object ol optgroup option output p picture pre progress q rp rt ruby s samp script section ' +
  'select slot small source span strong style sub summary sup table tbody td template textarea ' +
  'tfoot th thead time title tr track u ul var video wbr svg path circle rect line polygon ' +
  'polyline g defs use text tspan stop lineargradient radialgradient clippath mask pattern ' +
  'filter foreignobject math annotation ellipse symbol marker image desc metadata animate ' +
  'animatetransform animatemotion'
).split(/\s+/));
// generic type args that show up in TS/JSX and are not placeholders
const TS_GENERICS = new Set((
  'array promise record partial readonly pick omit map set weakmap weakset t k v string ' +
  'number boolean unknown any never'
).split(/\s+/));

// CSS value types, as written in `@property { syntax: '<percentage>' }`
const CSS_TYPES = new Set((
  'length number percentage length-percentage color image url integer angle time ' +
  'resolution transform-function transform-list custom-ident string'
).split(/\s+/));

export function placeholders(text) {
  const hits = [];
  const re = /<[^>]*>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const inner = raw.slice(1, -1).trim();
    if (!inner) continue;
    if (inner.startsWith('!') || inner.startsWith('--')) continue;   // doctype, comment
    if (/[;{}()&|+*/=<>`]/.test(inner)) continue;                     // code, not prose
    const name = (/^\/?([A-Za-z][A-Za-z0-9-]*)/.exec(inner) || [])[1] || '';
    if (!name) continue;
    const low = name.toLowerCase();
    if (HTML_TAGS.has(low) || TS_GENERICS.has(low) || CSS_TYPES.has(low)) continue;
    if (/^fe[a-z]+$/.test(low)) continue;                              // SVG filter primitives
    const line = text.slice(0, m.index).split('\n').length;
    hits.push({ token: raw.length > 44 ? raw.slice(0, 44) + '…' : raw, line });
  }
  return hits;
}

// ── design tells ───────────────────────────────────────────────────────────
// The Design rules forbid the defaults that make a demo look generated: a
// handful of over-used UI fonts and the big generic icon packs. We match the
// literal family / CDN names so the rule is checkable, not aspirational.
export const BANNED_FONTS = [
  'Inter', 'Roboto', 'JetBrains Mono', 'Open Sans', 'Lato', 'Montserrat',
  'Poppins', 'Source Sans Pro', 'Nunito', 'Raleway', 'Work Sans', 'Manrope',
];
export const BANNED_ICON_PACKS = [
  'lucide', 'heroicons', 'feathericons', 'font-awesome', 'fontawesome',
  'material-icons', 'material-symbols', 'materialdesignicons',
  'bootstrap-icons', 'phosphor-icons', 'tabler-icons', 'remixicon', 'iconify',
  'ionicons', 'octicons',
];

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Scan source text for the banned fonts / icon packs. Fonts are only flagged in
// a font context (a font-family or font variable declaration, a Google Fonts
// import) so prose that happens to contain the word "Inter" does not trip it.
export function designTells(text) {
  const t = String(text || '');
  const hits = new Set();

  const fontCtx = [];
  for (const m of t.matchAll(/font-family\s*:[^;}\n]*/gi)) fontCtx.push(m[0]);
  for (const m of t.matchAll(/--[A-Za-z0-9-]*font[A-Za-z0-9-]*\s*:[^;}\n]*/gi)) fontCtx.push(m[0]);
  for (const m of t.matchAll(/@import\s+url\([^)]*\)/gi)) fontCtx.push(decodeURIComponent(m[0]));
  for (const m of t.matchAll(/fonts\.googleapis\.com\/[^"'\s)]*/gi)) fontCtx.push(decodeURIComponent(m[0]));
  const ctx = fontCtx.join('\n');

  for (const f of BANNED_FONTS) {
    const re = new RegExp(`(^|[^A-Za-z])${escapeRe(f).replace(/\s+/g, '[+ ]')}([^A-Za-z]|$)`, 'i');
    if (re.test(ctx)) hits.add(`generic font: ${f}`);
  }
  for (const p of BANNED_ICON_PACKS) {
    if (new RegExp(escapeRe(p), 'i').test(t)) hits.add(`generic icon pack: ${p}`);
  }
  return [...hits];
}

// ── deck parsing (shared by the deck gate and the script generator) ─────────
// The deck is deck/slides.html: one `<section class="slide" data-title="…">`
// per slide. A slide's title comes from `data-title`, falling back to the first
// <h1>/<h2> inside the section. This is the single parser both the deck gate
// and `script --init` call, so the script cannot disagree with the slides.

// Top-level <section>…</section> blocks, balanced — a lazy regex would stop at
// the first inner </section> and truncate any slide that nests one.
function topSections(src) {
  const out = [];
  const re = /<(\/?)section\b[^>]*>/gi;
  let depth = 0, start = -1, m;
  while ((m = re.exec(src)) !== null) {
    if (!m[1]) { if (depth++ === 0) start = m.index; }
    else if (depth > 0 && --depth === 0) out.push(src.slice(start, re.lastIndex));
  }
  return out;
}

const stripTags = (s) => String(s || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function deckSlides(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n');   // decks saved on Windows

  const out = [];
  for (const block of topSections(src)) {
    const tag = block.slice(0, block.indexOf('>') + 1);
    if (!/\bclass\s*=\s*["'][^"']*\bslide\b/i.test(tag)) continue;   // only real slides
    const body = block.slice(tag.length);
    const dt = /\bdata-title\s*=\s*("([^"]*)"|'([^']*)')/i.exec(tag);
    const h = /<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i.exec(body);
    const title = (dt ? (dt[2] != null ? dt[2] : dt[3]) : (h ? stripTags(h[1]) : '')).trim();
    out.push({ title, body });
  }
  return out.filter(s => s.title);
}

// Plain text of a whole deck, for the topic / traction checks.
export function deckText(text) {
  return stripTags(text);
}

// Line endings are normalised here, once, so every gate and generator can parse
// with '\n' — a template or deck checked out on Windows arrives as CRLF.
export function readIf(p) {
  try { return fs.readFileSync(p, 'utf8').replace(/\r\n?/g, '\n'); } catch { return null; }
}

export function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

// Pull the body of a markdown section whose heading matches `re`.
export function section(text, re) {
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  let inSec = false;
  for (const line of lines) {
    const h = /^#{1,3}\s+(.*)$/.exec(line);
    if (h) {
      if (inSec) break;
      if (re.test(h[1])) { inSec = true; continue; }
      continue;
    }
    if (inSec) out.push(line);
  }
  return out.join('\n').trim();
}

// Depth-first file walk that skips the usual noise.
export function walk(dir, filter, acc = [], depth = 0) {
  if (depth > 8) return acc;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (/^(node_modules|\.git|\.hackathon|dist|build|\.next|coverage|venv|__pycache__)$/.test(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, filter, acc, depth + 1);
    else if (filter(e.name)) acc.push(p);
  }
  return acc;
}

// ── port helpers ───────────────────────────────────────────────────────────
export function portFree(port) {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

export async function pickPort(hints) {
  for (const h of hints) {
    const p = Number(h);
    if (p > 0 && (await portFree(p))) return p;
  }
  for (let i = 0; i < 40; i++) {
    const p = 8900 + Math.floor(Math.random() * 99);
    if (await portFree(p)) return p;
  }
  return 8999;
}

// ── app detection + smoke test ─────────────────────────────────────────────
// python is `python` on Windows and `python3` almost everywhere else
const PY = isWin ? 'python' : 'python3';

export function detectStart(proj) {
  const pkg = readIf(path.join(proj, 'package.json'));
  if (pkg) {
    try {
      const j = JSON.parse(pkg);
      const s = j.scripts || {};
      if (s.dev) return { cmd: 'npm run dev', portHint: 5173, how: 'package.json dev script' };
      if (s.start) return { cmd: 'npm start', portHint: 3000, how: 'package.json start script' };
    } catch { /* fall through to file checks */ }
  }
  if (exists(path.join(proj, 'index.html')))
    return { cmd: `${PY} -m http.server {PORT}`, portHint: 8000, how: 'static index.html' };
  if (exists(path.join(proj, 'app.py')))
    return { cmd: `${PY} app.py`, portHint: 5000, how: 'python app.py' };
  if (exists(path.join(proj, 'main.py')))
    return { cmd: `${PY} main.py`, portHint: 8000, how: 'python main.py' };
  return null;
}

export async function fetchOk(url, ms = 3000) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    const res = await fetch(url, { signal: ctl.signal, redirect: 'follow' });
    clearTimeout(t);
    return res.status < 400;   // a 404 is a server that answers, not an app that serves
  } catch { return false; }
}

export async function fetchBody(url, ms = 5000) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    const res = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    return await res.text();
  } catch { return ''; }
}

function killTree(child, port) {
  void port;
  if (!child || child.exitCode !== null) return;
  if (isWin) {
    // /T kills the whole tree, which is what we want for npm -> vite
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  // POSIX: we spawned detached, so the child leads its own process group.
  // Signalling the group takes down npm/vite/python and all their workers.
  // (Never shell out to lsof here: it walks every process and FD, which hangs
  // and balloons memory on a loaded machine.)
  try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
  try { child.kill('SIGTERM'); } catch { /* already gone */ }
  const killer = setTimeout(() => {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ }
  }, 800);
  killer.unref?.();
}

// Start the app, wait until it answers, and hand back a live URL.
export async function startApp({ proj, evid, cfg = {} }) {
  const custom = cfg.START_CMD;
  const spec = custom
    ? { cmd: custom, portHint: Number(cfg.PORT) || 0, how: 'START_CMD' }
    : detectStart(proj);
  if (!spec) {
    return { ok: false, why: 'no runnable app found (need package.json, index.html, app.py or main.py)' };
  }

  fs.mkdirSync(evid, { recursive: true });
  const port = await pickPort([spec.portHint, cfg.PORT, 5173, 3000, 8080, 8000, 5000, 4173, 4321]);
  // `{PORT}` is the token; bare `PORT` still works for old configs, but never
  // when it is an env assignment like `PORT=3000 npm start`.
  const cmd = spec.cmd.replace(/\{PORT\}|\$PORT\b|\bPORT\b(?!=)/g, String(port));
  const logPath = path.join(evid, 'server.log');
  const out = fs.openSync(logPath, 'a');
  fs.appendFileSync(logPath, `\n--- ${new Date().toISOString()} :: ${cmd} (port ${port}) ---\n`);

  const child = spawn(cmd, {
    cwd: proj,
    shell: true,
    stdio: ['ignore', out, out],
    detached: !isWin,
  });

  // Only ever trust the port we chose, or a port our OWN process announces in
  // its log. Blindly probing common ports can match an unrelated leftover
  // server and hand back a false pass.
  const announced = () => {
    const t = readIf(logPath) || '';
    const m = [...t.matchAll(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]):(\d+)/g)];
    return m.length ? Number(m[m.length - 1][1]) : null;
  };

  let url = null;
  let usedPort = port;
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const ports = [port];
    const a = announced();
    if (a && !ports.includes(a)) ports.push(a);
    for (const p of ports) {
      const u = `http://127.0.0.1:${p}/`;
      if (await fetchOk(u)) { url = u; usedPort = p; break; }
    }
    if (url) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  const stop = () => {
    killTree(child, usedPort);
    try { fs.closeSync(out); } catch { /* ignore */ }
    // make sure the group is really gone before the next gate starts a server
    if (!isWin) { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* gone */ } }
  };

  if (!url) {
    const log = readIf(logPath) || '';
    stop();
    return { ok: false, why: `app did not start serving (cmd: ${cmd})`, log: log.split('\n').slice(-8).join('\n') };
  }
  return { ok: true, url, port: usedPort, cmd, how: spec.how, stop, logPath };
}

// ── headless screenshot ────────────────────────────────────────────────────
const BROWSERS = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
  ],
};

function whichSync(bin) {
  const r = spawnSync(isWin ? 'where' : 'which', [bin], { encoding: 'utf8' });
  if (r.status === 0) return r.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean)[0];
  return null;
}

export function findBrowser() {
  for (const c of BROWSERS[process.platform] || []) if (exists(c)) return c;
  for (const b of ['chrome', 'google-chrome', 'chromium', 'msedge', 'microsoft-edge'])
    { const p = whichSync(b); if (p) return p; }
  return null;
}

export function screenshot(url, outPath) {
  const bin = findBrowser();
  if (!bin) return { ok: false, why: 'no headless browser found (Chrome or Edge)' };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  // Run the browser in a SEPARATE node process. Headless Chrome can be OOM-
  // killed on a loaded laptop; if that happens only this child dies and the
  // gate degrades to a warning instead of taking the harness down with it.
  const helper = path.join(path.dirname(fileURLToPath(import.meta.url)), 'scripts', 'shot.mjs');
  const r = spawnSync(process.execPath, [helper, url, outPath], {
    encoding: 'utf8', timeout: 60000,
  });
  if (!exists(outPath) || fs.statSync(outPath).size === 0) {
    const why = (r.stderr || '').trim() || `exit ${r.status}${r.signal ? ', signal ' + r.signal : ''}`;
    return { ok: false, why };
  }
  return { ok: true, size: fs.statSync(outPath).size, path: outPath };
}

// ── process helper for tools (git, ffprobe) ─────────────────────────────────
export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8', shell: isWin, ...opts,
  });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

// ── pitch rules ────────────────────────────────────────────────────────────
// Shared by the intake (thin-answer checks) and the deck/script gates, so the
// bar the interviewer asks for is the bar the gates enforce.
//
// The first 30 seconds belong to the person with the problem — not a greeting,
// not the team name, not a feature list.
export const OPENER_BAD = /^["“]?\s*(hi|hello|hey|good (morning|afternoon|evening)|we are|we're|our (team|app|project|product|solution)|my name|i'm|i am|this is|today,? we|introducing|meet our)\b/i;
// Judges remember the last line. Make it the impact, not housekeeping.
export const CLOSER_BAD = /\b(thank you|thanks( for listening)?|any questions|that'?s (it|all)|the end)\b/i;
// The question a probing judge asks: what is not real yet?
export const LIMIT_Q = /\b(not (work|built|real|yet|done)|doesn'?t|isn'?t|fake|faked|mock|hard-?cod|seed(ed)?|limit|what if|real data|break|fail|scale|privacy|accura)/i;

// "Everything you say has to be true." A feature on the SPEC's cut list must not
// be presented as built. Mentions are fine where the sentence says so: future
// ("next", "we'd add"), negation ("no accounts needed"), or honest framing
// ("seeded", "mocked", "for the demo").
const HONEST = /\b(next|soon|later|roadmap|plan(ned)?|will|would|we'?d|going to|future|not|no|without|never|won'?t|isn'?t|aren'?t|yet|skip(ped)?|cut|mock(ed)?|fake(d)?|seed(ed)?|hard-?coded|simulat\w*|demo data|projection|projected)\b/i;

export function cutList(specText) {
  const body = section(specText || '', /cut list|non-goals|out of scope/i);
  return body.split('\n')
    .map(l => /^\s*[-*]\s+(.*)$/.exec(l))
    .filter(Boolean)
    .flatMap(m => m[1].replace(/\([^)]*\)/g, '').split(/\s*,\s*/))
    .map(t => t.replace(/[*_`]/g, '').trim())
    .filter(t => t.length >= 4);
}

// -> [{ term, line }] for every cut-list term stated as if it exists
export function cutClaims(text, terms) {
  const hits = [];
  const lines = String(text || '').split('\n');
  for (const term of terms) {
    const re = new RegExp(`(^|[^A-Za-z])${escapeRe(term).replace(/\s+/g, '\\s+')}([^A-Za-z]|$)`, 'i');
    lines.forEach((l, i) => {
      if (re.test(l) && !HONEST.test(l)) hits.push({ term, line: i + 1, text: l.trim().slice(0, 90) });
    });
  }
  return hits;
}

// ── project layout ─────────────────────────────────────────────────────────
// ONE place that says where things live, so the root stays clean:
//   HANDOFF.md, harness.mjs     — the two files a person opens
//   present/                    — everything you show or ship
//     app/  deck/  script.md  demo-backup.mp4
//   .hackathon/                 — everything the agent uses
//     SPEC.md HACKATHON.md GOALS.md TIMELINE.md NOTES.md answers.json context/ …
export function layout(proj) {
  const agent = path.join(proj, '.hackathon');
  const present = path.join(proj, 'present');
  return {
    proj, agent, present,
    app: path.join(present, 'app'),
    deck: path.join(present, 'deck'),
    script: path.join(present, 'script.md'),
    handoff: path.join(proj, 'HANDOFF.md'),
    spec: path.join(agent, 'SPEC.md'),
    hackathon: path.join(agent, 'HACKATHON.md'),
    goals: path.join(agent, 'GOALS.md'),
    timeline: path.join(agent, 'TIMELINE.md'),
    notes: path.join(agent, 'NOTES.md'),
    context: path.join(agent, 'context'),
    answers: path.join(agent, 'answers.json'),
    evidence: path.join(agent, 'evidence'),
  };
}
