# Replay event schema (DRAFT, finalised in Step 3)

Decisions fixed now so Step 2 can be written to match:

- An undirected edge is inspected **from both adjacency entries**: once from
  each endpoint, when that endpoint is the current node. This matches the
  contract wording literally ("already-visited neighbour other than parent").
- Per node `u`, neighbours are processed in ascending ID order.
- Every event carries `step` (0-based index), `type`, and the old/new values
  it changed, so the UI text can be generated directly from the event.

Planned event types and order:

1. `DISCOVER`  {node, parent, discovery, low}
2. `INSPECT_EDGE` {from, to, edge, kind: tree | parent | visited, lowBefore, lowAfter}
3. After a tree child completes, in this order:
   `RETURN` {node, child, lowBefore, lowAfter}
   `CLASSIFY_TREE_EDGE` {edge, parent, child, isBridge, childLow, parentDiscovery}
   `ARTICULATION` {node, reason} (only when the rule fires; emitted at most once per node)
4. `FINISH_NODE` {node}
5. `FINISH_COMPONENT` {root, componentIndex}  (after the root's FINISH_NODE)
