#!/usr/bin/env node
// Isolated headless screenshot. Runs in its own process so that a crashing or
// OOM-killed browser takes down THIS script, not the harness gate that called it.
//   node scripts/shot.mjs <url> <outfile>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { findBrowser } from '../lib.mjs';

const [url, out] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: shot.mjs <url> <outfile>');
  process.exit(2);
}

const bin = findBrowser();
if (!bin) {
  console.error('no headless browser found (install Chrome or Edge)');
  process.exit(3);
}

fs.mkdirSync(path.dirname(out), { recursive: true });

// Throwaway profile, removed below — one per screenshot adds up over a day.
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hackathon-shot-'));

// Low-memory / container-safe flags. Hackathon laptops are usually loaded.
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-software-rasterizer',
  '--hide-scrollbars',
  '--no-first-run',
  `--user-data-dir=${profile}`,
  '--no-default-browser-check',
  '--js-flags=--max-old-space-size=256',
  '--window-size=1280,900',
  '--virtual-time-budget=4000',
  `--screenshot=${out}`,
  url,
];

const r = spawnSync(bin, args, { stdio: 'ignore', timeout: 45000 });
try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome may still hold it on Windows */ }
if (!fs.existsSync(out) || fs.statSync(out).size === 0) {
  console.error(`screenshot failed (exit ${r.status}${r.signal ? ', signal ' + r.signal : ''})`);
  process.exit(1);
}
console.log(String(fs.statSync(out).size));
process.exit(0);
