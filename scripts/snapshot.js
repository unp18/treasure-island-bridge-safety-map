// Writes static HTML snapshots of chosen replay steps, produced by the SAME
// buildView/renderApp code the browser runs.  npm run snapshots
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Replay } from '../src/replay/controller.js';
import { archipelago } from '../src/data/archipelago.js';
import { buildView } from '../src/ui/viewmodel.js';
import { renderApp } from '../src/ui/html.js';

const css = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8');
// Static snapshots use the light theme with variables resolved (older renderers lack var()).
const vars = Object.fromEntries([...css.match(/:root\{([^}]*)\}/)[1].matchAll(/--([\w-]+):([^;]+)/g)].map((m) => [m[1], m[2]]));
const flat = css.replace(/@media[^{]*\{:root\{[^}]*\}\}/, '').replace(/var\(--([\w-]+)\)/g, (_, k) => vars[k]);

const shots = [
  ['01-loaded', 0], ['02-back-connection', 7], ['03-bridge-found', 27], ['04-strict-case-not-a-bridge', 38], ['05-final', 'end'],
];
mkdirSync(new URL('../docs/screenshots/', import.meta.url), { recursive: true });
for (const [name, steps] of shots) {
  const r = new Replay(); r.load(archipelago);
  if (steps === 'end') r.runToEnd(); else for (let i = 0; i < steps; i++) r.step();
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${name}</title><style>${flat}</style></head><body><div id="app">${renderApp(buildView(r, archipelago))}</div></body></html>`;
  writeFileSync(new URL(`../docs/screenshots/${name}.html`, import.meta.url), html);
  console.log(`wrote docs/screenshots/${name}.html`);
}
