// PlaylistRecorder.ts - Direct Multi-Track Audio Recording directly into Playlist timeline
// Records microphone, instrument, or master bus in real time synchronized with DAW transport.

export interface RecordingResult {
  audioBuffer: AudioBuffer;
  blobUrl: string;
  durationSeconds: number;
  durationBars: number;
  startBar: number;
  trackIndex: number;
}

export class PlaylistRecorder {
  private static instance: PlaylistRecorder;
  private ctx: AudioContext | null = null;

  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputGain: GainNode | null = null;

  public isRecording = false;
  private recordedChunksL: Float32Array[] = [];
  private recordedChunksR: Float32Array[] = [];
  private totalRecordedSamples = 0;

  private recordingStartBar = 0;
  private recordingTrackIndex = 0;
  private bpm = 120;

  // Real-time waveform streaming listener
  private onWaveformListeners: Set<(peaks: number[]) => void> = new Set();
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

  public async startRecording(trackIndex: number, startBar: number, bpm: number): Promise<boolean> {
    if (this.isRecording || !this.ctx) return false;

    try {
      if (!this.mediaStream) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 2,
          },
        });
      }

      this.recordingTrackIndex = trackIndex;
      this.recordingStartBar = startBar;
      this.bpm = bpm;
      this.recordedChunksL = [];
      this.recordedChunksR = [];
      this.totalRecordedSamples = 0;
      this.livePeaks = [];

      this.sourceNode = this.ctx.createMediaStreamSource(this.mediaStream);
      this.inputGain = this.ctx.createGain();
      this.processorNode = this.ctx.createScriptProcessor(4096, 2, 2);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;

        const inL = e.inputBuffer.getChannelData(0);
        const inR = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : inL;

        // Store copies of incoming chunks
        const chunkL = new Float32Array(inL.length);
        const chunkR = new Float32Array(inR.length);
        chunkL.set(inL);
        chunkR.set(inR);

        this.recordedChunksL.push(chunkL);
        this.recordedChunksR.push(chunkR);
        this.totalRecordedSamples += inL.length;

        // Compute peak amplitude for live visualization
        let maxPeak = 0;
        for (let i = 0; i < inL.length; i += 64) {
          const abs = Math.max(Math.abs(inL[i]), Math.abs(inR[i]));
          if (abs > maxPeak) maxPeak = abs;
        }

        this.livePeaks.push(Math.min(1.0, maxPeak));
        if (this.livePeaks.length > 300) {
          this.livePeaks.shift();
        }

        // Notify listeners with current live peaks
        this.onWaveformListeners.forEach((cb) => cb([...this.livePeaks]));
      };

      this.sourceNode.connect(this.inputGain);
      this.inputGain.connect(this.processorNode);
      // Connect to dummy destination to keep script processor active without feedback
      const dummyGain = this.ctx.createGain();
      dummyGain.gain.value = 0;
      this.processorNode.connect(dummyGain);
      dummyGain.connect(this.ctx.destination);

      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      return false;
    }
  }

  public stopRecording(): RecordingResult | null {
    if (!this.isRecording || !this.ctx || this.totalRecordedSamples === 0) {
      this.isRecording = false;
      this.cleanupNodes();
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

    this.cleanupNodes();

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

  private cleanupNodes() {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.inputGain) {
      this.inputGain.disconnect();
      this.inputGain = null;
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
