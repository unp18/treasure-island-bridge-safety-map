import { validateGraph } from './validate.js';
import { buildAdjacency } from './adjacency.js';
import { compareIds } from './compare.js';

/**
 * Low-link analysis of an undirected graph, with a replay event log.
 *
 * Returns { ok: false, errors } for invalid input (and nothing else: no partial
 * analysis), otherwise { ok: true, ...results, events }.
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
 * Event schema and emission order are documented in docs/events.md.
 * The DFS is iterative (explicit stack) so each step can emit events in order.
 */
export function analyze(graph) {
  const errors = validateGraph(graph);
  if (errors.length > 0) return { ok: false, errors };

  const adjacency = buildAdjacency(graph);
  const ids = Object.keys(adjacency); // already ascending
  const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const edgeIdByPair = new Map(graph.edges.map((e) => [pairKey(e.from, e.to), e.id]));
  const edgeBetween = (a, b) => edgeIdByPair.get(pairKey(a, b));

  const discovery = {};
  const low = {};
  const parent = {};
  const treeChildren = Object.fromEntries(ids.map((id) => [id, []]));
  const discoveryOrder = [];
  const roots = [];
  const bridges = new Set();
  const articulation = new Set();
  const events = [];
  let clock = 0;

  const emit = (type, data) => events.push({ step: events.length, type, ...data });

  const discover = (id, parentId) => {
    discovery[id] = low[id] = clock++;
    parent[id] = parentId;
    discoveryOrder.push(id);
    emit('DISCOVER', { node: id, parent: parentId, discovery: discovery[id], low: low[id] });
  };

  for (const root of ids) {
    if (discovery[root] !== undefined) continue;
    const componentIndex = roots.length;
    roots.push(root);
    discover(root, null);
    const stack = [{ node: root, next: 0 }];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const u = frame.node;
      const neighbours = adjacency[u];

      if (frame.next < neighbours.length) {
        const v = neighbours[frame.next++];
        const edge = edgeBetween(u, v);
        if (discovery[v] === undefined) {
          // tree edge: descend
          emit('INSPECT_EDGE', { from: u, to: v, edge, kind: 'tree', lowBefore: low[u], lowAfter: low[u] });
          treeChildren[u].push(v);
          discover(v, u);
          stack.push({ node: v, next: 0 });
        } else if (v === parent[u]) {
          // the edge we arrived by; ignored
          emit('INSPECT_EDGE', { from: u, to: v, edge, kind: 'parent', lowBefore: low[u], lowAfter: low[u] });
        } else {
          // already-visited neighbour that is not the parent: back-connection
          const lowBefore = low[u];
          low[u] = Math.min(low[u], discovery[v]);
          emit('INSPECT_EDGE', {
            from: u, to: v, edge, kind: 'visited',
            neighbourDiscovery: discovery[v], lowBefore, lowAfter: low[u],
          });
        }
      } else {
        // u is finished
        stack.pop();
        emit('FINISH_NODE', { node: u, parent: parent[u], discovery: discovery[u], low: low[u] });

        if (stack.length > 0) {
          // return to the DFS parent p
          const p = stack[stack.length - 1].node;
          const edge = edgeBetween(p, u);
          const lowBefore = low[p];
          low[p] = Math.min(low[p], low[u]);
          emit('RETURN', { node: p, child: u, edge, childLow: low[u], lowBefore, lowAfter: low[p] });

          const isBridge = low[u] > discovery[p];
          if (isBridge) bridges.add(edge);
          emit('CLASSIFY_TREE_EDGE', {
            edge, parent: p, child: u, childLow: low[u], parentDiscovery: discovery[p], isBridge,
          });

          if (parent[p] !== null) {
            if (low[u] >= discovery[p] && !articulation.has(p)) {
              articulation.add(p);
              emit('ARTICULATION', {
                node: p, reason: 'NON_ROOT_CHILD_LOW', child: u, childLow: low[u], parentDiscovery: discovery[p],
              });
            }
          } else if (treeChildren[p].length === 2) {
            // root: children complete one at a time, so the 2nd return means >= 2 tree children
            articulation.add(p);
            emit('ARTICULATION', { node: p, reason: 'ROOT_TWO_CHILDREN', childCount: 2 });
          }
        } else {
          emit('FINISH_COMPONENT', { root, componentIndex });
        }
      }
    }
  }

  const nodes = Object.fromEntries(
    ids.map((id) => [id, { id, parent: parent[id], discovery: discovery[id], low: low[id] }]),
  );
  const bridgeList = [...bridges].sort(compareIds);
  const bridgeSet = new Set(bridgeList);
  const edgeList = graph.edges
    .map((e) => ({ id: e.id, from: e.from, to: e.to }))
    .sort((a, b) => compareIds(a.id, b.id));

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
    edges: edgeList,
    // In a simple graph every non-bridge edge lies on a cycle.
    edgesInCycles: edgeList.map((e) => e.id).filter((id) => !bridgeSet.has(id)),
    articulationPoints: [...articulation].sort(compareIds),
    events,
  };
}
