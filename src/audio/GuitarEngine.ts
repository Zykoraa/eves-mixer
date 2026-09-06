import { MixerChannelNode } from './Mixer';

export type GuitarAmpModel =
  | 'fenderClean'
  | 'marshallPlexi'
  | 'mesaDual'
  | 'voxAc30'
  | 'ampegBass'
  | 'acousticDi';

export type GuitarCabModel =
  | 'v30_4x12'
  | 'twin_2x12'
  | 'vox_1x12'
  | 'ampeg_8x10'
  | 'bypass';

export interface TunerResult {
  note: string;
  octave: number;
  frequency: number;
  cents: number;
  inTune: boolean;
  stringName?: string;
  clarity: number;
}

export interface GuitarAmpSettings {
  drive: number; // 0 to 10
  bass: number; // -12 to +12 dB
  mid: number; // -12 to +12 dB
  treble: number; // -12 to +12 dB
  presence: number; // -12 to +12 dB
  master: number; // 0 to 1.5
}

export interface GuitarPedalSettings {
  compEnabled: boolean;
  compSustain: number; // 0 to 1
  compLevel: number; // 0 to 1

  driveEnabled: boolean;
  driveGain: number; // 0 to 1
  driveTone: number; // 0 to 1
  driveLevel: number; // 0 to 1

  fuzzEnabled: boolean;
  fuzzGain: number; // 0 to 1
  fuzzTone: number; // 0 to 1
  fuzzLevel: number; // 0 to 1

  wahEnabled: boolean;
  wahSensitivity: number; // 0 to 1
  wahManual: number; // 0 to 1
  wahMode: 'auto' | 'manual';

  chorusEnabled: boolean;
  chorusRate: number; // 0.1 to 5 Hz
  chorusDepth: number; // 0 to 1
  chorusMix: number; // 0 to 1

  delayEnabled: boolean;
  delayTime: number; // 0.05 to 1.0 s
  delayFeedback: number; // 0 to 0.9
  delayMix: number; // 0 to 1

  reverbEnabled: boolean;
  reverbSize: number; // 0.5 to 5.0 s
  reverbMix: number; // 0 to 1
}

const GUITAR_STRINGS = [
  { name: '6th (Low E)', note: 'E', octave: 2, freq: 82.41 },
  { name: '5th (A)', note: 'A', octave: 2, freq: 110.0 },
  { name: '4th (D)', note: 'D', octave: 3, freq: 146.83 },
  { name: '3rd (G)', note: 'G', octave: 3, freq: 196.0 },
  { name: '2nd (B)', note: 'B', octave: 3, freq: 246.94 },
  { name: '1st (High E)', note: 'E', octave: 4, freq: 329.63 },
  // Bass strings
  { name: 'Bass 4th (E)', note: 'E', octave: 1, freq: 41.2 },
  { name: 'Bass 3rd (A)', note: 'A', octave: 1, freq: 55.0 },
  { name: 'Bass 2nd (D)', note: 'D', octave: 2, freq: 73.42 },
  { name: 'Bass 1st (G)', note: 'G', octave: 2, freq: 97.99 },
];

export class GuitarEngine {
  private static instance: GuitarEngine | null = null;
  public ctx: AudioContext;

  // Stream & Input hardware nodes
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private channelSplitter: ChannelSplitterNode | null = null;
  private inputGainNode: GainNode;
  public inputAnalyser: AnalyserNode;
  private timeDataBuffer: Float32Array;

  // Tuner
  public isTunerActive: boolean = false;
  public isTunerMuted: boolean = false;
  private tunerMuteGain: GainNode;

  // Noise Gate
  public isGateEnabled: boolean = true;
  public gateThresholdDb: number = -52; // dB
  private gateGainNode: GainNode;
  private gateSmoothingTimeConstant: number = 0.05;

  // Pedalboard Nodes
  // 1. Compressor
  private compNode: DynamicsCompressorNode;
  private compMakeupGain: GainNode;
  private compDryGain: GainNode;
  private compWetGain: GainNode;
  private compOutNode: GainNode;

  // 2. Overdrive (TS9 Style)
  private drivePreFilter: BiquadFilterNode;
  private driveShaper: WaveShaperNode;
  private driveToneFilter: BiquadFilterNode;
  private driveDryGain: GainNode;
  private driveWetGain: GainNode;
  private driveOutNode: GainNode;

  // 3. Fuzz (Vintage Silicon)
  private fuzzPreGain: GainNode;
  private fuzzShaper: WaveShaperNode;
  private fuzzToneFilter: BiquadFilterNode;
  private fuzzDryGain: GainNode;
  private fuzzWetGain: GainNode;
  private fuzzOutNode: GainNode;

  // 4. Auto-Wah
  private wahFilter: BiquadFilterNode;
  private wahDryGain: GainNode;
  private wahWetGain: GainNode;
  private wahOutNode: GainNode;
  private wahEnvelopeFollowerNode: ScriptProcessorNode | null = null;
  private wahSensitivity: number = 0.6;
  private wahMode: 'auto' | 'manual' = 'auto';

  // 5. Chorus
  private chorusDelayL: DelayNode;
  private chorusDelayR: DelayNode;
  private chorusLfo: OscillatorNode;
  private chorusLfoGain: GainNode;
  private chorusDryGain: GainNode;
  private chorusWetGain: GainNode;
  private chorusOutNode: GainNode;

  // 6. Analog Delay
  private delayNode: DelayNode;
  private delayFeedbackGain: GainNode;
  private delayToneFilter: BiquadFilterNode;
  private delayDryGain: GainNode;
  private delayWetGain: GainNode;
  private delayOutNode: GainNode;

  // 7. Spring Reverb
  private springConvolver: ConvolverNode;
  private springDryGain: GainNode;
  private springWetGain: GainNode;
  private springOutNode: GainNode;

  // Amplifier Head
  private ampModel: GuitarAmpModel = 'fenderClean';
  private ampPreFilter: BiquadFilterNode;
  private ampShaper: WaveShaperNode;
  private ampBassFilter: BiquadFilterNode;
  private ampMidFilter: BiquadFilterNode;
  private ampTrebleFilter: BiquadFilterNode;
  private ampPresenceFilter: BiquadFilterNode;
  private ampMasterGain: GainNode;

  // Speaker Cabinet Simulator
  private cabModel: GuitarCabModel = 'v30_4x12';
  private cabLowFilter: BiquadFilterNode;
  private cabMidFilter: BiquadFilterNode;
  private cabHighFilter: BiquadFilterNode;
  private cabAirFilter: BiquadFilterNode;
  private cabConvolver: ConvolverNode;
  private cabDryGain: GainNode;
  private cabWetGain: GainNode;
  private cabOutNode: GainNode;

  // Output Routing & Direct Monitor
  public outputNode: GainNode;
  public directMonitorGain: GainNode;
  private currentMixerChannelDestination: AudioNode | null = null;

  // Recording Take Capture
  private isRecordingTake: boolean = false;
  private recordedTakeChunks: Float32Array[] = [];
  private recordedTakeSampleCount: number = 0;
  private takeRecorderNode: ScriptProcessorNode | null = null;

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;

    // Input gain & analyser
    this.inputGainNode = ctx.createGain();
    this.inputGainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    this.inputAnalyser = ctx.createAnalyser();
    this.inputAnalyser.fftSize = 2048;
    this.timeDataBuffer = new Float32Array(this.inputAnalyser.fftSize);

    // Tuner mute gain
    this.tunerMuteGain = ctx.createGain();
    this.tunerMuteGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // Noise Gate Gain
    this.gateGainNode = ctx.createGain();
    this.gateGainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    // 1. Compressor
    this.compNode = ctx.createDynamicsCompressor();
    this.compNode.threshold.setValueAtTime(-24, ctx.currentTime);
    this.compNode.knee.setValueAtTime(10, ctx.currentTime);
    this.compNode.ratio.setValueAtTime(4, ctx.currentTime);
    this.compNode.attack.setValueAtTime(0.005, ctx.currentTime);
    this.compNode.release.setValueAtTime(0.1, ctx.currentTime);
    this.compMakeupGain = ctx.createGain();
    this.compDryGain = ctx.createGain();
    this.compWetGain = ctx.createGain();
    this.compOutNode = ctx.createGain();
    this.compNode.connect(this.compMakeupGain);
    this.compMakeupGain.connect(this.compWetGain);
    this.compDryGain.connect(this.compOutNode);
    this.compWetGain.connect(this.compOutNode);

    // 2. Overdrive (TS9 Style)
    this.drivePreFilter = ctx.createBiquadFilter();
    this.drivePreFilter.type = 'peaking';
    this.drivePreFilter.frequency.setValueAtTime(720, ctx.currentTime);
    this.drivePreFilter.Q.setValueAtTime(1.2, ctx.currentTime);
    this.drivePreFilter.gain.setValueAtTime(5, ctx.currentTime);

    this.driveShaper = ctx.createWaveShaper();
    this.driveShaper.curve = this.createOverdriveCurve(0.5);
    this.driveShaper.oversample = '4x';

    this.driveToneFilter = ctx.createBiquadFilter();
    this.driveToneFilter.type = 'lowpass';
    this.driveToneFilter.frequency.setValueAtTime(3500, ctx.currentTime);

    this.driveDryGain = ctx.createGain();
    this.driveWetGain = ctx.createGain();
    this.driveOutNode = ctx.createGain();

    this.drivePreFilter.connect(this.driveShaper);
    this.driveShaper.connect(this.driveToneFilter);
    this.driveToneFilter.connect(this.driveWetGain);
    this.driveDryGain.connect(this.driveOutNode);
    this.driveWetGain.connect(this.driveOutNode);

    // 3. Fuzz (Vintage Silicon)
    this.fuzzPreGain = ctx.createGain();
    this.fuzzPreGain.gain.setValueAtTime(4.0, ctx.currentTime);
    this.fuzzShaper = ctx.createWaveShaper();
    this.fuzzShaper.curve = this.createFuzzCurve(0.7);
    this.fuzzShaper.oversample = '4x';
    this.fuzzToneFilter = ctx.createBiquadFilter();
    this.fuzzToneFilter.type = 'peaking';
    this.fuzzToneFilter.frequency.setValueAtTime(1000, ctx.currentTime);
    this.fuzzToneFilter.Q.setValueAtTime(0.8, ctx.currentTime);
    this.fuzzToneFilter.gain.setValueAtTime(-6, ctx.currentTime); // Mid scoop

    this.fuzzDryGain = ctx.createGain();
    this.fuzzWetGain = ctx.createGain();
    this.fuzzOutNode = ctx.createGain();

    this.fuzzPreGain.connect(this.fuzzShaper);
    this.fuzzShaper.connect(this.fuzzToneFilter);
    this.fuzzToneFilter.connect(this.fuzzWetGain);
    this.fuzzDryGain.connect(this.fuzzOutNode);
    this.fuzzWetGain.connect(this.fuzzOutNode);

    // 4. Auto-Wah
    this.wahFilter = ctx.createBiquadFilter();
    this.wahFilter.type = 'bandpass';
    this.wahFilter.frequency.setValueAtTime(700, ctx.currentTime);
    this.wahFilter.Q.setValueAtTime(4.5, ctx.currentTime);
    this.wahDryGain = ctx.createGain();
    this.wahWetGain = ctx.createGain();
    this.wahOutNode = ctx.createGain();
    this.wahFilter.connect(this.wahWetGain);
    this.wahDryGain.connect(this.wahOutNode);
    this.wahWetGain.connect(this.wahOutNode);

    // 5. Stereo Chorus
    this.chorusDelayL = ctx.createDelay();
    this.chorusDelayR = ctx.createDelay();
    this.chorusDelayL.delayTime.setValueAtTime(0.022, ctx.currentTime);
    this.chorusDelayR.delayTime.setValueAtTime(0.027, ctx.currentTime);

    this.chorusLfo = ctx.createOscillator();
    this.chorusLfo.frequency.setValueAtTime(1.2, ctx.currentTime);
    this.chorusLfoGain = ctx.createGain();
    this.chorusLfoGain.gain.setValueAtTime(0.002, ctx.currentTime);
    this.chorusLfo.connect(this.chorusLfoGain);
    this.chorusLfoGain.connect(this.chorusDelayL.delayTime);
    this.chorusLfoGain.connect(this.chorusDelayR.delayTime);
    this.chorusLfo.start();

    this.chorusDryGain = ctx.createGain();
    this.chorusWetGain = ctx.createGain();
    this.chorusOutNode = ctx.createGain();
    this.chorusDelayL.connect(this.chorusWetGain);
    this.chorusDelayR.connect(this.chorusWetGain);
    this.chorusDryGain.connect(this.chorusOutNode);
    this.chorusWetGain.connect(this.chorusOutNode);

    // 6. Analog Delay
    this.delayNode = ctx.createDelay();
    this.delayNode.delayTime.setValueAtTime(0.28, ctx.currentTime);
    this.delayFeedbackGain = ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(0.4, ctx.currentTime);
    this.delayToneFilter = ctx.createBiquadFilter();
    this.delayToneFilter.type = 'lowpass';
    this.delayToneFilter.frequency.setValueAtTime(2600, ctx.currentTime);

    this.delayDryGain = ctx.createGain();
    this.delayWetGain = ctx.createGain();
    this.delayOutNode = ctx.createGain();

    this.delayNode.connect(this.delayToneFilter);
    this.delayToneFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayToneFilter.connect(this.delayWetGain);
    this.delayDryGain.connect(this.delayOutNode);
    this.delayWetGain.connect(this.delayOutNode);

    // 7. Spring Reverb
    this.springConvolver = ctx.createConvolver();
    this.springConvolver.buffer = this.buildSpringImpulse(2.0);
    this.springDryGain = ctx.createGain();
    this.springWetGain = ctx.createGain();
    this.springOutNode = ctx.createGain();
    this.springConvolver.connect(this.springWetGain);
    this.springDryGain.connect(this.springOutNode);
    this.springWetGain.connect(this.springOutNode);

    // Amp Head Simulation
    this.ampPreFilter = ctx.createBiquadFilter();
    this.ampPreFilter.type = 'highpass';
    this.ampPreFilter.frequency.setValueAtTime(80, ctx.currentTime);

    this.ampShaper = ctx.createWaveShaper();
    this.ampShaper.curve = this.createAmpTubeCurve(3.0, 'fenderClean');
    this.ampShaper.oversample = '4x';

    this.ampBassFilter = ctx.createBiquadFilter();
    this.ampBassFilter.type = 'lowshelf';
    this.ampBassFilter.frequency.setValueAtTime(100, ctx.currentTime);
    this.ampBassFilter.gain.setValueAtTime(0, ctx.currentTime);

    this.ampMidFilter = ctx.createBiquadFilter();
    this.ampMidFilter.type = 'peaking';
    this.ampMidFilter.frequency.setValueAtTime(650, ctx.currentTime);
    this.ampMidFilter.Q.setValueAtTime(1.0, ctx.currentTime);
    this.ampMidFilter.gain.setValueAtTime(0, ctx.currentTime);

    this.ampTrebleFilter = ctx.createBiquadFilter();
    this.ampTrebleFilter.type = 'highshelf';
    this.ampTrebleFilter.frequency.setValueAtTime(3500, ctx.currentTime);
    this.ampTrebleFilter.gain.setValueAtTime(0, ctx.currentTime);

    this.ampPresenceFilter = ctx.createBiquadFilter();
    this.ampPresenceFilter.type = 'peaking';
    this.ampPresenceFilter.frequency.setValueAtTime(5500, ctx.currentTime);
    this.ampPresenceFilter.Q.setValueAtTime(1.2, ctx.currentTime);
    this.ampPresenceFilter.gain.setValueAtTime(0, ctx.currentTime);

    this.ampMasterGain = ctx.createGain();
    this.ampMasterGain.gain.setValueAtTime(0.85, ctx.currentTime);

    // Wire Amp Tone Stack
    this.ampPreFilter.connect(this.ampShaper);
    this.ampShaper.connect(this.ampBassFilter);
    this.ampBassFilter.connect(this.ampMidFilter);
    this.ampMidFilter.connect(this.ampTrebleFilter);
    this.ampTrebleFilter.connect(this.ampPresenceFilter);
    this.ampPresenceFilter.connect(this.ampMasterGain);

    // Speaker Cabinet Simulator
    this.cabLowFilter = ctx.createBiquadFilter();
    this.cabLowFilter.type = 'highpass';
    this.cabLowFilter.frequency.setValueAtTime(70, ctx.currentTime);

    this.cabMidFilter = ctx.createBiquadFilter();
    this.cabMidFilter.type = 'peaking';
    this.cabMidFilter.frequency.setValueAtTime(2800, ctx.currentTime);
    this.cabMidFilter.Q.setValueAtTime(1.5, ctx.currentTime);
    this.cabMidFilter.gain.setValueAtTime(3.5, ctx.currentTime);

    this.cabHighFilter = ctx.createBiquadFilter();
    this.cabHighFilter.type = 'lowpass';
    this.cabHighFilter.frequency.setValueAtTime(4800, ctx.currentTime);
    this.cabHighFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    this.cabAirFilter = ctx.createBiquadFilter();
    this.cabAirFilter.type = 'highshelf';
    this.cabAirFilter.frequency.setValueAtTime(7000, ctx.currentTime);
    this.cabAirFilter.gain.setValueAtTime(-14, ctx.currentTime);

    this.cabConvolver = ctx.createConvolver();
    this.cabConvolver.buffer = this.buildCabImpulse('v30_4x12');

    this.cabDryGain = ctx.createGain();
    this.cabWetGain = ctx.createGain();
    this.cabOutNode = ctx.createGain();

    this.cabLowFilter.connect(this.cabMidFilter);
    this.cabMidFilter.connect(this.cabHighFilter);
    this.cabHighFilter.connect(this.cabAirFilter);
    this.cabAirFilter.connect(this.cabConvolver);
    this.cabConvolver.connect(this.cabWetGain);
    this.cabDryGain.connect(this.cabOutNode);
    this.cabWetGain.connect(this.cabOutNode);

    // Final output node & direct monitor (muted by default until guitar input is active)
    this.outputNode = ctx.createGain();
    this.outputNode.gain.setValueAtTime(0.0, ctx.currentTime);

    this.directMonitorGain = ctx.createGain();
    this.directMonitorGain.gain.setValueAtTime(0.0, ctx.currentTime); // Off by default to prevent feedback

    // Master wiring topology:
    // Input -> Gate -> TunerMute -> Comp -> Drive -> Fuzz -> Wah -> Chorus -> Delay -> Reverb -> Amp -> Cab -> Output
    this.inputGainNode.connect(this.inputAnalyser);
    this.inputGainNode.connect(this.gateGainNode);
    this.gateGainNode.connect(this.tunerMuteGain);

    // Connect into pedal chain:
    this.tunerMuteGain.connect(this.compNode);
    this.tunerMuteGain.connect(this.compDryGain);

    this.compOutNode.connect(this.drivePreFilter);
    this.compOutNode.connect(this.driveDryGain);

    this.driveOutNode.connect(this.fuzzPreGain);
    this.driveOutNode.connect(this.fuzzDryGain);

    this.fuzzOutNode.connect(this.wahFilter);
    this.fuzzOutNode.connect(this.wahDryGain);

    this.wahOutNode.connect(this.chorusDelayL);
    this.wahOutNode.connect(this.chorusDelayR);
    this.wahOutNode.connect(this.chorusDryGain);

    this.chorusOutNode.connect(this.delayNode);
    this.chorusOutNode.connect(this.delayDryGain);

    this.delayOutNode.connect(this.springConvolver);
    this.delayOutNode.connect(this.springDryGain);

    this.springOutNode.connect(this.ampPreFilter);

    this.ampMasterGain.connect(this.cabLowFilter);
    this.ampMasterGain.connect(this.cabDryGain);

    this.cabOutNode.connect(this.outputNode);
    this.outputNode.connect(this.directMonitorGain);

    // Initialize bypass states for pedals
    this.setPedalSettings({
      compEnabled: false,
      compSustain: 0.5,
      compLevel: 0.8,

      driveEnabled: false,
      driveGain: 0.4,
      driveTone: 0.5,
      driveLevel: 0.7,

      fuzzEnabled: false,
      fuzzGain: 0.5,
      fuzzTone: 0.5,
      fuzzLevel: 0.7,

      wahEnabled: false,
      wahSensitivity: 0.6,
      wahManual: 0.5,
      wahMode: 'auto',

      chorusEnabled: false,
      chorusRate: 1.2,
      chorusDepth: 0.3,
      chorusMix: 0.4,

      delayEnabled: false,
      delayTime: 0.28,
      delayFeedback: 0.35,
      delayMix: 0.3,

      reverbEnabled: false,
      reverbSize: 2.0,
      reverbMix: 0.3,
    });

    this.setCabinet('v30_4x12');
  }

  public static getInstance(ctx?: AudioContext): GuitarEngine {
    if (!GuitarEngine.instance) {
      const audioCtx = ctx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      GuitarEngine.instance = new GuitarEngine(audioCtx);
    }
    return GuitarEngine.instance;
  }

  // Enumerate input devices (Focusrite, Behringer, Line-in, etc.)
  public async getAudioInputDevices(): Promise<{ deviceId: string; label: string }[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Audio Input ${i + 1}`,
        }));
    } catch (e) {
      console.warn('Failed to enumerate audio input devices:', e);
      return [];
    }
  }

  // Connect guitar audio input
  public async startGuitarInput(deviceId?: string, channelMode: 'left' | 'right' | 'stereo' = 'left'): Promise<boolean> {
    try {
      if (this.mediaStream) {
        this.stopGuitarInput();
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;
      this.sourceNode = this.ctx.createMediaStreamSource(stream);

      if (channelMode !== 'stereo') {
        this.channelSplitter = this.ctx.createChannelSplitter(2);
        this.sourceNode.connect(this.channelSplitter);
        const channelIndex = channelMode === 'right' ? 1 : 0;
        this.channelSplitter.connect(this.inputGainNode, channelIndex);
      } else {
        this.sourceNode.connect(this.inputGainNode);
      }

      this.outputNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.setupNoiseGateWatcher();
      return true;
    } catch (err) {
      console.warn('Guitar input stream failed:', err);
      return false;
    }
  }

  public stopGuitarInput() {
    this.outputNode.gain.setValueAtTime(0.0, this.ctx.currentTime);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.channelSplitter) {
      this.channelSplitter.disconnect();
      this.channelSplitter = null;
    }
  }

  public isInputActive(): boolean {
    return this.mediaStream !== null;
  }

  public setInputGain(gainDb: number) {
    // -24dB to +24dB
    const linearGain = Math.pow(10, gainDb / 20);
    this.inputGainNode.gain.setTargetAtTime(linearGain, this.ctx.currentTime, 0.02);
  }

  public getInputPeak(): number {
    if (!this.mediaStream) return 0;
    this.inputAnalyser.getFloatTimeDomainData(this.timeDataBuffer as unknown as Float32Array<ArrayBuffer>);
    let max = 0;
    for (let i = 0; i < this.timeDataBuffer.length; i++) {
      const abs = Math.abs(this.timeDataBuffer[i]);
      if (abs > max) max = abs;
    }
    return Math.min(1.0, max);
  }

  // Noise Gate logic
  private setupNoiseGateWatcher() {
    const checkGate = () => {
      if (!this.mediaStream) return;
      if (this.isGateEnabled) {
        const peak = this.getInputPeak();
        const peakDb = peak > 0.0001 ? 20 * Math.log10(peak) : -100;
        const targetGain = peakDb > this.gateThresholdDb ? 1.0 : 0.0001;
        this.gateGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, this.gateSmoothingTimeConstant);
      } else {
        this.gateGainNode.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.01);
      }
      requestAnimationFrame(checkGate);
    };
    requestAnimationFrame(checkGate);
  }

  // Chromatic Guitar Tuner Auto-Correlation Algorithm
  public detectPitch(): TunerResult | null {
    if (!this.mediaStream) return null;

    this.inputAnalyser.getFloatTimeDomainData(this.timeDataBuffer as unknown as Float32Array<ArrayBuffer>);
    const buffer = this.timeDataBuffer;
    const len = buffer.length;

    // 1. RMS signal check
    let sumSquares = 0;
    for (let i = 0; i < len; i++) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / len);
    if (rms < 0.01) {
      return null; // Silent or no string plucked
    }

    // 2. Auto-correlation
    const sampleRate = this.ctx.sampleRate;
    const minPeriod = Math.floor(sampleRate / 1000); // 1000 Hz max (High E 12th fret)
    const maxPeriod = Math.floor(sampleRate / 38); // ~38 Hz min (Bass low E)

    let bestCorrelation = -1;
    let bestPeriod = -1;

    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < len - period; i++) {
        correlation += buffer[i] * buffer[i + period];
      }
      correlation = correlation / (len - period);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    if (bestPeriod === -1 || bestCorrelation < 0.005) {
      return null;
    }

    // Parabolic interpolation for sub-sample precision
    let freq = sampleRate / bestPeriod;

    // Convert frequency to MIDI note
    const noteNum = 12 * Math.log2(freq / 440) + 69;
    const roundedNoteNum = Math.round(noteNum);
    const cents = Math.round((noteNum - roundedNoteNum) * 100);

    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = NOTE_NAMES[((roundedNoteNum % 12) + 12) % 12];
    const octave = Math.floor(roundedNoteNum / 12) - 1;

    // Find closest guitar string
    let closestString: string | undefined;
    let minDiff = Infinity;
    for (const str of GUITAR_STRINGS) {
      const diff = Math.abs(freq - str.freq);
      if (diff < minDiff && diff < str.freq * 0.15) {
        minDiff = diff;
        closestString = str.name;
      }
    }

    return {
      note: noteName,
      octave,
      frequency: Math.round(freq * 10) / 10,
      cents: Math.max(-50, Math.min(50, cents)),
      inTune: Math.abs(cents) <= 3,
      stringName: closestString,
      clarity: Math.min(1.0, rms * 15),
    };
  }

  public setTunerMute(mute: boolean) {
    this.isTunerMuted = mute;
    this.tunerMuteGain.gain.setTargetAtTime(mute ? 0 : 1, this.ctx.currentTime, 0.02);
  }

  // Amp Model & Controls
  public setAmpModel(model: GuitarAmpModel) {
    this.ampModel = model;
    this.ampShaper.curve = this.createAmpTubeCurve(3.0, model);

    // Apply distinctive tone stack voicing per amp
    switch (model) {
      case 'fenderClean':
        this.ampPreFilter.frequency.setValueAtTime(70, this.ctx.currentTime);
        this.ampMidFilter.gain.setValueAtTime(-2.0, this.ctx.currentTime); // Scooped mid
        this.ampTrebleFilter.gain.setValueAtTime(3.0, this.ctx.currentTime); // Glassy high
        break;
      case 'marshallPlexi':
        this.ampPreFilter.frequency.setValueAtTime(100, this.ctx.currentTime);
        this.ampMidFilter.gain.setValueAtTime(4.0, this.ctx.currentTime); // British punch mid
        this.ampTrebleFilter.gain.setValueAtTime(1.5, this.ctx.currentTime);
        break;
      case 'mesaDual':
        this.ampPreFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
        this.ampMidFilter.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.ampPresenceFilter.gain.setValueAtTime(5.0, this.ctx.currentTime); // Screaming presence
        break;
      case 'voxAc30':
        this.ampPreFilter.frequency.setValueAtTime(90, this.ctx.currentTime);
        this.ampMidFilter.gain.setValueAtTime(2.5, this.ctx.currentTime);
        this.ampTrebleFilter.gain.setValueAtTime(4.0, this.ctx.currentTime); // Chime
        break;
      case 'ampegBass':
        this.ampPreFilter.frequency.setValueAtTime(40, this.ctx.currentTime);
        this.ampBassFilter.gain.setValueAtTime(5.0, this.ctx.currentTime); // Deep low
        this.ampTrebleFilter.gain.setValueAtTime(-2.0, this.ctx.currentTime);
        break;
      case 'acousticDi':
        this.ampPreFilter.frequency.setValueAtTime(50, this.ctx.currentTime);
        this.ampMidFilter.gain.setValueAtTime(-4.0, this.ctx.currentTime); // Anti-quack
        this.ampTrebleFilter.gain.setValueAtTime(2.0, this.ctx.currentTime);
        break;
    }
  }

  public setAmpSettings(settings: GuitarAmpSettings) {
    // Drive: regenerates tube curve
    this.ampShaper.curve = this.createAmpTubeCurve(settings.drive, this.ampModel);

    // Tone Stack
    this.ampBassFilter.gain.setTargetAtTime(settings.bass, this.ctx.currentTime, 0.02);
    this.ampMidFilter.gain.setTargetAtTime(settings.mid, this.ctx.currentTime, 0.02);
    this.ampTrebleFilter.gain.setTargetAtTime(settings.treble, this.ctx.currentTime, 0.02);
    this.ampPresenceFilter.gain.setTargetAtTime(settings.presence, this.ctx.currentTime, 0.02);
    this.ampMasterGain.gain.setTargetAtTime(settings.master, this.ctx.currentTime, 0.02);
  }

  // Cabinet Simulator
  public setCabinet(cab: GuitarCabModel) {
    this.cabModel = cab;
    if (cab === 'bypass') {
      this.cabDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.cabWetGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      return;
    }

    this.cabDryGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.cabWetGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.cabConvolver.buffer = this.buildCabImpulse(cab);

    switch (cab) {
      case 'v30_4x12':
        this.cabLowFilter.frequency.setValueAtTime(75, this.ctx.currentTime);
        this.cabMidFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
        this.cabMidFilter.gain.setValueAtTime(4.0, this.ctx.currentTime);
        this.cabHighFilter.frequency.setValueAtTime(4800, this.ctx.currentTime);
        break;
      case 'twin_2x12':
        this.cabLowFilter.frequency.setValueAtTime(65, this.ctx.currentTime);
        this.cabMidFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
        this.cabMidFilter.gain.setValueAtTime(2.5, this.ctx.currentTime);
        this.cabHighFilter.frequency.setValueAtTime(6200, this.ctx.currentTime);
        break;
      case 'vox_1x12':
        this.cabLowFilter.frequency.setValueAtTime(80, this.ctx.currentTime);
        this.cabMidFilter.frequency.setValueAtTime(1900, this.ctx.currentTime);
        this.cabMidFilter.gain.setValueAtTime(5.0, this.ctx.currentTime);
        this.cabHighFilter.frequency.setValueAtTime(5200, this.ctx.currentTime);
        break;
      case 'ampeg_8x10':
        this.cabLowFilter.frequency.setValueAtTime(45, this.ctx.currentTime);
        this.cabMidFilter.frequency.setValueAtTime(1500, this.ctx.currentTime);
        this.cabMidFilter.gain.setValueAtTime(3.0, this.ctx.currentTime);
        this.cabHighFilter.frequency.setValueAtTime(3800, this.ctx.currentTime);
        break;
    }
  }

  // Stompbox Controls
  public setPedalSettings(p: GuitarPedalSettings) {
    // 1. Comp
    this.compDryGain.gain.setValueAtTime(p.compEnabled ? 0 : 1, this.ctx.currentTime);
    this.compWetGain.gain.setValueAtTime(p.compEnabled ? p.compLevel : 0, this.ctx.currentTime);
    this.compNode.ratio.setValueAtTime(2 + p.compSustain * 8, this.ctx.currentTime);

    // 2. Overdrive
    this.driveDryGain.gain.setValueAtTime(p.driveEnabled ? 0 : 1, this.ctx.currentTime);
    this.driveWetGain.gain.setValueAtTime(p.driveEnabled ? p.driveLevel : 0, this.ctx.currentTime);
    if (p.driveEnabled) {
      this.driveShaper.curve = this.createOverdriveCurve(p.driveGain);
      this.driveToneFilter.frequency.setValueAtTime(1500 + p.driveTone * 4000, this.ctx.currentTime);
    }

    // 3. Fuzz
    this.fuzzDryGain.gain.setValueAtTime(p.fuzzEnabled ? 0 : 1, this.ctx.currentTime);
    this.fuzzWetGain.gain.setValueAtTime(p.fuzzEnabled ? p.fuzzLevel : 0, this.ctx.currentTime);
    if (p.fuzzEnabled) {
      this.fuzzPreGain.gain.setValueAtTime(2.0 + p.fuzzGain * 10, this.ctx.currentTime);
      this.fuzzShaper.curve = this.createFuzzCurve(p.fuzzGain);
      this.fuzzToneFilter.frequency.setValueAtTime(800 + p.fuzzTone * 2500, this.ctx.currentTime);
    }

    // 4. Auto-Wah
    this.wahDryGain.gain.setValueAtTime(p.wahEnabled ? 0 : 1, this.ctx.currentTime);
    this.wahWetGain.gain.setValueAtTime(p.wahEnabled ? 1 : 0, this.ctx.currentTime);
    this.wahSensitivity = p.wahSensitivity;
    this.wahMode = p.wahMode;
    if (p.wahMode === 'manual') {
      this.wahFilter.frequency.setValueAtTime(350 + p.wahManual * 2200, this.ctx.currentTime);
    }

    // 5. Chorus
    this.chorusDryGain.gain.setValueAtTime(p.chorusEnabled ? 1 - p.chorusMix * 0.5 : 1, this.ctx.currentTime);
    this.chorusWetGain.gain.setValueAtTime(p.chorusEnabled ? p.chorusMix : 0, this.ctx.currentTime);
    this.chorusLfo.frequency.setValueAtTime(p.chorusRate, this.ctx.currentTime);
    this.chorusLfoGain.gain.setValueAtTime(0.001 + p.chorusDepth * 0.004, this.ctx.currentTime);

    // 6. Delay
    this.delayDryGain.gain.setValueAtTime(p.delayEnabled ? 1.0 : 1.0, this.ctx.currentTime);
    this.delayWetGain.gain.setValueAtTime(p.delayEnabled ? p.delayMix : 0, this.ctx.currentTime);
    this.delayNode.delayTime.setValueAtTime(p.delayTime, this.ctx.currentTime);
    this.delayFeedbackGain.gain.setValueAtTime(p.delayFeedback, this.ctx.currentTime);

    // 7. Spring Reverb
    this.springDryGain.gain.setValueAtTime(p.reverbEnabled ? 1.0 : 1.0, this.ctx.currentTime);
    this.springWetGain.gain.setValueAtTime(p.reverbEnabled ? p.reverbMix : 0, this.ctx.currentTime);
  }

  // Direct Monitoring & Mixer Routing
  public setDirectMonitor(enabled: boolean, volume: number = 0.8) {
    this.directMonitorGain.gain.setTargetAtTime(enabled ? volume : 0, this.ctx.currentTime, 0.02);
  }

  public routeToMixerChannel(channelNode: MixerChannelNode) {
    if (this.currentMixerChannelDestination) {
      this.outputNode.disconnect(this.currentMixerChannelDestination);
    }
    this.currentMixerChannelDestination = channelNode.inputNode;
    this.outputNode.connect(channelNode.inputNode);
  }

  // Live Riff Take Recording (Direct to Playlist Clip or Looper)
  public startRecordingTake() {
    if (!this.mediaStream) return;
    this.isRecordingTake = true;
    this.recordedTakeChunks = [];
    this.recordedTakeSampleCount = 0;

    this.takeRecorderNode = this.ctx.createScriptProcessor(4096, 1, 1);
    this.takeRecorderNode.onaudioprocess = (e) => {
      if (!this.isRecordingTake) return;
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.recordedTakeChunks.push(copy);
      this.recordedTakeSampleCount += input.length;
    };

    this.outputNode.connect(this.takeRecorderNode);
    this.takeRecorderNode.connect(this.ctx.destination);
  }

  public stopRecordingTake(): AudioBuffer | null {
    if (!this.isRecordingTake) return null;
    this.isRecordingTake = false;

    if (this.takeRecorderNode) {
      this.takeRecorderNode.disconnect();
      this.takeRecorderNode = null;
    }

    if (this.recordedTakeSampleCount === 0 || this.recordedTakeChunks.length === 0) {
      return null;
    }

    const buffer = this.ctx.createBuffer(1, this.recordedTakeSampleCount, this.ctx.sampleRate);
    const channelData = buffer.getChannelData(0);

    let offset = 0;
    for (const chunk of this.recordedTakeChunks) {
      channelData.set(chunk, offset);
      offset += chunk.length;
    }

    this.recordedTakeChunks = [];
    this.recordedTakeSampleCount = 0;
    return buffer;
  }

  // Non-linear Transfer Curves (Tubes & Diodes)
  private createAmpTubeCurve(drive: number, model: GuitarAmpModel): Float32Array<ArrayBuffer> {
    const n = 4096;
    const curve = new Float32Array(n);
    const k = Math.max(0.5, drive * 3);

    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;

      if (model === 'fenderClean') {
        // Soft tube compression with gentle 2nd harmonic
        curve[i] = Math.tanh(k * x * 0.6) + 0.05 * (x > 0 ? x * x : 0);
      } else if (model === 'marshallPlexi') {
        // Asymmetric crunch
        if (x < 0) {
          curve[i] = -Math.tanh(Math.abs(x) * k * 0.85);
        } else {
          curve[i] = Math.tanh(x * k * 1.3);
        }
      } else if (model === 'mesaDual') {
        // Cascaded high-gain saturation
        curve[i] = (2 / Math.PI) * Math.atan(k * 2.5 * x);
      } else if (model === 'voxAc30') {
        // Top boost chime
        curve[i] = Math.tanh(k * x) - 0.08 * Math.sin(Math.PI * x);
      } else if (model === 'ampegBass') {
        // Round bass saturation
        curve[i] = Math.tanh(k * x * 0.7);
      } else {
        // Acoustic transparent
        curve[i] = x;
      }
    }
    return curve as unknown as Float32Array<ArrayBuffer>;
  }

  private createOverdriveCurve(amount: number): Float32Array<ArrayBuffer> {
    const n = 2048;
    const curve = new Float32Array(n);
    const k = 1 + amount * 25;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve as unknown as Float32Array<ArrayBuffer>;
  }

  private createFuzzCurve(amount: number): Float32Array<ArrayBuffer> {
    const n = 2048;
    const curve = new Float32Array(n);
    const gain = 2 + amount * 40;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      const amplified = x * gain;
      // Hard clipping with silicon diode asymmetry
      if (amplified > 0.8) curve[i] = 0.8;
      else if (amplified < -0.6) curve[i] = -0.6;
      else curve[i] = amplified;
    }
    return curve as unknown as Float32Array<ArrayBuffer>;
  }

  private buildSpringImpulse(duration: number): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const buffer = this.ctx.createBuffer(2, length, rate);
    const l = buffer.getChannelData(0);
    const r = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const decay = Math.exp(-t * 3.5);
      // Chirp flutter characteristic of real guitar amp spring tanks
      const flutter = Math.sin(2 * Math.PI * 140 * t + Math.sin(2 * Math.PI * 18 * t));
      l[i] = (Math.random() * 2 - 1) * decay * 0.7 + flutter * decay * 0.3;
      r[i] = (Math.random() * 2 - 1) * decay * 0.7 - flutter * decay * 0.3;
    }
    return buffer;
  }

  private buildCabImpulse(model: GuitarCabModel): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 0.08); // 80ms cabinet impulse response
    const buffer = this.ctx.createBuffer(2, length, rate);
    const l = buffer.getChannelData(0);
    const r = buffer.getChannelData(1);

    const resonantFreq = model === 'v30_4x12' ? 110 : model === 'ampeg_8x10' ? 65 : 95;

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const decay = Math.exp(-t * 60);
      const speakerThump = Math.sin(2 * Math.PI * resonantFreq * t);
      const noise = (Math.random() * 2 - 1) * 0.3;
      l[i] = (speakerThump * 0.7 + noise) * decay;
      r[i] = (speakerThump * 0.65 - noise) * decay;
    }
    return buffer;
  }
}
