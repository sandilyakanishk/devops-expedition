import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import audioSystem from '../utils/audio.js';
import { cameraYawRef, characterRotationRef } from '../utils/cameraState.js';
import { getClayTexture } from '../utils/clayTexture.js';

// Retrieve procedural clay bump map
const clayBumpMap = getClayTexture();

// Global material cache to avoid creating separate material instances for hundreds of character parts
const materialCache = {};
function getCachedMaterial(color, roughness, metalness, bumpScale, flatShading) {
  const key = `${color}_${roughness}_${metalness}_${bumpScale}_${flatShading}`;
  if (!materialCache[key]) {
    materialCache[key] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      bumpMap: clayBumpMap,
      bumpScale,
      flatShading,
    });
  }
  return materialCache[key];
}

// Helper Clay Material to give everything a hand-molded clay texture
function ClayMaterial({ color, roughness = 0.92, metalness = 0.0, bumpScale = 0.015, flatShading = true, ...props }) {
  const material = useMemo(() => {
    return getCachedMaterial(color, roughness, metalness, bumpScale, flatShading);
  }, [color, roughness, metalness, bumpScale, flatShading]);

  return <primitive object={material} attach="material" {...props} />;
}

// ─── Colour palette ──────────────────────────────────────────────
const SKIN    = '#e8a27b'; // Peach/Tan skin
const SKIN_D  = '#c8855e'; // Dark skin shading
const HAIR    = '#fbbf24'; // Golden blonde spiky hair
const SHIRT   = '#59bca6'; // Teal/Mint green open shirt
const INNER_T = '#ffffff'; // White inner T-shirt
const PANTS   = '#b2591e'; // Orange-brown/tan trousers
const SHOE    = '#556b2f'; // Olive green shoes
const SOLE    = '#1a240f'; // Dark olive sole
const LACE    = '#cccccc'; // Grey laces
const PACK    = '#70482c'; // Brown leather backpack
const PACK_D  = '#5c3c26'; // Darker brown backpack parts
const PACK_S  = '#362215'; // Dark straps
const POLE    = '#c8a060'; // Trekking pole shaft
const GRIP    = '#1a1a1a'; // Black grip
const METAL   = '#b0b0b0'; // Metal accents
const IND_O   = '#FF9933';
const IND_G   = '#138808';
const IND_B   = '#000080';

export default function Character({ onPositionChange, teleportTarget, clearTeleport, isNight }) {
  const rigidBodyRef    = useRef();
  const characterRef    = useRef();
  const leftLegRef      = useRef();
  const rightLegRef     = useRef();
  const leftArmRef      = useRef();
  const rightArmRef     = useRef();
  const bodyBobRef      = useRef();
  const headlampRef     = useRef();
  const lastFootRef     = useRef(0);
  const flagGroupRef    = useRef();
  const headRef         = useRef();
  const lastActiveTimeRef = useRef(0);

  const [, getKeys] = useKeyboardControls();

  const SPEED_WALK = 10.0;
  const SPEED_RUN  = 18.0;
  const JUMP_FORCE = 5.8;

  useEffect(() => {
    if (teleportTarget && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(teleportTarget, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (clearTeleport) clearTeleport();
    }
  }, [teleportTarget, clearTeleport]);

  useEffect(() => {
    const handleRecenter = () => {
      if (characterRef.current) {
        characterRef.current.rotation.y = Math.PI;
      }
      characterRotationRef.current = Math.PI;
    };
    window.addEventListener('recenter-camera-character', handleRecenter);
    return () => {
      window.removeEventListener('recenter-camera-character', handleRecenter);
    };
  }, []);

  useFrame((state, delta) => {
    if (!rigidBodyRef.current || !characterRef.current) return;
    const realT = state.clock.getElapsedTime();
    // Quantize time to 12 FPS for the stop-motion claymation effect
    const t = Math.floor(realT * 12) / 12;

    // Headlamp glow at night
    if (headlampRef.current) {
      const targetIntensity = isNight ? 4.5 : 0;
      headlampRef.current.intensity = THREE.MathUtils.lerp(
        headlampRef.current.intensity,
        targetIntensity,
        1.0 - Math.exp(-6.0 * delta)
      );
    }

    const keys = getKeys();
    let { forward, backward, left, right, jump, shift } = keys;

    if (window.mobileControls) {
      if (window.mobileControls.forward) forward = true;
      if (window.mobileControls.backward) backward = true;
      if (window.mobileControls.left) left = true;
      if (window.mobileControls.right) right = true;
      if (window.mobileControls.jump) jump = true;
      if (window.mobileControls.shift) shift = true;
    }

    const velocity = rigidBodyRef.current.linvel();
    const position = rigidBodyRef.current.translation();
    window.playerZ = position.z;
    if (onPositionChange) onPositionChange(position);

    // Movement direction relative to camera yaw
    const front   = new THREE.Vector3(0, 0, forward ? -1 : backward ? 1 : 0);
    const side    = new THREE.Vector3(left ? -1 : right ? 1 : 0, 0, 0);
    const camEuler = new THREE.Euler(0, cameraYawRef ? cameraYawRef.current : 0, 0, 'YXZ');
    const moveDir  = new THREE.Vector3()
      .addVectors(front, side).normalize().applyEuler(camEuler);

    const isMoving = forward || backward || left || right;
    const speed    = shift ? SPEED_RUN : SPEED_WALK;

    const velDecay = 1.0 - Math.exp((isMoving ? -18.0 : -20.5) * delta);
    rigidBodyRef.current.setLinvel({
      x: THREE.MathUtils.lerp(velocity.x, moveDir.x * speed, velDecay),
      y: velocity.y,
      z: THREE.MathUtils.lerp(velocity.z, moveDir.z * speed, velDecay),
    }, true);

    if (jump && Math.abs(velocity.y) < 0.12) {
      rigidBodyRef.current.setLinvel({ x: velocity.x, y: JUMP_FORCE, z: velocity.z }, true);
      audioSystem.playJump?.();
    }

    if (isMoving && Math.abs(velocity.y) < 0.18) {
      const interval = shift ? 0.27 : 0.42;
      if (realT - lastFootRef.current > interval) {
        audioSystem.playFootstep?.(shift);
        lastFootRef.current = realT;
      }
    }

    // Face movement direction smoothly (frame-rate independent)
    if (isMoving) {
      const angle = Math.atan2(moveDir.x, moveDir.z);
      let diff = angle - characterRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      characterRef.current.rotation.y += diff * (1.0 - Math.exp(-10.9 * delta));
    }

    // Limb animation (Quantized with t at 12 FPS)
    if (isMoving) {
      const spd = shift ? 13 : 8;
      const amp = shift ? 0.52 : 0.36;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  =  Math.sin(t * spd) * amp;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(t * spd) * amp;
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = -Math.sin(t * spd) * amp * 0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x =  Math.sin(t * spd) * amp * 0.55;
      if (bodyBobRef.current)  bodyBobRef.current.position.y  =  Math.abs(Math.sin(t * spd * 2)) * (shift ? 0.07 : 0.034);
    } else {
      const lerp = THREE.MathUtils.lerp;
      const limbDecay = 1.0 - Math.exp(-9.4 * delta);
      const bobDecay = 1.0 - Math.exp(-6.56 * delta);
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = lerp(leftLegRef.current.rotation.x,  0, limbDecay);
      if (rightLegRef.current) rightLegRef.current.rotation.x = lerp(rightLegRef.current.rotation.x, 0, limbDecay);
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = lerp(leftArmRef.current.rotation.x,  0, limbDecay);
      if (rightArmRef.current) rightArmRef.current.rotation.x = lerp(rightArmRef.current.rotation.x, 0, limbDecay);
      if (bodyBobRef.current)  bodyBobRef.current.position.y  = lerp(bodyBobRef.current.position.y, Math.sin(t * 1.6) * 0.012, bobDecay);
    }

    // Flag flapping animation (Quantized with t at 12 FPS)
    if (flagGroupRef.current) {
      const isMoving = forward || backward || left || right;
      const windSpeed = isMoving ? 14 : 5.5;
      const windIntensity = isMoving ? 0.20 : 0.07;
      flagGroupRef.current.rotation.y = -Math.PI / 2 + Math.sin(t * windSpeed) * windIntensity;
      flagGroupRef.current.rotation.z = Math.cos(t * windSpeed * 1.2) * (windIntensity * 0.3);
    }

    // Idle head look-around animation (Quantized with t at 12 FPS)
    if (isMoving) {
      lastActiveTimeRef.current = realT;
      if (headRef.current) {
        headRef.current.rotation.y = 0;
        headRef.current.rotation.x = 0;
        headRef.current.rotation.z = 0;
      }
    } else {
      const idleDuration = realT - lastActiveTimeRef.current;
      if (idleDuration > 2.0) {
        const idleT = Math.floor(idleDuration * 12) / 12;
        const animT = idleT - 2.0;
        if (headRef.current) {
          headRef.current.rotation.y = Math.sin(animT * 1.5) * 0.45;
          headRef.current.rotation.x = Math.max(0, Math.cos(animT * 3.0)) * 0.08;
          headRef.current.rotation.z = Math.sin(animT * 0.75) * 0.05;
        }
      } else {
        if (headRef.current) {
          const headDecay = 1.0 - Math.exp(-10.0 * delta);
          headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, headDecay);
          headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, headDecay);
          headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, 0, headDecay);
        }
      }
    }

    characterRotationRef.current = characterRef.current.rotation.y;
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      enabledRotations={[false, false, false]}
      position={[0, 2.5, -3]}
      friction={1.2}
      type="dynamic"
    >
      <CapsuleCollider args={[0.42, 0.28]} position={[0, 0.72, 0]} />

      <group ref={characterRef} position={[0, 0.67, 0]} rotation={[0, Math.PI, 0]}>
        <group ref={bodyBobRef}>

          {/* ══════════════════════════════════════════
              HEAD (Low-Poly, Faceted, with Sunglasses & Spiky Hair)
          ══════════════════════════════════════════ */}
          <group ref={headRef} position={[0, 1.14, 0]}>

            {/* Low-Poly Skull */}
            <mesh castShadow>
              <sphereGeometry args={[0.268, 8, 8]} />
              <ClayMaterial color={SKIN} roughness={0.68} />
            </mesh>

            {/* Low-Poly Jaw/Chin */}
            <mesh castShadow position={[0, -0.09, 0.05]} scale={[0.9, 0.76, 1.0]}>
              <sphereGeometry args={[0.13, 6, 6]} />
              <ClayMaterial color={SKIN} roughness={0.7} />
            </mesh>

            {/* Low-Poly Ears */}
            {[[-0.268, 0.02, -0.01], [0.268, 0.02, -0.01]].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]} scale={[0.42, 0.70, 0.52]}>
                <sphereGeometry args={[0.12, 6, 6]} />
                <ClayMaterial color={SKIN_D} roughness={0.75} />
              </mesh>
            ))}

            {/* Low-Poly Sunglasses (Replacing Eyes/Eyebrows) */}
            <group position={[0, 0.05, 0.05]}>
              {/* Front Frame */}
              <mesh castShadow position={[0, 0, 0.185]} rotation={[0.04, 0, 0]}>
                <boxGeometry args={[0.42, 0.08, 0.04]} />
                <ClayMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
              </mesh>
              {/* Lenses */}
              <mesh position={[0, 0, 0.198]} rotation={[0.04, 0, 0]}>
                <boxGeometry args={[0.39, 0.06, 0.02]} />
                <ClayMaterial color="#0f0f11" roughness={0.1} metalness={0.9} />
              </mesh>
              {/* Left Temple (arm) */}
              <mesh position={[-0.21, 0, 0.10]} rotation={[0.04, 0.1, 0]}>
                <boxGeometry args={[0.03, 0.05, 0.2]} />
                <ClayMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
              </mesh>
              {/* Right Temple (arm) */}
              <mesh position={[0.21, 0, 0.10]} rotation={[0.04, -0.1, 0]}>
                <boxGeometry args={[0.03, 0.05, 0.2]} />
                <ClayMaterial color="#1a1a1a" roughness={0.2} metalness={0.8} />
              </mesh>
            </group>

            {/* Low-Poly Spiky Hair (Blonde) */}
            <mesh position={[0, 0.14, -0.03]} scale={[1.02, 0.75, 1.02]}>
              <sphereGeometry args={[0.27, 8, 8]} />
              <ClayMaterial color={HAIR} roughness={0.90} />
            </mesh>
            {[
              // Center spikes
              { pos: [0, 0.28, 0.08], rot: [0.3, 0, 0], scale: [0.12, 0.16, 0.12] },
              { pos: [0, 0.30, -0.04], rot: [0.1, 0, 0], scale: [0.13, 0.18, 0.13] },
              { pos: [0, 0.26, -0.16], rot: [-0.2, 0, 0], scale: [0.12, 0.16, 0.12] },
              // Left spikes
              { pos: [-0.12, 0.25, 0.06], rot: [0.25, 0, 0.3], scale: [0.11, 0.15, 0.11] },
              { pos: [-0.15, 0.24, -0.06], rot: [0.0, 0, 0.4], scale: [0.12, 0.16, 0.12] },
              { pos: [-0.11, 0.20, -0.16], rot: [-0.2, 0, 0.35], scale: [0.11, 0.14, 0.11] },
              // Right spikes
              { pos: [0.12, 0.25, 0.06], rot: [0.25, 0, -0.3], scale: [0.11, 0.15, 0.11] },
              { pos: [0.15, 0.24, -0.06], rot: [0.0, 0, -0.4], scale: [0.12, 0.16, 0.12] },
              { pos: [0.11, 0.20, -0.16], rot: [-0.2, 0, -0.35], scale: [0.11, 0.14, 0.11] },
              // Front fringe spikes
              { pos: [-0.06, 0.27, 0.14], rot: [0.4, 0.2, -0.1], scale: [0.09, 0.14, 0.09] },
              { pos: [0.06, 0.27, 0.14], rot: [0.4, -0.2, 0.1], scale: [0.09, 0.14, 0.09] },
            ].map((spike, idx) => (
              <mesh
                key={idx}
                position={spike.pos}
                rotation={spike.rot}
                scale={spike.scale}
                castShadow
              >
                <coneGeometry args={[0.8, 1.2, 4]} />
                <ClayMaterial color={HAIR} roughness={0.88} />
              </mesh>
            ))}

            {/* ── Headlamp (Functional Night Item) ── */}
            <group position={[0, 0.115, 0.274]}>
              <mesh>
                <boxGeometry args={[0.074, 0.044, 0.032]} />
                <ClayMaterial color="#1a1a1a" roughness={0.45} metalness={0.55} />
              </mesh>
              {/* Lens */}
              <mesh position={[0, 0, 0.018]}>
                <circleGeometry args={[0.022, 6]} />
                <ClayMaterial color="#ffe880" emissive="#ffdf40" emissiveIntensity={0.5} />
              </mesh>
              <pointLight ref={headlampRef} color="#ffedd5" intensity={0} distance={16} position={[0, 0.2, 0.8]} decay={1.5} />
            </group>
          </group>
          {/* end HEAD */}

          {/* ══════════════════════════════════════════
              NECK
          ══════════════════════════════════════════ */}
          <mesh castShadow position={[0, 0.845, 0]}>
            <cylinderGeometry args={[0.082, 0.092, 0.14, 8]} />
            <ClayMaterial color={SKIN} roughness={0.70} />
          </mesh>

          {/* ══════════════════════════════════════════
              TORSO (Open Shirt over White T-shirt)
          ══════════════════════════════════════════ */}
          <group position={[0, 0.58, 0]}>
            {/* Main shirt body */}
            <mesh castShadow>
              <cylinderGeometry args={[0.216, 0.200, 0.46, 12]} />
              <ClayMaterial color={SHIRT} roughness={0.74} />
            </mesh>
            {/* Inner White T-Shirt */}
            <mesh position={[0, 0.08, 0.08]} scale={[0.82, 0.62, 0.50]}>
              <sphereGeometry args={[0.22, 8, 8]} />
              <ClayMaterial color={INNER_T} roughness={0.74} />
            </mesh>
            {/* Open collar pieces */}
            {[-0.08, 0.08].map((cx, idx) => (
              <mesh
                key={idx}
                position={[cx, 0.18, 0.12]}
                rotation={[0.2, idx === 0 ? 0.4 : -0.4, idx === 0 ? 0.3 : -0.3]}
                scale={[0.06, 0.14, 0.05]}
              >
                <boxGeometry />
                <ClayMaterial color={SHIRT} roughness={0.80} />
              </mesh>
            ))}
          </group>

          {/* Shoulder joints */}
          {[[-0.274, 0.78, 0], [0.274, 0.78, 0]].map(([sx, sy, sz], i) => (
            <mesh key={i} castShadow position={[sx, sy, sz]}>
              <sphereGeometry args={[0.095, 8, 8]} />
              <ClayMaterial color={SHIRT} roughness={0.74} />
            </mesh>
          ))}

          {/* ══════════════════════════════════════════
              BACKPACK (Brown leather style)
          ══════════════════════════════════════════ */}
          <group position={[0, 0.64, -0.265]}>
            {/* Main pack body */}
            <mesh castShadow>
              <cylinderGeometry args={[0.165, 0.148, 0.500, 8]} />
              <ClayMaterial color={PACK} roughness={0.88} />
            </mesh>
            {/* Top lid dome */}
            <mesh position={[0, 0.276, 0]} scale={[1.02, 0.52, 1.02]}>
              <sphereGeometry args={[0.165, 8, 6]} />
              <ClayMaterial color={PACK_D} roughness={0.90} />
            </mesh>
            {/* Compression straps */}
            {[0.10, -0.08].map((py, i) => (
              <mesh key={i} position={[0, py, 0.112]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.010, 0.010, 0.34, 4]} />
                <ClayMaterial color={PACK_S} roughness={0.88} />
              </mesh>
            ))}
            {/* Side pockets */}
            <mesh position={[-0.196, -0.02, 0.018]}>
              <cylinderGeometry args={[0.042, 0.037, 0.20, 5]} />
              <ClayMaterial color={PACK_D} roughness={0.90} />
            </mesh>
            <mesh position={[0.196, -0.02, 0.018]}>
              <cylinderGeometry args={[0.042, 0.037, 0.20, 5]} />
              <ClayMaterial color={PACK_D} roughness={0.90} />
            </mesh>
            {/* Shoulder straps visible from front */}
            {[[-0.09, 0.20, 0.112, 0.12], [0.09, 0.20, 0.112, -0.12]].map(([px, py, pz, rz], i) => (
              <mesh key={i} position={[px, py, pz]} rotation={[0.28, 0, rz]}>
                <cylinderGeometry args={[0.022, 0.019, 0.36, 4]} />
                <ClayMaterial color={PACK_S} roughness={0.88} />
              </mesh>
            ))}
            {/* Hip belt */}
            <mesh position={[0, -0.265, 0.112]}>
              <boxGeometry args={[0.20, 0.028, 0.018]} />
              <ClayMaterial color={PACK_S} roughness={0.88} />
            </mesh>
            {/* Hip buckle */}
            <mesh position={[0, -0.265, 0.122]}>
              <boxGeometry args={[0.038, 0.030, 0.015]} />
              <ClayMaterial color="#c8a030" metalness={0.78} roughness={0.32} />
            </mesh>
            {/* Sleeping roll */}
            <mesh position={[0, -0.31, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.060, 0.060, 0.28, 8]} />
              <ClayMaterial color="#4f7a28" roughness={0.75} />
            </mesh>
            <mesh position={[0, -0.31, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.063, 0.063, 0.044, 8]} />
              <ClayMaterial color={PACK_S} roughness={0.80} />
            </mesh>

            {/* 🇮🇳 Indian Flag */}
            <group ref={flagGroupRef} position={[0.06, 0.300, 0.090]}>
              {/* Flag Pole */}
              <mesh castShadow>
                <cylinderGeometry args={[0.007, 0.009, 0.62, 5]} />
                <ClayMaterial color="#b0b8c8" metalness={0.70} roughness={0.30} />
              </mesh>
              {/* Saffron Stripe */}
              <mesh position={[0.160, 0.27, 0]}>
                <boxGeometry args={[0.32, 0.07, 0.007]} />
                <ClayMaterial color={IND_O} side={2} />
              </mesh>
              {/* White Stripe */}
              <mesh position={[0.160, 0.20, 0]}>
                <boxGeometry args={[0.32, 0.07, 0.007]} />
                <ClayMaterial color="#f8fafc" side={2} />
              </mesh>
              {/* Green Stripe */}
              <mesh position={[0.160, 0.13, 0]}>
                <boxGeometry args={[0.32, 0.07, 0.007]} />
                <ClayMaterial color={IND_G} side={2} />
              </mesh>
              
              {/* Ashoka Chakra (Front) */}
              <group position={[0.160, 0.20, 0.004]}>
                {/* Outer ring */}
                <mesh>
                  <torusGeometry args={[0.022, 0.002, 4, 16]} />
                  <ClayMaterial color={IND_B} roughness={0.5} />
                </mesh>
                {/* Hub */}
                <mesh>
                  <sphereGeometry args={[0.005, 4, 4]} />
                  <ClayMaterial color={IND_B} />
                </mesh>
                {/* Spokes */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const angle = (idx / 12) * Math.PI;
                  return (
                    <mesh key={idx} rotation={[0, 0, angle]}>
                      <boxGeometry args={[0.044, 0.002, 0.001]} />
                      <ClayMaterial color={IND_B} />
                    </mesh>
                  );
                })}
              </group>

              {/* Ashoka Chakra (Back) */}
              <group position={[0.160, 0.20, -0.004]}>
                {/* Outer ring */}
                <mesh>
                  <torusGeometry args={[0.022, 0.002, 4, 16]} />
                  <ClayMaterial color={IND_B} roughness={0.5} />
                </mesh>
                {/* Hub */}
                <mesh>
                  <sphereGeometry args={[0.005, 4, 4]} />
                  <ClayMaterial color={IND_B} />
                </mesh>
                {/* Spokes */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const angle = (idx / 12) * Math.PI;
                  return (
                    <mesh key={idx} rotation={[0, 0, angle]}>
                      <boxGeometry args={[0.044, 0.002, 0.001]} />
                      <ClayMaterial color={IND_B} />
                    </mesh>
                  );
                })}
              </group>
            </group>
          </group>
          {/* end BACKPACK */}

          {/* ══════════════════════════════════════════
              HIP / PELVIS (Orange-Brown)
          ══════════════════════════════════════════ */}
          <mesh castShadow position={[0, 0.298, 0.010]} scale={[1.06, 0.50, 0.94]}>
            <sphereGeometry args={[0.196, 8, 8]} />
            <ClayMaterial color={PANTS} roughness={0.88} />
          </mesh>

          {/* ══════════════════════════════════════════
              LEFT ARM (Teal sleeves, skin hands)
          ══════════════════════════════════════════ */}
          <group ref={leftArmRef} position={[-0.312, 0.780, 0]}>
            <mesh castShadow position={[0, -0.130, 0]}>
              <cylinderGeometry args={[0.072, 0.064, 0.26, 8]} />
              <ClayMaterial color={SHIRT} roughness={0.74} />
            </mesh>
            {/* Elbow */}
            <mesh position={[0, -0.270, 0]}>
              <sphereGeometry args={[0.066, 8, 8]} />
              <ClayMaterial color={SHIRT} roughness={0.74} />
            </mesh>
            <mesh castShadow position={[0, -0.412, 0]}>
              <cylinderGeometry args={[0.060, 0.052, 0.26, 8]} />
              <ClayMaterial color={SHIRT} roughness={0.72} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.558, 0]}>
              <sphereGeometry args={[0.058, 8, 8]} />
              <ClayMaterial color={SKIN} roughness={0.72} />
            </mesh>
            {/* Finger hints */}
            {[-0.018, 0.018].map((dx, i) => (
              <mesh key={i} position={[dx, -0.612, 0.012]}>
                <sphereGeometry args={[0.022, 4, 4]} />
                <ClayMaterial color={SKIN_D} roughness={0.82} />
              </mesh>
            ))}
          </group>

          {/* ══════════════════════════════════════════
              RIGHT ARM + TREKKING POLE
          ══════════════════════════════════════════ */}
          <group ref={rightArmRef} position={[0.312, 0.780, 0]}>
            {/* Upper arm angled slightly forward */}
            <mesh castShadow position={[0, -0.130, 0.028]} rotation={[-0.14, 0, 0]}>
              <cylinderGeometry args={[0.072, 0.064, 0.26, 8]} />
              <ClayMaterial color={SHIRT} roughness={0.74} />
            </mesh>
            {/* Elbow */}
            <mesh position={[0, -0.268, 0.050]}>
              <sphereGeometry args={[0.066, 8, 8]} />
              <ClayMaterial color={SHIRT} roughness={0.74} />
            </mesh>
            {/* Lower arm */}
            <mesh castShadow position={[0, -0.410, 0.096]} rotation={[-0.34, 0, 0]}>
              <cylinderGeometry args={[0.060, 0.052, 0.26, 8]} />
              <ClayMaterial color={SHIRT} roughness={0.72} />
            </mesh>
            {/* Hand */}
            <mesh position={[0.028, -0.554, 0.172]}>
              <sphereGeometry args={[0.062, 8, 8]} />
              <ClayMaterial color={SKIN} roughness={0.72} />
            </mesh>

            {/* ── Trekking Pole ── */}
            <group position={[0.038, -0.542, 0.185]} rotation={[0.60, 0, 0.06]}>
              {/* Grip */}
              <mesh castShadow>
                <cylinderGeometry args={[0.024, 0.022, 0.18, 5]} />
                <ClayMaterial color={GRIP} roughness={0.93} />
              </mesh>
              {/* Grip texture rings */}
              {[0.042, 0.000, -0.042].map((gy, i) => (
                <mesh key={i} position={[0, gy, 0]}>
                  <cylinderGeometry args={[0.027, 0.027, 0.016, 5]} />
                  <ClayMaterial color={PACK_S} roughness={0.95} />
                </mesh>
              ))}
              {/* Wrist strap */}
              <mesh position={[0, 0.105, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.038, 0.008, 4, 8, Math.PI * 1.35]} />
                <ClayMaterial color={GRIP} roughness={0.88} />
              </mesh>
              {/* Shaft section 1 */}
              <mesh castShadow position={[0, -0.62, 0]}>
                <cylinderGeometry args={[0.013, 0.012, 1.04, 5]} />
                <ClayMaterial color={POLE} roughness={0.78} />
              </mesh>
              {/* Shaft section join ring */}
              <mesh position={[0, -1.15, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.024, 5]} />
                <ClayMaterial color={METAL} metalness={0.82} roughness={0.22} />
              </mesh>
              {/* Shaft section 2 (narrower) */}
              <mesh castShadow position={[0, -1.52, 0]}>
                <cylinderGeometry args={[0.011, 0.009, 0.72, 5]} />
                <ClayMaterial color={POLE} roughness={0.78} />
              </mesh>
              {/* Basket (stops pole sinking) */}
              <mesh position={[0, -1.89, 0]}>
                <cylinderGeometry args={[0.040, 0.040, 0.010, 6]} />
                <ClayMaterial color="#222" roughness={0.92} />
              </mesh>
              {/* Metal tip */}
              <mesh position={[0, -1.96, 0]}>
                <coneGeometry args={[0.009, 0.082, 4]} />
                <ClayMaterial color={METAL} metalness={0.94} roughness={0.16} />
              </mesh>
            </group>
          </group>
          {/* end RIGHT ARM */}

          {/* ══════════════════════════════════════════
              LEFT LEG (Orange-brown pants, olive green shoes)
          ══════════════════════════════════════════ */}
          <group ref={leftLegRef} position={[-0.114, 0.262, 0]}>
            {/* Upper leg */}
            <mesh castShadow position={[0, -0.138, 0]}>
              <cylinderGeometry args={[0.092, 0.082, 0.276, 8]} />
              <ClayMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Knee sphere */}
            <mesh position={[0, -0.288, 0]}>
              <sphereGeometry args={[0.085, 8, 8]} />
              <ClayMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Lower leg */}
            <mesh castShadow position={[0, -0.456, 0]}>
              <cylinderGeometry args={[0.078, 0.068, 0.300, 8]} />
              <ClayMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Ankle */}
            <mesh position={[0, -0.622, 0.010]}>
              <sphereGeometry args={[0.072, 8, 8]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Boot upper (ankle cuff) */}
            <mesh castShadow position={[0, -0.720, 0.010]}>
              <cylinderGeometry args={[0.080, 0.076, 0.18, 8]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Boot toe box */}
            <mesh castShadow position={[-0.004, -0.836, 0.052]}>
              <boxGeometry args={[0.148, 0.108, 0.238]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Heel bump */}
            <mesh position={[-0.004, -0.840, -0.068]}>
              <sphereGeometry args={[0.068, 8, 8]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Sole */}
            <mesh position={[-0.004, -0.894, 0.046]}>
              <boxGeometry args={[0.158, 0.034, 0.270]} />
              <ClayMaterial color={SOLE} roughness={0.98} />
            </mesh>
            {/* Sole grip ridges */}
            {[-0.060, -0.012, 0.036, 0.088].map((dz, i) => (
              <mesh key={i} position={[-0.004, -0.912, 0.046 + dz]}>
                <boxGeometry args={[0.158, 0.022, 0.024]} />
                <ClayMaterial color={SOLE} roughness={0.99} />
              </mesh>
            ))}
            {/* Laces */}
            {[0.010, 0.046, 0.082].map((dy, i) => (
              <mesh key={i} position={[-0.004, -0.706 + dy, 0.117]}>
                <boxGeometry args={[0.090, 0.011, 0.012]} />
                <ClayMaterial color={LACE} roughness={0.75} />
              </mesh>
            ))}
            {/* Lace cross-knot */}
            <mesh position={[-0.004, -0.660, 0.117]}>
              <sphereGeometry args={[0.018, 5, 5]} />
              <ClayMaterial color={LACE} roughness={0.70} />
            </mesh>
          </group>

          {/* ══════════════════════════════════════════
              RIGHT LEG (Orange-brown pants, olive green shoes)
          ══════════════════════════════════════════ */}
          <group ref={rightLegRef} position={[0.114, 0.262, 0]}>
            {/* Upper leg */}
            <mesh castShadow position={[0, -0.138, 0]}>
              <cylinderGeometry args={[0.092, 0.082, 0.276, 8]} />
              <ClayMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Knee sphere */}
            <mesh position={[0, -0.288, 0]}>
              <sphereGeometry args={[0.085, 8, 8]} />
              <ClayMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Lower leg */}
            <mesh castShadow position={[0, -0.456, 0]}>
              <cylinderGeometry args={[0.078, 0.068, 0.300, 8]} />
              <ClayMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Ankle */}
            <mesh position={[0, -0.622, 0.010]}>
              <sphereGeometry args={[0.072, 8, 8]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Boot upper (ankle cuff) */}
            <mesh castShadow position={[0, -0.720, 0.010]}>
              <cylinderGeometry args={[0.080, 0.076, 0.18, 8]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Boot toe box */}
            <mesh castShadow position={[0.004, -0.836, 0.052]}>
              <boxGeometry args={[0.148, 0.108, 0.238]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Heel bump */}
            <mesh position={[0.004, -0.840, -0.068]}>
              <sphereGeometry args={[0.068, 8, 8]} />
              <ClayMaterial color={SHOE} roughness={0.92} />
            </mesh>
            {/* Sole */}
            <mesh position={[0.004, -0.894, 0.046]}>
              <boxGeometry args={[0.158, 0.034, 0.270]} />
              <ClayMaterial color={SOLE} roughness={0.98} />
            </mesh>
            {[-0.060, -0.012, 0.036, 0.088].map((dz, i) => (
              <mesh key={i} position={[0.004, -0.912, 0.046 + dz]}>
                <boxGeometry args={[0.158, 0.022, 0.024]} />
                <ClayMaterial color={SOLE} roughness={0.99} />
              </mesh>
            ))}
            {[0.010, 0.046, 0.082].map((dy, i) => (
              <mesh key={i} position={[0.004, -0.706 + dy, 0.117]}>
                <boxGeometry args={[0.090, 0.011, 0.012]} />
                <ClayMaterial color={LACE} roughness={0.75} />
              </mesh>
            ))}
            <mesh position={[0.004, -0.660, 0.117]}>
              <sphereGeometry args={[0.018, 5, 5]} />
              <ClayMaterial color={LACE} roughness={0.70} />
            </mesh>
          </group>
          {/* end RIGHT LEG */}

        </group>{/* end bodyBob */}
      </group>{/* end characterRef */}
    </RigidBody>
  );
}
