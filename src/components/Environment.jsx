import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Chimney Smoke Puffs
function ChimneySmoke({ position }) {
  const groupRef = useRef();
  const smokePuffs = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      speedY: 0.4 + Math.random() * 0.3,
      speedX: -0.1 + Math.random() * 0.2,
      delay: i * 0.6,
      scaleMax: 0.15 + Math.random() * 0.15
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((puff, idx) => {
      const config = smokePuffs[idx];
      const lifeTime = (time + config.delay) % 4.8;
      
      // Rise up
      puff.position.y = lifeTime * config.speedY;
      // Drift sideways in the wind
      puff.position.x = Math.sin(lifeTime * 2) * 0.12 + lifeTime * config.speedX;
      // scale up then fade down
      const progress = lifeTime / 4.8;
      puff.scale.setScalar(config.scaleMax * Math.sin(progress * Math.PI));
      puff.material.opacity = (1 - progress) * 0.7;
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

// Stylized Floating 3D Clouds in the Sky
function SkyClouds() {
  const cloudsRef = useRef();
  
  const cloudsData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      position: [
        -25 + Math.random() * 50,
        15 + Math.random() * 8,
        -10 - Math.random() * 120
      ],
      speed: 0.8 + Math.random() * 1.5,
      scale: 1.5 + Math.random() * 1.8
    }));
  }, []);

  useFrame((state, delta) => {
    cloudsRef.current.children.forEach((cloudGroup, idx) => {
      const data = cloudsData[idx];
      cloudGroup.position.x += delta * data.speed;
      
      // Reset position when cloud sails off-screen
      if (cloudGroup.position.x > 45) {
        cloudGroup.position.x = -45;
      }
    });
  });

  return (
    <group ref={cloudsRef}>
      {cloudsData.map((data) => (
        <group key={data.id} position={data.position} scale={data.scale}>
          {/* Overlapping spheres creating a fluffy cartoon cloud */}
          <mesh>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.9, 0, 0]} scale={0.85}>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.9, 0, 0]} scale={0.85}>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.6, 0]} scale={0.95}>
            <sphereGeometry args={[1.2, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Environment({ onCheckpointEnter, onCheckpointExit }) {
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

  // Enable Cartoon lighting and shadows for all loaded meshes
  useEffect(() => {
    const scenes = [terrainScene, cabinScene, campfireScene, natureScene, rocksScene, tentScene, backpackScene];
    scenes.forEach((scene) => {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Set soft, cartoonish materials
          if (child.material) {
            child.material.roughness = 0.85;
            child.material.metalness = 0.05;
            child.material.flatShading = true; // Low-poly cartoon aesthetic
          }
        }
      });
    });
  }, [terrainScene, cabinScene, campfireScene, natureScene, rocksScene, tentScene, backpackScene]);

  // Define checkpoint coordinates along the climbing path
  const checkpoints = useMemo(() => [
    { id: 1, name: 'Intro', pos: [0, 0.4, -2.5], size: [3.5, 3.5, 3.5] },
    { id: 2, name: 'Education', pos: [-5, 3.0, -32.0], size: [3.5, 3.5, 3.5] },
    { id: 3, name: 'Projects', pos: [5, 5.8, -64.0], size: [4.0, 3.5, 4.0] },
    { id: 4, name: 'Experience', pos: [-8, 8.8, -96.0], size: [4.0, 3.5, 4.0] },
    { id: 5, name: 'Skills', pos: [6, 12.0, -128.0], size: [3.5, 3.5, 3.5] },
    { id: 6, name: 'Contact', pos: [0, 15.5, -160.0], size: [4.5, 4.5, 4.5] }
  ], []);

  // Animating flames and sparks in useFrame
  const fireLightRef = useRef();
  const flameGroupRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Flicker campfire light
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 1.4 + Math.sin(time * 18) * 0.35 + Math.random() * 0.15;
    }

    // Wiggle cartoon flame shapes
    if (flameGroupRef.current) {
      flameGroupRef.current.children.forEach((flame, i) => {
        const bounce = 1.0 + Math.sin(time * 12 + i) * 0.12;
        flame.scale.set(bounce, bounce * 1.1, bounce);
      });
    }
  });

  return (
    <>
      {/* Wholesome bright-blue cartoon sky backdrop & warm horizon fog */}
      <color attach="background" color="#70d6ff" />
      <fog attach="fog" args={['#a2d2ff', 15, 45]} />

      {/* Ambient Cartoon Lighting */}
      <ambientLight intensity={0.75} color="#e3f2fd" />
      
      {/* Warm Sunlight */}
      <directionalLight
        castShadow
        position={[25, 20, -30]}
        intensity={1.8}
        color="#ffeedb"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={90}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Blue fill sky dome light */}
      <directionalLight
        position={[-20, 25, 20]}
        intensity={0.35}
        color="#90e0ef"
      />

      {/* Floating 3D Clouds */}
      <SkyClouds />

      {/* --- CHECKPOINT SENSOR BOUNDARIES --- */}
      {checkpoints.map((cp) => (
        <RigidBody key={cp.id} type="fixed" colliders={false} position={cp.pos}>
          <CuboidCollider
            args={cp.size.map(v => v / 2)}
            sensor
            onIntersectionEnter={() => onCheckpointEnter(cp.id)}
            onIntersectionExit={() => onCheckpointExit(cp.id)}
          />
        </RigidBody>
      ))}

      {/* --- SCENERY PHYSICS (RAPIER) --- */}
      <RigidBody type="fixed" colliders="trimesh" friction={1.2}>
        
        {/* Winding Terrain Landscape */}
        <primitive object={terrainScene} position={[0, 0, 0]} />

        {/* --- BASE CAMP DETAILS --- */}
        {/* Log Cabin */}
        <group position={[-5, 0, -5]} rotation={[0, 0.45, 0]}>
          <primitive object={cabinScene} scale={1.3} />
          {/* Cabin chimney smoke */}
          <ChimneySmoke position={[0.7, 2.2, -0.6]} />
          {/* Interior glow light shining from window */}
          <pointLight color="#ff9800" intensity={2} distance={6} position={[0, 0.9, 0.2]} />
        </group>

        {/* Campfire */}
        <group position={[0, 0.05, -2.5]}>
          <primitive object={campfireScene} scale={0.95} />
          
          {/* Glow Point Light */}
          <pointLight
            ref={fireLightRef}
            color="#ff5400"
            intensity={1.8}
            distance={6}
            position={[0, 0.3, 0]}
            castShadow
          />

          {/* Animated Cartoon Flame Cones */}
          <group ref={flameGroupRef} position={[0, 0.15, 0]}>
            <mesh>
              <coneGeometry args={[0.22, 0.55, 5]} />
              <meshBasicMaterial color="#ff4d00" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0.08, 0.05, 0.08]} scale={[0.7, 0.7, 0.7]}>
              <coneGeometry args={[0.22, 0.55, 5]} />
              <meshBasicMaterial color="#ffa200" transparent opacity={0.85} />
            </mesh>
            <mesh position={[-0.08, 0.08, -0.08]} scale={[0.65, 0.8, 0.65]}>
              <coneGeometry args={[0.22, 0.55, 5]} />
              <meshBasicMaterial color="#ffcc00" transparent opacity={0.9} />
            </mesh>
          </group>
        </group>

        {/* Backpack & Gear */}
        <primitive object={backpackScene} position={[1.2, 0.05, -2.4]} rotation={[0, -0.3, 0]} scale={1.1} />

        {/* Tent */}
        <primitive object={tentScene} position={[3.6, 0.05, -2.8]} rotation={[0, -0.4, 0]} scale={1.15} />

        {/* Nature assets (Trees & Foliage arranged at default map coordinates) */}
        <primitive object={natureScene} position={[0, 0, 0]} />
        
        {/* Scenery Rocks */}
        <primitive object={rocksScene} position={[0, 0, 0]} />

        {/* Entrance Gate ("Start Journey") */}
        <group position={[0, 0.05, -6.5]}>
          {/* Wooden arch left post */}
          <mesh castShadow position={[-1.6, 1.1, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 2.2, 6]} />
            <meshStandardMaterial color="#6e3e15" roughness={0.9} />
          </mesh>
          {/* Wooden arch right post */}
          <mesh castShadow position={[1.6, 1.1, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 2.2, 6]} />
            <meshStandardMaterial color="#6e3e15" roughness={0.9} />
          </mesh>
          {/* Crossbeam */}
          <mesh castShadow position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 3.4, 6]} />
            <meshStandardMaterial color="#6e3e15" roughness={0.9} />
          </mesh>
          {/* Sign board: "START JOURNEY" */}
          <mesh castShadow position={[0, 1.7, 0.08]}>
            <boxGeometry args={[1.6, 0.5, 0.08]} />
            <meshStandardMaterial color="#8e532b" roughness={0.9} />
          </mesh>
          {/* Lanterns hanging on the gate posts */}
          <group position={[-1.2, 1.8, 0.18]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 4]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, -0.15, 0]} castShadow>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshBasicMaterial color="#ffe57f" />
            </mesh>
            <pointLight color="#ffa000" intensity={0.6} distance={2.5} position={[0, -0.15, 0]} />
          </group>
          <group position={[1.2, 1.8, 0.18]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.15, 4]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, -0.15, 0]} castShadow>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshBasicMaterial color="#ffe57f" />
            </mesh>
            <pointLight color="#ffa000" intensity={0.6} distance={2.5} position={[0, -0.15, 0]} />
          </group>
        </group>

        {/* Boundary Colliders to lock player to the map trail */}
        <mesh position={[-11, 7, -90]} visible={false}>
          <boxGeometry args={[2, 22, 220]} />
          <meshStandardMaterial />
        </mesh>
        <mesh position={[11, 7, -90]} visible={false}>
          <boxGeometry args={[2, 22, 220]} />
          <meshStandardMaterial />
        </mesh>
        <mesh position={[0, 10, 8]} visible={false}>
          <boxGeometry args={[25, 20, 2]} />
          <meshStandardMaterial />
        </mesh>
        <mesh position={[0, 18, -170]} visible={false}>
          <boxGeometry args={[25, 20, 2]} />
          <meshStandardMaterial />
        </mesh>

      </RigidBody>
    </>
  );
}
