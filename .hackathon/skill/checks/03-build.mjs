// GATE 3 — build: the app actually starts and serves real content.
// "It works on my machine" is not evidence; a served response is.
import fs from 'node:fs';
import path from 'node:path';
import { startApp, fetchBody, placeholders, exists, layout } from '../lib.mjs';

export default async function gate({ proj, evid, cfg }) {
  const pass = [], fail = [], warn = [];

  const appDir = layout(proj).app;
  const hasEntry = ['package.json', 'index.html', 'app.py', 'main.py'].some(f => exists(path.join(appDir, f)));
  if (!hasEntry) {
    fail.push('no app entry point in present/app/ (package.json, index.html, app.py or main.py)');
    return { pass, fail, warn };
  }
  pass.push('app entry point present');

  const app = await startApp({ proj: appDir, evid, cfg });
  if (!app.ok) {
    fail.push(app.why);
    if (app.log) warn.push(...app.log.split('\n').filter(Boolean).map(l => 'server: ' + l));
    return { pass, fail, warn };
  }
  pass.push(`app serves at ${app.url} (${app.cmd})`);

  const body = await fetchBody(app.url);
  if (body.length < 300) {
    fail.push(`served page is only ${body.length} bytes — that is an empty shell`);
  } else {
    pass.push(`served page has content (${body.length} bytes)`);
  }
  // check what the browser gets, not a file on disk — a framework app's
  // index.html is a shell, and a static one is what is served anyway
  const hits = placeholders(body);
  if (hits.length) fail.push(`served page has ${hits.length} template token(s): ${hits.map(h => h.token).join(', ')}`);
  app.stop();

  try {
    fs.writeFileSync(path.join(evid, 'build.json'),
      JSON.stringify({ at: Date.now(), gate: 'build', url: app.url, bytes: body.length, ok: true }, null, 2));
    pass.push('evidence written to .hackathon/evidence/build.json');
  } catch { /* non-fatal */ }

  return { pass, fail, warn };
}

// Goal metadata — the human-readable twin of the gate above. The harness
// renders GOALS.md from this, so the checklist can never drift from the code.
export const meta = {
  title: 'Build the demo path',
  owner: 'driver',
  criteria: [
    'app entry point present (single index.html is enough)',
    'app starts and serves real content (>300 bytes, not an empty shell)',
    'no template tokens in the served page',
  ],
};
