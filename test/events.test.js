import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/engine/analyze.js';
import { archipelago } from '../src/data/archipelago.js';
import { makeGraph, seededShuffle } from './helpers.js';
import { oracle } from './oracle.js';

// Compact one-line form of an event, used to compare against hand-derived traces.
export const brief = (e) => {
  switch (e.type) {
    case 'DISCOVER': return `DISCOVER ${e.node}`;
    case 'INSPECT_EDGE': return `INSPECT ${e.from}>${e.to} ${e.kind} ${e.lowBefore}>${e.lowAfter}`;
    case 'RETURN': return `RETURN ${e.child}>${e.node} ${e.lowBefore}>${e.lowAfter}`;
    case 'CLASSIFY_TREE_EDGE': return `CLASSIFY ${e.edge} ${e.isBridge ? 'bridge' : 'cycle'}`;
    case 'ARTICULATION': return `ARTICULATION ${e.node}`;
    case 'FINISH_NODE': return `FINISH ${e.node}`;
    case 'FINISH_COMPONENT': return `COMPONENT ${e.root}`;
    default: return `?? ${e.type}`;
  }
};

// Hand-derived from docs/oracle.md (the 21-step DFS trace), BEFORE the code emitted events.
const EXPECTED_MAIN_TRACE = [
  'DISCOVER A',
  'INSPECT A>B tree 0>0',
  'DISCOVER B',
  'INSPECT B>A parent 1>1',
  'INSPECT B>C tree 1>1',
  'DISCOVER C',
  'INSPECT C>A visited 2>0',
  'INSPECT C>B parent 0>0',
  'INSPECT C>D tree 0>0',
  'DISCOVER D',
  'INSPECT D>C parent 3>3',
  'INSPECT D>E tree 3>3',
  'DISCOVER E',
  'INSPECT E>D parent 4>4',
  'INSPECT E>F tree 4>4',
  'DISCOVER F',
  'INSPECT F>D visited 5>3',
  'INSPECT F>E parent 3>3',
  'INSPECT F>G tree 3>3',
  'DISCOVER G',
  'INSPECT G>F parent 6>6',
  'INSPECT G>H tree 6>6',
  'DISCOVER H',
  'INSPECT H>G parent 7>7',
  'FINISH H',
  'RETURN H>G 6>6',
  'CLASSIFY BR9 bridge',
  'ARTICULATION G',
  'FINISH G',
  'RETURN G>F 3>3',
  'CLASSIFY BR8 bridge',
  'ARTICULATION F',
  'FINISH F',
  'RETURN F>E 4>3',
  'CLASSIFY BR6 cycle',
  'FINISH E',
  'RETURN E>D 3>3',
  'CLASSIFY BR5 cycle',
  'ARTICULATION D',
  'INSPECT D>F visited 3>3',
  'FINISH D',
  'RETURN D>C 0>0',
  'CLASSIFY BR4 bridge',
  'ARTICULATION C',
  'FINISH C',
  'RETURN C>B 1>0',
  'CLASSIFY BR2 cycle',
  'FINISH B',
  'RETURN B>A 0>0',
  'CLASSIFY BR1 cycle',
  'INSPECT A>C visited 0>0',
  'FINISH A',
  'COMPONENT A',
];

const main = analyze(archipelago);

test('main archipelago event sequence equals the hand-derived trace exactly', () => {
  assert.deepEqual(main.events.map(brief), EXPECTED_MAIN_TRACE);
});

test('event steps are 0..n-1 in order', () => {
  main.events.forEach((e, i) => assert.equal(e.step, i));
});

test('event totals match hand-counted numbers (8 nodes, 9 edges, 7 tree edges, 4 articulation points)', () => {
  const count = (t) => main.events.filter((e) => e.type === t).length;
  assert.equal(count('DISCOVER'), 8);
  assert.equal(count('FINISH_NODE'), 8);
  assert.equal(count('FINISH_COMPONENT'), 1);
  assert.equal(count('INSPECT_EDGE'), 18); // each undirected edge from both adjacency entries
  assert.equal(count('RETURN'), 7);
  assert.equal(count('CLASSIFY_TREE_EDGE'), 7);
  assert.equal(count('ARTICULATION'), 4);
  assert.equal(main.events.length, 53);
});

test('each undirected edge is inspected exactly once from each endpoint', () => {
  for (const edge of archipelago.edges) {
    const seen = main.events.filter((e) => e.type === 'INSPECT_EDGE' && e.edge === edge.id);
    assert.equal(seen.length, 2, edge.id);
    assert.deepEqual(seen.map((e) => e.from).sort(), [edge.from, edge.to].sort());
  }
});

test('event order within a child return is RETURN, then CLASSIFY, then ARTICULATION (if any)', () => {
  const ev = main.events;
  ev.forEach((e, i) => {
    if (e.type === 'RETURN') {
      assert.equal(ev[i - 1].type, 'FINISH_NODE');
      assert.equal(ev[i - 1].node, e.child);
      assert.equal(ev[i + 1].type, 'CLASSIFY_TREE_EDGE');
      assert.equal(ev[i + 1].child, e.child);
    }
    if (e.type === 'ARTICULATION') assert.equal(ev[i - 1].type, 'CLASSIFY_TREE_EDGE');
  });
});

test('every classification and articulation event agrees with the final result', () => {
  const classified = main.events.filter((e) => e.type === 'CLASSIFY_TREE_EDGE');
  assert.deepEqual(classified.filter((e) => e.isBridge).map((e) => e.edge).sort(), main.bridges);
  for (const c of classified) {
    assert.equal(c.isBridge, c.childLow > c.parentDiscovery); // strict inequality, shown in the event
  }
  const arts = main.events.filter((e) => e.type === 'ARTICULATION').map((e) => e.node);
  assert.deepEqual([...arts].sort(), main.articulationPoints);
  assert.equal(new Set(arts).size, arts.length); // at most once per node
});

test('low values carried by events agree with the final table', () => {
  // The last low value announced for each node must equal its final low.
  const lastLow = {};
  for (const e of main.events) {
    if (e.type === 'DISCOVER') lastLow[e.node] = e.low;
    if (e.type === 'INSPECT_EDGE') lastLow[e.from] = e.lowAfter;
    if (e.type === 'RETURN') lastLow[e.node] = e.lowAfter;
  }
  for (const row of oracle.table) assert.equal(lastLow[row.id], row.low, row.id);
});

test('root with two children emits ARTICULATION once, right after the second child returns', () => {
  const r = analyze(makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['A', 'C'], ['A', 'D']]));
  const trace = r.events.map(brief);
  const arts = trace.filter((t) => t.startsWith('ARTICULATION'));
  assert.deepEqual(arts, ['ARTICULATION A']);
  const i = trace.indexOf('ARTICULATION A');
  assert.equal(trace[i - 1], 'CLASSIFY BR2 bridge'); // second child is C, via BR2
  assert.equal(r.events[i].reason, 'ROOT_TWO_CHILDREN');
});

test('component and isolated-node events: one clock, FINISH_COMPONENT per root', () => {
  const r = analyze(makeGraph(['A', 'B', 'Z'], [['A', 'B']]));
  assert.deepEqual(r.events.map(brief), [
    'DISCOVER A', 'INSPECT A>B tree 0>0', 'DISCOVER B', 'INSPECT B>A parent 1>1',
    'FINISH B', 'RETURN B>A 0>0', 'CLASSIFY BR1 bridge', 'FINISH A', 'COMPONENT A',
    'DISCOVER Z', 'FINISH Z', 'COMPONENT Z',
  ]);
  assert.equal(r.events[0].discovery, 0);
  assert.equal(r.events.find((e) => e.type === 'DISCOVER' && e.node === 'Z').discovery, 2);
  assert.deepEqual(r.events.filter((e) => e.type === 'FINISH_COMPONENT').map((e) => e.componentIndex), [0, 1]);
});

test('events are identical across repeated runs and across reversed/shuffled inputs', () => {
  assert.deepEqual(analyze(archipelago).events, main.events);
  const reversed = { nodes: [...archipelago.nodes].reverse(), edges: [...archipelago.edges].reverse() };
  assert.deepEqual(analyze(reversed).events, main.events);
  for (const seed of [3, 9, 27]) {
    const g = { nodes: seededShuffle(archipelago.nodes, seed), edges: seededShuffle(archipelago.edges, seed + 1) };
    assert.deepEqual(analyze(g).events, main.events);
  }
});

test('events are plain JSON-serialisable data', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(main.events)), main.events);
});

test('analysis result exposes the sorted edge list used by the replay model', () => {
  assert.deepEqual(main.edges.map((e) => e.id), archipelago.edges.map((e) => e.id));
});

test('a non-root articulation island with several qualifying children is announced once', () => {
  // A-B, B-C, B-D: B has two children (C, D), both with low >= disc[B]. Hand-derived trace.
  const r = analyze(makeGraph(['A', 'B', 'C', 'D'], [['A', 'B'], ['B', 'C'], ['B', 'D']]));
  assert.deepEqual(r.events.map(brief), [
    'DISCOVER A', 'INSPECT A>B tree 0>0',
    'DISCOVER B', 'INSPECT B>A parent 1>1', 'INSPECT B>C tree 1>1',
    'DISCOVER C', 'INSPECT C>B parent 2>2', 'FINISH C',
    'RETURN C>B 1>1', 'CLASSIFY BR2 bridge', 'ARTICULATION B',
    'INSPECT B>D tree 1>1',
    'DISCOVER D', 'INSPECT D>B parent 3>3', 'FINISH D',
    'RETURN D>B 1>1', 'CLASSIFY BR3 bridge', // second qualifying child: no repeat announcement
    'FINISH B', 'RETURN B>A 0>0', 'CLASSIFY BR1 bridge',
    'FINISH A', 'COMPONENT A',
  ]);
  assert.deepEqual(r.articulationPoints, ['B']);
});
