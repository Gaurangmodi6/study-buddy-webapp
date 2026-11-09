// Web Audio API procedural sound synthesizer (Zero external asset dependencies)

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Read mute preference from localStorage
    try {
      this.isMuted = localStorage.getItem('study_buddy_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('study_buddy_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    if (!this.isMuted) {
      this.playClick();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft tactile UI click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // ignore audio errors
    }
  }

  // Rocket Ignition / Thruster Roar
  public playRocketSound(duration = 1.6) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. White Noise generator for exhaust turbulence
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Low pass filter for deep rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.linearRampToValueAtTime(450, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(80, now + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // 2. Low Frequency Thruster Sine Oscillator
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();

      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(55, now);
      subOsc.frequency.linearRampToValueAtTime(110, now + duration * 0.4);
      subOsc.frequency.exponentialRampToValueAtTime(40, now + duration);

      subGain.gain.setValueAtTime(0.01, now);
      subGain.gain.linearRampToValueAtTime(0.18, now + 0.25);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
      subOsc.start(now);
      subOsc.stop(now + duration);
    } catch {
      // ignore
    }
  }

  // Celestial Chime for Mission Accomplishment
  public playAccomplishedChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Major cosmic chord)
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const delay = idx * 0.08;
        const startTime = this.ctx.currentTime + delay;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.9);
      });
    } catch {
      // ignore
    }
  }

  // Cosmic Warp / Transition Whoosh
  public playWarpWhoosh() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // ignore
    }
  }

  // Continuous Ambient Noise State
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientDroneOsc1: OscillatorNode | null = null;
  private ambientDroneOsc2: OscillatorNode | null = null;
  private ambientDroneGain: GainNode | null = null;
  private isAmbientOn: boolean = false;
  private ambientVolume: number = 0.25;
  private ambientPreset: 'white' | 'cosmic' | 'pink' = 'white';

  // Ambient sound generator for Deep Focus
  public startAmbient(preset: 'white' | 'cosmic' | 'pink' = 'white', volume = 0.25) {
    this.ambientPreset = preset;
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    this.stopAmbient(false); // Stop prior instance without resetting isAmbientOn immediately

    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const sampleRate = this.ctx.sampleRate;
      const duration = 5; // 5-second seamless loop
      const bufferSize = sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate noise buffer
      if (preset === 'pink') {
        // Pink noise approximation (Paul Kellet's filter)
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }
      } else {
        // Standard white noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }

      this.ambientSource = this.ctx.createBufferSource();
      this.ambientSource.buffer = buffer;
      this.ambientSource.loop = true;

      // Filter based on preset
      this.ambientFilter = this.ctx.createBiquadFilter();
      if (preset === 'cosmic') {
        // Deep sub space rumble
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(160, now);
        this.ambientFilter.Q.setValueAtTime(2.5, now);
      } else if (preset === 'pink') {
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(750, now);
      } else {
        // Smooth gentle white noise (lowpassed at 900Hz to remove harshness)
        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(900, now);
      }

      // Master ambient gain node
      this.ambientGain = this.ctx.createGain();
      const targetGain = this.isMuted ? 0 : this.ambientVolume * (preset === 'cosmic' ? 0.35 : 0.22);
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(targetGain, now + 1.2);

      this.ambientSource.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.ambientSource.start(now);

      // In Cosmic mode, also layer a gentle dual sine drone for deep space spaceship hum
      if (preset === 'cosmic') {
        const droneGain = this.ctx.createGain();
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(55, now); // A1 note
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(82.41, now); // E2 (fifth) with slight micro-detune
        osc2.detune.setValueAtTime(3, now);

        const targetDroneGain = this.isMuted ? 0 : this.ambientVolume * 0.12;
        droneGain.gain.setValueAtTime(0.001, now);
        droneGain.gain.linearRampToValueAtTime(targetDroneGain, now + 1.5);

        osc1.connect(droneGain);
        osc2.connect(droneGain);
        droneGain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);

        this.ambientDroneOsc1 = osc1;
        this.ambientDroneOsc2 = osc2;
        this.ambientDroneGain = droneGain;
      }

      this.isAmbientOn = true;
    } catch {
      // AudioContext error handling
    }
  }

  public stopAmbient(markStopped = true) {
    if (this.ctx && this.ambientGain) {
      try {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        if (this.ambientDroneGain) {
          this.ambientDroneGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        }
        setTimeout(() => {
          try {
            this.ambientSource?.stop();
            this.ambientSource?.disconnect();
            this.ambientFilter?.disconnect();
            this.ambientGain?.disconnect();
            this.ambientDroneOsc1?.stop();
            this.ambientDroneOsc2?.stop();
            this.ambientDroneOsc1?.disconnect();
            this.ambientDroneOsc2?.disconnect();
            this.ambientDroneGain?.disconnect();
          } catch {
            // ignore
          }
          this.ambientSource = null;
          this.ambientFilter = null;
          this.ambientGain = null;
          this.ambientDroneOsc1 = null;
          this.ambientDroneOsc2 = null;
          this.ambientDroneGain = null;
        }, 550);
      } catch {
        this.ambientSource = null;
      }
    } else {
      this.ambientSource = null;
    }

    if (markStopped) {
      this.isAmbientOn = false;
    }
  }

  public setAmbientVolume(vol: number) {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.ambientGain && this.isAmbientOn && !this.isMuted) {
      const now = this.ctx.currentTime;
      const factor = this.ambientPreset === 'cosmic' ? 0.35 : 0.22;
      this.ambientGain.gain.linearRampToValueAtTime(this.ambientVolume * factor, now + 0.1);
      if (this.ambientDroneGain) {
        this.ambientDroneGain.gain.linearRampToValueAtTime(this.ambientVolume * 0.12, now + 0.1);
      }
    }
  }

  public setAmbientPreset(preset: 'white' | 'cosmic' | 'pink') {
    this.ambientPreset = preset;
    if (this.isAmbientOn) {
      this.startAmbient(preset, this.ambientVolume);
    }
  }

  public isAmbientPlaying(): boolean {
    return this.isAmbientOn;
  }

  public getAmbientPreset(): 'white' | 'cosmic' | 'pink' {
    return this.ambientPreset;
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  // Aliases for compatibility
  public rocketLaunch(duration = 1.6) {
    this.playRocketSound(duration);
  }

  public taskComplete() {
    this.playAccomplishedChime();
  }

  public click() {
    this.playClick();
  }
}

export const sound = new SoundSystem();
