import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import audioSystem from '../utils/audio.js';

// ------------------------------------------------------------------
// PROCEDURAL COZY TREKKER CHARACTER
// ------------------------------------------------------------------
function ProceduralCharacter({ onPositionChange, teleportTarget, clearTeleport }) {
  const rigidBodyRef = useRef();
  const characterRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const bodyGroupRef = useRef();

  const [, getKeys] = useKeyboardControls();
  const lastFootstepTimeRef = useRef(0);

  // Balanced movement parameters
  const SPEED_WALK = 4.0;
  const SPEED_RUN = 7.0;
  const JUMP_FORCE = 5.8;

  // Handles smooth teleportation to various trail checkpoints
  useEffect(() => {
    if (teleportTarget && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(teleportTarget, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (clearTeleport) clearTeleport();
    }
  }, [teleportTarget, clearTeleport]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !characterRef.current) return;

    const keys = getKeys();
    const { forward, backward, left, right, jump, shift } = keys;
    const velocity = rigidBodyRef.current.linvel();
    const position = rigidBodyRef.current.translation();

    // Notify Camera of updated coordinates
    if (onPositionChange) onPositionChange(position);

    // Vector calculations matching Camera rotation yaw
    const camera = state.camera;
    const frontVector = new THREE.Vector3(0, 0, 0);
    const sideVector = new THREE.Vector3(0, 0, 0);

    if (forward) frontVector.set(0, 0, -1);
    if (backward) frontVector.set(0, 0, 1);
    if (left) sideVector.set(-1, 0, 0);
    if (right) sideVector.set(1, 0, 0);

    const camEuler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    const moveDirection = new THREE.Vector3()
      .addVectors(frontVector, sideVector)
      .normalize()
      .applyEuler(camEuler);

    const isMoving = forward || backward || left || right;
    const speed = shift ? SPEED_RUN : SPEED_WALK;

    const targetVelocityX = moveDirection.x * speed;
    const targetVelocityZ = moveDirection.z * speed;

    const lerpFactor = isMoving ? 0.25 : 0.28;
    rigidBodyRef.current.setLinvel({
      x: THREE.MathUtils.lerp(velocity.x, targetVelocityX, lerpFactor),
      y: velocity.y,
      z: THREE.MathUtils.lerp(velocity.z, targetVelocityZ, lerpFactor)
    }, true);

    // Jump logic (rigid body vertical force)
    if (jump && Math.abs(velocity.y) < 0.1) {
      rigidBodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
    }

    // Walking footsteps sound generator (triggers procedural rustling steps)
    if (isMoving && Math.abs(velocity.y) < 0.15) {
      const stepInterval = shift ? 0.28 : 0.42;
      if (state.clock.getElapsedTime() - lastFootstepTimeRef.current > stepInterval) {
        audioSystem.playFootstep(shift);
        lastFootstepTimeRef.current = state.clock.getElapsedTime();
      }
    }

    // Rotate character mesh dynamically to point towards direction of movement
    if (isMoving) {
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      const currentRotation = characterRef.current.rotation.y;
      let diff = angle - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      characterRef.current.rotation.y += diff * 0.18;
    }

    // Kinematics swing animations for legs, arms, and trekking poles
    const time = state.clock.getElapsedTime();
    if (isMoving) {
      const cycleSpeed = shift ? 14 : 9;
      const angleAmount = shift ? 0.6 : 0.4;
      const bobAmount = shift ? 0.08 : 0.04;

      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * cycleSpeed) * angleAmount;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(time * cycleSpeed) * angleAmount;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.sin(time * cycleSpeed) * angleAmount * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time * cycleSpeed) * angleAmount * 0.8;
      
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = Math.abs(Math.sin(time * cycleSpeed * 2)) * bobAmount;
      }
    } else {
      // Return smoothly to idle positions
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.15);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.15);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.15);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.15);
      
      if (bodyGroupRef.current) {
        bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, Math.sin(time * 2) * 0.015, 0.1);
      }
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[0, 1.5, 0]}
      friction={1}
      type="dynamic"
    >
      {/* Character Physics Collider */}
      <CapsuleCollider args={[0.5, 0.35]} position={[0, 0.85, 0]} />
      
      <group ref={characterRef}>
        <group ref={bodyGroupRef} position={[0, 0, 0]}>
          
          {/* Torso (Jacket) */}
          <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
            <boxGeometry args={[0.6, 0.7, 0.4]} />
            <meshStandardMaterial color="#0284c7" roughness={0.7} flatShading /> {/* Bright Sky Blue Jacket */}
          </mesh>
          
          {/* Backpack (Explorer Gear) */}
          <mesh castShadow position={[0, 0.85, -0.28]}>
            <boxGeometry args={[0.42, 0.55, 0.2]} />
            <meshStandardMaterial color="#b45309" roughness={0.8} flatShading /> {/* Leather Brown Backpack */}
          </mesh>
          {/* Sleeping Roll tied below backpack */}
          <mesh castShadow position={[0, 0.52, -0.28]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 0.48, 8]} />
            <meshStandardMaterial color="#ea580c" roughness={0.7} />
          </mesh>

          {/* Head */}
          <mesh castShadow position={[0, 1.32, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#fcd5a1" roughness={0.6} />
          </mesh>

          {/* Black Eyes */}
          <mesh position={[-0.07, 1.34, 0.19]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[0.07, 1.34, 0.19]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#000000" />
          </mesh>

          {/* Cozy Beanie Cap */}
          <mesh castShadow position={[0, 1.44, 0]}>
            <coneGeometry args={[0.24, 0.18, 8]} />
            <meshStandardMaterial color="#f97316" roughness={0.7} flatShading />
          </mesh>
          <mesh castShadow position={[0, 1.54, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>

          {/* Cozy Red Scarf */}
          <mesh position={[0, 1.13, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.08, 12]} />
            <meshStandardMaterial color="#dc2626" roughness={0.8} />
          </mesh>
          {/* Scarf flap */}
          <mesh position={[0.08, 1.0, 0.2]} rotation={[0.4, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.25, 0.03]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>

          {/* Left Arm & Left Trekking Pole (Pole swings naturally with the arm) */}
          <group ref={leftArmRef} position={[-0.38, 1.0, 0]}>
            <mesh castShadow position={[0, -0.2, 0]}>
              <boxGeometry args={[0.12, 0.4, 0.12]} />
              <meshStandardMaterial color="#0284c7" roughness={0.7} />
            </mesh>
            {/* Left Trekking Pole */}
            <group position={[0, -0.38, 0.06]} rotation={[0.15, 0, 0]}>
              {/* Pole shaft */}
              <mesh castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.85, 5]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.7} />
              </mesh>
              {/* Handle */}
              <mesh castShadow position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.12, 5]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
              {/* Ring / Basket */}
              <mesh position={[0, -0.38, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.015, 6]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            </group>
          </group>

          {/* Right Arm & Right Trekking Pole */}
          <group ref={rightArmRef} position={[0.38, 1.0, 0]}>
            <mesh castShadow position={[0, -0.2, 0]}>
              <boxGeometry args={[0.12, 0.4, 0.12]} />
              <meshStandardMaterial color="#0284c7" roughness={0.7} />
            </mesh>
            {/* Right Trekking Pole */}
            <group position={[0, -0.38, 0.06]} rotation={[0.15, 0, 0]}>
              {/* Pole shaft */}
              <mesh castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.85, 5]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.7} />
              </mesh>
              {/* Handle */}
              <mesh castShadow position={[0, 0.38, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.12, 5]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
              {/* Ring / Basket */}
              <mesh position={[0, -0.38, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.015, 6]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            </group>
          </group>

        </group>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.18, 0.35, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.4, 8]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
          </mesh>
          {/* Left Boot */}
          <mesh castShadow position={[0, -0.42, 0.05]}>
            <boxGeometry args={[0.11, 0.08, 0.18]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.18, 0.35, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.4, 8]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.8} />
          </mesh>
          {/* Right Boot */}
          <mesh castShadow position={[0, -0.42, 0.05]}>
            <boxGeometry args={[0.11, 0.08, 0.18]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        </group>

      </group>
    </RigidBody>
  );
}

export default function Character(props) {
  return <ProceduralCharacter {...props} />;
}
