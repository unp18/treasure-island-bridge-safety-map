import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze } from '../src/engine/analyze.js';
import { describeEvent, nameMap } from '../src/replay/describe.js';
import { archipelago } from '../src/data/archipelago.js';

const main = analyze(archipelago);
const names = nameMap(archipelago);
const text = (k) => describeEvent(main.events[k], names);

test('every event has a readable description with no placeholders', () => {
  for (const e of main.events) {
    const t = describeEvent(e, names);
    assert.ok(t.length > 10, `step ${e.step}`);
    assert.ok(!/undefined|NaN|\[object/.test(t), `step ${e.step}: ${t}`);
  }
});

test('root discovery states discovery = low = clock', () => {
  assert.match(text(0), /Anchor Cove \(A\)/);
  assert.match(text(0), /discovery = low = 0/);
});

test('back-connection text states the low change with both numbers', () => {
  const t = text(6);
  assert.match(t, /Coral Key \(C\)/);
  assert.match(t, /Anchor Cove \(A\)/);
  assert.match(t, /low\[C\] 2 → 0/);
});

test('bridge verdict text shows the strict inequality numbers', () => {
  assert.match(text(26), /BR9/);
  assert.match(text(26), /BRIDGE/);
  assert.match(text(26), /low\[H\] = 7 > discovery\[G\] = 6/);
  assert.match(text(37), /not a bridge/);
  assert.match(text(37), /low\[E\] = 3 > discovery\[D\] = 3/);
});

test('articulation text names the rule that fired', () => {
  assert.match(text(38), />= discovery\[D\] = 3/);
  const root = analyze({ nodes: [
    { id: 'A', name: 'Alpha', x: 1, y: 1 }, { id: 'B', name: 'Beta', x: 2, y: 2 }, { id: 'C', name: 'Gamma', x: 3, y: 3 }],
    edges: [{ id: 'BR1', from: 'A', to: 'B' }, { id: 'BR2', from: 'A', to: 'C' }] });
  const ev = root.events.find((e) => e.type === 'ARTICULATION');
  assert.match(describeEvent(ev, { A: 'Alpha', B: 'Beta', C: 'Gamma' }), /root.*2 DFS-tree children/i);
});
