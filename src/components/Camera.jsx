// ================================================================
// Camera.jsx — Cinematic intro + Mouse-drag camera rotation
// NO pointer lock — cursor always visible, mouse drag rotates view
// ================================================================
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cameraYawRef, cameraPitchRef, characterRotationRef } from '../utils/cameraState';

const CAMERA_DIST   = 7.5;
const CAMERA_HEIGHT = 3.8;
const MIN_PITCH     = -0.08;
const MAX_PITCH     =  0.90;

export default function Camera({ playerPosRef, onIntroComplete, isCameraEnabled }) {
  const introTimeRef  = useRef(0);
  const isIntroRef    = useRef(false); // Skip fly-through intro to start behind the character
  const pitchRef      = cameraPitchRef;
  const camPos        = useRef(new THREE.Vector3());
  const lookPos       = useRef(new THREE.Vector3());
  const cameraDistRef = useRef(7.5);

  const { gl }        = useThree();

  useEffect(() => {
    if (!isIntroRef.current && onIntroComplete) {
      onIntroComplete();
    }
  }, [onIntroComplete]);
  
  // Touch tracking state
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const hasInitializedTouchRef = useRef(false);
  const smoothYawRef  = useRef(0);
  const smoothPitchRef = useRef(0.28);
  const lookTouchIdRef = useRef(null);

  useEffect(() => {
    const handleRecenter = () => {
      cameraYawRef.current = 0;
      pitchRef.current = 0.28;
      cameraDistRef.current = 7.5;
      smoothYawRef.current = 0;
      smoothPitchRef.current = 0.28;
    };
    window.addEventListener('recenter-camera-character', handleRecenter);
    return () => {
      window.removeEventListener('recenter-camera-character', handleRecenter);
    };
  }, [pitchRef]);

  // Mouse tracking state
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // ── Touch, Mouse and Wheel listeners ──
  useEffect(() => {
    const onTouchStart = (e) => {
      if (!isCameraEnabled) return;
      if (lookTouchIdRef.current === null && e.targetTouches.length > 0) {
        const touch = e.targetTouches[0];
        lookTouchIdRef.current = touch.identifier;
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
        hasInitializedTouchRef.current = true;
      }
    };

    const onTouchMove = (e) => {
      if (!isCameraEnabled) return;
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

    // Desktop Mouse Drag to Orbit
    let isMouseDown = false;
    const onMouseDown = (e) => {
      if (!isCameraEnabled) return;
      isMouseDown = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isCameraEnabled) return;
      if (isIntroRef.current) return;
      if (isMouseDown) {
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };

        const MOUSE_SENS = 0.005;
        cameraYawRef.current += dx * MOUSE_SENS;
        pitchRef.current = THREE.MathUtils.clamp(
          pitchRef.current - dy * MOUSE_SENS,
          MIN_PITCH,
          MAX_PITCH
        );
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    // Desktop Mouse Wheel to Zoom
    const onWheel = (e) => {
      if (!isCameraEnabled) return;
      const zoomSpeed = 0.008;
      cameraDistRef.current = THREE.MathUtils.clamp(
        cameraDistRef.current + e.deltaY * zoomSpeed,
        3.5,
        18.0
      );
    };

    gl.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    gl.domElement.addEventListener('touchmove',  onTouchMove,  { passive: true });
    gl.domElement.addEventListener('touchend',   onTouchEnd,   { passive: true });
    gl.domElement.addEventListener('touchcancel',onTouchEnd,   { passive: true });

    gl.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    gl.domElement.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      if (gl?.domElement) {
        gl.domElement.removeEventListener('touchstart', onTouchStart);
        gl.domElement.removeEventListener('touchmove',  onTouchMove);
        gl.domElement.removeEventListener('touchend',   onTouchEnd);
        gl.domElement.removeEventListener('touchcancel',onTouchEnd);

        gl.domElement.removeEventListener('mousedown', onMouseDown);
        gl.domElement.removeEventListener('wheel', onWheel);
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [gl, pitchRef, isCameraEnabled]);

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
      if (!isCameraEnabled) {
        // Smoothly lerp camera yaw, pitch, and zoom back to follow defaults
        cameraDistRef.current = THREE.MathUtils.lerp(cameraDistRef.current, 7.5, 1.0 - Math.exp(-4.0 * delta));
        pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, 0.28, 1.0 - Math.exp(-4.0 * delta));

        // Lock camera behind the character (smooth follow)
        if (characterRotationRef.current !== undefined) {
          let diff = characterRotationRef.current - cameraYawRef.current;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff >  Math.PI) diff -= Math.PI * 2;
          cameraYawRef.current += diff * (1.0 - Math.exp(-4.0 * delta));
        }
      }

      // Smoothly lerp camera angle targets for buttery mouse-look (frame-rate independent)
      const angleDecay = 1.0 - Math.exp(-5.2 * delta);
      smoothYawRef.current = THREE.MathUtils.lerp(smoothYawRef.current, cameraYawRef.current, angleDecay);
      smoothPitchRef.current = THREE.MathUtils.lerp(smoothPitchRef.current, pitchRef.current, angleDecay);

      const yaw   = smoothYawRef.current;
      const pitch = smoothPitchRef.current;
      const dist  = cameraDistRef.current;

      const tx = pp.x + Math.sin(yaw) * dist;
      const ty = pp.y + CAMERA_HEIGHT + Math.sin(pitch) * dist * 0.55;
      const tz = pp.z + Math.cos(yaw) * dist;

      camPos.current.set(tx, ty, tz);
      camera.position.lerp(camPos.current, 1.0 - Math.exp(-6.56 * delta));

      lookPos.current.set(pp.x, pp.y + 1.25, pp.z);
      camera.lookAt(lookPos.current);
    }
  });

  return null;
}
