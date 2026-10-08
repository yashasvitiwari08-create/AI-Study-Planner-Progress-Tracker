// Web Audio API based ambient sound generator for focus study sessions

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentMode: 'rain' | 'binaural' | 'whitenoise' | 'off' = 'off';

  private initContext() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  }

  public play(mode: 'rain' | 'binaural' | 'whitenoise', volume = 0.2) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentMode = mode;
    this.isPlaying = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (mode === 'whitenoise') {
      this.playWhiteNoise();
    } else if (mode === 'rain') {
      this.playRain();
    } else if (mode === 'binaural') {
      this.playBinaural();
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as any).stop?.();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
    this.isPlaying = false;
    this.currentMode = 'off';
  }

  public playChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1); // A5

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.8);
    } catch (e) {
      console.warn('Unable to play chime audio:', e);
    }
  }

  private playWhiteNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it soft pink noise
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    whiteNoise.start();
    this.noiseNode = whiteNoise;
  }

  private playRain() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise for rain
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const rain = this.ctx.createBufferSource();
    rain.buffer = noiseBuffer;
    rain.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.5, this.ctx.currentTime);

    rain.connect(filter);
    filter.connect(this.gainNode);
    rain.start();
    this.noiseNode = rain;
  }

  private playBinaural() {
    if (!this.ctx || !this.gainNode) return;
    // 210Hz left / 220Hz right -> 10Hz Alpha Focus Waves
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const merger = this.ctx.createChannelMerger(2);

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(216, this.ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(226, this.ctx.currentTime); // 10Hz Alpha beat

    osc1.connect(merger, 0, 0);
    osc2.connect(merger, 0, 1);

    merger.connect(this.gainNode);
    osc1.start();
    osc2.start();

    this.noiseNode = {
      disconnect: () => {
        osc1.stop();
        osc2.stop();
        osc1.disconnect();
        osc2.disconnect();
      },
    } as any;
  }
}

export const ambientSound = new AmbientSoundEngine();
