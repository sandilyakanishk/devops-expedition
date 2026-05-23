import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, useFBX, useAnimations } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import audioSystem from '../utils/audio.js';

export default function Character({ onPositionChange, teleportTarget, clearTeleport }) {
  const rigidBodyRef = useRef();
  const groupRef = useRef();
  
  // 1. Load FBX animation files
  const fbxIdle = useFBX('/models/Idle.fbx');
  const fbxWalk = useFBX('/models/Walking.fbx');
  const fbxRun = useFBX('/models/Run.fbx');

  // 2. Clone the idle mesh so we have a clean independent copy of the character
  const characterGroup = useMemo(() => fbxIdle.clone(), [fbxIdle]);

  // 3. Extract and rename animation clips for the animator mixer
  const clips = useMemo(() => {
    const idleClip = fbxIdle.animations[0];
    const walkClip = fbxWalk.animations[0];
    const runClip = fbxRun.animations[0];

    if (idleClip) idleClip.name = 'idle';
    if (walkClip) walkClip.name = 'walk';
    if (runClip) runClip.name = 'run';

    return [idleClip, walkClip, runClip].filter(Boolean);
  }, [fbxIdle, fbxWalk, fbxRun]);

  // 4. Setup animation actions
  const { actions } = useAnimations(clips, groupRef);

  const [, getKeys] = useKeyboardControls();
  const lastFootstepTimeRef = useRef(0);
  const currentActionRef = useRef('idle');

  // Movement settings
  const SPEED_WALK = 4.0;
  const SPEED_RUN = 7.0;
  const JUMP_FORCE = 5.5;

  // Set initial playing state
  useEffect(() => {
    if (actions['idle']) {
      actions['idle'].reset().play();
    }
  }, [actions]);

  // Enable shadow casting/receiving on the character meshes
  useEffect(() => {
    characterGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [characterGroup]);

  // Handle teleportation from HUD menu clicks
  useEffect(() => {
    if (teleportTarget && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(teleportTarget, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (clearTeleport) {
        clearTeleport();
      }
    }
  }, [teleportTarget, clearTeleport]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !groupRef.current) return;

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
    const lerpFactor = isMoving ? 0.25 : 0.28;
    rigidBodyRef.current.setLinvel({
      x: THREE.MathUtils.lerp(velocity.x, targetVelocityX, lerpFactor),
      y: velocity.y, // Maintain gravity
      z: THREE.MathUtils.lerp(velocity.z, targetVelocityZ, lerpFactor)
    }, true);

    // Apply Jump
    if (jump && Math.abs(velocity.y) < 0.1) {
      rigidBodyRef.current.setLinvel({
        x: velocity.x,
        y: JUMP_FORCE,
        z: velocity.z
      }, true);
    }

    // Play footstep sounds periodically
    if (isMoving && Math.abs(velocity.y) < 0.15) {
      const stepInterval = shift ? 0.28 : 0.42;
      if (state.clock.getElapsedTime() - lastFootstepTimeRef.current > stepInterval) {
        audioSystem.playFootstep(shift);
        lastFootstepTimeRef.current = state.clock.getElapsedTime();
      }
    }

    // Rotate character to face movement direction
    if (isMoving) {
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      // Smoothly interpolate rotation y of group
      const currentRotation = groupRef.current.rotation.y;
      let diff = angle - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      
      groupRef.current.rotation.y += diff * 0.18;
    }

    // Cross-fade Animations
    const activeAction = isMoving ? (shift ? 'run' : 'walk') : 'idle';
    if (actions[activeAction] && currentActionRef.current !== activeAction) {
      const prevAction = actions[currentActionRef.current];
      const nextAction = actions[activeAction];

      if (prevAction) {
        prevAction.fadeOut(0.25);
      }
      nextAction.reset().fadeIn(0.25).play();
      currentActionRef.current = activeAction;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      enabledRotations={[false, false, false]} // Keep character upright
      position={[0, 1.2, 0]}
      friction={1}
      type="dynamic"
    >
      {/* Dynamic Collider */}
      <CapsuleCollider args={[0.5, 0.35]} position={[0, 0.85, 0]} />
      
      {/* FBX Visual Model Group */}
      {/* Standard Mixamo scale is 0.01 since units are in cm */}
      <group ref={groupRef} scale={[0.01, 0.01, 0.01]} position={[0, 0, 0]}>
        <primitive object={characterGroup} />
      </group>
    </RigidBody>
  );
}
