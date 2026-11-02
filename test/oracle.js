// TEST-ONLY. Hand-derived expected values (see docs/oracle.md).
// Never import this from src/.
export const oracle = {
  adjacency: {
    A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B', 'D'], D: ['C', 'E', 'F'],
    E: ['D', 'F'], F: ['D', 'E', 'G'], G: ['F', 'H'], H: ['G'],
  },
  discoveryOrder: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  table: [
    { id: 'A', parent: null, discovery: 0, low: 0 },
    { id: 'B', parent: 'A', discovery: 1, low: 0 },
    { id: 'C', parent: 'B', discovery: 2, low: 0 },
    { id: 'D', parent: 'C', discovery: 3, low: 3 },
    { id: 'E', parent: 'D', discovery: 4, low: 3 },
    { id: 'F', parent: 'E', discovery: 5, low: 3 },
    { id: 'G', parent: 'F', discovery: 6, low: 6 },
    { id: 'H', parent: 'G', discovery: 7, low: 7 },
  ],
  componentCount: 1,
  bridges: ['BR4', 'BR8', 'BR9'],
  articulationPoints: ['C', 'D', 'F', 'G'],
};
