// Palette generator — one accent in, a complete pro-grade token set out, shared
// by the app AND the deck so both look like the same product.
//
//   node harness.mjs palette <#accent> [--dark]      (light is the default: projectors)
//
// Built in OKLCH (perceptually even), not by eyeballing hex:
//   • neutrals   a 9-step ramp. Tinted *away* from a warm accent (amber on
//                slate stays crisp; amber on warm black turns to mud) and
//                barely toward a cool one.
//   • accent     the team's colour, lifted if needed to pass contrast, plus a
//                10-step ramp (50–900) — use a step, never the accent at
//                reduced opacity (a faded accent over a dark ground is mud).
//   • semantic   success / warning / danger / info, each with fg · bg · border.
//                Status is never the accent: amber means "caution" whatever
//                the brand says.
//   • checks     every text pairing is verified against WCAG AA and nudged
//                until it passes.
// Node built-ins only.

// ── colour math (Björn Ottosson's OKLab) ──────────────────────────────────
const toLin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}
const rgbToHex = rgb => '#' + rgb.map(c => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

export function rgbToOklch([r, g, b]) {
  const [R, G, B] = [r, g, b].map(toLin);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const C = Math.hypot(a, bb);
  const H = (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360;
  return [L, C, H];
}

function oklchToLinear([L, C, H]) {
  const a = C * Math.cos(H * Math.PI / 180), b = C * Math.sin(H * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

// OKLCH -> hex, reducing chroma until the colour fits in sRGB (keeps L and H)
export function oklchToHex(L, C, H) {
  let lo = 0, hi = Math.max(0, C);
  const fits = c => oklchToLinear([L, c, H]).every(v => v >= -1e-4 && v <= 1 + 1e-4);
  if (!fits(hi)) {
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    hi = lo;
  }
  return rgbToHex(oklchToLinear([L, hi, H]).map(toSrgb));
}

// ── WCAG contrast ─────────────────────────────────────────────────────────
const lum = hex => { const [r, g, b] = hexToRgb(hex).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function contrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// ── the palette ───────────────────────────────────────────────────────────
// allowed hue band per status (OKLCH degrees): the colour must still read as its meaning
const SEMANTIC = { success: [138, 162], warning: [55, 92], danger: [18, 32], info: [228, 258] };
const RAMP = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export function generatePalette(accentHex, { mode = 'light' } = {}) {
  const rgb = hexToRgb(accentHex);
  if (!rgb) throw new Error(`not a hex colour: ${accentHex}`);
  const [aL, aC, aH] = rgbToOklch(rgb);
  const dark = mode !== 'light';
  const warm = aC > 0.04 && aH >= 20 && aH <= 115;
  const nH = warm ? 255 : aH;                  // warm accent -> cool slate neutrals
  const nC = aC < 0.04 ? 0.004 : (warm ? 0.013 : 0.009);
  const n = L => oklchToHex(L, nC, nH);

  const N = dark
    ? { bg: .165, surface: .205, surface2: .245, raised: .285, border: .34, borderStrong: .43, faint: .60, muted: .74, text: .955 }
    : { bg: .985, surface: 1, surface2: .962, raised: .935, border: .86, borderStrong: .77, faint: .58, muted: .47, text: .20 };
  const t = {};
  for (const [k, L] of Object.entries(N)) t[k] = n(L);

  // text must clear AA on every surface it sits on — nudge until it does
  const lift = (L, step, target, against) => {
    let hex = n(L), i = 0;
    while (Math.min(...against.map(bg => contrast(hex, bg))) < target && i++ < 40) { L += step; hex = n(L); }
    return hex;
  };
  const surfaces = [t.bg, t.surface, t.surface2];
  t.muted = lift(N.muted, dark ? 0.01 : -0.01, dark ? 4.5 : 5.5, surfaces);   // light: headroom for projector washout
  t.faint = lift(N.faint, dark ? 0.01 : -0.01, 3, [t.bg, t.surface]);

  // The accent stays the team's exact brand colour — it fills buttons, shapes
  // and the flood slide. Where it is used as TEXT on the background it needs
  // 4.5:1, so --accent-text is the same hue and chroma with lightness moved
  // only as far as that demands (amber stays amber; amber text goes deeper).
  t.accent = rgbToHex(rgb);
  t.accentOriginal = t.accent;
  let L = aL, accentText = t.accent, guard = 0;
  while (contrast(accentText, t.bg) < 4.5 && guard++ < 60) { L += dark ? 0.01 : -0.01; accentText = oklchToHex(L, aC, aH); }
  t.accentText = accentText;
  const accent = t.accent;
  t.accentFg = [n(dark ? .165 : .20), '#FFFFFF', n(.14)]
    .sort((p, q) => contrast(q, accent) - contrast(p, accent))[0];

  const shape = [.25, .45, .7, .9, 1, 1, .95, .85, .7, .55];
  const lights = [.97, .93, .87, .80, .72, .64, .55, .45, .35, .26];
  t.ramp = {};
  RAMP.forEach((k, i) => { t.ramp[k] = oklchToHex(lights[i], aC * shape[i], aH); });
  t.accentDeep = t.ramp[dark ? 900 : 100];
  t.glow = oklchToHex(dark ? .42 : .88, aC * .45, aH);

  // semantic states, never the accent's hue family
  t.semantic = {};
  const clashes = [];
  for (const [name, [lo, hi]] of Object.entries(SEMANTIC)) {
    // Each status keeps its meaning — danger stays red, success stays green —
    // but takes the hue inside its band that sits farthest from the accent, so
    // a status never reads as brand. If the band cannot get clear (a red brand
    // vs danger), say so rather than bend danger into pink.
    const dist = h => { const d = Math.abs(h - aH) % 360; return Math.min(d, 360 - d); };
    let hue = (lo + hi) / 2;
    if (aC > 0.04 && dist(hue) < 28) {                     // only move a status that is near the accent
      for (let h = lo; h <= hi; h += 1) if (dist(h) > dist(hue)) hue = h;
      if (dist(hue) < 20) {
        hue = lo;   // can't get clear anyway: use the band's canonical end (orange warning, true red danger)
        clashes.push(`${name} shares the accent's hue — keep status to ${name} tokens + an icon/label, never colour alone`);
      }
      else clashes.push(`${name} nudged to ${Math.round(hue)}° to stay clear of the accent`);
    }
    let fgL = dark ? .70 : .50, fg = oklchToHex(fgL, .18, hue), g = 0;
    const bg = oklchToHex(dark ? .27 : .965, dark ? .045 : .03, hue);
    while (contrast(fg, bg) < 4.5 && g++ < 40) { fgL += dark ? .01 : -.01; fg = oklchToHex(fgL, .18, hue); }
    t.semantic[name] = { fg, bg, border: oklchToHex(dark ? .42 : .85, dark ? .09 : .06, hue) };
  }

  return { mode: dark ? 'dark' : 'light', warm, clashes, tokens: t };
}

// Every text pairing a reader will actually see, with its AA bar.
export function checks({ tokens: t }) {
  const rows = [
    ['text on bg', t.text, t.bg, 4.5],
    ['text on surface', t.text, t.surface, 4.5],
    ['muted on bg', t.muted, t.bg, 4.5],
    ['muted on surface', t.muted, t.surface, 4.5],
    ['accent text on bg', t.accentText, t.bg, 4.5],
    ['on-accent text', t.accentFg, t.accent, 4.5],
    ...Object.entries(t.semantic).map(([k, s]) => [`${k} on its bg`, s.fg, s.bg, 4.5]),
  ];
  return rows.map(([name, fg, bg, min]) => ({ name, fg, bg, min, ratio: contrast(fg, bg), ok: contrast(fg, bg) >= min }));
}

export function renderCss(p, source = '') {
  const t = p.tokens;
  const L = [
    `/* palette.css — generated by \`node harness.mjs palette ${t.accentOriginal}${p.mode === 'dark' ? ' --dark' : ''}\`${source}.`,
    '   Shared by the app and the deck. Do not hand-edit: rerun the command.',
    '   Use ramp steps for quieter accents — never the accent at reduced opacity.',
    '   Status uses --success/--warning/--danger/--info, never the accent. */',
    ':root {',
    `  color-scheme: ${p.mode};`,
    '',
    '  /* neutrals */',
    `  --bg: ${t.bg};  --surface: ${t.surface};  --surface-2: ${t.surface2};  --raised: ${t.raised};`,
    `  --border: ${t.border};  --border-strong: ${t.borderStrong};`,
    `  --text: ${t.text};  --text-muted: ${t.muted};  --text-faint: ${t.faint};`,
    '',
    '  /* accent — emphasis only, ~10% of the screen at most */',
    `  --accent: ${t.accent};  --accent-fg: ${t.accentFg};  --accent-text: ${t.accentText};   /* fills · text on a fill · accent-coloured text */`,
    '  ' + RAMP.map(k => `--accent-${k}: ${t.ramp[k]};`).join(' '),
    `  --glow: ${t.glow};`,
    '',
    '  /* semantic states */',
    ...Object.entries(t.semantic).map(([k, s]) => `  --${k}: ${s.fg};  --${k}-bg: ${s.bg};  --${k}-border: ${s.border};`),
    '',
    '  /* the deck template\'s names for the same tokens */',
    '  --ink: var(--bg);  --ink-2: var(--surface);  --paper: var(--text);  --muted: var(--text-muted);',
    '  --accent-deep: ' + t.accentDeep + ';',
    `  --hairline: color-mix(in oklab, var(--text) 14%, transparent);`,
    `  --glass: color-mix(in oklab, var(--text) 6%, transparent);`,
    '}',
    '',
  ];
  return L.join('\n');
}

// Pull simple colour custom properties out of CSS text (last one wins) and
// resolve var() aliases, so gates can check what a page actually uses.
export function readTokens(...cssTexts) {
  const map = {};
  for (const css of cssTexts) {
    for (const m of String(css || '').matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}\n]+)/gi)) map[m[1].toLowerCase()] = m[2].trim();
  }
  const resolve = (v, depth = 0) => {
    const r = /^var\((--[a-z0-9-]+)\)$/i.exec(v || '');
    if (r && depth < 6) return resolve(map[r[1].toLowerCase()], depth + 1);
    return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v || '') ? v : null;
  };
  const out = {};
  for (const k of Object.keys(map)) { const v = resolve(map[k]); if (v) out[k] = v; }
  return out;
}

// Is this page dark? (Projectors in a lit room wash dark themes out to grey.)
export function isDarkTheme(tok) {
  const bg = tok['--bg'] || tok['--ink'];
  return bg ? contrast(bg, '#000000') < 8 : false;     // i.e. the background is closer to black than to white
}

// Contrast failures among the token pairs a page defines (either naming).
export function tokenFailures(tok) {
  const pick = (...names) => names.map(n => tok[n]).find(Boolean);
  const bg = pick('--bg', '--ink');
  if (!bg) return [];
  const pairs = [
    ['text', pick('--text', '--paper'), bg, 4.5],
    ['muted text', pick('--text-muted', '--muted'), bg, 4.5],
    ['accent text', tok['--accent-text'] || tok['--accent'], bg, 3],   // accent-coloured text (the brand fill itself may be lighter)
    ['text on accent', tok['--accent-fg'], tok['--accent'], 4.5],
  ];
  return pairs.filter(([, fg, b]) => fg && b)
    .map(([name, fg, b, min]) => ({ name, fg, bg: b, min, ratio: contrast(fg, b) }))
    .filter(r => r.ratio < r.min);
}
