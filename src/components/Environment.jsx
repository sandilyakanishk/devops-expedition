// ================================================================
// Environment.jsx — Low-Poly Mountain Trek (reference-matched)
// Mountain CONE shapes, flat walkable trail segments, stars/birds
// ================================================================
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

const isMobileDevice = typeof window !== 'undefined' && !!window.isMobileDevice;

// ── Terrain math ──────────────────────────────────────────────────
const TRAIL_LENGTH = 185;
const TRAIL_RISE   = 0;

function getTerrainY(z) {
  return 0;
}
// Path center is perfectly straight
function getPathCenterX(z) {
  return 0;
}

// ── Tiny geometry helpers ─────────────────────────────────────────
const Box = ({ pos, size, color, rot = [0,0,0], emissive, emissiveInt = 0.9, rough = 0.85, cast = true }) => (
  <mesh position={pos} rotation={rot} castShadow={cast} receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={rough}
      emissive={emissive || color} emissiveIntensity={emissive ? emissiveInt : 0} />
  </mesh>
);
const Cyl = ({ pos, args, color, rot = [0,0,0], rough = 0.82 }) => (
  <mesh position={pos} rotation={rot} castShadow>
    <cylinderGeometry args={args} />
    <meshStandardMaterial color={color} roughness={rough} flatShading />
  </mesh>
);


// ── Boulder ───────────────────────────────────────────────────────
function Boulder({ position, scale = 1, color = '#6b7280' }) {
  const r = useMemo(() => [Math.random()*0.6, Math.random()*2, Math.random()*0.4], []);
  return (
    <mesh position={position} rotation={r} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5 * scale, 0]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
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
    const cullDist = isMobileDevice ? 35 : 70;
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

    const t = s.clock.getElapsedTime();
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
    <group ref={groupRef} position={[px, py, pz]}>
      {[0,60,120,180,240,300].map((deg, i) => (
        <mesh key={i} castShadow
          position={[Math.cos(deg*Math.PI/180)*0.4, 0.06, Math.sin(deg*Math.PI/180)*0.4]}
          rotation={[0, (deg+30)*Math.PI/180, Math.PI/2]}>
          <cylinderGeometry args={[0.07, 0.09, 0.8, 6]} />
          <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
        </mesh>
      ))}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <mesh key={i} position={[Math.cos(deg*Math.PI/180)*0.55, 0.05, Math.sin(deg*Math.PI/180)*0.55]}>
          <dodecahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="#4b5563" roughness={0.9} flatShading />
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
      {!isMobileDevice && <pointLight ref={glowRef} color="#ff8c00" intensity={2.5} distance={10} />}
    </group>
  );
}

// ── Tent ──────────────────────────────────────────────────────────
function Tent({ position, rotation = 0, color = '#92400e' }) {
  const [px, py, pz] = position;
  return (
    <group position={[px, py, pz]} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <coneGeometry args={[1.1, 1.6, 4]} />
        <meshStandardMaterial color={color} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0, 0.05, 0.95]}>
        <planeGeometry args={[0.55, 0.9]} />
        <meshStandardMaterial color="#292524" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── Wooden Hut ────────────────────────────────────────────────────
function WoodenHut({ position }) {
  const [px, py, pz] = position;
  return (
    <group position={[px, py, pz]}>
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[3.2, 2.0, 2.8]} />
        <meshStandardMaterial color="#7c3d11" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 2.45, 0]}>
        <coneGeometry args={[2.5, 1.5, 4]} />
        <meshStandardMaterial color="#3b1f0a" roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0, 0.6, 1.42]}>
        <boxGeometry args={[0.8, 1.4, 0.08]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} />
      </mesh>
      {[-1, 1].map(s => (
        <mesh key={s} position={[s * 1.0, 1.1, 1.42]}>
          <boxGeometry args={[0.55, 0.55, 0.06]} />
          <meshStandardMaterial color="#bfdbfe" roughness={0.1} transparent opacity={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[0.9, 3.0, -0.4]}>
        <boxGeometry args={[0.38, 0.9, 0.38]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
    </group>
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
    const cullDist = isMobileDevice ? 30 : 60;
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
        lRef.current.intensity = t * (5 + Math.sin(s.clock.getElapsedTime() * 11) * 0.5);
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
    <group ref={groupRef} position={[px, py, pz]}>
      <Cyl pos={[0, 1.1, 0]} args={[0.04, 0.04, 2.4, 5]} color="#374151" />
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[0.28, 0.36, 0.28]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.5} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[0.2, 0.28, 0.2]} />
        <meshStandardMaterial
          ref={matRef}
          color="#555555"
          emissive="#fbbf24"
          emissiveIntensity={0}
          transparent
          opacity={0.4}
        />
      </mesh>
      {!isMobileDevice && <pointLight ref={lRef} position={[0, 2.3, 0]} color="#ff9f00" intensity={0} distance={12} />}
    </group>
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
    const cullDist = isMobileDevice ? 25 : 55;
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

    if (flameRef.current) {
      const scaleY = 1 + Math.sin(s.clock.getElapsedTime() * 12 + position[2]) * 0.15 * t;
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
        lRef.current.intensity = t * (2 + Math.sin(s.clock.getElapsedTime() * 14 + position[2]) * 0.4);
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
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.6} />
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
      {!isMobileDevice && (
        <pointLight ref={lRef} position={[0, 0.9, 0]} color="#ff7f00" intensity={0} distance={8} />
      )}
    </group>
  );
}

// ── Wooden Sign ───────────────────────────────────────────────────
function WoodenSign({ position, text, rotation = 0 }) {
  const [px, py, pz] = position;
  return (
    <group position={[px, py, pz]} rotation={[0, rotation, 0]}>
      <Cyl pos={[0, 0.55, 0]} args={[0.04, 0.05, 1.1, 5]} color="#92400e" />
      <mesh castShadow position={[0, 1.18, 0]}>
        <boxGeometry args={[1.0, 0.46, 0.1]} />
        <meshStandardMaterial color="#7c3d11" roughness={0.9} />
      </mesh>
      <Html position={[px, py+1.18, pz]} center distanceFactor={6} style={{pointerEvents:'none'}}>
        <div style={{
          color:'#fef3c7', fontFamily:"'Outfit',sans-serif",
          fontSize:'9px', fontWeight:700, letterSpacing:'0.06em',
          textShadow:'0 1px 2px rgba(0,0,0,0.8)', whiteSpace:'nowrap',
        }}>{text}</div>
      </Html>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// MOUNTAIN BODY — cone-based low-poly mountain (like the reference)
// ════════════════════════════════════════════════════════════════
function MountainBody({ isNight }) {
  const grassMatRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);
  const color1 = useMemo(() => new THREE.Color('#22c55e'), []);
  const color2 = useMemo(() => new THREE.Color('#14532d'), []);
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
        <coneGeometry args={[58, 22, 8]} />
        <meshStandardMaterial ref={grassMatRef} color="#22c55e" roughness={0.92} flatShading />
      </mesh>

      {/* ── Mid mountain rocky body ── */}
      <mesh castShadow position={[0, 12, -100]}>
        <coneGeometry args={[40, 28, 7]} />
        <meshStandardMaterial color={rockCol} roughness={0.94} flatShading />
      </mesh>

      {/* ── Upper rocky section ── */}
      <mesh castShadow position={[0, 24, -112]}>
        <coneGeometry args={[26, 26, 6]} />
        <meshStandardMaterial color={darkRock} roughness={0.95} flatShading />
      </mesh>

      {/* ── Near-summit grey rocky peak ── */}
      <mesh castShadow position={[0, 34, -125]}>
        <coneGeometry args={[16, 22, 6]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} flatShading />
      </mesh>

      {/* ── Snow/ice sections (like the reference) ── */}
      {[
        [-8, 40, -138], [7, 42, -142], [0, 47, -150],
        [-5, 44, -155], [4, 49, -158],
      ].map(([x, y, z], i) => (
        <mesh key={i} castShadow position={[x, y, z]}>
          <coneGeometry args={[10-i*1.4, 14-i*1.2, 5+i]} />
          <meshStandardMaterial color={snowCol} roughness={0.8} flatShading />
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
          <dodecahedronGeometry args={[5 + (i%3)*2, 0]} />
          <meshStandardMaterial color={i > 4 ? darkRock : rockCol} roughness={0.96} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// SURROUNDING MOUNTAINS — cone shapes on both sides (no wall blocks)
// ════════════════════════════════════════════════════════════════
function SurroundingMountains({ isNight }) {
  const grassMatRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);
  const color1 = useMemo(() => new THREE.Color('#16a34a'), []);
  const color2 = useMemo(() => new THREE.Color('#14532d'), []);
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
            <coneGeometry args={[m.r * 1.6, m.h * 0.38, 7]} />
            <meshStandardMaterial ref={grassMatRef} color="#16a34a" roughness={0.92} flatShading />
          </mesh>
          {/* Rocky body */}
          <mesh position={[0, m.h * 0.25, 0]}>
            <coneGeometry args={[m.r * 0.95, m.h * 0.68, 6]} />
            <meshStandardMaterial color={m.rocky ? '#374151' : '#4b5563'} roughness={0.94} flatShading />
          </mesh>
          {/* Snow cap on tall ones */}
          {m.h > 40 && (
            <mesh position={[0, m.h * 0.62, 0]}>
              <coneGeometry args={[m.r * 0.35, m.h * 0.22, 5]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.82} flatShading />
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
function WalkableTrail({ isNight }) {
  const SEG_COUNT = 80;
  const SEG_STEP  = TRAIL_LENGTH / SEG_COUNT;   // 2.3125 z-units per seg
  const SEG_WIDTH = 7;                           // walkable width
  const HALF_H    = 0.4;

  const grassMatRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);
  const color1 = useMemo(() => new THREE.Color('#22c55e'), []);
  const color2 = useMemo(() => new THREE.Color('#166534'), []);
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

  const rockC  = '#6b7280';
  const snowC  = '#f0f9ff';
  const dirtC  = '#92400e';

  const materials = useMemo(() => {
    return {
      snow: new THREE.MeshStandardMaterial({ color: snowC, roughness: 0.93, flatShading: true }),
      rock: new THREE.MeshStandardMaterial({ color: rockC, roughness: 0.93, flatShading: true }),
      grass: new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.93, flatShading: true }),
    };
  }, []);

  materials.grass.name = "grassMaterial";
  grassMatRef.current = materials.grass;

  // Instanced trail rocks memo
  const trailRocks = useMemo(() => {
    const arr = [];
    const SEG_DEPTH = SEG_STEP + 1.8;
    for (let i = 0; i < SEG_COUNT; i++) {
      const t = (i + 0.5) / SEG_COUNT;
      if (t > 0.88) continue;
      const z = -(i + 0.5) * SEG_STEP;
      const y = 0.43;

      const r1 = Math.abs(Math.sin(i * 18.23));
      const r2 = Math.abs(Math.cos(i * 27.54));
      const r3 = Math.abs(Math.sin(i * 38.82));
      const r4 = Math.abs(Math.cos(i * 49.19));

      const rock1_x = (r1 - 0.5) * 2.2;
      const rock1_z = z + (r2 - 0.5) * SEG_DEPTH;
      const rock1_scale = 0.42 + r1 * 0.38;
      const rock1_rot = r2 * Math.PI;

      const rock2_x = (r3 - 0.5) * 2.2;
      const rock2_z = z + (r4 - 0.5) * SEG_DEPTH;
      const rock2_scale = 0.38 + r3 * 0.38;
      const rock2_rot = r4 * Math.PI;

      const color1 = r1 > 0.66 ? '#57534e' : r1 > 0.33 ? '#78716c' : '#44403c';
      const color2 = r3 > 0.66 ? '#78716c' : r3 > 0.33 ? '#44403c' : '#57534e';

      arr.push({ x: rock1_x, y, z: rock1_z, scale: rock1_scale, rot: rock1_rot, color: color1 });
      arr.push({ x: rock2_x, y, z: rock2_z, scale: rock2_scale, rot: rock2_rot, color: color2 });
    }
    return arr;
  }, [SEG_STEP]);

  const trailRocksRef = useRef();

  useEffect(() => {
    if (!trailRocksRef.current) return;
    const tempObj = new THREE.Object3D();
    const tempColor = new THREE.Color();

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
  }, [trailRocks]);

  // Pebbles instancing
  const pebbles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) {
      const z   = -3 - i * 3.1;
      const cx  = 0;
      const ty  = 0.12;
      const side = i % 2 === 0 ? 1 : -1;
      const scale = 0.1 + (i % 4) * 0.04;
      arr.push({
        x: cx + side * (1.9 + (i % 4) * 0.35),
        y: ty,
        z,
        scale,
      });
    }
    return arr;
  }, []);

  const pebblesRef = useRef();

  useEffect(() => {
    if (!pebblesRef.current) return;
    const tempObj = new THREE.Object3D();
    pebbles.forEach((p, idx) => {
      tempObj.position.set(p.x, p.y, p.z);
      tempObj.rotation.set(0, idx * 0.8, 0);
      tempObj.scale.setScalar(p.scale);
      tempObj.updateMatrix();
      pebblesRef.current.setMatrixAt(idx, tempObj.matrix);
    });
    pebblesRef.current.instanceMatrix.needsUpdate = true;
  }, [pebbles]);

  // Snow patches instancing
  const snowPatches = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const z  = -108 - i * 6.5;
      const cx = 0;
      const ty = 0.44;
      arr.push({
        x: cx + (i % 2 === 0 ? 2.8 : -2.8),
        y: ty,
        z,
      });
    }
    return arr;
  }, []);

  const snowPatchesRef = useRef();

  useEffect(() => {
    if (!snowPatchesRef.current) return;
    const tempObj = new THREE.Object3D();
    snowPatches.forEach((p, idx) => {
      tempObj.position.set(p.x, p.y, p.z);
      tempObj.scale.set(2.2, 0.08, 1.5);
      tempObj.updateMatrix();
      snowPatchesRef.current.setMatrixAt(idx, tempObj.matrix);
    });
    snowPatchesRef.current.instanceMatrix.needsUpdate = true;
  }, [snowPatches]);

  return (
    <group>
      {/* A single, large, static RigidBody for physics (representing the entire flat path) */}
      <RigidBody type="fixed" position={[0, 0, -92.5]}>
        <CuboidCollider args={[SEG_WIDTH / 2, HALF_H, 92.5]} />
      </RigidBody>

      {/* Visual boxes for the three zones of the trail */}
      {/* 1. Grass zone */}
      <group>
        <mesh receiveShadow position={[0, 0, -61.28]}>
          <boxGeometry args={[7, HALF_H * 2, 122.56]} />
          <primitive object={materials.grass} attach="material" />
        </mesh>
        <mesh receiveShadow position={[0, -1.2, -61.28]}>
          <boxGeometry args={[26, 2.4, 122.56]} />
          <primitive object={materials.grass} attach="material" />
        </mesh>
        <mesh position={[0, 0.42, -61.28]} receiveShadow>
          <boxGeometry args={[3.2, 0.06, 122.56]} />
          <meshStandardMaterial color={dirtC} roughness={0.97} />
        </mesh>
      </group>

      {/* 2. Rock zone */}
      <group>
        <mesh receiveShadow position={[0, 0, -142.22]}>
          <boxGeometry args={[7, HALF_H * 2, 39.31]} />
          <primitive object={materials.rock} attach="material" />
        </mesh>
        <mesh receiveShadow position={[0, -1.2, -142.22]}>
          <boxGeometry args={[26, 2.4, 39.31]} />
          <primitive object={materials.rock} attach="material" />
        </mesh>
      </group>

      {/* 3. Snow zone */}
      <group>
        <mesh receiveShadow position={[0, 0, -173.44]}>
          <boxGeometry args={[7, HALF_H * 2, 23.13]} />
          <primitive object={materials.snow} attach="material" />
        </mesh>
        <mesh receiveShadow position={[0, -1.2, -173.44]}>
          <boxGeometry args={[26, 2.4, 23.13]} />
          <primitive object={materials.snow} attach="material" />
        </mesh>
      </group>

      {/* Instanced trail rocks */}
      <instancedMesh ref={trailRocksRef} args={[null, null, trailRocks.length]} receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial roughness={0.96} flatShading />
      </instancedMesh>

      {/* Instanced path-edge pebbles */}
      <instancedMesh ref={pebblesRef} args={[null, null, pebbles.length]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#78716c" roughness={0.95} flatShading />
      </instancedMesh>

      {/* Instanced snow patches */}
      <instancedMesh ref={snowPatchesRef} args={[null, null, snowPatches.length]} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f0f9ff" roughness={0.85} />
      </instancedMesh>

      {/* Torches spaced along the trail */}
      {Array.from({ length: 16 }).map((_, i) => {
        const segIdx = i * 5;
        const z = -(segIdx + 0.5) * SEG_STEP;
        const y = 0.4;
        const cx = 0;
        const side = segIdx % 2 === 0 ? 1 : -1;
        // Expose fewer lights/meshes on mobile
        if (isMobileDevice && segIdx % 15 !== 0) return null;

        return (
          <FireTorch key={i} position={[cx + side * 3.8, y, z]} isNight={isNight} />
        );
      })}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// FOREST — trees and boulders on mountain slopes
// ════════════════════════════════════════════════════════════════
function ForestDecorations() {
  const trees = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 110; i++) {
      const z     = -1 - i * 1.72;
      const cx    = getPathCenterX(z);
      const ty    = getTerrainY(z);
      const side  = i % 2 === 0 ? -1 : 1;
      const dist  = 4.5 + (i % 5) * 1.8;
      const scale = 0.65 + (i % 4) * 0.25;
      if (z > -165) arr.push({ x: cx + side*dist, y: ty, z, scale });
    }
    return arr;
  }, []);

  const boulders = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 65; i++) {
      const z  = -2 - i * 2.9;
      const cx = getPathCenterX(z);
      const ty = getTerrainY(z);
      const side = i%3===0 ? 1 : (i%3===1 ? -1 : (i%5<2?1:-1));
      arr.push({
        x: cx + side*(2.8 + (i%5)*0.9),
        y: ty + 0.12, z,
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

  useEffect(() => {
    if (!trunkRef.current || !cone1Ref.current || !cone2Ref.current || !cone3Ref.current || !boulderRef.current) return;

    const tempObj = new THREE.Object3D();

    // Populate trees
    trees.forEach((t, i) => {
      // Trunk: Cyl pos={[0, 0.55*s, 0]} args={[0.1*s, 0.14*s, 1.1*s, 6]}
      tempObj.position.set(t.x, t.y + 0.55 * t.scale, t.z);
      tempObj.rotation.set(0, (i * 0.5) % (Math.PI * 2), 0);
      tempObj.scale.set(t.scale, t.scale, t.scale);
      tempObj.updateMatrix();
      trunkRef.current.setMatrixAt(i, tempObj.matrix);

      // Cone 1: pos={[0, 1.4*s, 0]}
      tempObj.position.set(t.x, t.y + 1.4 * t.scale, t.z);
      tempObj.updateMatrix();
      cone1Ref.current.setMatrixAt(i, tempObj.matrix);

      // Cone 2: pos={[0, 2.1*s, 0]}
      tempObj.position.set(t.x, t.y + 2.1 * t.scale, t.z);
      tempObj.updateMatrix();
      cone2Ref.current.setMatrixAt(i, tempObj.matrix);

      // Cone 3: pos={[0, 2.7*s, 0]}
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
  }, [trees, boulders]);

  return (
    <group>
      {/* Pine Trunks */}
      <instancedMesh ref={trunkRef} args={[null, null, trees.length]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 1.1, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.95} flatShading />
      </instancedMesh>

      {/* Pine Cone 1 */}
      <instancedMesh ref={cone1Ref} args={[null, null, trees.length]} castShadow>
        <coneGeometry args={[0.72, 1.5, 7]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.85} flatShading />
      </instancedMesh>

      {/* Pine Cone 2 */}
      <instancedMesh ref={cone2Ref} args={[null, null, trees.length]} castShadow>
        <coneGeometry args={[0.5, 1.1, 7]} />
        <meshStandardMaterial color="#1b4332" roughness={0.88} flatShading />
      </instancedMesh>

      {/* Pine Cone 3 */}
      <instancedMesh ref={cone3Ref} args={[null, null, trees.length]} castShadow>
        <coneGeometry args={[0.3, 0.8, 6]} />
        <meshStandardMaterial color="#166534" roughness={0.9} flatShading />
      </instancedMesh>

      {/* Boulders */}
      <instancedMesh ref={boulderRef} args={[null, null, boulders.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
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
  const Z = -88; const ty = getTerrainY(Z);

  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const d = strips[i];
      const cycle = (t * d.speed + d.delay) % 6;
      m.position.y = ty + 9 - cycle * 1.5;
      if (m.position.y < ty - 2) m.position.y = ty + 9;
    });
  });

  return (
    <group>
      <mesh castShadow position={[getPathCenterX(Z)-9, ty+7, Z]}>
        <boxGeometry args={[5, 16, 6]} />
        <meshStandardMaterial color="#374151" roughness={0.95} flatShading />
      </mesh>
      {strips.map((d, i) => (
        <mesh key={i} ref={el => meshes.current[i] = el}
          position={[getPathCenterX(Z)-10+d.ox, ty+8, Z]}>
          <boxGeometry args={[d.w, d.len, 0.1]} />
          <meshStandardMaterial color="#93c5fd" transparent opacity={0.68}
            roughness={0.08} depthWrite={false} />
        </mesh>
      ))}
      <mesh receiveShadow position={[getPathCenterX(Z)-10, ty-0.1, Z]}>
        <cylinderGeometry args={[2.8, 2.8, 0.22, 14]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7}
          roughness={0.04} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// NIGHT SKY — 600 twinkling stars + Milky Way + Moon
// ════════════════════════════════════════════════════════════════
function NightSky({ isNight }) {
  const COUNT = isMobileDevice ? 400 : 1800;

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
  }, []);

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
      starSystem.mat.uniforms.uTime.value = s.clock.getElapsedTime();
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
function DayClouds({ isNight }) {
  const cloudData = useMemo(() => Array.from({length: 16}).map((_, i) => ({
    x: -65 + i * 10,
    y:  20 + (i%4)*3.5,
    z: -12 - (i%6)*32,
    speed: 0.007 + (i%3)*0.003,
    scale: 1.0 + (i%4)*0.4,
  })), []);

  const refs = useRef([]);
  const groupRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const sharedMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f8fafc"),
    transparent: true,
    opacity: 0.88,
    roughness: 0.92,
    depthWrite: false,
  }), []);

  useFrame((s, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    const isVisible = (1 - t) > 0.001;

    if (groupRef.current) groupRef.current.visible = isVisible;

    if (isVisible) {
      sharedMaterial.opacity = (1 - t) * 0.88;
      refs.current.forEach((c, i) => {
        if (!c) return;
        c.position.x += cloudData[i].speed;
        if (c.position.x > 72) c.position.x = -72;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {cloudData.map((d, i) => (
        <group key={i} ref={el => refs.current[i] = el}
          position={[d.x, d.y, d.z]} scale={d.scale}>
          {[
            [0,0,0],[1.3,0.4,0],[-1.1,0.3,0],[0.55,0.85,0],
            [-0.5,0.6,0],[2.1,0.1,0],[-1.8,0.1,0],
            [0.1,0.1,0.6],[-0.2,0.2,-0.6],[1.0,0.5,0.4],
          ].map(([cx,cy,cz], j) => (
            <mesh key={j} position={[cx, cy, cz]}>
              <sphereGeometry args={[0.82+(j%3)*0.24, 6, 5]} />
              <primitive object={sharedMaterial} attach="material" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// ANIMATED BIRDS — flocking V-formation (day only)
// ════════════════════════════════════════════════════════════════
function AnimatedBirds({ isNight }) {
  const FLOCK = 35;
  const birds = useMemo(() => Array.from({length: FLOCK}).map((_, i) => ({
    x: -22 + (i%7)*6, 
    y: 12 + (i%4)*2.8, 
    z: -10 - Math.floor(i/7)*32,
    speed: 0.55 + (i%7)*0.035, 
    flap: 4+Math.random()*3, 
    phase: i*0.48,
  })), []);

  const birdRefs = useRef([]);
  const lRefs    = useRef([]);
  const rRefs    = useRef([]);
  const groupRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const wingMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#1f2937"),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1
  }), []);
  
  const bodyMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color("#111827"),
    transparent: true,
    opacity: 1
  }), []);

  useFrame((s, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    const isVisible = (1 - t) > 0.001;

    if (groupRef.current) groupRef.current.visible = isVisible;

    if (isVisible) {
      wingMaterial.opacity = 1 - t;
      bodyMaterial.opacity = 1 - t;
      
      const time = s.clock.getElapsedTime();
      birdRefs.current.forEach((b, i) => {
        if (!b) return;
        b.position.x += birds[i].speed * 0.016;
        b.position.y = birds[i].y + Math.sin(time*0.38 + birds[i].phase)*1.3;
        if (b.position.x > 55) b.position.x = -50;
      });
      lRefs.current.forEach((w, i) => {
        if (!w) return;
        w.rotation.z = -0.28 + Math.sin(time*birds[i].flap + birds[i].phase)*0.52;
      });
      rRefs.current.forEach((w, i) => {
        if (!w) return;
        w.rotation.z =  0.28 - Math.sin(time*birds[i].flap + birds[i].phase)*0.52;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {birds.map((d, i) => (
        <group key={i} ref={el => birdRefs.current[i]=el} position={[d.x, d.y, d.z]}>
          <mesh ref={el => lRefs.current[i]=el} position={[-0.26,0,0]}>
            <planeGeometry args={[0.58, 0.17]} />
            <primitive object={wingMaterial} attach="material" />
          </mesh>
          <mesh ref={el => rRefs.current[i]=el} position={[0.26,0,0]}>
            <planeGeometry args={[0.58, 0.17]} />
            <primitive object={wingMaterial} attach="material" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.08,4,4]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// WIND LEAVES
// ════════════════════════════════════════════════════════════════
function WindLeaves() {
  if (isMobileDevice) return null;
  const COUNT = 30;
  const leafData = useMemo(() => Array.from({length:COUNT}).map((_,i)=>({
    startX: -6+Math.random()*12, startY: 1+Math.random()*4,
    startZ: -2-Math.random()*90, speed: 0.22+Math.random()*0.42,
    drift: 0.45+Math.random()*1.4,
    color: ['#4d7c0f','#65a30d','#86efac','#a3e635','#d9f99d'][i%5],
  })), []);
  const meshes = useRef([]);

  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    meshes.current.forEach((m, i) => {
      if (!m) return;
      const d = leafData[i];
      const cycle = (t * d.speed + i * 1.1) % 7;
      m.position.x = d.startX + Math.sin(cycle*0.9)*1.8 + cycle*d.drift*0.28;
      m.position.y = d.startY + Math.sin(cycle*1.3+i)*0.45 - cycle*0.13;
      m.position.z = d.startZ + Math.cos(cycle*0.7+i)*1.1;
      m.rotation.x = cycle * 2.2;
      m.rotation.z = Math.sin(cycle*1.6+i)*0.6;
      if (cycle > 6.6) { m.position.x = d.startX; m.position.y = d.startY; }
    });
  });

  return (
    <group>
      {leafData.map((d,i) => (
        <mesh key={i} ref={el=>meshes.current[i]=el} position={[d.startX, d.startY, d.startZ]}>
          <planeGeometry args={[0.14, 0.09]} />
          <meshStandardMaterial color={d.color} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════
// SNOW PARTICLES (upper trail)
// ════════════════════════════════════════════════════════════════
function SnowParticles() {
  const COUNT = isMobileDevice ? 25 : 80;

  const snowSystem = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const drifts = new Float32Array(COUNT);
    const sizes = new Float32Array(COUNT);
    const baseYs = new Float32Array(COUNT);
    const terrainYs = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const x = -8 + Math.random() * 16;
      const z = -105 - Math.random() * 80;
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
  }, []);

  useFrame((s) => {
    snowSystem.mat.uniforms.uTime.value = s.clock.getElapsedTime();
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
      firefliesSystem.mat.uniforms.uTime.value = state.clock.getElapsedTime();
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
  if (isMobileDevice) return null;
  const zPositions = [-22,-55,-88,-125,-162];

  const mistMatRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);
  
  const color1 = useMemo(() => new THREE.Color('#e2e8f0'), []);
  const color2 = useMemo(() => new THREE.Color('#1e2942'), []);
  const tempCol = useMemo(() => new THREE.Color(), []);

  const sharedMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e2e8f0'),
    transparent: true,
    opacity: 0.11,
    depthWrite: false,
  }), []);

  mistMatRef.current = sharedMaterial;

  useFrame((s, delta) => {
    const transitionSpeed = 0.25;
    if (isNight) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * transitionSpeed);
    } else {
      transitionRef.current = Math.max(0, transitionRef.current - delta * transitionSpeed);
    }
    const t = transitionRef.current;
    
    if (mistMatRef.current) {
      tempCol.lerpColors(color1, color2, t);
      mistMatRef.current.color.copy(tempCol);
      mistMatRef.current.opacity = 0.11 + t * 0.05;
    }
  });

  return (
    <group>
      {zPositions.map((z, i) => {
        const ty = getTerrainY(z);
        const cx = getPathCenterX(z);
        return (
          <group key={i}>
            {[-1,0,1,2,-2].map(j => (
              <mesh key={j} position={[cx+j*5, ty+0.35+i*0.15, z+j*2]}>
                <sphereGeometry args={[2.4+j*0.4, 6, 5]} />
                <primitive object={sharedMaterial} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
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
    const cullDist = isMobileDevice ? 25 : 55;
    
    if (dist > cullDist) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;

    const t = s.clock.getElapsedTime();
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
      <Cyl pos={[cx - 4.2, ty + 1.65, z]} args={[0.12, 0.14, 3.3, 7]} color="#7c3d11" rough={0.92} />
      {/* Right post */}
      <Cyl pos={[cx + 4.2, ty + 1.65, z]} args={[0.12, 0.14, 3.3, 7]} color="#7c3d11" rough={0.92} />
      {/* Crossbar */}
      <Box pos={[cx, ty + 3.32, z]} size={[8.8, 0.18, 0.18]} color="#92400e" />
      {/* Banner */}
      <Box pos={[cx, ty + 3.0, z - 0.05]} size={[3.8, 0.48, 0.06]} color="#b45309" />
      
      {/* Engraved text plane on Banner (positioned in front of banner box) */}
      <mesh position={[cx, ty + 3.0, z - 0.018]} rotation={[0, 0, 0]}>
        <planeGeometry args={[3.7, 0.46]} />
        <meshStandardMaterial 
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
      {!isMobileDevice && <pointLight ref={flameRef} position={[cx - 4.2, ty + 3.88, z]} color="#ff9900" intensity={3} distance={7} />}
      {/* Right torch */}
      <Cyl pos={[cx + 4.2, ty + 3.6, z]} args={[0.05, 0.07, 0.28, 6]} color="#7c3d11" />
      <mesh position={[cx + 4.2, ty + 3.78, z]}>
        <sphereGeometry args={[0.09, 6, 6]} />
        <meshStandardMaterial color="#ff7700" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>
      {!isMobileDevice && <pointLight ref={flameRef2} position={[cx + 4.2, ty + 3.88, z]} color="#ff9900" intensity={3} distance={7} />}
      {/* Flag pennants on posts */}
      {[[-4.2, '#ef4444'], [4.2, '#3b82f6']].map(([ox, col], i) => (
        <mesh key={i} position={[cx + ox + (ox < 0 ? 0.3 : -0.3), ty + 3.28, z - 0.04]}>
          <coneGeometry args={[0.16, 0.38, 4]} rotation={[0, 0, ox < 0 ? Math.PI / 2 : -Math.PI / 2]} />
          <meshStandardMaterial color={col} roughness={0.7} />
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
    <group position={[px, py, pz]} rotation={[0, rotation, 0]}>
      {/* Log body */}
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.32, 1.6, 9]} />
        <meshStandardMaterial color="#6b3e0e" roughness={0.96} />
      </mesh>
      {/* Bark ring at each end */}
      {[-0.80, 0.80].map((ox, i) => (
        <mesh key={i} position={[ox, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.285, 0.325, 0.06, 9]} />
          <meshStandardMaterial color="#4a2b06" roughness={0.98} />
        </mesh>
      ))}
      {/* Tree-ring face (top end disc) */}
      <mesh position={[0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <circleGeometry args={[0.28, 9]} />
        <meshStandardMaterial color="#8b5e2a" roughness={0.88} />
      </mesh>
      
      {/* Engraved text plane */}
      <mesh position={[0, 0.266, 0.135]} rotation={[-Math.PI / 3, 0, 0]}>
        <planeGeometry args={[1.2, 0.3]} />
        <meshStandardMaterial 
          map={texture} 
          transparent 
          alphaTest={0.01}
          roughness={0.7} 
        />
      </mesh>

      {/* Small plant/moss on log */}
      <mesh position={[0.1, 0.3, 0.2]}>
        <sphereGeometry args={[0.06, 5, 5]} />
        <meshStandardMaterial color="#16a34a" roughness={0.9} />
      </mesh>
    </group>
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
      <Campfire position={[cx+2.5, ty+0.46, z]} isNight={isNight} />
      <WoodenHut position={[cx-5, ty+0.46, z-1]} />
      <Tent position={[cx+4.5, ty+0.5, z+1]} />
      <Tent position={[cx-3.5, ty+0.5, z+2.5]} color="#1e3a5f" rotation={1.2} />
      <LanternPost position={[cx+1.2, ty+0.46, z-1.5]} isNight={isNight} />
      <LanternPost position={[cx-1.2, ty+0.46, z-1.5]} isNight={isNight} />
      {/* Compass rock */}
      <Boulder position={[cx+4,ty+0.7,z+2]} color="#4b5563" scale={0.8} />
      <Cyl pos={[cx+4,ty+1.05,z+2]} args={[0.26,0.26,0.06,12]} color="#b45309" rough={0.4} />
      {/* Backpack */}
      <Box pos={[cx-2,ty+0.7,z+1.5]} size={[0.55,0.7,0.4]} color="#1e3a5f" rough={0.85} />
      {/* Trekking sticks */}
      {[-0.2,0.2].map((ox,i)=>(
        <Box key={i} pos={[cx-4+ox,ty+0.9,z]} size={[0.04,1.6,0.04]} color="#92400e"
          rot={[0.15,0,(i===0?1:-1)*0.2]} />
      ))}
      <WoodenSign position={[cx+6, ty+0.46, z+2]} text="BASE CAMP" rotation={-0.5} />
      <WoodenSign position={[cx-6, ty+0.46, z-1]} text="SUMMIT →" rotation={0.4} />
      {/* Sleeping bag */}
      <Cyl pos={[cx-1.5,ty+0.6,z+2.5]} args={[0.22,0.25,1.4,8]} color="#16a34a" rot={[0,0.5,0]} />
      {/* Crates */}
      {[0,1,2].map(i=>(
        <Box key={i} pos={[cx+3+i*0.65,ty+0.65+(i===1?0.44:0),z+2.5]}
          size={[0.55,0.44,0.44]} color={['#b45309','#92400e','#7c3d11'][i]} />
      ))}
      {/* Direction stones */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <Boulder key={i} position={[cx + i * 1.1, ty + 0.28, z + 4.5]} scale={0.4} color="#6b7280" />
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
      {/* Desk */}
      <Box pos={[cx,ty+1.16,z+1.5]} size={[1.8,0.09,1.1]} color="#7c3d11" rough={0.9} />
      {[[-0.8,-0.55],[-0.8,0.55],[0.8,-0.55],[0.8,0.55]].map(([lx,lz],i)=>(
        <Box key={i} pos={[cx+lx,ty+0.76,z+1.5+lz]} size={[0.1,0.76,0.1]} color="#5c3d1e" />
      ))}
      {/* Laptop */}
      <Box pos={[cx,ty+1.24,z+1.5]} size={[0.9,0.06,0.65]} color="#374151" />
      <Box pos={[cx,ty+1.56,z+1.2]} size={[0.9,0.55,0.05]} color="#1f2937" rot={[-0.42,0,0]} />
      <mesh position={[cx,ty+1.56,z+1.18]} rotation={[-0.42,0,0]}>
        <planeGeometry args={[0.82,0.48]} />
        <meshStandardMaterial color="#0f172a" emissive="#0ea5e9" emissiveIntensity={1.2} transparent opacity={0.95} />
      </mesh>
      <WoodenSign position={[cx-6,ty+0.46,z+1]} text="EDUCATION" />
      {/* Study campfire */}
      <Campfire position={[cx+5.5, ty+0.46, z+2]} isNight={isNight} />
      <LanternPost position={[cx+3, ty+0.46, z-1]} isNight={isNight} />
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
      glowRef.current.intensity = 1 + Math.sin(s.clock.getElapsedTime() * 4) * 0.4;
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

      {/* ── Row 1 logs (closer to player) ── */}
      {row1.map((s, i) => {
        const lx = cx - 5.5 + i * 2.2;
        const lz = z + 1.5;
        const ly = ty + 0.30;
        return <SkillLog key={`r1-${i}`} position={[lx, ly, lz]} skill={s.name} rotation={s.rot} />;
      })}

      {/* ── Row 2 logs (further back) ── */}
      {row2.map((s, i) => {
        const lx = cx - 5.0 + i * 2.1;
        const lz = z - 1.8;
        const ly = ty + 0.30;
        return <SkillLog key={`r2-${i}`} position={[lx, ly, lz]} skill={s.name} rotation={s.rot} />;
      })}

      {/* ── Monitor on the right side ── */}
      <Box pos={[cx+6.5, ty+0.96, z]} size={[0.12,0.65,0.55]} color="#1f2937" />
      <Box pos={[cx+6.5, ty+1.66, z]} size={[1.1,0.65,0.08]} color="#111827" />
      <mesh position={[cx+6.5, ty+1.66, z-0.06]}>
        <planeGeometry args={[0.98,0.55]} />
        <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.7} transparent opacity={0.95} />
      </mesh>
      {!isMobileDevice && <pointLight ref={glowRef} position={[cx+6.5, ty+1.66, z-0.5]} color="#38bdf8" intensity={1.2} distance={4} />}

      {/* ── Server rack left ── */}
      <Box pos={[cx-6.5, ty+1.46, z]} size={[0.6,2.0,0.8]} color="#1f2937" />
      {[0,1,2,3,4].map(i=>(
        <mesh key={i} position={[cx-6.25, ty+0.81+i*0.38, z-0.44]}>
          <sphereGeometry args={[0.035,4,4]} />
          <meshBasicMaterial color={i%3===0?'#22c55e':'#3b82f6'} />
        </mesh>
      ))}

      {/* ── Campfire and lanterns ── */}
      <Campfire position={[cx, ty+0.46, z-4]} isNight={isNight} />
      <LanternPost position={[cx-3, ty+0.46, z-3]} isNight={isNight} />
      <LanternPost position={[cx+3, ty+0.46, z-3]} isNight={isNight} />

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
      const t = s.clock.getElapsedTime();
      screenRefs.current.forEach((m, i) => {
        if (m) m.position.y = ty + 2.06 + Math.sin(t * 0.8 + i) * 0.09;
      });
    }
  });

  const projects=[{title:'Cloud Infra',color:'#38bdf8'},{title:'DevOps Pipeline',color:'#34d399'},{title:'AI Monitor',color:'#a78bfa'}];
  return (
    <group ref={groupRef}>
      <CheckpointArch z={z + 4} label="PROJECTS" isNight={isNight} />
      {projects.map((p,i)=>(
        <group key={i} ref={el=>screenRefs.current[i]=el} position={[cx-3.5+i*3.5,ty+2.06,z-0.5]}>
          <mesh castShadow><boxGeometry args={[1.4,0.95,0.08]} />
            <meshStandardMaterial color="#1f2937" roughness={0.6} /></mesh>
          <mesh position={[0,0,0.05]}><planeGeometry args={[1.24,0.8]} />
            <meshStandardMaterial color="#0f172a" emissive={p.color} emissiveIntensity={0.45} transparent opacity={0.95} /></mesh>
          <mesh position={[0,0.35,0.06]}><planeGeometry args={[1.24,0.1]} />
            <meshBasicMaterial color={p.color} transparent opacity={0.8} /></mesh>
          <mesh position={[0,-0.65,0]}><boxGeometry args={[0.1,0.35,0.1]} />
            <meshStandardMaterial color="#374151" roughness={0.8} /></mesh>
          {!isMobileDevice && <pointLight position={[0,0,-0.5]} color={p.color} intensity={0.8} distance={3} />}
        </group>
      ))}
      {/* Hologram sphere */}
      <mesh position={[cx-5,ty+2.26,z-0.5]}>
        <sphereGeometry args={[0.5,12,12]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.22} emissive="#0ea5e9" emissiveIntensity={0.6} depthWrite={false} wireframe />
      </mesh>
      {!isMobileDevice && <pointLight position={[cx-5,ty+2.26,z-0.5]} color="#38bdf8" intensity={0.9} distance={4} />}
      <WoodenSign position={[cx,ty+0.46,z+3]} text="PROJECTS" />
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
      const t = s.clock.getElapsedTime();
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
      {flags.map((f,i)=>(
        <group key={i} position={[cx-4.5+i*4.5,ty+0.46,z]}>
          <Cyl pos={[0,1.5,0]} args={[0.04,0.04,3.2,5]} color="#9ca3af" />
          <mesh ref={el=>flagRefs.current[i]=el} position={[0.55,2.8,0]}>
            <planeGeometry args={[1.1,0.65]} />
            <meshStandardMaterial color={f.color} side={THREE.DoubleSide} roughness={0.7} />
          </mesh>
        </group>
      ))}
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
      const t = s.clock.getElapsedTime();
      if (beaconRef.current) beaconRef.current.intensity = 2.5 + Math.sin(t * 2.8) * 1.2;
      if (sigRef.current) sigRef.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.12);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Signal tower */}
      <group position={[cx+5,ty+0.46,z-1]}>
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
        {!isMobileDevice && <pointLight ref={beaconRef} position={[0,6.2,0]} color="#ef4444" intensity={3} distance={14} />}
      </group>
      
      {/* Satellite dish */}
      <group position={[cx-5,ty+0.96,z]}>
        <Cyl pos={[0,0.5,0]} args={[0.06,0.06,1.1,5]} color="#6b7280" />
        <mesh position={[0,1.2,0]} rotation={[-0.6,0,0]}>
          <torusGeometry args={[0.65,0.08,8,12,Math.PI]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>
      
      {/* Glowing beacon */}
      <mesh position={[cx,ty+2.66,z-2]}>
        <cylinderGeometry args={[0.18,0.25,1.8,10]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[cx,ty+3.66,z-2]}>
        <sphereGeometry args={[0.38,12,12]} />
        <meshStandardMaterial color="#22d3ee" emissive="#0ea5e9" emissiveIntensity={2.5} transparent opacity={0.85} />
      </mesh>
      {!isMobileDevice && <pointLight position={[cx,ty+3.66,z-2]} color="#22d3ee"
        intensity={isNight?5:2.5} distance={16} />}
      
      {/* Attractive Summit Wooden Sign Board */}
      <group position={[cx, ty + 0.46, z - 3.2]}>
        {/* Left post */}
        <Cyl pos={[-1.8, 0.8, 0]} args={[0.08, 0.08, 1.6, 6]} color="#7c3d11" rough={0.92} />
        {/* Right post */}
        <Cyl pos={[1.8, 0.8, 0]} args={[0.08, 0.08, 1.6, 6]} color="#7c3d11" rough={0.92} />
        {/* Sign board panel */}
        <Box pos={[0, 1.3, -0.05]} size={[4.2, 1.2, 0.1]} color="#92400e" />
        {/* Engraved text plane (positioned in front of signboard panel) */}
        <mesh position={[0, 1.3, 0.002]} rotation={[0, 0, 0]}>
          <planeGeometry args={[4.0, 1.0]} />
          <meshStandardMaterial 
            map={summitTexture} 
            transparent 
            alphaTest={0.01} 
            roughness={0.7} 
          />
        </mesh>
      </group>
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
function Lighting({ isNight }) {
  const ambRef = useRef();
  const dirRef = useRef();
  const hemiRef = useRef();
  const pointRef = useRef();
  const transitionRef = useRef(isNight ? 1 : 0);

  const colors = useMemo(() => {
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
  }, []);

  const positions = useMemo(() => {
    return {
      dirPosDay: new THREE.Vector3(18, 28, 8),
      dirPosDawn: new THREE.Vector3(0, 10, -5),
      dirPosNight: new THREE.Vector3(-20, 30, -10),
    };
  }, []);

  const values = {
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
    let u = 0;

    const currentAmbCol = tempColor1;
    let currentAmbInt = 0;

    const currentDirCol = tempColor2;
    let currentDirInt = 0;
    const currentDirPos = tempVector1;

    const currentHemiSkyCol = tempColor3;
    const currentHemiGndCol = tempColor4;
    let currentHemiInt = 0;

    const currentSkyCol = tempColor5;
    let currentFogNear = 0;
    let currentFogFar = 0;

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
      dirRef.current.position.copy(currentDirPos);
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
        shadow-camera-far={250}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
      />
      <hemisphereLight ref={hemiRef} />
      {!isMobileDevice && (
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


// ── Main Environment ──────────────────────────────────────────────
export default function Environment({ onCheckpointEnter, onCheckpointExit, isNight }) {
  return (
    <group>
      <Lighting isNight={isNight} />

      {/* ── SKY ELEMENTS ── */}
      <NightSky isNight={isNight} />
      <DayClouds isNight={isNight} />
      <AnimatedBirds isNight={isNight} />

      {/* ── TERRAIN (flat segments = no rotation bug) ── */}
      <WalkableTrail isNight={isNight} />

      {/* ── MOUNTAIN VISUALS ── */}
      <group position={[0, 0, -150]}>
        <MountainBody isNight={isNight} />
      </group>
      <SurroundingMountains isNight={isNight} />

      {/* ── NATURE ── */}
      <ForestDecorations />
      <MistBands isNight={isNight} />
      <WindLeaves />
      <SnowParticles />
      <Fireflies isNight={isNight} />
      <Waterfall />

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
