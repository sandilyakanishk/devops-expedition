import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, useProgress } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Volume2, VolumeX, Github, FileText, ThumbsUp, ThumbsDown, MessageSquare, Share2, Camera as CameraIcon, Maximize, Minimize, RotateCcw, Sun, Moon } from 'lucide-react';
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
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [visitedCheckpoints, setVisitedCheckpoints] = useState([]);
  const [teleportTarget, setTeleportTarget] = useState(null);
  const [dismissLoader, setDismissLoader] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(null);
  const [respawnMsg, setRespawnMsg] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mobile = ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || window.innerWidth <= 1024);
    window.isMobileDevice = mobile;
    return mobile;
  });
  const [isPhone, setIsPhone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 640;
  });
  const [isPortraitPhone, setIsPortraitPhone] = useState(() => {
    if (typeof window === 'undefined') return false;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
    return (coarsePointer || window.innerWidth <= 1024) && window.innerHeight > window.innerWidth;
  });
  const [mobileSprint, setMobileSprint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supportsFullscreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const docEl = document.documentElement;
    return !!(
      docEl.requestFullscreen ||
      docEl.webkitRequestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.msRequestFullscreen
    );
  });
  const controlsTimerRef = useRef(null);
  const joystickRef = useRef(null);
  const activeJoystickPointerRef = useRef(null);
  const [joystickOffset, setJoystickOffset] = useState({ x: 0, y: 0 });

  // Initialize mobileControls global and responsive check
  useEffect(() => {
    window.mobileControls = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shift: false
    };

    const checkMobile = () => {
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const mobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0 || viewportWidth <= 1024);
      setIsMobile(mobile);
      setIsPhone(viewportWidth <= 640);
      setIsPortraitPhone(mobile && viewportHeight > viewportWidth);
      window.isMobileDevice = mobile;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    window.visualViewport?.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
      window.visualViewport?.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)
      );
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = () => {
    const docEl = document.documentElement;
    if (!isFullscreen) {
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen().catch(() => {});
      } else if (docEl.mozRequestFullScreen) {
        docEl.mozRequestFullScreen().catch(() => {});
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen().catch(() => {});
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen().catch(() => {});
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen().catch(() => {});
      }
    }
  };

  const requestMobileFullscreen = async ({ lockLandscape = false } = {}) => {
    const docEl = document.documentElement;
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

    try {
      if (!fullscreenElement) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }
      }

      if (lockLandscape && window.screen?.orientation?.lock) {
        await window.screen.orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Mobile browsers can reject fullscreen/orientation requests unless triggered by a tap.
    } finally {
      window.dispatchEvent(new Event('resize'));
    }
  };

  const handleToggleControls = () => {
    setControlsOpen(prev => {
      const next = !prev;
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      if (next) {
        controlsTimerRef.current = setTimeout(() => setControlsOpen(false), 5500);
      }
      return next;
    });
  };

  const handleToggleNightMode = () => {
    setIsNight(prev => {
      const next = !prev;
      try {
        audioSystem.resume();
        audioSystem.setCrickets(next);
      } catch {
        // Audio may still be waiting for the first mobile gesture.
      }
      return next;
    });
  };

  const resetJoystick = () => {
    if (window.mobileControls) {
      window.mobileControls.forward = false;
      window.mobileControls.backward = false;
      window.mobileControls.left = false;
      window.mobileControls.right = false;
    }
    activeJoystickPointerRef.current = null;
    setJoystickOffset({ x: 0, y: 0 });
  };

  const updateJoystickFromPointer = (clientX, clientY) => {
    if (!joystickRef.current || !window.mobileControls) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const maxRadius = rect.width * 0.34;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > maxRadius ? maxRadius / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    const threshold = maxRadius * 0.28;

    setJoystickOffset({ x, y });
    window.mobileControls.forward = y < -threshold;
    window.mobileControls.backward = y > threshold;
    window.mobileControls.left = x < -threshold;
    window.mobileControls.right = x > threshold;
  };

  const handleJoystickPointerDown = (e) => {
    e.preventDefault();
    activeJoystickPointerRef.current = e.pointerId;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e) => {
    if (activeJoystickPointerRef.current !== e.pointerId) return;
    e.preventDefault();
    updateJoystickFromPointer(e.clientX, e.clientY);
  };

  const handleJoystickPointerEnd = (e) => {
    if (activeJoystickPointerRef.current !== e.pointerId) return;
    e.preventDefault();
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    resetJoystick();
  };

  // Cinematic floating quotes — shown by Z position
  const TREK_QUOTES = [
    { z: -5,   text: 'Welcome, traveler. Every mountain tells a story.' },
    { z: -25,  text: 'Growth begins where comfort ends.' },
    { z: -52,  text: 'What we learn shapes who we become.' },
    { z: -80,  text: 'Built through curiosity and countless late nights.' },
    { z: -100, text: 'Tools are learned. Persistence is built.' },
    { z: -122, text: 'Every setback became another route upward.' },
    { z: -150, text: 'Almost there. The summit awaits.' },
    { z: -165, text: 'The journey ends here. Connections begin.' },
  ];


  useProgress(); // keep asset loading tracked by drei
  
  // High performance player position tracker
  const playerPosRef = useRef(new THREE.Vector3(0, 1.2, 0));
  const fallTimerRef  = useRef(null);
  const respawnMsgRef = useRef(null);

  // Mirror of getTerrainY — trail is completely flat
  const getTerrainY = () => {
    return 0;
  };

  const handlePositionChange = (position) => {
    playerPosRef.current.set(position.x, position.y, position.z);

    // Update audio stream volume based on distance to the river/stream
    try {
      audioSystem.updateStreamVolume(position.x, position.y, position.z);
    } catch (err) {
      console.warn('Failed to update stream audio volume:', err);
    }

    // Update active quote only when it changes to prevent frame-rate App re-renders
    const z = position.z;
    const activeQ = introCompleted
      ? TREK_QUOTES.slice().reverse().find(q => z <= q.z + 8 && z >= q.z - 12)
      : null;
    const nextText = activeQ ? activeQ.text : null;
    if (window.currentQuoteText !== nextText) {
      window.currentQuoteText = nextText;
      setCurrentQuote(nextText);
    }

    // Fall threshold: 9 units below expected terrain surface
    const floorY = getTerrainY(position.z);
    const fallThreshold = floorY - 9;

    if (position.y < fallThreshold && !fallTimerRef.current) {
      fallTimerRef.current = setTimeout(() => {
        // Respawn at NEAREST visited checkpoint (not always base)
        const checkpointPositions = [
          [0, 0.8, -8],
          [0, 0.8, -38],
          [0, 0.8, -70],
          [0, 0.8, -102],
          [0, 0.8, -136],
          [0, 0.8, -168],
        ];
        const lastVisited = Math.max(0, ...visitedCheckpoints);
        const respawnPos  = lastVisited > 0
          ? checkpointPositions[lastVisited - 1]
          : [0, 0.8, 0];
        setTeleportTarget(new THREE.Vector3(...respawnPos));
        // Show "Back on trail" message
        setRespawnMsg(true);
        clearTimeout(respawnMsgRef.current);
        respawnMsgRef.current = setTimeout(() => setRespawnMsg(false), 3000);
        fallTimerRef.current = null;
      }, 1000);
    } else if (position.y >= fallThreshold && fallTimerRef.current) {
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
    setActiveCheckpoint(1);
    // Request fullscreen on start if on mobile
    if (isMobile) {
      requestMobileFullscreen({ lockLandscape: true });
    }
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

  const handleRecenter = () => {
    window.dispatchEvent(new CustomEvent('recenter-camera-character'));
  };

  // Checkpoint nav positions — matched to new 30-unit rise terrain
  const menuCheckpoints = [
    { id: 1, label: 'About Me',   pos: [0,  0.8,  -8]   },
    { id: 2, label: 'Education',  pos: [0,  0.8,  -38]  },
    { id: 3, label: 'Skills',     pos: [0,  0.8,  -70]  },
    { id: 4, label: 'Projects',   pos: [0,  0.8, -102]  },
    { id: 5, label: 'Experience', pos: [0,  0.8, -136]  },
    { id: 6, label: 'Contact',    pos: [0,  0.8, -168]  },
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

  // Ensure AudioContext resumes on click + prevent focus retention on buttons/links
  useEffect(() => {
    const handleGesture = () => {
      if (gameStarted) {
        audioSystem.resume();
      }
    };

    const handleGlobalClick = () => {
      if (document.activeElement && 
          (document.activeElement.tagName === 'BUTTON' || 
           document.activeElement.tagName === 'A')) {
        document.activeElement.blur();
      }
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);
    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      window.removeEventListener('click', handleGlobalClick);
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
        height: '100dvh', 
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
            
            <div className="navbar-center">
              <a href="mailto:sandilyakanishk@gmail.com" className="navbar-email-btn" title="Send Email">
                sandilyakanishk@gmail.com
              </a>
            </div>

            <nav>
              <ul className="navbar-links" style={{ alignItems: 'center' }}>
                {/* 🎮 Controls — distinct pill button, leftmost */}
                <li>
                  <button
                    onClick={handleToggleControls}
                    title="Show Controls"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 14px',
                      borderRadius: 20,
                      background: controlsOpen
                        ? 'linear-gradient(135deg,#f59e0b,#ef4444)'
                        : 'linear-gradient(135deg,rgba(251,191,36,0.18),rgba(239,68,68,0.12))',
                      border: '1.5px solid rgba(251,191,36,0.55)',
                      color: controlsOpen ? '#fff' : '#fbbf24',
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                      cursor: 'pointer',
                      transition: 'all 0.22s ease',
                      boxShadow: controlsOpen
                        ? '0 0 14px rgba(251,191,36,0.55)'
                        : '0 0 8px rgba(251,191,36,0.15)',
                    }}
                  >
                    Controls
                  </button>
                </li>

                {/* Info nav links */}
                <li>
                  <span className="navbar-link-item" onClick={() => handleTeleport([0, 0.8, -8.0])}>
                    About
                  </span>
                </li>
                <li>
                  <span className="navbar-link-item" onClick={() => handleTeleport([0, 0.8, -102.0])}>
                    Work
                  </span>
                </li>
                <li>
                  <span className="navbar-link-item" onClick={() => handleTeleport([0, 0.8, -168.0])}>
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
          {!isPortraitPhone && (
          <Canvas
            shadows={!isMobile}
            camera={{ position: [8, 16, 22], fov: 50 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            dpr={[1, 2]}
            performance={{ min: isMobile ? 0.35 : 0.65, debounce: isMobile ? 250 : 200 }}
          >
            {/* Sky color & fog — updated smoothly in Environment.jsx / Lighting */}
            <color attach="background" args={['#bae6fd']} />
            <fog attach="fog" args={['#bae6fd', 15, 95]} />

            <Suspense fallback={null}>
              <Physics gravity={[0, -14, 0]}>
                {/* Playable Character (WASD Controls) */}
                {gameStarted && (
                  <Character 
                    onPositionChange={handlePositionChange} 
                    teleportTarget={teleportTarget}
                    clearTeleport={() => setTeleportTarget(null)}
                    isNight={isNight}
                  />
                )}

                {/* Environment — full mountain world */}
                <Environment
                  onCheckpointEnter={handleCheckpointEnter}
                  onCheckpointExit={handleCheckpointExit}
                  isNight={isNight}
                  isMobile={isMobile}
                />

                {/* Follow Camera (intro panning -> 3rd person follow) */}
                {gameStarted && (
                  <Camera 
                    playerPosRef={playerPosRef} 
                    onIntroComplete={() => setIntroCompleted(true)}
                    isCameraEnabled={isCameraEnabled}
                  />
                )}
              </Physics>
            </Suspense>
          </Canvas>
          )}
        </div>

        {/* ==================================================
           4. 2D HUD / CONTROLS WIDGETS
           ================================================== */}
        <div className="ui-layer">
          
          {/* Landing / Welcome screen — minimalist */}
          {dismissLoader && !gameStarted && (
            <div className="landing-screen">
              <div className="landing-content">
                {/* Big name */}
                <h1 className="landing-name">
                  KANISHK<br />SANDILYA
                </h1>

                {/* Role */}
                <p className="landing-role">DevOps & Cloud Er.</p>

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
                {/* Camera Orbit/Lock toggle */}
                <button
                  className="hud-mute-btn"
                  onClick={() => setIsCameraEnabled(prev => !prev)}
                  title={isCameraEnabled ? 'Lock Camera (Auto-follow)' : 'Enable Free Camera (Orbit & Scroll Zoom)'}
                  style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <CameraIcon size={16} color={isCameraEnabled ? '#fbbf24' : '#ffffff'} />
                </button>
                {/* Day/Night toggle */}
                <button
                  className="hud-mute-btn"
                  onClick={handleToggleNightMode}
                  title={isNight ? 'Switch to Day' : 'Switch to Night'}
                  style={{ fontSize: '1rem' }}
                >
                  {isNight ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button className="hud-mute-btn" onClick={handleToggleMute} title="Toggle Mute">
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                {supportsFullscreen && (
                  <button className="hud-mute-btn" onClick={handleToggleFullscreen} title="Toggle Fullscreen">
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  </button>
                )}
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

              {/* ── CONTROLS DROPDOWN PANEL (auto-dismisses) ── */}
              {controlsOpen && (
                <div style={{
                  position: 'fixed', top: 70, left: 20,
                  background: 'rgba(12,10,8,0.92)',
                  backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 14, padding: '14px 20px',
                  color: 'rgba(255,255,255,0.80)',
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 11, letterSpacing: '0.08em', lineHeight: 2.1,
                  zIndex: 99, pointerEvents: 'none',
                  boxShadow: '0 8px 36px rgba(0,0,0,0.55)',
                  animation: 'fadeInDown 0.22s ease',
                  minWidth: 240,
                }}>
                  <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 9, opacity: 0.45, letterSpacing: '0.22em', color: '#fbbf24' }}>CONTROLS</div>
                  {[
                    ['W A S D',      'Move forward / back / strafe'],
                    ['Mouse Scroll', 'Orbit camera in 360° circle'],
                    ['Arrow L/R',   'Rotate camera left / right'],
                    ['Arrow U/D',   'Tilt camera up / down'],
                    ['Shift',        'Sprint'],
                    ['Space',        'Jump'],
                  ].map(([key, desc]) => (
                    <div key={key} style={{ display:'flex', gap: 10 }}>
                      <span style={{ opacity: 0.55, minWidth: 90, fontWeight: 600, color: '#93c5fd' }}>{key}</span>
                      <span>{desc}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 9, opacity: 0.38, letterSpacing: '0.12em' }}>AUTO-CLOSES IN 5s</div>
                </div>
              )}

              {/* ── CINEMATIC FLOATING QUOTE ── */}
              <div style={{
                position: 'fixed', bottom: '20%', left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff', fontFamily: "'Outfit', sans-serif",
                fontSize: 15, letterSpacing: '0.22em',
                fontStyle: 'italic', fontWeight: 300,
                textAlign: 'center',
                textShadow: '0 0 24px rgba(255,255,255,0.45), 0 2px 8px rgba(0,0,0,0.8)',
                opacity: currentQuote ? 1 : 0,
                transition: 'opacity 1.2s ease',
                pointerEvents: 'none', zIndex: 50,
                whiteSpace: isPhone ? 'normal' : 'nowrap',
                width: isPhone ? '82vw' : 'auto',
              }}>
                {currentQuote}
              </div>

              {/* ── RESPAWN MESSAGE ── */}
              <div style={{
                position: 'fixed', top: '42%', left: '50%',
                transform: 'translateX(-50%)',
                color: '#fbbf24', fontFamily: "'Outfit', sans-serif",
                fontSize: 14, letterSpacing: '0.28em', fontWeight: 600,
                textShadow: '0 0 20px rgba(251,191,36,0.7)',
                opacity: respawnMsg ? 1 : 0,
                transition: 'opacity 0.5s ease',
                pointerEvents: 'none', zIndex: 60,
              }}>
                BACK ON TRAIL
              </div>

            </>
          )}

          {/* Checkpoint overlay resume cards */}
          {gameStarted && introCompleted && (
            <>
              <Intro active={activeCheckpoint === 1} />
              <Education active={activeCheckpoint === 2} />
              <Skills active={activeCheckpoint === 3} />
              <Projects active={activeCheckpoint === 4} />
              <Experience active={activeCheckpoint === 5} />
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
              Kanishk Sandilya - DevOps & Cloud Er.
            </div>
            
            {/* Right side with polished feedback/social utility icons + Resume */}
            <div className="footer-right">
              <div className="footer-feedback-icons">
                <button 
                  className="feedback-icon-btn recenter-btn" 
                  title="Recenter character & camera (facing summit)" 
                  onClick={handleRecenter}
                >
                  <RotateCcw size={15} />
                </button>
                <button 
                  className="feedback-icon-btn" 
                  title="Like" 
                  onClick={() => window.open("https://wa.me/917071043805?text=Hi%20Kanishk!%20I%20visited%20your%20portfolio%20and%20wanted%20to%20give%20you%20positive%20feedback%20%E2%9C%A8%20It%20looks%20absolutely%20amazing!", "_blank")}
                >
                  <ThumbsUp size={15} />
                </button>
                <button 
                  className="feedback-icon-btn" 
                  title="Dislike" 
                  onClick={() => window.open("https://wa.me/917071043805?text=Hi%20Kanishk!%20I%20visited%20your%20portfolio%20and%20wanted%20to%20share%20some%20constructive%20feedback%20and%20suggestions%20for%20improvement.", "_blank")}
                >
                  <ThumbsDown size={15} />
                </button>
                <button 
                  className="feedback-icon-btn" 
                  title="Comment" 
                  onClick={() => window.open("https://wa.me/917071043805?text=Hi%20Kanishk!%20I%20visited%20your%20portfolio%20and%20wanted%20to%20leave%20a%20message/comment.", "_blank")}
                >
                  <MessageSquare size={15} />
                </button>
                <button 
                  className="feedback-icon-btn" 
                  title="Share" 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "Kanishk Sandilya - 3D Interactive DevOps Portfolio",
                        text: "Explore Kanishk Sandilya's 3D Interactive DevOps Portfolio!",
                        url: window.location.href
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }
                  }}
                >
                  <Share2 size={15} />
                </button>
              </div>
              
              <a 
                href="https://drive.google.com/file/d/1QDAZ8jEiX_prJ2rKa_-24StyoD9IqXQ5/view?usp=drive_link" 
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

        {/* Mobile Virtual Controls */}
        {gameStarted && introCompleted && isMobile && (
          <div className="mobile-controls-overlay">
            <div
              ref={joystickRef}
              className="mobile-joystick"
              onPointerDown={handleJoystickPointerDown}
              onPointerMove={handleJoystickPointerMove}
              onPointerUp={handleJoystickPointerEnd}
              onPointerCancel={handleJoystickPointerEnd}
              aria-label="Movement joystick"
            >
              <div className="joystick-ring" />
              <div
                className="joystick-thumb"
                style={{ transform: `translate(calc(-50% + ${joystickOffset.x}px), calc(-50% + ${joystickOffset.y}px))` }}
              />
            </div>

            <div className="mobile-actions">
              <button
                className={`action-btn night-action-btn ${isNight ? 'night-active' : ''}`}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleToggleNightMode();
                }}
                onClick={(e) => {
                  if (e.detail === 0) handleToggleNightMode();
                }}
                aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
              >
                {isNight ? 'DAY' : 'NIGHT'}
              </button>
              <button
                className={`action-btn ${mobileSprint ? 'sprint-active' : ''}`}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const nextSprint = !mobileSprint;
                  setMobileSprint(nextSprint);
                  window.mobileControls.shift = nextSprint;
                }}
              >
                RUN
              </button>
              <button
                className="action-btn"
                onTouchStart={(e) => { e.preventDefault(); window.mobileControls.jump = true; }}
                onTouchEnd={(e) => { e.preventDefault(); window.mobileControls.jump = false; }}
                onTouchCancel={(e) => { e.preventDefault(); window.mobileControls.jump = false; }}
              >
                JUMP
              </button>
            </div>
          </div>
        )}

        {/* Landscape Orientation Rotate Prompt */}
        <div className={`landscape-prompt ${isPortraitPhone ? 'show' : ''}`} aria-hidden={!isPortraitPhone}>
          <div className="phone-icon" />
          <h2 className="landscape-prompt-title">Rotate Your Phone</h2>
          <p className="landscape-prompt-desc" style={{ marginBottom: 15 }}>
            Turn your Android or iPhone sideways for the full 3D portfolio experience.
          </p>
          {supportsFullscreen ? (
            <button className="fullscreen-prompt-btn" onClick={() => requestMobileFullscreen({ lockLandscape: true })}>
              {isFullscreen ? 'Lock Landscape' : 'Fullscreen Landscape'}
            </button>
          ) : (
            <div style={{
              fontSize: '0.78rem',
              lineHeight: 1.45,
              maxWidth: 320,
              margin: '12px auto 0',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.65)'
            }}>
              <strong>iOS Safari Tip:</strong> Add to Home Screen for the cleanest full-screen experience.
            </div>
          )}
        </div>

      </div>
    </KeyboardControls>
  );
}
