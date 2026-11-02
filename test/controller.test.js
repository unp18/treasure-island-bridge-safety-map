import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Replay } from '../src/replay/controller.js';
import { archipelago } from '../src/data/archipelago.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const loaded = () => { const r = new Replay(); assert.equal(r.load(archipelago).ok, true); return r; };

test('before any load there is nothing to step', () => {
  const r = new Replay();
  assert.equal(r.step(), false);
  assert.equal(r.runToEnd(), false);
  assert.equal(r.state, null);
  assert.deepEqual(r.history, []);
});

test('load puts the replay at the pre-traversal state', () => {
  const r = loaded();
  assert.equal(r.index, -1);
  assert.equal(r.state.index, -1);
  assert.equal(r.total, 53);
  assert.deepEqual(r.history, []);
  assert.equal(r.atEnd, false);
});

test('Step advances exactly one recorded event', () => {
  const r = loaded();
  for (let i = 0; i < 5; i++) {
    assert.equal(r.step(), true);
    assert.equal(r.index, i);
    assert.equal(r.history.length, i + 1);
    assert.equal(r.state.event, r.history[i]);
  }
});

test('stepping one-by-one and Run to End give identical history and final state', () => {
  const stepped = loaded();
  while (stepped.step()) { /* advance */ }
  const ran = loaded();
  assert.equal(ran.runToEnd(), true);
  assert.deepEqual(stepped.history, ran.history);
  assert.deepEqual(stepped.state, ran.state);
  assert.equal(ran.history.length, ran.total);
  assert.equal(ran.atEnd, true);
  assert.equal(ran.step(), false); // already at end: no change
  assert.equal(ran.history.length, ran.total);
});

test('Run to End from mid-replay continues the same sequence', () => {
  const r = loaded();
  r.step(); r.step(); r.step();
  r.runToEnd();
  const full = loaded(); full.runToEnd();
  assert.deepEqual(r.history, full.history);
});

test('Reset returns to exactly the post-load state, and re-running reproduces identical results', () => {
  const r = loaded();
  const fresh = loaded().snapshot();
  r.runToEnd();
  const firstRun = r.snapshot();
  r.reset();
  assert.deepEqual(r.snapshot(), fresh);
  r.runToEnd();
  assert.deepEqual(r.snapshot(), firstRun);
  r.reset();
  for (let i = 0; i < 10; i++) r.step();
  r.reset();
  assert.deepEqual(r.snapshot(), fresh);
});

test('Reset uses the original graph even if the caller mutates their object afterwards', () => {
  const g = clone(archipelago);
  const r = new Replay();
  r.load(g);
  const before = r.snapshot();
  g.nodes[0].x = 9999; g.edges.pop();
  r.runToEnd();
  r.reset();
  assert.deepEqual(r.snapshot(), before);
});

test('two independent runs of the same graph produce identical histories', () => {
  const a = loaded(); a.runToEnd();
  const b = loaded(); b.runToEnd();
  assert.deepEqual(a.history, b.history);
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test('invalid load (out-of-range coordinate) clears stale replay and results', () => {
  const r = loaded();
  r.runToEnd();
  const bad = clone(archipelago);
  bad.nodes[2].y = -5; // C
  const res = r.load(bad);
  assert.equal(res.ok, false);
  assert.equal(res.errors[0].code, 'BAD_COORDINATE');
  assert.equal(res.errors[0].nodeId, 'C');
  assert.equal(r.state, null);
  assert.equal(r.analysis, null);
  assert.deepEqual(r.history, []);
  assert.equal(r.index, -1);
  assert.equal(r.total, 0);
  assert.equal(r.step(), false);
  assert.equal(r.errors.length, 1);
});

test('invalid load (unknown endpoint, duplicate node ID) also clears everything', () => {
  for (const mutate of [
    (g) => { g.edges[0].to = 'NOPE'; },
    (g) => { g.nodes[1].id = 'A'; },
  ]) {
    const r = loaded();
    r.step(); r.step();
    const bad = clone(archipelago);
    mutate(bad);
    assert.equal(r.load(bad).ok, false);
    assert.equal(r.state, null);
    assert.deepEqual(r.history, []);
  }
});

test('a later valid load clears earlier errors and starts clean', () => {
  const r = new Replay();
  const bad = clone(archipelago); bad.edges[0].from = 'A'; bad.edges[0].to = 'A';
  assert.equal(r.load(bad).ok, false);
  assert.equal(r.load(archipelago).ok, true);
  assert.deepEqual(r.errors, []);
  assert.equal(r.index, -1);
  assert.equal(r.total, 53);
});

test('Reset after an invalid load stays cleared (it re-validates the same source)', () => {
  const r = new Replay();
  const bad = clone(archipelago); bad.nodes[0].x = 101;
  r.load(bad);
  r.reset();
  assert.equal(r.state, null);
  assert.equal(r.errors.length, 1);
});
