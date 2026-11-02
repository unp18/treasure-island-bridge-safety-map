import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/engine/analyze.js';
import { stateAt, finalState } from '../src/replay/state.js';
import { archipelago } from '../src/data/archipelago.js';
import { oracle } from './oracle.js';

const main = analyze(archipelago);
const deepFreeze = (o) => { Object.values(o).forEach((v) => typeof v === 'object' && v && deepFreeze(v)); return Object.freeze(o); };

test('initial state (index -1): everything unvisited, no results', () => {
  const s = stateAt(main, -1);
  assert.equal(s.index, -1);
  assert.equal(s.event, null);
  assert.equal(s.currentNode, null);
  assert.equal(s.done, false);
  for (const n of Object.values(s.nodes)) {
    assert.deepEqual([n.status, n.parent, n.discovery, n.low, n.articulation], ['unvisited', null, null, null, false]);
  }
  for (const e of Object.values(s.edges)) assert.deepEqual([e.kind, e.isBridge], ['untouched', null]);
  assert.deepEqual([s.bridges, s.articulationPoints, s.componentCount, s.componentsFinished], [[], [], 0, 0]);
});

test('mid-replay: back-connection lowers low and marks the edge as inspected non-tree (event 6)', () => {
  const s = stateAt(main, 6); // INSPECT C>A visited 2>0
  assert.equal(s.nodes.C.low, 0);
  assert.equal(s.nodes.C.discovery, 2);
  assert.equal(s.edges.BR3.kind, 'nontree');
  assert.equal(s.edges.BR3.isBridge, false);
  assert.equal(s.currentNode, 'C');
  assert.deepEqual(s.highlight.edges, ['BR3']);
  assert.ok(s.highlight.nodes.includes('C') && s.highlight.nodes.includes('A'));
  assert.equal(s.edges.BR1.kind, 'tree');
  assert.equal(s.edges.BR2.kind, 'tree');
  assert.equal(s.edges.BR4.kind, 'untouched');
});

test('bridges and articulation points are revealed only when their events happen', () => {
  assert.deepEqual(stateAt(main, 25).bridges, []);            // RETURN H>G: not classified yet
  assert.deepEqual(stateAt(main, 26).bridges, ['BR9']);       // CLASSIFY BR9
  assert.equal(stateAt(main, 26).edges.BR9.isBridge, true);
  assert.deepEqual(stateAt(main, 26).articulationPoints, []);
  assert.deepEqual(stateAt(main, 27).articulationPoints, ['G']);
  assert.equal(stateAt(main, 27).nodes.G.articulation, true);
  assert.equal(stateAt(main, 37).edges.BR5.isBridge, false);  // strict inequality case
  assert.deepEqual(stateAt(main, 37).articulationPoints, ['F', 'G']);
});

test('node status moves unvisited -> visited -> finished', () => {
  assert.equal(stateAt(main, 9).nodes.D.status, 'visited');
  assert.equal(stateAt(main, 9).nodes.E.status, 'unvisited');
  assert.equal(stateAt(main, 24).nodes.H.status, 'finished');
  assert.equal(stateAt(main, 24).nodes.G.status, 'visited');
});

test('final state equals the final analysis table, bridges, articulation points and component count', () => {
  const s = finalState(main);
  assert.equal(s.index, main.events.length - 1);
  assert.equal(s.done, true);
  assert.equal(s.currentNode, null);
  assert.deepEqual(Object.values(s.nodes).map(({ id, parent, discovery, low }) => ({ id, parent, discovery, low })), oracle.table);
  assert.deepEqual(s.bridges, oracle.bridges);
  assert.deepEqual(s.articulationPoints, oracle.articulationPoints);
  assert.equal(s.componentCount, oracle.componentCount);
  assert.equal(s.componentsFinished, oracle.componentCount);
  for (const n of Object.values(s.nodes)) assert.equal(n.status, 'finished');
  for (const e of Object.values(s.edges)) assert.equal(typeof e.isBridge, 'boolean'); // all classified
});

test('every visible low change agrees with the event that announced it', () => {
  for (let k = 0; k < main.events.length; k++) {
    const e = main.events[k];
    const before = stateAt(main, k - 1);
    const after = stateAt(main, k);
    if (e.type === 'INSPECT_EDGE') {
      assert.equal(before.nodes[e.from].low, e.lowBefore, `step ${k}`);
      assert.equal(after.nodes[e.from].low, e.lowAfter, `step ${k}`);
    }
    if (e.type === 'RETURN') {
      assert.equal(before.nodes[e.node].low, e.lowBefore, `step ${k}`);
      assert.equal(after.nodes[e.node].low, e.lowAfter, `step ${k}`);
    }
  }
});

test('stateAt is pure: same input gives equal output, input events are not modified', () => {
  const frozen = deepFreeze(analyze(archipelago));
  const a = stateAt(frozen, 30);
  const b = stateAt(frozen, 30);
  assert.deepEqual(a, b);
  assert.notEqual(a, b);
  a.nodes.A.low = 999; // mutating a returned state must not leak into later calls
  assert.equal(stateAt(frozen, 30).nodes.A.low, 0);
});

test('stateAt rejects out-of-range indexes', () => {
  assert.throws(() => stateAt(main, -2), RangeError);
  assert.throws(() => stateAt(main, main.events.length), RangeError);
  assert.throws(() => stateAt(main, 1.5), RangeError);
});
