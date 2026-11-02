# 30-40 minute walkthrough outline

1. **Problem and plan (3 min).** Festival islands; critical bridges and junctions. Show the 5-step plan in `docs/PLAN.md` and what changed (3 deviations, all listed).
2. **Prompts and constraints (4 min).** `docs/PROMPTS.md`. Constraints I gave the AI: plain JS ES modules, no dependencies, pure engine, iterative DFS, tests first, oracle derived by hand before code.
3. **Design (6 min).** Three layers: `engine` (validate, adjacency, analyze+events) -> `replay` (`stateAt` fold, `describeEvent`, `Replay`) -> `ui` (view-model, HTML string, thin DOM). Key idea: screen = `stateAt(analysis, index)`, so Step / Run / Reset cannot disagree.
4. **Trace one bridge on screen (6 min).** `npm start`. Load, step to BR9: "low[H] = 7 > discovery[G] = 6, so no other way back". Then BR5: "3 > 3 is false" -> not a bridge, yet D is still an articulation island (`>=`).
5. **Testing (6 min).** `npm test`; `docs/TRACEABILITY.md`; hand-derived 53-event golden trace; mutation spot-checks and the 3 gaps they exposed (`docs/EVIDENCE.md`).
6. **Trade-offs (4 min).** `docs/DECISIONS.md`: both-endpoint inspection, iterative DFS, events vs recompute, results revealed at their event.
7. **Honest limits (2 min).** Label overlap, not auto-tested in a real browser, no editor.
8. **Live modification (rest).** `docs/LIVE_MODS.md`.

Be ready to explain without help: the 21-step trace in `docs/oracle.md`, why the parent edge is skipped by node ID, why root and non-root articulation rules differ.
