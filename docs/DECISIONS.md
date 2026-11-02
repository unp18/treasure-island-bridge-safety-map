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
