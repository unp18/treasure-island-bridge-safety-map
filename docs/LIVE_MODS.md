# Live-modification rehearsal

Each item below was actually tried in a scratch copy and the result recorded.
Remember: during the interview, AI use is allowed only if the interviewer says so.
These notes are so you can do it by hand.

| Likely request | Where | What happened when rehearsed |
|---|---|---|
| **Add an island and bridges** (e.g. island I with BR10 G-I, BR11 H-I) | `src/data/archipelago.js` | Predicted by hand, then confirmed with `npm run report`: BR9 stops being a bridge (`low[H] = 6 > disc[G] = 6` is false), bridges become BR4, BR8; articulation unchanged (C, D, F, G); 9 islands, 61 events. 20 tests then fail, all pinned to the 8-island oracle. Update `docs/oracle.md` and `test/oracle.js` and the golden trace first. |
| **Add a Back button** | `Replay.back()`, then `viewmodel.js` (`controls.back`), `html.js` (button), `main.js` (action) | Core: 8 lines (`index -= 1`, no-op at -1); `back` x2 after 3 steps equals the state after 1 step; all existing tests still passed at the time. With the UI wiring, 2 tests fail only because they deep-compare the `controls` object: add `back` to their expectations. Works because UI state is `stateAt(analysis, index)`. |
| **Change the bridge rule to `>=`** | `analyze.js`, `const isBridge` | 14 tests fail; report shows the wrong bridges BR1, BR4, BR5, BR8, BR9. Shows how the strict-inequality tests protect it. |
| **Auto-play / speed control** | `main.js` only | `setInterval(() => { if (!replay.step()) clearInterval(id); draw(); }, ms)`. Same event model, so determinism is untouched. |
| **Show only critical items** / filter the table | `viewmodel.js` `table` | Pure data change; test in `viewmodel.test.js`. |
| **Different DFS root order** (e.g. descending) | `analyze.js` `ids` loop and `adjacency.js` sort | Breaks ordering contract; the oracle and ordering tests will flag it. |
| **Add a new event type** (e.g. "SKIP_EDGE") | `analyze.js` emit, `state.js` apply, `describe.js` | Golden trace test must be updated by hand. Unknown types throw in `apply`, so a missing case is caught immediately. |

## Verify after any change
```
npm test          # 98 tests
npm run report    # engine output vs docs/oracle.md
npm start         # open http://localhost:8080
```
