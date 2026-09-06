import { Mixer } from './Mixer';
import { DrumSynth } from './DrumSynth';
import { SynthEngine } from './SynthEngine';
import { LooperStation } from './LooperStation';
import { InstrumentEngine } from './InstrumentEngine';
import { GuitarEngine } from './GuitarEngine';
import { VstEngine } from './VstEngine';
import { SidechainManager } from './SidechainManager';
import { ConvolutionEngine } from './ConvolutionEngine';
import { GrossBeatEngine } from './GrossBeatEngine';
import {
  ChannelTrack,
  Pattern,
  PlaylistClip,
  PlaybackMode,
  SynthParameters,
  AutomationClip,
  AutomationNode,
  AutomationTarget,
} from '../types/daw';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext;
  public mixer: Mixer;
  public drumSynth: DrumSynth;
  public synthEngine: SynthEngine;
  public instrumentEngine: InstrumentEngine;
  public looperStation: LooperStation;
  public guitarEngine: GuitarEngine;
  public vstEngine: VstEngine;
  public sidechainManager: SidechainManager;
  public convolutionEngine: ConvolutionEngine;
  public grossBeatEngine: GrossBeatEngine;
  private audioBufferCache: Map<string, AudioBuffer> = new Map();

  // Automation
  private automationClips: AutomationClip[] = [];

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

    // Initialize Guitar Engine & route to insert channel 7 (Channel 7 = Guitar)
    this.guitarEngine = GuitarEngine.getInstance(this.ctx);
    const guitarChannel = this.mixer.getChannel(7);
    this.guitarEngine.routeToMixerChannel(guitarChannel);
    this.looperStation.setAuxInputs(this.mixer.masterChannel.inputNode, guitarChannel.inputNode);

    // Initialize VST Host Engine
    this.vstEngine = VstEngine.getInstance(this.ctx);

    // Initialize Sidechain Manager
    this.sidechainManager = SidechainManager.getInstance();
    this.sidechainManager.init(this.ctx, this.mixer);

    // Initialize Convolution Engine
    this.convolutionEngine = ConvolutionEngine.getInstance();

    // Initialize Gross Beat Engine
    this.grossBeatEngine = GrossBeatEngine.getInstance();
    this.grossBeatEngine.init(this.ctx);
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
    synthParams: SynthParameters,
    automationClips?: AutomationClip[]
  ) {
    this.currentTracks = tracks;
    this.currentPattern = pattern;
    this.allPatterns = allPatterns;
    this.playlistClips = clips;
    this.synthParams = synthParams;
    if (automationClips) {
      this.automationClips = automationClips;
    }
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
    this.grossBeatEngine.setBpm(this.bpm);
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
    this.grossBeatEngine.setTransport(true, 0);

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
    this.grossBeatEngine.setTransport(false, 0);
    this.synthEngine.stopAllVoices();
    this.onStopListeners.forEach((cb) => cb());
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.grossBeatEngine.setTransport(false, 0);
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
    // 16th note step duration in seconds
    const stepDuration = 60.0 / this.bpm / 4.0;

    // 1. Channel rack drum/synth steps
    for (const track of this.currentTracks) {
      if (track.mute) continue;

      const trackSteps = track.steps[pattern.id];
      if (trackSteps && trackSteps[step] && trackSteps[step].active) {
        const stepData = trackSteps[step];
        const mixerChan = this.mixer.getChannel(track.mixerChannelIndex);
        this.sidechainManager.triggerDucking(track.mixerChannelIndex, time);

        // Trap / Drill Ratchet Sub-steps (2x, 3x triplet, 4x, 8x roll)
        const ratchet = stepData.ratchetCount && stepData.ratchetCount > 1 ? stepData.ratchetCount : 1;
        const subStepDur = stepDuration / ratchet;

        for (let r = 0; r < ratchet; r++) {
          const subTime = time + r * subStepDur;
          let subVel = stepData.velocity * track.volume;

          if (ratchet > 1) {
            if (stepData.velocityRamp === 'up') {
              subVel = (stepData.velocity * (0.35 + 0.65 * (r / (ratchet - 1)))) * track.volume;
            } else if (stepData.velocityRamp === 'down') {
              subVel = (stepData.velocity * (1.0 - 0.65 * (r / (ratchet - 1)))) * track.volume;
            }
          }
          const subPitch = (stepData.pitchOffset || 0) +
            (ratchet > 1 && stepData.pitchRamp ? (stepData.pitchRamp * r) / (ratchet - 1) : 0);

          if (track.type === 'drum' && track.soundId) {
            this.drumSynth.trigger(
              track.soundId,
              subTime,
              subVel,
              mixerChan.inputNode,
              track.customAudioUrl,
              track.drumKitId || 'trap',
              subPitch
            );
          } else if (track.type === 'instrument' && track.instrumentId) {
            const basePitch = 60 + subPitch;
            this.instrumentEngine.noteOn(
              track.instrumentId,
              basePitch,
              subVel,
              subTime,
              mixerChan.inputNode
            );
            const durSeconds = subStepDur * 0.95;
            this.instrumentEngine.noteOff(track.instrumentId, basePitch, subTime + durSeconds);
          } else if (track.type === 'sampler' && track.customAudioUrl) {
            this.drumSynth.trigger(
              'kick',
              subTime,
              subVel,
              mixerChan.inputNode,
              track.customAudioUrl,
              track.drumKitId || 'trap',
              subPitch
            );
          } else if (track.type === 'synth' && this.synthParams) {
            // Play base note for step sequencer (e.g. C3 = 48)
            const basePitch = 48 + subPitch;
            this.synthEngine.noteOn(basePitch, subVel, subTime, this.synthParams, mixerChan.inputNode);
            const durSeconds = subStepDur * 0.95;
            this.synthEngine.noteOff(basePitch, subTime + durSeconds, this.synthParams);
          }
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

          // FL Studio Slide Note
          if (note.isSlide) {
            const durSeconds = (note.durationSteps * 60) / this.bpm / 4;
            if (track.type === 'synth') {
              this.synthEngine.slidePitch(note.midiNote, time, durSeconds);
            }
            continue;
          }

          if (track.type === 'synth' && this.synthParams) {
            this.synthEngine.noteOn(note.midiNote, note.velocity * track.volume, time, this.synthParams, mixerChan.inputNode);
            const durSeconds = (note.durationSteps * 60) / this.bpm / 4;
            this.synthEngine.noteOff(note.midiNote, time + durSeconds, this.synthParams);
          } else if (track.type === 'instrument' && track.instrumentId) {
            this.instrumentEngine.noteOn(track.instrumentId, note.midiNote, note.velocity * track.volume, time, mixerChan.inputNode);
            const durSeconds = (note.durationSteps * 60) / this.bpm / 4;
            this.instrumentEngine.noteOff(track.instrumentId, note.midiNote, time + durSeconds);
          } else if (track.type === 'drum' && track.soundId) {
            const pitchOffset = note.midiNote - 36;
            this.drumSynth.trigger(
              track.soundId,
              time,
              note.velocity * track.volume,
              mixerChan.inputNode,
              track.customAudioUrl,
              track.drumKitId || 'trap',
              pitchOffset
            );
          }
        }
      }
    }
  }

  private scheduleSongStep(stepIndex: number, time: number) {
    const currentBar = stepIndex / 16;

    // Evaluate automation curves for active automation clips
    this.evaluateAutomation(currentBar, time);

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
      } else if (clip.type === 'audio' && clip.audioBlobUrl) {
        const clipStartStep = Math.round(clip.startBar * 16);
        if (stepIndex === clipStartStep) {
          this.playAudioClip(clip, time);
        }
      }
    }
  }

  public async playAudioClip(clip: PlaylistClip, time: number) {
    if (!clip.audioBlobUrl) return;
    try {
      let buffer = this.audioBufferCache.get(clip.audioBlobUrl);
      if (!buffer) {
        const res = await fetch(clip.audioBlobUrl);
        const arrayBuf = await res.arrayBuffer();
        buffer = await this.ctx.decodeAudioData(arrayBuf);
        this.audioBufferCache.set(clip.audioBlobUrl, buffer);
      }

      // Handle reverse playback
      let playBuffer = buffer;
      if (clip.isReversed) {
        const revKey = `${clip.audioBlobUrl}_reversed`;
        let revBuffer = this.audioBufferCache.get(revKey);
        if (!revBuffer) {
          revBuffer = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
          for (let c = 0; c < buffer.numberOfChannels; c++) {
            const src = buffer.getChannelData(c);
            const dst = revBuffer.getChannelData(c);
            for (let i = 0; i < src.length; i++) {
              dst[i] = src[src.length - 1 - i];
            }
          }
          this.audioBufferCache.set(revKey, revBuffer);
        }
        playBuffer = revBuffer;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = playBuffer;

      // Playback rate / Time-stretch factor
      const rate = clip.playbackRate && clip.playbackRate > 0 ? clip.playbackRate : 1.0;
      source.playbackRate.setValueAtTime(rate, time);

      // Gain envelope for fades
      const clipGain = this.ctx.createGain();
      const durSeconds = (clip.lengthBars * 240) / this.bpm;
      const offsetSeconds = Math.max(0, clip.slipOffsetSeconds || 0);

      const trackChan = this.mixer.getChannel(Math.min(8, clip.trackIndex + 1));
      source.connect(clipGain);
      clipGain.connect(trackChan.inputNode);

      // Fade-in / Fade-out
      if (clip.fadeInBars && clip.fadeInBars > 0) {
        const fadeSec = (clip.fadeInBars * 240) / this.bpm;
        clipGain.gain.setValueAtTime(0.0001, time);
        clipGain.gain.linearRampToValueAtTime(1.0, time + fadeSec);
      }
      if (clip.fadeOutBars && clip.fadeOutBars > 0) {
        const fadeSec = (clip.fadeOutBars * 240) / this.bpm;
        clipGain.gain.setValueAtTime(1.0, time + durSeconds - fadeSec);
        clipGain.gain.linearRampToValueAtTime(0.0001, time + durSeconds);
      }

      source.start(time, offsetSeconds, durSeconds);
    } catch (err) {
      console.warn('Could not play audio clip:', err);
    }
  }

  public cacheAudioBuffer(url: string, buffer: AudioBuffer) {
    this.audioBufferCache.set(url, buffer);
  }

  private evaluateAutomation(currentBar: number, time: number) {
    for (const clip of this.automationClips) {
      if (currentBar >= clip.startBar && currentBar <= clip.startBar + clip.lengthBars) {
        if (!clip.nodes || clip.nodes.length === 0) continue;

        const localBar = currentBar - clip.startBar;
        const val = this.interpolateAutomationValue(clip.nodes, localBar);
        this.applyAutomationTarget(clip.target, val, time);
      }
    }
  }

  private interpolateAutomationValue(nodes: AutomationNode[], localBar: number): number {
    if (nodes.length === 1) return nodes[0].value;

    const sorted = [...nodes].sort((a, b) => a.bar - b.bar);

    if (localBar <= sorted[0].bar) return sorted[0].value;
    if (localBar >= sorted[sorted.length - 1].bar) return sorted[sorted.length - 1].value;

    for (let i = 0; i < sorted.length - 1; i++) {
      const n1 = sorted[i];
      const n2 = sorted[i + 1];

      if (localBar >= n1.bar && localBar <= n2.bar) {
        const barSpan = n2.bar - n1.bar;
        if (barSpan <= 0.0001) return n1.value;

        let t = (localBar - n1.bar) / barSpan;
        const tension = n1.tension || 0;

        if (tension > 0) {
          t = Math.pow(t, 1 + tension * 2.5);
        } else if (tension < 0) {
          t = 1 - Math.pow(1 - t, 1 + Math.abs(tension) * 2.5);
        }

        return n1.value + (n2.value - n1.value) * t;
      }
    }

    return sorted[0].value;
  }

  private applyAutomationTarget(target: AutomationTarget, val: number, time: number) {
    const channelIdx = target.channelIndex ?? 0;
    const channel = this.mixer.getChannel(channelIdx);

    switch (target.type) {
      case 'mixerVolume':
        channel.volumeNode.gain.setTargetAtTime(val * 1.25, time, 0.02);
        break;
      case 'mixerPan':
        channel.panNode.pan.setTargetAtTime(val * 2 - 1, time, 0.02);
        break;
      case 'mixerFilterCutoff': {
        const cutoff = 40 + Math.pow(val, 2.5) * 19960;
        channel.effectsChain.resFilter.frequency.setTargetAtTime(cutoff, time, 0.02);
        break;
      }
      case 'mixerFilterRes':
        channel.effectsChain.resFilter.Q.setTargetAtTime(val * 20, time, 0.02);
        break;
      case 'mixerReverbMix':
        channel.effectsChain.reverbWet.gain.setTargetAtTime(val, time, 0.02);
        break;
      case 'mixerDelayMix':
        channel.effectsChain.delayWet.gain.setTargetAtTime(val, time, 0.02);
        break;
      case 'mixerDistortionDrive':
        channel.effectsChain.distWetGain.gain.setTargetAtTime(val, time, 0.02);
        break;
      case 'synthCutoff':
        if (this.synthParams) {
          this.synthParams.filterCutoff = 40 + Math.pow(val, 2.5) * 19960;
        }
        break;
      case 'synthResonance':
        if (this.synthParams) {
          this.synthParams.filterResonance = val * 20;
        }
        break;
      case 'synthLfoRate':
        if (this.synthParams) {
          this.synthParams.lfoRate = 0.1 + val * 19.9;
        }
        break;
      case 'masterVolume':
        this.mixer.masterChannel.volumeNode.gain.setTargetAtTime(val * 1.25, time, 0.02);
        break;
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
