#!/usr/bin/env node
// Check the deck, refusing to pass while any <PLACEHOLDER> remains.
//   node scripts/build-deck.mjs [deckDir] [--images]
//
// The deck is deck/slides.html — a self-contained HTML file that IS the
// presentation. There is nothing to render: no Marp, no npx, no network.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { placeholders, designTells, readIf, green, red, yellow, dim, deckSlides, screenshot } from '../lib.mjs';

// Tag the same object with data-morph="key" (or class="morph") on two slides
// and give it a view-transition-name, so the browser interpolates its position
// and size between slides like PowerPoint Morph / Keynote Magic Move.
const MORPH_SCRIPT = '<script id="deck-morph">(function(){function name(el){var k=el.getAttribute("data-morph")||(/\\bmorph\\b/.test(el.className||"")?"object":null);if(!k)return;el.style.viewTransitionName="deck-"+String(k).replace(/[^a-zA-Z0-9_-]/g,"-");}function apply(){document.querySelectorAll("[data-morph], .morph").forEach(name);}if(document.readyState!=="loading")apply();else document.addEventListener("DOMContentLoaded",apply);})();<\/script>';

function injectMorph(htmlPath) {
  let html = readIf(htmlPath);
  if (!html || html.includes('id="deck-morph"')) return;
  html = html.replace(/<\/body>/i, MORPH_SCRIPT + '\n</body>');
  fs.writeFileSync(htmlPath, html);
}

// The file is the deck. We validate it (no leftover tokens, none of the banned
// fonts / icon packs), make sure the morph script is present, and — with
// --images — shoot each slide for review.
function buildHtmlDeck({ deckDir, htmlPath, images, quiet }) {
  const html = readIf(htmlPath) || '';

  const hits = placeholders(html);
  if (hits.length) {
    if (!quiet) {
      console.error(red('build-deck: UNFILLED PLACEHOLDERS — fix these before presenting:'));
      for (const h of hits) console.error(`  line ${h.line}: ${h.token}`);
      console.error(dim('A placeholder on the projector is worse than a missing slide.'));
    }
    return 1;
  }

  const tells = designTells(html + '\n' + (readIf(path.join(deckDir, 'theme.css')) || ''));
  if (tells.length) {
    if (!quiet) {
      console.error(red('build-deck: generic design defaults in slides.html:'));
      for (const t of tells) console.error(`  ${t}`);
      console.error(dim('Swap --font-display / --font-body / --font-mono for a distinctive pairing.'));
    }
    return 1;
  }

  injectMorph(htmlPath);
  const slides = deckSlides(html);
  if (!slides.length) {
    if (!quiet) console.error(red('build-deck: no <section class="slide"> found in slides.html'));
    return 1;
  }
  if (!quiet) console.log(green(`build-deck: ok -> ${path.relative(process.cwd(), htmlPath)} (${slides.length} slides, no render step)`));

  if (images) {
    if (!quiet) console.log(dim('build-deck: shooting review images (one per slide)'));
    const url = pathToFileURL(htmlPath).href;
    // review images are the agent's evidence, not something the team presents
    const reviewDir = path.resolve(deckDir, '..', '..', '.hackathon', 'evidence', 'deck');
    let ok = 0;
    slides.forEach((_, i) => {
      const out = path.join(reviewDir, `slides.${String(i + 1).padStart(2, '0')}.png`);
      if (screenshot(`${url}?still=1#${i + 1}`, out).ok) ok += 1;
    });
    if (!quiet) {
      if (ok) console.log(yellow(`build-deck: ${ok} review image(s) in .hackathon/evidence/deck/ — LOOK at them before you present`));
      else console.log(red('build-deck: review images failed (install Chrome or Edge)'));
    }
  }
  return 0;
}

export function buildDeck({ deckDir, images = false, quiet = false }) {
  const htmlPath = path.join(deckDir, 'slides.html');
  if (!fs.existsSync(htmlPath)) {
    if (!quiet) {
      console.error(red(`build-deck: no deck — expected ${path.relative(process.cwd(), htmlPath)}`));
      if (fs.existsSync(path.join(deckDir, 'slides.md')))
        console.error(dim('slides.md (Marp) is no longer used — run: node harness.mjs deck --init --force'));
    }
    return 1;
  }
  return buildHtmlDeck({ deckDir, htmlPath, images, quiet });
}

// CLI entry
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/') || process.argv[1]?.endsWith('build-deck.mjs')) {
  const a = process.argv.slice(2);
  const deckDir = a.find(x => !x.startsWith('--')) || process.cwd();
  process.exit(buildDeck({ deckDir: path.resolve(deckDir), images: a.includes('--images') }));
}
