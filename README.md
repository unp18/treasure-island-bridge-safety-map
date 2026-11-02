# Treasure-Island Bridge Safety Map

Interactive safety map for a festival archipelago: replays a low-link DFS and
shows which single bridge or island junction could split the festival.

**Status:** Step 1 (archipelago + oracle) and Step 2 (engine, TDD) complete.
Events/replay (Step 3) and UI (Step 4) are next.

## Run the tests

```
npm test        # Node 20+; no dependencies
```

## Layout

```
src/engine/   pure logic, no DOM: validate.js, adjacency.js, analyze.js
src/data/     archipelago.js (the main demo graph; graph only, no answers)
test/         *.test.js plus oracle.js (hand-derived answers; tests only)
docs/         PLAN.md, oracle.md, events.md, DECISIONS.md, PROMPTS.md
```

## Graph format

```js
{ nodes: [{ id: 'A', name: 'Anchor Cove', x: 12, y: 25 }, ...],
  edges: [{ id: 'BR1', from: 'A', to: 'B' }, ...] }
```

`analyze(graph)` returns `{ ok:false, errors }` for invalid input (nothing else),
or `{ ok:true, adjacency, roots, discoveryOrder, nodes, table, treeChildren,
componentCount, bridges, edgesInCycles, articulationPoints }`.

The application never reads `docs/oracle.md` or `test/oracle.js`.
