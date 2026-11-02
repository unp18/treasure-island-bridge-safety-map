import { compareIds } from './compare.js';

// Builds { nodeId: [neighbourIds ascending] } from IDs only.
// Assumes the graph already passed validateGraph.
export function buildAdjacency(graph) {
  const lists = {};
  for (const node of graph.nodes) lists[node.id] = [];
  for (const edge of graph.edges) {
    lists[edge.from].push(edge.to);
    lists[edge.to].push(edge.from);
  }
  const sorted = {};
  for (const id of Object.keys(lists).sort(compareIds)) {
    sorted[id] = lists[id].sort(compareIds);
  }
  return sorted;
}
