import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
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
import { playCinematicOpening } from './animations/gsap';

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
  const [isMuted, setIsMuted] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState([]);
  
  // High performance player position tracker
  const playerPosRef = useRef(new THREE.Vector3(0, 2, 0));

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
    // Initialize & start background procedural audio
    audioSystem.init();
    audioSystem.resume();
  };

  const handleToggleMute = () => {
    const muted = audioSystem.toggleMute();
    setIsMuted(muted);
  };

  // Ensure AudioContext resumes on user click if browsers block auto-audio
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

  return (
    <KeyboardControls map={keyboardMap}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        
        {/* 3D RENDERING CANVAS */}
        <div className="canvas-container">
          <Canvas
            shadows
            camera={{ position: [0, 6, 11], fov: 50 }}
          >
            <Physics gravity={[0, -14, 0]}>
              {/* Playable Character (WASD Controls) */}
              {gameStarted && (
                <Character onPositionChange={handlePositionChange} />
              )}

              {/* Terrain path, obstacles, scenery, checkpoints */}
              <Environment
                onCheckpointEnter={handleCheckpointEnter}
                onCheckpointExit={handleCheckpointExit}
              />

              {/* Follow Camera tracking player position */}
              {gameStarted && (
                <Camera playerPosRef={playerPosRef} />
              )}
            </Physics>
          </Canvas>
        </div>

        {/* 2D HUD / FRONTEND OVERLAYS */}
        <div className="ui-layer">
          
          {/* Landing / Welcome Screen */}
          {!gameStarted && (
            <div className="landing-banner">
              <h1>KANISHK SANDILYA</h1>
              <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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

          {/* Game HUD Panel */}
          {gameStarted && (
            <>
              {/* Top Left Title */}
              <div className="top-left-hud">
                <span className="hud-title">Kanishk Sandilya</span>
                <span className="hud-subtitle">DevOps Expedition</span>
              </div>

              {/* Top Right Buttons */}
              <div className="top-right-hud">
                <button className="hud-btn" onClick={handleToggleMute} title="Toggle Mute">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {/* Checkpoint Progress Checklist */}
              <div className="checkpoint-checklist">
                <div className="checkpoint-checklist-title">Map Checklist</div>
                
                <div className={`checklist-item ${activeCheckpoint === 1 ? 'active-item' : ''} ${visitedCheckpoints.includes(1) ? 'visited-item' : ''}`}>
                  <span className="chk-dot" />
                  <span>Base Camp (Intro)</span>
                </div>
                
                <div className={`checklist-item ${activeCheckpoint === 2 ? 'active-item' : ''} ${visitedCheckpoints.includes(2) ? 'visited-item' : ''}`}>
                  <span className="chk-dot" />
                  <span>Forest Trail (Edu)</span>
                </div>
                
                <div className={`checklist-item ${activeCheckpoint === 3 ? 'active-item' : ''} ${visitedCheckpoints.includes(3) ? 'visited-item' : ''}`}>
                  <span className="chk-dot" />
                  <span>River Crossing (Proj)</span>
                </div>
                
                <div className={`checklist-item ${activeCheckpoint === 4 ? 'active-item' : ''} ${visitedCheckpoints.includes(4) ? 'visited-item' : ''}`}>
                  <span className="chk-dot" />
                  <span>Mountain Village (Exp)</span>
                </div>
                
                <div className={`checklist-item ${activeCheckpoint === 5 ? 'active-item' : ''} ${visitedCheckpoints.includes(5) ? 'visited-item' : ''}`}>
                  <span className="chk-dot" />
                  <span>Snow Slope (Skills)</span>
                </div>
                
                <div className={`checklist-item ${activeCheckpoint === 6 ? 'active-item' : ''} ${visitedCheckpoints.includes(6) ? 'visited-item' : ''}`}>
                  <span className="chk-dot" />
                  <span>The Peak (Contact)</span>
                </div>
              </div>

              {/* Controls Help (Bottom Left) */}
              <div className="controls-hud">
                <div className="control-row">
                  <span>Move</span>
                  <span>
                    <span className="control-key">W</span>
                    <span className="control-key">A</span>
                    <span className="control-key">S</span>
                    <span className="control-key">D</span>
                    or <span className="control-key">↑↓←→</span>
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
                <div className="control-row">
                  <span>Look</span>
                  <span>Move Mouse</span>
                </div>
              </div>
            </>
          )}

          {/* RESUME CARD OVERLAYS */}
          {gameStarted && (
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
