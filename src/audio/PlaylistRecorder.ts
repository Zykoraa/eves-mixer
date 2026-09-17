// PlaylistRecorder.ts - Direct Multi-Track Audio Recording directly into Playlist timeline
// Features: Hardware Mic selection, Zero-Latency Monitoring, 80Hz Rumble Low-Cut,
// Real-Time Pitch/Tuner Tracking, Real-Time VU Metering, and Transport Sync.

import { NOTE_NAMES } from './Presets';

export interface RecordingResult {
  audioBuffer: AudioBuffer;
  blobUrl: string;
  durationSeconds: number;
  durationBars: number;
  startBar: number;
  trackIndex: number;
}

export interface LivePitchInfo {
  freq: number;
  noteName: string;
  cents: number;
  midi: number;
}

export class PlaylistRecorder {
  private static instance: PlaylistRecorder;
  private ctx: AudioContext | null = null;

  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputGain: GainNode | null = null;
  private lowCutFilter: BiquadFilterNode | null = null;
  private monitorGain: GainNode | null = null;

  public isRecording = false;
  public isMonitoring = false;
  public inputGainValue = 1.0;
  public monitorVolume = 0.75;
  public lowCutEnabled = true;
  public currentDeviceId: string = '';

  private recordedChunksL: Float32Array[] = [];
  private recordedChunksR: Float32Array[] = [];
  private totalRecordedSamples = 0;

  private recordingStartBar = 0;
  private recordingTrackIndex = 0;
  private bpm = 120;

  // Real-time listeners
  private onWaveformListeners: Set<(peaks: number[]) => void> = new Set();
  private onLevelListeners: Set<(peak: number, rms: number) => void> = new Set();
  private onPitchListeners: Set<(pitch: LivePitchInfo | null) => void> = new Set();
  private livePeaks: number[] = [];

  private constructor() {}

  public static getInstance(): PlaylistRecorder {
    if (!PlaylistRecorder.instance) {
      PlaylistRecorder.instance = new PlaylistRecorder();
    }
    return PlaylistRecorder.instance;
  }

  public init(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public addWaveformListener(cb: (peaks: number[]) => void) {
    this.onWaveformListeners.add(cb);
    return () => {
      this.onWaveformListeners.delete(cb);
    };
  }

  public addLevelListener(cb: (peak: number, rms: number) => void) {
    this.onLevelListeners.add(cb);
    return () => {
      this.onLevelListeners.delete(cb);
    };
  }

  public addPitchListener(cb: (pitch: LivePitchInfo | null) => void) {
    this.onPitchListeners.add(cb);
    return () => {
      this.onPitchListeners.delete(cb);
    };
  }

  // Initialize or re-initialize microphone stream with specified device
  public async ensureMediaStream(deviceId?: string): Promise<boolean> {
    if (!this.ctx) return false;

    if (deviceId) {
      this.currentDeviceId = deviceId;
    }

    // If stream already exists with matching device, reuse
    if (this.mediaStream && !deviceId) {
      return true;
    }

    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.currentDeviceId ? { exact: this.currentDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.setupAudioGraph();
      return true;
    } catch (err) {
      console.error('Failed to access microphone:', err);
      return false;
    }
  }

  private setupAudioGraph() {
    if (!this.ctx || !this.mediaStream) return;

    this.cleanupNodes();

    this.sourceNode = this.ctx.createMediaStreamSource(this.mediaStream);

    // 1. High-Pass Low Cut Filter (80 Hz, Q 0.707) to remove rumble
    this.lowCutFilter = this.ctx.createBiquadFilter();
    this.lowCutFilter.type = 'highpass';
    this.lowCutFilter.frequency.setValueAtTime(this.lowCutEnabled ? 80 : 10, this.ctx.currentTime);
    this.lowCutFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);

    // 2. Input Gain Node
    this.inputGain = this.ctx.createGain();
    this.inputGain.gain.setValueAtTime(this.inputGainValue, this.ctx.currentTime);

    // 3. Monitor Gain Node (Direct headphone monitoring)
    this.monitorGain = this.ctx.createGain();
    const monGain = this.isMonitoring ? this.monitorVolume : 0.0;
    this.monitorGain.gain.setValueAtTime(monGain, this.ctx.currentTime);

    // 4. Script Processor for recording buffers and pitch/VU analysis
    this.processorNode = this.ctx.createScriptProcessor(2048, 2, 2);

    this.processorNode.onaudioprocess = (e) => {
      const inL = e.inputBuffer.getChannelData(0);
      const inR = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : inL;

      // Peak & RMS calculation for VU meters
      let sumSq = 0;
      let maxPeak = 0;
      for (let i = 0; i < inL.length; i += 32) {
        const val = Math.max(Math.abs(inL[i]), Math.abs(inR[i]));
        if (val > maxPeak) maxPeak = val;
        sumSq += val * val;
      }
      const rms = Math.sqrt(sumSq / (inL.length / 32));

      // Notify level meters
      this.onLevelListeners.forEach((cb) => cb(Math.min(1.0, maxPeak), Math.min(1.0, rms * 1.8)));

      // Real-time Pitch Detection (Autocorrelation)
      if (rms > 0.02 && this.onPitchListeners.size > 0) {
        const pitch = this.detectPitchAutocorrelation(inL, this.ctx?.sampleRate || 44100);
        this.onPitchListeners.forEach((cb) => cb(pitch));
      } else if (this.onPitchListeners.size > 0) {
        this.onPitchListeners.forEach((cb) => cb(null));
      }

      // If active recording, buffer audio chunks
      if (this.isRecording) {
        const chunkL = new Float32Array(inL.length);
        const chunkR = new Float32Array(inR.length);
        chunkL.set(inL);
        chunkR.set(inR);

        this.recordedChunksL.push(chunkL);
        this.recordedChunksR.push(chunkR);
        this.totalRecordedSamples += inL.length;

        this.livePeaks.push(Math.min(1.0, maxPeak));
        if (this.livePeaks.length > 300) {
          this.livePeaks.shift();
        }
        this.onWaveformListeners.forEach((cb) => cb([...this.livePeaks]));
      }
    };

    // Connections:
    // source -> lowCutFilter -> inputGain
    this.sourceNode.connect(this.lowCutFilter);
    this.lowCutFilter.connect(this.inputGain);

    // inputGain -> processorNode (for recording & metering)
    this.inputGain.connect(this.processorNode);

    // processorNode -> dummyGain -> destination (required by Web Audio to keep ScriptProcessor running)
    const dummyGain = this.ctx.createGain();
    dummyGain.gain.value = 0;
    this.processorNode.connect(dummyGain);
    dummyGain.connect(this.ctx.destination);

    // inputGain -> monitorGain -> destination (audible headphone monitor)
    this.inputGain.connect(this.monitorGain);
    this.monitorGain.connect(this.ctx.destination);
  }

  // Fast autocorrelation pitch estimator for live vocal tuner
  private detectPitchAutocorrelation(samples: Float32Array, sampleRate: number): LivePitchInfo | null {
    const minFreq = 70; // Low D2
    const maxFreq = 950; // High B5
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    let bestCorr = -1;
    let bestPeriod = -1;

    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      let corr = 0;
      let normA = 0;
      let normB = 0;
      const step = 4;

      for (let j = 0; j < samples.length - tau; j += step) {
        const a = samples[j];
        const b = samples[j + tau];
        corr += a * b;
        normA += a * a;
        normB += b * b;
      }

      const norm = Math.sqrt(normA * normB);
      const normalizedCorr = norm > 0.0001 ? corr / norm : 0;

      if (normalizedCorr > bestCorr) {
        bestCorr = normalizedCorr;
        bestPeriod = tau;
      }
    }

    if (bestCorr > 0.65 && bestPeriod > 0) {
      const freq = sampleRate / bestPeriod;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const roundedMidi = Math.round(midi);
      const cents = Math.round((midi - roundedMidi) * 100);
      const noteName = `${NOTE_NAMES[((roundedMidi % 12) + 12) % 12]}${Math.floor(roundedMidi / 12) - 1}`;

      return { freq: Math.round(freq * 10) / 10, noteName, cents, midi: Math.round(midi * 10) / 10 };
    }

    return null;
  }

  public setInputGain(val: number) {
    this.inputGainValue = Math.max(0, Math.min(2.5, val));
    if (this.ctx && this.inputGain) {
      this.inputGain.gain.setValueAtTime(this.inputGainValue, this.ctx.currentTime);
    }
  }

  public setMonitoring(enabled: boolean, volume?: number) {
    this.isMonitoring = enabled;
    if (volume !== undefined) {
      this.monitorVolume = Math.max(0, Math.min(1.0, volume));
    }
    if (this.ctx && this.monitorGain) {
      const targetGain = this.isMonitoring ? this.monitorVolume : 0.0;
      this.monitorGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  public setLowCut(enabled: boolean) {
    this.lowCutEnabled = enabled;
    if (this.ctx && this.lowCutFilter) {
      this.lowCutFilter.frequency.setValueAtTime(enabled ? 80 : 10, this.ctx.currentTime);
    }
  }

  public async startRecording(trackIndex: number, startBar: number, bpm: number, deviceId?: string): Promise<boolean> {
    if (this.isRecording || !this.ctx) return false;

    const ready = await this.ensureMediaStream(deviceId);
    if (!ready) return false;

    this.recordingTrackIndex = trackIndex;
    this.recordingStartBar = startBar;
    this.bpm = bpm;
    this.recordedChunksL = [];
    this.recordedChunksR = [];
    this.totalRecordedSamples = 0;
    this.livePeaks = [];

    this.isRecording = true;
    return true;
  }

  public stopRecording(): RecordingResult | null {
    if (!this.isRecording || !this.ctx || this.totalRecordedSamples === 0) {
      this.isRecording = false;
      return null;
    }

    this.isRecording = false;

    // Assemble float arrays into stereo AudioBuffer
    const sampleRate = this.ctx.sampleRate;
    const audioBuffer = this.ctx.createBuffer(2, this.totalRecordedSamples, sampleRate);
    const outL = audioBuffer.getChannelData(0);
    const outR = audioBuffer.getChannelData(1);

    let offset = 0;
    for (let i = 0; i < this.recordedChunksL.length; i++) {
      const cL = this.recordedChunksL[i];
      const cR = this.recordedChunksR[i];
      outL.set(cL, offset);
      outR.set(cR, offset);
      offset += cL.length;
    }

    // Encode to WAV Blob
    const blobUrl = this.encodeWavBlob(audioBuffer);
    const durationSeconds = audioBuffer.duration;
    const barDuration = (60 / this.bpm) * 4;
    const durationBars = Math.max(1, Math.ceil(durationSeconds / barDuration));

    return {
      audioBuffer,
      blobUrl,
      durationSeconds,
      durationBars,
      startBar: this.recordingStartBar,
      trackIndex: this.recordingTrackIndex,
    };
  }

  // Release microphone hardware completely so browser recording badge turns off
  public stopMicrophoneStream() {
    this.isRecording = false;
    this.isMonitoring = false;
    this.cleanupNodes();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }

  private cleanupNodes() {
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }
    if (this.processorNode) {
      try { this.processorNode.disconnect(); } catch {}
      this.processorNode = null;
    }
    if (this.inputGain) {
      try { this.inputGain.disconnect(); } catch {}
      this.inputGain = null;
    }
    if (this.lowCutFilter) {
      try { this.lowCutFilter.disconnect(); } catch {}
      this.lowCutFilter = null;
    }
    if (this.monitorGain) {
      try { this.monitorGain.disconnect(); } catch {}
      this.monitorGain = null;
    }
  }

  private encodeWavBlob(buffer: AudioBuffer): string {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numChannels * 2, true);

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += 2;
      }
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
}
