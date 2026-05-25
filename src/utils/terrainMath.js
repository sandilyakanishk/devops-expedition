// ================================================================
// terrainMath.js — Curved and Steep Mountain Path Math
// ================================================================

export const CHECKPOINTS = [
  { id: 1, z: -8,   y: 0,   x: 0 },
  { id: 2, z: -38,  y: 6,   x: -5 },
  { id: 3, z: -70,  y: 13,  x: 5 },
  { id: 4, z: -102, y: 20,  x: -4 },
  { id: 5, z: -136, y: 27,  x: 4 },
  { id: 6, z: -168, y: 34,  x: -3 },
  { id: 7, z: -185, y: 38,  x: 0 } // Summit
];

// Helper for Cosine interpolation (smooth S-curve transitions)
function cosInterpolate(y1, y2, mu) {
  const mu2 = (1 - Math.cos(mu * Math.PI)) / 2;
  return y1 * (1 - mu2) + y2 * mu2;
}

export function getPathCenterX(z) {
  if (z >= 0) return 0;
  if (z <= -185) return 0;

  // If z is within the plateau radius (5 units) of any checkpoint, keep it flat
  const cp = CHECKPOINTS.find(c => Math.abs(c.z - z) <= 5);
  if (cp) return cp.x;

  // Find the bounding checkpoints
  let next = CHECKPOINTS[0];
  let prev = { z: 0, y: 0, x: 0 };

  for (let i = 0; i < CHECKPOINTS.length; i++) {
    if (CHECKPOINTS[i].z <= z) {
      next = CHECKPOINTS[i];
      prev = i === 0 ? { z: 0, y: 0, x: 0 } : CHECKPOINTS[i - 1];
    }
  }

  const prevPlateauEnd = prev.z - 5;
  const nextPlateauStart = next.z + 5;

  if (z >= prevPlateauEnd) return prev.x;
  if (z <= nextPlateauStart) return next.x;

  const t = (z - prevPlateauEnd) / (nextPlateauStart - prevPlateauEnd);
  return cosInterpolate(prev.x, next.x, t);
}

export function getTerrainY(z) {
  if (z >= 0) return 0;
  if (z <= -185) return 38;

  // If z is within the plateau radius of any checkpoint, keep it flat
  const cp = CHECKPOINTS.find(c => Math.abs(c.z - z) <= 5);
  if (cp) return cp.y;

  // Find the bounding checkpoints
  let next = CHECKPOINTS[0];
  let prev = { z: 0, y: 0, x: 0 };

  for (let i = 0; i < CHECKPOINTS.length; i++) {
    if (CHECKPOINTS[i].z <= z) {
      next = CHECKPOINTS[i];
      prev = i === 0 ? { z: 0, y: 0, x: 0 } : CHECKPOINTS[i - 1];
    }
  }

  const prevPlateauEnd = prev.z - 5;
  const nextPlateauStart = next.z + 5;

  if (z >= prevPlateauEnd) return prev.y;
  if (z <= nextPlateauStart) return next.y;

  const t = (z - prevPlateauEnd) / (nextPlateauStart - prevPlateauEnd);
  return cosInterpolate(prev.y, next.y, t);
}

// Computes a perpendicular direction vector in the XZ plane at z,
// pointing to the right side of the trail.
export function getPathPerpendicular(z) {
  const deltaZ = 0.5;
  const z1 = z + deltaZ;
  const z2 = z - deltaZ;
  const x1 = getPathCenterX(z1);
  const x2 = getPathCenterX(z2);

  // Tangent vector
  const tx = x2 - x1;
  const tz = z2 - z1; // -2 * deltaZ (-1.0)
  const len = Math.hypot(tx, tz);

  if (len < 0.0001) {
    return { px: 1, pz: 0 };
  }

  // Perpendicular points to the right side of the trail (pointing positive X-ish)
  return {
    px: -tz / len,
    pz: tx / len
  };
}
