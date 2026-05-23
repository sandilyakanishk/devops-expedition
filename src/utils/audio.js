// Real MP3 background music + Web Audio SFX/ambience

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
    this.isInitialized = false;
    // Night / cricket
    this.cricketGain = null;
    this.cricketChorusGain = null;
    this.cricketInterval = null;
    this.isNight = false;
    // Real MP3 tracks
    this.bgMusic        = null;
    this.bgMusicVolume  = 0.75;
    this.windAmbient    = null;
    this.windAmbientVol = 0.18; // subtle real wind
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

    // Cricket gain bus (starts at 0, raised when night)
    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.cricketGain.connect(this.ambienceGain);

    this.cricketChorusGain = this.ctx.createGain();
    this.cricketChorusGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.cricketChorusGain.connect(this.ambienceGain);

    this.startWind();
    this.startTropicalBirds();
    this.startBgMusic();
    this.startWindAmbient();
    this.startCricketChorus();
    this.scheduleCricketChirps();
  }

  // ──────────────────────────────────────────────────
  // BACKGROUND MUSIC — loops forever
  // ──────────────────────────────────────────────────
  startBgMusic() {
    try {
      this.bgMusic = new Audio((import.meta.env.BASE_URL || '/') + 'music_for_video-just-relax-11157.mp3');
      this.bgMusic.loop   = true;   // repeat forever
      this.bgMusic.volume = 0;
      const target = this.bgMusicVolume;
      const steps  = 60;
      let   step   = 0;
      const fadeIn = setInterval(() => {
        step++;
        this.bgMusic.volume = Math.min(target, (step / steps) * target);
        if (step >= steps) clearInterval(fadeIn);
      }, 50);
      this.bgMusic.play().catch(() => {});
    } catch (err) {
      console.warn('BG music load failed:', err);
    }
  }

  // ──────────────────────────────────────────────────
  // REAL WIND AMBIENCE — MP3 at low volume, loops forever
  // ──────────────────────────────────────────────────
  startWindAmbient() {
    try {
      this.windAmbient = new Audio((import.meta.env.BASE_URL || '/') + 'storegraphic-soft-wind-477404.mp3');
      this.windAmbient.loop   = true;
      this.windAmbient.volume = 0;
      const target = this.isMuted ? 0 : this.windAmbientVol;
      const steps  = 40;
      let   step   = 0;
      const fi = setInterval(() => {
        step++;
        this.windAmbient.volume = Math.min(target, (step / steps) * target);
        if (step >= steps) clearInterval(fi);
      }, 60);
      this.windAmbient.play().catch(() => {});
    } catch (err) {
      console.warn('Wind ambient load failed:', err);
    }
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

  // ════════════════════════════════════════════════════
  // INDIAN CLASSICAL MUSIC — Bansuri · Tabla · Sitar
  // Raag Yaman (Kalyan Thaat) — adventurous, uplifting
  // ════════════════════════════════════════════════════
  startIndianMusic() {
    this.startTanpuraDrone();
    this.startBansuri();
    this.startTabla();
    this.scheduleSitarAccents();
  }

  // ── Tanpura Drone — continuous Sa-Pa foundation ────
  startTanpuraDrone() {
    if (!this.ctx) return;
    const SA = 110; // A2
    // Sa, Pa, Sa', Sa'' — classic tanpura tuning
    [SA, SA * 1.5, SA * 2, SA * 4].forEach((hz, i) => {
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, this.ctx.currentTime);
      osc.detune.setValueAtTime(-5 + i * 3, this.ctx.currentTime);
      g.gain.setValueAtTime([0.06, 0.04, 0.03, 0.02][i], this.ctx.currentTime);
      // Slow pluck tremolo
      const trem = this.ctx.createOscillator();
      trem.type = 'sine';
      trem.frequency.setValueAtTime(0.85 + i * 0.2, this.ctx.currentTime);
      const tg = this.ctx.createGain();
      tg.gain.setValueAtTime(g.gain.value * 0.28, this.ctx.currentTime);
      trem.connect(tg); tg.connect(g.gain);
      osc.connect(g); g.connect(this.musicGain);
      osc.start(); trem.start();
    });
  }

  // ── Bansuri (flute) — Raag Yaman Aroha/Avaroha ────
  startBansuri() {
    if (!this.ctx) return;
    // Raag Yaman scale — all shuddha except tivra Ma (#4)
    const y = (s) => 220 * Math.pow(2, s / 12); // Base: A3
    // Sa  Re  Ga   Ma#  Pa   Dha  Ni   Sa'
    const S = [y(0),y(2),y(4),y(6),y(7),y(9),y(11),y(12),y(14),y(16),y(18),y(19)];

    const BPM  = 72;
    const beat = 60 / BPM;

    // Three alternating phrases
    const phrases = [
      // Aroha (ascending) — gentle opening
      [{n:0,d:2},{n:2,d:1},{n:4,d:1},{n:6,d:1.5},{n:7,d:0.5},{n:9,d:2},{n:11,d:1},{n:12,d:3}],
      // Avaroha (descending) — meditative
      [{n:12,d:1},{n:11,d:0.5},{n:9,d:1},{n:7,d:1.5},{n:6,d:0.5},{n:4,d:1.5},{n:2,d:1},{n:0,d:3}],
      // Madhya (middle) — spirited
      [{n:7,d:0.75},{n:9,d:0.75},{n:11,d:0.5},{n:12,d:1},{n:11,d:0.5},{n:9,d:0.75},
       {n:7,d:0.75},{n:4,d:1.5},{n:6,d:0.5},{n:4,d:0.5},{n:2,d:1},{n:0,d:2}],
    ];

    let idx = 0;
    const playPhrase = () => {
      if (!this.ctx || this.isMuted) return;
      const phrase = phrases[idx++ % phrases.length];
      const now = this.ctx.currentTime + 0.1;
      let cur = 0;
      phrase.forEach(({ n, d }) => {
        this.playBansuriNote(S[n], now + cur * beat, d * beat);
        cur += d;
      });
      const totalBeats = phrase.reduce((s, p) => s + p.d, 0);
      const pauseMs    = (2 + Math.random() * 3) * beat * 1000;
      this.melodyTimeout = setTimeout(playPhrase, totalBeats * beat * 1000 + pauseMs);
    };
    this.melodyTimeout = setTimeout(playPhrase, 2200);
  }

  // Bansuri note — breathy sine with vibrato
  playBansuriNote(freq, time, duration) {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator(); osc1.type = 'sine';
    const osc2 = this.ctx.createOscillator(); osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2.01, time);
    // Vibrato (kicks in after attack)
    const vib  = this.ctx.createOscillator(); vib.type = 'sine';
    vib.frequency.setValueAtTime(5.5, time);
    const vg   = this.ctx.createGain();
    vg.gain.setValueAtTime(0, time);
    vg.gain.linearRampToValueAtTime(freq * 0.011, time + duration * 0.38);
    vib.connect(vg); vg.connect(osc1.frequency); vg.connect(osc2.frequency);
    // Breath noise
    const nb = this.createNoiseBuffer(0.09);
    const ns = this.ctx.createBufferSource(); ns.buffer = nb;
    const nf = this.ctx.createBiquadFilter(); nf.type = 'bandpass';
    nf.frequency.setValueAtTime(freq * 2.4, time); nf.Q.setValueAtTime(2, time);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.022, time); ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
    ns.connect(nf); nf.connect(ng); ng.connect(this.musicGain);
    ns.start(time); ns.stop(time + 0.11);
    // Envelopes
    const e1 = this.ctx.createGain();
    e1.gain.setValueAtTime(0, time);
    e1.gain.linearRampToValueAtTime(0.15, time + 0.09);
    e1.gain.setValueAtTime(0.13, time + duration * 0.72);
    e1.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    const e2 = this.ctx.createGain();
    e2.gain.setValueAtTime(0, time);
    e2.gain.linearRampToValueAtTime(0.045, time + 0.12);
    e2.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.88);
    osc1.connect(e1); e1.connect(this.musicGain);
    osc2.connect(e2); e2.connect(this.musicGain);
    osc1.start(time); osc1.stop(time + duration + 0.1);
    osc2.start(time); osc2.stop(time + duration + 0.1);
    vib.start(time);  vib.stop(time + duration + 0.1);
  }

  // ── Tabla — Teentaal (16 beats) ────────────────────
  startTabla() {
    if (!this.ctx) return;
    const BPM  = 82;
    const beat = 60 / BPM;
    // Teentaal pattern: DHA DHIN DHIN DHA | DHA DHIN DHIN DHA | DHA TIN TIN TA | TA DHIN DHIN DHA
    const BOLS = ['DHA','DHIN','DHIN','DHA','DHA','DHIN','DHIN','DHA',
                  'DHA','TIN', 'TIN', 'TA', 'TA', 'DHIN','DHIN','DHA'];
    const cycle = () => {
      if (!this.ctx || this.isMuted) return;
      const start = this.ctx.currentTime + 0.02;
      BOLS.forEach((bol, i) => this.playBol(bol, start + i * beat));
      this.tablaTimeout = setTimeout(cycle, BOLS.length * beat * 1000);
    };
    this.tablaTimeout = setTimeout(cycle, 400);
  }

  // Individual tabla stroke
  playBol(bol, t) {
    if (!this.ctx) return;
    const bayan = (hz = 80, v = 0.26) => {
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(hz, t);
      o.frequency.exponentialRampToValueAtTime(hz * 0.38, t + 0.18);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + 0.24);
    };
    const dayan = (hz = 380, v = 0.20, resonant = true) => {
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(hz, t);
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.setValueAtTime(hz * (resonant ? 2 : 1)); f.Q.setValueAtTime(resonant ? 4 : 1);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + (resonant ? 0.38 : 0.14));
      o.connect(f); f.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + 0.42);
    };
    switch (bol) {
      case 'DHA':  bayan(78, 0.26);  dayan(365, 0.20, true);  break;
      case 'DHIN': bayan(68, 0.18);  dayan(340, 0.18, true);  break;
      case 'TIN':  dayan(490, 0.15, false); break;
      case 'TA':   dayan(410, 0.18, false); break;
      default:     dayan(380, 0.16, true);  break;
    }
  }

  // ── Sitar — occasional melodic accents ─────────────
  scheduleSitarAccents() {
    const next = () => {
      if (!this.ctx) return;
      const delay = 9000 + Math.random() * 13000;
      setTimeout(() => {
        if (!this.isMuted) {
          const y  = (s) => 220 * Math.pow(2, s / 12);
          const ns = [4, 6, 7, 9]; // Ga Ma# Pa Dha in Yaman
          const now = this.ctx.currentTime;
          ns.forEach((s, i) => this.playSitarNote(y(s), now + i * 0.36, 0.65));
        }
        next();
      }, delay);
    };
    setTimeout(next, 5500);
  }

  playSitarNote(freq, time, duration) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 0.994, time);
    osc.frequency.linearRampToValueAtTime(freq * 1.007, time + 0.05);
    const flt = this.ctx.createBiquadFilter(); flt.type = 'bandpass';
    flt.frequency.setValueAtTime(freq * 3.2, time);
    flt.frequency.exponentialRampToValueAtTime(freq * 1.4, time + 0.55);
    flt.Q.setValueAtTime(5.5, time);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.13, time + 0.014);
    env.gain.exponentialRampToValueAtTime(0.04, time + 0.32);
    env.gain.exponentialRampToValueAtTime(0.0001, time + Math.min(duration, 2.2));
    // Sympathetic string resonance (chikari)
    [1.5, 2, 2.5, 3].forEach((m, i) => {
      const h = this.ctx.createOscillator(); const hg = this.ctx.createGain();
      h.type = 'sine'; h.frequency.setValueAtTime(freq * m, time + 0.02 + i * 0.01);
      hg.gain.setValueAtTime(0.016 / (i + 1), time + 0.02 + i * 0.01);
      hg.gain.exponentialRampToValueAtTime(0.0001, time + 0.45 + i * 0.1);
      h.connect(hg); hg.connect(this.musicGain);
      h.start(time + 0.02 + i * 0.01); h.stop(time + 0.55 + i * 0.1);
    });
    osc.connect(flt); flt.connect(env); env.connect(this.musicGain);
    osc.start(time); osc.stop(time + Math.min(duration, 2.2) + 0.1);
  }

  // ─── OLD GUITAR (removed) ──────────────────────────
  // startGuitarMelody() { ... }
  // playGuitarNote() { ... }
  // ───────────────────────────────────────────────────

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
  // CRICKET AMBIENCE — night only
  // ──────────────────────────────────────────────────

  // Continuous cricket chorus — filtered noise modulated at ~90 Hz
  startCricketChorus() {
    if (!this.ctx) return;

    // White noise base
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    // Bandpass to give crickets their characteristic 4-8 kHz range
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(5200, this.ctx.currentTime);
    bp.Q.setValueAtTime(8, this.ctx.currentTime);

    // LFO at ~90Hz — cricket stridulation rate
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(88, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    // Second LFO for slow chorus undulation
    const slowLfo = this.ctx.createOscillator();
    slowLfo.type = 'sine';
    slowLfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const slowLfoGain = this.ctx.createGain();
    slowLfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    // Ring‑mod style: noise → bp → amplitude shaped by LFO
    const chorusEnv = this.ctx.createGain();
    chorusEnv.gain.setValueAtTime(0.5, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(chorusEnv.gain);
    slowLfo.connect(slowLfoGain);
    slowLfoGain.connect(chorusEnv.gain);
    noise.connect(bp);
    bp.connect(chorusEnv);
    chorusEnv.connect(this.cricketChorusGain);

    noise.start();
    lfo.start();
    slowLfo.start();
  }

  // Individual cricket chirp — short burst at cricket pitch
  playCricketChirp() {
    if (!this.ctx || this.ctx.state === 'suspended' || !this.isNight) return;
    const now = this.ctx.currentTime;
    // Each cricket chirp = 3-5 rapid pulses
    const pulses = 3 + Math.floor(Math.random() * 3);
    const baseFreq = 4800 + Math.random() * 1800; // 4.8–6.6 kHz

    for (let i = 0; i < pulses; i++) {
      const t = now + i * 0.028;
      const osc = this.ctx.createOscillator();
      const g   = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      // Slight frequency wobble per pulse — natural variation
      osc.frequency.setValueAtTime(baseFreq * (0.96 + Math.random() * 0.08), t + 0.006);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.07, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
      osc.connect(g);
      g.connect(this.cricketGain);
      osc.start(t);
      osc.stop(t + 0.026);
    }
  }

  // Schedule random cricket chirps only at night
  scheduleCricketChirps() {
    const tick = () => {
      if (this.isNight && !this.isMuted) {
        // 1–4 crickets chirp simultaneously
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          setTimeout(() => this.playCricketChirp(), i * (20 + Math.random() * 80));
        }
      }
      // Next chirp burst: 0.4–1.6 s
      const delay = 400 + Math.random() * 1200;
      this.cricketInterval = setTimeout(tick, delay);
    };
    tick();
  }

  // ── Public: called when day/night switches ──────────────────────
  setCrickets(isNight) {
    this.isNight = isNight;
    if (!this.ctx || !this.cricketGain || !this.cricketChorusGain) return;

    const now  = this.ctx.currentTime;
    const ramp = 2.5; // fade duration (seconds)

    if (isNight) {
      // Birds fade out, crickets fade in
      this.cricketGain.gain.cancelScheduledValues(now);
      this.cricketGain.gain.setValueAtTime(this.cricketGain.gain.value, now);
      this.cricketGain.gain.linearRampToValueAtTime(0.9, now + ramp);
      this.cricketChorusGain.gain.cancelScheduledValues(now);
      this.cricketChorusGain.gain.setValueAtTime(this.cricketChorusGain.gain.value, now);
      this.cricketChorusGain.gain.linearRampToValueAtTime(0.55, now + ramp);
      // Lower MP3 to 45% at night so crickets come through
      if (this.bgMusic && !this.isMuted) {
        const target = 0.45;
        const start  = this.bgMusic.volume;
        const steps  = 50; let s = 0;
        const t = setInterval(() => {
          s++; this.bgMusic.volume = Math.max(0, start + ((target - start) / steps) * s);
          if (s >= steps) clearInterval(t);
        }, 50);
      }
    } else {
      // Crickets fade out
      this.cricketGain.gain.cancelScheduledValues(now);
      this.cricketGain.gain.setValueAtTime(this.cricketGain.gain.value, now);
      this.cricketGain.gain.linearRampToValueAtTime(0, now + ramp);
      this.cricketChorusGain.gain.cancelScheduledValues(now);
      this.cricketChorusGain.gain.setValueAtTime(this.cricketChorusGain.gain.value, now);
      this.cricketChorusGain.gain.linearRampToValueAtTime(0, now + ramp);
      // Restore MP3 to 75%
      if (this.bgMusic && !this.isMuted) {
        const target = this.bgMusicVolume;
        const start  = this.bgMusic.volume;
        const steps  = 50; let s = 0;
        const t = setInterval(() => {
          s++; this.bgMusic.volume = Math.min(1, start + ((target - start) / steps) * s);
          if (s >= steps) clearInterval(t);
        }, 50);
      }
    }
  }

  // ──────────────────────────────────────────────────
  // CONTROLS
  // ──────────────────────────────────────────────────
  toggleMute() {
    this.isMuted = !this.isMuted;
    // Web Audio SFX/ambience chain
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : 1.0,
        this.ctx.currentTime + 0.3
      );
    }
    // MP3 background music
    if (this.bgMusic) {
      const vol = this.isMuted ? 0 : this.bgMusicVolume;
      // Smooth fade over 0.3 s
      const steps = 15;
      const start = this.bgMusic.volume;
      const delta = (vol - start) / steps;
      let s = 0;
      const t = setInterval(() => {
        s++;
        this.bgMusic.volume = Math.max(0, Math.min(1, start + delta * s));
        if (s >= steps) clearInterval(t);
      }, 20);
    }
    return this.isMuted;
  }

  resume() {
    // Resume Web Audio context
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    // Resume MP3 if it got paused by autoplay policy
    if (this.bgMusic && this.bgMusic.paused && !this.isMuted) {
      this.bgMusic.volume = 0;
      this.bgMusic.play().catch(() => {});
      // Fade back in
      const target = this.bgMusicVolume;
      const steps  = 30;
      let   step   = 0;
      const fi = setInterval(() => {
        step++;
        this.bgMusic.volume = Math.min(target, (step / steps) * target);
        if (step >= steps) clearInterval(fi);
      }, 50);
    }
  }
}

export const audioSystem = new AudioSystem();
export default audioSystem;
