# Implementation plan (5 steps)

| Step | Scope | Checkpoint | Status |
|------|-------|------------|--------|
| 1 | Spec, archipelago, hand-derived oracle, event schema draft | Can trace DFS on paper and explain every low value | Done |
| 2 | Engine core with TDD: validate, adjacency, low-link analyze | Tests match oracle; shuffled/reversed input identical | Done |
| 3 | Event emission + pure `stateAt(events, k)` replay model | Stepped and full runs give identical histories; log agrees with final table | Done |
| 4 | UI: SVG map, node table, event panel, summaries, 4 controls | Volunteer can explain one bridge result from the screen alone | Done |
| 5 | Hardening, evidence, live-mod prep | All tests pass; screenshots; rehearsed modifications | Done |

## Changes from the original plan
(Record deviations here as they happen.)

- Step 2: added `treeChildren` and `edgesInCycles` to the analysis result
  (needed for the root-rule tests and the "non-bridge cycle edge" requirement).
- Step 2: added a test after a mutation check found no test separated
  `disc[neighbour]` from `low[neighbour]` in the back-connection rule.
- Step 3: brought the `Replay` controller (Step, Run to End, Reset, invalid-load
  clearing) forward from Step 5 into Step 3, because it is pure logic and its
  tests (reset identity, repeat runs, no stale output) belong with the replay model.
- Step 3: added `describeEvent` (event -> sentence with the numeric change) here
  rather than in the UI, so the wording is unit-tested without a browser.
- Step 3: `ARTICULATION` is emitted once per node. A second mutation check found
  nothing tested a non-root node with two qualifying children; added a hand-derived trace.
- Step 4: made the UI render through pure functions (`buildView` -> `renderApp`
  HTML string) instead of building DOM nodes directly. Reason: no browser was
  available in my environment, and this makes the whole screen unit-testable and
  lets the snapshot script show exactly what the page renders.
- Step 4: line styles, dashes and ring styles are inline SVG attributes (colours are
  in CSS), so the non-colour encodings hold even if the stylesheet fails to load.
- Step 5: added `scripts/serve.js` (`npm start`), `scripts/report.js`, `scripts/snapshot.js`.
- Step 5: mutation spot-checks (29 mutations) found 3 test gaps and testing the
  tooling found a server crash; all fixed and recorded in `docs/EVIDENCE.md`.
- Step 5: added `PRESENTATION.md`, `TRACEABILITY.md`, `LIVE_MODS.md`.
- Step 5 (follow-up): opened the page in real Chromium for the first time. Fixed label
  collisions, a missing text halo, and a sideways scroll on narrow screens; added 2 layout
  regression tests (98 total). Details in `docs/EVIDENCE.md` section 6.
