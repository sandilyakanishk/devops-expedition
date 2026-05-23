// Procedural Audio Synthesizer using Web Audio API
// This avoids downloading external assets and ensures instant, 0-byte loading.

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.windNode = null;
    this.fireNode = null;
    this.birdsInterval = null;
    
    // Master volume gain
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.startWind();
    this.startCampfire();
    this.startBirdsScheduler();
  }

  // Helper to create White Noise
  createNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  }

  startWind() {
    if (!this.ctx) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.createNoiseBuffer();
    noiseSource.loop = true;

    // Filter to shape wind sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    // LFO to modulate filter frequency (whistling wind effect)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // Very slow oscillation

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, this.ctx.currentTime); // Swing frequency by +/- 150Hz

    // Connect LFO
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Main chain
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();
    lfo.start();

    this.windNode = { noiseSource, lfo };
  }

  startCampfire() {
    if (!this.ctx) return;

    // 1. Low rumble
    const rumbleSource = this.ctx.createBufferSource();
    rumbleSource.buffer = this.createNoiseBuffer();
    rumbleSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(80, this.ctx.currentTime);

    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    rumbleSource.connect(lowpass);
    lowpass.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);
    rumbleSource.start();

    // 2. High-frequency crackle/pops
    const scriptNode = this.ctx.createScriptProcessor(4096, 0, 1);
    scriptNode.onaudioprocess = (e) => {
      const outputBuffer = e.outputBuffer;
      const channelData = outputBuffer.getChannelData(0);
      for (let i = 0; i < outputBuffer.length; i++) {
        // Random short crackles
        if (Math.random() < 0.0006) {
          channelData[i] = Math.random() * 0.4 - 0.2; // Spark spike
        } else {
          // Fast decay
          channelData[i] = channelData[i - 1] ? channelData[i - 1] * 0.95 : 0;
        }
      }
    };

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    scriptNode.connect(crackleGain);
    crackleGain.connect(this.masterGain);

    this.fireNode = { rumbleSource, scriptNode };
  }

  startBirdsScheduler() {
    const triggerBirdChirp = () => {
      if (this.isMuted || !this.ctx) return;
      this.playBirdChirp();
    };

    // Chirp every 8-15 seconds
    this.birdsInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        triggerBirdChirp();
      }
    }, 7000);
  }

  playBirdChirp() {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const time = this.ctx.currentTime;
    
    // Create multiple quick chirps
    const numChirps = Math.floor(Math.random() * 3) + 2;
    let startTime = time;

    for (let j = 0; j < numChirps; j++) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      
      // Fast sweeping pitch
      const startFreq = 2000 + Math.random() * 800;
      const endFreq = startFreq + 1000 + Math.random() * 500;
      
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.12);

      gainNode.gain.setValueAtTime(0.0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.13);

      startTime += 0.18; // Gap between chirps
    }
  }

  playFootstep(isRunning = false) {
    if (!this.ctx || this.ctx.state === 'suspended' || this.isMuted) return;

    // Synthesize a dry rustle/crunch (lowpass-filtered white noise burst)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.createNoiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    const duration = isRunning ? 0.08 : 0.12;
    const volume = isRunning ? 0.06 : 0.035;

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start();
    noiseSource.stop(this.ctx.currentTime + duration + 0.05);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
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
