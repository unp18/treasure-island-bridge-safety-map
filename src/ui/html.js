// Pure: view -> HTML string. Encodings that must survive without CSS (dashes, double
// strokes, thickness) are inline SVG attributes; colours live in styles.css.
import { VIEWBOX } from './viewmodel.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const f = (n) => Math.round(n * 10) / 10;

// Edge labels sit beside their line, not on it: step off the midpoint along the
// line's normal (the side that points up, or right for a vertical line).
function edgeLabelPos(e) {
  const dx = e.x2 - e.x1, dy = e.y2 - e.y1, len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len;
  if (ny > 0 || (Math.abs(ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
  const gap = e.style === 'bridge' ? 16 : 12;
  const anchor = nx > 0.35 ? 'start' : nx < -0.35 ? 'end' : 'middle';
  return { x: e.mx + nx * gap, y: e.my + ny * gap + (ny > -0.5 ? 5 : 0), anchor };
}

function edgeSvg(e) {
  const lp = edgeLabelPos(e);
  const xy = `x1="${f(e.x1)}" y1="${f(e.y1)}" x2="${f(e.x2)}" y2="${f(e.y2)}"`;
  let s = '';
  if (e.highlighted) s += `<line class="edge-glow" ${xy} stroke-width="16"/>`;
  if (e.style === 'bridge') {
    s += `<line class="edge bridge" ${xy} stroke-width="11"/><line class="bridge-gap" ${xy} stroke-width="4"/>`;
  } else if (e.style === 'tree') {
    s += `<line class="edge tree" ${xy} stroke-width="6"/>`;
  } else if (e.style === 'nontree') {
    s += `<line class="edge nontree" ${xy} stroke-width="3" stroke-dasharray="9 7"/>`;
  } else {
    s += `<line class="edge untouched" ${xy} stroke-width="2"/>`;
  }
  return `<g data-edge="${esc(e.id)}" data-style="${e.style}">${s}<text class="t-edge${e.style === 'bridge' ? ' t-bridge' : ''}" x="${f(lp.x)}" y="${f(lp.y)}" text-anchor="${lp.anchor}">${esc(e.label)}</text></g>`;
}

function nodeSvg(n) {
  const { x, y } = n;
  const sw = n.current ? 6 : n.highlighted ? 4 : 2.5;
  let s = `<g data-node="${esc(n.id)}" class="node ${n.status}${n.current ? ' current' : ''}${n.highlighted ? ' hl' : ''}${n.articulation ? ' art' : ''}">`;
  if (n.articulation) s += `<circle class="art-ring" cx="${f(x)}" cy="${f(y)}" r="30" fill="none" stroke-width="2" stroke-dasharray="2 4"/>`;
  s += `<circle class="body" cx="${f(x)}" cy="${f(y)}" r="22" stroke-width="${sw}"${n.status === 'unvisited' ? ' stroke-dasharray="5 4"' : ''}/>`;
  s += `<text class="t-id" x="${f(x)}" y="${f(y + 6)}" text-anchor="middle">${esc(n.id)}</text>`;
  if (n.current) s += `<text class="t-mark" x="${f(x - 30)}" y="${f(y + 6)}" text-anchor="end">▶</text>`;
  if (n.articulation) s += `<text class="t-art" x="${f(x)}" y="${f(y + 73)}" text-anchor="middle">★ ARTICULATION</text>`;
  s += `<text class="t-name" x="${f(x)}" y="${f(y + 42)}" text-anchor="middle">${esc(n.name)}</text>`;
  s += `<text class="t-val" x="${f(x)}" y="${f(y + 57)}" text-anchor="middle">${n.discovery === null ? 'unvisited' : `d=${n.discovery} low=${n.low}`}</text></g>`;
  return s;
}

const btn = (action, label, enabled) => `<button type="button" data-action="${action}"${enabled ? '' : ' disabled'}>${label}</button>`;
const list = (items, empty) => (items.length ? `<ul>${items.map((i) => `<li><b>${esc(i.id)}</b> ${esc(i.text)}</li>`).join('')}</ul>` : `<p class="none">${empty}</p>`);

const LEGEND = `<section class="card legend"><h2>Key</h2>
<p><b>Bridges (lines):</b> thin grey = not inspected yet · <b>bold solid</b> = DFS tree edge · <b>dashed</b> = inspected non-tree edge · <b>double red line + BRIDGE</b> = critical bridge · amber glow = this event.</p>
<p><b>Islands:</b> dashed ring = unvisited · ring with d/low = discovered · pale fill = searching, solid fill = done · ▶ = current · <b>★ ARTICULATION</b> with dotted outer ring = critical island.</p></section>`;

export function renderApp(v) {
  const controls = `${btn('load', 'Load My Archipelago', v.controls.load)}${btn('step', 'Step', v.controls.step)}${btn('run', 'Run to End', v.controls.run)}${btn('reset', 'Reset', v.controls.reset)}`;
  const header = `<header class="top"><h1>Treasure-Island Bridge Safety Map</h1><div class="controls">${controls}<span class="progress">${esc(v.progress)}</span></div></header>`;

  const eventCard = `<section class="card event" aria-live="polite"><h2>Current event${v.eventType ? ` <span class="badge">${esc(v.eventType)}</span>` : ''}</h2><p class="evtext">${esc(v.eventText)}</p></section>`;

  if (v.phase === 'error') {
    const items = v.errors.map((e) => `<li><b>${esc(e.code)}</b> ${esc(e.message)}</li>`).join('');
    return `${header}<main><section class="card err" role="alert"><h2>Graph not accepted</h2><ul>${items}</ul><p>No replay or results are shown, because nothing was analysed.</p></section>${eventCard}</main>`;
  }
  if (v.phase === 'empty') {
    return `${header}<main><section class="card"><h2>Island map</h2><p class="none">No archipelago loaded.</p></section>${eventCard}${LEGEND}</main>`;
  }

  const s = v.summary;
  const map = `<section class="card"><h2>Island map</h2><svg viewBox="${VIEWBOX}" role="img" aria-label="Island and bridge map">${v.edges.map(edgeSvg).join('')}${v.nodes.map(nodeSvg).join('')}</svg></section>`;
  const summary = `<section class="card summary"><h2>Safety summary</h2>
<p>Components: <b>${s.componentCount}</b>${s.final ? ' (final)' : ' found so far'}</p>
<h3>Critical bridges (${s.bridges.length})</h3>${list(s.bridges, s.final ? 'None.' : 'None revealed yet.')}
<h3>Articulation islands (${s.articulation.length})</h3>${list(s.articulation, s.final ? 'None.' : 'None revealed yet.')}
<p class="note">${s.final ? 'Replay complete. Closing any bridge or island listed here would cut part of the festival off from the rest.' : 'Results appear when the replay reaches them.'}</p></section>`;
  const rows = v.table.map((r) => `<tr><td><b>${esc(r.id)}</b> ${esc(r.name)}</td><td>${esc(r.parent)}</td><td>${esc(r.discovery)}</td><td>${esc(r.low)}</td><td>${esc(r.status)}</td></tr>`).join('');
  const table = `<section class="card"><h2>Node table</h2><table><thead><tr><th>Island</th><th>Parent</th><th>Disc</th><th>Low</th><th>State</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  const hist = `<details class="card" open><summary>Event history (${v.history.length})</summary><ol class="hist">${v.history.map((h) => `<li value="${h.step + 1}"${h.current ? ' class="cur"' : ''}>${esc(h.text)}</li>`).join('')}</ol></details>`;

  return `${header}<main><div class="col left">${map}${eventCard}${hist}</div><div class="col right">${summary}${table}${LEGEND}</div></main>`;
}
