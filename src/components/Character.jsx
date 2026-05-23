import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import audioSystem from '../utils/audio.js';
import { cameraYawRef, characterRotationRef } from '../utils/cameraState.js';

// ─── Colour palette ──────────────────────────────────────────────
const SKIN    = '#d4956a';
const SKIN_D  = '#b87850';
const HAIR    = '#2a1500';
const CAP     = '#1a1a1a'; // Adidas Black Cap
const CAP_D   = '#111111'; // Adidas Black Cap Dark
const JACKET  = '#eaeaea'; // Adidas T-shirt (light grey)
const JACKET_D= '#cccccc'; // Adidas T-shirt Dark
const COLLAR  = '#eaeaea'; // Adidas T-shirt collar
const PANTS   = '#18181b'; // Adidas Black track pants
const BOOT    = '#ffffff'; // Adidas White sneakers
const SOLE    = '#111111'; // Adidas Black sneaker sole
const LACE    = '#ffffff'; // Adidas White sneaker laces
const PACK    = '#374151'; // Sporty grey backpack
const PACK_D  = '#1f2937'; // Dark grey backpack lid
const PACK_S  = '#111827'; // Black straps
const POLE    = '#c8a060';
const GRIP    = '#1a1a1a'; // Black grip
const METAL   = '#b0b0b0';
const IND_O   = '#FF9933';
const IND_G   = '#138808';
const IND_B   = '#000080';

export default function Character({ onPositionChange, teleportTarget, clearTeleport }) {
  const rigidBodyRef    = useRef();
  const characterRef    = useRef();
  const leftLegRef      = useRef();
  const rightLegRef     = useRef();
  const leftArmRef      = useRef();
  const rightArmRef     = useRef();
  const bodyBobRef      = useRef();
  const headlampRef     = useRef();
  const lastFootRef     = useRef(0);

  const [, getKeys] = useKeyboardControls();

  const SPEED_WALK = 4.0;
  const SPEED_RUN  = 7.2;
  const JUMP_FORCE = 5.8;

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

    // Headlamp glow at night (App passes isNight via env but we just always pulse)
    if (headlampRef.current) {
      headlampRef.current.intensity = 0; // off by default; turned on when isNight
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
      if (t - lastFootRef.current > interval) {
        audioSystem.playFootstep?.(shift);
        lastFootRef.current = t;
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

    // Limb animation
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

      <group ref={characterRef} position={[0, 0.67, 0]}>
        <group ref={bodyBobRef}>

          {/* ══════════════════════════════════════════
              HEAD
          ══════════════════════════════════════════ */}
          <group position={[0, 1.14, 0]}>

            {/* Skull sphere */}
            <mesh castShadow>
              <sphereGeometry args={[0.268, 32, 32]} />
              <meshStandardMaterial color={SKIN} roughness={0.68} />
            </mesh>

            {/* Sculpted Smooth Jaw/Chin */}
            <mesh castShadow position={[0, -0.09, 0.05]} scale={[0.9, 0.76, 1.0]}>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial color={SKIN} roughness={0.7} />
            </mesh>

            {/* Stylized Cheekbones */}
            {[-0.10, 0.10].map((cx, i) => (
              <mesh key={i} position={[cx, -0.02, 0.16]} scale={[1, 0.8, 0.6]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial color={SKIN_D} roughness={0.75} />
              </mesh>
            ))}

            {/* Ears */}
            {[[-0.268, 0.02, -0.01], [0.268, 0.02, -0.01]].map(([x, y, z], i) => (
              <mesh key={i} position={[x, y, z]} scale={[0.42, 0.70, 0.52]}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color={SKIN_D} roughness={0.75} />
              </mesh>
            ))}

            {/* Eyes – white + pupil + highlight */}
            {[[-0.104, 0.055], [0.104, 0.055]].map(([ex, ey], i) => (
              <group key={i} position={[ex, ey, 0.234]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.044, 10, 10]} />
                  <meshStandardMaterial color="#fff" roughness={0.35} />
                </mesh>
                <mesh position={[i === 0 ? -0.006 : 0.006, -0.003, 0.030]}>
                  <sphereGeometry args={[0.031, 8, 8]} />
                  <meshStandardMaterial color="#161220" />
                </mesh>
                <mesh position={[i === 0 ? -0.004 : 0.004, 0.005, 0.042]}>
                  <sphereGeometry args={[0.013, 6, 6]} />
                  <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.5} />
                </mesh>
              </group>
            ))}

            {/* Eyebrows */}
            {[[-0.104, 0.12, -0.18], [0.104, 0.12, 0.18]].map(([ex, ey, rz], i) => (
              <mesh key={i} position={[ex, ey, 0.239]} rotation={[0.06, i === 0 ? 0.12 : -0.12, rz]}>
                <boxGeometry args={[0.076, 0.013, 0.018]} />
                <meshStandardMaterial color={HAIR} />
              </mesh>
            ))}

            {/* Smooth tapered chiseled nose */}
            <mesh position={[0, 0.01, 0.252]} rotation={[-0.2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.032, 0.12, 16]} />
              <meshStandardMaterial color={SKIN_D} roughness={0.82} />
            </mesh>

            {/* Mouth (simple line) */}
            <mesh position={[0, -0.098, 0.253]}>
              <boxGeometry args={[0.058, 0.011, 0.010]} />
              <meshStandardMaterial color="#c06050" roughness={0.85} />
            </mesh>
            {/* Cheek blush */}
            {[-0.19, 0.19].map((cx, i) => (
              <mesh key={i} position={[cx, -0.035, 0.21]} scale={[1, 0.6, 0.3]}>
                <sphereGeometry args={[0.055, 16, 16]} />
                <meshStandardMaterial color="#e09080" roughness={0.9} transparent opacity={0.35} />
              </mesh>
            ))}

            {/* Hair – dark dome on top/back */}
            <mesh position={[0, 0.18, -0.06]} scale={[1.05, 0.52, 1.05]}>
              <sphereGeometry args={[0.278, 24, 24]} />
              <meshStandardMaterial color={HAIR} roughness={0.96} />
            </mesh>

            {/* ── Trekking Cap ── */}
            {/* Dome */}
            <mesh position={[0, 0.145, -0.025]} scale={[1.05, 0.72, 1.06]}>
              <sphereGeometry args={[0.272, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
              <meshStandardMaterial color={CAP} roughness={0.90} />
            </mesh>
            {/* Front brim */}
            <mesh position={[0, 0.036, 0.218]} rotation={[-0.28, 0, 0]}>
              <cylinderGeometry args={[0.218, 0.225, 0.022, 32, 1, false, -0.62, 1.24]} />
              <meshStandardMaterial color={CAP_D} roughness={0.92} />
            </mesh>
            {/* Top button */}
            <mesh position={[0, 0.358, -0.028]}>
              <cylinderGeometry args={[0.022, 0.022, 0.022, 12]} />
              <meshStandardMaterial color={CAP_D} roughness={0.85} />
            </mesh>
            {/* Adidas Cap 3-Stripes */}
            {[-0.032, 0, 0.032].map((ox, idx) => (
              <mesh key={idx} position={[ox, 0.26, 0.158]} rotation={[0.42, 0, 0]}>
                <boxGeometry args={[0.011, 0.11, 0.012]} />
                <meshStandardMaterial color="#ffffff" roughness={0.7} />
              </mesh>
            ))}

            {/* ── Headlamp ── */}
            <group position={[0, 0.115, 0.274]}>
              <mesh>
                <boxGeometry args={[0.074, 0.044, 0.032]} />
                <meshStandardMaterial color="#1c1c1c" roughness={0.45} metalness={0.55} />
              </mesh>
              {/* Lens */}
              <mesh position={[0, 0, 0.018]}>
                <circleGeometry args={[0.022, 8]} />
                <meshStandardMaterial color="#ffe880" emissive="#ffdf40" emissiveIntensity={0.5} />
              </mesh>
              <pointLight ref={headlampRef} color="#ffe0a0" intensity={0} distance={7} position={[0, 0, 0.05]} />
            </group>
          </group>
          {/* end HEAD */}

          {/* ══════════════════════════════════════════
              NECK
          ══════════════════════════════════════════ */}
          <mesh castShadow position={[0, 0.845, 0]}>
            <cylinderGeometry args={[0.082, 0.092, 0.14, 24]} />
            <meshStandardMaterial color={SKIN} roughness={0.70} />
          </mesh>

          {/* ══════════════════════════════════════════
              TORSO
          ══════════════════════════════════════════ */}
          <group position={[0, 0.58, 0]}>
            {/* Main rounded cylinder */}
            <mesh castShadow>
              <cylinderGeometry args={[0.216, 0.200, 0.46, 32]} />
              <meshStandardMaterial color={JACKET} roughness={0.74} />
            </mesh>
            {/* Chest fill sphere */}
            <mesh position={[0, 0.10, 0.09]} scale={[0.80, 0.48, 0.40]}>
              <sphereGeometry args={[0.22, 32, 24]} />
              <meshStandardMaterial color={JACKET} roughness={0.74} />
            </mesh>
            {/* Shirt collar */}
            <mesh position={[0, 0.225, 0.112]}>
              <cylinderGeometry args={[0.070, 0.080, 0.068, 24]} />
              <meshStandardMaterial color={COLLAR} roughness={0.80} />
            </mesh>
            {/* Adidas chest logo (three slanted stripes) */}
            {[[-0.016, 0.024], [0, 0.038], [0.016, 0.052]].map(([ox, h], idx) => (
              <mesh key={idx} position={[-0.085 + ox, 0.10 + (h - 0.038)/2, 0.198]} rotation={[0.08, 0.1, 0.45]}>
                <boxGeometry args={[0.010, h, 0.008]} />
                <meshStandardMaterial color="#111111" roughness={0.5} />
              </mesh>
            ))}
          </group>

          {/* Shoulder joints */}
          {[[-0.274, 0.78, 0], [0.274, 0.78, 0]].map(([sx, sy, sz], i) => (
            <mesh key={i} castShadow position={[sx, sy, sz]}>
              <sphereGeometry args={[0.095, 24, 24]} />
              <meshStandardMaterial color={JACKET} roughness={0.74} />
            </mesh>
          ))}

          {/* ══════════════════════════════════════════
              BACKPACK
          ══════════════════════════════════════════ */}
          <group position={[0, 0.64, -0.265]}>
            {/* Main pack body */}
            <mesh castShadow>
              <cylinderGeometry args={[0.165, 0.148, 0.500, 24]} />
              <meshStandardMaterial color={PACK} roughness={0.88} />
            </mesh>
            {/* Top lid dome */}
            <mesh position={[0, 0.276, 0]} scale={[1.02, 0.52, 1.02]}>
              <sphereGeometry args={[0.165, 24, 16]} />
              <meshStandardMaterial color={PACK_D} roughness={0.90} />
            </mesh>
            {/* Compression straps */}
            {[0.10, -0.08].map((py, i) => (
              <mesh key={i} position={[0, py, 0.112]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.010, 0.010, 0.34, 4]} />
                <meshStandardMaterial color={PACK_S} roughness={0.88} />
              </mesh>
            ))}
            {/* Side pockets */}
            <mesh position={[-0.196, -0.02, 0.018]}>
              <cylinderGeometry args={[0.042, 0.037, 0.20, 7]} />
              <meshStandardMaterial color="#5a8035" roughness={0.90} />
            </mesh>
            <mesh position={[0.196, -0.02, 0.018]}>
              <cylinderGeometry args={[0.042, 0.037, 0.20, 7]} />
              <meshStandardMaterial color={PACK_D} roughness={0.90} />
            </mesh>
            {/* Shoulder straps visible from front */}
            {[[-0.09, 0.20, 0.112, 0.12], [0.09, 0.20, 0.112, -0.12]].map(([px, py, pz, rz], i) => (
              <mesh key={i} position={[px, py, pz]} rotation={[0.28, 0, rz]}>
                <cylinderGeometry args={[0.022, 0.019, 0.36, 5]} />
                <meshStandardMaterial color={PACK_S} roughness={0.88} />
              </mesh>
            ))}
            {/* Hip belt */}
            <mesh position={[0, -0.265, 0.112]}>
              <boxGeometry args={[0.20, 0.028, 0.018]} />
              <meshStandardMaterial color={PACK_S} roughness={0.88} />
            </mesh>
            {/* Hip buckle */}
            <mesh position={[0, -0.265, 0.122]}>
              <boxGeometry args={[0.038, 0.030, 0.015]} />
              <meshStandardMaterial color="#c8a030" metalness={0.78} roughness={0.32} />
            </mesh>
            {/* Sleeping roll */}
            <mesh position={[0, -0.31, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.060, 0.060, 0.28, 20]} />
              <meshStandardMaterial color="#16a34a" roughness={0.75} />
            </mesh>
            <mesh position={[0, -0.31, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.063, 0.063, 0.044, 20]} />
              <meshStandardMaterial color="#78350f" roughness={0.80} />
            </mesh>

            {/* 🇮🇳 Indian Flag */}
            <group position={[0.06, 0.300, 0.090]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.007, 0.009, 0.62, 5]} />
                <meshStandardMaterial color="#b0b8c8" metalness={0.70} roughness={0.30} />
              </mesh>
              <mesh position={[0.130, 0.265, 0]}>
                <boxGeometry args={[0.26, 0.068, 0.007]} />
                <meshStandardMaterial color={IND_O} side={2} />
              </mesh>
              <mesh position={[0.130, 0.197, 0]}>
                <boxGeometry args={[0.26, 0.068, 0.007]} />
                <meshStandardMaterial color="#f8fafc" side={2} />
              </mesh>
              <mesh position={[0.130, 0.129, 0]}>
                <boxGeometry args={[0.26, 0.068, 0.007]} />
                <meshStandardMaterial color={IND_G} side={2} />
              </mesh>
              {/* Ashoka Chakra */}
              <mesh position={[0.130, 0.197, 0.005]}>
                <torusGeometry args={[0.021, 0.005, 6, 16]} />
                <meshStandardMaterial color={IND_B} />
              </mesh>
            </group>
          </group>
          {/* end BACKPACK */}

          {/* ══════════════════════════════════════════
              HIP / PELVIS
          ══════════════════════════════════════════ */}
          <mesh castShadow position={[0, 0.298, 0.010]} scale={[1.06, 0.50, 0.94]}>
            <sphereGeometry args={[0.196, 24, 16]} />
            <meshStandardMaterial color={PANTS} roughness={0.88} />
          </mesh>

          {/* ══════════════════════════════════════════
              LEFT ARM
          ══════════════════════════════════════════ */}
          <group ref={leftArmRef} position={[-0.312, 0.780, 0]}>
            <mesh castShadow position={[0, -0.130, 0]}>
              <cylinderGeometry args={[0.072, 0.064, 0.26, 16]} />
              <meshStandardMaterial color={JACKET} roughness={0.74} />
            </mesh>
            {/* Elbow */}
            <mesh position={[0, -0.270, 0]}>
              <sphereGeometry args={[0.066, 16, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.74} />
            </mesh>
            <mesh castShadow position={[0, -0.412, 0]}>
              <cylinderGeometry args={[0.060, 0.052, 0.26, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.72} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.558, 0]}>
              <sphereGeometry args={[0.058, 16, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.72} />
            </mesh>
            {/* Finger hints */}
            {[-0.018, 0.018].map((dx, i) => (
              <mesh key={i} position={[dx, -0.612, 0.012]}>
                <sphereGeometry args={[0.022, 6, 6]} />
                <meshStandardMaterial color={SKIN_D} roughness={0.82} />
              </mesh>
            ))}
          </group>

          {/* ══════════════════════════════════════════
              RIGHT ARM + TREKKING POLE
          ══════════════════════════════════════════ */}
          <group ref={rightArmRef} position={[0.312, 0.780, 0]}>
            {/* Upper arm angled slightly forward */}
            <mesh castShadow position={[0, -0.130, 0.028]} rotation={[-0.14, 0, 0]}>
              <cylinderGeometry args={[0.072, 0.064, 0.26, 16]} />
              <meshStandardMaterial color={JACKET} roughness={0.74} />
            </mesh>
            {/* Elbow */}
            <mesh position={[0, -0.268, 0.050]}>
              <sphereGeometry args={[0.066, 16, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.74} />
            </mesh>
            {/* Lower arm */}
            <mesh castShadow position={[0, -0.410, 0.096]} rotation={[-0.34, 0, 0]}>
              <cylinderGeometry args={[0.060, 0.052, 0.26, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.72} />
            </mesh>
            {/* Hand */}
            <mesh position={[0.028, -0.554, 0.172]}>
              <sphereGeometry args={[0.062, 16, 16]} />
              <meshStandardMaterial color={SKIN} roughness={0.72} />
            </mesh>

            {/* ── Trekking Pole ── */}
            <group position={[0.038, -0.542, 0.185]} rotation={[0.60, 0, 0.06]}>
              {/* Grip */}
              <mesh castShadow>
                <cylinderGeometry args={[0.024, 0.022, 0.18, 7]} />
                <meshStandardMaterial color={GRIP} roughness={0.93} />
              </mesh>
              {/* Grip texture rings */}
              {[0.042, 0.000, -0.042].map((gy, i) => (
                <mesh key={i} position={[0, gy, 0]}>
                  <cylinderGeometry args={[0.027, 0.027, 0.016, 7]} />
                  <meshStandardMaterial color={PACK_S} roughness={0.95} />
                </mesh>
              ))}
              {/* Wrist strap */}
              <mesh position={[0, 0.105, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.038, 0.008, 4, 10, Math.PI * 1.35]} />
                <meshStandardMaterial color={GRIP} roughness={0.88} />
              </mesh>
              {/* Shaft section 1 */}
              <mesh castShadow position={[0, -0.62, 0]}>
                <cylinderGeometry args={[0.013, 0.012, 1.04, 6]} />
                <meshStandardMaterial color={POLE} roughness={0.78} />
              </mesh>
              {/* Shaft section join ring */}
              <mesh position={[0, -1.15, 0]}>
                <cylinderGeometry args={[0.016, 0.016, 0.024, 6]} />
                <meshStandardMaterial color={METAL} metalness={0.82} roughness={0.22} />
              </mesh>
              {/* Shaft section 2 (narrower) */}
              <mesh castShadow position={[0, -1.52, 0]}>
                <cylinderGeometry args={[0.011, 0.009, 0.72, 6]} />
                <meshStandardMaterial color={POLE} roughness={0.78} />
              </mesh>
              {/* Basket (stops pole sinking) */}
              <mesh position={[0, -1.89, 0]}>
                <cylinderGeometry args={[0.040, 0.040, 0.010, 8]} />
                <meshStandardMaterial color="#222" roughness={0.92} />
              </mesh>
              {/* Metal tip */}
              <mesh position={[0, -1.96, 0]}>
                <coneGeometry args={[0.009, 0.082, 5]} />
                <meshStandardMaterial color={METAL} metalness={0.94} roughness={0.16} />
              </mesh>
            </group>
          </group>
          {/* end RIGHT ARM */}

          {/* ══════════════════════════════════════════
              LEFT LEG
          ══════════════════════════════════════════ */}
          <group ref={leftLegRef} position={[-0.114, 0.262, 0]}>
            {/* Upper leg */}
            <mesh castShadow position={[0, -0.138, 0]}>
              <cylinderGeometry args={[0.092, 0.082, 0.276, 16]} />
              <meshStandardMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Knee sphere */}
            <mesh position={[0, -0.288, 0]}>
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshStandardMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Lower leg */}
            <mesh castShadow position={[0, -0.456, 0]}>
              <cylinderGeometry args={[0.078, 0.068, 0.300, 16]} />
              <meshStandardMaterial color={PANTS} roughness={0.88} />
            </mesh>
            {/* Ankle */}
            <mesh position={[0, -0.622, 0.010]}>
              <sphereGeometry args={[0.072, 16, 16]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            {/* Boot upper (ankle cuff) */}
            <mesh castShadow position={[0, -0.720, 0.010]}>
              <cylinderGeometry args={[0.080, 0.076, 0.18, 16]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            {/* Boot toe box */}
            <mesh castShadow position={[-0.004, -0.836, 0.052]}>
              <boxGeometry args={[0.148, 0.108, 0.238]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            {/* Heel bump */}
            <mesh position={[-0.004, -0.840, -0.068]}>
              <sphereGeometry args={[0.068, 16, 16]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            {/* Sole */}
            <mesh position={[-0.004, -0.894, 0.046]}>
              <boxGeometry args={[0.158, 0.034, 0.270]} />
              <meshStandardMaterial color={SOLE} roughness={0.98} />
            </mesh>
            {/* Sole grip ridges */}
            {[-0.060, -0.012, 0.036, 0.088].map((dz, i) => (
              <mesh key={i} position={[-0.004, -0.912, 0.046 + dz]}>
                <boxGeometry args={[0.158, 0.022, 0.024]} />
                <meshStandardMaterial color={SOLE} roughness={0.99} />
              </mesh>
            ))}
            {/* Laces */}
            {[0.010, 0.046, 0.082].map((dy, i) => (
              <mesh key={i} position={[-0.004, -0.706 + dy, 0.117]}>
                <boxGeometry args={[0.090, 0.011, 0.012]} />
                <meshStandardMaterial color={LACE} roughness={0.75} />
              </mesh>
            ))}
            {/* Lace cross-knot */}
            <mesh position={[-0.004, -0.660, 0.117]}>
              <sphereGeometry args={[0.018, 6, 6]} />
              <meshStandardMaterial color={LACE} roughness={0.70} />
            </mesh>

            {/* Adidas 3-Stripes down left side of pants */}
            {[-0.032, 0, 0.032].map((oz, i) => (
              <mesh key={`p-l-${i}`} position={[-0.096, -0.30, oz]}>
                <boxGeometry args={[0.010, 0.60, 0.010]} />
                <meshStandardMaterial color="#ffffff" roughness={0.7} />
              </mesh>
            ))}

            {/* Adidas sneaker stripes (outer side left) */}
            {[-0.035, 0, 0.035].map((oz, i) => (
              <mesh key={`s-l-${i}`} position={[-0.079, -0.836, 0.052 + oz]} rotation={[0, 0, 0.2]}>
                <boxGeometry args={[0.008, 0.068, 0.015]} />
                <meshStandardMaterial color="#111111" roughness={0.5} />
              </mesh>
            ))}
          </group>

          {/* ══════════════════════════════════════════
              RIGHT LEG
          ══════════════════════════════════════════ */}
          <group ref={rightLegRef} position={[0.114, 0.262, 0]}>
            <mesh castShadow position={[0, -0.138, 0]}>
              <cylinderGeometry args={[0.092, 0.082, 0.276, 16]} />
              <meshStandardMaterial color={PANTS} roughness={0.88} />
            </mesh>
            <mesh position={[0, -0.288, 0]}>
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshStandardMaterial color={PANTS} roughness={0.88} />
            </mesh>
            <mesh castShadow position={[0, -0.456, 0]}>
              <cylinderGeometry args={[0.078, 0.068, 0.300, 16]} />
              <meshStandardMaterial color={PANTS} roughness={0.88} />
            </mesh>
            <mesh position={[0, -0.622, 0.010]}>
              <sphereGeometry args={[0.072, 16, 16]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            <mesh castShadow position={[0, -0.720, 0.010]}>
              <cylinderGeometry args={[0.080, 0.076, 0.18, 16]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            <mesh castShadow position={[0.004, -0.836, 0.052]}>
              <boxGeometry args={[0.148, 0.108, 0.238]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            <mesh position={[0.004, -0.840, -0.068]}>
              <sphereGeometry args={[0.068, 16, 16]} />
              <meshStandardMaterial color={BOOT} roughness={0.92} />
            </mesh>
            <mesh position={[0.004, -0.894, 0.046]}>
              <boxGeometry args={[0.158, 0.034, 0.270]} />
              <meshStandardMaterial color={SOLE} roughness={0.98} />
            </mesh>
            {[-0.060, -0.012, 0.036, 0.088].map((dz, i) => (
              <mesh key={i} position={[0.004, -0.912, 0.046 + dz]}>
                <boxGeometry args={[0.158, 0.022, 0.024]} />
                <meshStandardMaterial color={SOLE} roughness={0.99} />
              </mesh>
            ))}
            {[0.010, 0.046, 0.082].map((dy, i) => (
              <mesh key={i} position={[0.004, -0.706 + dy, 0.117]}>
                <boxGeometry args={[0.090, 0.011, 0.012]} />
                <meshStandardMaterial color={LACE} roughness={0.75} />
              </mesh>
            ))}
            <mesh position={[0.004, -0.660, 0.117]}>
              <sphereGeometry args={[0.018, 6, 6]} />
              <meshStandardMaterial color={LACE} roughness={0.70} />
            </mesh>
          </group>
          {/* end RIGHT LEG */}

        </group>{/* end bodyBob */}
      </group>{/* end characterRef */}
    </RigidBody>
  );
}
