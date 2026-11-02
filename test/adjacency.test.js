import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdjacency } from '../src/engine/adjacency.js';
import { archipelago } from '../src/data/archipelago.js';
import { oracle } from './oracle.js';
import { makeGraph, seededShuffle } from './helpers.js';

test('adjacency lists match the hand-derived oracle', () => {
  assert.deepEqual(buildAdjacency(archipelago), oracle.adjacency);
});

test('adjacency is sorted by node ID, not by source order', () => {
  const g = makeGraph(['Z', 'M', 'A', 'C'], [['Z', 'M'], ['Z', 'A'], ['Z', 'C']]);
  assert.deepEqual(buildAdjacency(g).Z, ['A', 'C', 'M']);
});

test('adjacency is identical for reversed and shuffled sources', () => {
  const expected = buildAdjacency(archipelago);
  const reversed = { nodes: [...archipelago.nodes].reverse(), edges: [...archipelago.edges].reverse() };
  assert.deepEqual(buildAdjacency(reversed), expected);
  for (const seed of [1, 2, 3]) {
    const shuffled = {
      nodes: seededShuffle(archipelago.nodes, seed),
      edges: seededShuffle(archipelago.edges, seed + 100),
    };
    assert.deepEqual(buildAdjacency(shuffled), expected);
  }
});

test('edge endpoint direction does not matter and isolated nodes get empty lists', () => {
  const g = makeGraph(['A', 'B', 'Z'], [['B', 'A']]);
  assert.deepEqual(buildAdjacency(g), { A: ['B'], B: ['A'], Z: [] });
});
