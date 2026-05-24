// ================================================================
// Camera.jsx — Cinematic intro + Mouse-drag camera rotation
// NO pointer lock — cursor always visible, mouse drag rotates view
// ================================================================
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraYawRef, cameraPitchRef } from '../utils/cameraState';

const CAMERA_DIST   = 7.5;
const CAMERA_HEIGHT = 3.8;
const MIN_PITCH     = -0.08;
const MAX_PITCH     =  0.90;

export default function Camera({ playerPosRef, onIntroComplete }) {
  const introTimeRef  = useRef(0);
  const isIntroRef    = useRef(false); // Skip fly-through intro to start behind the character
  const pitchRef      = cameraPitchRef;
  const camPos        = useRef(new THREE.Vector3());
  const lookPos       = useRef(new THREE.Vector3());

  const { gl }        = useThree();

  useEffect(() => {
    if (!isIntroRef.current && onIntroComplete) {
      onIntroComplete();
    }
  }, [onIntroComplete]);
  
  // Touch tracking state (no click-drag required for mouse)
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const hasInitializedTouchRef = useRef(false);
  const smoothYawRef  = useRef(0);
  const smoothPitchRef = useRef(0.28);
  const lookTouchIdRef = useRef(null);

  // ── Touch and Wheel listeners ──
  useEffect(() => {
    const onTouchStart = (e) => {
      if (lookTouchIdRef.current === null && e.targetTouches.length > 0) {
        const touch = e.targetTouches[0];
        lookTouchIdRef.current = touch.identifier;
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        hasInitializedTouchRef.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (isIntroRef.current) return;
      if (lookTouchIdRef.current !== null && hasInitializedTouchRef.current) {
        const touch = Array.from(e.touches).find(t => t.identifier === lookTouchIdRef.current);
        if (touch) {
          const dx = touch.clientX - lastTouchRef.current.x;
          const dy = touch.clientY - lastTouchRef.current.y;
          
          lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

          const TOUCH_SENS = 0.005; // smooth swipe rotation
          cameraYawRef.current += dx * TOUCH_SENS;
          pitchRef.current = THREE.MathUtils.clamp(
            pitchRef.current - dy * TOUCH_SENS,
            MIN_PITCH,
            MAX_PITCH
          );
        }
      }
    };

    const onTouchEnd = (e) => {
      if (lookTouchIdRef.current !== null) {
        const hasEnded = Array.from(e.changedTouches).some(t => t.identifier === lookTouchIdRef.current);
        if (hasEnded) {
          lookTouchIdRef.current = null;
          hasInitializedTouchRef.current = false;
        }
      }
    };

    gl.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    gl.domElement.addEventListener('touchmove',  onTouchMove,  { passive: true });
    gl.domElement.addEventListener('touchend',   onTouchEnd,   { passive: true });
    gl.domElement.addEventListener('touchcancel',onTouchEnd,   { passive: true });

    return () => {
      if (gl?.domElement) {
        gl.domElement.removeEventListener('touchstart', onTouchStart);
        gl.domElement.removeEventListener('touchmove',  onTouchMove);
        gl.domElement.removeEventListener('touchend',   onTouchEnd);
        gl.domElement.removeEventListener('touchcancel',onTouchEnd);
      }
    };
  }, [gl, pitchRef]);

  useFrame((state, delta) => {
    if (!playerPosRef.current) return;
    const camera = state.camera;
    const pp     = playerPosRef.current;

    if (isIntroRef.current) {
      // ── Cinematic opening sweep ──────────────────────────────
      introTimeRef.current += delta;
      const t = introTimeRef.current;
      let camP  = new THREE.Vector3();
      let lookT = new THREE.Vector3();

      if (t < 1.8) {
        const e = THREE.MathUtils.smoothstep(t / 1.8, 0, 1);
        camP.lerpVectors( new THREE.Vector3(8, 16, 22),   new THREE.Vector3(-6, 6.5, 9),  e);
        lookT.lerpVectors(new THREE.Vector3(0, 15, -130), new THREE.Vector3(-5, 2.2, -5), e);
      } else if (t < 3.6) {
        const e = THREE.MathUtils.smoothstep((t - 1.8) / 1.8, 0, 1);
        camP.lerpVectors( new THREE.Vector3(-6, 6.5, 9),  new THREE.Vector3(3.5, 2.8, 3.5), e);
        lookT.lerpVectors(new THREE.Vector3(-5, 2.2, -5), new THREE.Vector3(0, 0.8, -2.5),  e);
      } else if (t < 5.2) {
        const e = THREE.MathUtils.smoothstep((t - 3.6) / 1.6, 0, 1);
        camP.lerpVectors( new THREE.Vector3(3.5, 2.8, 3.5), new THREE.Vector3(0, 2.4, 4.5),  e);
        lookT.lerpVectors(new THREE.Vector3(0, 0.8, -2.5), new THREE.Vector3(0, 1.2, -6.5), e);
      } else if (t < 6.8) {
        const e = THREE.MathUtils.smoothstep((t - 5.2) / 1.6, 0, 1);
        const followPos = new THREE.Vector3(
          pp.x + Math.sin(cameraYawRef.current) * CAMERA_DIST,
          pp.y + CAMERA_HEIGHT,
          pp.z + Math.cos(cameraYawRef.current) * CAMERA_DIST
        );
        camP.lerpVectors( new THREE.Vector3(0, 2.4, 4.5), followPos, e);
        lookT.lerpVectors(new THREE.Vector3(0, 1.2, -6.5), new THREE.Vector3(pp.x, pp.y + 1.2, pp.z), e);
      } else {
        isIntroRef.current = false;
        smoothYawRef.current = cameraYawRef.current;
        smoothPitchRef.current = pitchRef.current;
        if (onIntroComplete) onIntroComplete();
        return;
      }
      camera.position.copy(camP);
      camera.lookAt(lookT);

    } else {
      // Smoothly lerp camera angle targets for buttery mouse-look (frame-rate independent)
      const angleDecay = 1.0 - Math.exp(-5.2 * delta);
      smoothYawRef.current = THREE.MathUtils.lerp(smoothYawRef.current, cameraYawRef.current, angleDecay);
      smoothPitchRef.current = THREE.MathUtils.lerp(smoothPitchRef.current, pitchRef.current, angleDecay);

      const yaw   = smoothYawRef.current;
      const pitch = smoothPitchRef.current;

      const tx = pp.x + Math.sin(yaw) * CAMERA_DIST;
      const ty = pp.y + CAMERA_HEIGHT + Math.sin(pitch) * CAMERA_DIST * 0.55;
      const tz = pp.z + Math.cos(yaw) * CAMERA_DIST;

      camPos.current.set(tx, ty, tz);
      camera.position.lerp(camPos.current, 1.0 - Math.exp(-6.56 * delta));

      lookPos.current.set(pp.x, pp.y + 1.25, pp.z);
      camera.lookAt(lookPos.current);
    }
  });

  return null;
}
