import { SynthParameters } from '../types/daw';
import { midiToFrequency } from './Presets';

interface ActiveVoice {
  midiNote: number;
  stopVoice: (time: number) => void;
  gainNode: GainNode;
  startTime: number;
}

export class SynthEngine {
  private ctx: AudioContext;
  private voices: Map<number, ActiveVoice> = new Map();
  private lastMidiNote: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private periodicWaveCache: Map<string, PeriodicWave> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.generateNoiseBuffer();
  }

  private getAntiAliasedWave(type: 'sawtooth' | 'square' | 'triangle'): PeriodicWave {
    if (this.periodicWaveCache.has(type)) {
      return this.periodicWaveCache.get(type)!;
    }
    const numHarmonics = 64;
    const real = new Float32Array(numHarmonics);
    const imag = new Float32Array(numHarmonics);

    for (let n = 1; n < numHarmonics; n++) {
      // Lanczos sigma factor damping to eliminate Gibbs overshoot & aliasing
      const sigma = Math.sin((Math.PI * n) / numHarmonics) / ((Math.PI * n) / numHarmonics);
      if (type === 'sawtooth') {
        imag[n] = (Math.pow(-1, n + 1) * (2 / (n * Math.PI))) * sigma;
      } else if (type === 'square') {
        if (n % 2 !== 0) {
          imag[n] = (4 / (n * Math.PI)) * sigma;
        }
      } else if (type === 'triangle') {
        if (n % 2 !== 0) {
          const sign = ((n - 1) / 2) % 2 === 0 ? 1 : -1;
          real[n] = (sign * 8 / (Math.PI * Math.PI * n * n)) * sigma;
        }
      }
    }

    const wave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    this.periodicWaveCache.set(type, wave);
    return wave;
  }

  private generateNoiseBuffer() {
    const size = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public noteOn(
    midiNote: number,
    velocity: number = 1.0,
    time: number,
    params: SynthParameters,
    destination: AudioNode
  ): void {
    // If voice already playing this note, stop it smoothly first
    if (this.voices.has(midiNote)) {
      this.noteOff(midiNote, time, params);
    }

    // Voice count limit check (polyphony)
    if (this.voices.size >= params.polyphony) {
      // Free oldest voice
      let oldestTime = Infinity;
      let oldestNote: number | null = null;
      this.voices.forEach((v, note) => {
        if (v.startTime < oldestTime) {
          oldestTime = v.startTime;
          oldestNote = note;
        }
      });
      if (oldestNote !== null) {
        this.noteOff(oldestNote, time, params);
      }
    }

    const freq = midiToFrequency(midiNote);
    const now = Math.max(time, this.ctx.currentTime);

    // Voice Master Gain (ADSR)
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    // Amp Attack
    const attackTime = Math.max(params.ampAttack, 0.002);
    voiceGain.gain.linearRampToValueAtTime(velocity, now + attackTime);
    // Amp Decay & Sustain
    const decayTime = Math.max(params.ampDecay, 0.01);
    voiceGain.gain.setTargetAtTime(params.ampSustain * velocity, now + attackTime, decayTime / 3);

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = params.filterType;
    filter.Q.setValueAtTime(params.filterResonance, now);

    const baseCutoff = Math.max(20, Math.min(20000, params.filterCutoff));
    filter.frequency.setValueAtTime(baseCutoff, now);

    // Filter Envelope
    const filterAttack = Math.max(params.filterAttack, 0.002);
    const targetPeak = Math.max(20, Math.min(20000, baseCutoff + params.filterEnvAmount));
    filter.frequency.linearRampToValueAtTime(targetPeak, now + filterAttack);
    const filterSustainCutoff = Math.max(
      20,
      Math.min(20000, baseCutoff + params.filterEnvAmount * params.filterSustain)
    );
    filter.frequency.setTargetAtTime(
      filterSustainCutoff,
      now + filterAttack,
      Math.max(params.filterDecay, 0.01) / 3
    );

    // Filter connects to voice gain -> destination
    filter.connect(voiceGain);
    voiceGain.connect(destination);

    // Oscillators to stop later
    const oscsToStop: (AudioScheduledSourceNode)[] = [];

    // Glide / Portamento calculation
    let startFreq = freq;
    if (params.glide > 0 && this.lastMidiNote !== null) {
      startFreq = midiToFrequency(this.lastMidiNote);
    }
    this.lastMidiNote = midiNote;

    // --- OSC 1 ---
    const osc1 = this.ctx.createOscillator();
    if (params.osc1Waveform === 'sine') {
      osc1.type = 'sine';
    } else {
      osc1.setPeriodicWave(this.getAntiAliasedWave(params.osc1Waveform));
    }
    const osc1Freq = startFreq * Math.pow(2, params.osc1Octave);
    const targetFreq1 = freq * Math.pow(2, params.osc1Octave);
    osc1.frequency.setValueAtTime(osc1Freq, now);
    if (params.glide > 0) {
      osc1.frequency.exponentialRampToValueAtTime(targetFreq1, now + params.glide);
    }
    osc1.detune.setValueAtTime(params.osc1Detune, now);

    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(params.osc1Volume, now);
    osc1.connect(osc1Gain);
    osc1Gain.connect(filter);
    osc1.start(now);
    oscsToStop.push(osc1);

    // --- OSC 2 ---
    if (params.osc2Waveform === 'noise') {
      if (this.noiseBuffer) {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;
        noiseSource.loop = true;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(params.osc2Volume * 0.4, now);
        noiseSource.connect(noiseGain);
        noiseGain.connect(filter);
        noiseSource.start(now);
        oscsToStop.push(noiseSource);
      }
    } else {
      const osc2 = this.ctx.createOscillator();
      if (params.osc2Waveform === 'sine') {
        osc2.type = 'sine';
      } else {
        osc2.setPeriodicWave(this.getAntiAliasedWave(params.osc2Waveform));
      }
      const osc2Freq = startFreq * Math.pow(2, params.osc2Octave);
      const targetFreq2 = freq * Math.pow(2, params.osc2Octave);
      osc2.frequency.setValueAtTime(osc2Freq, now);
      if (params.glide > 0) {
        osc2.frequency.exponentialRampToValueAtTime(targetFreq2, now + params.glide);
      }
      osc2.detune.setValueAtTime(params.osc2Detune, now);

      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(params.osc2Volume, now);
      osc2.connect(osc2Gain);
      osc2Gain.connect(filter);
      osc2.start(now);
      oscsToStop.push(osc2);
    }

    // --- SUB OSCILLATOR ---
    if (params.subOscVolume > 0) {
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      const subFreq = (startFreq / 2);
      const targetSubFreq = freq / 2;
      subOsc.frequency.setValueAtTime(subFreq, now);
      if (params.glide > 0) {
        subOsc.frequency.exponentialRampToValueAtTime(targetSubFreq, now + params.glide);
      }
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(params.subOscVolume, now);
      subOsc.connect(subGain);
      subGain.connect(filter);
      subOsc.start(now);
      oscsToStop.push(subOsc);
    }

    // --- LFO ---
    if (params.lfoDestination !== 'none' && params.lfoDepth > 0) {
      const lfo = this.ctx.createOscillator();
      lfo.type = params.lfoWaveform;
      lfo.frequency.setValueAtTime(params.lfoRate, now);
      const lfoGain = this.ctx.createGain();

      if (params.lfoDestination === 'cutoff') {
        lfoGain.gain.setValueAtTime(params.lfoDepth * 2000, now);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
      } else if (params.lfoDestination === 'pitch') {
        lfoGain.gain.setValueAtTime(params.lfoDepth * 50, now); // cents
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.detune);
      }

      lfo.start(now);
      oscsToStop.push(lfo);
    }

    const stopVoice = (releaseTime: number) => {
      const releaseDur = Math.max(params.ampRelease, 0.05);
      const stopTarget = Math.max(releaseTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(stopTarget);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, stopTarget);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, stopTarget + releaseDur);

      // Stop sources after release
      setTimeout(() => {
        oscsToStop.forEach((src) => {
          try {
            src.stop();
            src.disconnect();
          } catch {
            // Already stopped
          }
        });
        voiceGain.disconnect();
      }, releaseDur * 1000 + 100);
    };

    this.voices.set(midiNote, {
      midiNote,
      stopVoice,
      gainNode: voiceGain,
      startTime: now,
    });
  }

  public noteOff(midiNote: number, time: number, _params?: SynthParameters): void {
    const voice = this.voices.get(midiNote);
    if (voice) {
      voice.stopVoice(time);
      this.voices.delete(midiNote);
    }
  }

  public stopAllVoices(): void {
    const now = this.ctx.currentTime;
    this.voices.forEach((voice) => {
      voice.stopVoice(now);
    });
    this.voices.clear();
    this.lastMidiNote = null;
  }
}
