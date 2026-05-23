import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Camera({ playerPosRef, onIntroComplete }) {
  const introTimeRef = useRef(0);
  const isIntroPlayingRef = useRef(true);
  const mouse = useRef({ x: 0, y: 0 });

  // Track mouse movements for parallax sway during gameplay
  useEffect(() => {
    const handleMouseMove = (event) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!playerPosRef.current) return;

    const camera = state.camera;
    const playerPos = playerPosRef.current;

    // 1. Cinematic Opening Camera Path
    if (isIntroPlayingRef.current) {
      introTimeRef.current += delta;
      const t = introTimeRef.current;

      let camPos = new THREE.Vector3();
      let lookTarget = new THREE.Vector3();

      if (t < 1.8) {
        // Step 1: Sky & Snow Peaks
        // Interpolate from [8, 16, 22] looking at [0, 15, -120] to [-6, 6.5, 9] looking at [-5, 2.2, -5] (Cabin)
        const alpha = t / 1.8;
        const ease = THREE.MathUtils.smoothstep(alpha, 0, 1);
        
        camPos.lerpVectors(new THREE.Vector3(8, 16, 22), new THREE.Vector3(-6, 6.5, 9), ease);
        lookTarget.lerpVectors(new THREE.Vector3(0, 15, -120), new THREE.Vector3(-5, 2.2, -5), ease);
      } 
      else if (t < 3.6) {
        // Step 2: Cozy Log Cabin
        // Interpolate from cabin focus to campfire and traveller focus [3.5, 2.8, 3.5] looking at [0, 0.8, -2.5]
        const alpha = (t - 1.8) / 1.8;
        const ease = THREE.MathUtils.smoothstep(alpha, 0, 1);
        
        camPos.lerpVectors(new THREE.Vector3(-6, 6.5, 9), new THREE.Vector3(3.5, 2.8, 3.5), ease);
        lookTarget.lerpVectors(new THREE.Vector3(-5, 2.2, -5), new THREE.Vector3(0, 0.8, -2.5), ease);
      } 
      else if (t < 5.2) {
        // Step 3: Campfire & Start Gate Focus
        // Interpolate from campfire to gate entrance focus [0, 2.5, 4.5] looking at [0, 1.2, -6.5]
        const alpha = (t - 3.6) / 1.6;
        const ease = THREE.MathUtils.smoothstep(alpha, 0, 1);
        
        camPos.lerpVectors(new THREE.Vector3(3.5, 2.8, 3.5), new THREE.Vector3(0, 2.4, 4.5), ease);
        lookTarget.lerpVectors(new THREE.Vector3(0, 0.8, -2.5), new THREE.Vector3(0, 1.2, -6.5), ease);
      } 
      else if (t < 6.8) {
        // Step 4: Blend to third person follow behind character
        const alpha = (t - 5.2) / 1.6;
        const ease = THREE.MathUtils.smoothstep(alpha, 0, 1);

        const targetFollowPos = new THREE.Vector3(
          playerPos.x,
          playerPos.y + 4.2,
          playerPos.z + 8.5
        );
        const targetLookAt = new THREE.Vector3(
          playerPos.x,
          playerPos.y + 1.2,
          playerPos.z
        );

        camPos.lerpVectors(new THREE.Vector3(0, 2.4, 4.5), targetFollowPos, ease);
        lookTarget.lerpVectors(new THREE.Vector3(0, 1.2, -6.5), targetLookAt, ease);
      } 
      else {
        // Cinematic complete! Hand over control to gameplay camera
        isIntroPlayingRef.current = false;
        if (onIntroComplete) {
          onIntroComplete();
        }
      }

      // Apply coordinates computed during intro path
      camera.position.copy(camPos);
      camera.lookAt(lookTarget);
    } 
    // 2. Gameplay Third-Person Follow Camera with Mouse Parallax Sway
    else {
      const targetX = playerPos.x + mouse.current.x * 2.4;
      const targetY = playerPos.y + 4.5 + mouse.current.y * 1.0;
      const targetZ = playerPos.z + 8.5;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);

      const targetLookAt = new THREE.Vector3(
        playerPos.x,
        playerPos.y + 1.2,
        playerPos.z
      );

      // Smooth look-at calculation
      const currentLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
      const lerpedLookAt = new THREE.Vector3().lerpVectors(currentLookAt, targetLookAt, 0.12);
      camera.lookAt(lerpedLookAt);
    }
  });

  return null;
}
