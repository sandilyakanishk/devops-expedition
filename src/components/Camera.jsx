import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Camera({ playerPosRef }) {
  const customCameraRef = useRef();

  // Mouse tracking for parallax sway
  const mouse = useRef({ x: 0, y: 0 });

  // Add mousemove listener on component mount
  React.useEffect(() => {
    const handleMouseMove = (event) => {
      // Normalize mouse coordinates between -1 and 1
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!playerPosRef.current) return;

    const playerPos = playerPosRef.current;
    const camera = state.camera;

    // Target camera position: Behind (z + 8.5) and above (y + 4.5) the player
    // Apply mouse sway for dynamic parallax
    const targetX = playerPos.x + mouse.current.x * 2.2;
    const targetY = playerPos.y + 4.8 + mouse.current.y * 1.2;
    const targetZ = playerPos.z + 8.5;

    // Smoothly lerp camera position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);

    // Target focus: Look slightly above the player's feet (about head level)
    const targetLookAt = new THREE.Vector3(
      playerPos.x,
      playerPos.y + 1.2,
      playerPos.z
    );

    // Smoothly update camera's lookAt
    // Creating a dummy object to lerp looking direction
    const currentLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    const lerpedLookAt = new THREE.Vector3().lerpVectors(currentLookAt, targetLookAt, 0.1);
    camera.lookAt(lerpedLookAt);
  });

  return null; // This component manages the existing canvas camera directly
}
