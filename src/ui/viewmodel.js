// Pure: turns the Replay (+ the graph, for names and layout) into plain display data.
// No DOM, no HTML. Everything the screen shows is derived here, so it is unit-tested.
import { describeEvent, nameMap } from '../replay/describe.js';

export const VIEWBOX = '0 0 800 560';
// Layout coordinates 0-100 -> SVG units. Presentation only.
const px = (x) => 50 + x * 7;
const py = (y) => 40 + y * 4.6;

const STATUS_TEXT = { unvisited: 'unvisited', visited: 'searching', finished: 'done' };
const dash = (v) => (v === null ? '—' : v);

export function buildView(replay, graph) {
  const analysis = replay.analysis;
  if (!analysis) {
    const hasErrors = replay.errors.length > 0;
    return {
      phase: hasErrors ? 'error' : 'empty',
      errors: replay.errors,
      controls: { load: true, step: false, run: false, reset: hasErrors },
      progress: hasErrors ? 'Graph rejected: no analysis was run' : 'No archipelago loaded',
      eventType: null,
      eventText: hasErrors ? 'Fix the problems listed and load again.' : 'Press “Load My Archipelago” to begin.',
      nodes: [], edges: [], table: [], history: [],
      summary: null,
    };
  }

  const state = replay.state;
  const names = nameMap(graph);
  const pos = Object.fromEntries(graph.nodes.map((n) => [n.id, { x: px(n.x), y: py(n.y) }]));
  const hlNodes = new Set(state.highlight.nodes);
  const hlEdges = new Set(state.highlight.edges);

  const nodes = Object.values(state.nodes).map((n) => ({
    id: n.id, name: names[n.id], ...pos[n.id],
    status: n.status, discovery: n.discovery, low: n.low,
    current: state.currentNode === n.id,
    highlighted: hlNodes.has(n.id),
    articulation: n.articulation,
  }));

  const edges = Object.values(state.edges).map((e) => {
    const a = pos[e.from], b = pos[e.to];
    const style = e.isBridge === true ? 'bridge' : e.kind;
    return {
      id: e.id, from: e.from, to: e.to,
      x1: a.x, y1: a.y, x2: b.x, y2: b.y, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2,
      style, highlighted: hlEdges.has(e.id),
      label: style === 'bridge' ? `${e.id} BRIDGE` : e.id,
    };
  });

  const edgeById = Object.fromEntries(analysis.edges.map((e) => [e.id, e]));
  const done = state.done;
  const total = analysis.events.length;

  return {
    phase: 'ready',
    errors: [],
    controls: { load: true, step: !done, run: !done, reset: true },
    progress: state.index < 0 ? `Ready: 0 of ${total} events` : `Step ${state.index + 1} of ${total}`,
    eventType: state.event ? state.event.type : null,
    eventText: state.event ? describeEvent(state.event, names) : 'Press Step to inspect the first island.',
    nodes, edges,
    table: nodes.map((n) => ({
      id: n.id, name: n.name,
      parent: dash(state.nodes[n.id].parent === null && n.discovery !== null ? 'root' : state.nodes[n.id].parent),
      discovery: dash(n.discovery), low: dash(n.low),
      status: STATUS_TEXT[n.status] + (n.articulation ? ' ★' : ''),
    })),
    history: replay.history.map((e) => ({ step: e.step, text: describeEvent(e, names), current: e.step === state.index })),
    summary: {
      componentCount: state.componentCount,
      final: done,
      bridges: state.bridges.map((id) => ({ id, text: `${names[edgeById[id].from]} – ${names[edgeById[id].to]}` })),
      articulation: state.articulationPoints.map((id) => ({ id, text: names[id] })),
    },
  };
}
