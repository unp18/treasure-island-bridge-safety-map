import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { archipelago } from '../src/data/archipelago.js';

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

test('the application never reads the documented oracle or expected values', () => {
  const files = [...walk('src'), 'index.html'];
  assert.ok(files.length >= 10);
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    assert.ok(!/oracle/i.test(text), `${f} mentions the oracle`);
    assert.ok(!/from ['"][^'"]*test\//.test(text), `${f} imports from test/`);
  }
});

test('the main graph file contains only nodes and edges, with no expected results', () => {
  assert.deepEqual(Object.keys(archipelago).sort(), ['edges', 'nodes']);
  for (const n of archipelago.nodes) assert.deepEqual(Object.keys(n).sort(), ['id', 'name', 'x', 'y']);
  for (const e of archipelago.edges) assert.deepEqual(Object.keys(e).sort(), ['from', 'id', 'to']);
});

test('the engine and replay layers have no DOM or browser dependency', () => {
  for (const f of [...walk('src/engine'), ...walk('src/replay'), ...walk('src/data')]) {
    assert.ok(!/\b(document|window|localStorage|fetch)\b/.test(readFileSync(f, 'utf8')), f);
  }
});
