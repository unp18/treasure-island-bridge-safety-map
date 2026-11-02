# Acceptance-criteria traceability

Run everything with `npm test` (98 tests, about 0.6 s). Spec-style output: `docs/evidence/test-output.txt`.

## Required

| Requirement | Evidence |
|---|---|
| Load the main archipelago in one action; reproduce the documented adjacency, discovery order, parent/disc/low table, component count, bridge and articulation IDs, without reading the oracle | `analyze.test.js` "main archipelago reproduces the documented oracle"; `adjacency.test.js` "match the hand-derived oracle"; `contract.test.js` "never reads the documented oracle" (scans `src/` and `index.html`); `main.test.js` (Load button) ; `npm run report` -> `docs/evidence/report.txt` |
| Step and Run to End use the same event sequence; every low update and classification agrees with the final table | `controller.test.js` "stepping one-by-one and Run to End give identical history"; `events.test.js` "main archipelago event sequence equals the hand-derived trace exactly" (53 events), "every classification and articulation event agrees", "low values carried by events agree"; `replay-state.test.js` "every visible low change agrees with the event that announced it"; `viewmodel.test.js` "map, table, summary and history stay in sync at every step" |
| Reverse/shuffle node and edge arrays gives the same traversal values and results | `analyze.test.js` "same result for reversed and shuffled node/edge source arrays" (whole result incl. events); `events.test.js` "identical across repeated runs and across reversed/shuffled inputs"; `adjacency.test.js`; `viewmodel.test.js` "ignores source order" |
| Small cycle-only test with no bridge or articulation point | `analyze.test.js` "cycle-only graph has no bridge and no articulation point" (5-cycle) plus triangle and 4-cycle in the strict-inequality test |
| Separate test: root with >= 2 tree children + disconnected component + isolated node | `analyze.test.js` "root with two children + disconnected component + isolated node" |
| At least two materially different invalid cases, no stale output | `validate.test.js`: out-of-range coordinate, duplicate node ID, unknown endpoint, self-loop, duplicate connection (both directions), bad IDs, empty name, counts; "analyze on invalid input returns errors only"; `controller.test.js` "invalid load ... clears stale replay and results" (3 kinds); `viewmodel.test.js` "rejected graph" |
| Full map, replay state, numeric proof values, node table, component count and critical summaries visible together | `html.test.js` "all four panels are on the page together"; snapshots `docs/screenshots/*.png` |
| Reset restores the original graph and pre-traversal state; repeated stepped and complete runs are identical | `controller.test.js` "Reset returns to exactly the post-load state ...", "Reset uses the original graph even if the caller mutates", "two independent runs ... identical"; `viewmodel.test.js` "Reset gives the post-load view" |
| Focused rule tests | see next table |

## Focused rule tests

| Rule | Test |
|---|---|
| Back-connection low propagation | `analyze.test.js` "back-connection low propagation ...", "back-connection uses the neighbour's DISCOVERY value, not its low value" |
| Strict bridge inequality | `analyze.test.js` "strict bridge inequality: low[child] == disc[parent] is NOT a bridge"; `viewmodel.test.js` "strict-inequality case is shown as NOT a bridge" |
| Non-root `>=` articulation rule | `analyze.test.js` "non-root articulation uses >= (equality counts ...)"; `events.test.js` "non-root articulation island with several qualifying children is announced once" |
| Root child-count rule | `analyze.test.js` "root is an articulation point only with two or more DFS children"; `events.test.js` "root with two children emits ARTICULATION once ..." |
| Component / root ordering | `analyze.test.js` "one clock spans all components; roots are chosen in ascending ID order", "neighbours are inspected in ascending ID order" |
| Validation | `validate.test.js` (14 tests) |
| Event ordering | `events.test.js` (golden 53-event trace; RETURN -> CLASSIFY -> ARTICULATION order; both-endpoint inspection) |
| Reset | `controller.test.js`, `viewmodel.test.js` |

## Problem-statement structure of the main demo
`analyze.test.js` "main archipelago satisfies the problem-statement structure requirements": 6-9 islands, 6-13 bridges, connected, a cycle, a bridge, a non-root articulation point, and a non-bridge cycle edge.

## Not covered by automated tests
- The real browser run is manual (Chromium via Playwright, results in `docs/EVIDENCE.md` section 6). `src/ui/main.js` itself is exercised against a fake DOM by `npm test`.
- Firefox, Safari, dark-theme appearance and the history auto-scroll as a unit test (it was checked by hand in Chromium).
- Optional items (animation, printable view) are not built.
