export type TrackType = 'drum' | 'synth' | 'sampler';

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
}

export interface PianoNote {
  id: string;
  trackId: string;
  midiNote: number; // 0 to 127 (e.g. 60 = Middle C)
  startStep: number; // in 16th steps (0 to 63)
  durationSteps: number; // length in 16th steps (minimum 1)
  velocity: number; // 0.0 to 1.0
}

export interface ChannelTrack {
  id: string;
  name: string;
  type: TrackType;
  soundId?: DrumSoundId;
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
  audioBufferIndex?: number;
  name: string;
  startBar: number; // start position in bars (0-indexed, float or int)
  lengthBars: number; // duration in bars
  color: string;
  type: 'pattern' | 'audio';
  audioBlobUrl?: string;
}

export interface PlaylistTrack {
  id: string;
  name: string;
  color: string;
  mute: boolean;
  solo: boolean;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
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
export type ViewTab = 'channelRack' | 'pianoRoll' | 'playlist' | 'mixer' | 'synth' | 'looper' | 'fxRack';

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
