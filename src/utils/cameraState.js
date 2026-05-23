// Shared camera yaw reference — written by Camera.jsx, read by Character.jsx
// Both components import this directly, eliminating prop-drilling overhead.
// Initial value = Math.PI so the camera starts facing forward (into the scene, negative Z).
export const cameraYawRef = { current: 0 };
export const cameraPitchRef = { current: 0.28 };
export const characterRotationRef = { current: 0 };
