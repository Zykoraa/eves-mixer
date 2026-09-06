import { LooperDeck } from '../types/daw';

export interface DeckPlaybackNodes {
  source: AudioBufferSourceNode;
  gain: GainNode;
  pan: StereoPannerNode;
  filter: BiquadFilterNode;
  startTime: number;
  duration: number;
  rate: number;
}

export class LooperStation {
  private ctx: AudioContext;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode;
  private directMonitorGain: GainNode;
  public micAnalyser: AnalyserNode;
  private micData: Float32Array;

  // External audio taps for resampling Master DAW or Guitar Rig
  private masterTapGain: GainNode;
  private guitarTapGain: GainNode;

  // Recording state
  private activeRecordingDeck: number | null = null;
  private recordingSourceType: 'mic' | 'guitar' | 'master' = 'mic';
  private recordingChunks: Float32Array[] = [];
  private recordingSampleCount = 0;
  private targetSampleCount: number | null = null;
  private autoStopCallback: (() => void) | null = null;
  private recordNode: ScriptProcessorNode | null = null;
  private outputDestination: AudioNode;

  // Deck playback nodes
  private deckSources: Map<number, DeckPlaybackNodes> = new Map();

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.outputDestination = destination;

    this.micGain = ctx.createGain();
    this.micGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.directMonitorGain = ctx.createGain();
    this.directMonitorGain.gain.setValueAtTime(0.0, ctx.currentTime); // Off by default to avoid feedback

    this.micAnalyser = ctx.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.micData = new Float32Array(this.micAnalyser.frequencyBinCount);

    this.masterTapGain = ctx.createGain();
    this.masterTapGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.guitarTapGain = ctx.createGain();
    this.guitarTapGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.directMonitorGain.connect(destination);
  }

  // Connect Master DAW and Guitar Rig audio nodes for live resampling
  public setAuxInputs(masterNode: AudioNode, guitarNode: AudioNode) {
    try {
      masterNode.connect(this.masterTapGain);
    } catch {
      // already connected or tap node
    }
    try {
      guitarNode.connect(this.guitarTapGain);
    } catch {
      // already connected
    }
  }

  public async initMic(): Promise<boolean> {
    try {
      if (this.micStream) return true;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      this.micStream = stream;
      this.micSource = this.ctx.createMediaStreamSource(stream);

      this.micSource.connect(this.micGain);
      this.micGain.connect(this.micAnalyser);
      this.micGain.connect(this.directMonitorGain);

      return true;
    } catch (err) {
      console.warn('Microphone access denied or not available:', err);
      return false;
    }
  }

  public isMicActive(): boolean {
    return this.micStream !== null;
  }

  public setMicGain(volume: number) {
    this.micGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  public setDirectMonitor(enabled: boolean, volume: number = 0.8) {
    this.directMonitorGain.gain.setTargetAtTime(enabled ? volume : 0, this.ctx.currentTime, 0.05);
  }

  public getMicPeak(): number {
    if (!this.micStream) return 0;
    this.micAnalyser.getFloatTimeDomainData(this.micData as unknown as Float32Array<ArrayBuffer>);
    let max = 0;
    for (let i = 0; i < this.micData.length; i++) {
      const abs = Math.abs(this.micData[i]);
      if (abs > max) max = abs;
    }
    return Math.min(1.0, max);
  }

  // Start recording on a specific deck with optional bar quantization and audio source
  public startRecording(
    deckNumber: number,
    bpm?: number,
    bars?: number,
    source: 'mic' | 'guitar' | 'master' = 'mic',
    onAutoStop?: () => void
  ) {
    this.activeRecordingDeck = deckNumber;
    this.recordingSourceType = source;
    this.recordingChunks = [];
    this.recordingSampleCount = 0;
    this.autoStopCallback = onAutoStop || null;

    // Calculate target samples for quantized recording
    if (bpm && bars && bars > 0) {
      const secondsPerBeat = 60 / bpm;
      const totalSeconds = secondsPerBeat * 4 * bars;
      this.targetSampleCount = Math.round(totalSeconds * this.ctx.sampleRate);
    } else {
      this.targetSampleCount = null;
    }

    // Select audio source node
    let inputSourceNode: AudioNode;
    if (source === 'guitar') {
      inputSourceNode = this.guitarTapGain;
    } else if (source === 'master') {
      inputSourceNode = this.masterTapGain;
    } else {
      inputSourceNode = this.micGain;
    }

    // Create script processor for real-time PCM capture
    this.recordNode = this.ctx.createScriptProcessor(4096, 1, 1);
    this.recordNode.onaudioprocess = (e) => {
      if (this.activeRecordingDeck === null) return;
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.recordingChunks.push(copy);
      this.recordingSampleCount += input.length;

      // Auto-stop when quantized bar duration is reached
      if (this.targetSampleCount !== null && this.recordingSampleCount >= this.targetSampleCount) {
        if (this.autoStopCallback) {
          const cb = this.autoStopCallback;
          this.autoStopCallback = null;
          // Trigger on next tick to avoid re-entrant audio process lock
          setTimeout(() => cb(), 0);
        }
      }
    };

    inputSourceNode.connect(this.recordNode);
    this.recordNode.connect(this.ctx.destination); // Clock node
  }

  // Stop recording and return seamless anti-click crossfaded buffer
  public stopRecording(bpm?: number, bars?: number): { buffer: AudioBuffer; waveform: number[] } | null {
    if (this.activeRecordingDeck === null || !this.recordNode) return null;

    try {
      this.recordNode.disconnect();
      this.recordNode.onaudioprocess = null;
      this.recordNode = null;
    } catch {
      // ignore
    }

    if (this.recordingSampleCount === 0) {
      this.activeRecordingDeck = null;
      return null;
    }

    // Determine final length: if quantized, snap to target
    let finalSampleCount = this.recordingSampleCount;
    if (this.targetSampleCount !== null && this.recordingSampleCount >= this.targetSampleCount) {
      finalSampleCount = this.targetSampleCount;
    } else if (bpm && bars) {
      const targetLen = Math.round((60 / bpm) * 4 * bars * this.ctx.sampleRate);
      if (targetLen <= this.recordingSampleCount) {
        finalSampleCount = targetLen;
      }
    }

    // Merge chunks into AudioBuffer
    const rawBuffer = this.ctx.createBuffer(1, finalSampleCount, this.ctx.sampleRate);
    const channelData = rawBuffer.getChannelData(0);
    let offset = 0;
    for (const chunk of this.recordingChunks) {
      const remaining = finalSampleCount - offset;
      if (remaining <= 0) break;
      const sliceSize = Math.min(chunk.length, remaining);
      channelData.set(chunk.subarray(0, sliceSize), offset);
      offset += sliceSize;
    }

    // Apply anti-click seamless crossfade
    const audioBuffer = this.applyLoopCrossfade(rawBuffer, 384);

    // Generate waveform peak summary (100 points)
    const pointsCount = 100;
    const step = Math.floor(channelData.length / pointsCount);
    const waveform: number[] = [];
    for (let i = 0; i < pointsCount; i++) {
      let max = 0;
      const start = i * step;
      for (let j = 0; j < step && start + j < channelData.length; j++) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) max = val;
      }
      waveform.push(Math.min(1.0, max * 1.35));
    }

    this.activeRecordingDeck = null;
    this.recordingChunks = [];
    this.recordingSampleCount = 0;
    this.targetSampleCount = null;
    this.autoStopCallback = null;

    return { buffer: audioBuffer, waveform };
  }

  // Smooth anti-click seam crossfade to eliminate pops on loop restart
  public applyLoopCrossfade(buffer: AudioBuffer, crossfadeSamples: number = 384): AudioBuffer {
    const numChannels = buffer.numberOfChannels;
    const len = buffer.length;
    if (len <= crossfadeSamples * 2) return buffer;

    const crossfaded = this.ctx.createBuffer(numChannels, len, buffer.sampleRate);
    for (let c = 0; c < numChannels; c++) {
      const src = buffer.getChannelData(c);
      const dest = crossfaded.getChannelData(c);
      dest.set(src);

      for (let i = 0; i < crossfadeSamples; i++) {
        const t = i / crossfadeSamples;
        const fadeIn = Math.sin((t * Math.PI) / 2);
        const fadeOut = Math.cos((t * Math.PI) / 2);

        const endIdx = len - crossfadeSamples + i;
        const blended = src[i] * fadeIn + src[endIdx] * fadeOut;
        dest[i] = blended;
        dest[endIdx] = blended;
      }
    }
    return crossfaded;
  }

  public overdubBuffer(existing: AudioBuffer, newBuffer: AudioBuffer): AudioBuffer {
    const len = Math.max(existing.length, newBuffer.length);
    const merged = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const out = merged.getChannelData(0);
    const oldData = existing.getChannelData(0);
    const newData = newBuffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const a = i < oldData.length ? oldData[i] : 0;
      const b = i < newData.length ? newData[i] : 0;
      // Soft saturation summation
      out[i] = Math.tanh(a + b * 0.9);
    }
    return this.applyLoopCrossfade(merged, 384);
  }

  // Start continuous loop playback with DJ dual filter, pitch shifting, and stutter support
  public startDeckPlayback(deck: LooperDeck, bpm: number, destination: AudioNode = this.outputDestination) {
    if (!deck.audioBuffer) return;
    this.stopDeckPlayback(deck.deckNumber);

    let playBuffer = deck.audioBuffer;
    if (deck.reverse) {
      playBuffer = this.reverseAudioBuffer(deck.audioBuffer);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = playBuffer;
    source.loop = true;

    // Pitch & playback rate
    let rate = Math.pow(2, deck.pitchShift / 12);
    if (deck.halfSpeed) {
      rate *= 0.5;
    }
    source.playbackRate.setValueAtTime(rate, this.ctx.currentTime);

    // Stutter repeat roll (e.g. 1/4 bar, 1/8 bar, 1/16 bar)
    if (deck.stutterRate && deck.stutterRate > 0) {
      const stutterSeconds = Math.max(0.04, (60 / bpm) * 4 * deck.stutterRate);
      source.loopStart = 0;
      source.loopEnd = Math.min(playBuffer.duration, stutterSeconds);
    } else {
      source.loopStart = 0;
      source.loopEnd = playBuffer.duration;
    }

    // Gain node
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(deck.mute ? 0 : deck.volume, this.ctx.currentTime);

    // Stereo Panner
    const panNode = this.ctx.createStereoPanner();
    panNode.pan.setValueAtTime(deck.pan, this.ctx.currentTime);

    // DJ Dual Filter (-1.0 Lowpass to +1.0 Highpass)
    const filterNode = this.ctx.createBiquadFilter();
    this.applyDeckFilter(filterNode, deck.filter || 0);

    // Route: source -> filter -> gain -> pan -> destination
    source.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(destination);

    const startTime = this.ctx.currentTime;
    source.start(0);

    this.deckSources.set(deck.deckNumber, {
      source,
      gain: gainNode,
      pan: panNode,
      filter: filterNode,
      startTime,
      duration: playBuffer.duration,
      rate,
    });
  }

  // DJ Dual Filter calculation: -1 = 120Hz LP, 0 = 20kHz bypass, +1 = 7.5kHz HP
  private applyDeckFilter(filterNode: BiquadFilterNode, filterVal: number) {
    const t = this.ctx.currentTime;
    if (filterVal < -0.05) {
      // Lowpass Filter (closing down)
      filterNode.type = 'lowpass';
      const norm = Math.abs(filterVal); // 0 to 1
      const freq = 20000 * Math.pow(0.006, norm); // 20kHz down to ~120Hz
      filterNode.frequency.setTargetAtTime(Math.max(100, freq), t, 0.02);
      filterNode.Q.setTargetAtTime(1.8, t, 0.02);
    } else if (filterVal > 0.05) {
      // Highpass Filter (opening up)
      filterNode.type = 'highpass';
      const norm = filterVal; // 0 to 1
      const freq = 20 * Math.pow(375, norm); // 20Hz up to ~7500Hz
      filterNode.frequency.setTargetAtTime(Math.min(12000, freq), t, 0.02);
      filterNode.Q.setTargetAtTime(1.8, t, 0.02);
    } else {
      // Bypass / flat
      filterNode.type = 'allpass';
      filterNode.frequency.setTargetAtTime(1000, t, 0.02);
    }
  }

  public updateDeckParameters(deckNumber: number, volume: number, pan: number, mute: boolean, filter: number = 0) {
    const existing = this.deckSources.get(deckNumber);
    if (existing) {
      existing.gain.gain.setTargetAtTime(mute ? 0 : volume, this.ctx.currentTime, 0.02);
      existing.pan.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.02);
      this.applyDeckFilter(existing.filter, filter);
    }
  }

  // Set real-time stutter repeat roll
  public setDeckStutter(deckNumber: number, stutterFraction: number, bpm: number) {
    const existing = this.deckSources.get(deckNumber);
    if (!existing || !existing.source) return;

    if (stutterFraction > 0) {
      const sliceDuration = Math.max(0.04, (60 / bpm) * 4 * stutterFraction);
      existing.source.loopStart = 0;
      existing.source.loopEnd = Math.min(existing.duration, sliceDuration);
    } else {
      existing.source.loopStart = 0;
      existing.source.loopEnd = existing.duration;
    }
  }

  // Calculate live normalized playhead position (0.0 to 1.0)
  public getDeckProgress(deckNumber: number): number {
    const existing = this.deckSources.get(deckNumber);
    if (!existing || existing.duration <= 0) return 0;

    const elapsed = (this.ctx.currentTime - existing.startTime) * existing.rate;
    const progress = (elapsed % existing.duration) / existing.duration;
    return Math.max(0, Math.min(1, progress));
  }

  public stopDeckPlayback(deckNumber: number) {
    const existing = this.deckSources.get(deckNumber);
    if (existing) {
      try {
        existing.source.stop();
        existing.source.disconnect();
        existing.filter.disconnect();
      } catch {
        // Already stopped
      }
      this.deckSources.delete(deckNumber);
    }
  }

  private reverseAudioBuffer(buffer: AudioBuffer): AudioBuffer {
    const rev = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const source = buffer.getChannelData(c);
      const dest = rev.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        dest[i] = source[buffer.length - 1 - i];
      }
    }
    return rev;
  }

  public bufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2;
    const bufferArray = new ArrayBuffer(44 + length);
    const view = new DataView(bufferArray);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    // FMT sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    // DATA sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // PCM samples (16-bit)
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }
}

