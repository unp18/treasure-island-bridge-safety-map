# Oracle: hand-derived expected results for the main archipelago

Derived by hand **before** the engine was written. Used only by tests
(`test/oracle.js`); the application never reads these values.

## Graph

| ID | Island           |
|----|------------------|
| A  | Anchor Cove      |
| B  | Beacon Reef      |
| C  | Coral Key        |
| D  | Driftwood Isle   |
| E  | Emerald Atoll    |
| F  | Fisher's Rest    |
| G  | Gull Rock        |
| H  | Harbor Point     |

| Bridge | Connects |
|--------|----------|
| BR1 | A-B |
| BR2 | B-C |
| BR3 | A-C |
| BR4 | C-D |
| BR5 | D-E |
| BR6 | E-F |
| BR7 | D-F |
| BR8 | F-G |
| BR9 | G-H |

Shape: loop A-B-C, a link C-D, loop D-E-F, then a tail F-G-H.
8 islands, 9 bridges, connected, 2 cycles.

## Sorted adjacency lists (neighbour IDs ascending)

```
A: B, C
B: A, C
C: A, B, D
D: C, E, F
E: D, F
F: D, E, G
G: F, H
H: G
```

## DFS trace (root A, the smallest ID; clock starts at 0)

1. Discover A: disc=low=0, parent=null.
2. A->B unvisited: tree edge. Discover B: disc=low=1, parent=A.
3. B->A is B's parent: skip. B->C unvisited: tree edge. Discover C: disc=low=2, parent=B.
4. C->A is visited and not C's parent (B): back-connection. low[C]=min(2, disc[A]=0)=0.
5. C->B is parent: skip. C->D unvisited: tree. Discover D: disc=low=3, parent=C.
6. D->C parent: skip. D->E unvisited: tree. Discover E: disc=low=4, parent=D.
7. E->D parent: skip. E->F unvisited: tree. Discover F: disc=low=5, parent=E.
8. F->D visited, not parent (E): low[F]=min(5, disc[D]=3)=3.
9. F->E parent: skip. F->G unvisited: tree. Discover G: disc=low=6, parent=F.
10. G->F parent: skip. G->H unvisited: tree. Discover H: disc=low=7, parent=G.
11. H->G parent: skip. H finished (low[H]=7).
12. Return H->G: low[G]=min(6,7)=6. low[H]=7 > disc[G]=6, so **BR9 is a bridge**. 7>=6, so **G is an articulation point**. G finished.
13. Return G->F: low[F]=min(3,6)=3. low[G]=6 > disc[F]=5, so **BR8 is a bridge**. 6>=5, so **F is an articulation point**. F finished.
14. Return F->E: low[E]=min(4,3)=3. low[F]=3 > disc[E]=4? No: BR6 is not a bridge. 3>=4? No. E finished.
15. Return E->D: low[D]=min(3,3)=3. low[E]=3 > disc[D]=3? **No (strict)**: BR5 is not a bridge. But 3>=3, so **D is an articulation point** (equality case).
16. D->F: visited, not parent (C): low[D]=min(3, disc[F]=5)=3 (no change). D finished.
17. Return D->C: low[C]=min(0,3)=0. low[D]=3 > disc[C]=2, so **BR4 is a bridge**. 3>=2, so **C is an articulation point**. C finished.
18. Return C->B: low[B]=min(1,0)=0. 0>1? No. 0>=1? No. B finished.
19. Return B->A: low[A]=min(0,0)=0. 0>0? No. A is root: not decided by >=.
20. A->C: visited, not parent (A is root, parent null): low[A]=min(0, disc[C]=2)=0. A finished.
21. A has exactly 1 DFS-tree child (B), so A is not an articulation point.

## Expected results

**Discovery order:** A, B, C, D, E, F, G, H

| Node | Parent | Discovery | Low |
|------|--------|-----------|-----|
| A | null | 0 | 0 |
| B | A | 1 | 0 |
| C | B | 2 | 0 |
| D | C | 3 | 3 |
| E | D | 4 | 3 |
| F | E | 5 | 3 |
| G | F | 6 | 6 |
| H | G | 7 | 7 |

**Component count:** 1 (root A)

**Bridge IDs (sorted):** BR4, BR8, BR9

**Articulation IDs (sorted):** C, D, F, G

## Rules this graph exercises

- Back-connection low propagation: steps 4 and 8.
- Strict bridge inequality: BR5 has `low[E] == disc[D]`, so it is a cycle edge, not a bridge.
- Non-root `>=` rule: D is an articulation point with equality.
- Cycle edge that is not a bridge: BR1, BR2, BR3, BR5, BR6, BR7.
- Root with one tree child is not an articulation point: A.
