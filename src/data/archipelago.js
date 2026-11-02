// The candidate-created main demonstration graph.
// This file contains ONLY the graph (nodes + edges). It never contains
// expected results; those live in docs/oracle.md and test/oracle.js.
// Coordinates (0-100) affect presentation only.

export const archipelago = {
  nodes: [
    { id: 'A', name: 'Anchor Cove',    x: 12, y: 25 },
    { id: 'B', name: 'Beacon Reef',    x: 28, y: 10 },
    { id: 'C', name: 'Coral Key',      x: 30, y: 45 },
    { id: 'D', name: 'Driftwood Isle', x: 50, y: 55 },
    { id: 'E', name: 'Emerald Atoll',  x: 62, y: 30 },
    { id: 'F', name: "Fisher's Rest",  x: 72, y: 62 },
    { id: 'G', name: 'Gull Rock',      x: 88, y: 45 },
    { id: 'H', name: 'Harbor Point',   x: 90, y: 80 },
  ],
  edges: [
    { id: 'BR1', from: 'A', to: 'B' },
    { id: 'BR2', from: 'B', to: 'C' },
    { id: 'BR3', from: 'A', to: 'C' },
    { id: 'BR4', from: 'C', to: 'D' },
    { id: 'BR5', from: 'D', to: 'E' },
    { id: 'BR6', from: 'E', to: 'F' },
    { id: 'BR7', from: 'D', to: 'F' },
    { id: 'BR8', from: 'F', to: 'G' },
    { id: 'BR9', from: 'G', to: 'H' },
  ],
};
