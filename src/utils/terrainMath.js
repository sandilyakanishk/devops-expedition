// ================================================================
// terrainMath.js — Flat Straight Trail Math
// ================================================================

export const CHECKPOINTS = [
  { id: 1, z: -8,   y: 0,   x: 0 },
  { id: 2, z: -38,  y: 0,   x: 0 },
  { id: 3, z: -70,  y: 0,   x: 0 },
  { id: 4, z: -102, y: 0,   x: 0 },
  { id: 5, z: -136, y: 0,   x: 0 },
  { id: 6, z: -168, y: 0,   x: 0 },
  { id: 7, z: -185, y: 0,   x: 0 } // Summit
];

export function getPathCenterX(z) {
  return 0;
}

export function getTerrainY(z) {
  return 0;
}

// Perpendicular vector for straight trail points directly right (positive X)
export function getPathPerpendicular(z) {
  return {
    px: 1,
    pz: 0
  };
}
