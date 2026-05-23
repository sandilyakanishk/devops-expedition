// =============================================================
// ENVIRONMENT.JSX — Complete Mountain Trekking World
// Day / Night support via isNight prop
// =============================================================
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// HELPER: terrain Y at world Z
// Trail rises from y=0 at z=0 → y=15 at z=-160
// ─────────────────────────────────────────────────────────────
function terrainY(z) {
  return Math.max(0, Math.min(1, (-z) / 160)) * 15;
}

// ─────────────────────────────────────────────────────────────
// PINE TREE
// ─────────────────────────────────────────────────────────────
function PineTree({ position, scale = 1, snowy = false }) {
  const leaf = snowy ? '#2d5040' : '#166534';
  const leafDark = snowy ? '#3a5c4a' : '#15803d';
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.9, 5]} />
        <meshStandardMaterial color="#3d2008" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0]}>
        <coneGeometry args={[0.6, 1.0, 5]} />
        <meshStandardMaterial color={leaf} roughness={0.85} flatShading />
      </mesh>
      {snowy && (
        <mesh position={[0, 1.24, 0]} scale={[1.02, 0.25, 1.02]}>
          <coneGeometry args={[0.6, 1.0, 5]} />
          <meshStandardMaterial color="#eef2f7" roughness={0.4} flatShading />
        </mesh>
      )}
      <mesh castShadow position={[0, 1.85, 0]}>
        <coneGeometry args={[0.42, 0.8, 5]} />
        <meshStandardMaterial color={leaf} roughness={0.85} flatShading />
      </mesh>
      {snowy && (
        <mesh position={[0, 1.88, 0]} scale={[1.02, 0.25, 1.02]}>
          <coneGeometry args={[0.42, 0.8, 5]} />
          <meshStandardMaterial color="#eef2f7" roughness={0.4} flatShading />
        </mesh>
      )}
      <mesh castShadow position={[0, 2.38, 0]}>
        <coneGeometry args={[0.26, 0.6, 5]} />
        <meshStandardMaterial color={leafDark} roughness={0.85} flatShading />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// ROCK
// ─────────────────────────────────────────────────────────────
function Rock({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5]} />
      <meshStandardMaterial color="#6b7280" roughness={0.88} flatShading />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// CAMPFIRE
// ─────────────────────────────────────────────────────────────
function Campfire({ position, isNight }) {
  const lightRef = useRef();
  const f1 = useRef(), f2 = useRef(), f3 = useRef();
  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    if (lightRef.current)
      lightRef.current.intensity = (isNight ? 5.0 : 2.5) + Math.sin(t * 16) * 0.4 + Math.random() * 0.15;
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
        <coneGeometry args={[0.17, 0.52, 5]} />
        <meshBasicMaterial color="#ff4d00" transparent opacity={0.82} />
      </mesh>
      <mesh ref={f2} position={[0.06, 0.16, 0.04]} scale={[0.7, 0.8, 0.7]}>
        <coneGeometry args={[0.17, 0.52, 5]} />
        <meshBasicMaterial color="#ffa200" transparent opacity={0.86} />
      </mesh>
      <mesh ref={f3} position={[-0.06, 0.22, -0.04]} scale={[0.55, 0.9, 0.55]}>
        <coneGeometry args={[0.17, 0.52, 5]} />
        <meshBasicMaterial color="#ffeb3b" transparent opacity={0.9} />
      </mesh>
      <pointLight ref={lightRef} color="#ff6b00" intensity={2.5} distance={10} position={[0, 0.5, 0]} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// CHIMNEY SMOKE
// ─────────────────────────────────────────────────────────────
function ChimneySmoke({ position }) {
  const groupRef = useRef();
  const puffs = useMemo(() =>
    Array.from({ length: 5 }).map((_, i) => ({
      speedY: 0.3 + Math.random() * 0.2,
      speedX: -0.05 + Math.random() * 0.1,
      delay: i * 0.9,
      scaleMax: 0.1 + Math.random() * 0.1,
    })), []);
  useFrame((s) => {
    if (!groupRef.current) return;
    const t = s.clock.getElapsedTime();
    groupRef.current.children.forEach((p, i) => {
      const c = puffs[i];
      if (!c) return;
      const life = (t + c.delay) % 4.0;
      p.position.y = life * c.speedY;
      p.position.x = Math.sin(life * 2) * 0.08 + life * c.speedX;
      const prog = life / 4.0;
      p.scale.setScalar(c.scaleMax * Math.sin(prog * Math.PI));
      if (p.material) p.material.opacity = (1 - prog) * 0.5;
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

// ─────────────────────────────────────────────────────────────
// WAVING FLAG
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// TRAIL LANTERN
// ─────────────────────────────────────────────────────────────
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
        <mesh>
          <boxGeometry args={[0.13, 0.2, 0.13]} />
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} transparent opacity={0.8} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.1, 0.15, 0.1]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={2.2} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <coneGeometry args={[0.09, 0.09, 4]} />
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.6} />
        </mesh>
        <pointLight ref={lRef} color="#ff9f00" intensity={0.8} distance={5} />
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// FENCE PAIR
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// CHECKPOINT BOARD (Right-side wooden sign)
// ─────────────────────────────────────────────────────────────
function CheckpointBoard({ position, label, num, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Post */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 1.3, 6]} />
        <meshStandardMaterial color="#5c3818" roughness={0.9} />
      </mesh>
      {/* Sign board */}
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[1.5, 0.62, 0.1]} />
        <meshStandardMaterial color="#8B5E3C" roughness={0.85} />
      </mesh>
      {/* Number circle */}
      <mesh position={[-0.55, 1.55, 0.06]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 8]} />
        <meshStandardMaterial color="#ffb703" roughness={0.4} />
      </mesh>
      {/* Diagonal arrow stripe */}
      <mesh position={[0.3, 1.55, 0.06]}>
        <boxGeometry args={[0.55, 0.07, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} transparent opacity={0.6} />
      </mesh>
      {/* Hanging lantern top */}
      <group position={[0.65, 2.2, 0]}>
        <mesh>
          <boxGeometry args={[0.13, 0.18, 0.13]} />
          <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.5} transparent opacity={0.8} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.1, 0.14, 0.1]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={2.5} />
        </mesh>
        <pointLight color="#ff9f00" intensity={0.5} distance={3} />
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// SKY SYSTEM — Day + Night
// ─────────────────────────────────────────────────────────────
function SkySystem({ isNight }) {
  const cloudsRef = useRef();
  const birdsRef  = useRef();

  const cloudData = useMemo(() =>
    Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      pos: [-50 + Math.random() * 100, 14 + Math.random() * 14, -10 - Math.random() * 170],
      speed: 0.22 + Math.random() * 0.55,
      scale: 1.5 + Math.random() * 2.8,
    })), []);

  const starData = useMemo(() =>
    Array.from({ length: 320 }).map((_, i) => ({
      pos: [-110 + Math.random() * 220, 18 + Math.random() * 80, -5 - Math.random() * 220],
      size: 0.04 + Math.random() * 0.11,
      bright: i % 6 === 0,
    })), []);

  const milkyData = useMemo(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      pos: [-38 + i * 1.6, 32 + Math.sin(i * 0.32) * 6, -70 - i * 2],
      size: 0.055 + Math.random() * 0.09,
    })), []);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((g, i) => {
        const d = cloudData[i];
        if (!d) return;
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
      {/* ── Clouds ── */}
      <group ref={cloudsRef}>
        {cloudData.map((c) => (
          <group key={c.id} position={c.pos} scale={c.scale}>
            <mesh><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc} roughness={0.9} flatShading /></mesh>
            <mesh position={[ 0.9, 0, 0]} scale={0.8}><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc} roughness={0.9} flatShading /></mesh>
            <mesh position={[-0.9, 0, 0]} scale={0.8}><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc} roughness={0.9} flatShading /></mesh>
            <mesh position={[0, 0.58, 0]} scale={0.88}><sphereGeometry args={[1, 6, 6]} /><meshStandardMaterial color={cc2} roughness={0.9} flatShading /></mesh>
          </group>
        ))}
      </group>

      {/* ── SUN (day) ── */}
      {!isNight && (
        <group position={[35, 28, -110]}>
          <mesh><sphereGeometry args={[4.5, 14, 14]} /><meshBasicMaterial color="#fff5a0" /></mesh>
          <mesh scale={1.3}><sphereGeometry args={[4.5, 14, 14]} /><meshBasicMaterial color="#fffde0" transparent opacity={0.12} /></mesh>
          <pointLight color="#fff8c0" intensity={1.2} distance={500} />
        </group>
      )}

      {/* ── MOON (night) ── */}
      {isNight && (
        <group position={[-32, 32, -100]}>
          <mesh><sphereGeometry args={[3.8, 14, 14]} /><meshBasicMaterial color="#dce8f4" /></mesh>
          <mesh scale={1.28}><sphereGeometry args={[3.8, 14, 14]} /><meshBasicMaterial color="#c8daea" transparent opacity={0.1} /></mesh>
          <pointLight color="#6a9cbd" intensity={2.5} distance={400} />
        </group>
      )}

      {/* ── STARS (night) ── */}
      {isNight && starData.map((s, i) => (
        <mesh key={`st-${i}`} position={s.pos}>
          <sphereGeometry args={[s.size, 4, 4]} />
          <meshBasicMaterial color={s.bright ? '#fffde0' : '#ffffff'} />
        </mesh>
      ))}

      {/* ── MILKY WAY (night) ── */}
      {isNight && milkyData.map((m, i) => (
        <mesh key={`mw-${i}`} position={m.pos}>
          <sphereGeometry args={[m.size, 4, 4]} />
          <meshBasicMaterial color="#c8d0ff" transparent opacity={0.35} />
        </mesh>
      ))}

      {/* ── VALLEY MIST CLOUDS ── */}
      {[0, -28, -58, -88, -118, -150].map((z, i) => (
        <group key={`vm-${i}`} position={[22, terrainY(z) - 5, z]} scale={[4, 1.8, 4]}>
          <mesh>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color={isNight ? '#080f1a' : '#94a3b8'} roughness={0.9} transparent opacity={isNight ? 0.75 : 0.5} depthWrite={false} />
          </mesh>
          <mesh position={[1, 0, 0.6]} scale={0.85}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color={isNight ? '#06090f' : '#b0bec5'} roughness={0.9} transparent opacity={isNight ? 0.65 : 0.4} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* ── BIRDS (day) ── */}
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

// ─────────────────────────────────────────────────────────────
// LEFT MOUNTAINS — rocky walls + pine forests + snow peaks
// ─────────────────────────────────────────────────────────────
function LeftMountains() {
  const cliffs = [
    { p: [-13.5, 4,   -4], s: [5.5, 16,  9],  c: '#4b5563' },
    { p: [-13.5, 5,  -18], s: [6,   18,  10], c: '#374151' },
    { p: [-13.5, 5.5,-34], s: [5.5, 20,  9],  c: '#4b5563' },
    { p: [-13.5, 6.5,-50], s: [6,   22,  10], c: '#374151' },
    { p: [-13.5, 7.5,-66], s: [5.5, 24,  9],  c: '#4b5563' },
    { p: [-13.5, 8.5,-82], s: [6,   26,  10], c: '#334155' },
    { p: [-13.5,10,  -98], s: [5.5, 28,  9],  c: '#4b5563' },
    { p: [-13.5,11, -114], s: [6,   30,  10], c: '#334155' },
    { p: [-13.5,12, -130], s: [5.5, 32,  9],  c: '#374151' },
    { p: [-13.5,13, -148], s: [6,   34,  10], c: '#334155' },
  ];
  const mids = [
    { p: [-30, -5,  -12], r: 20, h: 44, c: '#334155', snow: false },
    { p: [-32, -5,  -44], r: 22, h: 52, c: '#2d3748', snow: false },
    { p: [-30, -5,  -76], r: 20, h: 50, c: '#334155', snow: true  },
    { p: [-33, -5, -108], r: 23, h: 58, c: '#2d3748', snow: true  },
    { p: [-31, -5, -138], r: 21, h: 62, c: '#1e293b', snow: true  },
    { p: [-32, -5, -165], r: 22, h: 68, c: '#1e293b', snow: true  },
  ];
  const fars = [
    { p: [-58, -8,  -22], r: 32, h: 80 },
    { p: [-62, -8,  -78], r: 36, h: 90 },
    { p: [-58, -8, -136], r: 34, h: 85 },
  ];
  const treeZ1 = [-6,-14,-22,-30,-38,-46,-54,-62,-70,-78,-86,-94,-102,-112,-122,-132,-142,-154,-163];
  const treeZ2 = [-10,-20,-30,-42,-54,-66,-78,-90,-104,-116,-128,-142,-156];

  return (
    <group>
      {/* Closest rocky cliff walls */}
      {cliffs.map((c, i) => (
        <mesh key={`cl-${i}`} position={c.p} castShadow receiveShadow>
          <boxGeometry args={c.s} />
          <meshStandardMaterial color={c.c} roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* Mid-distance mountain cones */}
      {mids.map((m, i) => (
        <group key={`mid-${i}`} position={m.p}>
          <mesh castShadow receiveShadow>
            <coneGeometry args={[m.r, m.h, 4]} />
            <meshStandardMaterial color={m.c} roughness={0.9} flatShading />
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
      {fars.map((m, i) => (
        <group key={`far-${i}`} position={m.p}>
          <mesh castShadow>
            <coneGeometry args={[m.r, m.h, 4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} flatShading />
          </mesh>
          <mesh position={[0, m.h * 0.34, 0]} scale={[0.34, 0.34, 0.34]}>
            <coneGeometry args={[m.r, m.h, 4]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} flatShading />
          </mesh>
        </group>
      ))}
      {/* Mountain-side pine trees — layer 1 */}
      {treeZ1.map((z, i) => (
        <PineTree key={`pt1-${i}`}
          position={[-11 + (i % 2 ? 0.5 : -0.5), terrainY(z) + 0.1, z]}
          scale={0.85 + (i % 3) * 0.15}
          snowy={z < -100} />
      ))}
      {/* Mountain-side pine trees — layer 2 */}
      {treeZ2.map((z, i) => (
        <PineTree key={`pt2-${i}`}
          position={[-12.5 + (i % 2 ? 0 : -1), terrainY(z) + 0.1, z]}
          scale={1.0 + (i % 3) * 0.12}
          snowy={z < -100} />
      ))}
      {/* Rocky outcrops on mountain base */}
      {[-8,-20,-34,-50,-66,-82,-98,-116,-132,-150].map((z, i) => (
        <Rock key={`mr-${i}`}
          position={[-10.8, terrainY(z) + 0.25, z]}
          scale={[1.2 + i * 0.05, 0.9 + i * 0.04, 1.0 + i * 0.04]}
          rotation={[0.1, i * 0.8, 0.15]} />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// RIGHT GRASSLAND — green patches + flowers + small trees
// ─────────────────────────────────────────────────────────────
function RightGrassland() {
  const patches = [
    { z: -2.5,  y: 0.1  },
    { z: -32.0, y: 3.1  },
    { z: -64.0, y: 5.9  },
    { z: -96.0, y: 8.9  },
    { z:-128.0, y: 12.1 },
    { z:-160.0, y: 15.6 },
  ];
  const flowerColors = ['#ef4444','#f97316','#eab308','#ec4899','#8b5cf6','#22d3ee'];
  return (
    <group>
      {patches.map((p, idx) => (
        <group key={idx}>
          {/* Grass disc */}
          <mesh receiveShadow position={[9, p.y - 0.25, p.z]}>
            <cylinderGeometry args={[5.0, 5.5, 0.45, 12]} />
            <meshStandardMaterial color="#22c55e" roughness={0.9} flatShading />
          </mesh>
          {/* Flowers */}
          {Array.from({ length: 6 }).map((_, j) => (
            <mesh key={j} position={[7 + j * 0.65, p.y + 0.22, p.z + (j - 2.5) * 0.8]}>
              <sphereGeometry args={[0.09, 5, 5]} />
              <meshBasicMaterial color={flowerColors[j % flowerColors.length]} />
            </mesh>
          ))}
          {/* Grass tufts */}
          {[-1.2, 0, 1.2].map((ox, j) => (
            <mesh key={`g-${j}`} position={[8.5 + ox, p.y + 0.08, p.z + ox * 0.6]} rotation={[0.12, j * 0.8, 0]}>
              <boxGeometry args={[0.06, 0.35, 0.06]} />
              <meshStandardMaterial color="#16a34a" roughness={0.9} />
            </mesh>
          ))}
          {/* Small pine */}
          <PineTree position={[13, p.y, p.z + 1.5]} scale={0.65} />
          <PineTree position={[13.5, p.y, p.z - 1.2]} scale={0.5} />
        </group>
      ))}
      {/* Bushes along right of trail */}
      {[-10,-26,-42,-58,-74,-90,-106,-122,-138,-155].map((z, i) => (
        <mesh key={`bush-${i}`} position={[7.5, terrainY(z) + 0.22, z]} castShadow>
          <sphereGeometry args={[0.38 + (i % 3) * 0.1, 6, 6]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// VALLEY / KHAYI — deep dangerous cliff on far right
// ─────────────────────────────────────────────────────────────
function ValleyKhayi({ isNight }) {
  const dColor = isNight ? '#030508' : '#0f172a';
  return (
    <group>
      {/* Deep valley floor */}
      <mesh position={[24, -28, -82]}>
        <boxGeometry args={[26, 2, 190]} />
        <meshStandardMaterial color={dColor} roughness={1} flatShading />
      </mesh>
      {/* Valley side walls */}
      <mesh position={[34, -10, -82]}>
        <boxGeometry args={[8, 52, 190]} />
        <meshStandardMaterial color={isNight ? '#020406' : '#0f172a'} roughness={1} flatShading />
      </mesh>
      {/* Cliff edges along trail */}
      {[0, -28, -58, -88, -118, -150].map((z, i) => (
        <group key={`ce-${i}`}>
          <mesh position={[14.5, terrainY(z) - 4, z]} castShadow>
            <boxGeometry args={[2.2, terrainY(z) + 10, 14]} />
            <meshStandardMaterial color="#374151" roughness={0.95} flatShading />
          </mesh>
          {/* Cliff-edge rocks */}
          <Rock position={[13.2, terrainY(z) + 0.3, z + 2.5]}
            scale={[1.6, 1.3, 1.4]} rotation={[0.2, i * 0.55, 0.12]} />
          <Rock position={[13.8, terrainY(z) + 0.12, z - 2]}
            scale={[1.3, 1.0, 1.2]} rotation={[0.1, i * 0.9, 0.22]} />
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// TRAIL DECORATIONS — fences, lanterns, rock stairs
// ─────────────────────────────────────────────────────────────
function TrailDecorations({ isNight }) {
  const fences = [
    [0, 0.6, -9],[2.5, 0.6, -15],[-2, 1.1, -21],[0, 1.5, -27],
    [-5, 3.5, -36],[-2, 4.0, -43],[2, 4.5, -50],[4, 5.1, -58],
    [4, 6.2, -68],[1, 6.9, -76],[-3, 7.5, -82],[-6, 8.2, -90],
    [-7.5, 9.1, -100],[-4, 9.8, -108],[0, 10.4, -114],[4, 11.1, -122],
    [5, 12.3, -132],[2, 12.9, -140],[-1, 13.6, -146],[-1, 14.3, -154],
  ];
  const lanterns = [
    [-1.5, 0.2, -12],[3, 0.2, -23],
    [-4, 3.2, -38],[2, 4.2, -54],
    [6, 5.9, -72],[-5.5, 7.2, -86],
    [-7, 8.9, -102],[2, 10.2, -116],
    [7, 12.1, -134],[-1, 13.2, -150],
  ];
  // Rock stair steps along the path
  const stairs = [
    [-1, 0.55, -8.5],[-2, 1.1, -17],[-3.5, 1.6, -25],[-4.5, 2.1, -31],
    [-5, 3.2, -37],[-3, 3.8, -45],[0, 4.4, -53],[3, 5.0, -61],
    [5, 6.0, -69],[2, 6.7, -77],[-2, 7.3, -85],[-6.5, 7.9, -93],
    [-8, 9.0, -101],[-4.5, 9.6, -109],[0, 10.2, -117],[4, 10.9, -125],
    [5.5, 12.2, -133],[2, 12.8, -141],[-1, 13.4, -149],[-1, 14.0, -157],
  ];
  // Trail-side rocks
  const trailRocks = [-7,-17,-28,-41,-56,-71,-86,-101,-116,-131,-146,-161];

  return (
    <group>
      {fences.map((p, i) => <FencePair key={`fn-${i}`} position={p} />)}
      {lanterns.map((p, i) => <TrailLantern key={`ln-${i}`} position={p} isNight={isNight} />)}
      {stairs.map((p, i) => (
        <mesh key={`st-${i}`} position={p} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.18, 0.85]} />
          <meshStandardMaterial color="#4b5563" roughness={0.92} flatShading />
        </mesh>
      ))}
      {trailRocks.map((z, i) => (
        <Rock key={`tr-${i}`}
          position={[2.0 + (i % 3) * 0.4, terrainY(z) + 0.12, z + (i % 2)]}
          scale={[0.38 + i * 0.015, 0.28 + i * 0.012, 0.32 + i * 0.013]}
          rotation={[0, i * 0.75, 0]} />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// START CAMP — hut, tent, campfire, gate, backpack, sticks
// ─────────────────────────────────────────────────────────────
function StartCamp({ isNight }) {
  return (
    <group>
      {/* ── LOG CABIN (left of start) ── */}
      <group position={[-5, 0.1, -4.5]} rotation={[0, 0.38, 0]}>
        {/* Walls */}
        <mesh castShadow receiveShadow position={[0, 0.72, 0]}>
          <boxGeometry args={[2.6, 1.44, 1.9]} />
          <meshStandardMaterial color="#6e3e15" roughness={0.9} flatShading />
        </mesh>
        {/* Roof left half */}
        <mesh castShadow position={[-0.76, 1.58, 0]} rotation={[0, 0, -Math.PI / 5]}>
          <boxGeometry args={[0.06, 1.58, 2.05]} />
          <meshStandardMaterial color="#991b1b" roughness={0.7} flatShading />
        </mesh>
        {/* Roof right half */}
        <mesh castShadow position={[0.76, 1.58, 0]} rotation={[0, 0, Math.PI / 5]}>
          <boxGeometry args={[0.06, 1.58, 2.05]} />
          <meshStandardMaterial color="#991b1b" roughness={0.7} flatShading />
        </mesh>
        {/* Chimney */}
        <mesh castShadow position={[-0.82, 1.35, -0.52]}>
          <boxGeometry args={[0.36, 1.35, 0.36]} />
          <meshStandardMaterial color="#4b5563" roughness={0.85} flatShading />
        </mesh>
        {/* Door */}
        <mesh position={[0.62, 0.56, 0.93]}>
          <boxGeometry args={[0.54, 1.12, 0.06]} />
          <meshStandardMaterial color="#3a1e05" roughness={0.9} />
        </mesh>
        {/* Window glow */}
        <mesh position={[-0.52, 0.72, 0.93]}>
          <boxGeometry args={[0.56, 0.56, 0.05]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={isNight ? 3.0 : 0.9} />
        </mesh>
        <pointLight color="#fbbf24" intensity={isNight ? 2.8 : 1.0} distance={7} position={[0, 0.8, 1.1]} />
        <ChimneySmoke position={[-0.82, 2.1, -0.52]} />
      </group>

      {/* ── TENT (right of campfire) ── */}
      <group position={[3.6, 0.1, -3.2]} rotation={[0, -0.4, 0]}>
        <mesh castShadow position={[-0.52, 0.56, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.055, 1.22, 1.55]} />
          <meshStandardMaterial color="#f97316" roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[0.52, 0.56, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.055, 1.22, 1.55]} />
          <meshStandardMaterial color="#f97316" roughness={0.7} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.52, -0.74]}>
          <coneGeometry args={[0.66, 1.1, 3]} />
          <meshStandardMaterial color="#ea580c" roughness={0.8} flatShading />
        </mesh>
      </group>

      {/* ── CAMPFIRE ── */}
      <Campfire position={[0, 0.1, -2.8]} isNight={isNight} />

      {/* Log stumps */}
      <mesh castShadow position={[-1.05, 0.22, -2.45]}>
        <cylinderGeometry args={[0.19, 0.19, 0.36, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} flatShading />
      </mesh>
      <mesh castShadow position={[1.05, 0.22, -2.55]}>
        <cylinderGeometry args={[0.19, 0.19, 0.36, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} flatShading />
      </mesh>

      {/* ── START GATE ── */}
      <group position={[0, 0.1, -7]}>
        <mesh castShadow position={[-2.6, 1.55, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 3.1, 6]} />
          <meshStandardMaterial color="#5c3818" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[2.6, 1.55, 0]}>
          <cylinderGeometry args={[0.12, 0.15, 3.1, 6]} />
          <meshStandardMaterial color="#5c3818" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 3.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 5.35, 5]} />
          <meshStandardMaterial color="#5c3818" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0, 2.68, 0]}>
          <boxGeometry args={[3.0, 0.55, 0.12]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.85} />
        </mesh>
        <pointLight color="#ffaa00" intensity={1.2} distance={6} position={[-2.6, 2.9, 0]} />
        <pointLight color="#ffaa00" intensity={1.2} distance={6} position={[2.6, 2.9, 0]} />
      </group>

      {/* ── BACKPACK near fire ── */}
      <group position={[2.2, 0.1, -2.6]} rotation={[0.18, 0.12, -0.14]} scale={0.78}>
        <mesh castShadow position={[0, 0.26, 0]}>
          <boxGeometry args={[0.32, 0.44, 0.18]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.27, 0.12]}>
          <boxGeometry args={[0.24, 0.3, 0.09]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
      </group>

      {/* ── TREKKING STICKS ── */}
      <mesh castShadow position={[2.85, 0.62, -2.85]} rotation={[0.28, 0.2, 0.22]}>
        <cylinderGeometry args={[0.024, 0.024, 1.22, 5]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[3.05, 0.62, -2.65]} rotation={[0.28, -0.2, 0.26]}>
        <cylinderGeometry args={[0.024, 0.024, 1.22, 5]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.7} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// SUMMIT — snowy peak + flags at top
// ─────────────────────────────────────────────────────────────
function Summit() {
  return (
    <group position={[0, 15.6, -164]}>
      <mesh castShadow receiveShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[6, 10, 4]} />
        <meshStandardMaterial color="#334155" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0, 8.5, 0]} scale={[0.38, 0.38, 0.38]}>
        <coneGeometry args={[6, 10, 4]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} flatShading />
      </mesh>
      <WavingFlag position={[0, 0.2, 0]} />
      <pointLight color="#fffde0" intensity={2.5} distance={20} position={[0, 10, 0]} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// PROCEDURAL TERRAIN — physics-ready walkable ground
// ─────────────────────────────────────────────────────────────
function ProceduralTerrain() {
  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1.2} restitution={0}>
      {/* ── CHECKPOINT PLATFORMS ── */}

      {/* CP1 — Basecamp, green grass */}
      <mesh receiveShadow position={[0, -0.32, -3]}>
        <cylinderGeometry args={[7.5, 8.2, 0.8, 20]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} flatShading />
      </mesh>

      {/* CP2 — Education, forest floor */}
      <mesh receiveShadow position={[-5, 2.72, -32]}>
        <cylinderGeometry args={[5.5, 6.2, 0.8, 14]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.9} flatShading />
      </mesh>

      {/* CP3 — Projects, autumn earth */}
      <mesh receiveShadow position={[5, 5.52, -64]}>
        <cylinderGeometry args={[5.5, 6.2, 0.8, 14]} />
        <meshStandardMaterial color="#854d0e" roughness={0.9} flatShading />
      </mesh>

      {/* CP4 — Experience, rocky ground */}
      <mesh receiveShadow position={[-8, 8.52, -96]}>
        <cylinderGeometry args={[5.5, 6.2, 0.8, 14]} />
        <meshStandardMaterial color="#475569" roughness={0.95} flatShading />
      </mesh>

      {/* CP5 — Skills, light snow */}
      <mesh receiveShadow position={[6, 11.72, -128]}>
        <cylinderGeometry args={[5.5, 6.2, 0.8, 14]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} flatShading />
      </mesh>

      {/* CP6 — Contact, deep snow summit */}
      <mesh receiveShadow position={[0, 15.22, -160]}>
        <cylinderGeometry args={[6.5, 7.2, 0.8, 20]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} flatShading />
      </mesh>

      {/* ── TRAIL PATH SEGMENTS ── */}
      {/* Dirt path color darkens as altitude rises: warm brown → grey → snowy */}

      {/* Path 1: CP1 → CP2 */}
      <mesh receiveShadow position={[-2.5, 1.22, -17.5]} rotation={[-0.09, 0.155, 0]}>
        <boxGeometry args={[3.6, 0.32, 30.5]} />
        <meshStandardMaterial color="#c2410c" roughness={0.92} flatShading />
      </mesh>

      {/* Path 2: CP2 → CP3 */}
      <mesh receiveShadow position={[0, 4.12, -48]} rotation={[-0.088, -0.3, 0]}>
        <boxGeometry args={[3.6, 0.32, 33.5]} />
        <meshStandardMaterial color="#d97706" roughness={0.92} flatShading />
      </mesh>

      {/* Path 3: CP3 → CP4 */}
      <mesh receiveShadow position={[-1.5, 7.02, -80]} rotation={[-0.094, 0.375, 0]}>
        <boxGeometry args={[3.6, 0.32, 34.5]} />
        <meshStandardMaterial color="#b45309" roughness={0.92} flatShading />
      </mesh>

      {/* Path 4: CP4 → CP5 */}
      <mesh receiveShadow position={[-1.0, 10.12, -112]} rotation={[-0.1, -0.395, 0]}>
        <boxGeometry args={[3.6, 0.32, 33.5]} />
        <meshStandardMaterial color="#78716c" roughness={0.92} flatShading />
      </mesh>

      {/* Path 5: CP5 → CP6 */}
      <mesh receiveShadow position={[3.0, 13.52, -144]} rotation={[-0.11, 0.34, 0]}>
        <boxGeometry args={[3.6, 0.32, 33.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} flatShading />
      </mesh>

      {/* ── INVISIBLE BOUNDARY WALLS ── */}
      {/* Left wall (mountain side) */}
      <mesh position={[-12, 8, -80]} visible={false}>
        <boxGeometry args={[1, 24, 200]} />
        <meshStandardMaterial />
      </mesh>
      {/* Right wall (valley edge) */}
      <mesh position={[14, 8, -80]} visible={false}>
        <boxGeometry args={[1, 24, 200]} />
        <meshStandardMaterial />
      </mesh>
      {/* Start wall */}
      <mesh position={[0, 10, 6]} visible={false}>
        <boxGeometry args={[32, 22, 2]} />
        <meshStandardMaterial />
      </mesh>
      {/* Summit wall */}
      <mesh position={[0, 19, -172]} visible={false}>
        <boxGeometry args={[32, 22, 2]} />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function Environment({ onCheckpointEnter, onCheckpointExit, isNight = false }) {
  const checkpoints = useMemo(() => [
    { id: 1, pos: [0,    0.4,   -2.5], sz: [7, 4, 7]   },
    { id: 2, pos: [-5,   3.0,  -32.0], sz: [6, 4, 6]   },
    { id: 3, pos: [5,    5.8,  -64.0], sz: [6, 4, 6]   },
    { id: 4, pos: [-8,   8.8,  -96.0], sz: [6, 4, 6]   },
    { id: 5, pos: [6,   12.0, -128.0], sz: [6, 4, 6]   },
    { id: 6, pos: [0,   15.5, -160.0], sz: [8, 5, 8]   },
  ], []);

  const boards = [
    { pos: [5.5,  1.5,  -2.5], label: 'INTRO',      num: '01', rot: [0, -0.5, 0] },
    { pos: [2.5,  4.5, -32.0], label: 'EDUCATION',  num: '02', rot: [0, -0.3, 0] },
    { pos: [10.5, 7.0, -64.0], label: 'PROJECTS',   num: '03', rot: [0, -0.45, 0] },
    { pos: [0.5, 10.0, -96.0], label: 'EXPERIENCE', num: '04', rot: [0, -0.3, 0] },
    { pos: [11.5,13.0,-128.0], label: 'SKILLS',     num: '05', rot: [0, -0.45, 0] },
    { pos: [5.5, 16.5,-160.0], label: 'CONTACT',    num: '06', rot: [0, -0.5, 0] },
  ];

  // Lighting changes with day/night
  const ambCol  = isNight ? '#1a2540' : '#f0f9ff';
  const ambInt  = isNight ? 0.22 : 1.05;
  const sunCol  = isNight ? '#4a6fa0' : '#fffcf5';
  const sunInt  = isNight ? 0.45 : 1.65;
  const sunPos  = isNight ? [-20, 30, 12] : [20, 34, 14];
  const hSky    = isNight ? '#0d1830' : '#bae6fd';
  const hGnd    = isNight ? '#080e18' : '#bbf7d0';

  return (
    <>
      {/* ── LIGHTING ── */}
      <ambientLight intensity={ambInt} color={ambCol} />
      <hemisphereLight skyColor={hSky} groundColor={hGnd} intensity={isNight ? 0.28 : 0.48} />
      <directionalLight
        castShadow
        position={sunPos}
        intensity={sunInt}
        color={sunCol}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-camera-near={0.5}
        shadow-camera-far={240}
        shadow-bias={-0.0003}
      />

      {/* ── SKY ── */}
      <SkySystem isNight={isNight} />

      {/* ── PHYSICS TERRAIN ── */}
      <ProceduralTerrain />

      {/* ── WORLD DECORATION ── */}
      <LeftMountains />
      <RightGrassland />
      <ValleyKhayi isNight={isNight} />
      <TrailDecorations isNight={isNight} />
      <StartCamp isNight={isNight} />
      <Summit />

      {/* ── CHECKPOINT BOARDS ── */}
      {boards.map((b, i) => (
        <CheckpointBoard key={i} position={b.pos} label={b.label} num={b.num} rotation={b.rot} />
      ))}

      {/* ── CHECKPOINT SENSOR TRIGGERS ── */}
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
