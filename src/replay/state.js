// Pure replay model: the visible state at step k is a fold of events 0..k.
// Nothing here touches the DOM; the UI only renders what stateAt returns.


/** Nodes/edges the event is "about", for highlighting on the map. */
export function highlightOf(event) {
  if (!event) return { nodes: [], edges: [] };
  switch (event.type) {
    case 'DISCOVER': return { nodes: [event.node], edges: [] };
    case 'INSPECT_EDGE': return { nodes: [event.from, event.to], edges: [event.edge] };
    case 'RETURN': return { nodes: [event.node, event.child], edges: [event.edge] };
    case 'CLASSIFY_TREE_EDGE': return { nodes: [event.parent, event.child], edges: [event.edge] };
    case 'ARTICULATION': return { nodes: [event.node], edges: [] };
    case 'FINISH_NODE': return { nodes: [event.node], edges: [] };
    case 'FINISH_COMPONENT': return { nodes: [event.root], edges: [] };
    default: return { nodes: [], edges: [] };
  }
}

/** The single "current" node for an event (null when none). */
export function currentNodeOf(event) {
  if (!event) return null;
  switch (event.type) {
    case 'DISCOVER': return event.node;
    case 'INSPECT_EDGE': return event.from;
    case 'RETURN': return event.node;
    case 'CLASSIFY_TREE_EDGE': return event.parent;
    case 'ARTICULATION': return event.node;
    case 'FINISH_NODE': return event.node;
    default: return null; // FINISH_COMPONENT
  }
}

const insertSorted = (list, value) => {
  if (!list.includes(value)) list.push(value);
  list.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
};

function initialState(analysis) {
  const nodes = {};
  for (const row of analysis.table) {
    nodes[row.id] = { id: row.id, status: 'unvisited', parent: null, discovery: null, low: null, articulation: false };
  }
  const edges = {};
  for (const e of analysis.edges) {
    edges[e.id] = { id: e.id, from: e.from, to: e.to, kind: 'untouched', isBridge: null };
  }
  return {
    index: -1, event: null, currentNode: null, highlight: { nodes: [], edges: [] },
    nodes, edges,
    bridges: [], articulationPoints: [],
    componentCount: 0, componentsFinished: 0, done: false,
  };
}

function apply(state, event) {
  switch (event.type) {
    case 'DISCOVER': {
      const n = state.nodes[event.node];
      Object.assign(n, { status: 'visited', parent: event.parent, discovery: event.discovery, low: event.low });
      if (event.parent === null) state.componentCount += 1;
      break;
    }
    case 'INSPECT_EDGE': {
      state.nodes[event.from].low = event.lowAfter;
      const edge = state.edges[event.edge];
      if (event.kind === 'tree') edge.kind = 'tree';
      else if (event.kind === 'visited') { edge.kind = 'nontree'; edge.isBridge = false; }
      break; // kind 'parent': the edge is already marked as tree
    }
    case 'RETURN':
      state.nodes[event.node].low = event.lowAfter;
      break;
    case 'CLASSIFY_TREE_EDGE':
      state.edges[event.edge].isBridge = event.isBridge;
      if (event.isBridge) insertSorted(state.bridges, event.edge);
      break;
    case 'ARTICULATION':
      state.nodes[event.node].articulation = true;
      insertSorted(state.articulationPoints, event.node);
      break;
    case 'FINISH_NODE':
      state.nodes[event.node].status = 'finished';
      break;
    case 'FINISH_COMPONENT':
      state.componentsFinished += 1;
      break;
    default:
      throw new Error(`Unknown event type: ${event.type}`);
  }
}

/**
 * State after applying events 0..k (k = -1 gives the pre-traversal state).
 * Always builds a fresh object, so callers may not corrupt later calls.
 */
export function stateAt(analysis, k) {
  const events = analysis.events;
  if (!Number.isInteger(k) || k < -1 || k >= events.length) {
    throw new RangeError(`Replay index ${k} is outside -1..${events.length - 1}`);
  }
  const state = initialState(analysis);
  for (let i = 0; i <= k; i++) apply(state, events[i]);
  const event = k >= 0 ? events[k] : null;
  state.index = k;
  state.event = event;
  state.done = events.length > 0 && k === events.length - 1;
  state.currentNode = state.done ? null : currentNodeOf(event);
  state.highlight = highlightOf(event);
  return state;
}

export const finalState = (analysis) => stateAt(analysis, analysis.events.length - 1);
