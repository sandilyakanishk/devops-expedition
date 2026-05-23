import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import audioSystem from '../utils/audio.js';

export default function Character({ onPositionChange }) {
  const rigidBodyRef = useRef();
  const characterRef = useRef();
  
  // Limbs for animation
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const backpackRef = useRef();
  const bodyGroupRef = useRef();

  const [, getKeys] = useKeyboardControls();
  const lastFootstepTimeRef = useRef(0);
  
  // Movement settings
  const SPEED_WALK = 5;
  const SPEED_RUN = 8.5;
  const JUMP_FORCE = 6;

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !characterRef.current) return;

    // Get active keys
    const keys = getKeys();
    const { forward, backward, left, right, jump, shift } = keys;

    // Get current velocity and position from physics
    const velocity = rigidBodyRef.current.linvel();
    const position = rigidBodyRef.current.translation();

    // Call callback for camera / UI tracking
    if (onPositionChange) {
      onPositionChange(position);
    }

    // Determine movement direction relative to camera
    const camera = state.camera;
    const frontVector = new THREE.Vector3(0, 0, 0);
    const sideVector = new THREE.Vector3(0, 0, 0);

    if (forward) frontVector.set(0, 0, -1);
    if (backward) frontVector.set(0, 0, 1);
    if (left) sideVector.set(-1, 0, 0);
    if (right) sideVector.set(1, 0, 0);

    // Get horizontal direction of camera
    const camEuler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    const moveDirection = new THREE.Vector3()
      .addVectors(frontVector, sideVector)
      .normalize()
      .applyEuler(camEuler);

    const isMoving = forward || backward || left || right;
    const speed = shift ? SPEED_RUN : SPEED_WALK;

    // Apply linear velocity
    const targetVelocityX = moveDirection.x * speed;
    const targetVelocityZ = moveDirection.z * speed;

    // Lerp velocity for smooth acceleration/deceleration
    const lerpFactor = isMoving ? 0.2 : 0.25;
    rigidBodyRef.current.setLinvel({
      x: THREE.MathUtils.lerp(velocity.x, targetVelocityX, lerpFactor),
      y: velocity.y, // Maintain gravity
      z: THREE.MathUtils.lerp(velocity.z, targetVelocityZ, lerpFactor)
    }, true);

    // Apply Jump
    // To prevent infinite jumping, only jump if we are close to the ground (velocity.y close to 0)
    if (jump && Math.abs(velocity.y) < 0.1) {
      rigidBodyRef.current.setLinvel({
        x: velocity.x,
        y: JUMP_FORCE,
        z: velocity.z
      }, true);
    }

    // Play footstep sounds
    if (isMoving && Math.abs(velocity.y) < 0.15) {
      const stepInterval = shift ? 0.25 : 0.38;
      if (state.clock.getElapsedTime() - lastFootstepTimeRef.current > stepInterval) {
        audioSystem.playFootstep(shift);
        lastFootstepTimeRef.current = state.clock.getElapsedTime();
      }
    }

    // Rotate character to face movement direction
    if (isMoving) {
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      // Smoothly interpolate rotation y
      const currentRotation = characterRef.current.rotation.y;
      // Handle wrapping angle for smooth rotation
      let diff = angle - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      characterRef.current.rotation.y += diff * 0.15;
    }

    // Procedural Animations
    const time = state.clock.getElapsedTime();
    if (isMoving) {
      const cycleSpeed = shift ? 14 : 9;
      const angleAmount = shift ? 0.6 : 0.4;
      const bobAmount = shift ? 0.08 : 0.04;

      // Leg swing (opposition)
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * cycleSpeed) * angleAmount;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(time * cycleSpeed) * angleAmount;

      // Arm swing (opposes leg swing)
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -Math.sin(time * cycleSpeed) * angleAmount * 0.8;
        // Make trekking pole swing naturally
        leftArmRef.current.rotation.z = Math.sin(time * 0.5) * 0.05 - 0.1;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(time * cycleSpeed) * angleAmount * 0.8;
        rightArmRef.current.rotation.z = -Math.sin(time * 0.5) * 0.05 + 0.1;
      }

      // Body bobbing up and down
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = Math.abs(Math.sin(time * cycleSpeed * 2)) * bobAmount;
        // Side sway
        bodyGroupRef.current.rotation.z = Math.sin(time * cycleSpeed) * 0.02;
        bodyGroupRef.current.rotation.y = Math.sin(time * cycleSpeed) * 0.05;
      }
    } else {
      // Return limbs to idle positions smoothly
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.15);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.15);
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.15);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.05, 0.15);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.15);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.05, 0.15);
      }
      if (bodyGroupRef.current) {
        // Idle breathing effect
        bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, Math.sin(time * 2) * 0.015, 0.1);
        bodyGroupRef.current.rotation.z = THREE.MathUtils.lerp(bodyGroupRef.current.rotation.z, 0, 0.15);
        bodyGroupRef.current.rotation.y = THREE.MathUtils.lerp(bodyGroupRef.current.rotation.y, 0, 0.15);
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      enabledRotations={[false, false, false]} // Keep character upright
      position={[0, 2, 0]}
      friction={1}
      type="dynamic"
    >
      <CapsuleCollider args={[0.5, 0.4]} />
      
      {/* 3D Visual Group */}
      <group ref={characterRef}>
        <group ref={bodyGroupRef} position={[0, -0.3, 0]}>
          
          {/* Torso (Jacket) */}
          <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
            <boxGeometry args={[0.6, 0.7, 0.4]} />
            <meshStandardMaterial color="#e0533c" roughness={0.7} /> {/* Bright Orange Trekking Jacket */}
          </mesh>

          {/* Backpack */}
          <mesh ref={backpackRef} castShadow position={[0, 0.85, -0.3]}>
            <boxGeometry args={[0.45, 0.6, 0.25]} />
            <meshStandardMaterial color="#2d5a27" roughness={0.8} /> {/* Forest Green Backpack */}
            
            {/* Backpack bedroll at top */}
            <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
              <meshStandardMaterial color="#8e44ad" />
            </mesh>
          </mesh>

          {/* Head */}
          <mesh castShadow position={[0, 1.35, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#ffdbac" roughness={0.6} /> {/* Skin Tone */}
          </mesh>

          {/* Trekking Beanie/Cap */}
          <mesh castShadow position={[0, 1.48, 0]}>
            <coneGeometry args={[0.24, 0.2, 8]} />
            <meshStandardMaterial color="#1a2e40" /> {/* Dark Blue Cap */}
          </mesh>

          {/* Left Arm & Trekking Stick */}
          <group ref={leftArmRef} position={[-0.4, 1.0, 0]}>
            <mesh castShadow position={[0, -0.2, 0]}>
              <boxGeometry args={[0.15, 0.45, 0.15]} />
              <meshStandardMaterial color="#e0533c" />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.45, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color="#ffdbac" />
            </mesh>
            {/* Trekking Pole */}
            <group position={[0, -0.4, 0.1]} rotation={[0.1, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.02, 0.02, 1.1, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Pole Grip */}
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
                <meshStandardMaterial color="#2c3e50" />
              </mesh>
              {/* Pole Basket */}
              <mesh position={[0, -0.45, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.02, 8]} />
                <meshStandardMaterial color="#2c3e50" />
              </mesh>
            </group>
          </group>

          {/* Right Arm & Trekking Stick */}
          <group ref={rightArmRef} position={[0.4, 1.0, 0]}>
            <mesh castShadow position={[0, -0.2, 0]}>
              <boxGeometry args={[0.15, 0.45, 0.15]} />
              <meshStandardMaterial color="#e0533c" />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.45, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color="#ffdbac" />
            </mesh>
            {/* Trekking Pole */}
            <group position={[0, -0.4, 0.1]} rotation={[0.1, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.02, 0.02, 1.1, 8]} />
                <meshStandardMaterial color="#7f8c8d" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Pole Grip */}
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.15, 8]} />
                <meshStandardMaterial color="#2c3e50" />
              </mesh>
              {/* Pole Basket */}
              <mesh position={[0, -0.45, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.02, 8]} />
                <meshStandardMaterial color="#2c3e50" />
              </mesh>
            </group>
          </group>

          {/* Headlamp light cone */}
          <spotLight
            position={[0, 1.35, 0.25]}
            angle={Math.PI / 6}
            penumbra={0.5}
            intensity={1.5}
            color="#fff3d1"
            distance={15}
            castShadow
          />
        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.2, 0.2, 0]}>
          <mesh castShadow position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.5, 8]} />
            <meshStandardMaterial color="#2c3e50" /> {/* Dark hiking trousers */}
          </mesh>
          {/* Hiking Boot */}
          <mesh castShadow position={[0, -0.55, 0.08]}>
            <boxGeometry args={[0.14, 0.12, 0.26]} />
            <meshStandardMaterial color="#5c4033" /> {/* Brown leather boot */}
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.2, 0.2, 0]}>
          <mesh castShadow position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.5, 8]} />
            <meshStandardMaterial color="#2c3e50" />
          </mesh>
          {/* Hiking Boot */}
          <mesh castShadow position={[0, -0.55, 0.08]}>
            <boxGeometry args={[0.14, 0.12, 0.26]} />
            <meshStandardMaterial color="#5c4033" />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
}
