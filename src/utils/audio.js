// Procedural Audio Synthesizer - Tropical Adventure Soundscape
// 100% Web Audio API — no external files needed

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.ambienceGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.windNode = null;
    this.birdsInterval = null;
    this.melodyTimeout = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Sub-gains for mixing
    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    this.ambienceGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startWind();
    this.startTropicalBirds();
    this.startTropicalMelody();
  }

  // ──────────────────────────────────────────────────
  // NOISE HELPER
  // ──────────────────────────────────────────────────
  createNoiseBuffer(duration = 2) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // ──────────────────────────────────────────────────
  // WIND AMBIENCE
  // ──────────────────────────────────────────────────
  startWind() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(3);
    noise.loop = true;

    // Gentle tropical breeze — bandpass filtered
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(320, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Slow LFO for wind sway
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.06, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(110, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    // Rustling leaves layer
    const leafNoise = this.ctx.createBufferSource();
    leafNoise.buffer = this.createNoiseBuffer(2);
    leafNoise.loop = true;
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(2200, this.ctx.currentTime);
    const leafGain = this.ctx.createGain();
    leafGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    leafNoise.connect(highpass);
    highpass.connect(leafGain);
    leafGain.connect(this.ambienceGain);

    noise.connect(bandpass);
    bandpass.connect(this.ambienceGain);

    noise.start();
    lfo.start();
    leafNoise.start();

    this.windNode = { noise, lfo, leafNoise };
  }

  // ──────────────────────────────────────────────────
  // TROPICAL BIRDS
  // ──────────────────────────────────────────────────
  startTropicalBirds() {
    const schedule = () => {
      if (!this.ctx || this.isMuted) return;
      const delay = 3000 + Math.random() * 6000;
      this.birdsInterval = setTimeout(() => {
        const roll = Math.random();
        if (roll < 0.45) this.playTropicalChirp();
        else if (roll < 0.75) this.playWhistleBird();
        else this.playCallBird();
        schedule();
      }, delay);
    };
    schedule();
  }

  playTropicalChirp() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const t = now + i * 0.16;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      const baseFreq = 2400 + Math.random() * 1200;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, t + 0.08);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      osc.connect(g); g.connect(this.ambienceGain);
      osc.start(t); osc.stop(t + 0.15);
    }
  }

  playWhistleBird() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    const f = 1800 + Math.random() * 600;
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.linearRampToValueAtTime(f * 1.15, now + 0.25);
    osc.frequency.linearRampToValueAtTime(f * 0.9, now + 0.55);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.05);
    g.gain.setValueAtTime(0.045, now + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(g); g.connect(this.ambienceGain);
    osc.start(now); osc.stop(now + 0.65);
  }

  playCallBird() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    // Two-tone tropical call
    [[900, 1100], [700, 900]].forEach(([f1, f2], i) => {
      const t = now + i * 0.28;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f1, t);
      osc.frequency.exponentialRampToValueAtTime(f2, t + 0.2);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(g); g.connect(this.ambienceGain);
      osc.start(t); osc.stop(t + 0.25);
    });
  }

  // ──────────────────────────────────────────────────
  // TROPICAL MARIMBA MELODY
  // ──────────────────────────────────────────────────
  startTropicalMelody() {
    // Tropical pentatonic scale notes (Hz)
    // C4 D4 E4 G4 A4 C5 D5 E5 G5 A5
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00,
                   523.25, 587.33, 659.25, 783.99, 880.00];

    // Adventure melody pattern (indices into notes array)
    const melody = [
      4, 3, 2, 4, 3, 1, 2, 0,
      3, 4, 6, 5, 4, 3, 4, 2,
      5, 4, 3, 5, 4, 2, 3, 1,
      4, 6, 5, 4, 3, 2, 1, 0
    ];

    const bpm = 108;
    const beat = 60 / bpm;

    const playMelody = () => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      melody.forEach((noteIdx, i) => {
        const t = now + i * beat * 0.5;
        this.playMarimbaNote(notes[noteIdx], t, beat * 0.42);
        // Add bass note every 4 beats
        if (i % 8 === 0) {
          this.playMarimbaNote(notes[noteIdx % 5] * 0.5, t, beat * 1.8, 0.7);
        }
      });

      // Loop after melody finishes
      const duration = melody.length * beat * 0.5 * 1000;
      this.melodyTimeout = setTimeout(playMelody, duration);
    };

    playMelody();
  }

  playMarimbaNote(freq, time, duration, gainMult = 1.0) {
    if (!this.ctx) return;

    // Marimba-like: sine wave with fast attack, medium decay
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    // Slight detuning for warmth
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Marimba envelope: fast attack, medium-fast decay, no sustain
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.18 * gainMult, time + 0.008);
    gainNode.gain.exponentialRampToValueAtTime(0.06 * gainMult, time + duration * 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    // Add harmonics for marimba color
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.0, time);
    g2.gain.setValueAtTime(0, time);
    g2.gain.linearRampToValueAtTime(0.04 * gainMult, time + 0.005);
    g2.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.2);

    osc.connect(gainNode); gainNode.connect(this.musicGain);
    osc2.connect(g2); g2.connect(this.musicGain);
    osc.start(time); osc.stop(time + duration + 0.05);
    osc2.start(time); osc2.stop(time + duration * 0.25);
  }

  // ──────────────────────────────────────────────────
  // FOOTSTEP SOUND
  // ──────────────────────────────────────────────────
  playFootstep(isRunning = false) {
    if (!this.ctx || this.ctx.state === 'suspended' || this.isMuted) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isRunning ? 320 : 220, now);
    filter.Q.setValueAtTime(1.8, now);

    const g = this.ctx.createGain();
    const dur = isRunning ? 0.07 : 0.11;
    const vol = isRunning ? 0.25 : 0.16;
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter); filter.connect(g); g.connect(this.sfxGain);
    noise.start(now); noise.stop(now + dur + 0.02);

    // Subtle thud for running
    if (isRunning) {
      const thud = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(90, now);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.06);
      tg.gain.setValueAtTime(0.2, now);
      tg.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      thud.connect(tg); tg.connect(this.sfxGain);
      thud.start(now); thud.stop(now + 0.08);
    }
  }

  // ──────────────────────────────────────────────────
  // JUMP SOUND
  // ──────────────────────────────────────────────────
  playJump() {
    if (!this.ctx || this.ctx.state === 'suspended' || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Upward sweeping whoosh
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.28, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(now); osc.stop(now + 0.25);

    // Air swoosh
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.3);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1800, now);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.12, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(hp); hp.connect(ng); ng.connect(this.sfxGain);
    noise.start(now); noise.stop(now + 0.22);
  }

  // ──────────────────────────────────────────────────
  // CONTROLS
  // ──────────────────────────────────────────────────
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : 1.0,
        this.ctx.currentTime + 0.3
      );
    }
    return this.isMuted;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}

export const audioSystem = new AudioSystem();
export default audioSystem;
