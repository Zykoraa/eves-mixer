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

// Default initial tracks
const createInitialTracks = (): ChannelTrack[] => [
  {
    id: 't-kick',
    name: 'Kick Punch',
    type: 'drum',
    soundId: 'kick',
    color: '#ff5722',
    volume: 0.9,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 1,
    steps: {
      'pat-1': [
        { active: true, velocity: 1.0 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.95 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.7 },
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
        { active: true, velocity: 1.0 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 1.0 },
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
    volume: 0.8,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 1,
    steps: {
      'pat-1': Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
    },
  },
  {
    id: 't-hat-c',
    name: 'Closed Hat',
    type: 'drum',
    soundId: 'hihat_closed',
    color: '#00d2ff',
    volume: 0.7,
    pan: -0.1,
    mute: false,
    solo: false,
    mixerChannelIndex: 2,
    steps: {
      'pat-1': Array.from({ length: 16 }, (_, i) => ({ active: i % 2 === 0, velocity: i % 4 === 0 ? 0.9 : 0.6 })),
    },
  },
  {
    id: 't-hat-o',
    name: 'Open Hat',
    type: 'drum',
    soundId: 'hihat_open',
    color: '#38bdf8',
    volume: 0.65,
    pan: 0.2,
    mute: false,
    solo: false,
    mixerChannelIndex: 2,
    steps: {
      'pat-1': [
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.75 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.75 },
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
    volume: 0.9,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 3,
    steps: {
      'pat-1': [
        { active: true, velocity: 1.0 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: true, velocity: 0.9 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
        { active: false, velocity: 0.8 },
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
    id: 't-sample',
    name: 'Vocal / Sample Pad',
    type: 'sampler',
    soundId: 'fx',
    color: '#22c55e',
    volume: 0.8,
    pan: 0,
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
    volume: 0.9,
    pan: 0,
    mute: false,
    solo: false,
    mixerChannelIndex: 5,
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
    volume: 0.85,
    pan: 0.1,
    mute: false,
    solo: false,
    mixerChannelIndex: 5,
    steps: {
      'pat-1': Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
    },
  },
];

const createInitialPatterns = (): Pattern[] => [
  {
    id: 'pat-1',
    name: 'Pattern 1 (Main Groove)',
    color: '#ff763b',
    lengthSteps: 16,
    notes: [
      // Melodic notes for synth track
      { id: 'n-1', trackId: 't-synth', midiNote: 60, startStep: 0, durationSteps: 2, velocity: 0.85 }, // C4
      { id: 'n-2', trackId: 't-synth', midiNote: 63, startStep: 4, durationSteps: 2, velocity: 0.85 }, // Eb4
      { id: 'n-3', trackId: 't-synth', midiNote: 65, startStep: 8, durationSteps: 3, velocity: 0.9 },  // F4
      { id: 'n-4', trackId: 't-synth', midiNote: 67, startStep: 12, durationSteps: 2, velocity: 0.8 }, // G4
      { id: 'n-5', trackId: 't-synth', midiNote: 63, startStep: 14, durationSteps: 2, velocity: 0.85 },
    ],
  },
  {
    id: 'pat-2',
    name: 'Pattern 2 (Chords)',
    color: '#38bdf8',
    lengthSteps: 16,
    notes: [
      { id: 'c-1', trackId: 't-synth', midiNote: 60, startStep: 0, durationSteps: 7, velocity: 0.75 },
      { id: 'c-2', trackId: 't-synth', midiNote: 63, startStep: 0, durationSteps: 7, velocity: 0.75 },
      { id: 'c-3', trackId: 't-synth', midiNote: 67, startStep: 0, durationSteps: 7, velocity: 0.75 },
      { id: 'c-4', trackId: 't-synth', midiNote: 58, startStep: 8, durationSteps: 7, velocity: 0.75 },
      { id: 'c-5', trackId: 't-synth', midiNote: 62, startStep: 8, durationSteps: 7, velocity: 0.75 },
      { id: 'c-6', trackId: 't-synth', midiNote: 65, startStep: 8, durationSteps: 7, velocity: 0.75 },
    ],
  },
];

const createInitialClips = (): PlaylistClip[] => [
  { id: 'clip-1', trackIndex: 0, patternId: 'pat-1', name: 'Main Groove', startBar: 0, lengthBars: 4, color: '#ff763b', type: 'pattern' },
  { id: 'clip-2', trackIndex: 1, patternId: 'pat-2', name: 'Chords Layer', startBar: 2, lengthBars: 6, color: '#38bdf8', type: 'pattern' },
  { id: 'clip-3', trackIndex: 0, patternId: 'pat-1', name: 'Main Groove (Hook)', startBar: 4, lengthBars: 4, color: '#ff763b', type: 'pattern' },
];

const createInitialMixerChannels = (): MixerChannel[] => [
  { id: 'mix-0', name: 'Master', color: '#ff763b', volume: 0.95, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-1', name: 'Drums', color: '#f97316', volume: 0.9, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-2', name: 'Hi-Hats', color: '#00d2ff', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-3', name: '808 Bass', color: '#a855f7', volume: 0.95, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-4', name: 'Eve Synth', color: '#ec4899', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS, reverbEnabled: true, reverbMix: 0.3 } },
  { id: 'mix-5', name: 'Sampler/Keys', color: '#22c55e', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-6', name: 'Mic Looper', color: '#eab308', volume: 0.9, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS, compressorEnabled: true, reverbEnabled: true, reverbMix: 0.2 } },
  { id: 'mix-7', name: 'Insert 7', color: '#64748b', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
  { id: 'mix-8', name: 'Insert 8', color: '#64748b', volume: 0.85, pan: 0, mute: false, solo: false, peakL: 0, peakR: 0, effects: { ...DEFAULT_FX_SETTINGS } },
];

const createInitialLooperDecks = (): LooperDeck[] => [
  { id: 'deck-1', deckNumber: 1, name: 'Deck 1 (Beatbox/Drums)', status: 'empty', recordedBars: 2, audioBuffer: null, volume: 0.85, pan: 0, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, waveform: [] },
  { id: 'deck-2', deckNumber: 2, name: 'Deck 2 (Bassline / Vocal)', status: 'empty', recordedBars: 2, audioBuffer: null, volume: 0.85, pan: 0, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, waveform: [] },
  { id: 'deck-3', deckNumber: 3, name: 'Deck 3 (Harmonies / Hook)', status: 'empty', recordedBars: 4, audioBuffer: null, volume: 0.8, pan: -0.2, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, waveform: [] },
  { id: 'deck-4', deckNumber: 4, name: 'Deck 4 (Acoustic / Lead)', status: 'empty', recordedBars: 4, audioBuffer: null, volume: 0.8, pan: 0.2, mute: false, solo: false, reverse: false, halfSpeed: false, pitchShift: 0, waveform: [] },
];

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
        initialState = JSON.parse(saved);
      } catch (e) {
        console.warn('Could not parse saved state:', e);
      }
    }

    this.state = {
      projectName: initialState.projectName || "Eve's Mixer Project",
      isPlaying: false,
      bpm: initialState.bpm || 132,
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
    };

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
      this.state.synthParams
    );
  }

  public saveToStorage() {
    try {
      const copy = {
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

    if (updates.volume !== undefined || updates.pan !== undefined || updates.mute !== undefined) {
      this.audioEngine.looperStation.updateDeckParameters(
        deck.deckNumber,
        deck.mute ? 0 : deck.volume,
        deck.pan,
        deck.mute
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
      name: `Mic Loop ${deckNumber}`,
      startBar: 0,
      lengthBars: deck.recordedBars,
      color: '#eab308',
      type: 'audio',
    };
    this.addPlaylistClip(newClip);
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

  public applyDrumPreset(style: 'trap' | 'boomBap' | 'house' | 'drill') {
    const patId = this.state.selectedPatternId;
    const kick = this.state.tracks.find((t) => t.soundId === 'kick');
    const clap = this.state.tracks.find((t) => t.soundId === 'clap');
    const snare = this.state.tracks.find((t) => t.soundId === 'snare');
    const hat = this.state.tracks.find((t) => t.soundId === 'hihat_closed');
    const sub = this.state.tracks.find((t) => t.soundId === '808');

    // Clear existing drum steps
    [kick, clap, snare, hat, sub].forEach((t) => {
      if (t) t.steps[patId] = Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 }));
    });

    if (style === 'trap') {
      this.setBpm(140);
      if (kick) [0, 8, 14].forEach((s) => (kick.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (clap) [4, 12].forEach((s) => (clap.steps[patId][s] = { active: true, velocity: 0.95 }));
      if (hat) {
        // Fast rolling hats
        for (let i = 0; i < 16; i++) {
          hat.steps[patId][i] = { active: true, velocity: i % 4 === 0 ? 0.9 : 0.65 };
        }
      }
      if (sub) [0, 8].forEach((s) => (sub.steps[patId][s] = { active: true, velocity: 0.95 }));
    } else if (style === 'house') {
      this.setBpm(126);
      if (kick) [0, 4, 8, 12].forEach((s) => (kick.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (clap) [4, 12].forEach((s) => (clap.steps[patId][s] = { active: true, velocity: 0.9 }));
      if (hat) [2, 6, 10, 14].forEach((s) => (hat.steps[patId][s] = { active: true, velocity: 0.8 }));
    } else if (style === 'boomBap') {
      this.setBpm(92);
      this.setSwing(25);
      if (kick) [0, 6, 10].forEach((s) => (kick.steps[patId][s] = { active: true, velocity: 0.95 }));
      if (snare) [4, 12].forEach((s) => (snare.steps[patId][s] = { active: true, velocity: 0.9 }));
      if (hat) {
        for (let i = 0; i < 16; i += 2) {
          hat.steps[patId][i] = { active: true, velocity: 0.75 };
        }
      }
    } else if (style === 'drill') {
      this.setBpm(142);
      if (kick) [0, 10].forEach((s) => (kick.steps[patId][s] = { active: true, velocity: 1.0 }));
      if (snare) [6, 14].forEach((s) => (snare.steps[patId][s] = { active: true, velocity: 0.95 }));
      if (hat) [0, 3, 6, 8, 11, 14].forEach((s) => (hat.steps[patId][s] = { active: true, velocity: 0.8 }));
      if (sub) [0, 10].forEach((s) => (sub.steps[patId][s] = { active: true, velocity: 0.95 }));
    }

    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
  }

  // Randomize melody strictly locked to selected musical scale!
  public randomizeMelody() {
    const pat = this.state.patterns.find((p) => p.id === this.state.selectedPatternId);
    if (!pat) return;

    const intervals = SCALE_INTERVALS[this.state.selectedScale];
    const rootIndex = NOTE_NAMES.indexOf(this.state.selectedKey);
    const rootMidi = 60 + rootIndex; // C4 base

    const newNotes: PianoNote[] = [];
    // Pick 6-8 rhythmic steps
    const stepChoices = [0, 2, 4, 6, 8, 10, 12, 14];
    stepChoices.forEach((step) => {
      if (Math.random() > 0.3) {
        const randInterval = intervals[Math.floor(Math.random() * intervals.length)];
        const octaveOffset = Math.random() > 0.5 ? 0 : 12;
        newNotes.push({
          id: `rand-${step}-${Date.now()}`,
          trackId: 't-synth',
          midiNote: rootMidi + randInterval + octaveOffset,
          startStep: step,
          durationSteps: Math.random() > 0.5 ? 2 : 1,
          velocity: 0.7 + Math.random() * 0.25,
        });
      }
    });

    pat.notes = newNotes;
    this.syncAudioEngineData();
    this.notify();
    this.saveToStorage();
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
