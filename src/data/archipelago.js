// The candidate-created main demonstration graph.
// This file contains ONLY the graph (nodes + edges): no expected results.
// Coordinates (0-100) affect presentation only.

export const archipelago = {
  nodes: [
    { id: 'A', name: 'Anchor Cove',    x: 2, y: 66 },
    { id: 'B', name: 'Beacon Reef',    x: 14, y: 34 },
    { id: 'C', name: 'Coral Key',      x: 27, y: 56 },
    { id: 'D', name: 'Driftwood Isle', x: 43, y: 76 },
    { id: 'E', name: 'Emerald Atoll',  x: 54, y: 24 },
    { id: 'F', name: "Fisher's Rest",  x: 66, y: 76 },
    { id: 'G', name: 'Gull Rock',      x: 79, y: 56 },
    { id: 'H', name: 'Harbor Point',   x: 95, y: 76 },
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
