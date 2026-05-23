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
    this.ambienceGain.gain.setValueAtTime(0.18, this.ctx.currentTime); // softer wind so guitar is clear
    this.ambienceGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.38, this.ctx.currentTime); // guitar sits clearly in mix
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startWind();
    this.startTropicalBirds();
    this.startGuitarMelody();
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
  // ACOUSTIC GUITAR — soothing fingerpicked melody
  // Am pentatonic: A2 C3 D3 E3 G3 A3 C4 D4 E4 G4 A4
  // ──────────────────────────────────────────────────
  startGuitarMelody() {
    // Fingerpicking pattern in Am — warm, melancholic, mountain feel
    // Notes as semitone offsets from A2 (110 Hz)
    // A2=110, C3=130.8, D3=146.8, E3=164.8, G3=196, A3=220
    // C4=261.6, D4=293.7, E4=329.6, G4=392, A4=440
    const freq = (semitone) => 110 * Math.pow(2, semitone / 12);
    //                     A   C    D    E    G    A    C    D    E    G    A
    const scaleHz = [freq(0), freq(3), freq(5), freq(7), freq(10),
                     freq(12), freq(15), freq(17), freq(19), freq(22), freq(24)];

    // A calming fingerpicking pattern (index into scaleHz)
    // Alternates bass notes (0-4) with melody (5-10) for depth
    const pattern = [
      // Phrase 1 — gentle opening
      { n: 0, d: 1.0 }, { n: 5, d: 0.5 }, { n: 7, d: 0.5 },
      { n: 1, d: 1.0 }, { n: 6, d: 0.5 }, { n: 8, d: 0.5 },
      // Phrase 2 — slight lift
      { n: 2, d: 0.75}, { n: 7, d: 0.25}, { n: 9, d: 0.5 }, { n: 8, d: 0.5 },
      { n: 0, d: 1.0 }, { n: 5, d: 0.5 }, { n: 6, d: 0.5 },
      // Phrase 3 — resolve
      { n: 3, d: 0.75}, { n: 8, d: 0.5 }, { n: 7, d: 0.5 }, { n: 5, d: 0.25},
      { n: 1, d: 1.0 }, { n: 6, d: 0.5 }, { n: 5, d: 0.5 },
      // Phrase 4 — peaceful close
      { n: 0, d: 1.5 }, { n: 5, d: 0.25}, { n: 6, d: 0.25},
      { n: 7, d: 0.5 }, { n: 6, d: 0.5 }, { n: 5, d: 0.5 }, { n: 0, d: 1.5 },
    ];

    const BPM = 72; // slow, relaxed tempo
    const beat = 60 / BPM;

    const playPhrase = () => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime + 0.05;
      let cursor = 0;

      pattern.forEach(({ n, d }) => {
        const t = now + cursor * beat;
        const hz = scaleHz[n];
        const dur = d * beat;
        // Bass notes slightly louder, melody notes softer
        const vol = n < 5 ? 0.18 : 0.12;
        this.playGuitarNote(hz, t, dur, vol);
        cursor += d;
      });

      // Add occasional gentle chord strum at phrase starts
      [0, 8, 16].forEach((offset) => {
        const t = now + offset * beat;
        // Soft Am chord: A2 + E3 + A3 staggered
        [scaleHz[0], scaleHz[4], scaleHz[5]].forEach((hz, i) => {
          this.playGuitarNote(hz, t + i * 0.022, beat * 2, 0.08);
        });
      });

      // Total duration of pattern in ms
      const totalBeats = pattern.reduce((s, p) => s + p.d, 0);
      const totalMs = totalBeats * beat * 1000 + 2500; // 2.5s silence between loops
      this.melodyTimeout = setTimeout(playPhrase, totalMs);
    };

    // Short initial delay so it starts after ambient wind settles
    this.melodyTimeout = setTimeout(playPhrase, 1800);
  }

  // Plucked acoustic guitar note — Karplus-Strong inspired envelope
  // Uses a mix of sawtooth + sine + filtered noise for realistic string tone
  playGuitarNote(freq, time, duration, peakVol = 0.14) {
    if (!this.ctx) return;

    // ── String body: sawtooth filtered to remove harshness ──
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    // Slight pitch drop simulating string stretch
    osc1.frequency.exponentialRampToValueAtTime(freq * 0.998, time + 0.4);

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(freq * 8, time); // bright pluck
    lpf.frequency.exponentialRampToValueAtTime(freq * 1.8, time + duration * 0.6); // darken fast
    lpf.Q.setValueAtTime(0.8, time);

    // ── Fundamental sine for warmth ──
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq, time);

    // ── Pluck transient: very short noise burst ──
    const nBuf = this.createNoiseBuffer(0.04);
    const nSrc = this.ctx.createBufferSource();
    nSrc.buffer = nBuf;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(freq * 3, time);
    nFilter.Q.setValueAtTime(4, time);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(peakVol * 0.3, time);
    nGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    nSrc.connect(nFilter); nFilter.connect(nGain); nGain.connect(this.musicGain);
    nSrc.start(time); nSrc.stop(time + 0.05);

    // ── Main envelope: fast attack, long natural decay ──
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(peakVol, time + 0.006); // snap attack
    env.gain.exponentialRampToValueAtTime(peakVol * 0.4, time + duration * 0.25);
    env.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(duration, 3.5));

    // ── Sine layer (softer, longer sustain) ──
    const env2 = this.ctx.createGain();
    env2.gain.setValueAtTime(0, time);
    env2.gain.linearRampToValueAtTime(peakVol * 0.55, time + 0.01);
    env2.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(duration * 1.2, 4.0));

    // Slight reverb via delay feedback
    const delay = this.ctx.createDelay(0.5);
    delay.delayTime.setValueAtTime(0.22, time);
    const fbGain = this.ctx.createGain();
    fbGain.gain.setValueAtTime(0.18, time);
    const delayLpf = this.ctx.createBiquadFilter();
    delayLpf.type = 'lowpass';
    delayLpf.frequency.setValueAtTime(1200, time);

    osc1.connect(lpf); lpf.connect(env); env.connect(this.musicGain);
    env.connect(delay); delay.connect(delayLpf); delayLpf.connect(fbGain);
    fbGain.connect(delay); // feedback loop
    fbGain.connect(this.musicGain);

    osc2.connect(env2); env2.connect(this.musicGain);

    osc1.start(time); osc1.stop(time + Math.min(duration, 3.5) + 0.1);
    osc2.start(time); osc2.stop(time + Math.min(duration * 1.2, 4.0) + 0.1);
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
