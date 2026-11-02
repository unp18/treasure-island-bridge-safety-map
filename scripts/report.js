// Prints the analysis of the main archipelago computed by the engine (never reads the oracle).
//   npm run report
import { analyze } from '../src/engine/analyze.js';
import { archipelago } from '../src/data/archipelago.js';

const r = analyze(archipelago);
if (!r.ok) { console.error(r.errors); process.exit(1); }
console.log('Sorted adjacency lists');
for (const [id, list] of Object.entries(r.adjacency)) console.log(`  ${id}: ${list.join(', ') || '(none)'}`);
console.log(`\nDiscovery order: ${r.discoveryOrder.join(' ')}`);
console.log('\nID  parent  disc  low');
for (const t of r.table) console.log(`${t.id.padEnd(3)} ${String(t.parent ?? 'null').padEnd(7)} ${String(t.discovery).padEnd(5)} ${t.low}`);
console.log(`\nComponents: ${r.componentCount} (roots: ${r.roots.join(', ')})`);
console.log(`Bridge IDs: ${r.bridges.join(', ') || '(none)'}`);
console.log(`Articulation IDs: ${r.articulationPoints.join(', ') || '(none)'}`);
console.log(`Edges on cycles: ${r.edgesInCycles.join(', ')}`);
console.log(`Replay events: ${r.events.length}`);
