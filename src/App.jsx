import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, useProgress } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Volume2, VolumeX, ShieldAlert, Award, Play } from 'lucide-react';
import * as THREE from 'three';

// 3D Components
import Character from './components/Character';
import Camera from './components/Camera';
import Environment from './components/Environment';

// 2D Section Overlays
import Intro from './sections/Intro';
import Education from './sections/Education';
import Projects from './sections/Projects';
import Experience from './sections/Experience';
import Skills from './sections/Skills';
import Contact from './sections/Contact';

// Audio and GSAP
import audioSystem from './utils/audio';

// Keyboard controls map
const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'shift', keys: ['ShiftLeft', 'ShiftRight'] }
];

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState([]);
  const [teleportTarget, setTeleportTarget] = useState(null);
  const [dismissLoader, setDismissLoader] = useState(false);

  const { active, progress } = useProgress();
  
  // High performance player position tracker
  const playerPosRef = useRef(new THREE.Vector3(0, 1.2, 0));

  const handlePositionChange = (position) => {
    playerPosRef.current.set(position.x, position.y, position.z);
  };

  const handleCheckpointEnter = (id) => {
    setActiveCheckpoint(id);
    setVisitedCheckpoints((prev) => 
      prev.includes(id) ? prev : [...prev, id]
    );
  };

  const handleCheckpointExit = (id) => {
    setActiveCheckpoint((current) => (current === id ? null : current));
  };

  const handleStartJourney = () => {
    setGameStarted(true);
    // Initialize & start background procedural audio with safety catches
    try {
      audioSystem.init();
      audioSystem.resume();
    } catch (err) {
      console.warn("Procedural audio initialization bypassed or failed:", err);
    }
  };

  const handleToggleMute = () => {
    const muted = audioSystem.toggleMute();
    setIsMuted(muted);
  };

  // Checkpoint coordinate points mapping (wooden board teleportation targets)
  const menuCheckpoints = [
    { id: 1, label: 'Introduction', pos: [0, 0.4, -2.5] },
    { id: 2, label: 'Education', pos: [-5, 3.0, -32.0] },
    { id: 3, label: 'Projects', pos: [5, 5.8, -64.0] },
    { id: 4, label: 'Experience', pos: [-8, 8.8, -96.0] },
    { id: 5, label: 'Skills', pos: [6, 12.0, -128.0] },
    { id: 6, label: 'Contact', pos: [0, 15.5, -160.0] }
  ];

  const handleTeleport = (pos) => {
    setTeleportTarget(new THREE.Vector3(...pos));
  };

  // Delayed dismissal of loader for smoother exit
  useEffect(() => {
    if (!active && progress === 100) {
      const t = setTimeout(() => {
        setDismissLoader(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  // Ensure AudioContext resumes on click
  useEffect(() => {
    const handleGesture = () => {
      if (gameStarted) {
        audioSystem.resume();
      }
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [gameStarted]);

  // Loading text script cycling
  const loadingStatusText = () => {
    if (progress < 25) return 'Packing the gear...';
    if (progress < 55) return 'Preparing the trail...';
    if (progress < 85) return 'Setting up base camp...';
    return 'Lacing up boots...';
  };

  return (
    <KeyboardControls map={keyboardMap}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        
        {/* ==================================================
           1. ANIMATED CARTOON LOADING SCREEN
           ================================================== */}
        {!dismissLoader && (
          <div className="loading-screen" style={{ opacity: (!active && progress === 100) ? 0 : 1 }}>
            
            {/* Fluffy moving clouds */}
            <div className="cloud-container">
              <div className="cartoon-cloud cloud-1" />
              <div className="cartoon-cloud cloud-2" />
              <div className="cartoon-cloud cloud-3" />
              <div className="cartoon-cloud cloud-4" />
            </div>

            {/* Flying birds */}
            <div className="birds-container">
              <div className="bird b1" />
              <div className="bird b2" />
              <div className="bird b3" />
            </div>

            {/* Drifting Leaf Particles */}
            <div className="particles-container">
              <div className="leaf-particle l1" />
              <div className="leaf-particle l2" />
              <div className="leaf-particle l3" />
              <div className="leaf-particle l4" />
              <div className="leaf-particle l5" />
            </div>

            {/* Rising Campfire Sparks */}
            <div className="particles-container">
              <div className="spark-particle s1" />
              <div className="spark-particle s2" />
              <div className="spark-particle s3" />
              <div className="spark-particle s4" />
            </div>

            {/* Center Loading Info */}
            <div className="loading-panel">
              <h1 className="loading-title">TREKKING THROUGH MY JOURNEY</h1>
              <div className="loading-subtitle">{loadingStatusText()}</div>
              
              {/* Rope Trail Progress Bar */}
              <div className="trail-progress-container">
                <div className="trail-progress-bar" style={{ width: `${progress}%` }} />
                <div className="trail-hiker-icon" style={{ left: `${progress}%` }}>
                  🧭
                </div>
              </div>
            </div>

            {/* Background Mountain Silhouette */}
            <div className="mountain-silhouette" />
          </div>
        )}

        {/* ==================================================
           2. 3D RENDERING CANVAS
           ================================================== */}
        <div className="canvas-container">
          <Canvas
            shadows
            camera={{ position: [8, 16, 22], fov: 50 }}
          >
            <Suspense fallback={null}>
              <Physics gravity={[0, -14, 0]}>
                {/* Playable Character (WASD Controls) */}
                {gameStarted && (
                  <Character 
                    onPositionChange={handlePositionChange} 
                    teleportTarget={teleportTarget}
                    clearTeleport={() => setTeleportTarget(null)}
                  />
                )}

                {/* Environment (GLB models loader & sensor trigger checkpoints) */}
                <Environment
                  onCheckpointEnter={handleCheckpointEnter}
                  onCheckpointExit={handleCheckpointExit}
                />

                {/* Follow Camera (intro panning -> 3rd person game follow) */}
                {gameStarted && (
                  <Camera 
                    playerPosRef={playerPosRef} 
                    onIntroComplete={() => setIntroCompleted(true)}
                  />
                )}
              </Physics>
            </Suspense>
          </Canvas>
        </div>

        {/* ==================================================
           3. 2D HUD / CONTROLS INTERFACES
           ================================================== */}
        <div className="ui-layer">
          
          {/* Landing Banner */}
          {dismissLoader && !gameStarted && (
            <div className="landing-banner">
              <h1>KANISHK SANDILYA</h1>
              <p style={{ color: 'var(--accent-gold)', fontWeight: '700', fontSize: '0.95rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                DevOps & Cloud Engineer
              </p>
              <p>
                Embark on an interactive 3D trekking journey to explore my automated CI/CD pipelines, AWS cloud infrastructure, technical skillsets, and creative projects!
              </p>
              <button className="start-btn" onClick={handleStartJourney}>
                Start Journey
              </button>
            </div>
          )}

          {/* Game HUD Panel (only visible after cinematic opening completes) */}
          {gameStarted && introCompleted && (
            <>
              {/* Top Left Profile info */}
              <div className="profile-hud">
                <div className="profile-avatar-container">
                  <span style={{ fontSize: '20px' }}>🏕️</span>
                </div>
                <div className="profile-details">
                  <span className="profile-greeting">Hello, I'm</span>
                  <span className="profile-name">KANISHK</span>
                  <span className="profile-role">Developer | AI Enthusiast | Explorer</span>
                </div>
              </div>

              {/* Top Right volume control */}
              <div className="top-right-hud">
                <button className="hud-btn" onClick={handleToggleMute} title="Toggle Mute">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {/* Left Wooden Sign Board Menu */}
              <div className="adventure-menu-board">
                <div className="board-header">Your Adventure</div>
                {menuCheckpoints.map((cp) => (
                  <button
                    key={cp.id}
                    className={`adventure-item-btn ${activeCheckpoint === cp.id ? 'active-checkpoint-btn' : ''} ${visitedCheckpoints.includes(cp.id) ? 'visited-checkpoint-btn' : ''}`}
                    onClick={() => handleTeleport(cp.pos)}
                  >
                    <span className="btn-indicator" />
                    <span>{cp.label}</span>
                  </button>
                ))}
              </div>

              {/* Bottom Left WASD Controls Guide */}
              <div className="controls-hud-cozy">
                <div className="control-row">
                  <span>Move</span>
                  <span>
                    <span className="control-key">W</span>
                    <span className="control-key">A</span>
                    <span className="control-key">S</span>
                    <span className="control-key">D</span>
                  </span>
                </div>
                <div className="control-row">
                  <span>Sprint</span>
                  <span><span className="control-key">Shift</span></span>
                </div>
                <div className="control-row">
                  <span>Jump</span>
                  <span><span className="control-key">Space</span></span>
                </div>
              </div>

              {/* Bottom Center Scroll Mouse Tip */}
              <div className="scroll-helper-hud">
                <span className="scroll-mouse-icon">🖱️</span>
                <span>Move Mouse to Look Around</span>
              </div>

              {/* Bottom Right Quote Signpost */}
              <div className="hud-signpost-board">
                <span className="hud-signpost-text">
                  "Every step leads to a new chapter."
                </span>
              </div>
            </>
          )}

          {/* ==================================================
             4. CHECKPOINT OVERLAY CARD WIDGETS
             ================================================== */}
          {gameStarted && introCompleted && (
            <>
              <Intro active={activeCheckpoint === 1} />
              <Education active={activeCheckpoint === 2} />
              <Projects active={activeCheckpoint === 3} />
              <Experience active={activeCheckpoint === 4} />
              <Skills active={activeCheckpoint === 5} />
              <Contact active={activeCheckpoint === 6} />
            </>
          )}

        </div>
      </div>
    </KeyboardControls>
  );
}
