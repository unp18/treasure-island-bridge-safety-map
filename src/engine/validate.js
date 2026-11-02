// Whole-graph validation. Runs BEFORE any traversal.
// Returns an array of error objects (empty array = valid). Every error names
// the relevant node, edge, or endpoint so the UI can point at it.

export const ID_PATTERN = /^[A-Z][A-Z0-9_-]{0,15}$/;
export const LIMITS = Object.freeze({
  minNodes: 1, maxNodes: 12,
  minEdges: 0, maxEdges: 20,
  coordMin: 0, coordMax: 100,
});

const isValidId = (id) => typeof id === 'string' && ID_PATTERN.test(id);
const isCoordinate = (v) =>
  typeof v === 'number' && Number.isFinite(v) && v >= LIMITS.coordMin && v <= LIMITS.coordMax;

export function validateGraph(graph) {
  const errors = [];
  const add = (code, message, extra = {}) => errors.push({ code, message, ...extra });

  if (graph === null || typeof graph !== 'object' || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    add('BAD_GRAPH', 'Graph must be an object with "nodes" and "edges" arrays.');
    return errors;
  }
  const { nodes, edges } = graph;

  if (nodes.length < LIMITS.minNodes || nodes.length > LIMITS.maxNodes) {
    add('NODE_COUNT', `Graph must have ${LIMITS.minNodes} to ${LIMITS.maxNodes} islands (found ${nodes.length}).`);
  }
  if (edges.length < LIMITS.minEdges || edges.length > LIMITS.maxEdges) {
    add('EDGE_COUNT', `Graph must have ${LIMITS.minEdges} to ${LIMITS.maxEdges} bridges (found ${edges.length}).`);
  }

  // ---- nodes ----
  const nodeIds = new Set();
  for (const node of nodes) {
    if (node === null || typeof node !== 'object') {
      add('BAD_NODE', 'Every island must be an object.');
      continue;
    }
    const { id } = node;
    const label = String(id);
    if (!isValidId(id)) {
      add('BAD_NODE_ID', `Island ID "${label}" must match [A-Z][A-Z0-9_-]{0,15}.`, { nodeId: label });
    } else if (nodeIds.has(id)) {
      add('DUPLICATE_NODE_ID', `Island ID "${id}" is used more than once.`, { nodeId: id });
    }
    if (typeof id === 'string') nodeIds.add(id);

    if (typeof node.name !== 'string' || node.name.trim() === '') {
      add('BAD_NODE_NAME', `Island "${label}" needs a non-empty display name.`, { nodeId: label });
    }
    for (const axis of ['x', 'y']) {
      if (!isCoordinate(node[axis])) {
        add('BAD_COORDINATE',
          `Island "${label}" has an invalid ${axis} coordinate (${String(node[axis])}); it must be a finite number from 0 to 100.`,
          { nodeId: label, field: axis });
      }
    }
  }

  // ---- edges ----
  const edgeIds = new Set();
  const pairToEdge = new Map();
  for (const edge of edges) {
    if (edge === null || typeof edge !== 'object') {
      add('BAD_EDGE', 'Every bridge must be an object.');
      continue;
    }
    const { id, from, to } = edge;
    const label = String(id);
    if (!isValidId(id)) {
      add('BAD_EDGE_ID', `Bridge ID "${label}" must match [A-Z][A-Z0-9_-]{0,15}.`, { edgeId: label });
    } else if (edgeIds.has(id)) {
      add('DUPLICATE_EDGE_ID', `Bridge ID "${id}" is used more than once.`, { edgeId: id });
    }
    if (typeof id === 'string') edgeIds.add(id);

    const fromKnown = typeof from === 'string' && nodeIds.has(from);
    const toKnown = typeof to === 'string' && nodeIds.has(to);
    if (!fromKnown) {
      add('UNKNOWN_ENDPOINT', `Bridge "${label}" refers to unknown island "${String(from)}".`, { edgeId: label, endpointId: String(from) });
    }
    if (!toKnown && !(from === to && !fromKnown)) {
      add('UNKNOWN_ENDPOINT', `Bridge "${label}" refers to unknown island "${String(to)}".`, { edgeId: label, endpointId: String(to) });
    }
    if (fromKnown && toKnown) {
      if (from === to) {
        add('SELF_LOOP', `Bridge "${label}" connects island "${from}" to itself.`, { edgeId: label, endpointId: from });
      } else {
        const key = from < to ? `${from}|${to}` : `${to}|${from}`;
        if (pairToEdge.has(key)) {
          add('DUPLICATE_CONNECTION',
            `Bridge "${label}" duplicates "${pairToEdge.get(key)}" between "${from}" and "${to}".`,
            { edgeId: label, duplicateOf: pairToEdge.get(key) });
        } else {
          pairToEdge.set(key, label);
        }
      }
    }
  }
  return errors;
}
