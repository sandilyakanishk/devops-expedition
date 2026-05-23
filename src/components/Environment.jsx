import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGLTF, Stars } from '@react-three/drei';
import * as THREE from 'three';
import ErrorBoundary from './ErrorBoundary';

// ------------------------------------------------------------------
// PROCEDURAL SUB-COMPONENTS (TENT, CABIN, CAMPFIRE, TREES)
// ------------------------------------------------------------------
function PineTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 5]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.0, 0]}>
        <coneGeometry args={[0.55, 0.9, 5]} />
        <meshStandardMaterial color="#2e5a1c" roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <coneGeometry args={[0.4, 0.7, 5]} />
        <meshStandardMaterial color="#3d7227" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

function ProceduralCabin({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[1.5, 1.2, 1.2]} />
        <meshStandardMaterial color="#8e5a3c" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.45, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.1, 1.1, 1.35]} />
        <meshStandardMaterial color="#a0522d" roughness={0.7} />
      </mesh>
      <mesh position={[0.4, 0.4, 0.61]}>
        <boxGeometry args={[0.3, 0.8, 0.02]} />
        <meshStandardMaterial color="#3a1e05" />
      </mesh>
      <mesh position={[-0.4, 0.6, 0.61]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color="#ffe082" emissive="#ffb300" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function ProceduralCampfire({ position }) {
  const lightRef = useRef();
  const flameRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.intensity = 1.3 + Math.sin(time * 16) * 0.35 + Math.random() * 0.15;
    }
    if (flameRef.current) {
      flameRef.current.scale.y = 1.0 + Math.sin(time * 12) * 0.12;
      flameRef.current.scale.x = 1.0 + Math.cos(time * 9) * 0.08;
    }
  });

  return (
    <group position={position}>
      <mesh rotation={[0.3, 0.4, 1.2]} castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 5]} />
        <meshStandardMaterial color="#421a01" roughness={0.9} />
      </mesh>
      <mesh rotation={[0.3, -0.9, -1.1]} castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 5]} />
        <meshStandardMaterial color="#421a01" roughness={0.9} />
      </mesh>
      <pointLight ref={lightRef} color="#ff6200" intensity={1.5} distance={6} position={[0, 0.3, 0]} castShadow />
      <mesh ref={flameRef} position={[0, 0.2, 0]}>
        <coneGeometry args={[0.2, 0.5, 5]} />
        <meshBasicMaterial color="#ff5400" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// 3D Clouds
function SkyClouds() {
  const cloudsRef = useRef();
  const cloudsData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      position: [-20 + Math.random() * 40, 14 + Math.random() * 6, -10 - Math.random() * 110],
      speed: 0.8 + Math.random() * 1.2,
      scale: 1.4 + Math.random() * 1.5
    }));
  }, []);

  useFrame((state, delta) => {
    cloudsRef.current.children.forEach((cloudGroup, idx) => {
      const data = cloudsData[idx];
      cloudGroup.position.x += delta * data.speed;
      if (cloudGroup.position.x > 40) cloudGroup.position.x = -40;
    });
  });

  return (
    <group ref={cloudsRef}>
      {cloudsData.map((data) => (
        <group key={data.id} position={data.position} scale={data.scale}>
          <mesh><sphereGeometry args={[1.0, 6, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <mesh position={[0.7, 0, 0]} scale={0.8}><sphereGeometry args={[1.0, 6, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <mesh position={[-0.7, 0, 0]} scale={0.8}><sphereGeometry args={[1.0, 6, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <mesh position={[0, 0.5, 0]} scale={0.9}><sphereGeometry args={[1.0, 6, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ))}
    </group>
  );
}

// Chimney Smoke
function ChimneySmoke({ position }) {
  const groupRef = useRef();
  const smokePuffs = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      speedY: 0.35 + Math.random() * 0.25,
      speedX: -0.08 + Math.random() * 0.16,
      delay: i * 0.8,
      scaleMax: 0.12 + Math.random() * 0.12
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((puff, idx) => {
      const config = smokePuffs[idx];
      const lifeTime = (time + config.delay) % 4.8;
      puff.position.y = lifeTime * config.speedY;
      puff.position.x = Math.sin(lifeTime * 2) * 0.08 + lifeTime * config.speedX;
      const progress = lifeTime / 4.8;
      puff.scale.setScalar(config.scaleMax * Math.sin(progress * Math.PI));
      puff.material.opacity = (1 - progress) * 0.6;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {smokePuffs.map((p) => (
        <mesh key={p.id}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------
// 1. CUSTOM GLB ENVIRONMENT LOADER
// ------------------------------------------------------------------
function GLBEnvironment({ onCheckpointEnter, onCheckpointExit, checkpoints }) {
  // Load custom GLB assets from public/ directory
  const mountaintopGltf = useGLTF('/Mountaintop.glb');
  const cabinGltf = useGLTF('/Log Cabin.glb');
  const campfireGltf = useGLTF('/Campfire.glb');
  const natureGltf = useGLTF('/Nature.glb');
  const rocksGltf = useGLTF('/Rocks.glb');
  const tentGltf = useGLTF('/Tent.glb');
  const backpackGltf = useGLTF('/Backpack.glb');

  // Clone assets for safe rendering
  const terrainScene = useMemo(() => mountaintopGltf.scene.clone(), [mountaintopGltf]);
  const cabinScene = useMemo(() => cabinGltf.scene.clone(), [cabinGltf]);
  const campfireScene = useMemo(() => campfireGltf.scene.clone(), [campfireGltf]);
  const natureScene = useMemo(() => natureGltf.scene.clone(), [natureGltf]);
  const rocksScene = useMemo(() => rocksGltf.scene.clone(), [rocksGltf]);
  const tentScene = useMemo(() => tentGltf.scene.clone(), [tentGltf]);
  const backpackScene = useMemo(() => backpackGltf.scene.clone(), [backpackGltf]);

  useEffect(() => {
    const scenes = [terrainScene, cabinScene, campfireScene, natureScene, rocksScene, tentScene, backpackScene];
    scenes.forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = 0.85;
            child.material.metalness = 0.05;
            child.material.flatShading = true;
          }
        }
      });
    });
  }, [terrainScene, cabinScene, campfireScene, natureScene, rocksScene, tentScene, backpackScene]);

  const fireLightRef = useRef();
  const flameGroupRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 1.4 + Math.sin(time * 18) * 0.35 + Math.random() * 0.15;
    }
    if (flameGroupRef.current) {
      flameGroupRef.current.children.forEach((flame, i) => {
        const bounce = 1.0 + Math.sin(time * 12 + i) * 0.12;
        flame.scale.set(bounce, bounce * 1.1, bounce);
      });
    }
  });

  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1.2}>
      {/* Terrain Landscape */}
      <primitive object={terrainScene} position={[0, 0, 0]} />

      {/* Log Cabin */}
      <group position={[-5, 0, -5]} rotation={[0, 0.45, 0]}>
        <primitive object={cabinScene} scale={1.3} />
        <ChimneySmoke position={[0.7, 2.2, -0.6]} />
        <pointLight color="#ff9800" intensity={2} distance={6} position={[0, 0.9, 0.2]} />
      </group>

      {/* Campfire */}
      <group position={[0, 0.05, -2.5]}>
        <primitive object={campfireScene} scale={0.95} />
        <pointLight ref={fireLightRef} color="#ff5400" intensity={1.8} distance={6} position={[0, 0.3, 0]} castShadow />
        <group ref={flameGroupRef} position={[0, 0.15, 0]}>
          <mesh><coneGeometry args={[0.22, 0.55, 5]} /><meshBasicMaterial color="#ff4d00" transparent opacity={0.8} /></mesh>
          <mesh position={[0.08, 0.05, 0.08]} scale={[0.7, 0.7, 0.7]}><coneGeometry args={[0.22, 0.55, 5]} /><meshBasicMaterial color="#ffa200" transparent opacity={0.85} /></mesh>
          <mesh position={[-0.08, 0.08, -0.08]} scale={[0.65, 0.8, 0.65]}><coneGeometry args={[0.22, 0.55, 5]} /><meshBasicMaterial color="#ffcc00" transparent opacity={0.9} /></mesh>
        </group>
      </group>

      {/* Backpack & Tent */}
      <primitive object={backpackScene} position={[1.2, 0.05, -2.4]} rotation={[0, -0.3, 0]} scale={1.1} />
      <primitive object={tentScene} position={[3.6, 0.05, -2.8]} rotation={[0, -0.4, 0]} scale={1.15} />

      {/* Foliage / Nature */}
      <primitive object={natureScene} position={[0, 0, 0]} />
      <primitive object={rocksScene} position={[0, 0, 0]} />

      {/* Start Archway */}
      <group position={[0, 0.05, -6.5]}>
        <mesh castShadow position={[-1.6, 1.1, 0]}><cylinderGeometry args={[0.1, 0.12, 2.2, 6]} /><meshStandardMaterial color="#6e3e15" /></mesh>
        <mesh castShadow position={[1.6, 1.1, 0]}><cylinderGeometry args={[0.1, 0.12, 2.2, 6]} /><meshStandardMaterial color="#6e3e15" /></mesh>
        <mesh castShadow position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.08, 0.08, 3.4, 6]} /><meshStandardMaterial color="#6e3e15" /></mesh>
        <mesh castShadow position={[0, 1.7, 0.08]}><boxGeometry args={[1.6, 0.5, 0.08]} /><meshStandardMaterial color="#8e532b" /></mesh>
      </group>
    </RigidBody>
  );
}

// ------------------------------------------------------------------
// 2. PROCEDURAL ENVIRONMENT FALLBACK
// ------------------------------------------------------------------
function ProceduralEnvironment({ onCheckpointEnter, onCheckpointExit, checkpoints }) {
  return (
    <RigidBody type="fixed" colliders="trimesh" friction={1.2}>
      {/* Checkpoint 1 Base Camp Ground */}
      <mesh receiveShadow position={[0, -0.2, 0]}>
        <cylinderGeometry args={[6, 6.5, 0.4, 16]} />
        <meshStandardMaterial color="#3c502b" roughness={0.8} />
      </mesh>
      
      {/* Campfire */}
      <ProceduralCampfire position={[0, 0, -2.5]} />
      
      {/* Cozy log Cabin */}
      <ProceduralCabin position={[-4, 0, -3.8]} rotation={[0, 0.4, 0]} />
      <ChimneySmoke position={[-3.3, 1.5, -4.3]} />

      {/* Wooden Archway */}
      <group position={[0, 0, -6.0]}>
        <mesh castShadow position={[-1.5, 1.0, 0]}><cylinderGeometry args={[0.08, 0.08, 2.0, 6]} /><meshStandardMaterial color="#6e3e15" /></mesh>
        <mesh castShadow position={[1.5, 1.0, 0]}><cylinderGeometry args={[0.08, 0.08, 2.0, 6]} /><meshStandardMaterial color="#6e3e15" /></mesh>
        <mesh castShadow position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 3.2, 6]} /><meshStandardMaterial color="#6e3e15" /></mesh>
      </group>

      {/* Pathways slabs connecting the checkpoints */}
      {/* Path 1: C1 [0,0.5,0] -> C2 [-5, 3, -32] */}
      <mesh receiveShadow position={[-2.5, 1.5, -16]} rotation={[-0.1, 0.07, 0]}>
        <boxGeometry args={[3, 0.4, 28]} />
        <meshStandardMaterial color="#4a5e37" roughness={0.9} />
      </mesh>
      {/* Checkpoint 2 platform */}
      <mesh receiveShadow position={[-5, 2.8, -32]}>
        <cylinderGeometry args={[5, 5.5, 0.4, 12]} />
        <meshStandardMaterial color="#3c502b" roughness={0.8} />
      </mesh>

      {/* Path 2: C2 -> C3 [5, 5.8, -64] */}
      <mesh receiveShadow position={[0, 4.4, -48]} rotation={[-0.09, -0.3, 0]}>
        <boxGeometry args={[3, 0.4, 30]} />
        <meshStandardMaterial color="#505a41" roughness={0.9} />
      </mesh>
      {/* Checkpoint 3 platform */}
      <mesh receiveShadow position={[5, 5.6, -64]}>
        <cylinderGeometry args={[5, 5.5, 0.4, 12]} />
        <meshStandardMaterial color="#5b6652" roughness={0.8} />
      </mesh>

      {/* Path 3: C3 -> C4 [-8, 8.8, -96] */}
      <mesh receiveShadow position={[-1.5, 7.3, -80]} rotation={[-0.1, 0.38, 0]}>
        <boxGeometry args={[3, 0.4, 32]} />
        <meshStandardMaterial color="#616c56" roughness={0.9} />
      </mesh>
      {/* Checkpoint 4 platform */}
      <mesh receiveShadow position={[-8, 8.6, -96]}>
        <cylinderGeometry args={[5, 5.5, 0.4, 12]} />
        <meshStandardMaterial color="#6a705a" roughness={0.8} />
      </mesh>

      {/* Path 4: C4 -> C5 [6, 12, -128] */}
      <mesh receiveShadow position={[-1, 10.3, -112]} rotation={[-0.1, -0.4, 0]}>
        <boxGeometry args={[3, 0.4, 30]} />
        <meshStandardMaterial color="#d1d7d7" roughness={0.9} />
      </mesh>
      {/* Checkpoint 5 platform */}
      <mesh receiveShadow position={[6, 11.8, -128]}>
        <cylinderGeometry args={[5, 5.5, 0.4, 12]} />
        <meshStandardMaterial color="#ecf0f1" roughness={0.4} />
      </mesh>

      {/* Path 5: C5 -> C6 [0, 15.5, -160] */}
      <mesh receiveShadow position={[3, 13.8, -144]} rotation={[-0.11, 0.35, 0]}>
        <boxGeometry args={[3, 0.4, 30]} />
        <meshStandardMaterial color="#eef3f3" roughness={0.4} />
      </mesh>
      {/* Checkpoint 6 platform (Summit Peak) */}
      <mesh receiveShadow position={[0, 15.3, -160]}>
        <cylinderGeometry args={[6, 6.5, 0.4, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>

      {/* Waving Summit flag */}
      <group position={[0, 15.5, -162.5]}>
        <mesh castShadow position={[0, 1.8, 0]}><cylinderGeometry args={[0.04, 0.04, 3.6, 6]} /><meshStandardMaterial color="#bdc3c7" /></mesh>
        <mesh position={[0.45, 3.1, 0]}><boxGeometry args={[0.9, 0.5, 0.02]} /><meshStandardMaterial color="#c0392b" /></mesh>
      </group>

      {/* Boundary walls to lock player to the path */}
      <mesh position={[-11, 7, -90]} visible={false}><boxGeometry args={[2, 22, 220]} /><meshStandardMaterial /></mesh>
      <mesh position={[11, 7, -90]} visible={false}><boxGeometry args={[2, 22, 220]} /><meshStandardMaterial /></mesh>
      <mesh position={[0, 10, 8]} visible={false}><boxGeometry args={[25, 20, 2]} /><meshStandardMaterial /></mesh>
      <mesh position={[0, 18, -170]} visible={false}><boxGeometry args={[25, 20, 2]} /><meshStandardMaterial /></mesh>

      {/* Pine Trees scattered around */}
      <PineTree position={[-4, 0.1, -5]} scale={1.2} />
      <PineTree position={[4.5, 0.1, -4]} scale={0.95} />
      <PineTree position={[4, 0.1, -8]} scale={1.3} />
      <PineTree position={[-4.5, 0.8, -12]} scale={1.1} />
      <PineTree position={[-1.5, 3.0, -31]} scale={0.8} />
      <PineTree position={[-8.5, 3.0, -33]} scale={1.3} />
      <PineTree position={[0, 6.0, -60]} scale={0.7} />
      <PineTree position={[9.5, 6.0, -62]} scale={1.1} />
    </RigidBody>
  );
}

// ------------------------------------------------------------------
// 3. MAIN EXPORT WRAPPER WITH ERROR BOUNDARY FALLBACK
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

      {/* Main environment rendering with loading fallback */}
      <ErrorBoundary fallback={<ProceduralEnvironment {...props} checkpoints={checkpoints} />}>
        <GLBEnvironment {...props} checkpoints={checkpoints} />
      </ErrorBoundary>
    </>
  );
}
