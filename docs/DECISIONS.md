# Decisions and trade-offs

| # | Decision | Why | Alternative considered |
|---|----------|-----|------------------------|
| 1 | Plain JS (ES modules) + `node:test`, no dependencies | Easy to run, explain and modify live | TypeScript/React: more tooling, slower to change in an interview |
| 2 | Pure engine separated from UI | Testable without a browser; thin UI | Logic inside UI handlers |
| 3 | Iterative DFS with explicit stack | Same loop can emit events in Step 3; no recursion limits | Recursive DFS: shorter, but event emission is awkward to pause/resume |
| 4 | Edge field names `from`/`to`, IDs `BR1..BR9` | Readable; ASCII sort of IDs is part of the contract | `source`/`target` |
| 5 | Parent skipped by node ID, not edge ID | Valid because parallel edges are rejected by validation | Skip by edge ID (needed only if parallel edges were allowed) |
| 6 | Validation returns ALL errors, each naming node/edge/endpoint | Better UX; satisfies "identify the relevant item" | Fail on first error |
| 7 | `analyze` returns only `{ok:false, errors}` on invalid input | Makes "no partial analysis / no stale output" structurally true | Return partial results alongside errors |
| 8 | Oracle values live only in `docs/` and `test/` | Contract: app must calculate, not read answers | Snapshot tests generated from the engine (circular) |
| 9 | Seeded shuffle in tests | Shuffle tests are repeatable | `Math.random` (flaky) |
| 10 | Mutation spot-check of the engine | Proves tests fail when a rule is broken | Trust coverage by eye |
| 11 | Events recorded from both adjacency entries (2 per bridge) | Matches the contract's wording exactly; shows the "parent: ignored" case on screen | Record each edge once: shorter replay, but hides why the parent edge is skipped |
| 12 | Hand-derived 53-event golden trace in tests | Event log verified independently of the code that emits it | Snapshot of engine output (circular) |
| 13 | UI state = `stateAt(analysis, k)` (fold, recomputed per step) | One source of truth; Step/Run/Reset cannot disagree; O(n) per step is trivial at <= ~100 events | Incremental mutation of UI state: faster, but drift risk |
| 14 | Results (bridges, articulation) are revealed at their event, not up front | Volunteer sees *why*; final summary equals the last state | Show final answer from the start |
| 15 | `Replay` keeps a private deep copy for Reset | Reset restores the original graph even if caller objects change | Hold a reference to the caller's graph |
| 16 | ARTICULATION at most once per node, root fires on the 2nd child | One clear announcement; root rule is decided exactly when it becomes true | Emit for every qualifying child (noisy, repeats) |
| 17 | View-model (`buildView`) separate from HTML (`renderApp`) | All screen logic is testable in Node; DOM layer is ~25 lines | Build DOM imperatively in handlers |
| 18 | Whole app re-rendered via `innerHTML` each step, focus restored to the pressed button | Simplest correct approach at ~50 events and 20 elements; every string escaped through `esc()` | Virtual DOM / framework: unnecessary here |
| 19 | Non-colour encodings: dash, stroke width, double stroke, text labels, symbols (`▶ ★`) | Required by the brief; inline attributes survive a missing stylesheet | Colour only |
| 20 | Edges: bold = DFS tree, dashed = inspected non-tree, double red + `BRIDGE` = bridge | Three states distinguishable in greyscale | Colour-coded solid lines |
| 21 | Results listed on screen only after their event | Matches "explain it, don't just show it" | Show answer first |
| 22 | Zero-dependency Node static server | `npm start` works with Node alone | `python3 -m http.server` (also works) |
| 23 | Snapshots rendered from the same code path via wkhtmltoimage | No browser available; still shows true page markup | Hand-made mock screenshots (not evidence) |
