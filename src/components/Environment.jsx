// ===================================================================
// ENVIRONMENT.JSX — Continuous Mountain Trekking Trail
// One unbroken hillside: no islands, no ramps, no jumps
// ===================================================================
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

// ─── Terrain formula ──────────────────────────────────────────────
// Trail rises from y=0 at z=0 → y=15 at z=-160
const SLOPE = -Math.atan2(15, 160); // ≈ -5.35° — same for every slab

export function getTerrainY(z) {
  if (z > 0) return 0;
  if (z < -160) return 15;
  return (-z / 160) * 15;
}

// ─── Pine Tree ─────────────────────────────────────────────────────
function PineTree({ position, scale = 1, snowy = false }) {
  const leaf = snowy ? '#2d5040' : '#166534';
  const leafDark = snowy ? '#3a5c4a' : '#15803d';
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.9, 5]} />
        <meshStandardMaterial color="#3d2008" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.22, 0]}>
        <coneGeometry args={[0.62, 1.05, 5]} />
        <meshStandardMaterial color={leaf} roughness={0.85} flatShading />
      </mesh>
      {snowy && <mesh position={[0, 1.25, 0]} scale={[1.02, 0.24, 1.02]}>
        <coneGeometry args={[0.62, 1.05, 5]} /><meshStandardMaterial color="#eef2f7" roughness={0.4} flatShading />
      </mesh>}
      <mesh castShadow position={[0, 1.88, 0]}>
        <coneGeometry args={[0.44, 0.82, 5]} />
        <meshStandardMaterial color={leaf} roughness={0.85} flatShading />
      </mesh>
      {snowy && <mesh position={[0, 1.91, 0]} scale={[1.02, 0.24, 1.02]}>
        <coneGeometry args={[0.44, 0.82, 5]} /><meshStandardMaterial color="#eef2f7" roughness={0.4} flatShading />
      </mesh>}
      <mesh castShadow position={[0, 2.4, 0]}>
        <coneGeometry args={[0.28, 0.62, 5]} />
        <meshStandardMaterial color={leafDark} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

// ─── Rock ──────────────────────────────────────────────────────────
function Rock({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5]} />
      <meshStandardMaterial color="#6b7280" roughness={0.88} flatShading />
    </mesh>
  );
}

// ─── Campfire ──────────────────────────────────────────────────────
function Campfire({ position, isNight }) {
  const lightRef = useRef();
  const f1 = useRef(), f2 = useRef(), f3 = useRef();
  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    if (lightRef.current)
      lightRef.current.intensity = (isNight ? 5.5 : 2.5) + Math.sin(t * 16) * 0.4 + Math.random() * 0.15;
    if (f1.current) f1.current.scale.y = 1 + Math.sin(t * 13) * 0.15;
    if (f2.current) f2.current.scale.y = 0.85 + Math.sin(t * 11 + 1.2) * 0.12;
    if (f3.current) f3.current.scale.y = 0.75 + Math.sin(t * 15 + 2.4) * 0.18;
  });
  return (
    <group position={position}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.4, 0.05, Math.cos(a) * 0.4]} castShadow>
            <dodecahedronGeometry args={[0.09]} />
            <meshStandardMaterial color="#6b7280" roughness={0.8} flatShading />
          </mesh>
        );
      })}
      <mesh rotation={[0.2, 0.5, 1.2]} position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 5]} />
        <meshStandardMaterial color="#3a1e05" roughness={0.9} />
      </mesh>
      <mesh rotation={[0.2, -0.8, -1.1]} position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 5]} />
        <meshStandardMaterial color="#3a1e05" roughness={0.9} />
      </mesh>
      <mesh ref={f1} position={[0, 0.2, 0]}>
        <coneGeometry args={[0.17, 0.52, 5]} /><meshBasicMaterial color="#ff4d00" transparent opacity={0.82} />
      </mesh>
      <mesh ref={f2} position={[0.06, 0.16, 0.04]} scale={[0.7, 0.8, 0.7]}>
        <coneGeometry args={[0.17, 0.52, 5]} /><meshBasicMaterial color="#ffa200" transparent opacity={0.86} />
      </mesh>
      <mesh ref={f3} position={[-0.06, 0.22, -0.04]} scale={[0.55, 0.9, 0.55]}>
        <coneGeometry args={[0.17, 0.52, 5]} /><meshBasicMaterial color="#ffeb3b" transparent opacity={0.9} />
      </mesh>
      <pointLight ref={lightRef} color="#ff6b00" intensity={2.5} distance={10} position={[0, 0.5, 0]} />
    </group>
  );
}

// ─── Chimney Smoke ─────────────────────────────────────────────────
function ChimneySmoke({ position }) {
  const groupRef = useRef();
  const puffs = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
    speedY: 0.3 + Math.random() * 0.2, speedX: -0.05 + Math.random() * 0.1,
    delay: i * 0.9, scaleMax: 0.1 + Math.random() * 0.1,
  })), []);
  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.getElapsedTime();
    groupRef.current.children.forEach((p, i) => {
      const c = puffs[i]; if (!c) return;
      const life = (t + c.delay) % 4.0;
      p.position.y = life * c.speedY;
      p.position.x = Math.sin(life * 2) * 0.08 + life * c.speedX;
      p.scale.setScalar(c.scaleMax * Math.sin((life / 4.0) * Math.PI));
      if (p.material) p.material.opacity = (1 - life / 4.0) * 0.5;
    });
  });
  return (
    <group ref={groupRef} position={position}>
      {puffs.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 5, 5]} />
          <meshBasicMaterial color="#d1d5db" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Waving Flag ───────────────────────────────────────────────────
function WavingFlag({ position }) {
  const flagRef = useRef();
  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 3.5) * 0.22;
      flagRef.current.rotation.z = Math.cos(t * 4.2) * 0.07;
    }
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.05, 0.065, 5.0, 6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh ref={flagRef} position={[0.65, 4.5, 0]} castShadow>
        <boxGeometry args={[1.3, 0.65, 0.035]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

// ─── Trail Lantern ─────────────────────────────────────────────────
function TrailLantern({ position, isNight }) {
  const lRef = useRef();
  useFrame((s) => {
    if (lRef.current)
      lRef.current.intensity = (isNight ? 2.0 : 0.45) + Math.sin(s.clock.getElapsedTime() * 3) * 0.1;
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.8, 5]} />
        <meshStandardMaterial color="#5c3818" roughness={0.9} />
      </mesh>
      <group position={[0, 1.95, 0]}>
        <mesh><boxGeometry args={[0.13, 0.2, 0.13]} /><meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} transparent opacity={0.8} /></mesh>
        <mesh><boxGeometry args={[0.1, 0.15, 0.1]} /><meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={2.2} transparent opacity={0.9} /></mesh>
        <mesh position={[0, 0.13, 0]}>
          <coneGeometry args={[0.09, 0.09, 4]} />
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
        </mesh>
        <pointLight ref={lRef} color="#ff9f00" intensity={0.8} distance={5} />
      </group>
    </group>
  );
}

// ─── Fence Post Pair ───────────────────────────────────────────────
function FencePair({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[-0.85, 0.4, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.8, 5]} />
        <meshStandardMaterial color="#5c3818" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.85, 0.4, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.8, 5]} />
        <meshStandardMaterial color="#5c3818" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.76, 5]} />
        <meshStandardMaterial color="#7c4f20" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.36, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 1.76, 5]} />
        <meshStandardMaterial color="#7c4f20" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── Checkpoint Board ──────────────────────────────────────────────
function CheckpointBoard({ position, num, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 1.3, 6]} />
        <meshStandardMaterial color="#5c3818" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[1.5, 0.62, 0.1]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.85} />
      </mesh>
      <mesh position={[-0.55, 1.55, 0.06]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 8]} />
        <meshStandardMaterial color="#ffb703" roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 1.55, 0.06]}>
        <boxGeometry args={[0.5, 0.07, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} transparent opacity={0.6} />
      </mesh>
      <group position={[0.65, 2.2, 0]}>
        <mesh><boxGeometry args={[0.13, 0.18, 0.13]} /><meshStandardMaterial color="#374151" roughness={0.4} metalness={0.5} transparent opacity={0.8} /></mesh>
        <mesh><boxGeometry args={[0.1, 0.14, 0.1]} /><meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={2.5} /></mesh>
        <pointLight color="#ff9f00" intensity={0.5} distance={3} />
      </group>
    </group>
  );
}

// ─── Sky System ────────────────────────────────────────────────────
function SkySystem({ isNight }) {
  const cloudsRef = useRef();
  const birdsRef  = useRef();
  const cloudData = useMemo(() => Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    pos: [-50 + Math.random() * 100, 14 + Math.random() * 14, -10 - Math.random() * 170],
    speed: 0.22 + Math.random() * 0.55,
    scale: 1.5 + Math.random() * 2.8,
  })), []);
  const starData = useMemo(() => Array.from({ length: 300 }).map((_, i) => ({
    pos: [-110 + Math.random() * 220, 18 + Math.random() * 80, -5 - Math.random() * 210],
    size: 0.04 + Math.random() * 0.11, bright: i % 6 === 0,
  })), []);
  const milkyData = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    pos: [-38 + i * 1.6, 32 + Math.sin(i * 0.32) * 6, -70 - i * 2],
    size: 0.055 + Math.random() * 0.09,
  })), []);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((g, i) => {
        const d = cloudData[i]; if (!d) return;
        g.position.x += delta * d.speed;
        if (g.position.x > 60) g.position.x = -60;
      });
    }
    if (birdsRef.current && !isNight) {
      const t = Date.now() * 0.001;
      birdsRef.current.children.forEach((b, i) => {
        b.position.y = 22 + Math.sin(t * 0.9 + i * 1.4) * 1.5;
        b.position.x += delta * (0.9 + i * 0.25);
        if (b.position.x > 65) b.position.x = -65;
      });
    }
  });

  const cc  = isNight ? '#111828' : '#ffffff';
  const cc2 = isNight ? '#0c1020' : '#eef3f8';

  return (
    <>
      <group ref={cloudsRef}>
        {cloudData.map((c) => (
          <group key={c.id} position={c.pos} scale={c.scale}>
            <mesh><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc} roughness={0.9} flatShading /></mesh>
            <mesh position={[0.9, 0, 0]} scale={0.8}><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc} roughness={0.9} flatShading /></mesh>
            <mesh position={[-0.9, 0, 0]} scale={0.8}><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc} roughness={0.9} flatShading /></mesh>
            <mesh position={[0, 0.58, 0]} scale={0.88}><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc2} roughness={0.9} flatShading /></mesh>
          </group>
        ))}
      </group>

      {/* Sun */}
      {!isNight && (
        <group position={[35, 28, -110]}>
          <mesh><sphereGeometry args={[4.5, 14, 14]} /><meshBasicMaterial color="#fff5a0" /></mesh>
          <mesh scale={1.3}><sphereGeometry args={[4.5, 14, 14]} /><meshBasicMaterial color="#fffde0" transparent opacity={0.12} /></mesh>
          <pointLight color="#fff8c0" intensity={1.2} distance={500} />
        </group>
      )}

      {/* Moon */}
      {isNight && (
        <group position={[-32, 32, -100]}>
          <mesh><sphereGeometry args={[3.8, 14, 14]} /><meshBasicMaterial color="#dce8f4" /></mesh>
          <mesh scale={1.28}><sphereGeometry args={[3.8, 14, 14]} /><meshBasicMaterial color="#c8daea" transparent opacity={0.1} /></mesh>
          <pointLight color="#6a9cbd" intensity={2.5} distance={400} />
        </group>
      )}

      {/* Stars */}
      {isNight && starData.map((s, i) => (
        <mesh key={`st-${i}`} position={s.pos}>
          <sphereGeometry args={[s.size, 4, 4]} />
          <meshBasicMaterial color={s.bright ? '#fffde0' : '#ffffff'} />
        </mesh>
      ))}

      {/* Milky Way */}
      {isNight && milkyData.map((m, i) => (
        <mesh key={`mw-${i}`} position={m.pos}>
          <sphereGeometry args={[m.size, 4, 4]} />
          <meshBasicMaterial color="#c8d0ff" transparent opacity={0.35} />
        </mesh>
      ))}

      {/* Valley mist */}
      {[0, -35, -70, -105, -140, -165].map((z, i) => (
        <group key={`vm-${i}`} position={[22, getTerrainY(z) - 5, z]} scale={[5, 2, 5]}>
          <mesh>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color={isNight ? '#080f1a' : '#94a3b8'} transparent opacity={isNight ? 0.75 : 0.5} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* Birds */}
      {!isNight && (
        <group ref={birdsRef}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[-25 + i * 9, 22 + Math.sin(i) * 2, -55 - i * 12]}>
              <boxGeometry args={[0.95, 0.06, 0.1]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

// ─── PHYSICS: One Continuous Slope ────────────────────────────────
// Five identical-angle slabs, overlapping 20+ units each junction.
// All at SLOPE angle so the surface is perfectly consistent.
function PhysicsTerrain() {
  const slabs = [
    { cz: -22,  w: 34, dzLen: 72 },
    { cz: -64,  w: 34, dzLen: 72 },
    { cz: -106, w: 34, dzLen: 72 },
    { cz: -148, w: 34, dzLen: 72 },
    { cz: -185, w: 36, dzLen: 56 }, // summit extension
  ];
  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1.2} restitution={0}>
      {slabs.map((s, i) => (
        <mesh key={i} position={[0, getTerrainY(s.cz) - 2.5, s.cz]} rotation={[SLOPE, 0, 0]}>
          <boxGeometry args={[s.w, 5, s.dzLen]} />
          <meshStandardMaterial color="#4a7c2e" />
        </mesh>
      ))}

      {/* Invisible walls: left mountain side */}
      <mesh position={[-13.5, 10, -82]} visible={false}>
        <boxGeometry args={[1, 30, 220]} /><meshStandardMaterial />
      </mesh>
      {/* Invisible wall: right valley edge */}
      <mesh position={[13.5, 10, -82]} visible={false}>
        <boxGeometry args={[1, 30, 220]} /><meshStandardMaterial />
      </mesh>
      {/* Start wall */}
      <mesh position={[0, 10, 8]} visible={false}>
        <boxGeometry args={[34, 22, 2]} /><meshStandardMaterial />
      </mesh>
      {/* Summit wall */}
      <mesh position={[0, 24, -212]} visible={false}>
        <boxGeometry args={[34, 30, 2]} /><meshStandardMaterial />
      </mesh>
    </RigidBody>
  );
}

// ─── VISUAL TERRAIN (same slabs, visual only) ─────────────────────
function VisualTerrain() {
  // Color transitions from green → rocky-green → rocky-grey → snowy
  const slabs = [
    { cz: -22,  grassColor: '#3d8b2c', pathColor: '#7c5028', dzLen: 72 },
    { cz: -64,  grassColor: '#3a8028', pathColor: '#7a4e26', dzLen: 72 },
    { cz: -106, grassColor: '#3c7530', pathColor: '#6b4a22', dzLen: 72 },
    { cz: -148, grassColor: '#3e6e34', pathColor: '#5c4420', dzLen: 72 },
    { cz: -185, grassColor: '#b8c8cc', pathColor: '#9aa8ac', dzLen: 56 },
  ];
  return (
    <group>
      {slabs.map((s, i) => {
        const cy    = getTerrainY(s.cz) - 2.5;
        const pathY = getTerrainY(s.cz) + 0.14;
        return (
          <group key={i}>
            {/* Wide hillside */}
            <mesh position={[0, cy, s.cz]} rotation={[SLOPE, 0, 0]} receiveShadow>
              <boxGeometry args={[34, 5, s.dzLen]} />
              <meshStandardMaterial color={s.grassColor} roughness={0.92} flatShading />
            </mesh>
            {/* Dirt trail strip */}
            <mesh position={[1.5, pathY, s.cz]} rotation={[SLOPE, 0, 0]} receiveShadow>
              <boxGeometry args={[6.5, 0.3, s.dzLen]} />
              <meshStandardMaterial color={s.pathColor} roughness={0.96} flatShading />
            </mesh>
            {/* Stone edge strips (left and right of dirt path) */}
            {[-2.8, 5.2].map((ox, j) => (
              <mesh key={j} position={[ox, pathY + 0.06, s.cz]} rotation={[SLOPE, 0, 0]} receiveShadow>
                <boxGeometry args={[0.45, 0.12, s.dzLen * 0.96]} />
                <meshStandardMaterial color="#8d9baa" roughness={0.95} flatShading />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

// ─── LEFT MOUNTAINS ───────────────────────────────────────────────
function LeftMountains() {
  const zList = [-5,-14,-22,-30,-38,-46,-54,-62,-70,-78,-86,-94,-102,-110,-118,-126,-134,-142,-150,-158,-166];
  return (
    <group>
      {/* Cliff walls rising straight from terrain left edge */}
      {[-4,-18,-34,-50,-66,-82,-98,-114,-130,-146,-162].map((z, i) => {
        const wallH = 18 + i * 2;
        const wallY = getTerrainY(z) + wallH / 2 - 3.5;
        return (
          <mesh key={`cw-${i}`} position={[-14, wallY, z]} castShadow receiveShadow>
            <boxGeometry args={[5.5, wallH, 18]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#4b5563' : '#374151'} roughness={0.95} flatShading />
          </mesh>
        );
      })}

      {/* Mid mountain cones */}
      {[
        { cz: -10,  r: 22, h: 46, snow: false },
        { cz: -52,  r: 24, h: 54, snow: false },
        { cz: -94,  r: 22, h: 52, snow: true  },
        { cz: -136, r: 25, h: 62, snow: true  },
        { cz: -172, r: 24, h: 70, snow: true  },
      ].map((m, i) => (
        <group key={`mc-${i}`} position={[-30, -5, m.cz]}>
          <mesh castShadow receiveShadow>
            <coneGeometry args={[m.r, m.h, 4]} />
            <meshStandardMaterial color="#2d3748" roughness={0.9} flatShading />
          </mesh>
          {m.snow && (
            <mesh position={[0, m.h * 0.34, 0]} scale={[0.34, 0.34, 0.34]}>
              <coneGeometry args={[m.r, m.h, 4]} />
              <meshStandardMaterial color="#eef2f7" roughness={0.4} flatShading />
            </mesh>
          )}
        </group>
      ))}

      {/* Far background snow peaks */}
      {[-25, -85, -145].map((z, i) => (
        <group key={`fp-${i}`} position={[-58, -8, z]}>
          <mesh castShadow>
            <coneGeometry args={[36, 90, 4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, 90 * 0.34, 0]} scale={[0.34, 0.34, 0.34]}>
            <coneGeometry args={[36, 90, 4]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} flatShading />
          </mesh>
        </group>
      ))}

      {/* Pine trees on mountain slope */}
      {zList.map((z, i) => {
        const ty = getTerrainY(z) + 0.08;
        return (
          <group key={`pt-${i}`}>
            <PineTree position={[-10.5 + (i % 2 ? 0.4 : -0.3), ty, z + (i % 3) * 0.8]}
              scale={0.9 + (i % 3) * 0.12} snowy={z < -105} />
            <PineTree position={[-12 + (i % 2 ? -0.3 : 0.5), ty, z - (i % 2) * 1.2]}
              scale={1.0 + (i % 2) * 0.1} snowy={z < -105} />
          </group>
        );
      })}

      {/* Rocks at cliff base */}
      {[-12,-30,-50,-72,-94,-116,-138,-160].map((z, i) => (
        <Rock key={`lr-${i}`} position={[-10.8, getTerrainY(z) + 0.28, z]}
          scale={[1.2 + i * 0.04, 0.9 + i * 0.03, 1.0 + i * 0.03]}
          rotation={[0.1, i * 0.8, 0.15]} />
      ))}
    </group>
  );
}

// ─── RIGHT SIDE: grass ledge + valley (KHAYI) ─────────────────────
function RightSide({ isNight }) {
  const flowerColors = ['#ef4444', '#f97316', '#eab308', '#ec4899'];
  return (
    <group>
      {/* Small flowers and bushes along right edge */}
      {[-8,-35,-67,-99,-131,-162].map((z, i) => {
        const ty = getTerrainY(z);
        return (
          <group key={`rs-${i}`}>
            {Array.from({ length: 4 }).map((_, j) => (
              <mesh key={j} position={[8.5 + j * 0.55, ty + 0.26, z + (j - 1.5) * 0.9]}>
                <sphereGeometry args={[0.08, 5, 5]} />
                <meshBasicMaterial color={flowerColors[j % 4]} />
              </mesh>
            ))}
            <mesh position={[10, ty + 0.24, z + 1]} castShadow>
              <sphereGeometry args={[0.42 + i * 0.04, 6, 6]} />
              <meshStandardMaterial color="#15803d" roughness={0.8} flatShading />
            </mesh>
          </group>
        );
      })}

      {/* Cliff edge columns */}
      {[0,-30,-62,-94,-126,-158].map((z, i) => {
        const ty = getTerrainY(z);
        return (
          <group key={`ce-${i}`}>
            <mesh position={[15, ty - 5, z]} castShadow>
              <boxGeometry args={[2.5, ty + 14, 16]} />
              <meshStandardMaterial color="#374151" roughness={0.95} flatShading />
            </mesh>
            <Rock position={[14.2, ty + 0.3, z + 2.5]} scale={[1.6, 1.3, 1.4]} rotation={[0.2, i * 0.55, 0.12]} />
            <Rock position={[14.8, ty + 0.1, z - 2.2]} scale={[1.3, 1.0, 1.2]} rotation={[0.1, i * 0.9, 0.22]} />
          </group>
        );
      })}

      {/* Valley floor */}
      <mesh position={[24, -28, -85]}>
        <boxGeometry args={[26, 2, 205]} />
        <meshStandardMaterial color={isNight ? '#030508' : '#0f172a'} roughness={1} flatShading />
      </mesh>
      <mesh position={[35, -10, -85]}>
        <boxGeometry args={[8, 55, 205]} />
        <meshStandardMaterial color={isNight ? '#020406' : '#080f18'} roughness={1} flatShading />
      </mesh>

      {/* Valley mist */}
      {[0,-42,-85,-128,-165].map((z, i) => (
        <group key={`mist-${i}`} position={[22, getTerrainY(z) - 7, z]} scale={[5, 2.2, 6]}>
          <mesh>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color={isNight ? '#060c16' : '#94a3b8'} transparent opacity={isNight ? 0.72 : 0.52} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── TRAIL DECORATIONS ─────────────────────────────────────────────
function TrailDecorations({ isNight }) {
  // Fences along the RIGHT edge of the path (valley side)
  const fenceZs = [-10,-18,-26,-38,-46,-54,-66,-74,-82,-94,-102,-110,-122,-130,-138,-150,-158];
  // Lanterns along trail
  const lanternData = [
    [2, -12],[2, -25],[2, -40],[2, -55],[2, -72],[2, -88],
    [2, -104],[2, -120],[2, -136],[2, -152],
  ];
  // Flat stone steps on path (visual decoration)
  const stepZs = [-8,-16,-24,-32,-40,-48,-56,-64,-72,-80,-88,-96,-104,-112,-120,-128,-136,-144,-152,-160];
  // Rocks beside trail
  const sideRockZs = [-9,-22,-38,-55,-72,-90,-108,-125,-142,-158];

  return (
    <group>
      {fenceZs.map((z, i) => (
        <FencePair key={`fn-${i}`} position={[5, getTerrainY(z) + 0.45, z]} />
      ))}
      {lanternData.map(([x, z], i) => (
        <TrailLantern key={`ln-${i}`} position={[x, getTerrainY(z) + 0.12, z]} isNight={isNight} />
      ))}
      {stepZs.map((z, i) => (
        <mesh key={`st-${i}`} position={[-1, getTerrainY(z) + 0.18, z]} castShadow>
          <boxGeometry args={[3.8, 0.14, 0.82]} />
          <meshStandardMaterial color="#4b5563" roughness={0.94} flatShading />
        </mesh>
      ))}
      {sideRockZs.map((z, i) => (
        <Rock key={`sr-${i}`}
          position={[2.5 + (i % 3) * 0.4, getTerrainY(z) + 0.14, z + (i % 2)]}
          scale={[0.36 + i * 0.012, 0.28 + i * 0.01, 0.32 + i * 0.011]}
          rotation={[0, i * 0.75, 0]} />
      ))}
    </group>
  );
}

// ─── START CAMP ────────────────────────────────────────────────────
function StartCamp({ isNight }) {
  return (
    <group>
      {/* Log cabin */}
      <group position={[-5, 0.1, -4.5]} rotation={[0, 0.38, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.72, 0]}>
          <boxGeometry args={[2.6, 1.44, 1.9]} /><meshStandardMaterial color="#6e3e15" roughness={0.9} flatShading />
        </mesh>
        <mesh castShadow position={[-0.76, 1.58, 0]} rotation={[0, 0, -Math.PI / 5]}>
          <boxGeometry args={[0.06, 1.58, 2.05]} /><meshStandardMaterial color="#991b1b" roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[0.76, 1.58, 0]} rotation={[0, 0, Math.PI / 5]}>
          <boxGeometry args={[0.06, 1.58, 2.05]} /><meshStandardMaterial color="#991b1b" roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[-0.82, 1.35, -0.52]}>
          <boxGeometry args={[0.36, 1.35, 0.36]} /><meshStandardMaterial color="#4b5563" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.62, 0.56, 0.93]}>
          <boxGeometry args={[0.54, 1.12, 0.06]} /><meshStandardMaterial color="#3a1e05" roughness={0.9} />
        </mesh>
        <mesh position={[-0.52, 0.72, 0.93]}>
          <boxGeometry args={[0.56, 0.56, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={isNight ? 3.0 : 0.9} />
        </mesh>
        <pointLight color="#fbbf24" intensity={isNight ? 2.8 : 1.0} distance={7} position={[0, 0.8, 1.1]} />
        <ChimneySmoke position={[-0.82, 2.1, -0.52]} />
      </group>

      {/* Tent */}
      <group position={[3.6, 0.1, -3.2]} rotation={[0, -0.4, 0]}>
        <mesh castShadow position={[-0.52, 0.56, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.055, 1.22, 1.55]} /><meshStandardMaterial color="#f97316" roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[0.52, 0.56, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.055, 1.22, 1.55]} /><meshStandardMaterial color="#f97316" roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.52, -0.74]}>
          <coneGeometry args={[0.66, 1.1, 3]} /><meshStandardMaterial color="#ea580c" roughness={0.8} flatShading />
        </mesh>
      </group>

      {/* Campfire */}
      <Campfire position={[0, 0.1, -2.8]} isNight={isNight} />

      {/* Log stumps */}
      <mesh castShadow position={[-1.05, 0.22, -2.45]}>
        <cylinderGeometry args={[0.19, 0.19, 0.36, 6]} /><meshStandardMaterial color="#451a03" roughness={0.95} flatShading />
      </mesh>
      <mesh castShadow position={[1.05, 0.22, -2.55]}>
        <cylinderGeometry args={[0.19, 0.19, 0.36, 6]} /><meshStandardMaterial color="#451a03" roughness={0.95} flatShading />
      </mesh>

      {/* Start gate */}
      <group position={[0, 0.1, -7]}>
        <mesh castShadow position={[-2.6, 1.55, 0]}><cylinderGeometry args={[0.12, 0.15, 3.1, 6]} /><meshStandardMaterial color="#5c3818" roughness={0.9} /></mesh>
        <mesh castShadow position={[2.6, 1.55, 0]}><cylinderGeometry args={[0.12, 0.15, 3.1, 6]} /><meshStandardMaterial color="#5c3818" roughness={0.9} /></mesh>
        <mesh castShadow position={[0, 3.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 5.35, 5]} /><meshStandardMaterial color="#5c3818" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 2.68, 0]}>
          <boxGeometry args={[3.0, 0.55, 0.12]} /><meshStandardMaterial color="#8B5E3C" roughness={0.85} />
        </mesh>
        <pointLight color="#ffaa00" intensity={1.2} distance={6} position={[-2.6, 2.9, 0]} />
        <pointLight color="#ffaa00" intensity={1.2} distance={6} position={[2.6, 2.9, 0]} />
      </group>

      {/* Backpack */}
      <group position={[2.2, 0.12, -2.6]} rotation={[0.18, 0.12, -0.14]} scale={0.78}>
        <mesh castShadow position={[0, 0.26, 0]}><boxGeometry args={[0.32, 0.44, 0.18]} /><meshStandardMaterial color="#b45309" roughness={0.8} /></mesh>
        <mesh castShadow position={[0, 0.27, 0.12]}><boxGeometry args={[0.24, 0.3, 0.09]} /><meshStandardMaterial color="#451a03" roughness={0.9} /></mesh>
      </group>

      {/* Trekking sticks */}
      <mesh castShadow position={[2.85, 0.62, -2.85]} rotation={[0.28, 0.2, 0.22]}>
        <cylinderGeometry args={[0.024, 0.024, 1.22, 5]} /><meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[3.05, 0.62, -2.65]} rotation={[0.28, -0.2, 0.26]}>
        <cylinderGeometry args={[0.024, 0.024, 1.22, 5]} /><meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  );
}

// ─── SUMMIT PEAK ───────────────────────────────────────────────────
function Summit() {
  const ty = getTerrainY(-165);
  return (
    <group position={[0, ty, -170]}>
      <mesh castShadow receiveShadow position={[0, 4, 0]}>
        <coneGeometry args={[7, 12, 4]} />
        <meshStandardMaterial color="#334155" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 9.5, 0]} scale={[0.36, 0.36, 0.36]}>
        <coneGeometry args={[7, 12, 4]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} flatShading />
      </mesh>
      <WavingFlag position={[0.5, 0.2, 0]} />
      <pointLight color="#fffde0" intensity={2.5} distance={22} position={[0, 12, 0]} />
    </group>
  );
}

// ─── MAIN EXPORT ───────────────────────────────────────────────────
export default function Environment({ onCheckpointEnter, onCheckpointExit, isNight = false }) {

  // Checkpoint sensor positions — centered on trail at each zone
  const checkpoints = useMemo(() => [
    { id: 1, pos: [2, getTerrainY(-8)  + 2.5, -8],   sz: [10, 6, 10] },
    { id: 2, pos: [2, getTerrainY(-35) + 2.5, -35],  sz: [10, 6, 10] },
    { id: 3, pos: [2, getTerrainY(-67) + 2.5, -67],  sz: [10, 6, 10] },
    { id: 4, pos: [2, getTerrainY(-99) + 2.5, -99],  sz: [10, 6, 10] },
    { id: 5, pos: [2, getTerrainY(-131)+ 2.5, -131], sz: [10, 6, 10] },
    { id: 6, pos: [2, getTerrainY(-163)+ 2.5, -163], sz: [12, 7, 12] },
  ], []);

  // Wooden boards right of trail
  const boards = [
    { pos: [7.5, getTerrainY(-10)  + 0.15, -10],  rot: [0, -0.5, 0] },
    { pos: [7.5, getTerrainY(-38)  + 0.15, -38],  rot: [0, -0.4, 0] },
    { pos: [7.5, getTerrainY(-70)  + 0.15, -70],  rot: [0, -0.4, 0] },
    { pos: [7.5, getTerrainY(-102) + 0.15, -102], rot: [0, -0.4, 0] },
    { pos: [7.5, getTerrainY(-134) + 0.15, -134], rot: [0, -0.4, 0] },
    { pos: [5.5, getTerrainY(-165) + 0.15, -165], rot: [0, -0.5, 0] },
  ];

  const ambCol = isNight ? '#1a2540' : '#f0f9ff';
  const ambInt = isNight ? 0.22 : 1.05;
  const sunCol = isNight ? '#4a6fa0' : '#fffcf5';
  const sunInt = isNight ? 0.45 : 1.65;
  const sunPos = isNight ? [-20, 30, 12] : [20, 34, 14];

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={ambInt} color={ambCol} />
      <hemisphereLight
        skyColor={isNight ? '#0d1830' : '#bae6fd'}
        groundColor={isNight ? '#080e18' : '#bbf7d0'}
        intensity={isNight ? 0.28 : 0.48}
      />
      <directionalLight
        castShadow position={sunPos} intensity={sunInt} color={sunCol}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40} shadow-camera-right={40}
        shadow-camera-top={40}  shadow-camera-bottom={-40}
        shadow-camera-near={0.5} shadow-camera-far={250}
        shadow-bias={-0.0003}
      />

      {/* World */}
      <SkySystem isNight={isNight} />
      <PhysicsTerrain />
      <VisualTerrain />
      <LeftMountains />
      <RightSide isNight={isNight} />
      <TrailDecorations isNight={isNight} />
      <StartCamp isNight={isNight} />
      <Summit />

      {/* Checkpoint boards */}
      {boards.map((b, i) => (
        <CheckpointBoard key={i} position={b.pos} num={`0${i + 1}`} rotation={b.rot} />
      ))}

      {/* Checkpoint sensor triggers */}
      {checkpoints.map((cp) => (
        <RigidBody key={cp.id} type="fixed" colliders={false} position={cp.pos}>
          <CuboidCollider
            args={cp.sz.map((v) => v / 2)}
            sensor
            onIntersectionEnter={() => onCheckpointEnter(cp.id)}
            onIntersectionExit={() => onCheckpointExit(cp.id)}
          />
        </RigidBody>
      ))}
    </>
  );
}
