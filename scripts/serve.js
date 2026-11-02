// Zero-dependency static server (ES modules need http://, not file://).  npm start
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/plain', '.png': 'image/png' };
const port = Number(process.env.PORT) || 8080;

createServer(async (req, res) => {
  let file;
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = join(root, path === '/' ? 'index.html' : path);
  } catch { res.writeHead(400).end('Bad request'); return; }
  if (!file.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
  let body;
  try { body = await readFile(file); } catch { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }).end(body);
}).listen(port, () => console.log(`Treasure-Island Bridge Safety Map: http://localhost:${port}`));
