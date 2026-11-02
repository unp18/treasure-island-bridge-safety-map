// Small builders so tests read like the graph they describe.
// ids: array of node IDs. pairs: array of [from, to]; edge IDs are BR1, BR2, ...
export function makeGraph(ids, pairs = []) {
  return {
    nodes: ids.map((id, i) => ({ id, name: `Island ${id}`, x: (i * 7) % 101, y: (i * 11) % 101 })),
    edges: pairs.map(([from, to], i) => ({ id: `BR${i + 1}`, from, to })),
  };
}

// Deterministic seeded shuffle (mulberry32) so "shuffle" tests are repeatable.
export function seededShuffle(array, seed) {
  const a = [...array];
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
