// Turns an event into a sentence that states the numerical change it caused.

export const nameMap = (graph) => Object.fromEntries(graph.nodes.map((n) => [n.id, n.name]));

export function describeEvent(e, names) {
  const L = (id) => `${names[id] ?? id} (${id})`;
  switch (e.type) {
    case 'DISCOVER':
      return e.parent === null
        ? `Start a new search at ${L(e.node)}, a component root. discovery = low = ${e.discovery}.`
        : `Arrive at ${L(e.node)} from ${L(e.parent)}. discovery = low = ${e.discovery}.`;
    case 'INSPECT_EDGE': {
      const via = `bridge ${e.edge}`;
      if (e.kind === 'tree') {
        return `From ${L(e.from)}, ${via} leads to unvisited ${L(e.to)}: a tree edge. low[${e.from}] stays ${e.lowAfter}.`;
      }
      if (e.kind === 'parent') {
        return `From ${L(e.from)}, ${via} leads back to its parent ${L(e.to)}: ignored. low[${e.from}] stays ${e.lowAfter}.`;
      }
      const change = e.lowAfter < e.lowBefore
        ? `low[${e.from}] ${e.lowBefore} → ${e.lowAfter}`
        : `low[${e.from}] stays ${e.lowAfter}`;
      return `From ${L(e.from)}, ${via} reaches already-visited ${L(e.to)} (discovery ${e.neighbourDiscovery}), which is not its parent: a back-connection. min(${e.lowBefore}, ${e.neighbourDiscovery}): ${change}.`;
    }
    case 'FINISH_NODE':
      return `Finished ${L(e.node)}. Final values: parent ${e.parent ?? 'none'}, discovery ${e.discovery}, low ${e.low}.`;
    case 'RETURN': {
      const change = e.lowAfter < e.lowBefore
        ? `low[${e.node}] ${e.lowBefore} → ${e.lowAfter}`
        : `low[${e.node}] stays ${e.lowAfter}`;
      return `Return from ${L(e.child)} to ${L(e.node)} over ${e.edge}. min(${e.lowBefore}, low[${e.child}] = ${e.childLow}): ${change}.`;
    }
    case 'CLASSIFY_TREE_EDGE':
      return e.isBridge
        ? `${e.edge} is a BRIDGE: low[${e.child}] = ${e.childLow} > discovery[${e.parent}] = ${e.parentDiscovery}, so ${L(e.child)}'s side has no other way back.`
        : `${e.edge} is not a bridge: low[${e.child}] = ${e.childLow} > discovery[${e.parent}] = ${e.parentDiscovery} is false, so another route exists.`;
    case 'ARTICULATION':
      return e.reason === 'ROOT_TWO_CHILDREN'
        ? `${L(e.node)} is an ARTICULATION island: as the search root it has ${e.childCount} DFS-tree children, so removing it splits them apart.`
        : `${L(e.node)} is an ARTICULATION island: child ${L(e.child)} has low = ${e.childLow} >= discovery[${e.node}] = ${e.parentDiscovery}, so it cannot get around ${e.node}.`;
    case 'FINISH_COMPONENT':
      return `Component ${e.componentIndex + 1} is complete (root ${L(e.root)}).`;
    default:
      return `Unknown event ${e.type}.`;
  }
}
