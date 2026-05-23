import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

// ------------------------------------------------------------------
// PROCEDURAL SUB-COMPONENTS (TENT, CABIN, CAMPFIRE, TREES, MOUNTAINS)
// ------------------------------------------------------------------

function ProceduralTree({ position, scale = 1, type = 'pine' }) {
  const leafColor = useMemo(() => {
    if (type === 'autumn') {
      const colors = ['#ea580c', '#f59e0b', '#dc2626', '#d97706'];
      return colors[Math.floor(Math.random() * colors.length)];
    } else if (type === 'snowy') {
      return '#2f4f4f'; // Dark teal/slate under snow
    } else {
      const colors = ['#15803d', '#166534', '#22c55e', '#10b981'];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }, [type]);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 5]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.9} />
      </mesh>
      
      {/* Layer 1 (Bottom) */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <coneGeometry args={[0.6, 0.8, 5]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      {type === 'snowy' && (
        <mesh castShadow position={[0, 0.95, 0]} scale={[1.02, 0.35, 1.02]}>
          <coneGeometry args={[0.6, 0.8, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
        </mesh>
      )}

      {/* Layer 2 (Middle) */}
      <mesh castShadow position={[0, 1.4, 0]}>
        <coneGeometry args={[0.45, 0.7, 5]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      {type === 'snowy' && (
        <mesh castShadow position={[0, 1.44, 0]} scale={[1.02, 0.35, 1.02]}>
          <coneGeometry args={[0.45, 0.7, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
        </mesh>
      )}

      {/* Layer 3 (Top) */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <coneGeometry args={[0.3, 0.5, 5]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      {type === 'snowy' && (
        <mesh castShadow position={[0, 1.83, 0]} scale={[1.02, 0.35, 1.02]}>
          <coneGeometry args={[0.3, 0.5, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
        </mesh>
      )}
    </group>
  );
}

function ProceduralCabin({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Main Cabin Logs Body */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[2.2, 1.2, 1.5]} />
        <meshStandardMaterial color="#6e3e15" roughness={0.9} flatShading />
      </mesh>
      
      {/* Slanted Roof Left */}
      <mesh castShadow position={[-0.65, 1.35, 0]} rotation={[0, 0, -Math.PI / 5.2]}>
        <boxGeometry args={[0.06, 1.3, 1.7]} />
        <meshStandardMaterial color="#991b1b" roughness={0.7} flatShading />
      </mesh>
      
      {/* Slanted Roof Right */}
      <mesh castShadow position={[0.65, 1.35, 0]} rotation={[0, 0, Math.PI / 5.2]}>
        <boxGeometry args={[0.06, 1.3, 1.7]} />
        <meshStandardMaterial color="#991b1b" roughness={0.7} flatShading />
      </mesh>

      {/* Stone Chimney */}
      <mesh castShadow position={[-0.7, 1.1, -0.4]}>
        <boxGeometry args={[0.3, 1.1, 0.3]} />
        <meshStandardMaterial color="#4b5563" roughness={0.85} flatShading />
      </mesh>

      {/* Door */}
      <mesh position={[0.5, 0.45, 0.76]}>
        <boxGeometry args={[0.45, 0.9, 0.05]} />
        <meshStandardMaterial color="#3a1e05" roughness={0.9} />
      </mesh>

      {/* Glowing Warm Window */}
      <mesh position={[-0.4, 0.6, 0.76]}>
        <boxGeometry args={[0.5, 0.5, 0.04]} />
        <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={1.5} />
      </mesh>
      {/* Window Cross Grid */}
      <mesh position={[-0.4, 0.6, 0.79]}>
        <boxGeometry args={[0.03, 0.5, 0.01]} />
        <meshBasicMaterial color="#334155" />
      </mesh>
      <mesh position={[-0.4, 0.6, 0.79]}>
        <boxGeometry args={[0.5, 0.03, 0.01]} />
        <meshBasicMaterial color="#334155" />
      </mesh>

      {/* Cabin Porch Light Source */}
      <pointLight color="#fbbf24" intensity={1.5} distance={5} position={[0, 0.9, 0.9]} />
    </group>
  );
}

function ProceduralTent({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Left Canvas Slope */}
      <mesh castShadow receiveShadow position={[-0.5, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.04, 1.15, 1.4]} />
        <meshStandardMaterial color="#f97316" roughness={0.7} flatShading /> {/* Cozy orange tent */}
      </mesh>
      
      {/* Right Canvas Slope */}
      <mesh castShadow receiveShadow position={[0.5, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.04, 1.15, 1.4]} />
        <meshStandardMaterial color="#f97316" roughness={0.7} flatShading />
      </mesh>

      {/* Back Triangle Wall */}
      <mesh castShadow position={[0, 0.46, -0.68]}>
        <coneGeometry args={[0.62, 1.05, 3]} />
        <meshStandardMaterial color="#ea580c" roughness={0.8} flatShading />
      </mesh>

      {/* Front Crossing Wood Poles */}
      <mesh castShadow position={[-0.52, 0.5, 0.7]} rotation={[0, 0, -Math.PI / 6.2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 5]} />
        <meshStandardMaterial color="#5c3818" />
      </mesh>
      <mesh castShadow position={[0.52, 0.5, 0.7]} rotation={[0, 0, Math.PI / 6.2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 5]} />
        <meshStandardMaterial color="#5c3818" />
      </mesh>

      {/* Blue Sleeping Bag inside */}
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.12, -0.25]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.6} />
      </mesh>
    </group>
  );
}

function ProceduralCampfire({ position }) {
  const lightRef = useRef();
  const flame1Ref = useRef();
  const flame2Ref = useRef();
  const flame3Ref = useRef();
  const sparksRef = useRef();

  const sparksCount = 10;
  const sparksData = useMemo(() => {
    return Array.from({ length: sparksCount }).map(() => ({
      x: -0.15 + Math.random() * 0.3,
      y: Math.random() * 1.5,
      z: -0.15 + Math.random() * 0.3,
      speedY: 0.6 + Math.random() * 0.7,
      speedX: -0.15 + Math.random() * 0.3,
      speedZ: -0.15 + Math.random() * 0.3,
      scale: 0.015 + Math.random() * 0.025,
      life: Math.random()
    }));
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    if (lightRef.current) {
      lightRef.current.intensity = 1.6 + Math.sin(time * 16) * 0.3 + Math.random() * 0.15;
    }

    if (flame1Ref.current) {
      flame1Ref.current.scale.y = 1.0 + Math.sin(time * 13) * 0.15;
      flame1Ref.current.scale.x = 1.0 + Math.cos(time * 9) * 0.08;
    }
    if (flame2Ref.current) {
      flame2Ref.current.scale.y = 0.85 + Math.sin(time * 11 + 1.2) * 0.12;
      flame2Ref.current.scale.x = 0.85 + Math.cos(time * 14 + 1.2) * 0.09;
    }
    if (flame3Ref.current) {
      flame3Ref.current.scale.y = 0.75 + Math.sin(time * 15 + 2.4) * 0.18;
      flame3Ref.current.scale.x = 0.75 + Math.cos(time * 10 + 2.4) * 0.07;
    }

    if (sparksRef.current) {
      sparksRef.current.children.forEach((spark, idx) => {
        const data = sparksData[idx];
        if (data) {
          data.life += delta * data.speedY * 0.65;
          if (data.life > 1.0) {
            data.life = 0;
            data.x = -0.15 + Math.random() * 0.3;
            data.y = 0.05;
            data.z = -0.15 + Math.random() * 0.3;
          }

          spark.position.y = 0.08 + data.life * 1.5;
          spark.position.x = data.x + Math.sin(data.life * 5) * 0.07 + data.life * data.speedX * 0.25;
          spark.position.z = data.z + Math.cos(data.life * 5) * 0.07 + data.life * data.speedZ * 0.25;
          
          const alpha = 1 - data.life;
          spark.scale.setScalar(data.scale * Math.sin(alpha * Math.PI));
          if (spark.material) spark.material.opacity = alpha;
        }
      });
    }
  });

  return (
    <group position={position}>
      {/* Stone Ring */}
      {Array.from({ length: 6 }).map((_, idx) => {
        const angle = (idx / 6) * Math.PI * 2;
        const r = 0.42;
        return (
          <mesh
            key={idx}
            position={[Math.sin(angle) * r, 0.04, Math.cos(angle) * r]}
            rotation={[Math.random(), Math.random(), Math.random()]}
            castShadow
          >
            <dodecahedronGeometry args={[0.08]} />
            <meshStandardMaterial color="#6b7280" roughness={0.8} flatShading />
          </mesh>
        );
      })}

      {/* Logs */}
      <mesh rotation={[0.2, 0.5, 1.2]} castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 5]} />
        <meshStandardMaterial color="#3a1e05" roughness={0.9} />
      </mesh>
      <mesh rotation={[0.2, -0.8, -1.1]} castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 5]} />
        <meshStandardMaterial color="#3a1e05" roughness={0.9} />
      </mesh>
      <mesh rotation={[-0.2, 1.1, -0.6]} castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 5]} />
        <meshStandardMaterial color="#3a1e05" roughness={0.9} />
      </mesh>

      {/* Warm flickering point light */}
      <pointLight ref={lightRef} color="#ff6b00" intensity={2.0} distance={6} position={[0, 0.35, 0]} castShadow />

      {/* Animated flames */}
      <mesh ref={flame1Ref} position={[0, 0.18, 0]}>
        <coneGeometry args={[0.16, 0.5, 5]} />
        <meshBasicMaterial color="#ff4d00" transparent opacity={0.8} />
      </mesh>
      <mesh ref={flame2Ref} position={[0.05, 0.14, 0.03]} scale={[0.7, 0.8, 0.7]}>
        <coneGeometry args={[0.16, 0.5, 5]} />
        <meshBasicMaterial color="#ffa200" transparent opacity={0.85} />
      </mesh>
      <mesh ref={flame3Ref} position={[-0.05, 0.2, -0.03]} scale={[0.55, 0.9, 0.55]}>
        <coneGeometry args={[0.16, 0.5, 5]} />
        <meshBasicMaterial color="#ffeb3b" transparent opacity={0.9} />
      </mesh>

      {/* Sparks Group */}
      <group ref={sparksRef}>
        {Array.from({ length: sparksCount }).map((_, idx) => (
          <mesh key={idx}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshBasicMaterial color="#ff7f00" transparent opacity={0.95} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WavingFlag({ position }) {
  const flagRef = useRef();
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(time * 3.5) * 0.18;
      flagRef.current.rotation.z = Math.cos(time * 4.2) * 0.06;
    }
  });

  return (
    <group position={position}>
      {/* flagpole */}
      <mesh castShadow position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 3.6, 6]} />
        <meshStandardMaterial color="#bdc3c7" roughness={0.4} />
      </mesh>
      {/* flag banner */}
      <mesh ref={flagRef} position={[0.45, 3.1, 0]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.02]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

// 3D Clouds System
function SkyClouds() {
  const cloudsRef = useRef();
  const cloudsData = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      position: [-35 + Math.random() * 70, 13 + Math.random() * 6, -10 - Math.random() * 160],
      speed: 0.5 + Math.random() * 0.8,
      scale: 1.5 + Math.random() * 1.8
    }));
  }, []);

  useFrame((state, delta) => {
    if (!cloudsRef.current) return;
    cloudsRef.current.children.forEach((cloudGroup, idx) => {
      const data = cloudsData[idx];
      if (data) {
        cloudGroup.position.x += delta * data.speed;
        if (cloudGroup.position.x > 45) cloudGroup.position.x = -45;
      }
    });
  });

  return (
    <group ref={cloudsRef}>
      {cloudsData.map((data) => (
        <group key={data.id} position={data.position} scale={data.scale}>
          <mesh castShadow><sphereGeometry args={[1.0, 6, 6]} /><meshStandardMaterial color="#ffffff" roughness={0.9} flatShading /></mesh>
          <mesh position={[0.7, 0, 0]} scale={0.8}><sphereGeometry args={[1.0, 6, 6]} /><meshStandardMaterial color="#ffffff" roughness={0.9} flatShading /></mesh>
          <mesh position={[-0.7, 0, 0]} scale={0.8}><sphereGeometry args={[1.0, 6, 6]} /><meshStandardMaterial color="#ffffff" roughness={0.9} flatShading /></mesh>
          <mesh position={[0, 0.5, 0]} scale={0.95}><sphereGeometry args={[1.0, 6, 6]} /><meshStandardMaterial color="#ffffff" roughness={0.9} flatShading /></mesh>
        </group>
      ))}
    </group>
  );
}

// Smoke effect for cabin chimney
function ChimneySmoke({ position }) {
  const groupRef = useRef();
  const smokePuffs = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      speedY: 0.35 + Math.random() * 0.25,
      speedX: -0.06 + Math.random() * 0.12,
      delay: i * 0.7,
      scaleMax: 0.12 + Math.random() * 0.1
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((puff, idx) => {
      const config = smokePuffs[idx];
      if (config) {
        const lifeTime = (time + config.delay) % 4.2;
        puff.position.y = lifeTime * config.speedY;
        puff.position.x = Math.sin(lifeTime * 1.8) * 0.08 + lifeTime * config.speedX;
        const progress = lifeTime / 4.2;
        puff.scale.setScalar(config.scaleMax * Math.sin(progress * Math.PI));
        if (puff.material) puff.material.opacity = (1 - progress) * 0.55;
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {smokePuffs.map((p) => (
        <mesh key={p.id}>
          <sphereGeometry args={[1, 5, 5]} />
          <meshBasicMaterial color="#f1f5f9" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------
// PROCEDURAL ENVIRONMENT GRAPHICS
// ------------------------------------------------------------------

function ProceduralEnvironment({ checkpoints }) {
  // Low-poly Scenic Mountains
  const mountainsData = useMemo(() => [
    { pos: [0, -10, -210], scale: [36, 65, 36], color: "#475569" }, // Giant background Peak
    { pos: [-38, -5, -140], scale: [24, 45, 24], color: "#334155" }, // Left side peaks
    { pos: [-32, -8, -90], scale: [22, 36, 22], color: "#475569" },
    { pos: [-28, -12, -40], scale: [18, 25, 18], color: "#4a5d3c" },
    { pos: [38, -5, -130], scale: [24, 45, 24], color: "#334155" }, // Right side peaks
    { pos: [30, -8, -80], scale: [22, 36, 22], color: "#475569" },
    { pos: [28, -12, -30], scale: [18, 25, 18], color: "#4a5d3c" },
    { pos: [-22, -14, 15], scale: [15, 20, 15], color: "#365314" }, // Front flanks
    { pos: [22, -14, 15], scale: [15, 20, 15], color: "#365314" }
  ], []);

  // Wooden fence posts scattered along the paths
  const fencePosts = useMemo(() => [
    // Path 1 (C1 to C2)
    { pos: [-1.2, 0.9, -10] }, { pos: [1.2, 0.9, -10] },
    { pos: [-3.2, 1.9, -20] }, { pos: [-0.8, 1.9, -20] },
    // Path 2 (C2 to C3)
    { pos: [-4.2, 3.8, -38] }, { pos: [-2.0, 3.8, -38] },
    { pos: [1.0, 5.0, -50] }, { pos: [3.2, 5.0, -50] },
    // Path 3 (C3 to C4)
    { pos: [2.8, 6.7, -70] }, { pos: [0.6, 6.7, -70] },
    { pos: [-4.8, 8.0, -85] }, { pos: [-7.0, 8.0, -85] },
    // Path 4 (C4 to C5)
    { pos: [-6.8, 9.8, -104] }, { pos: [-4.6, 9.8, -104] },
    { pos: [1.8, 11.0, -118] }, { pos: [4.0, 11.0, -118] },
    // Path 5 (C5 to C6)
    { pos: [4.8, 13.0, -136] }, { pos: [2.6, 13.0, -136] },
    { pos: [1.2, 14.4, -150] }, { pos: [3.4, 14.4, -150] }
  ], []);

  // Stepping stones along the winding paths
  const steppingStones = useMemo(() => [
    { pos: [0, 0.05, -5.5] },
    { pos: [-1.1, 0.65, -12] },
    { pos: [-2.3, 1.25, -18] },
    { pos: [-3.5, 1.85, -24] },
    { pos: [-4.6, 2.45, -30] },
    { pos: [-3.2, 3.25, -38] },
    { pos: [-1.1, 3.85, -44] },
    { pos: [1.0, 4.45, -50] },
    { pos: [3.1, 5.05, -56] },
    { pos: [4.9, 5.65, -62] },
    { pos: [3.1, 6.25, -70] },
    { pos: [1.0, 6.85, -76] },
    { pos: [-1.1, 7.45, -82] },
    { pos: [-3.2, 8.05, -88] },
    { pos: [-5.0, 8.65, -94] },
    { pos: [-4.0, 9.25, -102] },
    { pos: [-2.0, 9.85, -108] },
    { pos: [0.0, 10.45, -114] },
    { pos: [2.0, 11.05, -120] },
    { pos: [4.0, 11.65, -126] },
    { pos: [4.6, 12.35, -134] },
    { pos: [3.3, 12.95, -140] },
    { pos: [2.0, 13.55, -146] },
    { pos: [1.0, 14.15, -152] },
    { pos: [0.0, 14.85, -158] }
  ], []);

  // Trees list with coordinates, scales, and altitude colors
  const treesData = useMemo(() => [
    // Base Camp (Check 1) - lush green
    { pos: [-5, 0.1, -2.0], scale: 1.1, type: 'pine' },
    { pos: [-6.2, 0.1, -5.8], scale: 1.4, type: 'pine' },
    { pos: [5.0, 0.1, -1.8], scale: 1.0, type: 'pine' },
    { pos: [4.8, 0.1, -5.8], scale: 1.3, type: 'pine' },
    { pos: [2.0, 0.1, -1.2], scale: 0.75, type: 'pine' },
    { pos: [-2.2, 0.1, -1.0], scale: 0.8, type: 'pine' },

    // Mid-climb (Check 2) - pine and autumn
    { pos: [-8.8, 2.7, -30], scale: 1.25, type: 'pine' },
    { pos: [-8.5, 2.7, -36], scale: 1.45, type: 'autumn' },
    { pos: [-1.8, 2.7, -35], scale: 0.95, type: 'autumn' },

    // Middle slopes (Check 3 & 4) - warm autumn colors
    { pos: [9.5, 5.5, -60], scale: 1.3, type: 'autumn' },
    { pos: [1.8, 5.5, -66], scale: 1.05, type: 'autumn' },
    { pos: [8.8, 5.5, -68], scale: 1.2, type: 'autumn' },
    { pos: [-12.2, 8.5, -92], scale: 1.2, type: 'autumn' },
    { pos: [-12.0, 8.5, -100], scale: 1.4, type: 'pine' },
    { pos: [-4.2, 8.5, -98], scale: 0.95, type: 'pine' },

    // High elevation (Check 5 & 6) - snowy pine trees
    { pos: [10.0, 11.7, -124], scale: 1.3, type: 'snowy' },
    { pos: [1.8, 11.7, -132], scale: 1.0, type: 'snowy' },
    { pos: [9.0, 11.7, -130], scale: 1.2, type: 'snowy' },
    { pos: [-4.8, 15.2, -156], scale: 1.2, type: 'snowy' },
    { pos: [4.8, 15.2, -158], scale: 1.35, type: 'snowy' },
    { pos: [-4.0, 15.2, -165], scale: 1.05, type: 'snowy' },
    { pos: [4.0, 15.2, -165], scale: 0.85, type: 'snowy' }
  ], []);

  // Scattered grey boulders
  const bouldersData = useMemo(() => [
    { pos: [-3, 0.1, -4.5], scale: [0.8, 0.7, 0.9], rot: [0.2, 0.4, 0.1] },
    { pos: [2.5, 0.1, -5.2], scale: [1.0, 0.9, 0.8], rot: [0.1, 0.8, 0.3] },
    { pos: [-7.8, 2.7, -33], scale: [1.1, 1.2, 0.9], rot: [0.4, 0.1, 0.5] },
    { pos: [7.5, 5.5, -63], scale: [1.2, 1.0, 1.3], rot: [0.3, 0.6, 0.2] },
    { pos: [-10.2, 8.5, -95], scale: [1.4, 1.1, 1.3], rot: [0.5, 0.2, 0.1] },
    { pos: [8.2, 11.7, -127], scale: [1.2, 1.3, 1.0], rot: [0.1, 0.5, 0.4] }
  ], []);

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1.2}>
      {/* ----------------------------------------------------
         1. SCENIC MOUNTAINS BACKGROUND RING
         ---------------------------------------------------- */}
      {mountainsData.map((m, idx) => (
        <group key={idx} position={m.pos}>
          {/* Main Peak Cone */}
          <mesh castShadow receiveShadow>
            <coneGeometry args={[m.scale[0], m.scale[1], 4]} />
            <meshStandardMaterial color={m.color} roughness={0.85} flatShading />
          </mesh>
          {/* Snowy Cap */}
          <mesh castShadow position={[0, m.scale[1] * 0.325, 0]} scale={[0.36, 0.36, 0.36]}>
            <coneGeometry args={[m.scale[0], m.scale[1], 4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
          </mesh>
        </group>
      ))}

      {/* ----------------------------------------------------
         2. ELEVATION-THEMED CHECKPOINT LANDING PLATFORMS
         ---------------------------------------------------- */}
      
      {/* Checkpoint 1: Basecamp - Lush Forest Green */}
      <mesh receiveShadow position={[0, -0.3, -3]}>
        <cylinderGeometry args={[7.5, 8.0, 0.8, 24]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} flatShading />
      </mesh>

      {/* Checkpoint 2: Education - Forest Lime/Yellow Green */}
      <mesh receiveShadow position={[-5, 2.7, -32]}>
        <cylinderGeometry args={[5.5, 6.0, 0.8, 16]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.9} flatShading />
      </mesh>

      {/* Checkpoint 3: Projects - Meadow Gold/Autumn Brown */}
      <mesh receiveShadow position={[5, 5.5, -64]}>
        <cylinderGeometry args={[5.5, 6.0, 0.8, 16]} />
        <meshStandardMaterial color="#854d0e" roughness={0.9} flatShading />
      </mesh>

      {/* Checkpoint 4: Experience - High Pass Dark Grey Rock */}
      <mesh receiveShadow position={[-8, 8.5, -96]}>
        <cylinderGeometry args={[5.5, 6.0, 0.8, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.95} flatShading />
      </mesh>

      {/* Checkpoint 5: Skills - Snowy Peak Slate Blue */}
      <mesh receiveShadow position={[6, 11.7, -128]}>
        <cylinderGeometry args={[5.5, 6.0, 0.8, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} flatShading />
      </mesh>

      {/* Checkpoint 6: Summit Peak - Pure Snowy White */}
      <mesh receiveShadow position={[0, 15.2, -160]}>
        <cylinderGeometry args={[6.5, 7.0, 0.8, 24]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} flatShading />
      </mesh>

      {/* Waving Summit Red Flag at Summit */}
      <WavingFlag position={[0, 15.4, -162.2]} />

      {/* ----------------------------------------------------
         3. WINDING SANDY/DIRT TREK TRAIL
         ---------------------------------------------------- */}
      {/* Path 1: C1 to C2 */}
      <mesh receiveShadow position={[-2.5, 1.2, -17.5]} rotation={[-0.1, 0.16, 0]}>
        <boxGeometry args={[2.0, 0.3, 29.5]} />
        <meshStandardMaterial color="#c2410c" roughness={0.9} flatShading />
      </mesh>
      {/* Path 2: C2 to C3 */}
      <mesh receiveShadow position={[0, 4.1, -48]} rotation={[-0.09, -0.3, 0]}>
        <boxGeometry args={[2.0, 0.3, 32.0]} />
        <meshStandardMaterial color="#d97706" roughness={0.9} flatShading />
      </mesh>
      {/* Path 3: C3 to C4 */}
      <mesh receiveShadow position={[-1.5, 7.0, -80]} rotation={[-0.09, 0.38, 0]}>
        <boxGeometry args={[2.0, 0.3, 34.0]} />
        <meshStandardMaterial color="#b45309" roughness={0.9} flatShading />
      </mesh>
      {/* Path 4: C4 to C5 */}
      <mesh receiveShadow position={[-1.0, 10.1, -112]} rotation={[-0.1, -0.4, 0]}>
        <boxGeometry args={[2.0, 0.3, 32.0]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} flatShading />
      </mesh>
      {/* Path 5: C5 to C6 */}
      <mesh receiveShadow position={[3.0, 13.45, -144]} rotation={[-0.11, 0.35, 0]}>
        <boxGeometry args={[2.0, 0.3, 32.0]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} flatShading />
      </mesh>

      {/* Decorative Stepping Stones */}
      {steppingStones.map((stone, idx) => (
        <mesh key={idx} position={stone.pos} rotation={[0, Math.random() * Math.PI, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.06, 6]} />
          <meshStandardMaterial color="#4b5563" roughness={0.9} flatShading />
        </mesh>
      ))}

      {/* Decorative Wooden Fence Posts */}
      {fencePosts.map((post, idx) => (
        <WoodenPost key={idx} position={post.pos} />
      ))}

      {/* ----------------------------------------------------
         4. BASECAMP COZY ENVIRONMENT LAYOUT (CHECKPOINT 1)
         ---------------------------------------------------- */}
      {/* Campfire (Outside of both tent and cabin, in the center) */}
      <ProceduralCampfire position={[0, 0.1, -2.8]} />

      {/* Log stumps for sitting around campfire */}
      <mesh castShadow position={[-1.0, 0.2, -2.4]} rotation={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.32, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} flatShading />
      </mesh>
      <mesh castShadow position={[1.0, 0.2, -2.5]} rotation={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.32, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.95} flatShading />
      </mesh>

      {/* Cozy Log Cabin / Wooden Hut (BIGGER than the tent) */}
      <group position={[-4.5, 0.1, -4.5]} rotation={[0, 0.45, 0]}>
        <ProceduralCabin position={[0, 0, 0]} scale={1.5} />
        <ChimneySmoke position={[0.7 * 1.5, 1.1 * 1.5, -0.4 * 1.5]} />
      </group>

      {/* Cozy Fabric Tent (Opposite side of cabin) */}
      <ProceduralTent position={[3.6, 0.1, -3.2]} rotation={[0, -0.4, 0]} scale={1.1} />

      {/* Small backpack lying on the ground */}
      <group position={[2.2, 0.1, -2.8]} rotation={[0.2, 0.1, -0.15]} scale={0.75}>
        <mesh castShadow position={[0, 0.22, 0]}>
          <boxGeometry args={[0.3, 0.4, 0.15]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.24, 0.1]}>
          <boxGeometry args={[0.22, 0.26, 0.08]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
      </group>

      {/* ----------------------------------------------------
         5. SCATTERED TREES & BOULDERS
         ---------------------------------------------------- */}
      {treesData.map((tree, idx) => (
        <ProceduralTree key={idx} position={tree.pos} scale={tree.scale} type={tree.type} />
      ))}

      {bouldersData.map((b, idx) => (
        <ProceduralRock key={idx} position={b.pos} scale={b.scale} rotation={b.rot} />
      ))}

      {/* Base camp entrance archway */}
      <group position={[0, 0.1, -6.5]}>
        <mesh castShadow position={[-1.5, 1.0, 0]}><cylinderGeometry args={[0.07, 0.08, 2.0, 5]} /><meshStandardMaterial color="#3a1e05" /></mesh>
        <mesh castShadow position={[1.5, 1.0, 0]}><cylinderGeometry args={[0.07, 0.08, 2.0, 5]} /><meshStandardMaterial color="#3a1e05" /></mesh>
        <mesh castShadow position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 3.1, 5]} /><meshStandardMaterial color="#3a1e05" /></mesh>
        
        {/* Arch Signboard */}
        <mesh castShadow position={[0, 1.6, 0.04]}><boxGeometry args={[1.5, 0.45, 0.06]} /><meshStandardMaterial color="#6e3e15" /></mesh>
        <pointLight color="#ffcc00" intensity={0.8} distance={3} position={[0, 1.3, 0.15]} />
      </group>

      {/* ----------------------------------------------------
         6. INVISIBLE BOUNDARY COLLIDERS
         ---------------------------------------------------- */}
      <mesh position={[-11, 7, -90]} visible={false}><boxGeometry args={[2, 22, 220]} /><meshStandardMaterial /></mesh>
      <mesh position={[11, 7, -90]} visible={false}><boxGeometry args={[2, 22, 220]} /><meshStandardMaterial /></mesh>
      <mesh position={[0, 10, 8]} visible={false}><boxGeometry args={[25, 20, 2]} /><meshStandardMaterial /></mesh>
      <mesh position={[0, 18, -170]} visible={false}><boxGeometry args={[25, 20, 2]} /><meshStandardMaterial /></mesh>
    </RigidBody>
  );
}

function WoodenPost({ position }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.06, 0.07, 1.0, 5]} />
      <meshStandardMaterial color="#5c3818" roughness={0.9} flatShading />
    </mesh>
  );
}

function ProceduralRock({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.6]} />
      <meshStandardMaterial color="#6b7280" roughness={0.8} flatShading />
    </mesh>
  );
}

// ------------------------------------------------------------------
// MAIN EXPORT WRAPPER
// ------------------------------------------------------------------
export default function Environment(props) {
  const checkpoints = useMemo(() => [
    { id: 1, name: 'Intro', pos: [0, 0.4, -2.5], size: [3.5, 3.5, 3.5] },
    { id: 2, name: 'Education', pos: [-5, 3.0, -32.0], size: [3.5, 3.5, 3.5] },
    { id: 3, name: 'Projects', pos: [5, 5.8, -64.0], size: [4.0, 3.5, 4.0] },
    { id: 4, name: 'Experience', pos: [-8, 8.8, -96.0], size: [4.0, 3.5, 4.0] },
    { id: 5, name: 'Skills', pos: [6, 12.0, -128.0], size: [3.5, 3.5, 3.5] },
    { id: 6, name: 'Contact', pos: [0, 15.5, -160.0], size: [4.5, 4.5, 4.5] }
  ], []);

  return (
    <>
      {/* Ambient sky bounce */}
      <ambientLight intensity={1.1} color="#f0f9ff" />
      
      {/* Environment Hemisphere Light (blend sky and grass tones) */}
      <hemisphereLight skyColor="#bae6fd" groundColor="#bbf7d0" intensity={0.5} />
      
      {/* Sunny warm Directional Light */}
      <directionalLight
        castShadow
        position={[18, 32, 12]}
        intensity={1.7}
        color="#fffcf5"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-camera-near={0.5}
        shadow-camera-far={220}
        shadow-bias={-0.0003}
      />

      {/* Flying Clouds */}
      <SkyClouds />

      {/* Checkpoint triggers */}
      {checkpoints.map((cp) => (
        <RigidBody key={cp.id} type="fixed" colliders={false} position={cp.pos}>
          <CuboidCollider
            args={cp.size.map(v => v / 2)}
            sensor
            onIntersectionEnter={() => props.onCheckpointEnter(cp.id)}
            onIntersectionExit={() => props.onCheckpointExit(cp.id)}
          />
        </RigidBody>
      ))}

      {/* Main environment */}
      <ProceduralEnvironment checkpoints={checkpoints} />
    </>
  );
}
