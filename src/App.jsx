import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, useProgress } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Volume2, VolumeX, Github, FileText, ThumbsUp, ThumbsDown, MessageSquare, Share2 } from 'lucide-react';
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

// Audio
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
    // Initialize & start background procedural audio
    try {
      audioSystem.init();
      audioSystem.resume();
    } catch (err) {
      console.warn("Procedural audio bypassed:", err);
    }
  };

  const handleToggleMute = () => {
    const muted = audioSystem.toggleMute();
    setIsMuted(muted);
  };

  // Checkpoint coordinates for navigation board and navbar links
  const menuCheckpoints = [
    { id: 1, label: 'Introduction', pos: [0, 0.4, -2.5] },
    { id: 2, label: 'Education', pos: [-5, 3.0, -32.0] },
    { id: 3, label: 'Projects', pos: [5, 5.8, -64.0] },
    { id: 4, label: 'Experience', pos: [-8, 8.8, -96.0] },
    { id: 5, label: 'Skills', pos: [6, 12.0, -128.0] },
    { id: 6, label: 'Contact', pos: [0, 15.5, -160.0] }
  ];

  const handleTeleport = (pos) => {
    // If game has not started, start it first
    if (!gameStarted) {
      handleStartJourney();
    }
    setTeleportTarget(new THREE.Vector3(...pos));
  };

  // Delayed dismissal of loader for smoother exit
  useEffect(() => {
    if (!active && progress === 100) {
      const t = setTimeout(() => {
        setDismissLoader(true);
      }, 1000);
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

  return (
    <KeyboardControls map={keyboardMap}>
      {/* 
        Container background is a warm bright nature gradient sky:
        Deep sky blue -> Soft pastel blue -> Warm peach sunset orange
      */}
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'relative', 
        background: 'linear-gradient(to bottom, #38bdf8 0%, #bae6fd 60%, #ffedd5 100%)',
        overflow: 'hidden'
      }}>
        
        {/* ==================================================
           1. MODERN HEADER NAVBAR (ALWAYS VISIBLE AFTER LOADER)
           ================================================== */}
        {dismissLoader && (
          <header className="app-navbar">
            <div className="navbar-logo" onClick={() => handleTeleport([0, 0.4, -2.5])}>
              KS
            </div>
            <div className="navbar-email">
              sandilyakanishk@gmail.com
            </div>
            <nav>
              <ul className="navbar-links">
                <li>
                  <span className="navbar-link-item" onClick={() => handleTeleport([0, 0.4, -2.5])}>
                    About
                  </span>
                </li>
                <li>
                  <span className="navbar-link-item" onClick={() => handleTeleport([5, 5.8, -64.0])}>
                    Work
                  </span>
                </li>
                <li>
                  <span className="navbar-link-item" onClick={() => handleTeleport([0, 15.5, -160.0])}>
                    Contact
                  </span>
                </li>
              </ul>
            </nav>
          </header>
        )}

        {/* ==================================================
           2. COZY ANIMATED ADVENTURE LOADING SCREEN
           ================================================== */}
        {!dismissLoader && (
          <div className="adventure-loading-screen" style={{ opacity: (!active && progress === 100) ? 0 : 1 }}>
            {/* Moving Fluffy Cartoon Clouds */}
            <div className="loading-cloud cloud-1">☁️</div>
            <div className="loading-cloud cloud-2">☁️</div>
            <div className="loading-cloud cloud-3">☁️</div>

            {/* Flying Birds */}
            <div className="loading-bird bird-1">🦅</div>
            <div className="loading-bird bird-2">🦅</div>

            {/* Falling Leaves */}
            <div className="loading-leaf leaf-1">🍃</div>
            <div className="loading-leaf leaf-2">🍁</div>
            <div className="loading-leaf leaf-3">🍃</div>
            
            {/* Spark particles */}
            <div className="loading-spark spark-1">✨</div>
            <div className="loading-spark spark-2">✨</div>

            {/* Mountain silhouette at bottom */}
            <div className="loading-mountain-silhouette" />

            {/* Centered Typography & Progress Path */}
            <div className="loading-center-content">
              <h1 className="loading-title">TREKKING THROUGH MY JOURNEY</h1>
              
              <div className="loading-trail-progress">
                <div className="loading-trail-bar" style={{ width: `${Math.round(progress)}%` }} />
                <span className="loading-trail-runner" style={{ left: `${Math.round(progress)}%` }}>🏃</span>
              </div>
              
              <p className="loading-subtitle">
                Loading Adventure... {Math.round(progress)}%
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
           3. 3D RENDERING CANVAS (TRANSPARENT TO SHOW BACKGROUND GRADIENT)
           ================================================== */}
        <div className="canvas-container">
          <Canvas
            shadows
            camera={{ position: [8, 16, 22], fov: 50 }}
            gl={{ alpha: true, antialias: true }}
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

                {/* Environment (100% procedural landscape and lighting) */}
                <Environment
                  onCheckpointEnter={handleCheckpointEnter}
                  onCheckpointExit={handleCheckpointExit}
                />

                {/* Follow Camera (intro panning -> 3rd person follow) */}
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
           4. 2D HUD / CONTROLS WIDGETS
           ================================================== */}
        <div className="ui-layer">
          
          {/* Landing / Welcome screen */}
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

          {/* Game HUD Panel (visible after cinematic intro completes) */}
          {gameStarted && introCompleted && (
            <>
              {/* Profile Card */}
              <div className="profile-hud">
                <div className="profile-avatar-container">
                  <span style={{ fontSize: '18px' }}>🏕️</span>
                </div>
                <div className="profile-details">
                  <span className="profile-greeting">Hello, I'm</span>
                  <span className="profile-name">KANISHK</span>
                  <span className="profile-role">Developer | AI Enthusiast | Explorer</span>
                </div>
              </div>

              {/* Volume Button */}
              <div className="top-right-hud">
                <button className="hud-btn" onClick={handleToggleMute} title="Toggle Mute">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {/* Left Wooden Board Menu */}
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

              {/* Bottom Left WASD controls tips */}
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

              {/* Bottom Center mouse look tips */}
              <div className="scroll-helper-hud">
                <span className="scroll-mouse-icon">🖱️</span>
                <span>Move Mouse to Look Around</span>
              </div>

              {/* Bottom Right sign board */}
              <div className="hud-signpost-board">
                <span className="hud-signpost-text">
                  "Every step leads to a new chapter."
                </span>
              </div>
            </>
          )}

          {/* Checkpoint overlay resume cards */}
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

        {/* ==================================================
           5. MODERN FOOTER PANEL (ALWAYS VISIBLE AFTER LOADER)
           ================================================== */}
        {dismissLoader && (
          <footer className="app-footer">
            <div className="footer-left">
              <a 
                href="https://github.com/sandilyakanishk" 
                target="_blank" 
                rel="noreferrer" 
                className="footer-social-link"
                title="GitHub Profile"
              >
                <Github size={22} />
              </a>
            </div>
            
            <div className="footer-center">
              Kanishk Sandilya • DevOps & Cloud Engineer
            </div>
            
            {/* Right side with polished feedback/social utility icons + Resume */}
            <div className="footer-right">
              <div className="footer-feedback-icons">
                <button className="feedback-icon-btn" title="Like" onClick={() => alert("Thanks for your feedback!")}>
                  <ThumbsUp size={15} />
                </button>
                <button className="feedback-icon-btn" title="Dislike" onClick={() => alert("Thanks for your feedback!")}>
                  <ThumbsDown size={15} />
                </button>
                <button className="feedback-icon-btn" title="Comment" onClick={() => handleTeleport([0, 15.5, -160.0])}>
                  <MessageSquare size={15} />
                </button>
                <button className="feedback-icon-btn" title="Share" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }}>
                  <Share2 size={15} />
                </button>
              </div>
              
              <a 
                href="https://github.com/sandilyakanishk/portfolio-3Dtrek" 
                target="_blank" 
                rel="noreferrer" 
                className="resume-btn"
              >
                <FileText size={16} />
                <span>RESUME</span>
              </a>
            </div>
          </footer>
        )}

      </div>
    </KeyboardControls>
  );
}
