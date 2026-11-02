# Treasure-Island Bridge Safety Map

Interactive safety map for a festival archipelago: replays a low-link DFS and
shows which single bridge or island junction could split the festival.

**Status:** all 5 steps complete. 98 tests.

## Run it

```
npm start         # then open http://localhost:8080 (Node 20+, no dependencies)
npm test          # 98 tests
npm run report    # engine output for the main archipelago
npm run snapshots # regenerate docs/screenshots/*.html (PNG needs wkhtmltoimage)
```

In the page: **Load My Archipelago**, then **Step** (one event) or **Run to End**; **Reset** returns to the pre-traversal state.

## Layout

```
src/engine/   pure logic, no DOM: validate.js, adjacency.js, analyze.js (+ events)
src/replay/   state.js (stateAt fold), describe.js (event text), controller.js (Replay)
src/ui/       viewmodel.js (screen data), html.js (HTML string), main.js (DOM wiring), styles.css
scripts/      serve.js, report.js, snapshot.js
index.html    entry page
src/data/     archipelago.js (the main demo graph; graph only, no answers)
test/         *.test.js plus oracle.js (hand-derived answers; tests only)
docs/         PLAN, oracle, events, DECISIONS, PROMPTS, TRACEABILITY, EVIDENCE,
              LIVE_MODS, PRESENTATION, screenshots/, evidence/
```

## Graph format

```js
{ nodes: [{ id: 'A', name: 'Anchor Cove', x: 12, y: 25 }, ...],
  edges: [{ id: 'BR1', from: 'A', to: 'B' }, ...] }
```

`analyze(graph)` returns `{ ok:false, errors }` for invalid input (nothing else),
or `{ ok:true, adjacency, roots, discoveryOrder, nodes, table, treeChildren,
componentCount, bridges, edges, edgesInCycles, articulationPoints, events }`.

Replay: `const r = new Replay(); r.load(graph); r.step(); r.runToEnd(); r.reset(); r.state`.
Event schema and ordering: `docs/events.md`.

The application never reads `docs/oracle.md` or `test/oracle.js`.
