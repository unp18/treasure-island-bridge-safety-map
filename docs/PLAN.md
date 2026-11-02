# Implementation plan (5 steps)

| Step | Scope | Checkpoint | Status |
|------|-------|------------|--------|
| 1 | Spec, archipelago, hand-derived oracle, event schema draft | Can trace DFS on paper and explain every low value | Done |
| 2 | Engine core with TDD: validate, adjacency, low-link analyze | Tests match oracle; shuffled/reversed input identical | Done |
| 3 | Event emission + pure `stateAt(events, k)` replay model | Stepped and full runs give identical histories; log agrees with final table | Next |
| 4 | UI: SVG map, node table, event panel, summaries, 4 controls | Volunteer can explain one bridge result from the screen alone | |
| 5 | Hardening, evidence, live-mod prep | All tests pass; screenshots; rehearsed modifications | |

## Changes from the original plan
(Record deviations here as they happen.)

- Step 2: added `treeChildren` and `edgesInCycles` to the analysis result
  (needed for the root-rule tests and the "non-bridge cycle edge" requirement).
- Step 2: added a test after a mutation check found no test separated
  `disc[neighbour]` from `low[neighbour]` in the back-connection rule.
