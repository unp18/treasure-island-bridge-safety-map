import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Replay } from '../src/replay/controller.js';
import { buildView } from '../src/ui/viewmodel.js';
import { archipelago } from '../src/data/archipelago.js';
import { oracle } from './oracle.js';
import { seededShuffle } from './helpers.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const make = (steps = 0, graph = archipelago) => {
  const r = new Replay();
  r.load(graph);
  for (let i = 0; i < steps; i++) r.step();
  return r;
};
const view = (r, g = archipelago) => buildView(r, g);
const edge = (v, id) => v.edges.find((e) => e.id === id);
const node = (v, id) => v.nodes.find((n) => n.id === id);

test('before loading: empty phase, only Load (and nothing else) is enabled', () => {
  const v = view(new Replay());
  assert.equal(v.phase, 'empty');
  assert.deepEqual(v.controls, { load: true, step: false, run: false, reset: false });
  assert.deepEqual([v.nodes, v.edges, v.table, v.history], [[], [], [], []]);
  assert.equal(v.summary, null);
});

test('after load: every island unvisited, every bridge untouched, all controls ready', () => {
  const v = view(make());
  assert.equal(v.phase, 'ready');
  assert.deepEqual(v.controls, { load: true, step: true, run: true, reset: true });
  assert.equal(v.progress, 'Ready: 0 of 53 events');
  assert.ok(v.nodes.every((n) => n.status === 'unvisited' && !n.current && n.discovery === null));
  assert.ok(v.edges.every((e) => e.style === 'untouched' && !e.highlighted));
  assert.deepEqual(v.table.map((r) => [r.parent, r.discovery, r.low]), Array(8).fill(['—', '—', '—']));
  assert.deepEqual(v.summary, { componentCount: 0, final: false, bridges: [], articulation: [] });
});

test('map layout stays inside the viewBox and ignores source order', () => {
  const v = view(make());
  for (const n of v.nodes) { assert.ok(n.x >= 0 && n.x <= 800 && n.y >= 0 && n.y <= 560, n.id); }
  const shuffled = { nodes: seededShuffle(archipelago.nodes, 5), edges: seededShuffle(archipelago.edges, 6) };
  assert.deepEqual(view(make(12, shuffled), shuffled), view(make(12)));
});

test('back-connection step: non-tree edge is dashed-style, endpoints highlighted, text states 2 → 0', () => {
  const v = view(make(7)); // events 0..6, last = INSPECT C>A visited
  assert.equal(edge(v, 'BR3').style, 'nontree');
  assert.equal(edge(v, 'BR3').highlighted, true);
  assert.equal(node(v, 'C').current, true);
  assert.equal(node(v, 'A').highlighted, true);
  assert.equal(node(v, 'C').low, 0);
  assert.equal(edge(v, 'BR1').style, 'tree');
  assert.match(v.eventText, /low\[C\] 2 → 0/);
  assert.equal(v.eventType, 'INSPECT_EDGE');
  assert.equal(v.progress, 'Step 7 of 53');
});

test('bridge classification: edge becomes a bridge and joins the summary with island names', () => {
  const before = view(make(26)); // after RETURN H>G
  assert.equal(edge(before, 'BR9').style, 'tree');
  assert.deepEqual(before.summary.bridges, []);
  const v = view(make(27)); // CLASSIFY BR9
  assert.equal(edge(v, 'BR9').style, 'bridge');
  assert.equal(edge(v, 'BR9').label, 'BR9 BRIDGE');
  assert.deepEqual(v.summary.bridges, [{ id: 'BR9', text: 'Gull Rock – Harbor Point' }]);
  assert.match(v.eventText, /low\[H\] = 7 > discovery\[G\] = 6/);
});

test('strict-inequality case is shown as NOT a bridge, while D is still flagged as an articulation island', () => {
  const v = view(make(39)); // through ARTICULATION D (event 38)
  assert.notEqual(edge(v, 'BR5').style, 'bridge');
  assert.match(v.history.find((h) => /BR5/.test(h.text) && /not a bridge/.test(h.text)).text, /= 3 > discovery\[D\] = 3/);
  assert.equal(node(v, 'D').articulation, true);
  assert.match(v.table.find((r) => r.id === 'D').status, /★/);
});

test('final view: table, components, bridges and articulation islands equal the oracle', () => {
  const r = make(); r.runToEnd();
  const v = view(r);
  assert.deepEqual(v.controls, { load: true, step: false, run: false, reset: true });
  assert.equal(v.summary.final, true);
  assert.equal(v.summary.componentCount, oracle.componentCount);
  assert.deepEqual(v.summary.bridges.map((b) => b.id), oracle.bridges);
  assert.deepEqual(v.summary.articulation.map((a) => a.id), oracle.articulationPoints);
  assert.deepEqual(
    v.table.map((t) => [t.id, t.parent === 'root' ? null : t.parent, t.discovery, t.low]),
    oracle.table.map((t) => [t.id, t.parent, t.discovery, t.low]),
  );
  assert.deepEqual(v.edges.filter((e) => e.style === 'bridge').map((e) => e.id), oracle.bridges);
  assert.deepEqual(v.nodes.filter((n) => n.articulation).map((n) => n.id), oracle.articulationPoints);
  assert.ok(v.nodes.every((n) => n.status === 'finished' && !n.current));
});

test('map, table, summary and history stay in sync at every step', () => {
  const r = make();
  for (let k = 0; k < 53; k++) {
    r.step();
    const v = view(r);
    const st = r.state;
    assert.deepEqual(v.nodes.map((n) => [n.id, n.discovery, n.low]), Object.values(st.nodes).map((n) => [n.id, n.discovery, n.low]));
    assert.deepEqual(v.table.map((t) => [t.discovery, t.low]), v.nodes.map((n) => [n.discovery ?? '—', n.low ?? '—']));
    assert.deepEqual(v.summary.bridges.map((b) => b.id), v.edges.filter((e) => e.style === 'bridge').map((e) => e.id));
    assert.deepEqual(v.summary.articulation.map((a) => a.id), v.nodes.filter((n) => n.articulation).map((n) => n.id));
    assert.equal(v.history.length, k + 1);
    assert.equal(v.history.filter((h) => h.current).length, 1);
    assert.equal(v.history.at(-1).text, v.eventText);
  }
});

test('stepping and Run to End give identical views; Reset gives the post-load view', () => {
  const stepped = make(); while (stepped.step()) { /* advance */ }
  const ran = make(); ran.runToEnd();
  assert.deepEqual(view(stepped), view(ran));
  const fresh = view(make());
  ran.reset();
  assert.deepEqual(view(ran), fresh);
});

test('rejected graph: error phase lists the problem, clears the map, table and summary', () => {
  const r = make(); r.runToEnd();
  const bad = clone(archipelago); bad.nodes[3].x = 250;
  r.load(bad);
  const v = view(r, bad);
  assert.equal(v.phase, 'error');
  assert.equal(v.errors[0].nodeId, 'D');
  assert.deepEqual([v.nodes, v.edges, v.table, v.history], [[], [], [], []]);
  assert.equal(v.summary, null);
  assert.deepEqual(v.controls, { load: true, step: false, run: false, reset: true });
});
