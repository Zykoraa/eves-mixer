import { Mixer } from './Mixer';
import { DrumSynth } from './DrumSynth';
import { SynthEngine } from './SynthEngine';
import { LooperStation } from './LooperStation';
import { InstrumentEngine } from './InstrumentEngine';
import { ChannelTrack, Pattern, PlaylistClip, PlaybackMode, SynthParameters } from '../types/daw';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext;
  public mixer: Mixer;
  public drumSynth: DrumSynth;
  public synthEngine: SynthEngine;
  public instrumentEngine: InstrumentEngine;
  public looperStation: LooperStation;

  // Transport & Clock State
  public isPlaying: boolean = false;
  public bpm: number = 130;
  public swing: number = 0; // 0 to 100%
  public playbackMode: PlaybackMode = 'pattern';
  public metronomeEnabled: boolean = false;

  // Step sequencer clock
  private currentStep: number = 0; // 16th note step index (0 to 63)
  private nextStepTime: number = 0;
  private timerId: number | null = null;
  private readonly lookaheadMs: number = 25.0; // clock interval ms
  private readonly scheduleAheadSec: number = 0.1; // lookahead schedule window

  // Song position tracking
  public currentBar: number = 0;
  public totalBarsInSong: number = 32;

  // Listeners for UI playhead sync
  private onStepListeners: Set<(step: number, bar: number) => void> = new Set();
  private onBarListeners: Set<(bar: number) => void> = new Set();
  private onStopListeners: Set<() => void> = new Set();

  // Active data references (updated from store)
  private currentTracks: ChannelTrack[] = [];
  private currentPattern: Pattern | null = null;
  private allPatterns: Pattern[] = [];
  private playlistClips: PlaylistClip[] = [];
  private synthParams: SynthParameters | null = null;

  private constructor() {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master routing
    this.mixer = new Mixer(this.ctx, this.ctx.destination);
    this.drumSynth = new DrumSynth(this.ctx);
    this.synthEngine = new SynthEngine(this.ctx);
    this.instrumentEngine = new InstrumentEngine(this.ctx);
    // Route looper to insert channel 6 by default (Channel 6 = Looper)
    const looperChannel = this.mixer.getChannel(6);
    this.looperStation = new LooperStation(this.ctx, looperChannel.inputNode);
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async resumeContext(): Promise<void> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public updateProjectData(
    tracks: ChannelTrack[],
    pattern: Pattern | null,
    allPatterns: Pattern[],
    clips: PlaylistClip[],
    synthParams: SynthParameters
  ) {
    this.currentTracks = tracks;
    this.currentPattern = pattern;
    this.allPatterns = allPatterns;
    this.playlistClips = clips;
    this.synthParams = synthParams;
  }

  public addStepListener(cb: (step: number, bar: number) => void) {
    this.onStepListeners.add(cb);
    return () => this.onStepListeners.delete(cb);
  }

  public addBarListener(cb: (bar: number) => void) {
    this.onBarListeners.add(cb);
    return () => this.onBarListeners.delete(cb);
  }

  public addStopListener(cb: () => void) {
    this.onStopListeners.add(cb);
    return () => this.onStopListeners.delete(cb);
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(260, bpm));
  }

  public setSwing(swing: number) {
    this.swing = Math.max(0, Math.min(100, swing));
  }

  public setPlaybackMode(mode: PlaybackMode) {
    this.playbackMode = mode;
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public start() {
    if (this.isPlaying) return;
    this.resumeContext();
    this.isPlaying = true;
    this.currentStep = 0;
    this.currentBar = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    this.timerId = window.setInterval(() => this.scheduler(), this.lookaheadMs);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
    this.currentBar = 0;
    this.synthEngine.stopAllVoices();
    this.onStopListeners.forEach((cb) => cb());
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.synthEngine.stopAllVoices();
  }

  private scheduler() {
    // While there are steps that will need to play before next interval window
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    // 16th note duration = (60 / BPM) / 4
    const secondsPer16th = 60.0 / this.bpm / 4.0;

    // Swing calculation: delay every odd 16th note (steps 1, 3, 5, etc.)
    let stepDuration = secondsPer16th;
    if (this.swing > 0) {
      const swingFraction = (this.swing / 100) * 0.5 * secondsPer16th;
      if (this.currentStep % 2 === 0) {
        stepDuration = secondsPer16th + swingFraction;
      } else {
        stepDuration = Math.max(0.01, secondsPer16th - swingFraction);
      }
    }

    this.nextStepTime += stepDuration;
    this.currentStep++;

    if (this.playbackMode === 'pattern') {
      const patternLength = this.currentPattern?.lengthSteps || 16;
      if (this.currentStep >= patternLength) {
        this.currentStep = 0;
        this.currentBar++;
        this.onBarListeners.forEach((cb) => cb(this.currentBar));
      }
    } else {
      // Song Mode: 16 steps per bar
      if (this.currentStep % 16 === 0) {
        this.currentBar = Math.floor(this.currentStep / 16);
        this.onBarListeners.forEach((cb) => cb(this.currentBar));
        if (this.currentBar >= this.totalBarsInSong) {
          this.currentStep = 0;
          this.currentBar = 0;
        }
      }
    }
  }

  private scheduleStep(stepIndex: number, time: number) {
    const stepInPattern = this.playbackMode === 'pattern'
      ? stepIndex % (this.currentPattern?.lengthSteps || 16)
      : stepIndex % 16;

    const currentBar = Math.floor(stepIndex / 16);

    // Notify UI (throttled smoothly)
    setTimeout(() => {
      if (this.isPlaying) {
        this.onStepListeners.forEach((cb) => cb(stepInPattern, currentBar));
      }
    }, Math.max(0, (time - this.ctx.currentTime) * 1000));

    // Metronome
    if (this.metronomeEnabled && stepInPattern % 4 === 0) {
      const isDownbeat = stepInPattern === 0;
      this.playMetronomeClick(time, isDownbeat);
    }

    if (this.playbackMode === 'pattern') {
      if (!this.currentPattern) return;
      this.schedulePatternStep(this.currentPattern, stepInPattern, time);
    } else {
      this.scheduleSongStep(stepIndex, time);
    }
  }

  private schedulePatternStep(pattern: Pattern, step: number, time: number) {
    // 1. Channel rack drum/synth steps
    for (const track of this.currentTracks) {
      if (track.mute) continue;

      const trackSteps = track.steps[pattern.id];
      if (trackSteps && trackSteps[step] && trackSteps[step].active) {
        const stepData = trackSteps[step];
        const mixerChan = this.mixer.getChannel(track.mixerChannelIndex);

        if (track.type === 'drum' && track.soundId) {
          this.drumSynth.trigger(
            track.soundId,
            time,
            stepData.velocity * track.volume,
            mixerChan.inputNode,
            track.customAudioUrl,
            track.drumKitId || 'trap'
          );
        } else if (track.type === 'instrument' && track.instrumentId) {
          const basePitch = 60 + (stepData.pitchOffset || 0);
          this.instrumentEngine.noteOn(
            track.instrumentId,
            basePitch,
            stepData.velocity * track.volume,
            time,
            mixerChan.inputNode
          );
          const durSeconds = (60 / this.bpm / 4) * 1.5;
          setTimeout(() => {
            this.instrumentEngine.noteOff(track.instrumentId!, basePitch, time + durSeconds);
          }, durSeconds * 1000);
        } else if (track.type === 'sampler' && track.customAudioUrl) {
          this.drumSynth.trigger(
            'kick',
            time,
            stepData.velocity * track.volume,
            mixerChan.inputNode,
            track.customAudioUrl,
            track.drumKitId || 'trap'
          );
        } else if (track.type === 'synth' && this.synthParams) {
          // Play base note for step sequencer (e.g. C3 = 48)
          const basePitch = 48 + (stepData.pitchOffset || 0);
          this.synthEngine.noteOn(basePitch, stepData.velocity * track.volume, time, this.synthParams, mixerChan.inputNode);
          const durSeconds = (60 / this.bpm / 4) * 1.5;
          setTimeout(() => {
            this.synthEngine.noteOff(basePitch, time + durSeconds, this.synthParams!);
          }, durSeconds * 1000);
        }
      }
    }

    // 2. Piano roll notes in this pattern
    if (pattern.notes && pattern.notes.length > 0) {
      for (const note of pattern.notes) {
        if (note.startStep === step) {
          const track = this.currentTracks.find((t) => t.id === note.trackId);
          if (!track || track.mute) continue;
          const mixerChan = this.mixer.getChannel(track.mixerChannelIndex);

          if (track.type === 'synth' && this.synthParams) {
            this.synthEngine.noteOn(note.midiNote, note.velocity * track.volume, time, this.synthParams, mixerChan.inputNode);
            const durSeconds = (note.durationSteps * 60) / this.bpm / 4;
            setTimeout(() => {
              this.synthEngine.noteOff(note.midiNote, time + durSeconds, this.synthParams!);
            }, durSeconds * 1000);
          } else if (track.type === 'instrument' && track.instrumentId) {
            this.instrumentEngine.noteOn(note.trackId && track.instrumentId, note.midiNote, note.velocity * track.volume, time, mixerChan.inputNode);
            const durSeconds = (note.durationSteps * 60) / this.bpm / 4;
            setTimeout(() => {
              this.instrumentEngine.noteOff(track.instrumentId!, note.midiNote, time + durSeconds);
            }, durSeconds * 1000);
          }
        }
      }
    }
  }

  private scheduleSongStep(stepIndex: number, time: number) {
    const currentBar = stepIndex / 16;

    // Find all pattern clips active at this current bar
    for (const clip of this.playlistClips) {
      if (clip.type === 'pattern' && clip.patternId) {
        if (currentBar >= clip.startBar && currentBar < clip.startBar + clip.lengthBars) {
          const pattern = this.allPatterns.find((p) => p.id === clip.patternId);
          if (pattern) {
            const stepInsideClip = (stepIndex - clip.startBar * 16) % pattern.lengthSteps;
            this.schedulePatternStep(pattern, stepInsideClip, time);
          }
        }
      }
    }
  }

  private playMetronomeClick(time: number, isAccent: boolean) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.04);
  }
}
