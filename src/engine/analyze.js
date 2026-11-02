import { validateGraph } from './validate.js';
import { buildAdjacency } from './adjacency.js';
import { compareIds } from './compare.js';

/**
 * Low-link analysis of an undirected graph.
 *
 * Returns { ok: false, errors } for invalid input (and nothing else: no partial
 * analysis), otherwise { ok: true, ...results }.
 *
 * Rules (from the problem statement):
 *  - one zero-based discovery clock across all components
 *  - roots chosen in ascending node-ID order; neighbours inspected ascending
 *  - tree child v of u:  low[u] = min(low[u], low[v]) after v completes
 *  - visited non-parent neighbour w of u:  low[u] = min(low[u], disc[w])
 *  - tree edge u->v is a bridge  iff  low[v] >  disc[u]
 *  - non-root u is an articulation point if some child has  low[v] >= disc[u]
 *  - root is an articulation point iff it has >= 2 DFS-tree children
 *
 * The DFS is iterative (explicit stack) so the same loop can emit replay events
 * in Step 3 without restructuring.
 */
export function analyze(graph) {
  const errors = validateGraph(graph);
  if (errors.length > 0) return { ok: false, errors };

  const adjacency = buildAdjacency(graph);
  const ids = Object.keys(adjacency); // already ascending
  const edgeIdByPair = new Map();
  for (const e of graph.edges) {
    edgeIdByPair.set(e.from < e.to ? `${e.from}|${e.to}` : `${e.to}|${e.from}`, e.id);
  }
  const edgeBetween = (a, b) => edgeIdByPair.get(a < b ? `${a}|${b}` : `${b}|${a}`);

  const discovery = {};
  const low = {};
  const parent = {};
  const treeChildren = Object.fromEntries(ids.map((id) => [id, []]));
  const discoveryOrder = [];
  const roots = [];
  const bridges = new Set();
  const articulation = new Set();
  let clock = 0;

  const discover = (id, parentId) => {
    discovery[id] = low[id] = clock++;
    parent[id] = parentId;
    discoveryOrder.push(id);
  };

  for (const root of ids) {
    if (discovery[root] !== undefined) continue;
    roots.push(root);
    discover(root, null);
    const stack = [{ node: root, next: 0 }];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const u = frame.node;
      const neighbours = adjacency[u];

      if (frame.next < neighbours.length) {
        const v = neighbours[frame.next++];
        if (discovery[v] === undefined) {
          // tree edge: descend
          treeChildren[u].push(v);
          discover(v, u);
          stack.push({ node: v, next: 0 });
        } else if (v !== parent[u]) {
          // already-visited neighbour that is not the parent: back-connection
          low[u] = Math.min(low[u], discovery[v]);
        }
        // v === parent[u]: the edge we arrived by; ignore
      } else {
        // u is finished: return to its parent (if any)
        stack.pop();
        if (stack.length > 0) {
          const p = stack[stack.length - 1].node;
          low[p] = Math.min(low[p], low[u]);
          if (low[u] > discovery[p]) bridges.add(edgeBetween(p, u));
          if (parent[p] !== null && low[u] >= discovery[p]) articulation.add(p);
        }
      }
    }
    if (treeChildren[root].length >= 2) articulation.add(root);
  }

  const nodes = Object.fromEntries(
    ids.map((id) => [id, { id, parent: parent[id], discovery: discovery[id], low: low[id] }]),
  );
  const bridgeList = [...bridges].sort(compareIds);
  const bridgeSet = new Set(bridgeList);

  return {
    ok: true,
    adjacency,
    roots,
    discoveryOrder,
    nodes,
    table: ids.map((id) => nodes[id]),
    treeChildren,
    componentCount: roots.length,
    bridges: bridgeList,
    // In a simple graph every non-bridge edge lies on a cycle.
    edgesInCycles: graph.edges.map((e) => e.id).filter((id) => !bridgeSet.has(id)).sort(compareIds),
    articulationPoints: [...articulation].sort(compareIds),
  };
}
