import { useState, useEffect } from 'react';
import {
  ChannelTrack,
  Pattern,
  PlaylistClip,
  PlaylistTrack,
  MixerChannel,
  LooperDeck,
  SynthParameters,
  PlaybackMode,
  ViewTab,
  RootNote,
  MusicalScale,
  StepData,
  PianoNote,
  DrumKitId,
  AutomationClip,
  AutomationNode,
  AutomationTarget,
  SidechainRoute,
  AudioSlice,
  SlicexSession,
  SpectralCollisionAlert,
  MidiCcMapping,
  ImpulseResponseMeta,
} from '../types/daw';
import {
  DEFAULT_SYNTH_PARAMS,
  SYNTH_PRESETS,
  DEFAULT_FX_SETTINGS,
  SCALE_INTERVALS,
  NOTE_NAMES,
  INSPIRATION_PROGRESSIONS,
} from '../audio/Presets';
import { AudioEngine } from '../audio/AudioEngine';
import { INSTRUMENT_CATALOG } from '../audio/InstrumentEngine';
import {
  GuitarAmpModel,
  GuitarCabModel,
  GuitarAmpSettings,
  GuitarPedalSettings,
  GuitarEngine,
} from '../audio/GuitarEngine';
import {
  VstPluginId,
  VstPluginInstance,
  VstEngine,
} from '../audio/VstEngine';
import { MidiManager } from '../audio/MidiManager';
import { SidechainManager } from '../audio/SidechainManager';
import { TransientSlicer } from '../audio/TransientSlicer';
import { ConvolutionEngine, FACTORY_IMPULSES } from '../audio/ConvolutionEngine';
import { MixingDoctor } from '../audio/MixingDoctor';
import { MidiLearnManager, MidiLearnTarget } from '../audio/MidiLearnManager';
import { OfflineRenderer } from '../audio/OfflineRenderer';

// Default initial tracks
const CURRENT_STORAGE_VERSION = 'v2_pro_producer';

// Default initial tracks with authentic modern trap/r&b groove
const createInitialTracks = (): ChannelTrack[] => [
  {
    id: 't-kick',
    name: 'Kick Punch',
    type: 'drum',
    soundId: 'kick',
    color: '#ff5722',
    volume: 0.95,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 1,
    steps: {
      'pat-1': [
        { active: true, velocity: 1.0 },   // 0: Downbeat heavy punch
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.9 },   // 7: Syncopated pocket
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 1.0 },   // 10: Driving punch
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.85 },  // 14: Turnaround kick
        { active: false, velocity: 0.8 },
      ],
    },
  },
  {
    id: 't-clap',
    name: 'Crisp Clap',
    type: 'drum',
    soundId: 'clap',
    color: '#ff9800',
    volume: 0.9,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 1,
    steps: {
      'pat-1': [
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 1.0 },   // 4: Beat 2
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 1.0 },   // 12: Beat 4
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
      ],
    },
  },
  {
    id: 't-snare',
    name: 'Snap Snare',
    type: 'drum',
    soundId: 'snare',
    color: '#ffb74d',
    volume: 0.85,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 1,
    steps: {
      'pat-1': [
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.7 },   // 15: Ghost pickup into next bar
      ],
    },
  },
  {
    id: 't-hat-c',
    name: 'Closed Hat',
    type: 'drum',
    soundId: 'hihat_closed',
    color: '#00d2ff',
    volume: 0.8,
    pan: -0.05,
    mute: false,
    solo: false,
    mixerChannelIndex: 2,
    steps: {
      'pat-1': [
        { active: true, velocity: 0.95 },
        { active: true, velocity: 0.40 },
        { active: true, velocity: 0.75 },
        { active: true, velocity: 0.45 },
        { active: true, velocity: 0.90 },
        { active: true, velocity: 0.40 },
        { active: true, velocity: 0.80 },
        { active: true, velocity: 0.50 },
        { active: true, velocity: 0.95 },
        { active: true, velocity: 0.45 },
        { active: true, velocity: 0.75 },
        { active: true, velocity: 0.50 },
        { active: true, velocity: 0.95, pitchOffset: 0 },
        { active: true, velocity: 0.82, pitchOffset: -2 },
        { active: true, velocity: 0.88, pitchOffset: 2 },
        { active: true, velocity: 0.95, pitchOffset: 5 }, // Rolling 32nd-style triplet fill
      ],
    },
  },
  {
    id: 't-hat-o',
    name: 'Open Hat',
    type: 'drum',
    soundId: 'hihat_open',
    color: '#38bdf8',
    volume: 0.75,
    pan: 0.15,
    mute: false,
    solo: false,
    mixerChannelIndex: 2,
    steps: {
      'pat-1': [
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.85 },  // 2: Offbeat sizzle
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.85 },  // 10: Offbeat sizzle
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
      ],
    },
  },
  {
    id: 't-808',
    name: '808 Sub Boom',
    type: 'drum',
    soundId: '808',
    color: '#a855f7',
    volume: 1.0,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 3,
    steps: {
      'pat-1': [
        { active: true, velocity: 1.0, pitchOffset: 0 },   // C root
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.9, pitchOffset: 0 },   // C root
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.95, pitchOffset: -2 }, // Bb slide
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.85, pitchOffset: 3 },  // Eb punch
        { active: false, velocity: 0.8 },
      ],
    },
  },
  {
    id: 't-synth',
    name: 'Eve Lead Synth',
    type: 'synth',
    color: '#ec4899',
    volume: 0.85,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 4,
    steps: {
      'pat-1': Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
    },
  },
  {
    id: 't-rhodes',
    name: 'Vintage Rhodes EP',
    type: 'instrument',
    instrumentId: 'rhodes_ep',
    color: '#0284c7',
    volume: 0.88,
    pan: 0.05,
    mute: false,
    solo: false,
    mixerChannelIndex: 5,
    steps: {
      'pat-1': Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
    },
  },
  {
    id: 't-piano',
    name: 'Concert Grand Piano',
    type: 'instrument',
    instrumentId: 'grand_piano',
    color: '#38bdf8',
    volume: 0.85,
    pan: -0.05,
    mute: false,
    solo: false,
    mixerChannelIndex: 5,
    steps: {
      'pat-1': Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
    },
  },
  {
    id: 't-sample',
    name: 'Vocal / Sample Pad',
    type: 'sampler',
    soundId: 'fx',
    color: '#22c55e',
    volume: 0.75,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 6,
    steps: {
      'pat-1': Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
    },
  },
  {
    id: 't-guitar',
    name: 'Electric Lead Guitar',
    type: 'instrument',
    instrumentId: 'electric_guitar',
    color: '#ef4444',
    volume: 0.85,
    pan: -0.1,
    mute: false,
    solo: false,
    mixerChannelIndex: 7,
    steps: {
      'pat-1': Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
    },
  },
];

const createInitialPatterns = (): Pattern[] => [
  {
    id: 'pat-1',
    name: 'Pattern 1 (Main Trap Groove)',
    color: '#ff763b',
    lengthSteps: 16,
    notes: [
      // Atmospheric Neo-Soul / Dark Trap chords on Rhodes
      { id: 'rh-1', trackId: 't-rhodes', midiNote: 48, startStep: 0, durationSteps: 7, velocity: 0.75 }, // C3
      { id: 'rh-2', trackId: 't-rhodes', midiNote: 55, startStep: 0, durationSteps: 7, velocity: 0.72 }, // G3
      { id: 'rh-3', trackId: 't-rhodes', midiNote: 58, startStep: 0, durationSteps: 7, velocity: 0.72 }, // Bb3
      { id: 'rh-4', trackId: 't-rhodes', midiNote: 62, startStep: 0, durationSteps: 7, velocity: 0.78 }, // D4
      { id: 'rh-5', trackId: 't-rhodes', midiNote: 63, startStep: 0, durationSteps: 7, velocity: 0.80 }, // Eb4 (Cm9)

      { id: 'rh-6', trackId: 't-rhodes', midiNote: 44, startStep: 8, durationSteps: 7, velocity: 0.75 }, // Ab2
      { id: 'rh-7', trackId: 't-rhodes', midiNote: 51, startStep: 8, durationSteps: 7, velocity: 0.75 }, // Eb3
      { id: 'rh-8', trackId: 't-rhodes', midiNote: 55, startStep: 8, durationSteps: 7, velocity: 0.72 }, // G3
      { id: 'rh-9', trackId: 't-rhodes', midiNote: 60, startStep: 8, durationSteps: 7, velocity: 0.80 }, // C4 (Abmaj7)

      // Catchy melodic top-line synth lead hook
      { id: 'syn-1', trackId: 't-synth', midiNote: 67, startStep: 0, durationSteps: 2, velocity: 0.85 }, // G4
      { id: 'syn-2', trackId: 't-synth', midiNote: 70, startStep: 3, durationSteps: 1, velocity: 0.80 }, // Bb4
      { id: 'syn-3', trackId: 't-synth', midiNote: 72, startStep: 4, durationSteps: 3, velocity: 0.90 }, // C5
      { id: 'syn-4', trackId: 't-synth', midiNote: 67, startStep: 8, durationSteps: 2, velocity: 0.85 }, // G4
      { id: 'syn-5', trackId: 't-synth', midiNote: 65, startStep: 11, durationSteps: 1, velocity: 0.80 }, // F4
      { id: 'syn-6', trackId: 't-synth', midiNote: 63, startStep: 12, durationSteps: 2, velocity: 0.85 }, // Eb4
      { id: 'syn-7', trackId: 't-synth', midiNote: 62, startStep: 14, durationSteps: 2, velocity: 0.80 }, // D4
    ],
  },
  {
    id: 'pat-2',
    name: 'Pattern 2 (Verse Progression)',
    color: '#38bdf8',
    lengthSteps: 16,
    notes: [
      { id: 'c-1', trackId: 't-piano', midiNote: 48, startStep: 0, durationSteps: 8, velocity: 0.8 },
      { id: 'c-2', trackId: 't-piano', midiNote: 55, startStep: 0, durationSteps: 8, velocity: 0.8 },
      { id: 'c-3', trackId: 't-piano', midiNote: 60, startStep: 0, durationSteps: 8, velocity: 0.8 },
      { id: 'c-4', trackId: 't-piano', midiNote: 46, startStep: 8, durationSteps: 8, velocity: 0.8 },
      { id: 'c-5', trackId: 't-piano', midiNote: 53, startStep: 8, durationSteps: 8, velocity: 0.8 },
      { id: 'c-6', trackId: 't-piano', midiNote: 58, startStep: 8, durationSteps: 8, velocity: 0.8 },
    ],
  },
];

const createInitialAutomationClips = (): AutomationClip[] => [
  {
    id: 'auto-synth-cutoff',
    name: 'Eve Lead Filter Sweep',
    color: '#ec4899',
    trackIndex: 2,
    startBar: 0,
    lengthBars: 8,
    target: {
      type: 'synthCutoff',
      label: 'Lead Cutoff Sweep',
    },
    nodes: [
      { id: 'node-1', bar: 0, value: 0.25, tension: 0.4 },
      { id: 'node-2', bar: 3.5, value: 0.95, tension: -0.3 },
      { id: 'node-3', bar: 4.0, value: 0.35, tension: 0.2 },
      { id: 'node-4', bar: 7.5, value: 1.0, tension: 0.0 },
    ],
  },
];

const createInitialSidechainRoutes = (): SidechainRoute[] => [
  {
    id: 'sc-kick-808',
    enabled: true,
    name: 'Kick -> 808 Sub Ducking',
    sourceChannelIndex: 1,
    targetChannelIndex: 3,
    thresholdDb: -16,
    duckingDepthDb: 14,
    attackMs: 2.0,
    releaseMs: 140,
    mode: 'lowShelf',
  },
];

const createInitialSlicexSession = (): SlicexSession => ({
  audioBuffer: null,
  fileName: 'Eve_Trap_Breakbeat_130bpm.wav',
  slices: [],
  selectedSliceId: null,
  sensitivity: 55,
  bpm: 130,
  bars: 2,
});

const createInitialClips = (): PlaylistClip[] => [
  { id: 'clip-1', trackIndex: 0, patternId: 'pat-1', name: 'Main Groove', startBar: 0, lengthBars: 4, color: '#ff763b', type: 'pattern' },
  { id: 'clip-2', trackIndex: 1, patternId: 'pat-2', name: 'Chords Layer', startBar: 2, lengthBars: 6, color: '#38bdf8', type: 'pattern' },
  { id: 'clip-3', trackIndex: 0, patternId: 'pat-1', name: 'Main Groove (Hook)', startBar: 4, lengthBars: 4, color: '#ff763b', type: 'pattern' },
  { id: 'clip-auto-1', trackIndex: 2, automationClipId: 'auto-synth-cutoff', name: 'Eve Lead Filter Sweep', startBar: 0, lengthBars: 8, color: '#ec4899', type: 'automation' },
];

const createInitialMixerChannels = (): MixerChannel[] => [
  { id: 'mix-0', name: 'Master', color: '#ff763b', volume: 0.95, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-1', name: 'Drums', color: '#f97316', volume: 0.9, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-2', name: 'Hi-Hats', color: '#00d2ff', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-3', name: '808 Bass', color: '#a855f7', volume: 0.95, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-4', name: 'Eve Synth', color: '#ec4899', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS, reverbEnabled: true, reverbMix: 0.3 } },
  { id: 'mix-5', name: 'Sampler/Keys', color: '#22c55e', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-6', name: 'Mic Looper', color: '#eab308', volume: 0.9, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS, compressorEnabled: true, reverbEnabled: true, reverbMix: 0.2 } },
  { id: 'mix-7', name: 'Guitar Rig', color: '#ef4444', volume: 0.9, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-8', name: 'VST Host', color: '#8b5cf6', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
];

const createInitialLooperDecks = (): LooperDeck[] => [
  { id: 'deck-1', deckNumber: 1, name: 'Deck 1 (Beatbox/Drums)', status: 'empty', recordedBars: 2, audioBuffer: null, volume: 0.85, pan: 0, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, filter: 0, stutterRate: 0, source: 'mic', waveform: [] },
  { id: 'deck-2', deckNumber: 2, name: 'Deck 2 (Bassline / Vocal)', status: 'empty', recordedBars: 2, audioBuffer: null, volume: 0.85, pan: 0, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, filter: 0, stutterRate: 0, source: 'mic', waveform: [] },
  { id: 'deck-3', deckNumber: 3, name: 'Deck 3 (Harmonies / Hook)', status: 'empty', recordedBars: 4, audioBuffer: null, volume: 0.8, pan: -0.2, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, filter: 0, stutterRate: 0, source: 'guitar', waveform: [] },
  { id: 'deck-4', deckNumber: 4, name: 'Deck 4 (Acoustic / Master)', status: 'empty', recordedBars: 4, audioBuffer: null, volume: 0.8, pan: 0.2, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, filter: 0, stutterRate: 0, source: 'master', waveform: [] },
];

export const DEFAULT_AMP_SETTINGS: GuitarAmpSettings = {
  drive: 3.5,
  bass: 0,
  mid: 0,
  treble: 2.0,
  presence: 1.0,
  master: 0.85,
};

export const DEFAULT_GUITAR_PEDALS: GuitarPedalSettings = {
  compEnabled: false,
  compSustain: 0.5,
  compLevel: 0.8,

  driveEnabled: false,
  driveGain: 0.45,
  driveTone: 0.5,
  driveLevel: 0.75,

  fuzzEnabled: false,
  fuzzGain: 0.6,
  fuzzTone: 0.5,
  fuzzLevel: 0.7,

  wahEnabled: false,
  wahSensitivity: 0.65,
  wahManual: 0.5,
  wahMode: 'auto',

  chorusEnabled: false,
  chorusRate: 1.2,
  chorusDepth: 0.35,
  chorusMix: 0.4,

  delayEnabled: false,
  delayTime: 0.28,
  delayFeedback: 0.35,
  delayMix: 0.3,

  reverbEnabled: false,
  reverbSize: 2.2,
  reverbMix: 0.35,
};

// Custom State Store & Pub/Sub
export interface DawStoreState {
  projectName: string;
  isPlaying: boolean;
  bpm: number;
  swing: number;
  playbackMode: PlaybackMode;
  metronome: boolean;
  activeView: ViewTab;
  currentStep: number;
  currentBar: number;
  
  // Tracks & Patterns
  tracks: ChannelTrack[];
  patterns: Pattern[];
  selectedPatternId: string;
  selectedTrackId: string;

  // Scale & Key helper
  selectedKey: RootNote;
  selectedScale: MusicalScale;
  snapToScale: boolean;

  // Playlist
  clips: PlaylistClip[];
  playlistTracks: PlaylistTrack[];
  totalBars: number;

  // Mixer & FX
  mixerChannels: MixerChannel[];
  selectedMixerChannelIndex: number;

  // Looper
  looperDecks: LooperDeck[];
  selectedLooperDeckIndex: number;
  isMicActive: boolean;
  directMonitor: boolean;
  micGain: number;

  // Synth
  synthParams: SynthParameters;
  selectedPresetId: string;

  // Guitar Rig State
  isGuitarActive: boolean;
  guitarDeviceId: string;
  guitarChannelMode: 'left' | 'right' | 'stereo';
  guitarGain: number; // dB (-24 to +24)
  guitarDirectMonitor: boolean;
  isGuitarTuning: boolean;
  guitarTunerMute: boolean;
  guitarNoiseGate: boolean;
  guitarGateThreshold: number; // dB
  guitarAmpModel: GuitarAmpModel;
  guitarAmpSettings: GuitarAmpSettings;
  guitarCabModel: GuitarCabModel;
  guitarPedals: GuitarPedalSettings;
  guitarRoutingChannel: number; // default 7

  // VST Host State
  vstInstances: VstPluginInstance[];
  selectedVstChannelIndex: number;
  selectedVstSlotIndex: number;
  connectedMidiOutputs: string[];
  selectedMidiOutput: string;

  // 1. Automation & Modulation
  automationClips: AutomationClip[];

  // 2. Sidechain Ducking
  sidechainRoutes: SidechainRoute[];

  // 3. Intelligent Beat Slicer (Slicex)
  slicexSession: SlicexSession;

  // 4. AI Mixing Doctor
  spectralAlerts: SpectralCollisionAlert[];

  // 5. Hardware MIDI Learn
  midiMappings: MidiCcMapping[];
  isMidiLearning: boolean;
  learningTarget: MidiLearnTarget | null;

  // 6. Impulse Responses
  impulseResponses: ImpulseResponseMeta[];
}

class Store {
  private state: DawStoreState;
  private listeners: Set<() => void> = new Set();
  private audioEngine: AudioEngine;

  constructor() {
    this.audioEngine = AudioEngine.getInstance();
    
    // Load from localStorage if present
    const saved = localStorage.getItem('eves_mixer_saved_state');
    let initialState: Partial<DawStoreState> = {};
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed._version === CURRENT_STORAGE_VERSION) {
          initialState = parsed;
        } else {
          console.info("Upgrading project state to Eve's Mixer Pro Studio Audio Engine");
        }
      } catch (e) {
        console.warn('Could not parse saved state:', e);
      }
    }

    this.state = {
      projectName: initialState.projectName || "Eve's Mixer Project",
      isPlaying: false,
      bpm: initialState.bpm || 140,
      swing: initialState.swing || 0,
      playbackMode: initialState.playbackMode || 'pattern',
      metronome: false,
      activeView: 'channelRack',
      currentStep: 0,
      currentBar: 0,
      tracks: initialState.tracks || createInitialTracks(),
      patterns: initialState.patterns || createInitialPatterns(),
      selectedPatternId: 'pat-1',
      selectedTrackId: 't-synth',
      selectedKey: initialState.selectedKey || 'C',
      selectedScale: initialState.selectedScale || 'minor',
      snapToScale: false,
      clips: initialState.clips || createInitialClips(),
      playlistTracks: Array.from({ length: 8 }, (_, i) => ({
        id: `pl-track-${i + 1}`,
        name: `Track ${i + 1}`,
        color: ['#ff763b', '#38bdf8', '#a855f7', '#ec4899', '#22c55e', '#eab308', '#06b6d4', '#64748b'][i],
        mute: false,
        solo: false,
        volume: 0.85,
        pan: 0,
      })),
      totalBars: 16,
      mixerChannels: createInitialMixerChannels(),
      selectedMixerChannelIndex: 1,
      looperDecks: createInitialLooperDecks(),
      selectedLooperDeckIndex: 0,
      isMicActive: false,
      directMonitor: false,
      micGain: 1.0,
      synthParams: { ...DEFAULT_SYNTH_PARAMS },
      selectedPresetId: 'default_lead',

      // Guitar Rig
      isGuitarActive: false,
      guitarDeviceId: '',
      guitarChannelMode: 'left',
      guitarGain: 0,
      guitarDirectMonitor: false,
      isGuitarTuning: false,
      guitarTunerMute: false,
      guitarNoiseGate: true,
      guitarGateThreshold: -50,
      guitarAmpModel: 'fenderClean',
      guitarAmpSettings: { ...DEFAULT_AMP_SETTINGS },
      guitarCabModel: 'v30_4x12',
      guitarPedals: { ...DEFAULT_GUITAR_PEDALS },
      guitarRoutingChannel: 7,

      // VST Host
      vstInstances: [
        {
          instanceId: 'vst-def-tape',
          pluginId: 'tape_machine',
          name: 'Eve Vintage Tape 1974',
          channelIndex: 0,
          slotIndex: 0,
          enabled: true,
          mix: 0.8,
          parameters: { drive: 40, headBump: 3.0, wowFlutter: 20, tapeSpeed: '15ips', tapeHiss: false },
        },
        {
          instanceId: 'vst-def-guitar',
          pluginId: 'guitar_rig',
          name: "Eve Guitar Rig & Amp VST",
          channelIndex: 7,
          slotIndex: 0,
          enabled: true,
          mix: 1.0,
          parameters: { ampModel: 'fenderClean', drive: 4.0, bass: 0, mid: 1, treble: 2, presence: 1, cabModel: 'v30_4x12', tsOverdrive: false, vintageFuzz: false },
        },
        {
          instanceId: 'vst-def-tune',
          pluginId: 'vocal_tune',
          name: 'Eve Vocal Auto-Tune',
          channelIndex: 6,
          slotIndex: 0,
          enabled: true,
          mix: 0.9,
          parameters: { retuneSpeed: 12, correctionAmount: 85, scale: 'minor', formantShift: 0, vibratoDepth: 0 },
        },
      ],
      selectedVstChannelIndex: 7,
      selectedVstSlotIndex: 0,
      connectedMidiOutputs: [],
      selectedMidiOutput: '',

      // 1. Automation & Modulation
      automationClips: initialState.automationClips || createInitialAutomationClips(),

      // 2. Sidechain Ducking
      sidechainRoutes: initialState.sidechainRoutes || createInitialSidechainRoutes(),

      // 3. Intelligent Beat Slicer (Slicex)
      slicexSession: initialState.slicexSession || createInitialSlicexSession(),

      // 4. AI Mixing Doctor
      spectralAlerts: [],

      // 5. Hardware MIDI Learn
      midiMappings: MidiLearnManager.getInstance().getMappings(),
      isMidiLearning: false,
      learningTarget: null,

      // 6. Impulse Responses
      impulseResponses: FACTORY_IMPULSES,
    };

    // Connect MIDI Learn listeners
    const midiLearn = MidiLearnManager.getInstance();
    midiLearn.onLearnStatus((isLearning, target) => {
      this.state.isMidiLearning = isLearning;
      this.state.learningTarget = target;
      this.notify();
    });
    midiLearn.onMappingsChange((mappings) => {
      this.state.midiMappings = mappings;
      this.notify();
    });
    midiLearn.onParameterChange((mapping, val) => {
      this.handleMidiCcParameterChange(mapping, val);
    });

    // Connect AudioEngine events
    this.audioEngine.setBpm(this.state.bpm);
    this.audioEngine.setSwing(this.state.swing);
    this.audioEngine.setPlaybackMode(this.state.playbackMode);
    this.syncAudioEngineData();

    this.audioEngine.addStepListener((step, bar) => {
      this.state.currentStep = step;
      this.state.currentBar = bar;
      this.notify();
    });

    this.audioEngine.addStopListener(() => {
      this.state.isPlaying = false;
      this.state.currentStep = 0;
      this.state.currentBar = 0;
      this.notify();
    });
  }

  public getState(): DawStoreState {
    return this.state;
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public syncAudioEngineData() {
    const curPattern = this.state.patterns.find((p) => p.id === this.state.selectedPatternId) || null;
    this.audioEngine.updateProjectData(
      this.state.tracks,
      curPattern,
      this.state.patterns,
      this.state.clips,
      this.state.synthParams,
      this.state.automationClips
    );
    this.audioEngine.sidechainManager.setRoutes(this.state.sidechainRoutes);
  }

  public saveToStorage() {
    try {
      const copy = {
        _version: CURRENT_STORAGE_VERSION,
        projectName: this.state.projectName,
        bpm: this.state.bpm,
        swing: this.state.swing,
        tracks: this.state.tracks,
        patterns: this.state.patterns,
        clips: this.state.clips,
        selectedKey: this.state.selectedKey,
        selectedScale: this.state.selectedScale,
      };
      localStorage.setItem('eves_mixer_saved_state', JSON.stringify(copy));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  // --- Actions ---

  public togglePlay() {
    if (this.state.isPlaying) {
      this.audioEngine.stop();
      this.state.isPlaying = false;
    } else {
      this.syncAudioEngineData();
      this.audioEngine.start();
      this.state.isPlaying = true;
    }
    this.notify();
  }

  public stopPlayback() {
    this.audioEngine.stop();
    this.state.isPlaying = false;
    this.state.currentStep = 0;
    this.notify();
  }

  public setBpm(bpm: number) {
    this.state.bpm = bpm;
    this.audioEngine.setBpm(bpm);
    this.notify();
    this.saveToStorage();
  }

  public setSwing(swing: number) {
    this.state.swing = swing;
    this.audioEngine.setSwing(swing);
    this.notify();
  }

  public setPlaybackMode(mode: PlaybackMode) {
    this.state.playbackMode = mode;
    this.audioEngine.setPlaybackMode(mode);
    this.notify();
  }

  public toggleMetronome() {
    this.state.metronome = !this.state.metronome;
    this.audioEngine.setMetronome(this.state.metronome);
    this.notify();
  }

  public setActiveView(view: ViewTab) {
    this.state.activeView = view;
    this.notify();
  }

  public setSelectedPattern(patternId: string) {
    this.state.selectedPatternId = patternId;
    this.syncAudioEngineData();
    this.notify();
  }

  public setSelectedTrack(trackId: string) {
    this.state.selectedTrackId = trackId;
    this.notify();
  }

  public setKey(key: RootNote) {
    this.state.selectedKey = key;
    this.notify();
  }

  public setScale(scale: MusicalScale) {
    this.state.selectedScale = scale;
    this.notify();
  }

  public toggleSnapToScale() {
    this.state.snapToScale = !this.state.snapToScale;
    this.notify();
  }

  // Step Sequencer Step Toggle
  public toggleStep(trackId: string, stepIndex: number) {
    const track = this.state.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const patId = this.state.selectedPatternId;
    if (!track.steps[patId]) {
      track.steps[patId] = Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 }));
    }
    const current = track.steps[patId][stepIndex];
    if (current) {
      current.active = !current.active;
    } else {
      track.steps[patId][stepIndex] = { active: true, velocity: 0.85 };
    }

    // Audition sound if activated
    if (track.steps[patId][stepIndex].active && !this.state.isPlaying) {
      this.auditionTrack(track);
    }

    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public auditionTrack(track: ChannelTrack, velocity: number = 0.9) {
    this.audioEngine.resumeContext();
    const mixerChan = this.audioEngine.mixer.getChannel(track.mixerChannelIndex);
    const now = this.audioEngine.ctx.currentTime;
    if (track.type === 'drum' && track.soundId) {
      this.audioEngine.drumSynth.trigger(
        track.soundId,
        now,
        velocity * track.volume,
        mixerChan.inputNode,
        track.customAudioUrl,
        track.drumKitId || 'trap'
      );
    } else if (track.type === 'sampler') {
      this.audioEngine.drumSynth.trigger(
        'kick',
        now,
        velocity * track.volume,
        mixerChan.inputNode,
        track.customAudioUrl,
        track.drumKitId || 'trap'
      );
    } else if (track.type === 'instrument' && track.instrumentId) {
      const pitch = 60 + (track.steps[this.state.selectedPatternId]?.[0]?.pitchOffset || 0);
      this.audioEngine.instrumentEngine.noteOn(
        track.instrumentId,
        pitch,
        velocity * track.volume,
        now,
        mixerChan.inputNode
      );
      setTimeout(() => {
        this.audioEngine.instrumentEngine.noteOff(track.instrumentId!, pitch, now + 0.45);
      }, 450);
    } else if (track.type === 'synth') {
      this.audioEngine.synthEngine.noteOn(60, velocity * track.volume, now, this.state.synthParams, mixerChan.inputNode);
      setTimeout(() => {
        this.audioEngine.synthEngine.noteOff(60, now + 0.3, this.state.synthParams);
      }, 300);
    }
  }

  public auditionInstrument(instrumentId: string) {
    this.audioEngine.resumeContext();
    const mixerChan = this.audioEngine.mixer.getChannel(4);
    const now = this.audioEngine.ctx.currentTime;
    // Play an audition 3-note melodic arpeggio (C4, E4, G4)
    this.audioEngine.instrumentEngine.noteOn(instrumentId, 60, 0.85, now, mixerChan.inputNode);
    this.audioEngine.instrumentEngine.noteOn(instrumentId, 64, 0.8, now + 0.12, mixerChan.inputNode);
    this.audioEngine.instrumentEngine.noteOn(instrumentId, 67, 0.9, now + 0.24, mixerChan.inputNode);

    setTimeout(() => {
      this.audioEngine.instrumentEngine.noteOff(instrumentId, 60, now + 0.6);
      this.audioEngine.instrumentEngine.noteOff(instrumentId, 64, now + 0.6);
      this.audioEngine.instrumentEngine.noteOff(instrumentId, 67, now + 0.8);
    }, 600);
  }

  public addInstrumentTrack(instrumentId: string) {
    const def = INSTRUMENT_CATALOG.find((i) => i.id === instrumentId);
    const name = def ? def.name : 'New Instrument';
    const color = def ? def.color : '#38bdf8';
    const id = `track-inst-${Date.now()}`;

    const newTrack: ChannelTrack = {
      id,
      name,
      type: 'instrument',
      instrumentId,
      color,
      volume: 0.85,
      pan: 0,
      mute: false,
      solo: false,
      mixerChannelIndex: 5,
      steps: {
        [this.state.selectedPatternId]: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
      },
    };

    this.state.tracks.push(newTrack);
    this.setSelectedTrack(id);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
    this.auditionTrack(newTrack);
  }

  public changeTrackInstrument(trackId: string, instrumentId: string) {
    const track = this.state.tracks.find((t) => t.id === trackId);
    const def = INSTRUMENT_CATALOG.find((i) => i.id === instrumentId);
    if (track && def) {
      track.type = 'instrument';
      track.instrumentId = instrumentId;
      track.name = def.name;
      track.color = def.color;
      this.syncAudioEngineData();
      this.notify();
      this.saveToStorage();
      this.auditionTrack(track);
    }
  }

  public changeDrumKit(kitId: DrumKitId) {
    this.state.tracks.forEach((t) => {
      if (t.type === 'drum') {
        t.drumKitId = kitId;
      }
    });
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public setStepVelocity(trackId: string, stepIndex: number, velocity: number) {
    const track = this.state.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const patId = this.state.selectedPatternId;
    if (track.steps[patId] && track.steps[patId][stepIndex]) {
      track.steps[patId][stepIndex].velocity = Math.max(0, Math.min(1, velocity));
      this.syncAudioEngineData();
      this.notify();
    }
  }

  // Piano Roll Note Operations
  public addPianoNote(note: PianoNote) {
    const pat = this.state.patterns.find((p) => p.id === this.state.selectedPatternId);
    if (!pat) return;
    // Remove any overlapping identical note
    pat.notes = pat.notes.filter((n) => !(n.trackId === note.trackId && n.midiNote === note.midiNote && n.startStep === note.startStep));
    pat.notes.push(note);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public removePianoNote(noteId: string) {
    const pat = this.state.patterns.find((p) => p.id === this.state.selectedPatternId);
    if (!pat) return;
    pat.notes = pat.notes.filter((n) => n.id !== noteId);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public clearPatternNotes() {
    const pat = this.state.patterns.find((p) => p.id === this.state.selectedPatternId);
    if (!pat) return;
    pat.notes = [];
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // Playlist Clip Operations
  public addPlaylistClip(clip: PlaylistClip) {
    this.state.clips.push(clip);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public removePlaylistClip(clipId: string) {
    this.state.clips = this.state.clips.filter((c) => c.id !== clipId);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // Mixer Operations
  public setSelectedMixerChannel(index: number) {
    this.state.selectedMixerChannelIndex = index;
    this.notify();
  }

  public updateMixerChannel(index: number, updates: Partial<MixerChannel>) {
    const ch = this.state.mixerChannels[index];
    if (!ch) return;
    Object.assign(ch, updates);

    const node = this.audioEngine.mixer.getChannel(index);
    if (updates.volume !== undefined) node.setVolume(updates.volume, this.audioEngine.ctx);
    if (updates.pan !== undefined) node.setPan(updates.pan, this.audioEngine.ctx);
    if (updates.mute !== undefined) node.setMute(updates.mute, this.audioEngine.ctx);
    if (updates.effects) node.updateEffects(updates.effects);

    this.notify();
  }

  // Synth Operations
  public setSynthParams(params: SynthParameters) {
    this.state.synthParams = { ...params };
    this.syncAudioEngineData();
    this.notify();
  }

  public loadPreset(presetId: string) {
    const preset = SYNTH_PRESETS[presetId];
    if (preset) {
      this.state.selectedPresetId = presetId;
      this.setSynthParams(preset.params);
    }
  }

  // Looper Operations
  public async toggleMicrophone(): Promise<boolean> {
    if (this.state.isMicActive) {
      this.state.isMicActive = false;
    } else {
      const ok = await this.audioEngine.looperStation.initMic();
      this.state.isMicActive = ok;
    }
    this.notify();
    return this.state.isMicActive;
  }

  public toggleDirectMonitor() {
    this.state.directMonitor = !this.state.directMonitor;
    this.audioEngine.looperStation.setDirectMonitor(this.state.directMonitor, 0.8);
    this.notify();
  }

  public setMicGain(gain: number) {
    this.state.micGain = gain;
    this.audioEngine.looperStation.setMicGain(gain);
    this.notify();
  }

  public updateLooperDeck(index: number, updates: Partial<LooperDeck>) {
    const deck = this.state.looperDecks[index];
    if (!deck) return;
    Object.assign(deck, updates);

    if (
      updates.volume !== undefined ||
      updates.pan !== undefined ||
      updates.mute !== undefined ||
      updates.filter !== undefined
    ) {
      this.audioEngine.looperStation.updateDeckParameters(
        deck.deckNumber,
        deck.mute ? 0 : deck.volume,
        deck.pan,
        deck.mute,
        deck.filter || 0
      );
    }
    this.notify();
  }

  // Drop recorded Looper clip into Playlist timeline
  public sendDeckToPlaylist(deckNumber: number) {
    const deck = this.state.looperDecks.find((d) => d.deckNumber === deckNumber);
    if (!deck || !deck.audioBuffer) return;

    const clipId = `audio-clip-${Date.now()}`;
    const newClip: PlaylistClip = {
      id: clipId,
      trackIndex: 3, // Vocal/Audio track row
      looperDeckId: deck.id,
      name: `Loop Deck ${deckNumber}`,
      startBar: 0,
      lengthBars: deck.recordedBars,
      color: '#eab308',
      type: 'audio',
    };
    this.addPlaylistClip(newClip);
  }

  // Convert recorded Looper clip into an editable Sampler Channel Track in Channel Rack
  public sendDeckToChannelRack(deckNumber: number) {
    const deck = this.state.looperDecks.find((d) => d.deckNumber === deckNumber);
    if (!deck || !deck.audioBuffer) return;

    const blob = this.audioEngine.looperStation.bufferToWavBlob(deck.audioBuffer);
    const audioUrl = URL.createObjectURL(blob);
    this.audioEngine.drumSynth.registerCustomSample(audioUrl, deck.audioBuffer);

    const newTrackId = `track-loop-${Date.now()}`;
    const newSteps: Record<string, StepData[]> = {};
    for (const pat of this.state.patterns) {
      newSteps[pat.id] = Array.from({ length: pat.lengthSteps }, (_, idx) => ({
        active: idx === 0, // Trigger once on downbeat
        velocity: 0.9,
      }));
    }

    const newTrack: ChannelTrack = {
      id: newTrackId,
      name: `Deck ${deckNumber} Sampler`,
      type: 'sampler',
      color: '#eab308',
      volume: 0.85,
      pan: 0,
      mute: false,
      solo: false,
      mixerChannelIndex: 6, // Route to Looper Channel
      steps: newSteps,
      customAudioUrl: audioUrl,
      customAudioName: `Deck_${deckNumber}_Loop.wav`,
    };

    this.state.tracks.push(newTrack);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // Inspiration Generators
  public applyInspirationProgression(prog: (typeof INSPIRATION_PROGRESSIONS)[0]) {
    this.state.selectedKey = prog.key;
    this.state.selectedScale = prog.scale;

    const pat = this.state.patterns.find((p) => p.id === this.state.selectedPatternId);
    if (!pat) return;

    // Generate piano notes based on the progression across 16 steps (4 chords, 4 steps each)
    const newNotes: PianoNote[] = [];
    const rootMidi = 60 + NOTE_NAMES.indexOf(prog.key); // Middle octave

    prog.chords.forEach((chord, i) => {
      const chordStart = i * 4;
      const baseNote = rootMidi + chord.rootOffset;

      chord.intervals.forEach((interval) => {
        newNotes.push({
          id: `gen-${i}-${interval}-${Date.now()}`,
          trackId: 't-synth',
          midiNote: baseNote + interval,
          startStep: chordStart,
          durationSteps: 3,
          velocity: 0.8,
        });
      });
    });

    pat.notes = newNotes;
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public applyDrumPreset(style: 'trap' | 'boomBap' | 'house' | 'drill' | 'synthwave' | 'phonk') {
    const patId = this.state.selectedPatternId;
    const kick = this.state.tracks.find((t) => t.soundId === 'kick');
    const clap = this.state.tracks.find((t) => t.soundId === 'clap');
    const snare = this.state.tracks.find((t) => t.soundId === 'snare');
    const hat = this.state.tracks.find((t) => t.soundId === 'hihat_closed');
    const openHat = this.state.tracks.find((t) => t.soundId === 'hihat_open');
    const sub = this.state.tracks.find((t) => t.soundId === '808');

    // Clear existing drum steps
    [kick, clap, snare, hat, openHat, sub].forEach((t) => {
      if (t) t.steps[patId] = Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 }));
    });

    if (style === 'trap') {
      this.setBpm(140);
      this.setSwing(0);
      if (kick) {
        [0, 7, 10, 14].forEach((s, idx) => {
          kick.steps[patId][s] = { active: true, velocity: idx === 0 || idx === 2 ? 1.0 : 0.88 };
        });
      }
      if (clap) [4, 12].forEach((s) => (clap.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (snare) snare.steps[patId][15] = { active: true, velocity: 0.7 };
      if (openHat) [2, 10].forEach((s) => (openHat.steps[patId][s] = { active: true, velocity: 0.85 }));
      if (hat) {
        const velMap = [0.95, 0.40, 0.75, 0.45, 0.90, 0.40, 0.80, 0.50, 0.95, 0.45, 0.75, 0.50, 0.95, 0.82, 0.88, 0.95];
        const pitchMap = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 2, 5];
        for (let i = 0; i < 16; i++) {
          hat.steps[patId][i] = { active: true, velocity: velMap[i], pitchOffset: pitchMap[i] };
        }
      }
      if (sub) {
        sub.steps[patId][0] = { active: true, velocity: 1.0, pitchOffset: 0 };
        sub.steps[patId][7] = { active: true, velocity: 0.9, pitchOffset: 0 };
        sub.steps[patId][10] = { active: true, velocity: 0.95, pitchOffset: -2 };
        sub.steps[patId][14] = { active: true, velocity: 0.85, pitchOffset: 3 };
      }
    } else if (style === 'drill') {
      this.setBpm(142);
      this.setSwing(0);
      if (kick) {
        kick.steps[patId][0] = { active: true, velocity: 1.0 };
        kick.steps[patId][10] = { active: true, velocity: 0.95 };
        kick.steps[patId][13] = { active: true, velocity: 0.85 };
      }
      // UK/NY Drill signature: snare on the 3rd beat (step 6 and 14)
      if (snare) [6, 14].forEach((s) => (snare.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (clap) [6, 14].forEach((s) => (clap.steps[patId][s] = { active: true, velocity: 0.6 }));
      if (openHat) [8].forEach((s) => (openHat.steps[patId][s] = { active: true, velocity: 0.85 }));
      if (hat) {
        [0, 3, 6, 8, 9, 11, 12, 14].forEach((s) => {
          const pitch = s === 9 ? -3 : s === 12 ? 2 : 0;
          hat.steps[patId][s] = { active: true, velocity: s === 0 || s === 8 ? 0.95 : 0.75, pitchOffset: pitch };
        });
      }
      if (sub) {
        sub.steps[patId][0] = { active: true, velocity: 1.0, pitchOffset: 0 };
        sub.steps[patId][3] = { active: true, velocity: 0.9, pitchOffset: 5 }; // slide up
        sub.steps[patId][8] = { active: true, velocity: 0.95, pitchOffset: 0 };
        sub.steps[patId][11] = { active: true, velocity: 0.85, pitchOffset: -3 }; // slide down
      }
    } else if (style === 'boomBap') {
      this.setBpm(90);
      this.setSwing(28); // Real 90s MPC swing
      if (kick) {
        kick.steps[patId][0] = { active: true, velocity: 1.0 };
        kick.steps[patId][6] = { active: true, velocity: 0.88 };
        kick.steps[patId][10] = { active: true, velocity: 0.95 };
      }
      if (snare) [4, 12].forEach((s) => (snare.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (openHat) [14].forEach((s) => (openHat.steps[patId][s] = { active: true, velocity: 0.75 }));
      if (hat) {
        const velMap = [0.9, 0.5, 0.8, 0.55, 0.9, 0.5, 0.85, 0.65, 0.9, 0.5, 0.8, 0.55, 0.9, 0.5, 0.85, 0.6];
        for (let i = 0; i < 16; i++) {
          hat.steps[patId][i] = { active: true, velocity: velMap[i] };
        }
      }
      if (sub) {
        sub.steps[patId][0] = { active: true, velocity: 0.95, pitchOffset: 0 };
        sub.steps[patId][6] = { active: true, velocity: 0.85, pitchOffset: 0 };
        sub.steps[patId][10] = { active: true, velocity: 0.9, pitchOffset: 5 };
      }
    } else if (style === 'synthwave') {
      this.setBpm(124);
      this.setSwing(0);
      if (kick) [0, 4, 8, 12].forEach((s) => (kick.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (snare) [4, 12].forEach((s) => (snare.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (clap) [4, 12].forEach((s) => (clap.steps[patId][s] = { active: true, velocity: 0.75 }));
      if (openHat) [2, 6, 10, 14].forEach((s) => (openHat.steps[patId][s] = { active: true, velocity: 0.85 }));
      if (hat) {
        for (let i = 0; i < 16; i++) {
          hat.steps[patId][i] = { active: true, velocity: i % 2 === 0 ? 0.85 : 0.6 };
        }
      }
      if (sub) {
        // Driving 16th rolling synth bass
        for (let i = 0; i < 16; i++) {
          sub.steps[patId][i] = { active: true, velocity: i % 4 === 0 ? 0.95 : 0.75, pitchOffset: i >= 8 ? -2 : 0 };
        }
      }
    } else if (style === 'house') {
      this.setBpm(126);
      this.setSwing(0);
      if (kick) [0, 4, 8, 12].forEach((s) => (kick.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (clap) [4, 12].forEach((s) => (clap.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (openHat) [2, 6, 10, 14].forEach((s) => (openHat.steps[patId][s] = { active: true, velocity: 0.95 }));
      if (hat) {
        [0, 4, 8, 12].forEach((s) => (hat.steps[patId][s] = { active: true, velocity: 0.6 }));
      }
      if (sub) {
        [2, 6, 10, 14].forEach((s) => (sub.steps[patId][s] = { active: true, velocity: 0.9, pitchOffset: 0 }));
      }
    } else if (style === 'phonk') {
      this.setBpm(155);
      this.setSwing(0);
      if (kick) [0, 3, 6, 10, 12].forEach((s) => (kick.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (snare) [4, 12].forEach((s) => (snare.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (clap) [4, 12].forEach((s) => (clap.steps[patId][s] = { active: true, velocity: 0.8 }));
      if (openHat) [2, 10].forEach((s) => (openHat.steps[patId][s] = { active: true, velocity: 0.9 }));
      if (hat) {
        for (let i = 0; i < 16; i++) {
          const pitch = i >= 13 ? (i - 13) * 3 : 0;
          hat.steps[patId][i] = { active: true, velocity: i >= 12 ? 0.95 : 0.8, pitchOffset: pitch };
        }
      }
      if (sub) {
        sub.steps[patId][0] = { active: true, velocity: 1.0, pitchOffset: 0 };
        sub.steps[patId][3] = { active: true, velocity: 0.9, pitchOffset: 3 };
        sub.steps[patId][6] = { active: true, velocity: 1.0, pitchOffset: 0 };
        sub.steps[patId][10] = { active: true, velocity: 0.95, pitchOffset: 5 };
        sub.steps[patId][12] = { active: true, velocity: 0.9, pitchOffset: -2 };
      }
    }

    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // Musical Phrased Melody Randomizer (Call & Response in scale)
  public randomizeMelody() {
    const pat = this.state.patterns.find((p) => p.id === this.state.selectedPatternId);
    if (!pat) return;

    const intervals = SCALE_INTERVALS[this.state.selectedScale];
    const rootIndex = NOTE_NAMES.indexOf(this.state.selectedKey);
    const rootMidi = 60 + rootIndex; // C4 base

    const newNotes: PianoNote[] = [];

    // Musical phrase structure: motif in steps 0-7, variation/answer in 8-15
    const phrasePattern = [
      { step: 0, dur: 2, scaleDeg: 4 }, // 5th
      { step: 3, dur: 1, scaleDeg: 2 }, // 3rd
      { step: 4, dur: 3, scaleDeg: 0 }, // Root
      { step: 8, dur: 2, scaleDeg: 4 }, // 5th
      { step: 11, dur: 1, scaleDeg: 5 }, // 6th/7th
      { step: 12, dur: 2, scaleDeg: 2 }, // 3rd
      { step: 14, dur: 2, scaleDeg: 1 }, // 2nd
    ];

    phrasePattern.forEach((item) => {
      const interval = intervals[item.scaleDeg % intervals.length] || 0;
      newNotes.push({
        id: `mel-${item.step}-${Date.now()}`,
        trackId: 't-synth',
        midiNote: rootMidi + interval + (item.scaleDeg > 4 ? 12 : 0),
        startStep: item.step,
        durationSteps: item.dur,
        velocity: 0.78 + Math.random() * 0.15,
      });
    });

    pat.notes = newNotes;
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public resetToProDemo() {
    this.state.tracks = createInitialTracks();
    this.state.patterns = createInitialPatterns();
    this.state.selectedPatternId = 'pat-1';
    this.state.bpm = 140;
    this.state.swing = 0;
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // Guitar Rig Operations
  public async toggleGuitarInput(deviceId?: string, channelMode?: 'left' | 'right' | 'stereo'): Promise<boolean> {
    if (this.state.isGuitarActive) {
      this.audioEngine.guitarEngine.stopGuitarInput();
      this.state.isGuitarActive = false;
    } else {
      const mode = channelMode || this.state.guitarChannelMode;
      const ok = await this.audioEngine.guitarEngine.startGuitarInput(deviceId, mode);
      this.state.isGuitarActive = ok;
      if (deviceId) this.state.guitarDeviceId = deviceId;
      if (channelMode) this.state.guitarChannelMode = channelMode;
    }
    this.notify();
    return this.state.isGuitarActive;
  }

  public setGuitarGain(gainDb: number) {
    this.state.guitarGain = gainDb;
    this.audioEngine.guitarEngine.setInputGain(gainDb);
    this.notify();
  }

  public toggleGuitarDirectMonitor() {
    this.state.guitarDirectMonitor = !this.state.guitarDirectMonitor;
    this.audioEngine.guitarEngine.setDirectMonitor(this.state.guitarDirectMonitor, 0.85);
    this.notify();
  }

  public setGuitarTuner(active: boolean, mute?: boolean) {
    this.state.isGuitarTuning = active;
    if (mute !== undefined) {
      this.state.guitarTunerMute = mute;
      this.audioEngine.guitarEngine.setTunerMute(mute);
    }
    this.notify();
  }

  public setGuitarGate(enabled: boolean, thresholdDb?: number) {
    this.state.guitarNoiseGate = enabled;
    this.audioEngine.guitarEngine.isGateEnabled = enabled;
    if (thresholdDb !== undefined) {
      this.state.guitarGateThreshold = thresholdDb;
      this.audioEngine.guitarEngine.gateThresholdDb = thresholdDb;
    }
    this.notify();
  }

  public setGuitarAmpModel(model: GuitarAmpModel) {
    this.state.guitarAmpModel = model;
    this.audioEngine.guitarEngine.setAmpModel(model);
    this.notify();
  }

  public setGuitarAmpSettings(settings: Partial<GuitarAmpSettings>) {
    this.state.guitarAmpSettings = { ...this.state.guitarAmpSettings, ...settings };
    this.audioEngine.guitarEngine.setAmpSettings(this.state.guitarAmpSettings);
    this.notify();
  }

  public setGuitarCabModel(model: GuitarCabModel) {
    this.state.guitarCabModel = model;
    this.audioEngine.guitarEngine.setCabinet(model);
    this.notify();
  }

  public setGuitarPedals(pedals: Partial<GuitarPedalSettings>) {
    this.state.guitarPedals = { ...this.state.guitarPedals, ...pedals };
    this.audioEngine.guitarEngine.setPedalSettings(this.state.guitarPedals);
    this.notify();
  }

  public setGuitarRoutingChannel(channelIndex: number) {
    this.state.guitarRoutingChannel = channelIndex;
    const ch = this.audioEngine.mixer.getChannel(channelIndex);
    this.audioEngine.guitarEngine.routeToMixerChannel(ch);
    this.notify();
  }

  public startGuitarTakeRecording() {
    this.audioEngine.guitarEngine.startRecordingTake();
  }

  public recordGuitarTakeToPlaylist() {
    const buffer = this.audioEngine.guitarEngine.stopRecordingTake();
    if (!buffer) return;

    const clipId = `guitar-riff-${Date.now()}`;
    const durationSeconds = buffer.duration;
    const secondsPerBar = (60 / this.state.bpm) * 4;
    const lengthBars = Math.max(1, Math.round(durationSeconds / secondsPerBar));

    const newClip: PlaylistClip = {
      id: clipId,
      trackIndex: 4, // Guitar arrangement row
      name: 'Guitar Riff Take',
      startBar: 0,
      lengthBars,
      color: '#ef4444',
      type: 'audio',
    };
    this.addPlaylistClip(newClip);
  }

  // VST Host Operations
  public setSelectedVstChannel(channelIndex: number) {
    this.state.selectedVstChannelIndex = channelIndex;
    this.notify();
  }

  public setSelectedVstSlot(slotIndex: number) {
    this.state.selectedVstSlotIndex = slotIndex;
    this.notify();
  }

  public insertVstPlugin(channelIndex: number, pluginId: VstPluginId, slotIndex: number = 0) {
    const instance = this.audioEngine.vstEngine.insertPlugin(channelIndex, pluginId, slotIndex);
    this.state.vstInstances.push(instance);
    this.state.selectedVstChannelIndex = channelIndex;
    this.state.selectedVstSlotIndex = slotIndex;
    this.notify();
    return instance;
  }

  public removeVstPlugin(channelIndex: number, instanceId: string) {
    this.audioEngine.vstEngine.removePlugin(channelIndex, instanceId);
    this.state.vstInstances = this.state.vstInstances.filter((v) => v.instanceId !== instanceId);
    this.notify();
  }

  public setVstBypass(channelIndex: number, instanceId: string, bypass: boolean) {
    this.audioEngine.vstEngine.setPluginBypass(channelIndex, instanceId, bypass);
    const inst = this.state.vstInstances.find((v) => v.instanceId === instanceId);
    if (inst) inst.enabled = !bypass;
    this.notify();
  }

  public setVstMix(channelIndex: number, instanceId: string, mix: number) {
    this.audioEngine.vstEngine.setPluginMix(channelIndex, instanceId, mix);
    const inst = this.state.vstInstances.find((v) => v.instanceId === instanceId);
    if (inst) inst.mix = mix;
    this.notify();
  }

  public setVstParam(channelIndex: number, instanceId: string, paramId: string, value: number | boolean | string) {
    this.audioEngine.vstEngine.setPluginParameter(channelIndex, instanceId, paramId, value);
    const inst = this.state.vstInstances.find((v) => v.instanceId === instanceId);
    if (inst) inst.parameters[paramId] = value;
    this.notify();
  }

  public applyVstPreset(channelIndex: number, instanceId: string, parameters: Record<string, number | boolean | string>) {
    this.audioEngine.vstEngine.applyPreset(channelIndex, instanceId, parameters);
    const inst = this.state.vstInstances.find((v) => v.instanceId === instanceId);
    if (inst) {
      Object.assign(inst.parameters, parameters);
    }
    this.notify();
    this.saveToStorage();
  }

  public sendMidiOut(note: number, velocity: number = 0.8, channel: number = 0) {
    MidiManager.getInstance().sendNoteOn(note, velocity, channel, this.state.selectedMidiOutput || undefined);
  }

  // =========================================================================
  // 1. AUTOMATION ACTIONS
  // =========================================================================
  public addAutomationClip(clipData: Omit<AutomationClip, 'id'>): AutomationClip {
    const newId = `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newClip: AutomationClip = {
      ...clipData,
      id: newId,
    };
    this.state.automationClips.push(newClip);

    // Also add to playlist clips so it renders on the playlist timeline
    this.state.clips.push({
      id: `pl_clip_${newId}`,
      trackIndex: newClip.trackIndex,
      automationClipId: newId,
      name: newClip.name,
      startBar: newClip.startBar,
      lengthBars: newClip.lengthBars,
      color: newClip.color,
      type: 'automation',
    });

    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
    return newClip;
  }

  public removeAutomationClip(id: string) {
    this.state.automationClips = this.state.automationClips.filter((c) => c.id !== id);
    this.state.clips = this.state.clips.filter((c) => c.automationClipId !== id);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public updateAutomationClip(id: string, updates: Partial<AutomationClip>) {
    const clip = this.state.automationClips.find((c) => c.id === id);
    if (!clip) return;
    Object.assign(clip, updates);

    const plClip = this.state.clips.find((c) => c.automationClipId === id);
    if (plClip) {
      if (updates.name !== undefined) plClip.name = updates.name;
      if (updates.color !== undefined) plClip.color = updates.color;
      if (updates.startBar !== undefined) plClip.startBar = updates.startBar;
      if (updates.lengthBars !== undefined) plClip.lengthBars = updates.lengthBars;
      if (updates.trackIndex !== undefined) plClip.trackIndex = updates.trackIndex;
    }

    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public addAutomationNode(clipId: string, bar: number, value: number, tension: number = 0): AutomationNode {
    const clip = this.state.automationClips.find((c) => c.id === clipId);
    const newNode: AutomationNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bar,
      value: Math.max(0, Math.min(1, value)),
      tension: Math.max(-1, Math.min(1, tension)),
    };
    if (clip) {
      clip.nodes.push(newNode);
      clip.nodes.sort((a, b) => a.bar - b.bar);
      this.syncAudioEngineData();
      this.notify();
      this.saveToStorage();
    }
    return newNode;
  }

  public updateAutomationNode(clipId: string, nodeId: string, updates: Partial<AutomationNode>) {
    const clip = this.state.automationClips.find((c) => c.id === clipId);
    if (!clip) return;
    const node = clip.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (updates.bar !== undefined) node.bar = Math.max(0, updates.bar);
    if (updates.value !== undefined) node.value = Math.max(0, Math.min(1, updates.value));
    if (updates.tension !== undefined) node.tension = Math.max(-1, Math.min(1, updates.tension));
    clip.nodes.sort((a, b) => a.bar - b.bar);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public removeAutomationNode(clipId: string, nodeId: string) {
    const clip = this.state.automationClips.find((c) => c.id === clipId);
    if (!clip || clip.nodes.length <= 1) return;
    clip.nodes = clip.nodes.filter((n) => n.id !== nodeId);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // =========================================================================
  // 2. SIDECHAIN DUCKING ACTIONS
  // =========================================================================
  public addSidechainRoute(routeData: Omit<SidechainRoute, 'id'>): SidechainRoute {
    const newRoute: SidechainRoute = {
      ...routeData,
      id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.state.sidechainRoutes.push(newRoute);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
    return newRoute;
  }

  public updateSidechainRoute(id: string, updates: Partial<SidechainRoute>) {
    const route = this.state.sidechainRoutes.find((r) => r.id === id);
    if (!route) return;
    Object.assign(route, updates);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  public removeSidechainRoute(id: string) {
    this.state.sidechainRoutes = this.state.sidechainRoutes.filter((r) => r.id !== id);
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // =========================================================================
  // 3. INTELLIGENT TRANSIENT SLICER (SLICEX) ACTIONS
  // =========================================================================
  public async loadSlicexDemo() {
    await this.audioEngine.resumeContext();
    const demoBuffer = TransientSlicer.createDemoBreakbeat(this.audioEngine.ctx);
    const slices = TransientSlicer.detectSlices(demoBuffer, this.state.slicexSession.sensitivity, 2, 130);
    this.state.slicexSession = {
      audioBuffer: demoBuffer,
      fileName: 'Eve_Trap_Breakbeat_130bpm.wav',
      slices,
      selectedSliceId: slices[0]?.id || null,
      sensitivity: this.state.slicexSession.sensitivity,
      bpm: 130,
      bars: 2,
    };
    this.notify();
  }

  public async loadSlicexFile(file: File) {
    await this.audioEngine.resumeContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.audioEngine.ctx.decodeAudioData(arrayBuffer.slice(0));
    const slices = TransientSlicer.detectSlices(decoded, this.state.slicexSession.sensitivity, 2, this.state.bpm);
    this.state.slicexSession = {
      audioBuffer: decoded,
      fileName: file.name,
      slices,
      selectedSliceId: slices[0]?.id || null,
      sensitivity: this.state.slicexSession.sensitivity,
      bpm: this.state.bpm,
      bars: Math.max(1, Math.round(decoded.duration / ((60 / this.state.bpm) * 4))),
    };
    this.notify();
  }

  public setSlicexSensitivity(sens: number) {
    const clamped = Math.max(0, Math.min(100, sens));
    this.state.slicexSession.sensitivity = clamped;
    if (this.state.slicexSession.audioBuffer) {
      const slices = TransientSlicer.detectSlices(
        this.state.slicexSession.audioBuffer,
        clamped,
        this.state.slicexSession.bars,
        this.state.slicexSession.bpm
      );
      this.state.slicexSession.slices = slices;
      if (!slices.some((s) => s.id === this.state.slicexSession.selectedSliceId)) {
        this.state.slicexSession.selectedSliceId = slices[0]?.id || null;
      }
    }
    this.notify();
  }

  public selectSlicexSlice(sliceId: string | null) {
    this.state.slicexSession.selectedSliceId = sliceId;
    this.notify();
  }

  public auditionSlicexSlice(slice: AudioSlice) {
    if (!this.state.slicexSession.audioBuffer) return;
    this.audioEngine.resumeContext();
    TransientSlicer.auditionSlice(this.state.slicexSession.audioBuffer, slice, this.audioEngine.ctx);
  }

  public dumpSlicexToChannelRack(mode: 'chromatic' | 'kit' = 'kit') {
    const session = this.state.slicexSession;
    if (!session.audioBuffer || session.slices.length === 0) return;

    if (mode === 'kit') {
      const newTracks: ChannelTrack[] = session.slices.slice(0, 8).map((slice, idx) => {
        const sliceBuffer = TransientSlicer.extractSliceBuffer(session.audioBuffer!, slice, this.audioEngine.ctx);
        const url = URL.createObjectURL(OfflineRenderer.audioBufferToWav(sliceBuffer, 16));
        return {
          id: `t_slice_${Date.now()}_${idx}`,
          name: `Slice ${idx + 1} (${(slice.duration * 1000).toFixed(0)}ms)`,
          type: 'drum',
          soundId: 'kick',
          customAudioUrl: url,
          color: slice.color,
          volume: 0.9,
          pan: 0,
          mute: false,
          solo: false,
          mixerChannelIndex: 1,
          steps: {
            'pat-1': Array.from({ length: 16 }, (_, stepIdx) => ({
              active: stepIdx === idx * 2,
              velocity: 0.85,
            })),
          },
        };
      });

      this.state.tracks.push(...newTracks);
    } else {
      const pat = this.state.patterns.find((p) => p.id === this.state.selectedPatternId);
      if (pat) {
        pat.notes = pat.notes || [];
        session.slices.slice(0, 16).forEach((slice, idx) => {
          pat.notes!.push({
            id: `snote_${Date.now()}_${idx}`,
            trackId: this.state.selectedTrackId,
            midiNote: 60 + idx,
            startStep: idx,
            durationSteps: 1,
            velocity: 0.85,
          });
        });
      }
    }

    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // =========================================================================
  // 4. AI MIXING DOCTOR ACTIONS
  // =========================================================================
  public runDoctorDiagnostics() {
    const { alerts } = MixingDoctor.getInstance().diagnoseMix(
      this.audioEngine.mixer,
      this.state.mixerChannels
    );
    this.state.spectralAlerts = alerts;
    this.notify();
    return alerts;
  }

  public autoFixCollision(alertId: string) {
    const alert = this.state.spectralAlerts.find((a) => a.id === alertId);
    if (!alert) return;

    if (alert.suggestedAction === 'sidechain') {
      const existing = this.state.sidechainRoutes.find(
        (r) => r.sourceChannelIndex === alert.channelA && r.targetChannelIndex === alert.channelB
      );
      if (!existing) {
        this.addSidechainRoute({
          enabled: true,
          name: `${alert.channelAName} -> ${alert.channelBName} Auto Ducking`,
          sourceChannelIndex: alert.channelA,
          targetChannelIndex: alert.channelB,
          thresholdDb: -16,
          duckingDepthDb: 14,
          attackMs: 2.5,
          releaseMs: 140,
          mode: 'lowShelf',
        });
      }
    } else if (alert.suggestedAction === 'notchEq') {
      const ch = this.state.mixerChannels[alert.channelA];
      if (ch) {
        ch.effects.eqEnabled = true;
        if (ch.effects.eqBands && ch.effects.eqBands[2]) {
          ch.effects.eqBands[2].gain = -3.5;
          ch.effects.eqBands[2].frequency = 250;
          ch.effects.eqBands[2].q = 2.0;
        }
        this.audioEngine.mixer.getChannel(alert.channelA).updateEffects(ch.effects);
      }
    } else if (alert.suggestedAction === 'highpass') {
      const ch = this.state.mixerChannels[alert.channelA];
      if (ch) {
        ch.effects.eqEnabled = true;
        if (ch.effects.eqBands && ch.effects.eqBands[0]) {
          ch.effects.eqBands[0].gain = 0;
          ch.effects.eqBands[0].frequency = 110;
        }
        this.audioEngine.mixer.getChannel(alert.channelA).updateEffects(ch.effects);
      }
    }

    this.state.spectralAlerts = this.state.spectralAlerts.filter((a) => a.id !== alertId);
    this.notify();
    this.saveToStorage();
  }

  // =========================================================================
  // 5. HARDWARE MIDI LEARN ACTIONS
  // =========================================================================
  public startMidiLearn(target: MidiLearnTarget) {
    MidiLearnManager.getInstance().startLearn(target);
  }

  public cancelMidiLearn() {
    MidiLearnManager.getInstance().cancelLearn();
  }

  public removeMidiMapping(id: string) {
    MidiLearnManager.getInstance().removeMapping(id);
  }

  public clearMidiMappings() {
    MidiLearnManager.getInstance().clearAll();
  }

  public handleMidiCcParameterChange(mapping: MidiCcMapping, val: number) {
    switch (mapping.targetType) {
      case 'mixerVolume':
        if (mapping.channelIndex !== undefined) {
          this.updateMixerChannel(mapping.channelIndex, { volume: val });
        }
        break;
      case 'mixerPan':
        if (mapping.channelIndex !== undefined) {
          this.updateMixerChannel(mapping.channelIndex, { pan: val });
        }
        break;
      case 'mixerMute':
        if (mapping.channelIndex !== undefined) {
          const currentMute = this.state.mixerChannels[mapping.channelIndex]?.mute || false;
          this.updateMixerChannel(mapping.channelIndex, { mute: !currentMute });
        }
        break;
      case 'synthCutoff':
        this.setSynthParams({ ...this.state.synthParams, filterCutoff: val });
        break;
      case 'tempo':
        this.setBpm(Math.round(val));
        break;
      case 'vstParam':
        if (mapping.channelIndex !== undefined && mapping.paramId) {
          const inst = this.state.vstInstances.find((v) => v.channelIndex === mapping.channelIndex);
          if (inst) {
            this.setVstParam(mapping.channelIndex, inst.instanceId, mapping.paramId, val);
          }
        }
        break;
    }
  }

  // =========================================================================
  // 6. IMPULSE RESPONSE ACTIONS
  // =========================================================================
  public async loadCustomImpulse(file: File) {
    await this.audioEngine.resumeContext();
    const meta = await ConvolutionEngine.getInstance().loadCustomImpulse(file, this.audioEngine.ctx);
    this.state.impulseResponses = ConvolutionEngine.getInstance().getAvailableImpulses();
    this.notify();
    return meta;
  }

  public async applyCabinetImpulse(cabId: string) {
    const buffer = await ConvolutionEngine.getInstance().getImpulseBuffer(cabId, this.audioEngine.ctx);
    const guitarChan = this.audioEngine.mixer.getChannel(7);
    guitarChan.effectsChain.setImpulseBuffer(buffer);
  }
}

export const dawStore = new Store();

export function useDawStore(): [DawStoreState, typeof dawStore] {
  const [state, setState] = useState<DawStoreState>(() => dawStore.getState());

  useEffect(() => {
    return dawStore.subscribe(() => {
      setState({ ...dawStore.getState() });
    });
  }, []);

  return [state, dawStore];
}
