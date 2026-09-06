export type TrackType = 'drum' | 'synth' | 'instrument' | 'sampler';

export type DrumKitId =
  | 'trap'
  | 'tr808'
  | 'linndrum'
  | 'lofi'
  | 'synthwave'
  | 'house'
  | 'acoustic'
  | 'glitch';

export type InstrumentCategory =
  | 'keys'
  | 'bass'
  | 'strings'
  | 'guitars'
  | 'synths'
  | 'pads'
  | 'drums'
  | 'fx';

export interface InstrumentDefinition {
  id: string;
  name: string;
  category: InstrumentCategory;
  description: string;
  defaultOctave: number;
  color: string;
  tags: string[];
}

export type DrumSoundId =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'hihat_closed'
  | 'hihat_open'
  | '808'
  | 'tom'
  | 'rim'
  | 'crash'
  | 'fx';

export interface StepData {
  active: boolean;
  velocity: number; // 0.0 to 1.0
  pitchOffset?: number; // semitones (-12 to +12)
  ratchetCount?: 1 | 2 | 3 | 4 | 8; // sub-step subdivision
  velocityRamp?: 'up' | 'down' | 'flat'; // volume ramp across ratchet
  pitchRamp?: number; // semitone slide over the ratchet
}

export interface PianoNote {
  id: string;
  trackId: string;
  midiNote: number; // 0 to 127 (e.g. 60 = Middle C)
  startStep: number; // in 16th steps (0 to 63)
  durationSteps: number; // length in 16th steps (minimum 1)
  velocity: number; // 0.0 to 1.0
  isSlide?: boolean; // FL Studio style slide note
}

export interface ChannelTrack {
  id: string;
  name: string;
  type: TrackType;
  soundId?: DrumSoundId;
  drumKitId?: DrumKitId;
  instrumentId?: string;
  synthPresetId?: string;
  color: string;
  volume: number; // 0.0 to 1.0
  pan: number; // -1.0 to 1.0
  mute: boolean;
  solo: boolean;
  mixerChannelIndex: number; // 0 = Master, 1-8 = Inserts
  // Step data keyed by patternId -> array of StepData
  steps: Record<string, StepData[]>;
  // Custom audio sample for sampler tracks
  customAudioUrl?: string;
  customAudioName?: string;
}

export interface Pattern {
  id: string;
  name: string;
  color: string;
  lengthSteps: number; // default 16 or 32
  // Piano roll notes contained in this pattern
  notes: PianoNote[];
}

export interface PlaylistClip {
  id: string;
  trackIndex: number; // arrangement row (0 to 15)
  patternId?: string; // if type === 'pattern'
  looperDeckId?: string; // if type === 'audio'
  automationClipId?: string; // if type === 'automation'
  audioBufferIndex?: number;
  name: string;
  startBar: number; // start position in bars (0-indexed, float or int)
  lengthBars: number; // duration in bars
  color: string;
  type: 'pattern' | 'audio' | 'automation';
  audioBlobUrl?: string;
  playbackRate?: number; // playback rate / speed factor (0.25 to 4.0)
  slipOffsetSeconds?: number; // internal offset within the audio buffer (seconds)
  fadeInBars?: number; // fade in length in bars
  fadeOutBars?: number; // fade out length in bars
  isReversed?: boolean; // whether audio buffer plays backwards
}

export interface PlaylistTrack {
  id: string;
  name: string;
  color: string;
  mute: boolean;
  solo: boolean;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  isAutomationTrack?: boolean;
  isArmed?: boolean;
  inputSource?: 'mic' | 'guitar' | 'master';
}

export interface LooperDeck {
  id: string;
  deckNumber: number; // 1 to 4
  name: string;
  status: 'empty' | 'recording' | 'playing' | 'overdubbing' | 'paused';
  recordedBars: number; // 1, 2, 4, 8
  audioBuffer: AudioBuffer | null;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  reverse: boolean;
  halfSpeed: boolean;
  pitchShift: number; // semitones (-12 to +12)
  filter: number; // DJ Dual Filter: -1 (Lowpass) to +1 (Highpass), 0 = Flat
  stutterRate: number; // 0 = normal, 0.5 = 1/2 bar, 0.25 = 1/4 bar, 0.125 = 1/8 bar, 0.0625 = 1/16 bar
  source: 'mic' | 'guitar' | 'master';
  waveform: number[]; // normalized amplitude peaks for drawing
}

export interface ParametricEqBand {
  type: BiquadFilterType;
  frequency: number; // Hz
  gain: number; // dB (-18 to +18)
  q: number; // 0.1 to 10
}

export interface FxSettings {
  eqEnabled: boolean;
  eqBands: ParametricEqBand[];
  
  reverbEnabled: boolean;
  reverbDecay: number; // 0.1 to 10 seconds
  reverbMix: number; // 0 to 1
  reverbDamp: number; // 0 to 1
  
  delayEnabled: boolean;
  delayTime: number; // seconds or tempo-synced fraction
  delayFeedback: number; // 0 to 0.95
  delayMix: number; // 0 to 1
  delayPingPong: boolean;
  
  distortionEnabled: boolean;
  distortionDrive: number; // 0 to 1
  distortionType: 'soft' | 'hard' | 'tube' | 'fuzz';
  distortionMix: number;
  
  compressorEnabled: boolean;
  compressorThreshold: number; // -60 to 0 dB
  compressorRatio: number; // 1 to 20
  compressorAttack: number; // 0.001 to 1 s
  compressorRelease: number; // 0.01 to 1 s
  compressorMakeup: number; // 0 to 20 dB
  
  chorusEnabled: boolean;
  chorusRate: number; // 0.1 to 8 Hz
  chorusDepth: number; // 0 to 1
  chorusMix: number; // 0 to 1

  filterEnabled: boolean;
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  filterCutoff: number; // 20 to 20000 Hz
  filterResonance: number; // 0 to 20
}

export interface MixerChannel {
  id: string;
  name: string;
  color: string;
  volume: number; // 0.0 to 1.25 (1.0 = 0dB)
  pan: number; // -1.0 to 1.0
  mute: boolean;
  solo: boolean;
  peakL: number; // current peak 0 to 1
  peakR: number;
  effects: FxSettings;
}

export interface SynthParameters {
  osc1Waveform: 'sine' | 'triangle' | 'sawtooth' | 'square';
  osc1Detune: number; // cents (-100 to +100)
  osc1Octave: number; // -2 to +2
  osc1Volume: number; // 0 to 1

  osc2Waveform: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'noise';
  osc2Detune: number; // cents
  osc2Octave: number; // -2 to +2
  osc2Volume: number; // 0 to 1

  subOscVolume: number; // 0 to 1

  // Filter
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  filterCutoff: number; // Hz (20 to 20000)
  filterResonance: number; // Q (0.1 to 20)
  filterEnvAmount: number; // -10000 to +10000

  // Amp Envelope (ADSR)
  ampAttack: number; // seconds (0.001 to 5)
  ampDecay: number; // seconds (0.01 to 5)
  ampSustain: number; // 0 to 1
  ampRelease: number; // seconds (0.01 to 5)

  // Filter Envelope (ADSR)
  filterAttack: number;
  filterDecay: number;
  filterSustain: number;
  filterRelease: number;

  // LFO
  lfoWaveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
  lfoRate: number; // Hz (0.1 to 20)
  lfoDepth: number; // 0 to 1
  lfoDestination: 'none' | 'cutoff' | 'pitch' | 'pan' | 'volume';

  glide: number; // Portamento time (0 to 0.5s)
  polyphony: number; // Max active voices (1 to 16)
}

export type PlaybackMode = 'pattern' | 'song';
export type ViewTab =
  | 'channelRack'
  | 'pianoRoll'
  | 'playlist'
  | 'mixer'
  | 'synth'
  | 'looper'
  | 'fxRack'
  | 'browser'
  | 'guitarRig'
  | 'vstPatchbay'
  | 'slicex'
  | 'mixingDoctor'
  | 'midiLearn'
  | 'newTone'
  | 'stemSeparator';

export type MusicalScale = 
  | 'chromatic'
  | 'major'
  | 'minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'pentatonicMajor'
  | 'pentatonicMinor'
  | 'blues'
  | 'harmonicMinor'
  | 'japanese';

export type RootNote = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

// =========================================================================
// 1. AUTOMATION ARCHITECTURE
// =========================================================================
export type AutomationTargetType =
  | 'mixerVolume'
  | 'mixerPan'
  | 'mixerFilterCutoff'
  | 'mixerFilterRes'
  | 'mixerReverbMix'
  | 'mixerDelayMix'
  | 'mixerDistortionDrive'
  | 'synthCutoff'
  | 'synthResonance'
  | 'synthLfoRate'
  | 'masterVolume';

export interface AutomationTarget {
  type: AutomationTargetType;
  channelIndex?: number; // 0 = Master, 1-8 = Inserts
  label: string;
}

export interface AutomationNode {
  id: string;
  bar: number; // bar position (e.g. 0.0, 1.5, 4.0)
  value: number; // 0.0 to 1.0 normalized
  tension?: number; // -1.0 to 1.0 curvature (0 = linear)
}

export interface AutomationClip {
  id: string;
  name: string;
  color: string;
  trackIndex: number;
  startBar: number;
  lengthBars: number;
  target: AutomationTarget;
  nodes: AutomationNode[];
}

// =========================================================================
// 2. SIDECHAIN DUCKING & PEAK CONTROLLER
// =========================================================================
export interface SidechainRoute {
  id: string;
  enabled: boolean;
  name: string;
  sourceChannelIndex: number; // e.g. Kick (Channel 1)
  targetChannelIndex: number; // e.g. 808 Bass (Channel 2)
  thresholdDb: number; // -40 to 0 dB
  duckingDepthDb: number; // 0 to 24 dB
  attackMs: number; // 0.1 to 50 ms
  releaseMs: number; // 10 to 500 ms
  mode: 'volume' | 'lowShelf';
}

// =========================================================================
// 3. INTELLIGENT TRANSIENT SLICER (SLICEX)
// =========================================================================
export interface AudioSlice {
  id: string;
  sliceIndex: number;
  startSample: number;
  endSample: number;
  startTime: number; // in seconds
  duration: number; // in seconds
  color: string;
  pitchOffset?: number;
  buffer?: AudioBuffer;
}

export interface SlicexSession {
  audioBuffer: AudioBuffer | null;
  fileName: string;
  slices: AudioSlice[];
  selectedSliceId: string | null;
  sensitivity: number; // 0 to 100
  bpm: number;
  bars: number;
}

// =========================================================================
// 4. AI MIXING DOCTOR & SPECTRAL COLLISION
// =========================================================================
export interface SpectralCollisionAlert {
  id: string;
  channelA: number;
  channelB: number;
  channelAName: string;
  channelBName: string;
  freqMin: number;
  freqMax: number;
  severity: 'warning' | 'critical';
  description: string;
  suggestedAction: 'sidechain' | 'notchEq' | 'highpass';
}

// =========================================================================
// 5. HARDWARE MIDI LEARN & CC MAPPING
// =========================================================================
export interface MidiCcMapping {
  id: string;
  ccNumber: number; // 0 to 127
  channel: number; // 0 for any, 1 to 16
  name: string;
  targetType: 'mixerVolume' | 'mixerPan' | 'mixerMute' | 'synthCutoff' | 'vstParam' | 'tempo';
  channelIndex?: number;
  paramId?: string;
  min: number;
  max: number;
}

// =========================================================================
// 6. IMPULSE RESPONSE CONVOLUTION
// =========================================================================
export interface ImpulseResponseMeta {
  id: string;
  name: string;
  category: 'cabinet' | 'space';
  description: string;
  sampleRate: number;
}

// =========================================================================
// 7. VOCAL PITCH CORRECTION (NEWTONE / MELODYNE)
// =========================================================================
export interface PitchNoteSegment {
  id: string;
  startIndex: number;
  endIndex: number;
  startTime: number;
  duration: number;
  detectedMidi: number;
  targetMidi: number;
  centDeviation: number;
  trajectory: number[];
  volume: number;
}

export interface PitchCorrectionSession {
  audioBuffer: AudioBuffer | null;
  fileName: string;
  segments: PitchNoteSegment[];
  selectedSegmentId: string | null;
  correctionAmount: number; // 0 to 100%
  fineTuneCents: number; // -50 to +50
  formantShift: number; // -12 to +12
}

// =========================================================================
// 8. IN-BROWSER AI STEM SEPARATION
// =========================================================================
export interface StemSeparationResult {
  vocals: AudioBuffer | null;
  drums: AudioBuffer | null;
  bass: AudioBuffer | null;
  other: AudioBuffer | null;
  fileName: string;
  duration: number;
}

// =========================================================================
// 9. INDEXEDDB PROJECT PERSISTENCE
// =========================================================================
export interface StoredProjectMeta {
  id: string;
  name: string;
  bpm: number;
  updatedAt: number;
  trackCount: number;
  durationBars: number;
}

// =========================================================================
// 10. RADIO MASTERING SUITE & LUFS METER
// =========================================================================
export interface MasteringParameters {
  enabled: boolean;
  inputGainDb: number; // -12 to +12 dB
  targetLufs: number; // -14 (Spotify), -9 (Club), -7 (Loud), etc.
  ceilingDb: number; // -1.0 to -0.1 dB True Peak
  stereoWidth: number; // 0.0 (Mono) to 2.0 (Ultra-Wide, 1.0 = normal)
  monoSubEnabled: boolean; // Mono bass below 120Hz
  softClipWarmth: number; // 0 to 100%
  limiterReleaseMs: number; // 10 to 500ms
}

export interface LufsMeterResult {
  momentaryLufs: number; // -70 to 0 LUFS (400ms window)
  shortTermLufs: number; // -70 to 0 LUFS (3s window)
  integratedLufs: number; // Program LUFS
  truePeakDb: number; // True peak dBFS
  gainReductionDb: number; // Dynamic limiter reduction
}

// =========================================================================
// 11. VINTAGE TAPE / VINYL COLOR FX ("Eve RC-20 Color")
// =========================================================================
export interface TapeColorParameters {
  enabled: boolean;
  wowFlutter: number; // 0 to 100%
  flutterRate: number; // 0.1 to 8 Hz
  tapeDrive: number; // 0 to 100% (warmth/saturation)
  vinylNoise: number; // 0 to 100% (dust/crackle/hiss)
  vinylTone: number; // 0 (Dark) to 100 (Bright)
  dropouts: number; // 0 to 100% (aged tape micro-dips)
  spaceReverb: number; // 0 to 100% (spring/diffuser)
  mix: number; // 0 to 100% dry/wet
}

// =========================================================================
// 12. AI BEATBOX-TO-MIDI TRANSCRIBER
// =========================================================================
export type DrumHitClass = 'kick' | 'snare' | 'hihat';

export interface BeatboxHit {
  id: string;
  time: number; // in seconds from start
  step: number; // quantized 16th step (0 to 31)
  drumClass: DrumHitClass;
  confidence: number; // 0.0 to 1.0
  velocity: number; // 0.0 to 1.0
}

export interface BeatboxDetectionResult {
  audioBuffer: AudioBuffer;
  duration: number;
  hits: BeatboxHit[];
  bpm: number;
}

// =========================================================================
// 13. CHORD PROGRESSION ARCHITECT & SMART VOICE LEADING
// =========================================================================
export interface VoicedChord {
  name: string; // e.g. "Dm9", "G13", "Cmaj9"
  romanNumeral: string; // e.g. "ii9", "V13", "Imaj9"
  midiNotes: number[]; // optimal voice-led chromatic pitches
  rootMidi: number;
  durationSteps: number; // default 4 or 8
}

export interface ChordProgressionTemplate {
  id: string;
  name: string;
  genre: 'neoSoul' | 'darkTrap' | 'drill' | 'synthwave' | 'cityPop' | 'lofi' | 'cinematic' | 'rnb';
  desc: string;
  key: string;
  scale: string;
  chords: {
    name: string;
    roman: string;
    intervals: number[]; // relative to root
    inversion?: number;
  }[];
}
