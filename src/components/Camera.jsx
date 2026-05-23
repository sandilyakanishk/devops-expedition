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
const MOUSE_SENS    =  0.0010; // radians per pixel (slowed down for smooth look)

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
  
  // Mouse tracking state (no click-drag required)
  const lastMouseRef  = useRef({ x: 0, y: 0 });
  const hasInitializedMouseRef = useRef(false);
  const smoothYawRef  = useRef(0);
  const smoothPitchRef = useRef(0.28);

  // ── Mouse listeners — movement-only rotation + optional pointer lock ──
  useEffect(() => {
    const handleCanvasClick = () => {
      if (!isIntroRef.current) {
        gl.domElement.requestPointerLock?.();
      }
    };

    const onMouseMove = (e) => {
      if (isIntroRef.current) return;

      let dx = 0;
      let dy = 0;

      if (document.pointerLockElement === gl.domElement) {
        dx = e.movementX;
        dy = e.movementY;
      } else {
        if (!hasInitializedMouseRef.current) {
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
          hasInitializedMouseRef.current = true;
          return;
        }
        dx = e.clientX - lastMouseRef.current.x;
        dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }

      cameraYawRef.current += dx * MOUSE_SENS;
      pitchRef.current = THREE.MathUtils.clamp(
        pitchRef.current - dy * MOUSE_SENS,
        MIN_PITCH,
        MAX_PITCH
      );
    };

    const onMouseLeave = () => {
      hasInitializedMouseRef.current = false;
    };

    const onPointerLockChange = () => {
      hasInitializedMouseRef.current = false;
    };

    gl.domElement.addEventListener('click', handleCanvasClick);
    window.addEventListener('mousemove',    onMouseMove);
    window.addEventListener('mouseleave',   onMouseLeave);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      if (gl?.domElement) {
        gl.domElement.removeEventListener('click', handleCanvasClick);
      }
      window.removeEventListener('mousemove',    onMouseMove);
      window.removeEventListener('mouseleave',   onMouseLeave);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [gl]);

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
