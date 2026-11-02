# Prompt log

Record each prompt, what it produced, and what you changed or rejected.

## 1. Objectives and plan
- **Prompt:** "Go through the PS and evaluation criteria ... derive a structured plan to implement the solution in small portions and first map out all the objectives."
- **Produced:** objectives table, stack/architecture decisions, 5-step plan.
- **Changed/validated by me:** (fill in)

## 2. Repo + Steps 1 and 2
- **Prompt:** "create a new repo in github and start with step1 and 2"
- **Produced:** archipelago, hand-derived oracle, event-schema draft, TDD engine, mutation check.
- **Changed/validated by me:** (fill in: re-derive the oracle trace by hand and confirm it)

## 3. Step 3: events and replay model
- **Prompt:** "go ahead"
- **Produced:** event emission in `analyze`, pure `stateAt`, `describeEvent`, `Replay` controller, hand-derived golden trace, second mutation check.
- **Changed/validated by me:** (fill in: re-derive the 53-event trace for a few steps; explain return order RETURN -> CLASSIFY -> ARTICULATION)

## 4. Steps 4 and 5: UI, hardening, evidence
- **Prompt:** "complete step 4 and 5 as well"
- **Produced:** view-model + HTML renderer + SVG map + CSS, tests for UI, scripts (serve/report/snapshot), mutation checks, rehearsed live modifications, docs.
- **Changed/validated by me:** (fill in: open it with `npm start`, step through BR9 and BR5, read the code in `viewmodel.js`)
