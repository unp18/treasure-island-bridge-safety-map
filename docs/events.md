# Replay event schema (FINAL for this solution)

One flat, JSON-serialisable list: `analysis.events`. Fixed and repeatable:
it depends only on node/edge IDs, never on input array order or coordinates.

Every event has `step` (0-based index in the list) and `type`.

## Decisions

- **Undirected edges are inspected from both adjacency entries.** Each bridge
  produces two `INSPECT_EDGE` events, one from each endpoint, when that endpoint
  is the current node. This follows the contract wording literally ("visited
  neighbour other than u's parent"). Main graph: 9 edges give 18 inspections.
- Neighbours are inspected in ascending node-ID order; roots in ascending ID order.
- **Return order:** `FINISH_NODE(child)` then `RETURN`, then `CLASSIFY_TREE_EDGE`,
  then `ARTICULATION` (only if it fires).
- A tree edge's inspection comes *before* the child's `DISCOVER`.
- `ARTICULATION` is emitted **at most once per node**:
  - non-root: right after the first child classification with `low[child] >= discovery[node]`;
  - root: right after the **second** child's classification (the moment the root is known to have 2 tree children).
- `FINISH_COMPONENT` follows the root's `FINISH_NODE`.

## Event types

| type | fields | meaning |
|------|--------|---------|
| `DISCOVER` | `node, parent, discovery, low` | node first reached; discovery = low = clock; `parent` is null for a root |
| `INSPECT_EDGE` | `from, to, edge, kind, lowBefore, lowAfter` (+ `neighbourDiscovery` when `kind = visited`) | `kind` is `tree` (to is unvisited), `parent` (to is from's parent, ignored), or `visited` (back-connection: `lowAfter = min(lowBefore, neighbourDiscovery)`) |
| `FINISH_NODE` | `node, parent, discovery, low` | node's final values |
| `RETURN` | `node, child, edge, childLow, lowBefore, lowAfter` | `node` is the DFS parent: `lowAfter = min(lowBefore, childLow)` |
| `CLASSIFY_TREE_EDGE` | `edge, parent, child, childLow, parentDiscovery, isBridge` | `isBridge = childLow > parentDiscovery` (strict) |
| `ARTICULATION` | `node, reason` + (`child, childLow, parentDiscovery` for `NON_ROOT_CHILD_LOW`) or (`childCount` for `ROOT_TWO_CHILDREN`) | `>=` rule for non-root, 2-children rule for root |
| `FINISH_COMPONENT` | `root, componentIndex` | `componentIndex` is 0-based |

## Replay model (`src/replay/state.js`)

`stateAt(analysis, k)` folds events `0..k` into a fresh state (`k = -1` is the
pre-traversal state). The UI renders only this state, so the map, node table,
current event, counters and summaries cannot drift apart.

Node `status`: `unvisited` -> `visited` -> `finished`; plus `articulation` flag.
Edge `kind`: `untouched` -> `tree` | `nontree`; `isBridge`: `null` until
classified (non-tree edges are `false` as soon as inspected).
`bridges` / `articulationPoints` list only what has been revealed so far, so
results appear at the moment their event happens.

`Replay` (`src/replay/controller.js`) is just an index over the same list:
`step()` +1, `runToEnd()` jumps to the last event, `reset()` re-analyses the
private deep copy of the originally loaded graph.
