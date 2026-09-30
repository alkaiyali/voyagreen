// Tiny static server with clean URLs, for exported SPA / static builds
// (Expo `expo export -p web`, Vite `dist/`). Node built-ins only.
//   node serve-static.mjs <dir> <port>
// /trip/carabao → trip/carabao.html → trip/carabao/index.html → [id].html → 404.html
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3]) || 8081;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json', '.mp4': 'video/mp4' };

const file = (p) => { try { return fs.statSync(p).isFile() ? p : null; } catch { return null; } };
function resolve(urlPath) {
  const rel = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/index';
  const abs = path.join(root, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!abs.startsWith(root)) return null;
  const hit = file(abs) || file(abs + '.html') || file(path.join(abs, 'index.html'));
  if (hit) return hit;
  // dynamic route fallback: /trip/xyz → trip/[id].html
  const dir = path.dirname(abs);
  try {
    const dyn = fs.readdirSync(dir).find((f) => /^\[.+\]\.html$/.test(f));
    if (dyn) return path.join(dir, dyn);
  } catch { /* no such dir */ }
  return file(path.join(root, '+not-found.html')) || file(path.join(root, '404.html'));
}

http.createServer((req, res) => {
  const f = resolve(req.url || '/');
  if (!f) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}/`));
