import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Replay } from '../src/replay/controller.js';
import { buildView } from '../src/ui/viewmodel.js';
import { renderApp, esc } from '../src/ui/html.js';
import { archipelago } from '../src/data/archipelago.js';

const page = (steps, graph = archipelago) => {
  const r = new Replay(); r.load(graph);
  for (let i = 0; i < steps; i++) r.step();
  return renderApp(buildView(r, graph));
};
const final = () => { const r = new Replay(); r.load(archipelago); r.runToEnd(); return renderApp(buildView(r, archipelago)); };

test('empty page offers all four controls; only Load is enabled', () => {
  const h = renderApp(buildView(new Replay(), archipelago));
  for (const label of ['Load My Archipelago', 'Step', 'Run to End', 'Reset']) assert.ok(h.includes(`>${label}</button>`), label);
  assert.match(h, /data-action="load">/);
  for (const a of ['step', 'run', 'reset']) assert.match(h, new RegExp(`data-action="${a}" disabled`));
});

test('all four panels are on the page together once loaded', () => {
  const h = page(10);
  for (const part of ['Island map', 'Current event', 'Node table', 'Safety summary', 'Event history', 'Components:', 'Key']) assert.ok(h.includes(part), part);
});

test('non-colour encodings: dashes, double stroke, markers and text labels', () => {
  const h = final();
  assert.match(h, /data-style="nontree">.*?stroke-dasharray="9 7"/);          // dashed non-tree edge
  assert.match(h, /data-style="tree">.*?stroke-width="6"/);                   // bold tree edge
  assert.match(h, /data-edge="BR4" data-style="bridge"><line class="edge bridge"[^>]*stroke-width="11"\/><line class="bridge-gap"/); // double stroke
  assert.ok(h.includes('BR4 BRIDGE'));                                         // text label
  assert.equal((h.match(/class="t-art"[^>]*>★ ARTICULATION</g) || []).length, 4);   // symbol + text on each critical island, not just in the Key
  assert.ok(!page(5).includes('class="t-art"'));                              // not revealed before its event
  assert.match(h, /class="art-ring"[^>]*stroke-dasharray="2 4"/);              // dotted outer ring
  const start = page(0);
  assert.match(start, /class="body"[^>]*stroke-dasharray="5 4"/);              // unvisited = dashed ring
  assert.ok(start.includes('unvisited'));
});

test('current island is marked with ▶ and the event text appears on screen', () => {
  const h = page(7);
  assert.ok(h.includes('▶'));
  assert.ok(h.includes('low[C] 2 → 0'));
  assert.match(h, /class="cur"/);
});

test('final page shows summaries and the completion note', () => {
  const h = final();
  assert.ok(h.includes('Components: <b>1</b> (final)'));
  assert.ok(h.includes('Critical bridges (3)') && h.includes('Articulation islands (4)'));
  assert.ok(h.includes('Coral Key – Driftwood Isle'));
  assert.ok(h.includes('Replay complete'));
  assert.match(h, /data-action="step" disabled/);
});

test('every step renders cleanly: no undefined/NaN, and the event sentence is shown', () => {
  const r = new Replay(); r.load(archipelago);
  for (let k = 0; k <= 53; k++) {
    const v = buildView(r, archipelago);
    const h = renderApp(v);
    assert.ok(!/undefined|NaN|\[object/.test(h), `step ${k}`);
    assert.ok(h.includes(esc(v.eventText)), `step ${k}`);
    r.step();
  }
});

test('island names and error text are HTML-escaped', () => {
  const g = JSON.parse(JSON.stringify(archipelago));
  g.nodes[0].name = '<img src=x onerror=alert(1)> & "Cove"';
  const h = page(3, g);
  assert.ok(!h.includes('<img'));
  assert.ok(h.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;Cove&quot;'));
  const bad = JSON.parse(JSON.stringify(archipelago)); bad.edges[0].to = '<b>X</b>';
  const r = new Replay(); r.load(bad);
  const e = renderApp(buildView(r, bad));
  assert.ok(!e.includes('<b>X</b>') && e.includes('&lt;b&gt;X&lt;/b&gt;'));
  assert.ok(e.includes('role="alert"') && e.includes('UNKNOWN_ENDPOINT'));
});

// Layout regression (found by opening the page in real Chromium): labels were drawn
// on top of their own lines and nodes, hiding "BR4 BRIDGE" and cutting through names.
test('every edge label sits beside its line, never on its midpoint', () => {
  const h = final();
  const edges = [...h.matchAll(/<g data-edge="(BR\d)"[^>]*>(.*?)<\/g>/g)];
  assert.equal(edges.length, 9);
  for (const [, id, body] of edges) {
    const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map((a) => Number(body.match(new RegExp(`${a}="([-\\d.]+)"`))[1]));
    const t = body.match(/<text[^>]*x="([-\d.]+)" y="([-\d.]+)"/);
    const [tx, ty] = [Number(t[1]), Number(t[2])];
    const len = Math.hypot(x2 - x1, y2 - y1);
    // perpendicular distance from the label anchor to the infinite line
    const dist = Math.abs((x2 - x1) * (y1 - ty) - (x1 - tx) * (y2 - y1)) / len;
    assert.ok(dist >= 8, `${id} label is ${dist.toFixed(1)}px from its line`);
  }
});

test('the star label is placed below the island name and values, not above the node', () => {
  const h = final();
  const m = h.match(/<g data-node="C"[^>]*>(.*?)<\/g>/);
  assert.ok(m, 'node C group');
  const y = (cls) => Number(m[1].match(new RegExp(`class="${cls}"[^>]*y="([-\\d.]+)"`))[1]);
  assert.ok(y('t-art') > y('t-val') && y('t-val') > y('t-name'), 'order: name, values, star label');
});
