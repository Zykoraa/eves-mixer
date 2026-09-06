import { MusicalScale, RootNote, SynthParameters, FxSettings } from '../types/daw';

export const NOTE_NAMES: RootNote[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALE_INTERVALS: Record<MusicalScale, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  japanese: [0, 1, 5, 7, 8],
};

export function isNoteInScale(midiNote: number, root: RootNote, scale: MusicalScale): boolean {
  if (scale === 'chromatic') return true;
  const rootIndex = NOTE_NAMES.indexOf(root);
  const noteIndex = midiNote % 12;
  const interval = (noteIndex - rootIndex + 12) % 12;
  return SCALE_INTERVALS[scale].includes(interval);
}

export function midiToNoteName(midiNote: number): string {
  const name = NOTE_NAMES[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return `${name}${octave}`;
}

export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

export const CHORD_TEMPLATES: Record<string, { name: string; intervals: number[] }> = {
  maj: { name: 'Major', intervals: [0, 4, 7] },
  min: { name: 'Minor', intervals: [0, 3, 7] },
  maj7: { name: 'Major 7th', intervals: [0, 4, 7, 11] },
  min7: { name: 'Minor 7th', intervals: [0, 3, 7, 10] },
  dom7: { name: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  sus4: { name: 'Suspended 4th', intervals: [0, 5, 7] },
  dim: { name: 'Diminished', intervals: [0, 3, 6] },
  add9: { name: 'Add 9th', intervals: [0, 4, 7, 14] },
};

export const DEFAULT_SYNTH_PARAMS: SynthParameters = {
  osc1Waveform: 'sawtooth',
  osc1Detune: -5,
  osc1Octave: 0,
  osc1Volume: 0.75,

  osc2Waveform: 'square',
  osc2Detune: 5,
  osc2Octave: 0,
  osc2Volume: 0.5,

  subOscVolume: 0.3,

  filterType: 'lowpass',
  filterCutoff: 3200,
  filterResonance: 3.5,
  filterEnvAmount: 2000,

  ampAttack: 0.01,
  ampDecay: 0.3,
  ampSustain: 0.6,
  ampRelease: 0.4,

  filterAttack: 0.02,
  filterDecay: 0.4,
  filterSustain: 0.3,
  filterRelease: 0.5,

  lfoWaveform: 'sine',
  lfoRate: 3.0,
  lfoDepth: 0.15,
  lfoDestination: 'cutoff',

  glide: 0.02,
  polyphony: 8,
};

export const SYNTH_PRESETS: Record<string, { name: string; params: SynthParameters }> = {
  default_lead: {
    name: 'Cyberpunk Saw Lead',
    params: { ...DEFAULT_SYNTH_PARAMS },
  },
  deep_808: {
    name: 'Neo 808 Sub',
    params: {
      osc1Waveform: 'sine',
      osc1Detune: 0,
      osc1Octave: -2,
      osc1Volume: 0.9,
      osc2Waveform: 'triangle',
      osc2Detune: 0,
      osc2Octave: -1,
      osc2Volume: 0.3,
      subOscVolume: 0.5,
      filterType: 'lowpass',
      filterCutoff: 450,
      filterResonance: 1.0,
      filterEnvAmount: 300,
      ampAttack: 0.005,
      ampDecay: 0.8,
      ampSustain: 0.4,
      ampRelease: 0.6,
      filterAttack: 0.01,
      filterDecay: 0.3,
      filterSustain: 0.2,
      filterRelease: 0.3,
      lfoWaveform: 'sine',
      lfoRate: 1,
      lfoDepth: 0,
      lfoDestination: 'none',
      glide: 0.08,
      polyphony: 1,
    },
  },
  lofi_keys: {
    name: 'Sunset Lo-Fi Keys',
    params: {
      osc1Waveform: 'triangle',
      osc1Detune: -8,
      osc1Octave: 0,
      osc1Volume: 0.8,
      osc2Waveform: 'sine',
      osc2Detune: 8,
      osc2Octave: 1,
      osc2Volume: 0.4,
      subOscVolume: 0.1,
      filterType: 'lowpass',
      filterCutoff: 1800,
      filterResonance: 1.5,
      filterEnvAmount: 800,
      ampAttack: 0.02,
      ampDecay: 0.5,
      ampSustain: 0.3,
      ampRelease: 0.5,
      filterAttack: 0.03,
      filterDecay: 0.6,
      filterSustain: 0.4,
      filterRelease: 0.6,
      lfoWaveform: 'sine',
      lfoRate: 4.5,
      lfoDepth: 0.08,
      lfoDestination: 'pitch', // Subtle tape flutter
      glide: 0,
      polyphony: 8,
    },
  },
  dream_pad: {
    name: 'Ethereal Dream Pad',
    params: {
      osc1Waveform: 'sawtooth',
      osc1Detune: -12,
      osc1Octave: 0,
      osc1Volume: 0.6,
      osc2Waveform: 'triangle',
      osc2Detune: 12,
      osc2Octave: 0,
      osc2Volume: 0.6,
      subOscVolume: 0.2,
      filterType: 'lowpass',
      filterCutoff: 1500,
      filterResonance: 2.0,
      filterEnvAmount: 1500,
      ampAttack: 0.4,
      ampDecay: 0.8,
      ampSustain: 0.8,
      ampRelease: 1.2,
      filterAttack: 0.6,
      filterDecay: 1.0,
      filterSustain: 0.6,
      filterRelease: 1.4,
      lfoWaveform: 'triangle',
      lfoRate: 1.2,
      lfoDepth: 0.2,
      lfoDestination: 'cutoff',
      glide: 0.05,
      polyphony: 8,
    },
  },
  hyperpop_pluck: {
    name: 'Hyperpop Pluck',
    params: {
      osc1Waveform: 'square',
      osc1Detune: -3,
      osc1Octave: 1,
      osc1Volume: 0.8,
      osc2Waveform: 'sawtooth',
      osc2Detune: 4,
      osc2Octave: 1,
      osc2Volume: 0.7,
      subOscVolume: 0.1,
      filterType: 'lowpass',
      filterCutoff: 5000,
      filterResonance: 5.0,
      filterEnvAmount: 4000,
      ampAttack: 0.002,
      ampDecay: 0.18,
      ampSustain: 0.05,
      ampRelease: 0.15,
      filterAttack: 0.002,
      filterDecay: 0.15,
      filterSustain: 0.05,
      filterRelease: 0.12,
      lfoWaveform: 'sawtooth',
      lfoRate: 8,
      lfoDepth: 0.1,
      lfoDestination: 'cutoff',
      glide: 0.01,
      polyphony: 6,
    },
  },
  acid_303: {
    name: 'Acid 303 Bass',
    params: {
      osc1Waveform: 'sawtooth',
      osc1Detune: 0,
      osc1Octave: -1,
      osc1Volume: 0.9,
      osc2Waveform: 'square',
      osc2Detune: 0,
      osc2Octave: -1,
      osc2Volume: 0.4,
      subOscVolume: 0.3,
      filterType: 'lowpass',
      filterCutoff: 1200,
      filterResonance: 12.0, // High resonance screaming filter
      filterEnvAmount: 4500,
      ampAttack: 0.005,
      ampDecay: 0.25,
      ampSustain: 0.2,
      ampRelease: 0.1,
      filterAttack: 0.01,
      filterDecay: 0.2,
      filterSustain: 0.1,
      filterRelease: 0.1,
      lfoWaveform: 'sine',
      lfoRate: 0.5,
      lfoDepth: 0,
      lfoDestination: 'none',
      glide: 0.09,
      polyphony: 1,
    },
  },
};

export const DEFAULT_FX_SETTINGS: FxSettings = {
  eqEnabled: true,
  eqBands: [
    { type: 'highpass', frequency: 30, gain: 0, q: 0.7 },
    { type: 'lowshelf', frequency: 100, gain: 1.5, q: 0.7 },
    { type: 'peaking', frequency: 500, gain: -1.0, q: 1.0 },
    { type: 'peaking', frequency: 2500, gain: 2.0, q: 1.2 },
    { type: 'highshelf', frequency: 8000, gain: 1.0, q: 0.7 },
  ],
  reverbEnabled: false,
  reverbDecay: 2.0,
  reverbMix: 0.25,
  reverbDamp: 0.3,

  delayEnabled: false,
  delayTime: 0.25, // 1/4 note
  delayFeedback: 0.4,
  delayMix: 0.2,
  delayPingPong: true,

  distortionEnabled: false,
  distortionDrive: 0.3,
  distortionType: 'tube',
  distortionMix: 0.4,

  compressorEnabled: true,
  compressorThreshold: -16,
  compressorRatio: 3.5,
  compressorAttack: 0.01,
  compressorRelease: 0.15,
  compressorMakeup: 2.0,

  chorusEnabled: false,
  chorusRate: 1.5,
  chorusDepth: 0.4,
  chorusMix: 0.3,

  filterEnabled: false,
  filterType: 'lowpass',
  filterCutoff: 8000,
  filterResonance: 1.0,
};

// Built-in Inspiration Chord Progressions (in Roman numerals and key intervals)
export interface ChordProgressionTemplate {
  name: string;
  genre: string;
  key: RootNote;
  scale: MusicalScale;
  chords: { name: string; rootOffset: number; intervals: number[] }[];
}

export const INSPIRATION_PROGRESSIONS: ChordProgressionTemplate[] = [
  {
    name: 'Neo-Soul Romance',
    genre: 'R&B / Soul',
    key: 'C',
    scale: 'major',
    chords: [
      { name: 'Cmaj9', rootOffset: 0, intervals: [0, 4, 7, 11, 14] },
      { name: 'Am9', rootOffset: 9, intervals: [0, 3, 7, 10, 14] },
      { name: 'Dm9', rootOffset: 2, intervals: [0, 3, 7, 10, 14] },
      { name: 'G13', rootOffset: 7, intervals: [0, 4, 7, 10, 21] },
    ],
  },
  {
    name: 'Lo-Fi Chill Hop',
    genre: 'Lo-Fi',
    key: 'F',
    scale: 'minor',
    chords: [
      { name: 'Fm7', rootOffset: 0, intervals: [0, 3, 7, 10] },
      { name: 'Bbm7', rootOffset: 5, intervals: [0, 3, 7, 10] },
      { name: 'Eb7', rootOffset: 10, intervals: [0, 4, 7, 10] },
      { name: 'Abmaj7', rootOffset: 3, intervals: [0, 4, 7, 11] },
    ],
  },
  {
    name: 'Dark Trap Melancholy',
    genre: 'Trap',
    key: 'C#',
    scale: 'minor',
    chords: [
      { name: 'C#m', rootOffset: 0, intervals: [0, 3, 7] },
      { name: 'A', rootOffset: 8, intervals: [0, 4, 7] },
      { name: 'F#m', rootOffset: 5, intervals: [0, 3, 7] },
      { name: 'G#m', rootOffset: 7, intervals: [0, 3, 7] },
    ],
  },
  {
    name: 'Synthwave Night Ride',
    genre: 'Synthwave',
    key: 'A',
    scale: 'minor',
    chords: [
      { name: 'Am', rootOffset: 0, intervals: [0, 3, 7] },
      { name: 'F', rootOffset: 8, intervals: [0, 4, 7] },
      { name: 'C', rootOffset: 3, intervals: [0, 4, 7] },
      { name: 'G', rootOffset: 10, intervals: [0, 4, 7] },
    ],
  },
  {
    name: 'Hyperpop Energy',
    genre: 'Pop / EDM',
    key: 'D',
    scale: 'major',
    chords: [
      { name: 'D', rootOffset: 0, intervals: [0, 4, 7] },
      { name: 'A', rootOffset: 7, intervals: [0, 4, 7] },
      { name: 'Bm', rootOffset: 9, intervals: [0, 3, 7] },
      { name: 'G', rootOffset: 5, intervals: [0, 4, 7] },
    ],
  },
];
