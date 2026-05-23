import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, useFBX, useAnimations } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import audioSystem from '../utils/audio.js';
import ErrorBoundary from './ErrorBoundary';

// ------------------------------------------------------------------
// 1. CUSTOM FBX CHARACTER LOADER
// ------------------------------------------------------------------
function FBXCharacter({ onPositionChange, teleportTarget, clearTeleport }) {
  const rigidBodyRef = useRef();
  const groupRef = useRef();

  // Load FBX animation files
  const fbxIdle = useFBX('/models/Idle.fbx');
  const fbxWalk = useFBX('/models/Walking.fbx');
  const fbxRun = useFBX('/models/Run.fbx');

  // Clone base idle mesh
  const characterGroup = useMemo(() => fbxIdle.clone(), [fbxIdle]);

  // Extract and rename animation clips
  const clips = useMemo(() => {
    const idleClip = fbxIdle.animations[0];
    const walkClip = fbxWalk.animations[0];
    const runClip = fbxRun.animations[0];

    if (idleClip) idleClip.name = 'idle';
    if (walkClip) walkClip.name = 'walk';
    if (runClip) runClip.name = 'run';

    return [idleClip, walkClip, runClip].filter(Boolean);
  }, [fbxIdle, fbxWalk, fbxRun]);

  const { actions } = useAnimations(clips, groupRef);
  const [, getKeys] = useKeyboardControls();
  const lastFootstepTimeRef = useRef(0);
  const currentActionRef = useRef('idle');

  // Movement settings
  const SPEED_WALK = 4.0;
  const SPEED_RUN = 7.0;
  const JUMP_FORCE = 5.5;

  useEffect(() => {
    if (actions['idle']) {
      actions['idle'].reset().play();
    }
  }, [actions]);

  useEffect(() => {
    characterGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [characterGroup]);

  // Teleportation handler
  useEffect(() => {
    if (teleportTarget && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(teleportTarget, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (clearTeleport) clearTeleport();
    }
  }, [teleportTarget, clearTeleport]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !groupRef.current) return;

    const keys = getKeys();
    const { forward, backward, left, right, jump, shift } = keys;
    const velocity = rigidBodyRef.current.linvel();
    const position = rigidBodyRef.current.translation();

    if (onPositionChange) onPositionChange(position);

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

    if (jump && Math.abs(velocity.y) < 0.1) {
      rigidBodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
    }

    if (isMoving && Math.abs(velocity.y) < 0.15) {
      const stepInterval = shift ? 0.28 : 0.42;
      if (state.clock.getElapsedTime() - lastFootstepTimeRef.current > stepInterval) {
        audioSystem.playFootstep(shift);
        lastFootstepTimeRef.current = state.clock.getElapsedTime();
      }
    }

    if (isMoving) {
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      const currentRotation = groupRef.current.rotation.y;
      let diff = angle - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * 0.18;
    }

    const activeAction = isMoving ? (shift ? 'run' : 'walk') : 'idle';
    if (actions[activeAction] && currentActionRef.current !== activeAction) {
      const prevAction = actions[currentActionRef.current];
      const nextAction = actions[activeAction];

      if (prevAction) prevAction.fadeOut(0.25);
      nextAction.reset().fadeIn(0.25).play();
      currentActionRef.current = activeAction;
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
      <CapsuleCollider args={[0.5, 0.35]} position={[0, 0.85, 0]} />
      <group ref={groupRef} scale={[0.01, 0.01, 0.01]}>
        <primitive object={characterGroup} />
      </group>
    </RigidBody>
  );
}

// ------------------------------------------------------------------
// 2. PROCEDURAL COZY FALLBACK CHARACTER
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

  const SPEED_WALK = 4.0;
  const SPEED_RUN = 7.0;
  const JUMP_FORCE = 5.5;

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

    if (onPositionChange) onPositionChange(position);

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

    if (jump && Math.abs(velocity.y) < 0.1) {
      rigidBodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
    }

    if (isMoving && Math.abs(velocity.y) < 0.15) {
      const stepInterval = shift ? 0.28 : 0.42;
      if (state.clock.getElapsedTime() - lastFootstepTimeRef.current > stepInterval) {
        audioSystem.playFootstep(shift);
        lastFootstepTimeRef.current = state.clock.getElapsedTime();
      }
    }

    if (isMoving) {
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      const currentRotation = characterRef.current.rotation.y;
      let diff = angle - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      characterRef.current.rotation.y += diff * 0.18;
    }

    // Kinematics limb swings
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
      <CapsuleCollider args={[0.5, 0.35]} position={[0, 0.85, 0]} />
      <group ref={characterRef}>
        <group ref={bodyGroupRef} position={[0, 0, 0]}>
          {/* Torso */}
          <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
            <boxGeometry args={[0.6, 0.7, 0.4]} />
            <meshStandardMaterial color="#3a86c8" roughness={0.7} />
          </mesh>
          {/* Backpack */}
          <mesh castShadow position={[0, 0.85, -0.28]}>
            <boxGeometry args={[0.4, 0.55, 0.2]} />
            <meshStandardMaterial color="#e76f51" />
          </mesh>
          {/* Head */}
          <mesh castShadow position={[0, 1.32, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#fcd5a1" />
          </mesh>
          {/* Beanie Cap */}
          <mesh castShadow position={[0, 1.44, 0]}>
            <coneGeometry args={[0.24, 0.18, 8]} />
            <meshStandardMaterial color="#e76f51" />
          </mesh>
          {/* Left Arm */}
          <group ref={leftArmRef} position={[-0.38, 1.0, 0]}>
            <mesh castShadow position={[0, -0.2, 0]}>
              <boxGeometry args={[0.12, 0.4, 0.12]} />
              <meshStandardMaterial color="#3a86c8" />
            </mesh>
          </group>
          {/* Right Arm */}
          <group ref={rightArmRef} position={[0.38, 1.0, 0]}>
            <mesh castShadow position={[0, -0.2, 0]}>
              <boxGeometry args={[0.12, 0.4, 0.12]} />
              <meshStandardMaterial color="#3a86c8" />
            </mesh>
          </group>
        </group>
        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.18, 0.35, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
            <meshStandardMaterial color="#264653" />
          </mesh>
        </group>
        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.18, 0.35, 0]}>
          <mesh castShadow position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
            <meshStandardMaterial color="#264653" />
          </mesh>
        </group>
      </group>
    </RigidBody>
  );
}

// ------------------------------------------------------------------
// 3. MAIN EXPORT WRAPPER WITH ERROR BOUNDARY FALLBACK
// ------------------------------------------------------------------
export default function Character(props) {
  return (
    <ErrorBoundary fallback={<ProceduralCharacter {...props} />}>
      <FBXCharacter {...props} />
    </ErrorBoundary>
  );
}
