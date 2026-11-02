import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGraph } from '../src/engine/validate.js';
import { analyze } from '../src/engine/analyze.js';
import { archipelago } from '../src/data/archipelago.js';
import { makeGraph } from './helpers.js';

const codes = (graph) => validateGraph(graph).map((e) => e.code);
const clone = (g) => JSON.parse(JSON.stringify(g));

test('main archipelago and minimal graphs are valid', () => {
  assert.deepEqual(validateGraph(archipelago), []);
  assert.deepEqual(validateGraph(makeGraph(['A'])), []); // 1 node, 0 edges
});

test('rejects non-graph input', () => {
  assert.deepEqual(codes(null), ['BAD_GRAPH']);
  assert.deepEqual(codes({ nodes: [] }), ['BAD_GRAPH']);
});

test('node count must be 1..12 and edge count 0..20', () => {
  assert.deepEqual(codes({ nodes: [], edges: [] }), ['NODE_COUNT']);
  const ids = 'ABCDEFGHIJKLM'.split(''); // 13 nodes
  assert.ok(codes(makeGraph(ids)).includes('NODE_COUNT'));
  assert.deepEqual(codes(makeGraph('ABCDEFGHIJKL'.split(''))), []); // 12 is fine
  const twelve = 'ABCDEFGHIJKL'.split('');
  const pairs = [];
  for (let i = 0; i < twelve.length && pairs.length < 21; i++)
    for (let j = i + 1; j < twelve.length && pairs.length < 21; j++) pairs.push([twelve[i], twelve[j]]);
  assert.ok(codes(makeGraph(twelve, pairs)).includes('EDGE_COUNT')); // 21 edges
  assert.deepEqual(codes(makeGraph(twelve, pairs.slice(0, 20))), []); // 20 is fine
});

test('rejects bad node ID format', () => {
  for (const bad of ['a', '1A', 'A B', '', 'ABCDEFGHIJKLMNOPQ' /* 17 chars */]) {
    const g = makeGraph(['A']);
    g.nodes[0].id = bad;
    const errs = validateGraph(g);
    assert.ok(errs.some((e) => e.code === 'BAD_NODE_ID'), `id ${JSON.stringify(bad)}`);
  }
  const ok = makeGraph(['A']);
  ok.nodes[0].id = 'A234567890123456'; // exactly 16 chars
  assert.deepEqual(validateGraph(ok), []);
});

test('rejects empty display name', () => {
  const g = makeGraph(['A']);
  g.nodes[0].name = '   ';
  const errs = validateGraph(g);
  assert.equal(errs[0].code, 'BAD_NODE_NAME');
  assert.equal(errs[0].nodeId, 'A');
});

test('rejects out-of-range, non-finite and non-numeric coordinates, naming the node', () => {
  for (const [field, value] of [['x', 100.5], ['x', -1], ['y', 101], ['y', NaN], ['x', Infinity], ['y', '50']]) {
    const g = makeGraph(['A', 'B'], [['A', 'B']]);
    g.nodes[1][field] = value;
    const errs = validateGraph(g);
    assert.equal(errs.length, 1, `${field}=${value}`);
    assert.equal(errs[0].code, 'BAD_COORDINATE');
    assert.equal(errs[0].nodeId, 'B');
  }
  const edge = makeGraph(['A', 'B'], [['A', 'B']]);
  edge.nodes[0].x = 0;
  edge.nodes[0].y = 100;
  assert.deepEqual(validateGraph(edge), []); // boundaries are inclusive
});

test('rejects duplicate node ID', () => {
  const g = makeGraph(['A', 'B']);
  g.nodes[1].id = 'A';
  const errs = validateGraph(g);
  assert.ok(errs.some((e) => e.code === 'DUPLICATE_NODE_ID' && e.nodeId === 'A'));
});

test('rejects bad and duplicate edge IDs', () => {
  const g = makeGraph(['A', 'B', 'C'], [['A', 'B'], ['B', 'C']]);
  g.edges[1].id = 'BR1';
  assert.ok(validateGraph(g).some((e) => e.code === 'DUPLICATE_EDGE_ID' && e.edgeId === 'BR1'));
  const h = makeGraph(['A', 'B'], [['A', 'B']]);
  h.edges[0].id = 'bridge-1';
  assert.ok(validateGraph(h).some((e) => e.code === 'BAD_EDGE_ID'));
});

test('rejects unknown endpoint, naming edge and endpoint', () => {
  const g = makeGraph(['A', 'B'], [['A', 'Z']]);
  const errs = validateGraph(g);
  assert.equal(errs.length, 1);
  assert.equal(errs[0].code, 'UNKNOWN_ENDPOINT');
  assert.equal(errs[0].edgeId, 'BR1');
  assert.equal(errs[0].endpointId, 'Z');
});

test('rejects self-loop', () => {
  const errs = validateGraph(makeGraph(['A', 'B'], [['A', 'A']]));
  assert.equal(errs.length, 1);
  assert.equal(errs[0].code, 'SELF_LOOP');
  assert.equal(errs[0].edgeId, 'BR1');
});

test('rejects duplicate connection regardless of direction', () => {
  const errs = validateGraph(makeGraph(['A', 'B'], [['A', 'B'], ['B', 'A']]));
  assert.equal(errs.length, 1);
  assert.equal(errs[0].code, 'DUPLICATE_CONNECTION');
  assert.equal(errs[0].edgeId, 'BR2');
  assert.equal(errs[0].duplicateOf, 'BR1');
});

test('reports every problem, not just the first', () => {
  const g = makeGraph(['A', 'B'], [['A', 'A'], ['A', 'Q']]);
  g.nodes[0].x = 500;
  const found = codes(g);
  assert.deepEqual(found.sort(), ['BAD_COORDINATE', 'SELF_LOOP', 'UNKNOWN_ENDPOINT']);
});

test('analyze on invalid input returns errors only: no partial or stale analysis', () => {
  const good = analyze(archipelago);
  assert.equal(good.ok, true);

  const bad = clone(archipelago);
  bad.nodes[3].x = 250; // out-of-range coordinate on D
  const result = analyze(bad);
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result).sort(), ['errors', 'ok']);
  assert.equal(result.errors[0].nodeId, 'D');

  const dup = clone(archipelago);
  dup.nodes[1].id = 'A'; // duplicate node ID
  const result2 = analyze(dup);
  assert.deepEqual(Object.keys(result2).sort(), ['errors', 'ok']);
  assert.ok(result2.errors.some((e) => e.code === 'DUPLICATE_NODE_ID'));
});

test('validation does not mutate its input', () => {
  const g = clone(archipelago);
  const before = JSON.stringify(g);
  validateGraph(g);
  analyze(g);
  assert.equal(JSON.stringify(g), before);
});
