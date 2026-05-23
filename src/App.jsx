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
  const [isNight, setIsNight] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState([]);
  const [teleportTarget, setTeleportTarget] = useState(null);
  const [dismissLoader, setDismissLoader] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  const { active } = useProgress();
  
  // High performance player position tracker
  const playerPosRef = useRef(new THREE.Vector3(0, 1.2, 0));
  const fallTimerRef  = useRef(null);
  const lastSafePos  = useRef([0, 2.0, 0]);

  const handlePositionChange = (position) => {
    playerPosRef.current.set(position.x, position.y, position.z);

    // Track last safe position above ground
    if (position.y > 0) {
      lastSafePos.current = [position.x, position.y + 2, position.z];
    }

    // Fall detection — below Y=-8 triggers 2s respawn timer
    if (position.y < -8 && !fallTimerRef.current) {
      fallTimerRef.current = setTimeout(() => {
        setTeleportTarget(new THREE.Vector3(...lastSafePos.current));
        fallTimerRef.current = null;
      }, 2000);
    } else if (position.y >= -8 && fallTimerRef.current) {
      clearTimeout(fallTimerRef.current);
      fallTimerRef.current = null;
    }
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

  // Smoothly simulate progress from 0% to 100%
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 12) + 8;
        const next = prev + increment;
        return next > 100 ? 100 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Delayed dismissal of loader for smoother exit once progress hits 100%
  useEffect(() => {
    if (simulatedProgress === 100) {
      const t = setTimeout(() => {
        setDismissLoader(true);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [simulatedProgress]);

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
        background: isNight
          ? 'linear-gradient(to bottom, #080c18 0%, #0d1422 60%, #111a25 100%)'
          : 'linear-gradient(to bottom, #38bdf8 0%, #bae6fd 60%, #ffedd5 100%)',
        overflow: 'hidden',
        transition: 'background 1.2s ease'
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
           2. MINIMALIST LOADING SCREEN
           ================================================== */}
        {!dismissLoader && (
          <div className="min-loading-screen" style={{ opacity: simulatedProgress === 100 ? 0 : 1 }}>

            {/* Giant scrolling marquee text */}
            <div className="min-loading-marquee-wrap">
              <div className="min-loading-marquee">
                <span>DEVOPS ENGINEER&nbsp;&nbsp;•&nbsp;&nbsp;CLOUD PRACTITIONER&nbsp;&nbsp;•&nbsp;&nbsp;KANISHK SANDILYA&nbsp;&nbsp;•&nbsp;&nbsp;AWS&nbsp;&nbsp;•&nbsp;&nbsp;KUBERNETES&nbsp;&nbsp;•&nbsp;&nbsp;CI/CD&nbsp;&nbsp;•&nbsp;&nbsp;</span>
                <span>DEVOPS ENGINEER&nbsp;&nbsp;•&nbsp;&nbsp;CLOUD PRACTITIONER&nbsp;&nbsp;•&nbsp;&nbsp;KANISHK SANDILYA&nbsp;&nbsp;•&nbsp;&nbsp;AWS&nbsp;&nbsp;•&nbsp;&nbsp;KUBERNETES&nbsp;&nbsp;•&nbsp;&nbsp;CI/CD&nbsp;&nbsp;•&nbsp;&nbsp;</span>
              </div>
            </div>

            {/* Small dark pill loader */}
            <div className="min-loading-pill">
              <div className="min-loading-pill-bar" style={{ width: `${simulatedProgress}%` }} />
              <span className="min-loading-pill-text">
                LOADING&nbsp;&nbsp;{simulatedProgress}%
              </span>
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
            gl={{ antialias: true }}
          >
            {/* Dynamic sky color + fog based on day/night */}
            <color attach="background" args={[isNight ? '#080c18' : '#bae6fd']} />
            <fog attach="fog" args={[isNight ? '#080c18' : '#bae6fd', 15, isNight ? 65 : 95]} />

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

                {/* Environment — full mountain world */}
                <Environment
                  onCheckpointEnter={handleCheckpointEnter}
                  onCheckpointExit={handleCheckpointExit}
                  isNight={isNight}
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
          
          {/* Landing / Welcome screen — minimalist */}
          {dismissLoader && !gameStarted && (
            <div className="landing-screen">
              <div className="landing-content">
                {/* Small tag */}
                <div className="landing-tag">PORTFOLIO · 2025</div>

                {/* Big name */}
                <h1 className="landing-name">
                  KANISHK<br />SANDILYA
                </h1>

                {/* Role */}
                <p className="landing-role">DevOps & Cloud Engineer</p>

                {/* Start button */}
                <button className="landing-btn" onClick={handleStartJourney}>
                  <span>Start Journey</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Game HUD Panel (visible after cinematic intro completes) */}
          {gameStarted && introCompleted && (
            <>
              {/* Volume + Mute — top right */}
              <div className="top-right-hud">
                {/* Day/Night toggle */}
                <button
                  className="hud-mute-btn"
                  onClick={() => setIsNight((n) => !n)}
                  title={isNight ? 'Switch to Day' : 'Switch to Night'}
                  style={{ fontSize: '1rem' }}
                >
                  {isNight ? '☀️' : '🌙'}
                </button>
                <button className="hud-mute-btn" onClick={handleToggleMute} title="Toggle Mute">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* Right-side Vertical Nav Menu */}
              <nav className="adventure-nav">
                <div className="adventure-nav-label">Adventure Map</div>
                <div className="adventure-nav-list">
                  {menuCheckpoints.map((cp) => (
                    <button
                      key={cp.id}
                      className={`adventure-nav-item ${activeCheckpoint === cp.id ? 'nav-active' : ''} ${visitedCheckpoints.includes(cp.id) ? 'nav-visited' : ''}`}
                      onClick={() => handleTeleport(cp.pos)}
                    >
                      <span className="nav-num">0{cp.id}</span>
                      <span className="nav-label">{cp.label}</span>
                      <span className="nav-line" />
                    </button>
                  ))}
                </div>
              </nav>

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
                href="https://drive.google.com/file/d/1wO3_SnLtr8mm53qHkaOTBHaXUt-kbLTa/view?usp=drive_link" 
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
