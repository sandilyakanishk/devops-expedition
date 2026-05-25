// ================================================================
// Environment.jsx — Low-Poly Mountain Trek (reference-matched)
// Mountain CONE shapes, flat walkable trail segments, stars/birds
// ================================================================
import { useRef, useMemo, useEffect, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, CylinderCollider, BallCollider } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getClayTexture } from '../utils/clayTexture.js';
import { getTerrainY, getPathCenterX, getPathPerpendicular } from '../utils/terrainMath.js';

// Retrieve procedural clay bump map
const clayBumpMap = getClayTexture();

// Helper Clay Material to give everything a hand-molded clay texture
const ClayMaterial = forwardRef(({ color, roughness = 0.92, metalness = 0.0, bumpScale = 0.015, ...props }, ref) => {
  return (
    <meshStandardMaterial
      ref={ref}
      color={color}
      roughness={roughness}
      metalness={metalness}
      bumpMap={clayBumpMap}
      bumpScale={bumpScale}
      {...props}
    />
  );
});

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return !!window.isMobileDevice || window.innerWidth <= 1024 || window.matchMedia?.('(pointer: coarse)').matches;
}

// ── Terrain math ──────────────────────────────────────────────────
const TRAIL_LENGTH = 185;

// ── Tiny geometry helpers ─────────────────────────────────────────
const Box = ({ pos, size, color, rot = [0,0,0], emissive, emissiveInt = 0.9, rough = 0.92, cast = true }) => (
  <mesh position={pos} rotation={rot} castShadow={cast} receiveShadow>
    <boxGeometry args={size} />
    <ClayMaterial color={color} roughness={rough}
      emissive={emissive || color} emissiveIntensity={emissive ? emissiveInt : 0} />
  </mesh>
);
const Cyl = ({ pos, args, color, rot = [0,0,0], rough = 0.92 }) => (
  <mesh position={pos} rotation={rot} castShadow>
    <cylinderGeometry args={args} />
    <ClayMaterial color={color} roughness={rough} />
  </mesh>
);


// ── Boulder ───────────────────────────────────────────────────────
function Boulder({ position, scale = 1, color = '#6b7280', cast = true }) {
  const r = useMemo(() => [Math.random()*0.6, Math.random()*2, Math.random()*0.4], []);
  return (
    <mesh position={position} rotation={r} scale={scale} castShadow={cast} receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <ClayMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

// ── Campfire ──────────────────────────────────────────────────────
function Campfire({ position, isNight }) {
  const flameRef = useRef();
  const glowRef  = useRef();
  const groupRef = useRef();
  const embers   = useRef([]);
  const [px, py, pz] = position;
  const transitionRef = useRef(isNight ? 1 : 0);

  useFrame((s, delta) => {
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(pz - pzVal);
    const cullDist = isMobileDevice() ? 35 : 70;
    if (dist > cullDist) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;

    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const tVal = transitionRef.current;

    const realT = s.clock.getElapsedTime();
    const t = Math.floor(realT * 12) / 12; // 12 FPS stop-motion
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t * 14) * 0.2;
      flameRef.current.rotation.y = t * 0.9;
    }
    if (glowRef.current) {
      const isNear = dist < 30;
      glowRef.current.visible = isNear;
      if (isNear) {
        const baseIntensity = 2 + tVal * 2;
        glowRef.current.intensity = baseIntensity + Math.sin(t * 15) * 0.7;
      }
    }
    embers.current.forEach((m, i) => {
      if (!m) return;
      m.position.y = 0.3 + ((t * (0.5 + i*0.15) + i) % 1.5) * 0.8;
      m.position.x = Math.sin(t * 2.8 + i * 1.3) * 0.2;
    });
  });

  return (
    <RigidBody type="fixed" position={[px, py, pz]}>
      <CuboidCollider args={[0.5, 0.3, 0.5]} position={[0, 0.15, 0]} />
      <group ref={groupRef}>
        {[0,60,120,180,240,300].map((deg, i) => (
          <mesh key={i} castShadow
            position={[Math.cos(deg*Math.PI/180)*0.4, 0.06, Math.sin(deg*Math.PI/180)*0.4]}
            rotation={[0, (deg+30)*Math.PI/180, Math.PI/2]}>
            <cylinderGeometry args={[0.07, 0.09, 0.8, 6]} />
            <ClayMaterial color="#5c3d1e" roughness={0.95} />
          </mesh>
        ))}
        {[0,45,90,135,180,225,270,315].map((deg, i) => (
          <mesh key={i} position={[Math.cos(deg*Math.PI/180)*0.55, 0.05, Math.sin(deg*Math.PI/180)*0.55]}>
            <dodecahedronGeometry args={[0.1, 0]} />
            <ClayMaterial color="#4b5563" roughness={0.9} />
          </mesh>
        ))}
        {[0,1,2,3].map(i => (
          <mesh key={i} ref={el => embers.current[i] = el} position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.024, 4, 4]} />
            <meshBasicMaterial color={i%2===0 ? '#ff6b00' : '#fbbf24'} />
          </mesh>
        ))}
        <mesh ref={flameRef} position={[0, 0.36, 0]}>
          <coneGeometry args={[0.22, 0.68, 8]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={2.5}
            transparent opacity={0.82} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.58, 0]}>
          <coneGeometry args={[0.12, 0.52, 6]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3}
            transparent opacity={0.7} depthWrite={false} />
        </mesh>
        {!isMobileDevice() && <pointLight ref={glowRef} color="#ff8c00" intensity={2.5} distance={10} />}
      </group>
    </RigidBody>
  );
}

// ── Tent ──────────────────────────────────────────────────────────
function Tent({ position, rotation = 0, color = '#92400e' }) {
  const [px, py, pz] = position;
  return (
    <RigidBody type="fixed" position={[px, py, pz]} rotation={[0, rotation, 0]}>
      <CuboidCollider args={[0.8, 0.8, 0.8]} position={[0, 0.8, 0]} />
      <group>
        <mesh castShadow>
          <coneGeometry args={[1.1, 1.6, 4]} />
          <ClayMaterial color={color} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.05, 0.95]}>
          <planeGeometry args={[0.55, 0.9]} />
          <ClayMaterial color="#292524" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// ── Wooden Hut ────────────────────────────────────────────────────
function WoodenHut({ position }) {
  const [px, py, pz] = position;
  return (
    <RigidBody type="fixed" position={[px, py, pz]}>
      <CuboidCollider args={[1.6, 1.2, 1.4]} position={[0, 1.2, 0]} />
      <group>
        <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
          <boxGeometry args={[3.2, 2.0, 2.8]} />
          <ClayMaterial color="#7c3d11" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 2.45, 0]}>
          <coneGeometry args={[2.5, 1.5, 4]} />
          <ClayMaterial color="#3b1f0a" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.6, 1.42]}>
          <boxGeometry args={[0.8, 1.4, 0.08]} />
          <ClayMaterial color="#451a03" roughness={0.95} />
        </mesh>
        {[-1, 1].map(s => (
          <mesh key={s} position={[s * 1.0, 1.1, 1.42]}>
            <boxGeometry args={[0.55, 0.55, 0.06]} />
            <ClayMaterial color="#bfdbfe" roughness={0.1} transparent opacity={0.7} />
          </mesh>
        ))}
        <mesh castShadow position={[0.9, 3.0, -0.4]}>
          <boxGeometry args={[0.38, 0.9, 0.38]} />
          <ClayMaterial color="#4b5563" roughness={0.9} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// ── Lantern Post ──────────────────────────────────────────────────
function LanternPost({ position, isNight }) {
  const lRef = useRef();
  const matRef = useRef();
  const groupRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const color1 = useMemo(() => new THREE.Color("#555555"), []);
  const color2 = useMemo(() => new THREE.Color("#fef08a"), []);
  const tempCol = useMemo(() => new THREE.Color(), []);

  useFrame((s, delta) => {
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(pz - pzVal);
    const cullDist = isMobileDevice() ? 30 : 60;
    if (dist > cullDist) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;

    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;

    if (lRef.current) {
      const isNear = dist < 25;
      lRef.current.visible = isNear;
      if (isNear) {
        const timeVal = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
        lRef.current.intensity = t * (5 + Math.sin(timeVal * 11) * 0.5);
      }
    }
    if (matRef.current) {
      tempCol.lerpColors(color1, color2, t);
      matRef.current.color.copy(tempCol);
      matRef.current.emissiveIntensity = t * 2.5;
      matRef.current.opacity = 0.4 + t * 0.52;
    }
  });

  const [px, py, pz] = position;
  return (
    <RigidBody type="fixed" position={[px, py, pz]}>
      <CylinderCollider args={[1.2, 0.05]} position={[0, 1.2, 0]} />
      <group ref={groupRef}>
        <Cyl pos={[0, 1.1, 0]} args={[0.04, 0.04, 2.4, 5]} color="#374151" />
        <mesh position={[0, 2.3, 0]} castShadow>
          <boxGeometry args={[0.28, 0.36, 0.28]} />
          <ClayMaterial color="#374151" roughness={0.5} metalness={0.5} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 2.3, 0]}>
          <boxGeometry args={[0.2, 0.28, 0.2]} />
          <ClayMaterial
            ref={matRef}
            color="#555555"
            emissive="#fbbf24"
            emissiveIntensity={0}
            transparent
            opacity={0.4}
            roughness={0.6}
          />
        </mesh>
        {!isMobileDevice() && <pointLight ref={lRef} position={[0, 2.3, 0]} color="#ff9f00" intensity={0} distance={12} />}
      </group>
    </RigidBody>
  );
}

// ── Fire Torch (Stair Lamp) ───────────────────────────────────────
function FireTorch({ position, isNight }) {
  const flameRef = useRef();
  const matRef = useRef();
  const lRef = useRef();
  const groupRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const color1 = useMemo(() => new THREE.Color("#27272a"), []);
  const color2 = useMemo(() => new THREE.Color("#ff7f00"), []);
  const emissive1 = useMemo(() => new THREE.Color("#000000"), []);
  const emissive2 = useMemo(() => new THREE.Color("#ff3300"), []);
  const tempCol = useMemo(() => new THREE.Color(), []);
  const tempEmissive = useMemo(() => new THREE.Color(), []);

  useFrame((s, delta) => {
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(pz - pzVal);
    const cullDist = isMobileDevice() ? 25 : 55;
    if (dist > cullDist) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;

    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;

    const timeVal = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
    if (flameRef.current) {
      const scaleY = 1 + Math.sin(timeVal * 12 + position[2]) * 0.15 * t;
      flameRef.current.scale.set(1, scaleY, 1);
    }
    if (matRef.current) {
      tempCol.lerpColors(color1, color2, t);
      tempEmissive.lerpColors(emissive1, emissive2, t);
      matRef.current.color.copy(tempCol);
      matRef.current.emissive.copy(tempEmissive);
      matRef.current.emissiveIntensity = t * 3;
      matRef.current.opacity = 1.0 - t * 0.1;
    }
    if (lRef.current) {
      const isNear = dist < 10;
      lRef.current.visible = isNear;
      if (isNear) {
        lRef.current.intensity = t * (2 + Math.sin(timeVal * 14 + position[2]) * 0.4);
      }
    }
  });

  const [px, py, pz] = position;
  return (
    <group ref={groupRef} position={[px, py, pz]}>
      {/* Wooden post */}
      <Cyl pos={[0, 0.4, 0]} args={[0.02, 0.025, 0.8, 5]} color="#7c3d11" />
      {/* Metal bracket / bowl holder */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.06, 0.03, 0.08, 6]} />
        <ClayMaterial color="#374151" roughness={0.6} metalness={0.6} />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[0, 0.9, 0]}>
        <coneGeometry args={[0.05, 0.18, 5]} />
        <meshStandardMaterial
          ref={matRef}
          color="#27272a"
          emissive="#000000"
          emissiveIntensity={0}
          transparent
          opacity={1.0}
        />
      </mesh>
      {!isMobileDevice() && (
        <pointLight ref={lRef} position={[0, 0.9, 0]} color="#ff7f00" intensity={0} distance={8} />
      )}
    </group>
  );
}

// ── Wooden Sign ───────────────────────────────────────────────────
function WoodenSign({ position, text, rotation = 0 }) {
  const [px, py, pz] = position;
  return (
    <RigidBody type="fixed" position={[px, py, pz]} rotation={[0, rotation, 0]}>
      <CuboidCollider args={[0.5, 0.7, 0.1]} position={[0, 0.7, 0]} />
      <group>
        <Cyl pos={[0, 0.55, 0]} args={[0.04, 0.05, 1.1, 5]} color="#92400e" />
        <mesh castShadow position={[0, 1.18, 0]}>
          <boxGeometry args={[1.0, 0.46, 0.1]} />
          <ClayMaterial color="#7c3d11" roughness={0.9} />
        </mesh>
        <Html position={[0, 1.18, 0]} center distanceFactor={6} style={{pointerEvents:'none'}}>
          <div style={{
            color:'#fef3c7', fontFamily:"'Outfit',sans-serif",
            fontSize:'9px', fontWeight:700, letterSpacing:'0.06em',
            textShadow:'0 1px 2px rgba(0,0,0,0.8)', whiteSpace:'nowrap',
          }}>{text}</div>
        </Html>
      </group>
    </RigidBody>
  );
}

// ════════════════════════════════════════════════════════════════
// MOUNTAIN BODY — cone-based low-poly mountain (like the reference)
// ════════════════════════════════════════════════════════════════
function MountainBody({ isNight, season }) {
  const grassMatRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);
  const color1 = useMemo(() => {
    if (season === 'winter') return new THREE.Color('#f0f9ff');
    if (season === 'autumn') return new THREE.Color('#c2410c');
    return new THREE.Color('#22c55e');
  }, [season]);
  const color2 = useMemo(() => {
    if (season === 'winter') return new THREE.Color('#cbd5e1');
    if (season === 'autumn') return new THREE.Color('#7c2d12');
    return new THREE.Color('#14532d');
  }, [season]);
  const tempCol = useMemo(() => new THREE.Color(), []);

  useFrame((s, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    if (grassMatRef.current) {
      tempCol.lerpColors(color1, color2, t);
      grassMatRef.current.color.copy(tempCol);
    }
  });

  const rockCol  = '#4b5563';
  const darkRock = '#374151';
  const snowCol  = '#e2e8f0';

  return (
    <group>
      {/* ── Wide green base cone ── */}
      <mesh castShadow receiveShadow position={[0, -4, -92]}>
        <coneGeometry args={[58, 22, 32]} />
        <ClayMaterial ref={grassMatRef} color="#22c55e" roughness={0.92} />
      </mesh>

      {/* ── Mid mountain rocky body ── */}
      <mesh castShadow position={[0, 12, -100]}>
        <coneGeometry args={[40, 28, 32]} />
        <ClayMaterial color={rockCol} roughness={0.94} />
      </mesh>

      {/* ── Upper rocky section ── */}
      <mesh castShadow position={[0, 24, -112]}>
        <coneGeometry args={[26, 26, 32]} />
        <ClayMaterial color={darkRock} roughness={0.95} />
      </mesh>

      {/* ── Near-summit grey rocky peak ── */}
      <mesh castShadow position={[0, 34, -125]}>
        <coneGeometry args={[16, 22, 32]} />
        <ClayMaterial color="#6b7280" roughness={0.9} />
      </mesh>

      {/* ── Snow/ice sections (like the reference) ── */}
      {[
        [-8, 40, -138], [7, 42, -142], [0, 47, -150],
        [-5, 44, -155], [4, 49, -158],
      ].map(([x, y, z], i) => (
        <mesh key={i} castShadow position={[x, y, z]}>
          <coneGeometry args={[10-i*1.4, 14-i*1.2, 32]} />
          <ClayMaterial color={snowCol} roughness={0.8} />
        </mesh>
      ))}

      {/* ── Rocky outcrops on sides (irregular low-poly chunks) ── */}
      {[
        [-18, 4,  -40],  [-22, 7,  -65],  [-16, 10, -95],
        [-20, 16, -120], [-14, 20, -145],
        [ 16, 3,  -30],  [ 20, 6,  -60],  [ 18, 12, -90],
        [ 22, 18, -118], [ 16, 22, -148],
      ].map(([x, y, z], i) => (
        <mesh key={i} castShadow position={[x, y, z]}
          rotation={[0, i * 0.7, 0]}>
          <dodecahedronGeometry args={[5 + (i%3)*2, 2]} />
          <ClayMaterial color={i > 4 ? darkRock : rockCol} roughness={0.96} />
        </mesh>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// SURROUNDING MOUNTAINS — cone shapes on both sides (no wall blocks)
// ════════════════════════════════════════════════════════════════
function SurroundingMountains({ isNight, season }) {
  const grassMatRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);
  const color1 = useMemo(() => {
    if (season === 'winter') return new THREE.Color('#e2e8f0');
    if (season === 'autumn') return new THREE.Color('#b45309');
    return new THREE.Color('#16a34a');
  }, [season]);
  const color2 = useMemo(() => {
    if (season === 'winter') return new THREE.Color('#94a3b8');
    if (season === 'autumn') return new THREE.Color('#78350f');
    return new THREE.Color('#14532d');
  }, [season]);
  const tempCol = useMemo(() => new THREE.Color(), []);

  useFrame((s, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    if (grassMatRef.current) {
      tempCol.lerpColors(color1, color2, t);
      grassMatRef.current.color.copy(tempCol);
    }
  });

  const mountains = [
    // Left side
    { pos: [-30, 2,  -25],  r: 14, h: 30, rocky: false },
    { pos: [-42, 8,  -55],  r: 18, h: 48, rocky: true  },
    { pos: [-35, 14, -88],  r: 20, h: 58, rocky: true  },
    { pos: [-48, 18, -125], r: 22, h: 65, rocky: true  },
    { pos: [-30, 10, -158], r: 15, h: 42, rocky: true  },
    { pos: [-55, 5,  -80],  r: 12, h: 38, rocky: false },
    // Right side
    { pos: [ 28, 1,  -18],  r: 12, h: 28, rocky: false },
    { pos: [ 38, 6,  -50],  r: 16, h: 44, rocky: true  },
    { pos: [ 32, 12, -82],  r: 18, h: 52, rocky: true  },
    { pos: [ 44, 16, -118], r: 20, h: 60, rocky: true  },
    { pos: [ 28, 8,  -152], r: 14, h: 38, rocky: false },
    { pos: [ 50, 4,  -70],  r: 13, h: 40, rocky: true  },
  ];

  return (
    <group>
      {mountains.map((m, i) => (
        <group key={i} position={m.pos}>
          {/* Green base */}
          <mesh receiveShadow>
            <coneGeometry args={[m.r * 1.6, m.h * 0.38, 32]} />
            <ClayMaterial ref={grassMatRef} color="#16a34a" roughness={0.92} />
          </mesh>
          {/* Rocky body */}
          <mesh position={[0, m.h * 0.25, 0]}>
            <coneGeometry args={[m.r * 0.95, m.h * 0.68, 32]} />
            <ClayMaterial color={m.rocky ? '#374151' : '#4b5563'} roughness={0.94} />
          </mesh>
          {/* Snow cap on tall ones */}
          {m.h > 40 && (
            <mesh position={[0, m.h * 0.62, 0]}>
              <coneGeometry args={[m.r * 0.35, m.h * 0.22, 32]} />
              <ClayMaterial color="#e2e8f0" roughness={0.82} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// WALKABLE TRAIL — 80 FLAT segments, no rotation = no physics bug
// Each segment height-steps only 0.375 units (barely noticeable)
// ════════════════════════════════════════════════════════════════
function WalkableTrail({ isNight, season }) {
  const SEG_COUNT = 80;
  const SEG_STEP  = TRAIL_LENGTH / SEG_COUNT;   // 2.3125 z-units per seg
  const SEG_WIDTH = 7;                           // walkable width
  const HALF_H    = 0.4;

  const dirtC  = '#92400e';

  // 1. Calculate the curved, steep path segments
  const trailSegments = useMemo(() => {
    const arr = [];
    for (let i = 0; i < SEG_COUNT; i++) {
      const zStart = -i * SEG_STEP;
      const zEnd = -(i + 1) * SEG_STEP;
      const zMid = (zStart + zEnd) / 2;
      const xMid = getPathCenterX(zMid);
      const yMid = getTerrainY(zMid);
      
      const dx = getPathCenterX(zEnd) - getPathCenterX(zStart);
      const dz = zEnd - zStart;
      const dy = getTerrainY(zEnd) - getTerrainY(zStart);
      const len = Math.hypot(dx, dy, dz);
      
      const yaw = Math.atan2(dx, dz);
      const pitch = -Math.atan2(dy, Math.hypot(dx, dz));
      
      // Determine segment color based on season and zone
      const t = (i + 0.5) / SEG_COUNT;
      let color = '#22c55e'; // grass
      let isDirt = true;
      
      if (season === 'winter') {
        color = '#f0f9ff'; // all snow
        isDirt = false;
      } else if (season === 'autumn') {
        isDirt = true;
        if (t > 0.88) {
          color = '#f0f9ff'; // snow peak
          isDirt = false;
        } else if (t > 0.66) {
          color = '#78716c'; // rock
          isDirt = false;
        } else {
          color = '#b45309'; // autumn orange/brown grass
        }
      } else { // summer
        if (t > 0.88) {
          color = '#f0f9ff'; // snow
          isDirt = false;
        } else if (t > 0.66) {
          color = '#6b7280'; // rock
          isDirt = false;
        }
      }
      
      arr.push({ x: xMid, y: yMid, z: zMid, len, yaw, pitch, color, isDirt });
    }
    return arr;
  }, [season, SEG_STEP]);

  // 2. Trail Rocks
  const trailRocks = useMemo(() => {
    const arr = [];
    const SEG_DEPTH = SEG_STEP + 1.8;
    for (let i = 0; i < SEG_COUNT; i++) {
      const t = (i + 0.5) / SEG_COUNT;
      if (t > 0.88) continue;
      const z = -(i + 0.5) * SEG_STEP;
      const cy = getTerrainY(z);
      const cx = getPathCenterX(z);
      const { px, pz } = getPathPerpendicular(z);
      const y = cy + 0.43;

      const r1 = Math.abs(Math.sin(i * 18.23));
      const r2 = Math.abs(Math.cos(i * 27.54));
      const r3 = Math.abs(Math.sin(i * 38.82));
      const r4 = Math.abs(Math.cos(i * 49.19));

      const rock1_local_x = (r1 - 0.5) * 2.2;
      const rock1_x = cx + rock1_local_x * px;
      const rock1_z = z + rock1_local_x * pz + (r2 - 0.5) * SEG_DEPTH * 0.2;
      const rock1_scale = 0.42 + r1 * 0.38;
      const rock1_rot = r2 * Math.PI;

      const rock2_local_x = (r3 - 0.5) * 2.2;
      const rock2_x = cx + rock2_local_x * px;
      const rock2_z = z + rock2_local_x * pz + (r4 - 0.5) * SEG_DEPTH * 0.2;
      const rock2_scale = 0.38 + r3 * 0.38;
      const rock2_rot = r4 * Math.PI;

      const color1 = r1 > 0.66 ? '#57534e' : r1 > 0.33 ? '#78716c' : '#44403c';
      const color2 = r3 > 0.66 ? '#78716c' : r3 > 0.33 ? '#44403c' : '#57534e';

      arr.push({ x: rock1_x, y, z: rock1_z, scale: rock1_scale, rot: rock1_rot, color: color1 });
      arr.push({ x: rock2_x, y, z: rock2_z, scale: rock2_scale, rot: rock2_rot, color: color2 });
    }
    return arr;
  }, [SEG_STEP]);

  // 3. Pebbles
  const pebbles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      const z   = -3 - i * 3.1;
      const cx  = getPathCenterX(z);
      const cy  = getTerrainY(z);
      const { px, pz } = getPathPerpendicular(z);
      const ty  = cy + 0.12;
      const side = i % 2 === 0 ? 1 : -1;
      const scale = 0.1 + (i % 4) * 0.04;
      const offset = side * (1.9 + (i % 4) * 0.35);
      arr.push({
        x: cx + offset * px,
        y: ty,
        z: z + offset * pz,
        scale,
      });
    }
    return arr;
  }, []);

  // 4. Snow patches
  const snowPatches = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const z  = -108 - i * 6.5;
      const cx = getPathCenterX(z);
      const cy = getTerrainY(z);
      const { px, pz } = getPathPerpendicular(z);
      const ty = cy + 0.44;
      const offset = (i % 2 === 0 ? 2.8 : -2.8);
      arr.push({
        x: cx + offset * px,
        y: ty,
        z: z + offset * pz,
      });
    }
    return arr;
  }, []);

  // 5. Fences
  const fencesData = useMemo(() => {
    const posts = [];
    const rails = [];
    const step = 5.0;
    const count = Math.ceil(TRAIL_LENGTH / step);
    
    // Compute posts
    for (let i = 0; i <= count; i++) {
      const zVal = -i * step;
      if (zVal < -185) continue;
      
      const cx = getPathCenterX(zVal);
      const cy = getTerrainY(zVal);
      const { px, pz } = getPathPerpendicular(zVal);
      
      const wHalf = SEG_WIDTH / 2;
      
      // Left post
      posts.push({
        x: cx - px * wHalf,
        y: cy + 0.4 + 0.5,
        z: zVal - pz * wHalf
      });
      // Right post
      posts.push({
        x: cx + px * wHalf,
        y: cy + 0.4 + 0.5,
        z: zVal + pz * wHalf
      });
    }
    
    // Compute rails connecting posts
    for (let i = 0; i < posts.length - 2; i += 2) {
      const pLeft1 = posts[i];
      const pLeft2 = posts[i + 2];
      const pRight1 = posts[i + 1];
      const pRight2 = posts[i + 3];
      
      const addRail = (p1, p2, heightOffset) => {
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2 + heightOffset;
        const mz = (p1.z + p2.z) / 2;
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dy, dz);
        
        const yaw = Math.atan2(dx, dz);
        const pitch = -Math.atan2(dy, Math.hypot(dx, dz));
        
        rails.push({ x: mx, y: my, z: mz, yaw, pitch, len });
      };
      
      // Left side rails
      addRail(pLeft1, pLeft2, 0.25);
      addRail(pLeft1, pLeft2, -0.1);
      
      // Right side rails
      addRail(pRight1, pRight2, 0.25);
      addRail(pRight1, pRight2, -0.1);
    }
    
    return { posts, rails };
  }, []);

  const trailBaseRef = useRef();
  const trailDirtRef = useRef();
  const trailRocksRef = useRef();
  const pebblesRef = useRef();
  const snowPatchesRef = useRef();
  const fencePostsRef = useRef();
  const fenceRailsRef = useRef();

  const initializedTrailRef = useRef(false);
  const initializedRocksRef = useRef(false);
  const initializedFenceRef = useRef(false);

  useEffect(() => {
    initializedTrailRef.current = false;
  }, [season]);

  useFrame(() => {
    // 1. Initialize Trail base & dirt path matrices
    if (!initializedTrailRef.current && trailBaseRef.current && trailDirtRef.current) {
      const tempObj = new THREE.Object3D();
      const tempColor = new THREE.Color();
      
      trailSegments.forEach((seg, idx) => {
        // Base
        tempObj.position.set(seg.x, seg.y, seg.z);
        tempObj.rotation.set(seg.pitch, seg.yaw, 0);
        tempObj.scale.set(1, 1, seg.len);
        tempObj.updateMatrix();
        trailBaseRef.current.setMatrixAt(idx, tempObj.matrix);
        
        tempColor.set(seg.color);
        trailBaseRef.current.setColorAt(idx, tempColor);

        // Dirt
        if (seg.isDirt) {
          const localY = HALF_H + 0.005;
          const parentMatrix = new THREE.Matrix4().compose(
            new THREE.Vector3(seg.x, seg.y, seg.z),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(seg.pitch, seg.yaw, 0)),
            new THREE.Vector3(1, 1, seg.len)
          );
          
          tempObj.position.set(0, localY, 0);
          tempObj.rotation.set(0, 0, 0);
          tempObj.scale.set(1, 1, 1);
          tempObj.updateMatrix();
          
          const worldMatrix = parentMatrix.multiply(tempObj.matrix);
          trailDirtRef.current.setMatrixAt(idx, worldMatrix);
        } else {
          tempObj.position.set(0, -999, 0);
          tempObj.scale.set(0, 0, 0);
          tempObj.updateMatrix();
          trailDirtRef.current.setMatrixAt(idx, tempObj.matrix);
        }
      });
      
      trailBaseRef.current.instanceMatrix.needsUpdate = true;
      if (trailBaseRef.current.instanceColor) {
        trailBaseRef.current.instanceColor.needsUpdate = true;
      }
      trailDirtRef.current.instanceMatrix.needsUpdate = true;
      initializedTrailRef.current = true;
    }

    // 2. Initialize Rocks, Pebbles, and Snow Patches
    if (!initializedRocksRef.current && trailRocksRef.current && pebblesRef.current && snowPatchesRef.current) {
      const tempObj = new THREE.Object3D();
      const tempColor = new THREE.Color();

      // Rocks
      trailRocks.forEach((rock, idx) => {
        tempObj.position.set(rock.x, rock.y, rock.z);
        tempObj.rotation.set(0.04, rock.rot, 0.04);
        tempObj.scale.set(rock.scale * 1.6, 0.08, rock.scale);
        tempObj.updateMatrix();
        trailRocksRef.current.setMatrixAt(idx, tempObj.matrix);

        tempColor.set(rock.color);
        trailRocksRef.current.setColorAt(idx, tempColor);
      });
      trailRocksRef.current.instanceMatrix.needsUpdate = true;
      if (trailRocksRef.current.instanceColor) {
        trailRocksRef.current.instanceColor.needsUpdate = true;
      }

      // Pebbles
      pebbles.forEach((p, idx) => {
        tempObj.position.set(p.x, p.y, p.z);
        tempObj.rotation.set(0, idx * 0.8, 0);
        tempObj.scale.setScalar(p.scale);
        tempObj.updateMatrix();
        pebblesRef.current.setMatrixAt(idx, tempObj.matrix);
      });
      pebblesRef.current.instanceMatrix.needsUpdate = true;

      // Snow Patches
      snowPatches.forEach((p, idx) => {
        if (season === 'winter') {
          tempObj.position.set(0, -999, 0);
          tempObj.scale.set(0, 0, 0);
        } else {
          tempObj.position.set(p.x, p.y, p.z);
          tempObj.scale.set(2.2, 0.08, 1.5);
        }
        tempObj.updateMatrix();
        snowPatchesRef.current.setMatrixAt(idx, tempObj.matrix);
      });
      snowPatchesRef.current.instanceMatrix.needsUpdate = true;

      initializedRocksRef.current = true;
    }

    // 3. Initialize Fences
    if (!initializedFenceRef.current && fencePostsRef.current && fenceRailsRef.current) {
      const tempObj = new THREE.Object3D();
      
      fencesData.posts.forEach((p, idx) => {
        tempObj.position.set(p.x, p.y, p.z);
        tempObj.rotation.set(0, 0, 0);
        tempObj.scale.set(1, 1, 1);
        tempObj.updateMatrix();
        fencePostsRef.current.setMatrixAt(idx, tempObj.matrix);
      });
      fencePostsRef.current.instanceMatrix.needsUpdate = true;
      
      fencesData.rails.forEach((r, idx) => {
        tempObj.position.set(r.x, r.y, r.z);
        tempObj.rotation.set(r.pitch, r.yaw, 0);
        tempObj.scale.set(1, 1, r.len / 5.0); // since base box geometry has length 5.0
        tempObj.updateMatrix();
        fenceRailsRef.current.setMatrixAt(idx, tempObj.matrix);
      });
      fenceRailsRef.current.instanceMatrix.needsUpdate = true;
      
      initializedFenceRef.current = true;
    }
  });

  return (
    <group>
      {/* Curved, sloped segment colliders for physics */}
      <RigidBody type="fixed">
        {trailSegments.map((seg, i) => (
          <group key={i} position={[seg.x, seg.y, seg.z]} rotation={[seg.pitch, seg.yaw, 0]}>
            {/* Path floor */}
            <CuboidCollider args={[SEG_WIDTH / 2, HALF_H, seg.len / 2]} />
            {/* Left side barricade collider */}
            <CuboidCollider position={[-SEG_WIDTH / 2 - 0.1, 0.8, 0]} args={[0.1, 0.8, seg.len / 2]} />
            {/* Right side barricade collider */}
            <CuboidCollider position={[SEG_WIDTH / 2 + 0.1, 0.8, 0]} args={[0.1, 0.8, seg.len / 2]} />
          </group>
        ))}
        {/* Summit end wall collider */}
        <CuboidCollider position={[getPathCenterX(-185), getTerrainY(-185) + 1.2, -185]} args={[SEG_WIDTH / 2, 2.0, 0.2]} />
      </RigidBody>

      {/* Instanced path base */}
      <instancedMesh ref={trailBaseRef} args={[null, null, SEG_COUNT]} receiveShadow frustumCulled={false}>
        <boxGeometry args={[SEG_WIDTH, HALF_H * 2, 1]} />
        <ClayMaterial roughness={0.92} />
      </instancedMesh>

      {/* Instanced path center dirt */}
      <instancedMesh ref={trailDirtRef} args={[null, null, SEG_COUNT]} receiveShadow frustumCulled={false}>
        <boxGeometry args={[3.2, 0.06, 1]} />
        <ClayMaterial color={dirtC} roughness={0.97} />
      </instancedMesh>

      {/* Instanced fences posts */}
      <instancedMesh ref={fencePostsRef} args={[null, null, fencesData.posts.length]} castShadow receiveShadow frustumCulled={false}>
        <cylinderGeometry args={[0.06, 0.07, 1.0, 5]} />
        <ClayMaterial color="#5c3d1e" roughness={0.9} />
      </instancedMesh>

      {/* Instanced fences rails */}
      <instancedMesh ref={fenceRailsRef} args={[null, null, fencesData.rails.length]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[0.04, 0.08, 5.0]} />
        <ClayMaterial color="#7c3d11" roughness={0.92} />
      </instancedMesh>

      {/* Instanced trail rocks */}
      <instancedMesh ref={trailRocksRef} args={[null, null, trailRocks.length]} receiveShadow frustumCulled={false}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <ClayMaterial roughness={0.96} />
      </instancedMesh>

      {/* Instanced path-edge pebbles */}
      <instancedMesh ref={pebblesRef} args={[null, null, pebbles.length]} castShadow frustumCulled={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <ClayMaterial color="#78716c" roughness={0.95} />
      </instancedMesh>

      {/* Instanced snow patches */}
      <instancedMesh ref={snowPatchesRef} args={[null, null, snowPatches.length]} receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <ClayMaterial color="#f0f9ff" roughness={0.85} />
      </instancedMesh>

      {/* Summit visual barricade */}
      <group position={[getPathCenterX(-185), getTerrainY(-185) + 0.4, -185]}>
        {/* Horizontal log barrier */}
        <Box pos={[0, 0.8, 0]} size={[7.2, 0.15, 0.15]} color="#92400e" />
        <Box pos={[0, 0.4, 0]} size={[7.2, 0.15, 0.15]} color="#92400e" />
        {/* Support posts */}
        {[-3.5, -1.75, 0, 1.75, 3.5].map((x, i) => (
          <Cyl key={i} pos={[x, 0.5, 0]} args={[0.07, 0.08, 1.0, 5]} color="#7c3d11" />
        ))}
        {/* Large boulders piled at the base/sides */}
        {[-3.0, 0, 3.0].map((x, i) => (
          <Boulder key={i} position={[x, 0.4, 0.2]} scale={2.0} color="#9ca3af" />
        ))}
      </group>

      {/* Torches spaced along the trail */}
      {Array.from({ length: 16 }).map((_, i) => {
        const segIdx = i * 5;
        const z = -(segIdx + 0.5) * SEG_STEP;
        const cx = getPathCenterX(z);
        const cy = getTerrainY(z);
        const { px, pz } = getPathPerpendicular(z);
        
        const side = segIdx % 2 === 0 ? 1 : -1;
        const offset = side * 3.8;
        
        const tx = cx + offset * px;
        const ty = cy + 0.4;
        const tz = z + offset * pz;

        // Expose fewer lights/meshes on mobile
        if (isMobileDevice() && segIdx % 15 !== 0) return null;

        return (
          <FireTorch key={i} position={[tx, ty, tz]} isNight={isNight} />
        );
      })}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// FOREST — trees and boulders on mountain slopes
// ════════════════════════════════════════════════════════════════
function ForestDecorations({ season }) {
  const trees = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 110; i++) {
      const z     = -1 - i * 1.72;
      if (z <= -165) continue;
      const cx    = getPathCenterX(z);
      const ty    = getTerrainY(z);
      const { px, pz } = getPathPerpendicular(z);
      const side  = i % 2 === 0 ? -1 : 1;
      const dist  = 4.5 + (i % 5) * 1.8;
      const scale = 0.65 + (i % 4) * 0.25;
      arr.push({ x: cx + side * dist * px, y: ty, z: z + side * dist * pz, scale });
    }
    return arr;
  }, []);

  const boulders = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 65; i++) {
      const z  = -2 - i * 2.9;
      const cx = getPathCenterX(z);
      const ty = getTerrainY(z);
      const { px, pz } = getPathPerpendicular(z);
      const side = i%3===0 ? 1 : (i%3===1 ? -1 : (i%5<2?1:-1));
      const dist = 2.8 + (i%5)*0.9;
      arr.push({
        x: cx + side * dist * px,
        y: ty + 0.12,
        z: z + side * dist * pz,
        scale: 0.5 + (i%4)*0.22,
        color: i > 48 ? '#9ca3af' : '#4b5563',
      });
    }
    return arr;
  }, []);

  const trunkRef = useRef();
  const cone1Ref = useRef();
  const cone2Ref = useRef();
  const cone3Ref = useRef();
  const boulderRef = useRef();

  const initializedRef = useRef(false);

  // Re-run tree/boulder positioning on season changes or initial render
  useEffect(() => {
    initializedRef.current = false;
  }, [season]);

  useFrame(() => {
    if (initializedRef.current) return;
    if (!trunkRef.current || !cone1Ref.current || !cone2Ref.current || !cone3Ref.current || !boulderRef.current) return;

    const tempObj = new THREE.Object3D();

    // Populate trees
    trees.forEach((t, i) => {
      tempObj.position.set(t.x, t.y + 0.55 * t.scale, t.z);
      tempObj.rotation.set(0, (i * 0.5) % (Math.PI * 2), 0);
      tempObj.scale.set(t.scale, t.scale, t.scale);
      tempObj.updateMatrix();
      trunkRef.current.setMatrixAt(i, tempObj.matrix);

      tempObj.position.set(t.x, t.y + 1.4 * t.scale, t.z);
      tempObj.updateMatrix();
      cone1Ref.current.setMatrixAt(i, tempObj.matrix);

      tempObj.position.set(t.x, t.y + 2.1 * t.scale, t.z);
      tempObj.updateMatrix();
      cone2Ref.current.setMatrixAt(i, tempObj.matrix);

      tempObj.position.set(t.x, t.y + 2.7 * t.scale, t.z);
      tempObj.updateMatrix();
      cone3Ref.current.setMatrixAt(i, tempObj.matrix);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    cone1Ref.current.instanceMatrix.needsUpdate = true;
    cone2Ref.current.instanceMatrix.needsUpdate = true;
    cone3Ref.current.instanceMatrix.needsUpdate = true;

    // Populate boulders
    const tempColor = new THREE.Color();
    boulders.forEach((b, i) => {
      tempObj.position.set(b.x, b.y, b.z);
      tempObj.rotation.set((i * 0.23) % 0.6, (i * 0.77) % 2, (i * 0.15) % 0.4);
      tempObj.scale.set(b.scale, b.scale, b.scale);
      tempObj.updateMatrix();
      boulderRef.current.setMatrixAt(i, tempObj.matrix);

      tempColor.set(b.color);
      boulderRef.current.setColorAt(i, tempColor);
    });

    boulderRef.current.instanceMatrix.needsUpdate = true;
    initializedRef.current = true;
  });

  const colLeaves1 = useMemo(() => {
    if (season === 'winter') return '#cbd5e1'; // snow covered light-grey/white
    if (season === 'autumn') return '#c2410c'; // autumn orange-red
    return '#2d6a4f'; // summer green
  }, [season]);

  const colLeaves2 = useMemo(() => {
    if (season === 'winter') return '#e2e8f0';
    if (season === 'autumn') return '#d97706'; // gold yellow
    return '#1b4332';
  }, [season]);

  const colLeaves3 = useMemo(() => {
    if (season === 'winter') return '#cbd5e1';
    if (season === 'autumn') return '#7c2d12'; // crimson red/brown
    return '#166534';
  }, [season]);

  return (
    <group>
      {/* Pine Trunks */}
      <instancedMesh ref={trunkRef} args={[null, null, trees.length]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[0.1, 0.14, 1.1, 32]} />
        <ClayMaterial color="#5c3d1e" roughness={0.95} />
      </instancedMesh>

      {/* Pine Cone 1 */}
      <instancedMesh ref={cone1Ref} args={[null, null, trees.length]} castShadow frustumCulled={false}>
        <coneGeometry args={[0.72, 1.5, 32]} />
        <ClayMaterial color={colLeaves1} roughness={0.85} />
      </instancedMesh>

      {/* Pine Cone 2 */}
      <instancedMesh ref={cone2Ref} args={[null, null, trees.length]} castShadow frustumCulled={false}>
        <coneGeometry args={[0.5, 1.1, 32]} />
        <ClayMaterial color={colLeaves2} roughness={0.88} />
      </instancedMesh>

      {/* Pine Cone 3 */}
      <instancedMesh ref={cone3Ref} args={[null, null, trees.length]} castShadow frustumCulled={false}>
        <coneGeometry args={[0.3, 0.8, 32]} />
        <ClayMaterial color={colLeaves3} roughness={0.9} />
      </instancedMesh>

      {/* Boulders */}
      <instancedMesh ref={boulderRef} args={[null, null, boulders.length]} castShadow receiveShadow frustumCulled={false}>
        <dodecahedronGeometry args={[0.5, 2]} />
        <ClayMaterial roughness={0.95} />
      </instancedMesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// FLOWING STREAM / RIVER
// ════════════════════════════════════════════════════════════════
function FlowingStream({ isNight }) {
  // Stream trajectory points running downwards on the right side of the trail
  const STREAM_POINTS = useMemo(() => {
    const zs = [-170, -150, -130, -110, -90, -70, -50, -30, -15, -5, 5];
    return zs.map(z => {
      const cx = getPathCenterX(z);
      const cy = getTerrainY(z);
      const { px, pz } = getPathPerpendicular(z);
      // Shift to the right side of the trail (approx 8.5 units)
      const offset = 8.5;
      return {
        x: cx + offset * px,
        y: cy - 0.1,
        z: z + offset * pz
      };
    });
  }, []);

  // Stream rocks: character-height (scale ~2.2 -> diameter 2.2 units, matching character height of 1.5 units)
  const STREAM_ROCKS = useMemo(() => {
    const zs = [-140, -100, -80, -45, -8, 2];
    return zs.map((z, idx) => {
      const cx = getPathCenterX(z);
      const cy = getTerrainY(z);
      const { px, pz } = getPathPerpendicular(z);
      const offset = 8.0;
      const scale = 2.1 + (idx % 3) * 0.15;
      return {
        x: cx + offset * px,
        y: cy - 0.1,
        z: z + offset * pz,
        scale
      };
    });
  }, []);

  // Generate procedural seamless water texture
  const waterTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Light blue base
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw some white wavy flow lines
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const y = i * 42 + 20;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(64, y - 15, 192, y + 15, 256, y);
      ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 4);
    return tex;
  }, []);

  // Generate a separate still water texture
  const stillTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1d4ed8'; // deeper calm blue
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const y = i * 64 + 32;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(64, y - 5, 192, y + 5, 256, y);
      ctx.stroke();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }, []);

  // Scroll flowing texture
  useFrame((state) => {
    const realT = state.clock.getElapsedTime();
    const t = Math.floor(realT * 12) / 12; // 12 FPS stop-motion
    waterTexture.offset.y = t * 0.35;
    stillTexture.offset.y = -t * 0.05; // very slow ripple
    stillTexture.offset.x = Math.sin(t * 0.2) * 0.02;
  });

  // Generate smooth, continuous, curvy river water & bed geometries from points
  const { waterGeometry, bedGeometry, bankRocks } = useMemo(() => {
    const curvePoints = STREAM_POINTS.slice(0, 10).map(p => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(curvePoints);

    const N = 100;
    const vertices = [];
    const uvs = [];
    const indices = [];

    const bedVertices = [];
    const bedUvs = [];
    const bedIndices = [];

    const rocks = [];

    let cumulativeDistance = 0;
    const tempPt = new THREE.Vector3();
    const prevPt = new THREE.Vector3();

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      curve.getPointAt(t, tempPt);

      if (i > 0) {
        cumulativeDistance += tempPt.distanceTo(prevPt);
      }
      prevPt.copy(tempPt);

      const tangent = curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const widthVar = Math.sin(t * Math.PI * 6) * 0.25;
      const waterWidth = 2.4 + widthVar;
      const bedWidth = waterWidth + 0.6;

      const lateralWavy = Math.sin(t * Math.PI * 12) * 0.2;
      const wavyOffset = normal.clone().multiplyScalar(lateralWavy);

      const wL = new THREE.Vector3().addVectors(tempPt, normal.clone().multiplyScalar(-waterWidth / 2)).add(wavyOffset);
      const wR = new THREE.Vector3().addVectors(tempPt, normal.clone().multiplyScalar(waterWidth / 2)).add(wavyOffset);

      const bL = new THREE.Vector3().addVectors(tempPt, normal.clone().multiplyScalar(-bedWidth / 2)).add(wavyOffset);
      const bR = new THREE.Vector3().addVectors(tempPt, normal.clone().multiplyScalar(bedWidth / 2)).add(wavyOffset);

      bL.y -= 0.12;
      bR.y -= 0.12;

      wL.y += 0.04;
      wR.y += 0.04;

      vertices.push(wL.x, wL.y, wL.z);
      vertices.push(wR.x, wR.y, wR.z);
      uvs.push(0, cumulativeDistance * 0.08);
      uvs.push(1, cumulativeDistance * 0.08);

      bedVertices.push(bL.x, bL.y, bL.z);
      bedVertices.push(bR.x, bR.y, bR.z);
      bedUvs.push(0, cumulativeDistance * 0.05);
      bedUvs.push(1, cumulativeDistance * 0.05);

      if (i < N) {
        const v0 = 2 * i;
        const v1 = 2 * i + 1;
        const v2 = 2 * (i + 1);
        const v3 = 2 * (i + 1) + 1;

        indices.push(v0, v1, v2);
        indices.push(v1, v3, v2);

        bedIndices.push(v0, v1, v2);
        bedIndices.push(v1, v3, v2);
      }

      if (i % 3 === 0 && i < N) {
        const rScaleL = 0.5 + Math.abs(Math.sin(i * 1.5)) * 0.45;
        const rScaleR = 0.5 + Math.abs(Math.cos(i * 1.1)) * 0.45;

        const posL = new THREE.Vector3().addVectors(tempPt, normal.clone().multiplyScalar(-waterWidth / 2 - 0.15)).add(wavyOffset);
        posL.y += 0.02;

        const posR = new THREE.Vector3().addVectors(tempPt, normal.clone().multiplyScalar(waterWidth / 2 + 0.15)).add(wavyOffset);
        posR.y += 0.02;

        rocks.push({
          pos: [posL.x, posL.y, posL.z],
          scale: posL.z > 0 ? rScaleL * 0.75 : rScaleL,
          color: i % 2 === 0 ? '#4b5563' : '#555555'
        });

        rocks.push({
          pos: [posR.x, posR.y, posR.z],
          scale: posR.z > 0 ? rScaleR * 0.75 : rScaleR,
          color: i % 2 === 1 ? '#4b5563' : '#555555'
        });
      }
    }

    const wGeom = new THREE.BufferGeometry();
    wGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    wGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    wGeom.setIndex(indices);
    wGeom.computeVertexNormals();

    const bGeom = new THREE.BufferGeometry();
    bGeom.setAttribute('position', new THREE.Float32BufferAttribute(bedVertices, 3));
    bGeom.setAttribute('uv', new THREE.Float32BufferAttribute(bedUvs, 2));
    bGeom.setIndex(bedIndices);
    bGeom.computeVertexNormals();

    return { waterGeometry: wGeom, bedGeometry: bGeom, bankRocks: rocks };
  }, [STREAM_POINTS]);

  // Generate physics segments array
  const segments = useMemo(() => {
    const segs = [];
    for (let i = 0; i < STREAM_POINTS.length - 1; i++) {
      const A = STREAM_POINTS[i];
      const B = STREAM_POINTS[i + 1];
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const dz = B.z - A.z;
      const len = Math.hypot(dx, dy, dz);
      const mx = A.x + dx * 0.5;
      const my = A.y + dy * 0.5;
      const mz = A.z + dz * 0.5;
      
      const yaw = Math.atan2(dx, dz);
      const pitch = -Math.atan2(dy, Math.hypot(dx, dz));
      
      segs.push({
        pos: [mx, my, mz],
        rot: [pitch, yaw, 0],
        len,
      });
    }
    return segs;
  }, [STREAM_POINTS]);

  const bankRocksRef = useRef();

  // Initialize instanced matrices for bank rocks
  useEffect(() => {
    if (!bankRocksRef.current) return;
    const tempObj = new THREE.Object3D();
    const tempColor = new THREE.Color();

    bankRocks.forEach((rock, idx) => {
      tempObj.position.set(...rock.pos);
      tempObj.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      tempObj.scale.setScalar(rock.scale);
      tempObj.updateMatrix();
      bankRocksRef.current.setMatrixAt(idx, tempObj.matrix);

      tempColor.set(rock.color);
      bankRocksRef.current.setColorAt(idx, tempColor);
    });

    bankRocksRef.current.instanceMatrix.needsUpdate = true;
    if (bankRocksRef.current.instanceColor) {
      bankRocksRef.current.instanceColor.needsUpdate = true;
    }
    bankRocksRef.current.computeBoundingBox();
    bankRocksRef.current.computeBoundingSphere();
  }, [bankRocks]);

  return (
    <group>
      {/* ── Visual continuous riverbed ribbon ── */}
      <mesh receiveShadow geometry={bedGeometry}>
        <ClayMaterial color="#374151" roughness={0.92} />
      </mesh>

      {/* ── Visual continuous water surface ribbon ── */}
      <mesh receiveShadow geometry={waterGeometry}>
        <meshStandardMaterial
          map={waterTexture}
          bumpMap={waterTexture}
          bumpScale={0.06}
          transparent
          opacity={0.78}
          roughness={0.5}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Instanced Bank Rocks ── */}
      <instancedMesh ref={bankRocksRef} args={[null, null, bankRocks.length]} receiveShadow frustumCulled={false}>
        <dodecahedronGeometry args={[0.5, 2]} />
        <ClayMaterial roughness={0.95} />
      </instancedMesh>

      {/* ── River bed and banks physics colliders for each segment ── */}
      {segments.map((seg, i) => (
        <RigidBody key={i} type="fixed" position={seg.pos} rotation={seg.rot}>
          {/* Rapier U-channel colliders */}
          <CuboidCollider args={[1.5, 0.1, seg.len / 2]} position={[0, -0.1, 0]} />
          <CuboidCollider args={[0.2, 0.5, seg.len / 2]} position={[-1.5, 0.3, 0]} />
          <CuboidCollider args={[0.2, 0.5, seg.len / 2]} position={[1.5, 0.3, 0]} />
        </RigidBody>
      ))}

      {/* ── Still Pond Ending Area ── */}
      <RigidBody type="fixed" position={[STREAM_POINTS[STREAM_POINTS.length - 1].x, -0.05, STREAM_POINTS[STREAM_POINTS.length - 1].z]}>
        <CuboidCollider args={[4.2, 0.1, 4.2]} position={[0, -0.1, 0]} />
        <group>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[4.2, 32]} />
            <meshStandardMaterial
              map={stillTexture}
              bumpMap={stillTexture}
              bumpScale={0.02}
              transparent
              opacity={0.85}
              roughness={0.5}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle = (idx / 12) * Math.PI * 2;
            const px = Math.cos(angle) * 4.3;
            const pz = Math.sin(angle) * 4.3;
            return (
              <Boulder key={idx} position={[px, 0.1, pz]} scale={1.2} color="#4b5563" cast={false} />
            );
          })}
        </group>
      </RigidBody>

      {/* ── Stream Boulders ── */}
      {STREAM_ROCKS.map((rock, idx) => (
        <RigidBody key={idx} type="fixed" position={[rock.x, rock.y, rock.z]}>
          <BallCollider args={[rock.scale * 0.5]} position={[0, 0, 0]} />
          <Boulder position={[0, 0, 0]} scale={rock.scale} color="#555555" />
        </RigidBody>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// WATERFALL
// ════════════════════════════════════════════════════════════════
function Waterfall() {
  const strips = useMemo(() => Array.from({length: 10}).map((_, i) => ({
    ox: 0.18 * i - 0.8, speed: 1.4+Math.random()*0.8, delay: i*0.14,
    w: 0.24+Math.random()*0.18, len: 1.8+Math.random()*1.4,
  })), []);
  const meshes = useRef([]);
  const Z = -88;
  const cx = getPathCenterX(Z);
  const ty = getTerrainY(Z);
  const { px, pz } = getPathPerpendicular(Z);

  useFrame((s) => {
    const realT = s.clock.getElapsedTime();
    const t = Math.floor(realT * 12) / 12; // 12 FPS stop-motion
    meshes.current.forEach((m, i) => {
      if (m) {
        const d = strips[i];
        const cycle = (t * d.speed + d.delay) % 6;
        m.position.y = ty + 8 - cycle * 1.5;
        if (m.position.y < ty - 2) m.position.y = ty + 8;
      }
    });
  });

  return (
    <group>
      {/* Waterfall rock backing */}
      <mesh castShadow position={[cx - 9 * px, ty + 7, Z - 9 * pz]}>
        <boxGeometry args={[5, 16, 6]} />
        <ClayMaterial color="#374151" roughness={0.95} />
      </mesh>
      {/* Water flow strips */}
      {strips.map((d, i) => (
        <mesh key={i} ref={el => meshes.current[i] = el}
          position={[cx - 10 * px + d.ox * px, ty + 8, Z - 10 * pz + d.ox * pz]}>
          <boxGeometry args={[d.w, d.len, 0.1]} />
          <ClayMaterial color="#93c5fd" transparent opacity={0.68}
            roughness={0.6} depthWrite={false} />
        </mesh>
      ))}
      {/* Splash pool */}
      <mesh receiveShadow position={[cx - 10 * px, ty - 0.1, Z - 10 * pz]}>
        <cylinderGeometry args={[2.8, 2.8, 0.22, 32]} />
        <ClayMaterial color="#bfdbfe" transparent opacity={0.7}
          roughness={0.6} />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// NIGHT SKY — 600 twinkling stars + Milky Way + Moon
// ════════════════════════════════════════════════════════════════
function NightSky({ isNight }) {
  const COUNT = isMobileDevice() ? 400 : 1800;

  const starSystem = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);

    const colorPalette = [
      new THREE.Color('#f8fafc'),
      new THREE.Color('#fef9c3'),
      new THREE.Color('#dde9ff'),
      new THREE.Color('#f0e6ff'),
      new THREE.Color('#ffffff')
    ];

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = -250 + Math.random() * 500;
      positions[i * 3 + 1] = 15 + Math.random() * 95;
      positions[i * 3 + 2] = -5 - Math.random() * 320;

      const col = colorPalette[i % 5];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = 0.05 + Math.random() * 0.2;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 1.0 + Math.random() * 3.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        attribute float aPhase;
        attribute float aSpeed;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vColor = color;
          vTwinkle = 0.2 + abs(sin(uTime * aSpeed + aPhase)) * 0.8;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * (350.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(vColor, vTwinkle * 0.8 * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    return { geom, mat };
  }, [COUNT]);

  const milkyWayPositions = useMemo(() => {
    const arr = new Float32Array(110 * 3);
    for (let i = 0; i < 110; i++) {
      arr[i * 3] = -55 + i * 2.3 + Math.random() * 2.5;
      arr[i * 3 + 1] = 32 + Math.sin(i * 0.28) * 9;
      arr[i * 3 + 2] = -55 - Math.random() * 80;
    }
    return arr;
  }, []);

  const pointsRef = useRef();
  const milkyWayMatRef = useRef();
  const moonMatRef = useRef();
  const moonGlowMatRef = useRef();
  const moonLightRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  useFrame((s, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    const isVisible = t > 0.001;

    if (pointsRef.current) pointsRef.current.visible = isVisible;
    if (milkyWayMatRef.current) {
      milkyWayMatRef.current.opacity = t * 0.3;
      milkyWayMatRef.current.visible = isVisible;
    }
    if (moonMatRef.current) {
      moonMatRef.current.opacity = t;
      moonMatRef.current.visible = isVisible;
    }
    if (moonGlowMatRef.current) {
      moonGlowMatRef.current.opacity = t * 0.08;
      moonGlowMatRef.current.visible = isVisible;
    }
    if (moonLightRef.current) {
      moonLightRef.current.intensity = t * 1.4;
      moonLightRef.current.visible = isVisible;
    }

    if (isVisible) {
      starSystem.mat.uniforms.uTime.value = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      starSystem.mat.uniforms.uOpacity.value = t;
    }
  });

  return (
    <group>
      {/* Regular stars */}
      <points ref={pointsRef} geometry={starSystem.geom}>
        <primitive object={starSystem.mat} attach="material" />
      </points>

      {/* Milky Way band */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[milkyWayPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial ref={milkyWayMatRef} color="#c7d2f8" size={0.15} transparent opacity={0.3} sizeAttenuation />
      </points>

      {/* Moon */}
      <mesh position={[-42, 60, -155]}>
        <sphereGeometry args={[5.5, 14, 14]} />
        <meshBasicMaterial ref={moonMatRef} color="#fef9c3" transparent opacity={0} />
      </mesh>
      {/* Moon glow */}
      <mesh position={[-42, 60, -155]}>
        <sphereGeometry args={[7.5, 10, 10]} />
        <meshBasicMaterial ref={moonGlowMatRef} color="#fef9c3" transparent opacity={0} />
      </mesh>
      <pointLight ref={moonLightRef} position={[-42, 60, -155]} color="#fef9c3" intensity={0} distance={500} />
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// DAY CLOUDS — fluffy animated clouds
// ════════════════════════════════════════════════════════════════
function DayClouds({ isNight, season }) {
  const cloudData = useMemo(() => Array.from({length: 16}).map((_, i) => ({
    x: -65 + i * 10,
    y:  20 + (i%4)*3.5,
    z: -12 - (i%6)*32,
    speed: 0.007 + (i%3)*0.003,
    scale: 1.0 + (i%4)*0.4,
  })), []);

  const offsets = useMemo(() => [
    [0,0,0],[1.3,0.4,0],[-1.1,0.3,0],[0.55,0.85,0],
    [-0.5,0.6,0],[2.1,0.1,0],[-1.8,0.1,0],
    [0.1,0.1,0.6],[-0.2,0.2,-0.6],[1.0,0.5,0.4],
  ], []);

  const totalInstances = cloudData.length * offsets.length; // 160
  const instancedRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const cloudColor = useMemo(() => {
    if (season === 'winter') return new THREE.Color('#cbd5e1');
    if (season === 'autumn') return new THREE.Color('#e2e8f0');
    return new THREE.Color('#f8fafc');
  }, [season]);

  const matRef = useRef();

  useFrame((s, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    const isVisible = (1 - t) > 0.001;

    if (instancedRef.current) {
      instancedRef.current.visible = isVisible;
    }

    if (isVisible && instancedRef.current) {
      if (matRef.current) {
        matRef.current.opacity = (1 - t) * 0.95;
        matRef.current.color.copy(cloudColor);
      }
      
      const stepTime = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      const tempObj = new THREE.Object3D();
      
      let idx = 0;
      cloudData.forEach((cloud, i) => {
        const speedPerSec = cloud.speed * 60;
        let x = cloud.x + stepTime * speedPerSec;
        const width = 144;
        x = ((x + 72) % width + width) % width - 72;

        offsets.forEach(([cx, cy, cz], j) => {
          const radius = 0.82 + (j % 3) * 0.24;
          const worldX = x + cx * cloud.scale;
          const worldY = cloud.y + cy * cloud.scale;
          const worldZ = cloud.z + cz * cloud.scale;

          tempObj.position.set(worldX, worldY, worldZ);
          tempObj.scale.setScalar(radius * cloud.scale);
          tempObj.updateMatrix();
          instancedRef.current.setMatrixAt(idx, tempObj.matrix);
          idx++;
        });
      });
      instancedRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={instancedRef} args={[null, null, totalInstances]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 10]} />
      <meshStandardMaterial
        ref={matRef}
        color={cloudColor}
        transparent
        opacity={0.95}
        roughness={0.95}
        bumpMap={clayBumpMap}
        bumpScale={0.02}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════════════════
// SITTING OWL (Night only, sits on crossbar of checkpoint arches)
// ════════════════════════════════════════════════════════════════
function SittingOwl({ position, isNight }) {
  const headRef = useRef();
  const groupRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  useFrame((state, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    const isVisible = t > 0.001;

    if (groupRef.current) {
      groupRef.current.visible = isVisible;
      if (isVisible) {
        // Slight breathing animation
        const time = Math.floor(state.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
        groupRef.current.scale.setScalar(1.0 + Math.sin(time * 2.5) * 0.015);
        
        // Owl looks around slowly
        if (headRef.current) {
          headRef.current.rotation.y = Math.sin(time * 0.4) * 0.35;
        }
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body (cylinder shape, brownish-grey) */}
      <mesh castShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.32, 16]} />
        <ClayMaterial color="#5c4d3c" roughness={0.88} />
      </mesh>
      
      {/* Head Group */}
      <group ref={headRef} position={[0, 0.36, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.11, 16, 12]} />
          <ClayMaterial color="#6e5c49" roughness={0.85} />
        </mesh>
        
        {/* Left Eye */}
        <mesh position={[-0.045, 0.02, 0.08]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <ClayMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[-0.045, 0.02, 0.096]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <ClayMaterial color="#eab308" emissive="#eab308" emissiveIntensity={3.5} />
        </mesh>
        
        {/* Right Eye */}
        <mesh position={[0.045, 0.02, 0.08]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <ClayMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        <mesh position={[0.045, 0.02, 0.096]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <ClayMaterial color="#eab308" emissive="#eab308" emissiveIntensity={3.5} />
        </mesh>
        
        {/* Beak */}
        <mesh position={[0, -0.02, 0.10]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.018, 0.05, 10]} />
          <ClayMaterial color="#f97316" roughness={0.6} />
        </mesh>
        
        {/* Left Ear Horn */}
        <mesh position={[-0.06, 0.09, 0.02]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.02, 0.06, 8]} />
          <ClayMaterial color="#5c4d3c" />
        </mesh>
        
        {/* Right Ear Horn */}
        <mesh position={[0.06, 0.09, 0.02]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.02, 0.06, 8]} />
          <ClayMaterial color="#5c4d3c" />
        </mesh>
      </group>

      {/* Folded Wings */}
      <mesh position={[-0.12, 0.18, 0]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.03, 0.2, 0.09]} />
        <ClayMaterial color="#423528" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.18, 0]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.03, 0.2, 0.09]} />
        <ClayMaterial color="#423528" roughness={0.9} />
      </mesh>

      {/* Owl Feet */}
      <mesh position={[-0.04, 0, 0.04]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.025, 0.02, 0.06]} />
        <ClayMaterial color="#d97706" />
      </mesh>
      <mesh position={[0.04, 0, 0.04]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.025, 0.02, 0.06]} />
        <ClayMaterial color="#d97706" />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// ANIMATED BIRDS — flocking V-formation (day only)
// ════════════════════════════════════════════════════════════════
function AnimatedBirds({ isNight, season }) {
  const FLOCK = 35;
  const birds = useMemo(() => Array.from({length: FLOCK}).map((_, i) => {
    const startX = -22 + (i%7)*6;
    return {
      x: startX,
      y: 12 + (i%4)*2.8, 
      z: -10 - Math.floor(i/7)*32,
      speed: 0.55 + (i%7)*0.035, 
      flap: 4+Math.random()*3, 
      phase: i*0.48,
    };
  }), []);

  const bodyRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const birdColor = useMemo(() => {
    if (season === 'winter') return new THREE.Color('#94a3b8'); // ice blue-grey birds
    if (season === 'autumn') return new THREE.Color('#78350f'); // brown autumn birds
    return new THREE.Color('#334155'); // default slate clay
  }, [season]);

  const wingColor = useMemo(() => {
    if (season === 'winter') return new THREE.Color('#cbd5e1');
    if (season === 'autumn') return new THREE.Color('#b45309');
    return new THREE.Color('#475569');
  }, [season]);

  const bodyMatRef = useRef();
  const wingMatRef = useRef();

  useFrame((state, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    const isVisible = (1 - t) > 0.001;

    if (bodyRef.current) bodyRef.current.visible = isVisible;
    if (leftWingRef.current) leftWingRef.current.visible = isVisible;
    if (rightWingRef.current) rightWingRef.current.visible = isVisible;

    if (isVisible && bodyRef.current && leftWingRef.current && rightWingRef.current) {
      if (bodyMatRef.current) {
        bodyMatRef.current.opacity = 1 - t;
        bodyMatRef.current.color.copy(birdColor);
      }
      if (wingMatRef.current) {
        wingMatRef.current.opacity = 1 - t;
        wingMatRef.current.color.copy(wingColor);
      }

      const time = Math.floor(state.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      const tempObj = new THREE.Object3D();

      birds.forEach((d, i) => {
        let x = d.x + d.speed * time * 45;
        const width = 105;
        x = ((x + 50) % width + width) % width - 50;
        const y = d.y + Math.sin(time * 0.38 + d.phase) * 1.3;
        const z = d.z;

        // 1. Body
        tempObj.position.set(x, y, z);
        tempObj.rotation.set(0, 0, 0);
        tempObj.scale.set(1, 1, 1);
        tempObj.updateMatrix();
        bodyRef.current.setMatrixAt(i, tempObj.matrix);

        // 2. Left Wing
        const lWingAngle = -0.28 + Math.sin(time * d.flap + d.phase) * 0.52;
        tempObj.position.set(x - 0.26, y, z);
        tempObj.rotation.set(0, 0, lWingAngle);
        tempObj.updateMatrix();
        leftWingRef.current.setMatrixAt(i, tempObj.matrix);

        // 3. Right Wing
        const rWingAngle = 0.28 - Math.sin(time * d.flap + d.phase) * 0.52;
        tempObj.position.set(x + 0.26, y, z);
        tempObj.rotation.set(0, 0, rWingAngle);
        tempObj.updateMatrix();
        rightWingRef.current.setMatrixAt(i, tempObj.matrix);
      });

      bodyRef.current.instanceMatrix.needsUpdate = true;
      leftWingRef.current.instanceMatrix.needsUpdate = true;
      rightWingRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Bodies */}
      <instancedMesh ref={bodyRef} args={[null, null, FLOCK]} frustumCulled={false}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          ref={bodyMatRef}
          color={birdColor}
          roughness={0.9}
          bumpMap={clayBumpMap}
          bumpScale={0.015}
          transparent
        />
      </instancedMesh>

      {/* Left Wings */}
      <instancedMesh ref={leftWingRef} args={[null, null, FLOCK]} frustumCulled={false}>
        <planeGeometry args={[0.58, 0.17]} />
        <meshStandardMaterial
          ref={wingMatRef}
          color={wingColor}
          side={THREE.DoubleSide}
          roughness={0.9}
          bumpMap={clayBumpMap}
          bumpScale={0.015}
          transparent
        />
      </instancedMesh>

      {/* Right Wings */}
      <instancedMesh ref={rightWingRef} args={[null, null, FLOCK]} frustumCulled={false}>
        <planeGeometry args={[0.58, 0.17]} />
        <meshStandardMaterial
          color={wingColor}
          side={THREE.DoubleSide}
          roughness={0.9}
          bumpMap={clayBumpMap}
          bumpScale={0.015}
          transparent
        />
      </instancedMesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// WIND LEAVES
// ════════════════════════════════════════════════════════════════
function WindLeaves({ season }) {
  const disabled = isMobileDevice();
  const count = useMemo(() => {
    if (season === 'autumn') return 120;
    return 30;
  }, [season]);

  const leafData = useMemo(() => {
    const colorsSummer = ['#4d7c0f', '#65a30d', '#86efac', '#a3e635', '#d9f99d'];
    const colorsAutumn = ['#c2410c', '#d97706', '#b45309', '#7c2d12', '#f59e0b'];
    const colorsWinter = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#f1f5f9', '#cbd5e1'];

    return Array.from({ length: count }).map((_, i) => {
      const isAutumn = season === 'autumn';
      const isWinter = season === 'winter';
      const colors = isAutumn ? colorsAutumn : (isWinter ? colorsWinter : colorsSummer);

      return {
        startX: -6 + Math.random() * 12,
        startY: 1 + Math.random() * 4,
        startZ: isAutumn ? -2 - Math.random() * 180 : -2 - Math.random() * 90,
        speed: 0.22 + Math.random() * 0.42,
        drift: 0.45 + Math.random() * 1.4,
        color: colors[i % colors.length],
      };
    });
  }, [count, season]);

  const meshes = useRef([]);

  useFrame((s) => {
    if (disabled) return;
    const realT = s.clock.getElapsedTime();
    const t = Math.floor(realT * 12) / 12; // 12 FPS stop-motion
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const d = leafData[i];
      if (!d) return;
      const cycle = (t * d.speed + i * 1.1) % 7;
      m.position.x = d.startX + Math.sin(cycle * 0.9) * 1.8 + cycle * d.drift * 0.28;
      m.position.y = d.startY + Math.sin(cycle * 1.3 + i) * 0.45 - cycle * 0.13;
      m.position.z = d.startZ + Math.cos(cycle * 0.7 + i) * 1.1;
      m.rotation.x = cycle * 2.2;
      m.rotation.z = Math.sin(cycle * 1.6 + i) * 0.6;
      if (cycle > 6.6) {
        m.position.x = d.startX;
        m.position.y = d.startY;
      }
    });
  });

  if (disabled) return null;

  return (
    <group>
      {leafData.map((d, i) => (
        <mesh key={i} ref={el => meshes.current[i] = el} position={[d.startX, d.startY, d.startZ]}>
          <planeGeometry args={[0.14, 0.09]} />
          <ClayMaterial color={d.color} side={THREE.DoubleSide} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// SNOW PARTICLES (upper trail)
// ════════════════════════════════════════════════════════════════
function SnowParticles({ season }) {
  const isMobile = isMobileDevice();
  const count = useMemo(() => {
    if (season === 'winter') {
      return isMobile ? 100 : 350;
    }
    return isMobile ? 25 : 80;
  }, [season, isMobile]);

  const snowSystem = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const drifts = new Float32Array(count);
    const sizes = new Float32Array(count);
    const baseYs = new Float32Array(count);
    const terrainYs = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = -8 + Math.random() * 16;
      const z = season === 'winter' ? -Math.random() * 185 : -105 - Math.random() * 80;
      const ty = getTerrainY(z);

      positions[i * 3] = x;
      positions[i * 3 + 1] = ty + 9;
      positions[i * 3 + 2] = z;

      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.35 + Math.random() * 0.5;
      drifts[i] = -0.22 + Math.random() * 0.44;
      sizes[i] = 0.03 + Math.random() * 0.07;
      baseYs[i] = ty + 11 + (i % 5) * 2.2;
      terrainYs[i] = ty;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geom.setAttribute('aDrift', new THREE.BufferAttribute(drifts, 1));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aBaseY', new THREE.BufferAttribute(baseYs, 1));
    geom.setAttribute('aTerrainY', new THREE.BufferAttribute(terrainYs, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aDrift;
        attribute float aSize;
        attribute float aBaseY;
        attribute float aTerrainY;
        void main() {
          float cycle = mod(uTime * aSpeed + aPhase, 9.0);
          vec3 pos = position;
          pos.y = aBaseY - cycle * 1.1;
          pos.x = position.x + sin(uTime * 1.2 + aPhase) * 0.35 + cycle * aDrift * 0.12;
          if (pos.y < aTerrainY - 0.2) {
            pos.y = aBaseY;
            pos.x = position.x;
          }
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = aSize * (350.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(0.94, 0.976, 1.0, 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    return { geom, mat };
  }, [count, season]);

  useFrame((s) => {
    snowSystem.mat.uniforms.uTime.value = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
  });

  return (
    <points geometry={snowSystem.geom}>
      <primitive object={snowSystem.mat} attach="material" />
    </points>
  );
}

// ════════════════════════════════════════════════════════════════
// FIREFLIES (night time only)
// ════════════════════════════════════════════════════════════════
function Fireflies({ isNight }) {
  const COUNT = 160;

  const firefliesSystem = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT * 3);
    const amplitudes = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const z = -5 - Math.random() * 175;
      const cx = getPathCenterX(z);
      const ty = getTerrainY(z);

      positions[i * 3] = cx + (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = ty + 0.6 + Math.random() * 5.0;
      positions[i * 3 + 2] = z;

      sizes[i] = 0.035 + Math.random() * 0.05;
      phases[i] = Math.random() * Math.PI * 2;
      
      speeds[i * 3] = 0.18 + Math.random() * 0.4;
      speeds[i * 3 + 1] = 0.25 + Math.random() * 0.5;
      speeds[i * 3 + 2] = 0.12 + Math.random() * 0.3;

      amplitudes[i] = 0.35 + Math.random() * 0.8;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 3));
    geom.setAttribute('aAmplitude', new THREE.BufferAttribute(amplitudes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        attribute float aPhase;
        attribute vec3 aSpeed;
        attribute float aAmplitude;
        void main() {
          vec3 pos = position;
          pos.x += sin(uTime * aSpeed.x + aPhase) * aAmplitude;
          pos.y += cos(uTime * aSpeed.y + aPhase) * (aAmplitude * 0.55);
          pos.z += sin(uTime * aSpeed.z + aPhase) * (aAmplitude * 0.35);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float scale = (0.55 + sin(uTime * 4.4 + aPhase) * 0.45) * 1.25;
          gl_PointSize = aSize * scale * (350.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - (dist * 2.0);
          gl_FragColor = vec4(0.639, 0.902, 0.208, alpha * 0.9 * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    return { geom, mat };
  }, []);

  const pointsRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  useFrame((state, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    const isVisible = t > 0.001;
    
    if (pointsRef.current) pointsRef.current.visible = isVisible;
    
    if (isVisible) {
      firefliesSystem.mat.uniforms.uTime.value = Math.floor(state.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      firefliesSystem.mat.uniforms.uOpacity.value = t;
    }
  });

  return (
    <points ref={pointsRef} geometry={firefliesSystem.geom}>
      <primitive object={firefliesSystem.mat} attach="material" />
    </points>
  );
}

// ════════════════════════════════════════════════════════════════
// FOG CLOUD BANDS (ground mist)
// ════════════════════════════════════════════════════════════════
function MistBands({ isNight }) {
  const disabled = isMobileDevice();
  const zPositions = useMemo(() => [-22,-55,-88,-125,-162], []);

  const mistSpheres = useMemo(() => {
    if (disabled) return [];
    const arr = [];
    zPositions.forEach((z, i) => {
      const ty = getTerrainY(z);
      const cx = getPathCenterX(z);
      [-1,0,1,2,-2].forEach(j => {
        arr.push({
          x: cx + j * 5,
          y: ty + 0.35 + i * 0.15,
          z: z + j * 2,
          radius: 2.4 + j * 0.4
        });
      });
    });
    return arr;
  }, [disabled, zPositions]);

  const instancedRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const color1 = useMemo(() => new THREE.Color('#e2e8f0'), []);
  const color2 = useMemo(() => new THREE.Color('#1e2942'), []);
  const tempCol = useMemo(() => new THREE.Color(), []);

  const matRef = useRef();

  const initializedRef = useRef(false);

  useFrame((s, delta) => {
    if (disabled) return;
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;

    if (instancedRef.current) {
      instancedRef.current.visible = true;
    }

    if (matRef.current) {
      tempCol.lerpColors(color1, color2, t);
      matRef.current.color.copy(tempCol);
      matRef.current.opacity = 0.11 + t * 0.05;
    }

    if (!initializedRef.current && instancedRef.current && mistSpheres.length > 0) {
      const tempObj = new THREE.Object3D();
      mistSpheres.forEach((sphere, idx) => {
        tempObj.position.set(sphere.x, sphere.y, sphere.z);
        tempObj.scale.setScalar(sphere.radius);
        tempObj.updateMatrix();
        instancedRef.current.setMatrixAt(idx, tempObj.matrix);
      });
      instancedRef.current.instanceMatrix.needsUpdate = true;
      instancedRef.current.computeBoundingBox();
      instancedRef.current.computeBoundingSphere();
      initializedRef.current = true;
    }
  });

  if (disabled) return null;

  return (
    <instancedMesh ref={instancedRef} args={[null, null, mistSpheres.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshStandardMaterial
        ref={matRef}
        color="#e2e8f0"
        transparent
        opacity={0.11}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════
// CHECKPOINT ARCH — two wooden posts + rope + hanging banner + torches
// ════════════════════════════════════════════════════════════════
function CheckpointArch({ z, label, isNight }) {
  const ty = getTerrainY(z); const cx = getPathCenterX(z);
  const flameRef = useRef(); const flameRef2 = useRef();

  // Generate engraved canvas texture for this checkpoint label
  const bannerTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 1024, 128);
    
    ctx.font = 'bold 52px Outfit, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw engraved depth shadow
    ctx.fillStyle = '#1c0d02';
    ctx.fillText(`⛺ ${label} CHECKPOINT`, 512 + 3, 64 + 3);
    
    // Draw engraved inner text
    ctx.fillStyle = '#fef3c7';
    ctx.fillText(`⛺ ${label} CHECKPOINT`, 512, 64);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [label]);

  const groupRef = useRef();

  useFrame((s) => {
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(z - pzVal);
    const cullDist = isMobileDevice() ? 25 : 55;
    
    if (dist > cullDist) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;

    const realT = s.clock.getElapsedTime();
    const t = Math.floor(realT * 12) / 12; // 12 FPS stop-motion
    if (flameRef.current) {
      const isNear = dist < 25;
      flameRef.current.visible = isNear;
      if (isNear) {
        flameRef.current.intensity = (isNight ? 4 : 1.2) + Math.sin(t * 11) * 0.6;
      }
    }
    if (flameRef2.current) {
      const isNear = dist < 25;
      flameRef2.current.visible = isNear;
      if (isNear) {
        flameRef2.current.intensity = (isNight ? 4 : 1.2) + Math.sin(t * 9 + 1) * 0.6;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Left post */}
      <Cyl pos={[cx - 4.2, ty + 1.65, z]} args={[0.12, 0.14, 3.3, 16]} color="#7c3d11" rough={0.92} />
      {/* Right post */}
      <Cyl pos={[cx + 4.2, ty + 1.65, z]} args={[0.12, 0.14, 3.3, 16]} color="#7c3d11" rough={0.92} />
      {/* Crossbar */}
      <Box pos={[cx, ty + 3.32, z]} size={[8.8, 0.18, 0.18]} color="#92400e" />
      {/* Sitting Owl perched on top-left of the crossbar (visible at night only) */}
      <SittingOwl position={[cx - 2.8, ty + 3.41, z]} isNight={isNight} />
      {/* Banner */}
      <Box pos={[cx, ty + 3.0, z - 0.05]} size={[3.8, 0.48, 0.06]} color="#b45309" />
      
      {/* Engraved text plane on Banner (positioned in front of banner box) */}
      <mesh position={[cx, ty + 3.0, z - 0.018]} rotation={[0, 0, 0]}>
        <planeGeometry args={[3.7, 0.46]} />
        <ClayMaterial 
          map={bannerTexture} 
          transparent 
          alphaTest={0.01} 
          roughness={0.7} 
        />
      </mesh>
      {/* Rope */}
      {[-1.6, -0.6, 0.4, 1.4].map((ox, i) => (
        <Box key={i} pos={[cx + ox, ty + 3.2 + Math.sin(i * 0.9) * -0.08, z]} size={[0.65, 0.03, 0.03]} color="#78350f" />
      ))}
      {/* Left torch */}
      <Cyl pos={[cx - 4.2, ty + 3.6, z]} args={[0.05, 0.07, 0.28, 6]} color="#7c3d11" />
      <mesh position={[cx - 4.2, ty + 3.78, z]}>
        <sphereGeometry args={[0.09, 6, 6]} />
        <meshStandardMaterial color="#ff7700" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>
      {!isMobileDevice() && <pointLight ref={flameRef} position={[cx - 4.2, ty + 3.88, z]} color="#ff9900" intensity={3} distance={7} />}
      {/* Right torch */}
      <Cyl pos={[cx + 4.2, ty + 3.6, z]} args={[0.05, 0.07, 0.28, 6]} color="#7c3d11" />
      <mesh position={[cx + 4.2, ty + 3.78, z]}>
        <sphereGeometry args={[0.09, 6, 6]} />
        <meshStandardMaterial color="#ff7700" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>
      {!isMobileDevice() && <pointLight ref={flameRef2} position={[cx + 4.2, ty + 3.88, z]} color="#ff9900" intensity={3} distance={7} />}
      {/* Flag pennants on posts */}
      {[[-4.2, '#ef4444'], [4.2, '#3b82f6']].map(([ox, col], i) => (
        <mesh key={i} position={[cx + ox + (ox < 0 ? 0.3 : -0.3), ty + 3.28, z - 0.04]}>
          <coneGeometry args={[0.16, 0.38, 4]} rotation={[0, 0, ox < 0 ? Math.PI / 2 : -Math.PI / 2]} />
          <ClayMaterial color={col} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// SKILL LOG STUMP — single log lying on the ground with text
// ════════════════════════════════════════════════════════════════
function SkillLog({ position, skill, rotation = 0 }) {
  const [px, py, pz] = position;

  // Generate local canvas texture for the skill name
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 512, 128);
    
    // Draw engraved depth shadow
    ctx.font = 'bold 52px Outfit, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c0d02';
    ctx.fillText(skill, 256 + 3, 64 + 3);
    
    // Draw engraved inner text
    ctx.fillStyle = '#e5c199';
    ctx.fillText(skill, 256, 64);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [skill]);

  return (
    <RigidBody type="fixed" position={[px, py, pz]} rotation={[0, rotation, 0]}>
      <CuboidCollider args={[0.8, 0.3, 0.3]} position={[0, 0, 0]} />
      <group>
        {/* Log body */}
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.32, 1.6, 16]} />
          <ClayMaterial color="#6b3e0e" roughness={0.96} />
        </mesh>
        {/* Bark ring at each end */}
        {[-0.80, 0.80].map((ox, i) => (
          <mesh key={i} position={[ox, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.285, 0.325, 0.06, 16]} />
            <ClayMaterial color="#4a2b06" roughness={0.98} />
          </mesh>
        ))}
        {/* Tree-ring face (top end disc) */}
        <mesh position={[0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.28, 16]} />
          <ClayMaterial color="#8b5e2a" roughness={0.88} />
        </mesh>
        
        {/* Engraved text plane */}
        <mesh position={[0, 0.266, 0.135]} rotation={[-Math.PI / 3, 0, 0]}>
          <planeGeometry args={[1.2, 0.3]} />
          <ClayMaterial 
            map={texture} 
            transparent 
            alphaTest={0.01}
            roughness={0.7} 
          />
        </mesh>

        {/* Small plant/moss on log */}
        <mesh position={[0.1, 0.3, 0.2]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <ClayMaterial color="#16a34a" roughness={0.9} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// ════════════════════════════════════════════════════════════════
// CHECKPOINT ZONES (About Me, Education, Skills, Projects, Experience, Contact)
// ════════════════════════════════════════════════════════════════
function Zone_AboutMe({ z, isNight }) {
  const ty = getTerrainY(z); const cx = getPathCenterX(z);
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(z - pzVal);
    groupRef.current.visible = (dist < 55);
  });

  return (
    <group ref={groupRef}>
      <CheckpointArch z={z + 4} label="ABOUT ME" isNight={isNight} />
      <Campfire position={[cx+3.0, ty+0.46, z]} isNight={isNight} />
      <WoodenHut position={[cx-5, ty+0.46, z-1]} />
      <Tent position={[cx+4.5, ty+0.5, z+1]} />
      <Tent position={[cx-4.5, ty+0.5, z+2.5]} color="#1e3a5f" rotation={1.2} />
      <LanternPost position={[cx+3.2, ty+0.46, z-1.5]} isNight={isNight} />
      <LanternPost position={[cx-3.2, ty+0.46, z-1.5]} isNight={isNight} />
      {/* Compass rock */}
      <Boulder position={[cx+4,ty+0.7,z+2]} color="#4b5563" scale={0.8} />
      <Cyl pos={[cx+4,ty+1.05,z+2]} args={[0.26,0.26,0.06,12]} color="#b45309" rough={0.4} />
      {/* Backpack */}
      <Box pos={[cx-3.2,ty+0.7,z+1.5]} size={[0.55,0.7,0.4]} color="#1e3a5f" rough={0.85} />
      {/* Trekking sticks */}
      {[-0.2,0.2].map((ox,i)=>(
        <Box key={i} pos={[cx-4+ox,ty+0.9,z]} size={[0.04,1.6,0.04]} color="#92400e"
          rot={[0.15,0,(i===0?1:-1)*0.2]} />
      ))}
      <WoodenSign position={[cx+6, ty+0.46, z+2]} text="BASE CAMP" rotation={-0.5} />
      <WoodenSign position={[cx-6, ty+0.46, z-1]} text="SUMMIT →" rotation={0.4} />
      {/* Sleeping bag */}
      <Cyl pos={[cx-3.2,ty+0.6,z+2.5]} args={[0.22,0.25,1.4,8]} color="#16a34a" rot={[0,0.5,0]} />
      {/* Crates */}
      {[0,1,2].map(i=>(
        <Box key={i} pos={[cx+3.2+i*0.65,ty+0.65+(i===1?0.44:0),z+2.5]}
          size={[0.55,0.44,0.44]} color={['#b45309','#92400e','#7c3d11'][i]} />
      ))}
      {/* Direction stones on sides */}
      {[-2.8, -3.2, -3.6, 2.8, 3.2, 3.6].map((xOffset, i) => (
        <Boulder key={i} position={[cx + xOffset, ty + 0.28, z + 4.5 + (i%3)*0.4]} scale={0.4} color="#6b7280" />
      ))}
    </group>
  );
}

function Zone_Education({ z, isNight }) {
  const ty = getTerrainY(z); const cx = getPathCenterX(z);
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(z - pzVal);
    groupRef.current.visible = (dist < 55);
  });

  return (
    <group ref={groupRef}>
      <CheckpointArch z={z + 4} label="EDUCATION" isNight={isNight} />
      {['#1e40af','#b91c1c','#16a34a','#7c3d11'].map((c,i)=>(
        <Box key={i} pos={[cx-4,ty+0.5+i*0.14,z]} size={[0.9,0.13,0.7]} color={c} rot={[0,(i%2)*0.12,0]} />
      ))}
      <Box pos={[cx+4.5,ty+1.05,z]} size={[0.6,0.06,0.6]} color="#1f2937" />
      <Cyl pos={[cx+4.5,ty+0.73,z]} args={[0.16,0.16,0.58,8]} color="#1f2937" />
      <Box pos={[cx+4.8,ty+1.05,z]} size={[0.04,0.28,0.04]} color="#fbbf24" />
      {/* Desk with laptop (Moved to the left side of the trail) */}
      <RigidBody type="fixed" position={[cx - 2.8, ty, z+1.5]}>
        <CuboidCollider args={[0.9, 0.6, 0.55]} position={[0, 0.6, 0]} />
        <group>
          <Box pos={[0,1.16,0]} size={[1.8,0.09,1.1]} color="#7c3d11" rough={0.9} />
          {[[-0.8,-0.55],[-0.8,0.55],[0.8,-0.55],[0.8,0.55]].map(([lx,lz],i)=>(
            <Box key={i} pos={[lx,0.76,lz]} size={[0.1,0.76,0.1]} color="#5c3d1e" />
          ))}
          {/* Laptop */}
          <Box pos={[0,1.24,0]} size={[0.9,0.06,0.65]} color="#374151" />
          <Box pos={[0,1.56,-0.3]} size={[0.9,0.55,0.05]} color="#1f2937" rot={[-0.42,0,0]} />
          <mesh position={[0,1.56,-0.32]} rotation={[-0.42,0,0]}>
            <planeGeometry args={[0.82,0.48]} />
            <ClayMaterial color="#0f172a" emissive="#0ea5e9" emissiveIntensity={1.2} transparent opacity={0.95} roughness={0.4} />
          </mesh>
        </group>
      </RigidBody>
      <WoodenSign position={[cx-6,ty+0.46,z+1]} text="EDUCATION" />
      {/* Study campfire */}
      <Campfire position={[cx+5.5, ty+0.46, z+2]} isNight={isNight} />
      <LanternPost position={[cx+3.2, ty+0.46, z-1]} isNight={isNight} />
    </group>
  );
}

function Zone_Skills({ z, isNight }) {
  const ty = getTerrainY(z); const cx = getPathCenterX(z);
  const glowRef = useRef();
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(z - pzVal);
    const visible = dist < 55;
    groupRef.current.visible = visible;

    if (visible && glowRef.current) {
      const time = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      glowRef.current.intensity = 1 + Math.sin(time * 4) * 0.4;
    }
  });

  // All skills get their own wooden log — arranged left-right across the trail
  const skills = [
    { name: 'AWS',          rot: 0.15  },
    { name: 'Kubernetes',   rot: -0.12 },
    { name: 'Docker',       rot: 0.08  },
    { name: 'CI/CD',        rot: -0.18 },
    { name: 'Linux',        rot: 0.10  },
    { name: 'Terraform',    rot: -0.08 },
    { name: 'Python',       rot: 0.20  },
    { name: 'Bash',         rot: -0.15 },
    { name: 'Prometheus',   rot: 0.05  },
    { name: 'Jenkins',      rot: -0.10 },
    { name: 'ArgoCD',       rot: 0.12  },
    { name: 'Ansible',      rot: -0.05 },
  ];

  // Two rows of 6 logs each, sitting flat on the trail surface
  const row1 = skills.slice(0, 6);
  const row2 = skills.slice(6, 12);

  return (
    <group ref={groupRef}>
      <CheckpointArch z={z + 5} label="SKILLS" isNight={isNight} />

      {/* ── Left Side Skill Logs (stacked vertically at trail edges) ── */}
      {row1.map((s, i) => {
        const lx = cx - 3.2;
        const lz = z + 3 - i * 1.5;
        const ly = ty + 0.30;
        return <SkillLog key={`l-${i}`} position={[lx, ly, lz]} skill={s.name} rotation={s.rot} />;
      })}

      {/* ── Right Side Skill Logs ── */}
      {row2.map((s, i) => {
        const lx = cx + 3.2;
        const lz = z + 3 - i * 1.5;
        const ly = ty + 0.30;
        return <SkillLog key={`r-${i}`} position={[lx, ly, lz]} skill={s.name} rotation={s.rot} />;
      })}

      {/* ── Monitor on the right side ── */}
      <Box pos={[cx+6.5, ty+0.96, z]} size={[0.12,0.65,0.55]} color="#1f2937" />
      <Box pos={[cx+6.5, ty+1.66, z]} size={[1.1,0.65,0.08]} color="#111827" />
      <mesh position={[cx+6.5, ty+1.66, z-0.06]}>
        <planeGeometry args={[0.98,0.55]} />
        <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.7} transparent opacity={0.95} />
      </mesh>
      {!isMobileDevice() && <pointLight ref={glowRef} position={[cx+6.5, ty+1.66,z-0.5]} color="#38bdf8" intensity={1.2} distance={4} />}

      {/* ── Server rack left ── */}
      <Box pos={[cx-6.5, ty+1.46, z]} size={[0.6,2.0,0.8]} color="#1f2937" />
      {[0,1,2,3,4].map(i=>(
        <mesh key={i} position={[cx-6.25, ty+0.81+i*0.38, z-0.44]}>
          <sphereGeometry args={[0.035,4,4]} />
          <meshBasicMaterial color={i%3===0?'#22c55e':'#3b82f6'} />
        </mesh>
      ))}

      {/* ── Campfire and lanterns (Moved campfire to the side) ── */}
      <Campfire position={[cx - 4.5, ty+0.46, z-5]} isNight={isNight} />
      <LanternPost position={[cx-3.2, ty+0.46, z-3]} isNight={isNight} />
      <LanternPost position={[cx+3.2, ty+0.46, z-3]} isNight={isNight} />

      {/* ── Pebble trail leading in ── */}
      {[0,1,2,3,4].map(i => (
        <Boulder key={i} position={[cx + (i%2===0?1.4:-1.4), ty+0.18, z+4+i*1.1]} scale={0.3} color="#78716c" />
      ))}
    </group>
  );
}

function Zone_Projects({ z, isNight }) {
  const ty = getTerrainY(z); const cx = getPathCenterX(z);
  const screenRefs = useRef([]);
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(z - pzVal);
    const visible = dist < 55;
    groupRef.current.visible = visible;

    if (visible) {
      const t = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      screenRefs.current.forEach((m, i) => {
        if (m) m.position.y = ty + 2.06 + Math.sin(t * 0.8 + i) * 0.09;
      });
    }
  });

  const projects=[{title:'Cloud Infra',color:'#38bdf8'},{title:'DevOps Pipeline',color:'#34d399'},{title:'AI Monitor',color:'#a78bfa'}];
  return (
    <group ref={groupRef}>
      <CheckpointArch z={z + 4} label="PROJECTS" isNight={isNight} />
      {projects.map((p,i)=>{
        // Place Screen 0 and 1 on left side, Screen 2 on right side
        const lx = i < 2 ? cx - 3.2 : cx + 3.2;
        const lz = i === 0 ? z + 1.2 : i === 1 ? z - 1.2 : z;
        return (
          <RigidBody key={i} type="fixed" position={[lx, ty+1.2, lz]}>
            <CuboidCollider args={[0.7, 1.2, 0.2]} />
            <group ref={el=>screenRefs.current[i]=el} position={[0, 2.06 - 1.2, 0]}>
              <mesh castShadow><boxGeometry args={[1.4,0.95,0.08]} />
                <ClayMaterial color="#1f2937" roughness={0.6} /></mesh>
              <mesh position={[0,0,0.05]}><planeGeometry args={[1.24,0.8]} />
                <ClayMaterial color="#0f172a" emissive={p.color} emissiveIntensity={0.45} transparent opacity={0.95} roughness={0.4} /></mesh>
              <mesh position={[0,0.35,0.06]}><planeGeometry args={[1.24,0.1]} />
                <meshBasicMaterial color={p.color} transparent opacity={0.8} /></mesh>
              <mesh position={[0,-0.65,0]}><boxGeometry args={[0.1,0.35,0.1]} />
                <ClayMaterial color="#374151" roughness={0.8} /></mesh>
              {!isMobileDevice() && <pointLight position={[0,0,-0.5]} color={p.color} intensity={0.8} distance={3} />}
            </group>
          </RigidBody>
        );
      })}
      {/* Hologram sphere */}
      <mesh position={[cx-5,ty+2.26,z-0.5]}>
        <sphereGeometry args={[0.5,12,12]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.22} emissive="#0ea5e9" emissiveIntensity={0.6} depthWrite={false} wireframe />
      </mesh>
      {!isMobileDevice() && <pointLight position={[cx-5,ty+2.26,z-0.5]} color="#38bdf8" intensity={0.9} distance={4} />}
      <WoodenSign position={[cx-5.5,ty+0.46,z+3]} text="PROJECTS" />
      <Campfire position={[cx+6, ty+0.46, z+2]} isNight={isNight} />
      <LanternPost position={[cx-5, ty+0.46, z+1]} isNight={isNight} />
      {/* Milestone boulders leading in */}
      {[0,1,2].map(i=>(
        <Boulder key={i} position={[cx+(i%2===0?2:-2), ty+0.22, z+5+i*1.4]} scale={0.45} color="#6b7280" />
      ))}
    </group>
  );
}

function Zone_Experience({ z, isNight }) {
  const ty = getTerrainY(z); const cx = getPathCenterX(z);
  const flagRefs = useRef([]);
  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(z - pzVal);
    const visible = dist < 55;
    groupRef.current.visible = visible;

    if (visible) {
      const t = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      flagRefs.current.forEach((m, i) => {
        if (m) {
          m.rotation.z = Math.sin(t * 2.5 + i) * 0.15;
          m.scale.x = 1 + Math.sin(t * 4 + i) * 0.08;
        }
      });
    }
  });

  const flags=[{color:'#ef4444',text:'CLOUD'},{color:'#3b82f6',text:'DEVOPS'},{color:'#22c55e',text:'LINUX'}];
  return (
    <group ref={groupRef}>
      <CheckpointArch z={z + 4} label="EXPERIENCE" isNight={isNight} />
      {flags.map((f,i)=>{
        // Place flag 0 and 1 on left side, flag 2 on right side
        const lx = i < 2 ? cx - 3.3 : cx + 3.3;
        const lz = i === 0 ? z + 1.2 : i === 1 ? z - 1.2 : z;
        return (
          <group key={i} position={[lx,ty+0.46,lz]}>
            <Cyl pos={[0,1.5,0]} args={[0.04,0.04,3.2,5]} color="#9ca3af" />
            <mesh ref={el=>flagRefs.current[i]=el} position={[0.55,2.8,0]}>
              <planeGeometry args={[1.1,0.65]} />
              <ClayMaterial color={f.color} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
          </group>
        );
      })}
      {/* Achievement board */}
      <Box pos={[cx+5.5,ty+1.96,z-0.5]} size={[2.2,1.4,0.1]} color="#7c3d11" />
      {[0.3,-0.1,-0.4].map((oy,i)=>(
        <Box key={i} pos={[cx+5.5,ty+1.96+oy,z-0.45]} size={[1.7-i*0.2,0.12,0.02]}
          color={['#fef3c7','#fde68a','#fbbf24'][i]} />
      ))}
      {/* Milestone stones */}
      {[0,1,2,3].map(i=>(
        <group key={i} position={[cx-6.5+i*1.2,ty+0.8,z+1.5]}>
          <Boulder position={[0,0,0]} color="#4b5563" scale={0.9} />
          <mesh position={[0,0.55,0]}>
            <sphereGeometry args={[0.12,6,6]} />
            <meshBasicMaterial color={['#22c55e','#3b82f6','#a78bfa','#f59e0b'][i]} />
          </mesh>
        </group>
      ))}
      <WoodenSign position={[cx-7.5,ty+0.46,z+1]} text="EXPERIENCE" rotation={0.4} />
      <Campfire position={[cx-5.5, ty+0.46, z-2]} isNight={isNight} />
      <LanternPost position={[cx+5, ty+0.46, z+1]} isNight={isNight} />
      <LanternPost position={[cx-5, ty+0.46, z+1]} isNight={isNight} />
    </group>
  );
}

function Zone_Contact({ z, isNight }) {
  const ty = getTerrainY(z); const cx = getPathCenterX(z);
  const beaconRef = useRef(); const sigRef = useRef();

  // Generate engraved canvas texture for the summit board
  const summitTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 1024, 256);
    
    // Draw engraved shadow for Line 1
    ctx.font = 'bold 62px Outfit, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c0d02';
    ctx.fillText('🏔️ YOU REACHED THE SUMMIT 🏔️', 512 + 4, 80 + 4);
    
    // Draw engraved inner text for Line 1
    ctx.fillStyle = '#fde68a';
    ctx.fillText('🏔️ YOU REACHED THE SUMMIT 🏔️', 512, 80);
    
    // Draw engraved shadow for Line 2
    ctx.font = 'italic bold 36px Outfit, Arial, sans-serif';
    ctx.fillStyle = '#1c0d02';
    ctx.fillText("Let's build something together.", 512 + 3, 170 + 3);
    
    // Draw engraved inner text for Line 2
    ctx.fillStyle = '#fcd34d';
    ctx.fillText("Let's build something together.", 512, 170);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const groupRef = useRef();

  useFrame((s) => {
    if (!groupRef.current) return;
    const pzVal = window.playerZ || 0;
    const dist = Math.abs(z - pzVal);
    const visible = dist < 55;
    groupRef.current.visible = visible;

    if (visible) {
      const t = Math.floor(s.clock.getElapsedTime() * 12) / 12; // 12 FPS stop-motion
      if (beaconRef.current) beaconRef.current.intensity = 2.5 + Math.sin(t * 2.8) * 1.2;
      if (sigRef.current) sigRef.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.12);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Signal tower */}
      <RigidBody type="fixed" position={[cx+5, ty+0.46, z-1]}>
        <CuboidCollider args={[0.3, 2.6, 0.3]} position={[0, 2.6, 0]} />
        <group>
          {[[-0.4,-0.4],[0.4,-0.4],[-0.4,0.4],[0.4,0.4]].map(([lx,lz],i)=>(
            <Box key={i} pos={[lx*0.5,2.5,lz*0.5]} size={[0.07,5.2,0.07]}
              color="#6b7280" rot={[lx*0.08,0,lz*-0.08]} />
          ))}
          {[0.8,1.8,2.8,3.8].map((y,i)=>(
            <Box key={i} pos={[0,y,0]} size={[0.65-i*0.08,0.06,0.65-i*0.08]} color="#9ca3af" />
          ))}
          <Cyl pos={[0,5.5,0]} args={[0.04,0.04,1.2,5]} color="#374151" />
          <mesh ref={sigRef} position={[0,6.2,0]}>
            <sphereGeometry args={[0.16,8,8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          {!isMobileDevice() && <pointLight ref={beaconRef} position={[0,6.2,0]} color="#ef4444" intensity={3} distance={14} />}
        </group>
      </RigidBody>
      
      {/* Satellite dish */}
      <RigidBody type="fixed" position={[cx-5, ty+0.96, z]}>
        <CuboidCollider args={[0.5, 0.8, 0.5]} position={[0, 0.8, 0]} />
        <group>
          <Cyl pos={[0,0.5,0]} args={[0.06,0.06,1.1,5]} color="#6b7280" />
          <mesh position={[0,1.2,0]} rotation={[-0.6,0,0]}>
            <torusGeometry args={[0.65,0.08,8,12,Math.PI]} />
            <ClayMaterial color="#9ca3af" roughness={0.92} metalness={0.0} />
          </mesh>
        </group>
      </RigidBody>
      
      {/* Glowing beacon */}
      <RigidBody type="fixed" position={[cx, ty, z-2]}>
        <CylinderCollider args={[1.3, 0.25]} position={[0, 1.3, 0]} />
        <group>
          <mesh position={[0, 2.66, 0]}>
            <cylinderGeometry args={[0.18, 0.25, 1.8, 10]} />
            <ClayMaterial color="#374151" roughness={0.92} />
          </mesh>
          <mesh position={[0, 3.66, 0]}>
            <sphereGeometry args={[0.38, 12, 12]} />
            <meshStandardMaterial color="#22d3ee" emissive="#0ea5e9" emissiveIntensity={2.5} transparent opacity={0.85} />
          </mesh>
          {!isMobileDevice() && <pointLight position={[0, 3.66, 0]} color="#22d3ee"
            intensity={isNight?5:2.5} distance={16} />}
        </group>
      </RigidBody>
      
      {/* Attractive Summit Wooden Sign Board */}
      <RigidBody type="fixed" position={[cx, ty + 0.46, z - 3.2]}>
        <CuboidCollider args={[2.1, 1.0, 0.1]} position={[0, 1.0, 0]} />
        <group>
          {/* Left post */}
          <Cyl pos={[-1.8, 0.8, 0]} args={[0.08, 0.08, 1.6, 6]} color="#7c3d11" rough={0.92} />
          {/* Right post */}
          <Cyl pos={[1.8, 0.8, 0]} args={[0.08, 0.08, 1.6, 6]} color="#7c3d11" rough={0.92} />
          {/* Sign board panel */}
          <Box pos={[0, 1.3, -0.05]} size={[4.2, 1.2, 0.1]} color="#92400e" />
          {/* Engraved text plane (positioned in front of signboard panel) */}
          <mesh position={[0, 1.3, 0.002]} rotation={[0, 0, 0]}>
            <planeGeometry args={[4.0, 1.0]} />
            <ClayMaterial 
              map={summitTexture} 
              transparent 
              alphaTest={0.01} 
              roughness={0.7} 
            />
          </mesh>
        </group>
      </RigidBody>
    </group>
  );
}

// ── Checkpoint sensors ────────────────────────────────────────────
function CheckpointSensors({ onCheckpointEnter, onCheckpointExit }) {
  const CPS = [
    {id:1,z:-8},{id:2,z:-38},{id:3,z:-70},{id:4,z:-102},{id:5,z:-136},{id:6,z:-168},
  ];
  return (
    <>
      {CPS.map(cp => (
        <RigidBody key={cp.id} type="fixed"
          position={[getPathCenterX(cp.z), getTerrainY(cp.z)+3, cp.z]}
          sensor
          onIntersectionEnter={() => onCheckpointEnter?.(cp.id)}
          onIntersectionExit={()  => onCheckpointExit?.(cp.id)}>
          <CuboidCollider args={[8, 3.5, 5]} sensor />
        </RigidBody>
      ))}
    </>
  );
}



// ── Lighting ──────────────────────────────────────────────────────
function Lighting({ isNight, season }) {
  const ambRef = useRef();
  const dirRef = useRef();
  const hemiRef = useRef();
  const pointRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const colors = useMemo(() => {
    if (season === 'winter') {
      return {
        ambDay: new THREE.Color('#e0f2fe'),
        ambDawn: new THREE.Color('#cbd5e1'),
        ambNight: new THREE.Color('#0f172a'),

        dirDay: new THREE.Color('#f8fafc'),
        dirDawn: new THREE.Color('#94a3b8'),
        dirNight: new THREE.Color('#1e293b'),

        hemiSkyDay: new THREE.Color('#cbd5e1'),
        hemiSkyDawn: new THREE.Color('#94a3b8'),
        hemiSkyNight: new THREE.Color('#090d16'),

        hemiGndDay: new THREE.Color('#475569'),
        hemiGndDawn: new THREE.Color('#334155'),
        hemiGndNight: new THREE.Color('#020617'),

        skyDay: new THREE.Color('#93c5fd'),
        skyDawn: new THREE.Color('#94a3b8'),
        skyNight: new THREE.Color('#020617'),
      };
    } else if (season === 'autumn') {
      return {
        ambDay: new THREE.Color('#ffedd5'),
        ambDawn: new THREE.Color('#f97316'),
        ambNight: new THREE.Color('#1c1917'),

        dirDay: new THREE.Color('#fde68a'),
        dirDawn: new THREE.Color('#ea580c'),
        dirNight: new THREE.Color('#292524'),

        hemiSkyDay: new THREE.Color('#fed7aa'),
        hemiSkyDawn: new THREE.Color('#ea580c'),
        hemiSkyNight: new THREE.Color('#0c0a09'),

        hemiGndDay: new THREE.Color('#78350f'),
        hemiGndDawn: new THREE.Color('#7c2d12'),
        hemiGndNight: new THREE.Color('#1c1917'),

        skyDay: new THREE.Color('#f97316'),
        skyDawn: new THREE.Color('#ea580c'),
        skyNight: new THREE.Color('#0c0a09'),
      };
    } else {
      return {
        ambDay: new THREE.Color('#fef9c3'),
        ambDawn: new THREE.Color('#fbbf24'),
        ambNight: new THREE.Color('#1e2942'),

        dirDay: new THREE.Color('#fff8e1'),
        dirDawn: new THREE.Color('#ea580c'),
        dirNight: new THREE.Color('#3b5bdb'),

        hemiSkyDay: new THREE.Color('#bae6fd'),
        hemiSkyDawn: new THREE.Color('#fbbf24'),
        hemiSkyNight: new THREE.Color('#0f172a'),

        hemiGndDay: new THREE.Color('#6b7280'),
        hemiGndDawn: new THREE.Color('#7c2d12'),
        hemiGndNight: new THREE.Color('#111827'),

        skyDay: new THREE.Color('#bae6fd'),
        skyDawn: new THREE.Color('#ea580c'),
        skyNight: new THREE.Color('#080c18'),
      };
    }
  }, [season]);

  const positions = useMemo(() => {
    return {
      dirPosDay: new THREE.Vector3(18, 28, 8),
      dirPosDawn: new THREE.Vector3(0, 10, -5),
      dirPosNight: new THREE.Vector3(-20, 30, -10),
    };
  }, []);

  const values = useMemo(() => {
    if (season === 'winter') {
      return {
        ambIntDay: 0.6,
        ambIntDawn: 0.45,
        ambIntNight: 0.22,

        dirIntDay: 1.1,
        dirIntDawn: 0.8,
        dirIntNight: 0.35,

        hemiIntDay: 0.5,
        hemiIntDawn: 0.35,
        hemiIntNight: 0.3,

        fogNearDay: 8,
        fogNearDawn: 5,
        fogNearNight: 3,

        fogFarDay: 65,
        fogFarDawn: 50,
        fogFarNight: 45,
      };
    }
    return {
      ambIntDay: 0.55,
      ambIntDawn: 0.5,
      ambIntNight: 0.25,

      dirIntDay: 1.35,
      dirIntDawn: 0.9,
      dirIntNight: 0.45,

      hemiIntDay: 0.45,
      hemiIntDawn: 0.35,
      hemiIntNight: 0.35,

      fogNearDay: 15,
      fogNearDawn: 10,
      fogNearNight: 5,

      fogFarDay: 95,
      fogFarDawn: 80,
      fogFarNight: 65,
    };
  }, [season]);

  const { tempColor1, tempColor2, tempColor3, tempColor4, tempColor5, tempVector1 } = useMemo(() => {
    return {
      tempColor1: new THREE.Color(),
      tempColor2: new THREE.Color(),
      tempColor3: new THREE.Color(),
      tempColor4: new THREE.Color(),
      tempColor5: new THREE.Color(),
      tempVector1: new THREE.Vector3(),
    };
  }, []);

  useFrame((state, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    let u;

    const currentAmbCol = tempColor1;
    let currentAmbInt;

    const currentDirCol = tempColor2;
    let currentDirInt;
    const currentDirPos = tempVector1;

    const currentHemiSkyCol = tempColor3;
    const currentHemiGndCol = tempColor4;
    let currentHemiInt;

    const currentSkyCol = tempColor5;
    let currentFogNear;
    let currentFogFar;

    if (t < 0.5) {
      u = t * 2;
      currentAmbCol.lerpColors(colors.ambDay, colors.ambDawn, u);
      currentAmbInt = THREE.MathUtils.lerp(values.ambIntDay, values.ambIntDawn, u);

      currentDirCol.lerpColors(colors.dirDay, colors.dirDawn, u);
      currentDirInt = THREE.MathUtils.lerp(values.dirIntDay, values.dirIntDawn, u);
      currentDirPos.lerpVectors(positions.dirPosDay, positions.dirPosDawn, u);

      currentHemiSkyCol.lerpColors(colors.hemiSkyDay, colors.hemiSkyDawn, u);
      currentHemiGndCol.lerpColors(colors.hemiGndDay, colors.hemiGndDawn, u);
      currentHemiInt = THREE.MathUtils.lerp(values.hemiIntDay, values.hemiIntDawn, u);

      currentSkyCol.lerpColors(colors.skyDay, colors.skyDawn, u);
      currentFogNear = THREE.MathUtils.lerp(values.fogNearDay, values.fogNearDawn, u);
      currentFogFar = THREE.MathUtils.lerp(values.fogFarDay, values.fogFarDawn, u);
    } else {
      u = (t - 0.5) * 2;
      currentAmbCol.lerpColors(colors.ambDawn, colors.ambNight, u);
      currentAmbInt = THREE.MathUtils.lerp(values.ambIntDawn, values.ambIntNight, u);

      currentDirCol.lerpColors(colors.dirDawn, colors.dirNight, u);
      currentDirInt = THREE.MathUtils.lerp(values.dirIntDawn, values.dirIntNight, u);
      currentDirPos.lerpVectors(positions.dirPosDawn, positions.dirPosNight, u);

      currentHemiSkyCol.lerpColors(colors.hemiSkyDawn, colors.hemiSkyNight, u);
      currentHemiGndCol.lerpColors(colors.hemiGndDawn, colors.hemiGndNight, u);
      currentHemiInt = THREE.MathUtils.lerp(values.hemiIntDawn, values.hemiIntNight, u);

      currentSkyCol.lerpColors(colors.skyDawn, colors.skyNight, u);
      currentFogNear = THREE.MathUtils.lerp(values.fogNearDawn, values.fogNearNight, u);
      currentFogFar = THREE.MathUtils.lerp(values.fogFarDawn, values.fogFarNight, u);
    }

    if (ambRef.current) {
      ambRef.current.color.copy(currentAmbCol);
      ambRef.current.intensity = currentAmbInt;
    }
    if (dirRef.current) {
      dirRef.current.color.copy(currentDirCol);
      dirRef.current.intensity = currentDirInt;
      
      const playerZ = window.playerZ || 0;
      dirRef.current.position.set(
        currentDirPos.x,
        currentDirPos.y,
        currentDirPos.z + playerZ
      );
      dirRef.current.target.position.set(0, 0, playerZ);
      dirRef.current.target.updateMatrixWorld(true);
    }
    if (hemiRef.current) {
      hemiRef.current.color.copy(currentHemiSkyCol);
      hemiRef.current.groundColor.copy(currentHemiGndCol);
      hemiRef.current.intensity = currentHemiInt;
    }
    if (pointRef.current) {
      if (t > 0.5) {
        pointRef.current.intensity = u * 1.2;
      } else {
        pointRef.current.intensity = 0;
      }
    }

    const { scene } = state;
    if (scene.background) {
      scene.background.copy(currentSkyCol);
    }
    if (scene.fog) {
      scene.fog.color.copy(currentSkyCol);
      scene.fog.near = currentFogNear;
      scene.fog.far = currentFogFar;
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} />
      <directionalLight
        ref={dirRef}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={70}
        shadow-camera-near={0.1}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0005}
      />
      <hemisphereLight ref={hemiRef} />
      {!isMobileDevice() && (
        <pointLight
          ref={pointRef}
          position={[15, 45, -80]}
          color="#7dd3fc"
          distance={200}
        />
      )}
    </>
  );
}


// ════════════════════════════════════════════════════════════════
// CLAY SUN (Summer day only)
// ════════════════════════════════════════════════════════════════
function ClaySun() {
  const groupRef = useRef();

  const rays = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      return {
        angle,
        x: Math.cos(angle) * 2.3,
        y: Math.sin(angle) * 2.3,
        rotZ: angle - Math.PI / 2,
      };
    });
  }, []);

  useFrame((s) => {
    const playerZ = window.playerZ || 0;
    if (groupRef.current) {
      groupRef.current.position.set(18, 28, 8 + playerZ);
      const realT = s.clock.getElapsedTime();
      const t = Math.floor(realT * 12) / 12; // 12 FPS stop-motion
      groupRef.current.rotation.z = t * 0.15;
      const wiggleScale = 1.0 + Math.sin(t * 8.0) * 0.05;
      groupRef.current.scale.set(wiggleScale, wiggleScale, wiggleScale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Sun center */}
      <mesh castShadow>
        <sphereGeometry args={[1.8, 16, 16]} />
        <ClayMaterial color="#f59e0b" roughness={0.9} />
      </mesh>

      {/* Sun rays */}
      {rays.map((ray, i) => (
        <mesh key={i} position={[ray.x, ray.y, 0]} rotation={[0, 0, ray.rotZ]} castShadow>
          <coneGeometry args={[0.3, 1.2, 5]} />
          <ClayMaterial color="#fbbf24" roughness={0.88} />
        </mesh>
      ))}
    </group>
  );
}


// ── Main Environment ──────────────────────────────────────────────
export default function Environment({ onCheckpointEnter, onCheckpointExit, isNight, isMobile, season }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.isMobileDevice = !!isMobile;
    }
  }, [isMobile]);

  return (
    <group>
      <Lighting isNight={isNight} season={season} />

      {/* ── SKY ELEMENTS ── */}
      <NightSky isNight={isNight} />
      <DayClouds isNight={isNight} season={season} />
      <AnimatedBirds isNight={isNight} season={season} />
      {season === 'summer' && !isNight && <ClaySun />}

      {/* ── TERRAIN (flat segments = no rotation bug) ── */}
      <WalkableTrail isNight={isNight} season={season} />

      {/* ── MOUNTAIN VISUALS ── */}
      <group position={[0, 0, -150]}>
        <MountainBody isNight={isNight} season={season} />
      </group>
      <SurroundingMountains isNight={isNight} season={season} />

      {/* ── NATURE ── */}
      <ForestDecorations season={season} />
      <MistBands isNight={isNight} />
      <WindLeaves season={season} />
      <SnowParticles season={season} />
      <Fireflies isNight={isNight} />
      <Waterfall />
      <FlowingStream isNight={isNight} />

      {/* ── BASE CAMP ── */}
      <Zone_AboutMe z={-8} isNight={isNight} />

      {/* ── Trail lanterns ── */}
      {[-15,-30,-45,-60,-75,-90,-105,-120,-135,-150,-165,-180].map((z,i)=>(
        <LanternPost key={i}
          position={[getPathCenterX(z)+(i%2===0?2.8:-2.8), getTerrainY(z)+0.46, z]}
          isNight={isNight} />
      ))}

      {/* ── CHECKPOINTS ── */}
      <Zone_Education  z={-38}  isNight={isNight} />
      <Zone_Skills     z={-70}  isNight={isNight} />
      <Zone_Projects   z={-102} isNight={isNight} />
      <Zone_Experience z={-136} isNight={isNight} />
      <Zone_Contact    z={-168} isNight={isNight} />

      {/* ── PHYSICS TRIGGERS ── */}
      <CheckpointSensors
        onCheckpointEnter={onCheckpointEnter}
        onCheckpointExit={onCheckpointExit}
      />
    </group>
  );
}
