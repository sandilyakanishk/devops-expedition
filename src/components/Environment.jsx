import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// Low-poly Pine Tree Component
function PineTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.8, 5]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      {/* Leaves - stacked cones */}
      <mesh castShadow position={[0, 1.1, 0]}>
        <coneGeometry args={[0.6, 1.0, 5]} />
        <meshStandardMaterial color="#223e15" roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[0, 1.7, 0]}>
        <coneGeometry args={[0.45, 0.8, 5]} />
        <meshStandardMaterial color="#2d521b" roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.2, 0]}>
        <coneGeometry args={[0.3, 0.6, 5]} />
        <meshStandardMaterial color="#376522" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// Low-poly Snow-capped Mountain
function Mountain({ position, scale = [1, 1, 1], rotation = [0, 0, 0] }) {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* Mountain Base */}
      <mesh castShadow receiveShadow flatShading>
        <coneGeometry args={[12, 18, 5]} />
        <meshStandardMaterial color="#4a535c" roughness={0.9} flatShading />
      </mesh>
      {/* Snow Peak */}
      <mesh position={[0, 4.5, 0]} scale={[0.5, 0.5, 0.5]} flatShading>
        <coneGeometry args={[12.1, 18, 5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
      </mesh>
    </group>
  );
}

// Campfire Component
function Campfire({ position }) {
  const lightRef = useRef();
  const flameRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Flicker intensity
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(time * 15) * 0.4 + Math.random() * 0.2;
    }
    // Wiggle flames
    if (flameRef.current) {
      flameRef.current.scale.y = 1.0 + Math.sin(time * 12) * 0.15;
      flameRef.current.scale.x = 1.0 + Math.cos(time * 8) * 0.08;
      flameRef.current.scale.z = 1.0 + Math.sin(time * 10) * 0.08;
    }
  });

  return (
    <group position={position}>
      {/* Firewood logs */}
      <mesh rotation={[0.3, 0.4, 1.2]} castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 5]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh rotation={[0.3, -0.9, -1.1]} castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 5]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh rotation={[-0.9, 0.2, 0.5]} castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 5]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>

      {/* Stones ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.45, 0.05, Math.sin(angle) * 0.45]}
            scale={[0.1, 0.08, 0.1]}
            castShadow
          >
            <sphereGeometry args={[1, 5, 5]} />
            <meshStandardMaterial color="#7f8c8d" roughness={0.8} />
          </mesh>
        );
      })}

      {/* Glow Point Light */}
      <pointLight
        ref={lightRef}
        color="#ff7a00"
        intensity={2}
        distance={7}
        position={[0, 0.4, 0]}
        castShadow
      />

      {/* Flame Mesh (semi-transparent glowing cone) */}
      <mesh ref={flameRef} position={[0, 0.25, 0]}>
        <coneGeometry args={[0.25, 0.6, 6]} />
        <meshBasicMaterial color="#ff5a00" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.35, 0]} scale={[0.6, 0.7, 0.6]}>
        <coneGeometry args={[0.25, 0.6, 6]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Log Cabin Component
function Cabin({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Log walls */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[1.5, 1.2, 1.2]} />
        <meshStandardMaterial color="#795548" roughness={0.9} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.2, 1.2, 1.4]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.7} />
      </mesh>
      {/* Door */}
      <mesh position={[0.4, 0.4, 0.61]}>
        <boxGeometry args={[0.3, 0.8, 0.02]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Window */}
      <mesh position={[-0.4, 0.6, 0.61]}>
        <boxGeometry args={[0.3, 0.3, 0.02]} />
        <meshStandardMaterial color="#ffe082" emissive="#ffb300" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

export default function Environment({ onCheckpointEnter, onCheckpointExit }) {
  // Checkpoint coordinate definitions
  const checkpoints = useMemo(() => [
    { id: 1, name: 'Intro', pos: [0, 0.5, 0], size: [3, 3, 3] },
    { id: 2, name: 'Education', pos: [-5, 3.5, -35], size: [3, 3, 3] },
    { id: 3, name: 'Projects', pos: [5, 6.5, -75], size: [3.5, 3, 3.5] },
    { id: 4, name: 'Experience', pos: [-8, 9.5, -115], size: [3.5, 3, 3.5] },
    { id: 5, name: 'Skills', pos: [6, 13.5, -155], size: [3, 3, 3] },
    { id: 6, name: 'Contact', pos: [0, 17.5, -195], size: [4, 4, 4] }
  ], []);

  // Snow Particle System (useFrame animates them)
  const snowPointsRef = useRef();
  const snowPositions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 300; i++) {
      arr.push(
        (Math.random() - 0.5) * 40, // x
        Math.random() * 25 + 5,      // y
        -130 - Math.random() * 85  // z (focus snow on high terrain checkpoints 4, 5, 6)
      );
    }
    return new Float32Array(arr);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    // Rotate stars slightly
    // Slowly fall snow particles
    if (snowPointsRef.current) {
      const positions = snowPointsRef.current.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.05; // speed of fall
        if (positions[i] < 5) {
          positions[i] = 25; // Reset back to top
        }
        // Add slight drift
        positions[i - 1] += Math.sin(time + i) * 0.01;
      }
      snowPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Sky backdrop color and warm cinematic fog */}
      <color attach="background" color="#111625" />
      <fog attach="fog" args={['#111625', 12, 38]} />

      {/* Atmospheric lighting */}
      <ambientLight intensity={0.4} color="#7fa3db" />
      
      {/* Sunrise Directional Light */}
      <directionalLight
        castShadow
        position={[25, 12, -45]}
        intensity={1.8}
        color="#ffa64d" // Golden sunrise
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={100}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />

      {/* Soft fill sky light */}
      <directionalLight
        position={[-15, 20, 10]}
        intensity={0.4}
        color="#a2c8ec"
      />

      {/* Stars in the distance */}
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0.5} fade speed={1} />

      {/* --- RAPIER PHYSICS SCENERY --- */}

      {/* Checkpoint Sensor Colliders */}
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

      {/* Ground Physics & Models */}
      <RigidBody type="fixed" colliders="trimesh" friction={1.2}>
        
        {/* Checkpoint 1: Base Camp Platform (y = 0) */}
        <mesh receiveShadow position={[0, -0.2, 0]}>
          <cylinderGeometry args={[6, 6.5, 0.4, 16]} />
          <meshStandardMaterial color="#405030" roughness={0.8} /> {/* Dark Green Forest Ground */}
        </mesh>
        {/* Tent */}
        <group position={[2.5, 0, -1.8]} rotation={[0, -0.4, 0]}>
          {/* Main Tent Body (prism) */}
          <mesh castShadow position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.9, 0.9, 1.4]} />
            <meshStandardMaterial color="#2980b9" roughness={0.7} /> {/* Blue tent */}
          </mesh>
          {/* Groundsheet */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[1.2, 0.02, 1.5]} />
            <meshStandardMaterial color="#1a5276" />
          </mesh>
        </group>
        {/* Campfire at Base Camp */}
        <Campfire position={[0, 0, -2.5]} />
        {/* Entrance Gate */}
        <group position={[0, 0, -5.5]}>
          {/* Left post */}
          <mesh castShadow position={[-1.5, 1.0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.0, 6]} />
            <meshStandardMaterial color="#8d6e63" />
          </mesh>
          {/* Right post */}
          <mesh castShadow position={[1.5, 1.0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.0, 6]} />
            <meshStandardMaterial color="#8d6e63" />
          </mesh>
          {/* Arch post */}
          <mesh castShadow position={[0, 2.0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 3.2, 6]} />
            <meshStandardMaterial color="#8d6e63" />
          </mesh>
          {/* Hanging Sign board */}
          <mesh castShadow position={[0, 1.6, 0]}>
            <boxGeometry args={[1.2, 0.4, 0.06]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
        </group>


        {/* Path Ramp 1: Connecting C1 (Base Camp) to C2 (Forest Trail) */}
        {/* Base Camp: [0, 0, 0] -> Forest Trail: [-5, 3.5, -35] */}
        <mesh receiveShadow position={[-2.5, 1.5, -17.5]} rotation={[-0.1, 0.07, 0]}>
          <boxGeometry args={[3, 0.4, 30]} />
          <meshStandardMaterial color="#4a5e37" roughness={0.9} />
        </mesh>


        {/* Checkpoint 2: Forest Trail Platform (y = 3.5) */}
        <mesh receiveShadow position={[-5, 3.3, -35]}>
          <cylinderGeometry args={[5, 5.5, 0.4, 12]} />
          <meshStandardMaterial color="#3c502b" roughness={0.8} />
        </mesh>
        {/* Checkpoint 2 Signpost */}
        <group position={[-5, 3.5, -32.5]} rotation={[0, 0.3, 0]}>
          <mesh castShadow position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
          <mesh castShadow position={[0, 1.2, 0]}>
            <boxGeometry args={[0.7, 0.35, 0.05]} />
            <meshStandardMaterial color="#795548" />
          </mesh>
        </group>


        {/* Path Ramp 2: Connecting C2 (Forest Trail) to C3 (River Crossing) */}
        {/* Forest Trail: [-5, 3.5, -35] -> River Crossing: [5, 6.5, -75] */}
        <mesh receiveShadow position={[0, 4.8, -55]} rotation={[-0.075, -0.24, 0]}>
          <boxGeometry args={[3, 0.4, 38]} />
          <meshStandardMaterial color="#505a41" roughness={0.9} />
        </mesh>


        {/* Checkpoint 3: River Crossing Platform (y = 6.5) */}
        {/* A river trench runs between z = -71 and z = -79. A bridge spans across it. */}
        {/* Platform Left (south bank) */}
        <mesh receiveShadow position={[5, 6.3, -71.5]}>
          <boxGeometry args={[5, 0.4, 4]} />
          <meshStandardMaterial color="#505c48" roughness={0.8} />
        </mesh>
        {/* Platform Right (north bank) */}
        <mesh receiveShadow position={[5, 6.3, -78.5]}>
          <boxGeometry args={[5, 0.4, 4]} />
          <meshStandardMaterial color="#5b6652" roughness={0.8} />
        </mesh>
        {/* River (animated water) */}
        <mesh position={[5, 6.0, -75]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14, 5.5]} />
          <meshStandardMaterial
            color="#2980b9"
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Wooden Bridge Planks */}
        <group position={[5, 6.5, -75]}>
          {/* Left log support */}
          <mesh castShadow position={[-0.8, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 7.5, 6]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          {/* Right log support */}
          <mesh castShadow position={[0.8, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 7.5, 6]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          {/* Individual planks */}
          {Array.from({ length: 11 }).map((_, idx) => {
            const zPos = (idx - 5) * 0.65;
            return (
              <mesh key={idx} castShadow position={[0, 0.06, zPos]}>
                <boxGeometry args={[1.8, 0.06, 0.45]} />
                <meshStandardMaterial color="#5d4037" roughness={0.8} />
              </mesh>
            );
          })}
        </group>


        {/* Path Ramp 3: Connecting C3 (River Crossing) to C4 (Mountain Village) */}
        {/* River Crossing: [5, 6.5, -75] -> Mountain Village: [-8, 9.5, -115] */}
        <mesh receiveShadow position={[-1.5, 7.8, -95]} rotation={[-0.075, 0.3, 0]}>
          <boxGeometry args={[3, 0.4, 38]} />
          <meshStandardMaterial color="#616c56" roughness={0.9} />
        </mesh>


        {/* Checkpoint 4: Mountain Village (y = 9.5) */}
        <mesh receiveShadow position={[-8, 9.3, -115]}>
          <cylinderGeometry args={[6, 6.5, 0.4, 12]} />
          <meshStandardMaterial color="#6a705a" roughness={0.8} />
        </mesh>
        {/* Tiny Log Cabins in the village */}
        <Cabin position={[-11, 9.5, -117.5]} rotation={[0, 0.4, 0]} />
        <Cabin position={[-5, 9.5, -118]} rotation={[0, -0.6, 0]} />
        {/* Lantern on pole */}
        <group position={[-8, 9.5, -112.5]}>
          <mesh castShadow position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh castShadow position={[0, 1.8, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 1.6, 0.3]} castShadow>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ffe082" emissive="#ff9800" emissiveIntensity={3} />
          </mesh>
          <pointLight color="#ffaa00" intensity={1.5} distance={5} position={[0, 1.6, 0.3]} />
        </group>


        {/* Path Ramp 4: Connecting C4 (Mountain Village) to C5 (Snow Slope) */}
        {/* Mountain Village: [-8, 9.5, -115] -> Snow Slope: [6, 13.5, -155] */}
        {/* Ground turns greyish white as we approach snow height */}
        <mesh receiveShadow position={[-1, 11.3, -135]} rotation={[-0.1, -0.32, 0]}>
          <boxGeometry args={[3, 0.4, 38]} />
          <meshStandardMaterial color="#d5dbdb" roughness={0.9} /> {/* Snowy path */}
        </mesh>


        {/* Checkpoint 5: Snow Slope (y = 13.5) */}
        <mesh receiveShadow position={[6, 13.3, -155]}>
          <cylinderGeometry args={[5, 5.5, 0.4, 12]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.4} /> {/* Pure Snow */}
        </mesh>
        {/* Glowing Skill Crystals / Pyramids */}
        <group position={[6, 13.5, -157.5]}>
          {/* React Crystal */}
          <mesh position={[-1.2, 0.4, 0]} rotation={[0.4, 0.8, 0.2]}>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial color="#00d8ff" emissive="#00bcd4" emissiveIntensity={1} roughness={0.1} />
          </mesh>
          {/* Python Crystal */}
          <mesh position={[0, 0.55, -0.8]} rotation={[0.2, -0.4, 0.5]}>
            <octahedronGeometry args={[0.35]} />
            <meshStandardMaterial color="#ffd43b" emissive="#ffa100" emissiveIntensity={1} roughness={0.1} />
          </mesh>
          {/* JS Crystal */}
          <mesh position={[1.2, 0.4, 0]} rotation={[0.5, 0.1, -0.3]}>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial color="#f7df1e" emissive="#e5a823" emissiveIntensity={1} roughness={0.1} />
          </mesh>
        </group>


        {/* Path Ramp 5: Connecting C5 (Snow Slope) to C6 (Summit Peak) */}
        {/* Snow Slope: [6, 13.5, -155] -> Summit Peak: [0, 17.5, -195] */}
        <mesh receiveShadow position={[3, 15.3, -175]} rotation={[-0.1, 0.15, 0]}>
          <boxGeometry args={[3, 0.4, 38]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.4} />
        </mesh>


        {/* Checkpoint 6: Summit Peak (y = 17.5) */}
        <mesh receiveShadow position={[0, 17.3, -195]}>
          <cylinderGeometry args={[6, 6.8, 0.4, 16]} />
          <meshStandardMaterial color="#faffff" roughness={0.3} />
        </mesh>
        {/* Summit Flagpole */}
        <group position={[0, 17.5, -197.5]}>
          {/* Metal pole */}
          <mesh castShadow position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 3.6, 8]} />
            <meshStandardMaterial color="#bdc3c7" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Flag (triangular red mesh) */}
          <mesh position={[0.45, 3.1, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.9, 0.5, 0.02]} />
            <meshStandardMaterial color="#c0392b" roughness={0.7} />
          </mesh>
          {/* Glowing Beacon of Light to the sky */}
          <mesh position={[0, 10, 0]}>
            <cylinderGeometry args={[0.15, 0.4, 20, 8, 1, true]} />
            <meshBasicMaterial color="#3498db" transparent opacity={0.35} depthWrite={false} />
          </mesh>
          <pointLight color="#3498db" intensity={2} distance={15} position={[0, 2.5, 0]} />
        </group>
        {/* Campfire at Summit */}
        <Campfire position={[2, 17.5, -193]} />

        {/* Boundary Colliders (Giant invisible/dark rocks surrounding the pathway to keep player on track) */}
        {/* Left Boundary Wall */}
        <mesh receiveShadow position={[-9, 8, -100]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[2, 25, 230]} />
          <meshStandardMaterial color="#1f232b" roughness={0.9} />
        </mesh>
        {/* Right Boundary Wall */}
        <mesh receiveShadow position={[9, 8, -100]} rotation={[0, -0.15, 0]}>
          <boxGeometry args={[2, 25, 230]} />
          <meshStandardMaterial color="#1f232b" roughness={0.9} />
        </mesh>
        {/* Back Wall at Start */}
        <mesh receiveShadow position={[0, 5, 7]}>
          <boxGeometry args={[20, 15, 2]} />
          <meshStandardMaterial color="#1a202c" roughness={0.9} />
        </mesh>
        {/* Back Wall at Summit */}
        <mesh receiveShadow position={[0, 22, -205]}>
          <boxGeometry args={[20, 18, 2]} />
          <meshStandardMaterial color="#ecf0f1" roughness={0.9} />
        </mesh>

      </RigidBody>

      {/* --- SCENIC BG HILLS & FOREST DECORATION (No Physics) --- */}
      <group>
        {/* Pine Trees scattered along the forest zone (z: 0 to -80) */}
        <PineTree position={[-4, 0.1, -5]} scale={1.2} />
        <PineTree position={[4.5, 0.1, -4]} scale={0.95} />
        <PineTree position={[4, 0.1, -8]} scale={1.3} />
        <PineTree position={[-4.5, 0.8, -12]} scale={1.1} />
        <PineTree position={[-5, 1.2, -18]} scale={1.25} />
        <PineTree position={[5.5, 2.2, -26]} scale={1.0} />
        
        {/* Trees near forest trail C2 */}
        <PineTree position={[-1.5, 3.5, -34]} scale={0.8} />
        <PineTree position={[-8.5, 3.5, -36]} scale={1.3} />
        <PineTree position={[-9.5, 4.2, -31]} scale={1.4} />
        <PineTree position={[-8, 4.0, -42]} scale={1.2} />
        <PineTree position={[0.5, 3.8, -44]} scale={0.9} />

        {/* Trees near river C3 */}
        <PineTree position={[0, 6.5, -70]} scale={0.7} />
        <PineTree position={[1.5, 6.5, -81]} scale={0.8} />
        <PineTree position={[9.5, 6.5, -72]} scale={1.1} />
        <PineTree position={[10, 6.5, -80]} scale={1.25} />

        {/* Trees near village C4 */}
        <PineTree position={[-13.5, 9.5, -114]} scale={1.3} />
        <PineTree position={[-13, 9.5, -121]} scale={1.4} />
        <PineTree position={[-2.5, 9.5, -120]} scale={0.95} />
        <PineTree position={[-3, 9.5, -110]} scale={0.75} />

        {/* Giant framing mountains */}
        {/* Base camp mountains */}
        <Mountain position={[-18, 5, -10]} scale={[1.4, 1.6, 1.4]} />
        <Mountain position={[18, 4, -12]} scale={[1.3, 1.4, 1.3]} rotation={[0, 0.4, 0]} />
        
        {/* Middle valley mountains */}
        <Mountain position={[-20, 10, -65]} scale={[1.5, 1.8, 1.5]} rotation={[0, -0.2, 0]} />
        <Mountain position={[21, 9, -70]} scale={[1.4, 1.7, 1.4]} rotation={[0, 0.3, 0]} />

        {/* High peaks surrounding snow zone */}
        <Mountain position={[-18, 14, -145]} scale={[1.6, 2.0, 1.6]} />
        <Mountain position={[18, 15, -150]} scale={[1.5, 2.2, 1.5]} rotation={[0, 0.5, 0]} />

        {/* Summit backdrop */}
        <Mountain position={[-10, 19, -210]} scale={[1.8, 2.4, 1.8]} />
        <Mountain position={[10, 18, -212]} scale={[1.7, 2.3, 1.7]} />
      </group>

      {/* Snow falling points near summit */}
      <points ref={snowPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[snowPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.16}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </>
  );
}
