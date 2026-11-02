import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/engine/analyze.js';
import { archipelago } from '../src/data/archipelago.js';
import { oracle } from './oracle.js';
import { makeGraph, seededShuffle } from './helpers.js';

const run = (ids, pairs) => {
  const r = analyze(makeGraph(ids, pairs));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  return r;
};

// ---- main archipelago vs. independently documented oracle -------------------

test('main archipelago reproduces the documented oracle', () => {
  const r = analyze(archipelago);
  assert.equal(r.ok, true);
  assert.deepEqual(r.adjacency, oracle.adjacency);
  assert.deepEqual(r.discoveryOrder, oracle.discoveryOrder);
  assert.deepEqual(r.table, oracle.table);
  assert.equal(r.componentCount, oracle.componentCount);
  assert.deepEqual(r.bridges, oracle.bridges);
  assert.deepEqual(r.articulationPoints, oracle.articulationPoints);
});

test('main archipelago satisfies the problem-statement structure requirements', () => {
  assert.ok(archipelago.nodes.length >= 6 && archipelago.nodes.length <= 9);
  assert.ok(archipelago.edges.length >= 6 && archipelago.edges.length <= 13);
  const r = analyze(archipelago);
  assert.equal(r.componentCount, 1); // connected
  assert.ok(r.bridges.length >= 1);
  assert.ok(r.edgesInCycles.length >= 1); // a non-bridge edge inside a cycle
  assert.ok(r.articulationPoints.some((id) => r.nodes[id].parent !== null)); // non-root articulation
  assert.ok(archipelago.edges.length >= archipelago.nodes.length); // at least one cycle
});

test('same result for reversed and shuffled node/edge source arrays', () => {
  const expected = analyze(archipelago);
  const variants = [{ nodes: [...archipelago.nodes].reverse(), edges: [...archipelago.edges].reverse() }];
  for (const seed of [1, 7, 42, 2026]) {
    variants.push({
      nodes: seededShuffle(archipelago.nodes, seed),
      edges: seededShuffle(archipelago.edges, seed * 3),
    });
  }
  for (const v of variants) assert.deepEqual(analyze(v), expected);
});

test('analyze is repeatable: identical results across runs', () => {
  assert.deepEqual(analyze(archipelago), analyze(archipelago));
});

// ---- focused rule tests -----------------------------------------------------

test('back-connection low propagation: a non-parent visited neighbour lowers low', () => {
  // Triangle A-B-C. C sees A (visited, not its parent B): low[C]=0, then low[B]=0.
  const r = run(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['A', 'C']]);
  assert.equal(r.nodes.C.low, 0);
  assert.equal(r.nodes.B.low, 0);
  assert.equal(r.nodes.C.discovery, 2);
});

test('the parent edge does not count as a back-connection', () => {
  // Path A-B: B's only neighbour is its parent, so low[B] stays 1.
  const r = run(['A', 'B'], [['A', 'B']]);
  assert.equal(r.nodes.B.low, 1);
  assert.deepEqual(r.bridges, ['BR1']);
});

test('strict bridge inequality: low[child] == disc[parent] is NOT a bridge', () => {
  // Triangle: low[B]=0 == disc[A]=0, so A-B is a cycle edge, not a bridge.
  const tri = run(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['A', 'C']]);
  assert.deepEqual(tri.bridges, []);
  // 4-cycle: same idea with a longer loop.
  const sq = run(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'D']]);
  assert.deepEqual(sq.bridges, []);
  // Main graph: BR5 (D-E) has low[E]=3 == disc[D]=3, so not a bridge.
  const main = analyze(archipelago);
  assert.equal(main.nodes.E.low, main.nodes.D.discovery);
  assert.ok(!main.bridges.includes('BR5'));
});

test('bridge when low[child] > disc[parent]', () => {
  // Triangle A-B-C with pendant D hanging off C: C-D is a bridge.
  const r = run(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['A', 'C'], ['C', 'D']]);
  assert.deepEqual(r.bridges, ['BR4']);
});

test('non-root articulation uses >= (equality counts, even though the edge is not a bridge)', () => {
  // A-B bridge; triangle B-C-D. At B: low[C]=1 == disc[B]=1 -> B is an articulation point.
  const r = run(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['B', 'D']]);
  assert.equal(r.nodes.C.low, r.nodes.B.discovery);
  assert.deepEqual(r.articulationPoints, ['B']);
  assert.deepEqual(r.bridges, ['BR1']);
});

test('non-root node on a path is an articulation point; path ends are not', () => {
  const r = run(['A', 'B', 'C'], [['A', 'B'], ['B', 'C']]);
  assert.deepEqual(r.articulationPoints, ['B']);
  assert.deepEqual(r.bridges, ['BR1', 'BR2']);
});

test('root is an articulation point only with two or more DFS children', () => {
  const two = run(['A', 'B', 'C'], [['A', 'B'], ['A', 'C']]);
  assert.deepEqual(two.articulationPoints, ['A']);
  assert.deepEqual(two.treeChildren.A, ['B', 'C']);

  const one = run(['A', 'B'], [['A', 'B']]);
  assert.deepEqual(one.articulationPoints, []);

  // Root inside a cycle reaches its other neighbour through the first child: 1 tree child.
  const cycle = run(['A', 'B', 'C'], [['A', 'B'], ['B', 'C'], ['A', 'C']]);
  assert.deepEqual(cycle.treeChildren.A, ['B']);
  assert.deepEqual(cycle.articulationPoints, []);
});

test('cycle-only graph has no bridge and no articulation point', () => {
  const r = run(['A', 'B', 'C', 'D', 'E'], [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['A', 'E']]);
  assert.deepEqual(r.bridges, []);
  assert.deepEqual(r.articulationPoints, []);
  assert.equal(r.componentCount, 1);
  assert.equal(r.edgesInCycles.length, 5);
});

test('root with two children + disconnected component + isolated node', () => {
  const r = run(['A', 'B', 'C', 'D', 'E', 'Z'], [['A', 'B'], ['A', 'C'], ['D', 'E']]);
  assert.equal(r.componentCount, 3);
  assert.deepEqual(r.roots, ['A', 'D', 'Z']);
  assert.deepEqual(r.articulationPoints, ['A']);
  assert.deepEqual(r.bridges, ['BR1', 'BR2', 'BR3']);
  assert.deepEqual(r.nodes.Z, { id: 'Z', parent: null, discovery: 5, low: 5 });
});

test('one clock spans all components; roots are chosen in ascending ID order', () => {
  // Source lists Z first, but the first root must be the smallest ID.
  const r = run(['Z', 'D', 'E', 'A', 'B', 'C'], [['D', 'E'], ['A', 'B']]);
  assert.deepEqual(r.roots, ['A', 'C', 'D', 'Z']);
  assert.deepEqual(r.discoveryOrder, ['A', 'B', 'C', 'D', 'E', 'Z']);
  assert.deepEqual(r.table.map((t) => t.discovery), [0, 1, 2, 3, 4, 5]); // table is sorted by ID
  assert.equal(r.nodes.D.parent, null);
  assert.equal(r.componentCount, 4);
});

test('neighbours are inspected in ascending ID order (tree shape follows it)', () => {
  // A connects to C, B, D listed out of order; the DFS must visit B first.
  const r = run(['A', 'B', 'C', 'D'], [['A', 'D'], ['A', 'C'], ['A', 'B']]);
  assert.deepEqual(r.discoveryOrder, ['A', 'B', 'C', 'D']);
  assert.deepEqual(r.treeChildren.A, ['B', 'C', 'D']);
});

test('single node: root, not an articulation point, no bridges', () => {
  const r = run(['A'], []);
  assert.equal(r.componentCount, 1);
  assert.deepEqual(r.bridges, []);
  assert.deepEqual(r.articulationPoints, []);
});

test('results are sorted ascending by ASCII, not by insertion or numerically', () => {
  // Edge IDs BR10 < BR2 in ASCII order. Build a path with 11 edges.
  const ids = 'ABCDEFGHIJKL'.split('');
  const pairs = ids.slice(0, -1).map((id, i) => [id, ids[i + 1]]);
  const r = run(ids, pairs);
  assert.deepEqual(r.bridges, [...r.bridges].sort());
  assert.equal(r.bridges[1], 'BR10'); // BR1, BR10, BR11, BR2, ...
});

test('longest allowed path (12 nodes) is fully analysed by the iterative DFS', () => {
  const ids = 'ABCDEFGHIJKL'.split('');
  const r = run(ids, ids.slice(0, -1).map((id, i) => [id, ids[i + 1]]));
  assert.equal(r.discoveryOrder.length, 12);
});

test('back-connection uses the neighbour\'s DISCOVERY value, not its low value', () => {
  // Chain A-B-C-D-E with extra links A-C and C-E.
  // C already has low[C]=0 (via A) when E inspects C, but disc[C]=2.
  // Correct rule: low[E] = min(4, disc[C]=2) = 2.  Using low[C] would wrongly give 0.
  const r = run(['A', 'B', 'C', 'D', 'E'],
    [['A', 'B'], ['B', 'C'], ['A', 'C'], ['C', 'D'], ['D', 'E'], ['C', 'E']]);
  assert.equal(r.nodes.C.low, 0);
  assert.equal(r.nodes.E.low, 2);
  assert.equal(r.nodes.D.low, 2);
  assert.deepEqual(r.articulationPoints, ['C']);
  assert.deepEqual(r.bridges, []);
});
