import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import audioSystem from '../utils/audio.js';

// Colours
const SKIN   = '#c68642';
const HAIR   = '#1a1a2e';
const JACKET = '#1e40af';
const SHIRT  = '#bfdbfe';
const PANTS  = '#4a2c14';
const SHOE   = '#1e1b4b';
const PACK   = '#1f2937';
const ROLL   = '#16a34a';
const LAN    = '#374151';

export default function Character({ onPositionChange, teleportTarget, clearTeleport }) {
  const rigidBodyRef        = useRef();
  const characterRef        = useRef();
  const leftLegRef          = useRef();
  const rightLegRef         = useRef();
  const leftArmRef          = useRef();
  const rightArmRef         = useRef();
  const bodyBobRef          = useRef();
  const lanternSwingRef     = useRef();
  const lanternLightRef     = useRef();
  const lastFootstepRef     = useRef(0);

  const [, getKeys] = useKeyboardControls();

  const SPEED_WALK = 4.0;
  const SPEED_RUN  = 7.0;
  const JUMP_FORCE = 5.8;

  // Teleport handler
  useEffect(() => {
    if (teleportTarget && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(teleportTarget, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (clearTeleport) clearTeleport();
    }
  }, [teleportTarget, clearTeleport]);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !characterRef.current) return;

    const t = state.clock.getElapsedTime();

    // Lantern sway + flicker
    if (lanternSwingRef.current) lanternSwingRef.current.rotation.z = Math.sin(t * 2.2) * 0.12;
    if (lanternLightRef.current) lanternLightRef.current.intensity  = 1.8 + Math.sin(t * 17) * 0.3 + Math.random() * 0.12;

    const keys = getKeys();
    const { forward, backward, left, right, jump, shift } = keys;
    const velocity = rigidBodyRef.current.linvel();
    const position = rigidBodyRef.current.translation();
    if (onPositionChange) onPositionChange(position);

    // Movement direction
    const front = new THREE.Vector3(forward ? 0 : 0, 0, forward ? -1 : backward ? 1 : 0);
    const side  = new THREE.Vector3(left ? -1 : right ? 1 : 0, 0, 0);
    const camEuler = new THREE.Euler(0, state.camera.rotation.y, 0, 'YXZ');
    const moveDir = new THREE.Vector3().addVectors(front, side).normalize().applyEuler(camEuler);

    const isMoving = forward || backward || left || right;
    const speed = shift ? SPEED_RUN : SPEED_WALK;

    rigidBodyRef.current.setLinvel({
      x: THREE.MathUtils.lerp(velocity.x, moveDir.x * speed, isMoving ? 0.25 : 0.28),
      y: velocity.y,
      z: THREE.MathUtils.lerp(velocity.z, moveDir.z * speed, isMoving ? 0.25 : 0.28),
    }, true);

    if (jump && Math.abs(velocity.y) < 0.1) {
      rigidBodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
      audioSystem.playJump();
    }

    if (isMoving && Math.abs(velocity.y) < 0.15) {
      const interval = shift ? 0.28 : 0.42;
      if (t - lastFootstepRef.current > interval) {
        audioSystem.playFootstep(shift);
        lastFootstepRef.current = t;
      }
    }

    // Face direction of movement
    if (isMoving) {
      const angle = Math.atan2(moveDir.x, moveDir.z);
      let diff = angle - characterRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      characterRef.current.rotation.y += diff * 0.16;
    }

    // Limb animation
    if (isMoving) {
      const spd = shift ? 14 : 9;
      const amp = shift ? 0.55 : 0.38;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  =  Math.sin(t * spd) * amp;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * spd) * amp;
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = -Math.sin(t * spd) * amp * 0.7;
      if (rightArmRef.current) rightArmRef.current.rotation.x  =  Math.sin(t * spd) * amp * 0.7;
      if (bodyBobRef.current)  bodyBobRef.current.position.y   =  Math.abs(Math.sin(t * spd * 2)) * (shift ? 0.07 : 0.035);
    } else {
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.15);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.15);
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, 0.15);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, 0.15);
      if (bodyBobRef.current)  bodyBobRef.current.position.y  = THREE.MathUtils.lerp(bodyBobRef.current.position.y, Math.sin(t * 1.8) * 0.012, 0.1);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[-3.5, 2.0, -3.0]}
      friction={1}
      type="dynamic"
    >
      <CapsuleCollider args={[0.42, 0.28]} position={[0, 0.72, 0]} />

      <group ref={characterRef}>
        <group ref={bodyBobRef}>

          {/* HEAD */}
          <mesh castShadow position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.28, 14, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.27, 1.13, 0]}><sphereGeometry args={[0.07,8,8]}/><meshStandardMaterial color={SKIN}/></mesh>
          <mesh position={[ 0.27, 1.13, 0]}><sphereGeometry args={[0.07,8,8]}/><meshStandardMaterial color={SKIN}/></mesh>

          {/* HAIR */}
          <mesh position={[0,1.28,-0.02]} scale={[1,0.55,1]}><sphereGeometry args={[0.295,12,12]}/><meshStandardMaterial color={HAIR} roughness={0.8}/></mesh>
          <mesh position={[0,   1.48, 0.12]} rotation={[0.7, 0,    0   ]}><coneGeometry args={[0.07, 0.22,4]}/><meshStandardMaterial color={HAIR} roughness={0.8}/></mesh>
          <mesh position={[0.12,1.45, 0.10]} rotation={[0.6, 0.3,  0.2 ]}><coneGeometry args={[0.06, 0.19,4]}/><meshStandardMaterial color={HAIR} roughness={0.8}/></mesh>
          <mesh position={[-0.12,1.45,0.10]} rotation={[0.6,-0.3, -0.2 ]}><coneGeometry args={[0.06, 0.19,4]}/><meshStandardMaterial color={HAIR} roughness={0.8}/></mesh>
          <mesh position={[0.05,1.52,-0.04]} rotation={[-0.2,0.15, 0.1 ]}><coneGeometry args={[0.055,0.2, 4]}/><meshStandardMaterial color={HAIR} roughness={0.8}/></mesh>

          {/* EYES */}
          <mesh position={[-0.10,1.13,0.24]}><sphereGeometry args={[0.048,8,8]}/><meshStandardMaterial color="#111"/></mesh>
          <mesh position={[ 0.10,1.13,0.24]}><sphereGeometry args={[0.048,8,8]}/><meshStandardMaterial color="#111"/></mesh>
          <mesh position={[-0.09,1.145,0.268]}><sphereGeometry args={[0.015,5,5]}/><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1}/></mesh>
          <mesh position={[ 0.11,1.145,0.268]}><sphereGeometry args={[0.015,5,5]}/><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1}/></mesh>

          {/* BODY */}
          <mesh castShadow position={[0,0.68,0]}><boxGeometry args={[0.54,0.58,0.38]}/><meshStandardMaterial color={JACKET} roughness={0.7}/></mesh>
          <mesh position={[0,0.85,0.18]}><boxGeometry args={[0.16,0.18,0.04]}/><meshStandardMaterial color={SHIRT} roughness={0.6}/></mesh>

          {/* BACKPACK */}
          <mesh castShadow position={[0,0.72,-0.3]}><boxGeometry args={[0.36,0.46,0.18]}/><meshStandardMaterial color={PACK} roughness={0.85}/></mesh>
          <mesh position={[0,0.66,-0.4]}><boxGeometry args={[0.24,0.22,0.06]}/><meshStandardMaterial color="#111827" roughness={0.9}/></mesh>
          <mesh position={[-0.14,0.72,-0.15]}><boxGeometry args={[0.04,0.46,0.04]}/><meshStandardMaterial color="#374151"/></mesh>
          <mesh position={[ 0.14,0.72,-0.15]}><boxGeometry args={[0.04,0.46,0.04]}/><meshStandardMaterial color="#374151"/></mesh>
          {/* Green sleeping roll */}
          <mesh castShadow position={[0,0.42,-0.3]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.07,0.07,0.34,9]}/><meshStandardMaterial color={ROLL} roughness={0.7}/></mesh>
          <mesh position={[0,0.42,-0.3]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[0.075,0.075,0.06,9]}/><meshStandardMaterial color="#78350f"/></mesh>

          {/* LEFT ARM */}
          <group ref={leftArmRef} position={[-0.34, 0.82, 0]}>
            <mesh castShadow position={[0,-0.16,0]}><boxGeometry args={[0.13,0.32,0.13]}/><meshStandardMaterial color={JACKET} roughness={0.7}/></mesh>
            <mesh position={[0,-0.34,0]}><sphereGeometry args={[0.075,8,8]}/><meshStandardMaterial color={SKIN} roughness={0.6}/></mesh>
          </group>

          {/* RIGHT ARM + LANTERN */}
          <group ref={rightArmRef} position={[0.34, 0.82, 0]}>
            <mesh castShadow position={[0,-0.16,0.06]} rotation={[-0.35,0,0]}><boxGeometry args={[0.13,0.32,0.13]}/><meshStandardMaterial color={JACKET} roughness={0.7}/></mesh>
            <mesh position={[0,-0.35,0.12]}><sphereGeometry args={[0.075,8,8]}/><meshStandardMaterial color={SKIN} roughness={0.6}/></mesh>
            {/* Lantern */}
            <group ref={lanternSwingRef} position={[0.07,-0.54,0.2]}>
              <mesh position={[0,0.14,0]} rotation={[0,0,Math.PI/2]}>
                <torusGeometry args={[0.055,0.012,6,10,Math.PI]}/>
                <meshStandardMaterial color={LAN} roughness={0.5} metalness={0.6}/>
              </mesh>
              <mesh position={[0,0,0]}>
                <boxGeometry args={[0.12,0.16,0.12]}/>
                <meshStandardMaterial color={LAN} roughness={0.5} metalness={0.5} transparent opacity={0.85}/>
              </mesh>
              <mesh position={[0,0,0]}>
                <boxGeometry args={[0.095,0.13,0.095]}/>
                <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={2.5} transparent opacity={0.9}/>
              </mesh>
              <mesh position={[0,0.1,0]}>
                <coneGeometry args={[0.08,0.08,4]}/>
                <meshStandardMaterial color={LAN} roughness={0.5} metalness={0.6}/>
              </mesh>
              <pointLight ref={lanternLightRef} color="#ff9f00" intensity={2.0} distance={4.5}/>
            </group>
          </group>

          {/* LEFT LEG */}
          <group ref={leftLegRef} position={[-0.14, 0.38, 0]}>
            <mesh castShadow position={[0,0,0]}><boxGeometry args={[0.17,0.32,0.18]}/><meshStandardMaterial color={PANTS} roughness={0.85}/></mesh>
            <mesh castShadow position={[-0.01,-0.2,0.04]}><boxGeometry args={[0.14,0.09,0.22]}/><meshStandardMaterial color={SHOE} roughness={0.7}/></mesh>
            <mesh position={[-0.01,-0.255,0.04]}><boxGeometry args={[0.145,0.02,0.225]}/><meshStandardMaterial color="#e2e8f0"/></mesh>
          </group>

          {/* RIGHT LEG */}
          <group ref={rightLegRef} position={[0.14, 0.38, 0]}>
            <mesh castShadow position={[0,0,0]}><boxGeometry args={[0.17,0.32,0.18]}/><meshStandardMaterial color={PANTS} roughness={0.85}/></mesh>
            <mesh castShadow position={[0.01,-0.2,0.04]}><boxGeometry args={[0.14,0.09,0.22]}/><meshStandardMaterial color={SHOE} roughness={0.7}/></mesh>
            <mesh position={[0.01,-0.255,0.04]}><boxGeometry args={[0.145,0.02,0.225]}/><meshStandardMaterial color="#e2e8f0"/></mesh>
          </group>

        </group>
      </group>
    </RigidBody>
  );
}
