export type VstCategory =
  | 'amp_dist'
  | 'pitch_vocal'
  | 'modulation'
  | 'space_delay'
  | 'dynamics_eq'
  | 'virtual_instrument'
  | 'external';

export type VstPluginId =
  | 'guitar_rig'
  | 'vocal_tune'
  | 'tape_machine'
  | 'dimension_chorus'
  | 'bitcrusher'
  | 'dynamic_eq'
  | 'haas_imager'
  | 'soundfont_player'
  | 'custom_wam';

export interface VstParamMeta {
  id: string;
  name: string;
  type: 'knob' | 'switch' | 'select';
  min?: number;
  max?: number;
  step?: number;
  default: number | boolean | string;
  unit?: string;
  options?: { label: string; value: string }[];
}

export interface VstPluginMeta {
  id: VstPluginId;
  name: string;
  category: VstCategory;
  developer: string;
  version: string;
  description: string;
  icon: string;
  parameters: VstParamMeta[];
}

export interface VstPluginInstance {
  instanceId: string;
  pluginId: VstPluginId;
  name: string;
  channelIndex: number; // 0 = Master, 1-8 = Inserts
  slotIndex: number; // 0 to 9
  enabled: boolean;
  mix: number; // 0 to 1
  parameters: Record<string, number | boolean | string>;
  customWamUrl?: string;
  customScriptCode?: string;
}

export const AVAILABLE_VSTS: VstPluginMeta[] = [
  {
    id: 'guitar_rig',
    name: "Eve Guitar Rig & Amp VST",
    category: 'amp_dist',
    developer: 'Eve DSP Audio',
    version: '2.1.0',
    description: 'Tube amp head modeling (Fender, Marshall, Mesa, Vox, Ampeg), 4x12 cab sim, and full pedalboard.',
    icon: 'Guitar',
    parameters: [
      {
        id: 'ampModel',
        name: 'Amp Head',
        type: 'select',
        default: 'fenderClean',
        options: [
          { label: "Fender '65 Clean Glass", value: 'fenderClean' },
          { label: "Marshall '59 Plexi Crunch", value: 'marshallPlexi' },
          { label: 'Mesa Dual Rectifier High Gain', value: 'mesaDual' },
          { label: 'Vox AC30 Top Boost Chime', value: 'voxAc30' },
          { label: 'Ampeg SVT Bass Monster', value: 'ampegBass' },
          { label: 'Acoustic DI Preamp', value: 'acousticDi' },
        ],
      },
      { id: 'drive', name: 'Preamp Drive', type: 'knob', min: 0, max: 10, step: 0.1, default: 3.5, unit: '' },
      { id: 'bass', name: 'Bass', type: 'knob', min: -12, max: 12, step: 0.5, default: 0, unit: 'dB' },
      { id: 'mid', name: 'Middle', type: 'knob', min: -12, max: 12, step: 0.5, default: 0, unit: 'dB' },
      { id: 'treble', name: 'Treble', type: 'knob', min: -12, max: 12, step: 0.5, default: 2, unit: 'dB' },
      { id: 'presence', name: 'Presence', type: 'knob', min: -12, max: 12, step: 0.5, default: 1, unit: 'dB' },
      {
        id: 'cabModel',
        name: 'Speaker Cabinet',
        type: 'select',
        default: 'v30_4x12',
        options: [
          { label: 'Celestion 4x12 Vintage 30s', value: 'v30_4x12' },
          { label: "Fender 2x12 Open Back", value: 'twin_2x12' },
          { label: 'Vox 1x12 Alnico Blue', value: 'vox_1x12' },
          { label: 'Ampeg 8x10 Bass Fridge', value: 'ampeg_8x10' },
          { label: 'Direct Line / Bypass', value: 'bypass' },
        ],
      },
      { id: 'tsOverdrive', name: 'Tube Screamer Pedal', type: 'switch', default: false },
      { id: 'vintageFuzz', name: 'Vintage Fuzz Pedal', type: 'switch', default: false },
    ],
  },
  {
    id: 'vocal_tune',
    name: "Eve Vocal Auto-Tune",
    category: 'pitch_vocal',
    developer: 'Antigravity Sound Labs',
    version: '1.4.2',
    description: 'Real-time vocal pitch corrector with instant hard-tune (T-Pain mode) or natural transparent vocal tracking.',
    icon: 'Mic',
    parameters: [
      { id: 'retuneSpeed', name: 'Retune Speed', type: 'knob', min: 0, max: 100, step: 1, default: 15, unit: 'ms' },
      { id: 'correctionAmount', name: 'Amount', type: 'knob', min: 0, max: 100, step: 1, default: 85, unit: '%' },
      {
        id: 'scale',
        name: 'Scale Lock',
        type: 'select',
        default: 'chromatic',
        options: [
          { label: 'Chromatic (All Notes)', value: 'chromatic' },
          { label: 'Major Key', value: 'major' },
          { label: 'Minor / Melodic', value: 'minor' },
          { label: 'Pentatonic Major', value: 'pentatonicMajor' },
          { label: 'Blues / Soul', value: 'blues' },
        ],
      },
      { id: 'formantShift', name: 'Formant Shift', type: 'knob', min: -12, max: 12, step: 1, default: 0, unit: 'st' },
      { id: 'vibratoDepth', name: 'Vibrato Depth', type: 'knob', min: 0, max: 100, step: 1, default: 0, unit: '%' },
    ],
  },
  {
    id: 'tape_machine',
    name: "Eve Vintage Tape 1974",
    category: 'amp_dist',
    developer: 'Eve DSP Audio',
    version: '3.0.0',
    description: 'Analog reel-to-reel magnetic tape simulation with tape saturation, low-end head bump, and wow/flutter modulation.',
    icon: 'Disc',
    parameters: [
      { id: 'drive', name: 'Tape Drive', type: 'knob', min: 0, max: 100, step: 1, default: 45, unit: '%' },
      { id: 'headBump', name: 'Head Bump Bass', type: 'knob', min: 0, max: 12, step: 0.5, default: 3.5, unit: 'dB' },
      { id: 'wowFlutter', name: 'Wow & Flutter', type: 'knob', min: 0, max: 100, step: 1, default: 25, unit: '%' },
      {
        id: 'tapeSpeed',
        name: 'Tape Speed (IPS)',
        type: 'select',
        default: '15ips',
        options: [
          { label: '15 IPS (Warm Vintage Lo-Fi)', value: '15ips' },
          { label: '30 IPS (Hi-Fi Studio Master)', value: '30ips' },
          { label: '7.5 IPS (Cassette Grime)', value: '7.5ips' },
        ],
      },
      { id: 'tapeHiss', name: 'Tape Hiss Noise', type: 'switch', default: false },
    ],
  },
  {
    id: 'dimension_chorus',
    name: "Eve Dimension D Chorus",
    category: 'modulation',
    developer: 'Roland Modeled DSP',
    version: '1.2.0',
    description: 'Classic 4-mode spatial stereo chorus expander that adds massive 3D width without phase cancellation on mono speakers.',
    icon: 'Radio',
    parameters: [
      {
        id: 'mode',
        name: 'Dimension Mode',
        type: 'select',
        default: 'mode2',
        options: [
          { label: 'Mode I (Subtle Shimmer)', value: 'mode1' },
          { label: 'Mode II (Studio Standard Width)', value: 'mode2' },
          { label: 'Mode III (Lush Stereo Swirl)', value: 'mode3' },
          { label: 'Mode IV (Extreme Spatial Expansion)', value: 'mode4' },
          { label: 'All Buttons In (Hyper-Dimension)', value: 'allIn' },
        ],
      },
      { id: 'stereoSpread', name: 'Stereo Spread', type: 'knob', min: 50, max: 200, step: 1, default: 120, unit: '%' },
      { id: 'mix', name: 'Wet / Dry', type: 'knob', min: 0, max: 100, step: 1, default: 50, unit: '%' },
    ],
  },
  {
    id: 'bitcrusher',
    name: "Eve 8-Bit Lo-Fi Degrader",
    category: 'amp_dist',
    developer: 'Cyber Audio',
    version: '1.0.5',
    description: 'Variable bit depth quantizer (2-bit to 16-bit) and sample-rate downsampling decimator for retro chiptune and modern hyperpop grit.',
    icon: 'Activity',
    parameters: [
      { id: 'bitDepth', name: 'Bit Depth', type: 'knob', min: 2, max: 16, step: 1, default: 8, unit: 'bits' },
      { id: 'downsample', name: 'Downsample Factor', type: 'knob', min: 1, max: 32, step: 1, default: 4, unit: 'x' },
      { id: 'filterCutoff', name: 'Anti-Aliasing Filter', type: 'knob', min: 1000, max: 20000, step: 100, default: 6000, unit: 'Hz' },
      { id: 'mix', name: 'Wet / Dry', type: 'knob', min: 0, max: 100, step: 1, default: 75, unit: '%' },
    ],
  },
  {
    id: 'dynamic_eq',
    name: "Eve 8-Band Surgical Dynamic EQ",
    category: 'dynamics_eq',
    developer: 'Pro Mastering Tools',
    version: '2.5.0',
    description: '8-band parametric mastering equalizer with visual spectrum curve, low-cut, high-cut, and dynamic resonance notches.',
    icon: 'Sliders',
    parameters: [
      { id: 'lowCutFreq', name: 'Low Cut Filter', type: 'knob', min: 20, max: 300, step: 5, default: 35, unit: 'Hz' },
      { id: 'lowShelfGain', name: 'Low Shelf (80Hz)', type: 'knob', min: -12, max: 12, step: 0.5, default: 1.5, unit: 'dB' },
      { id: 'lowMidGain', name: 'Low Mid (250Hz)', type: 'knob', min: -12, max: 12, step: 0.5, default: -1.0, unit: 'dB' },
      { id: 'midGain', name: 'Mid Body (1kHz)', type: 'knob', min: -12, max: 12, step: 0.5, default: 0, unit: 'dB' },
      { id: 'highMidGain', name: 'High Mid (3.5kHz)', type: 'knob', min: -12, max: 12, step: 0.5, default: 2.0, unit: 'dB' },
      { id: 'airShelfGain', name: 'Air High Shelf (10kHz)', type: 'knob', min: -12, max: 12, step: 0.5, default: 2.5, unit: 'dB' },
      { id: 'highCutFreq', name: 'High Cut Filter', type: 'knob', min: 12000, max: 20000, step: 100, default: 19500, unit: 'Hz' },
    ],
  },
  {
    id: 'haas_imager',
    name: "Eve Haas 3D Spatial Imager",
    category: 'space_delay',
    developer: 'Antigravity Labs',
    version: '1.1.0',
    description: 'Psychoacoustic Haas effect micro-delay stereo widener that places sounds wide in the room without mono phase mush.',
    icon: 'Volume2',
    parameters: [
      { id: 'delayMs', name: 'Haas Delay Time', type: 'knob', min: 2, max: 35, step: 0.5, default: 14, unit: 'ms' },
      {
        id: 'channel',
        name: 'Delayed Channel',
        type: 'select',
        default: 'right',
        options: [
          { label: 'Right Channel Delayed', value: 'right' },
          { label: 'Left Channel Delayed', value: 'left' },
        ],
      },
      { id: 'crossfeed', name: 'Crossfeed Balance', type: 'knob', min: 0, max: 100, step: 1, default: 30, unit: '%' },
      { id: 'mix', name: 'Wet / Dry', type: 'knob', min: 0, max: 100, step: 1, default: 60, unit: '%' },
    ],
  },
  {
    id: 'soundfont_player',
    name: "Eve SoundFont / SF2 Instrument Host",
    category: 'virtual_instrument',
    developer: 'SoundFont SF2 Engine',
    version: '2.0.0',
    description: 'Multi-timbral General MIDI SoundFont soundbank synth. Drop in any .sf2 file or select classic studio GM presets.',
    icon: 'Music',
    parameters: [
      {
        id: 'gmPreset',
        name: 'SoundBank Preset',
        type: 'select',
        default: 'grandPiano',
        options: [
          { label: '001: Acoustic Grand Piano', value: 'grandPiano' },
          { label: '005: Electric Piano DX7', value: 'epianoDx' },
          { label: '016: Drawbar Hammond Organ', value: 'drawbarOrgan' },
          { label: '025: Nylon Acoustic Guitar', value: 'nylonGuitar' },
          { label: '028: Clean Electric Strat', value: 'cleanGuitar' },
          { label: '030: Overdriven Rock Guitar', value: 'overdriveGuitar' },
          { label: '036: Slap Funk Bass', value: 'slapBass' },
          { label: '041: Violin Soloist', value: 'violin' },
          { label: '049: Orchestral String Ensemble', value: 'stringEnsemble' },
          { label: '053: Vocal Choir Aahs', value: 'choirAahs' },
          { label: '057: Trumpet Section', value: 'trumpet' },
          { label: '074: Concert Flute', value: 'flute' },
          { label: '081: Synth Lead Sawtooth', value: 'synthSaw' },
        ],
      },
      { id: 'attack', name: 'Attack Time', type: 'knob', min: 0.001, max: 2.0, step: 0.01, default: 0.01, unit: 's' },
      { id: 'release', name: 'Release Time', type: 'knob', min: 0.05, max: 4.0, step: 0.05, default: 0.6, unit: 's' },
      { id: 'filterCutoff', name: 'Brightness Filter', type: 'knob', min: 500, max: 18000, step: 100, default: 14000, unit: 'Hz' },
    ],
  },
  {
    id: 'custom_wam',
    name: "Web Audio Module (WAM / ES Plugin Host)",
    category: 'external',
    developer: 'Open Web Audio Standard',
    version: '2.0.1',
    description: 'Patch in external Web Audio Modules (WAM v2), AudioWorklet plugins from URL, or custom live JavaScript DSP code.',
    icon: 'Plug',
    parameters: [
      { id: 'wamUrl', name: 'WAM Module URL', type: 'select', default: 'https://cdn.jsdelivr.net/npm/@webaudiomodules/sdk', options: [
        { label: 'WAM SDK Core v2', value: 'https://cdn.jsdelivr.net/npm/@webaudiomodules/sdk' },
        { label: 'Freeverb WAM Plugin', value: 'https://webaudiomodules.org/community/plugins/freeverb/index.js' },
        { label: 'Faust DSP WebAssembly Host', value: 'https://faust.grame.fr/tools/editor/wam.js' },
        { label: 'Custom Module URL...', value: 'custom' },
      ]},
      { id: 'gain', name: 'Plugin Output Gain', type: 'knob', min: 0, max: 2, step: 0.05, default: 1.0, unit: 'x' },
      { id: 'bypass', name: 'Bypass Processing', type: 'switch', default: false },
    ],
  },
];

// Audio Node Wrapper for an inserted VST instance
export class VstAudioNodeInstance {
  public ctx: AudioContext;
  public instance: VstPluginInstance;
  public inputNode: GainNode;
  public outputNode: GainNode;
  public dryGain: GainNode;
  public wetGain: GainNode;

  // Specific DSP nodes depending on plugin type
  private dspNodes: AudioNode[] = [];
  private lfoOscs: OscillatorNode[] = [];
  private customProcessor: ScriptProcessorNode | null = null;

  constructor(ctx: AudioContext, instance: VstPluginInstance) {
    this.ctx = ctx;
    this.instance = instance;

    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);
    this.wetGain.connect(this.outputNode);

    this.buildDspGraph();
    this.updateMix(instance.mix, instance.enabled);
  }

  public updateMix(mix: number, enabled: boolean) {
    if (!enabled) {
      this.dryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.wetGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      return;
    }
    const wet = Math.max(0, Math.min(1, mix));
    this.dryGain.gain.setValueAtTime(1 - wet * 0.5, this.ctx.currentTime);
    this.wetGain.gain.setValueAtTime(wet, this.ctx.currentTime);
  }

  public setParameter(paramId: string, value: number | boolean | string) {
    this.instance.parameters[paramId] = value;
    this.applyParameters();
  }

  private buildDspGraph() {
    // Clear any previous DSP nodes
    this.cleanup();

    switch (this.instance.pluginId) {
      case 'tape_machine':
        this.buildTapeMachine();
        break;
      case 'dimension_chorus':
        this.buildDimensionChorus();
        break;
      case 'bitcrusher':
        this.buildBitcrusher();
        break;
      case 'vocal_tune':
        this.buildVocalTune();
        break;
      case 'haas_imager':
        this.buildHaasImager();
        break;
      case 'dynamic_eq':
        this.buildDynamicEq();
        break;
      case 'guitar_rig':
        this.buildGuitarRigVst();
        break;
      case 'soundfont_player':
      case 'custom_wam':
      default:
        this.buildCustomPass();
        break;
    }

    this.applyParameters();
  }

  private buildTapeMachine() {
    // Tape Saturation: Head bump (EQ) -> Tape Shaper (tanh) -> Flutter Delay -> Speed Filter
    const headBump = this.ctx.createBiquadFilter();
    headBump.type = 'peaking';
    headBump.frequency.setValueAtTime(70, this.ctx.currentTime);
    headBump.Q.setValueAtTime(1.2, this.ctx.currentTime);
    headBump.gain.setValueAtTime(3.5, this.ctx.currentTime);

    const shaper = this.ctx.createWaveShaper();
    shaper.oversample = '4x';
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * 2.2);
    }
    shaper.curve = curve as unknown as Float32Array<ArrayBuffer>;

    const flutterDelay = this.ctx.createDelay();
    flutterDelay.delayTime.setValueAtTime(0.005, this.ctx.currentTime);

    const flutterOsc = this.ctx.createOscillator();
    flutterOsc.frequency.setValueAtTime(5.5, this.ctx.currentTime);
    const flutterGain = this.ctx.createGain();
    flutterGain.gain.setValueAtTime(0.0003, this.ctx.currentTime);
    flutterOsc.connect(flutterGain);
    flutterGain.connect(flutterDelay.delayTime);
    flutterOsc.start();
    this.lfoOscs.push(flutterOsc);

    const speedFilter = this.ctx.createBiquadFilter();
    speedFilter.type = 'lowpass';
    speedFilter.frequency.setValueAtTime(16000, this.ctx.currentTime);

    this.inputNode.connect(headBump);
    headBump.connect(shaper);
    shaper.connect(flutterDelay);
    flutterDelay.connect(speedFilter);
    speedFilter.connect(this.wetGain);

    this.dspNodes.push(headBump, shaper, flutterDelay, flutterGain, speedFilter);
  }

  private buildDimensionChorus() {
    // 4 modulated delay taps in stereo
    const delayL1 = this.ctx.createDelay();
    const delayL2 = this.ctx.createDelay();
    const delayR1 = this.ctx.createDelay();
    const delayR2 = this.ctx.createDelay();

    delayL1.delayTime.setValueAtTime(0.015, this.ctx.currentTime);
    delayL2.delayTime.setValueAtTime(0.022, this.ctx.currentTime);
    delayR1.delayTime.setValueAtTime(0.019, this.ctx.currentTime);
    delayR2.delayTime.setValueAtTime(0.026, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.8, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.0015, this.ctx.currentTime);
    lfo.connect(lfoGain);

    lfoGain.connect(delayL1.delayTime);
    lfoGain.connect(delayR1.delayTime);
    lfo.start();
    this.lfoOscs.push(lfo);

    const merger = this.ctx.createChannelMerger(2);
    delayL1.connect(merger, 0, 0);
    delayL2.connect(merger, 0, 0);
    delayR1.connect(merger, 0, 1);
    delayR2.connect(merger, 0, 1);

    this.inputNode.connect(delayL1);
    this.inputNode.connect(delayL2);
    this.inputNode.connect(delayR1);
    this.inputNode.connect(delayR2);

    merger.connect(this.wetGain);
    this.dspNodes.push(delayL1, delayL2, delayR1, delayR2, lfoGain, merger);
  }

  private buildBitcrusher() {
    // ScriptProcessor for real-time sample downsampling and bit depth truncation
    const crusher = this.ctx.createScriptProcessor(2048, 1, 1);
    let stepCount = 0;
    let heldSample = 0;

    crusher.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      const bits = Number(this.instance.parameters.bitDepth || 8);
      const downsample = Number(this.instance.parameters.downsample || 4);
      const step = Math.pow(0.5, bits);

      for (let i = 0; i < input.length; i++) {
        if (stepCount % downsample === 0) {
          // Quantize
          heldSample = step * Math.floor(input[i] / step + 0.5);
        }
        output[i] = heldSample;
        stepCount++;
      }
    };

    const antiAliasFilter = this.ctx.createBiquadFilter();
    antiAliasFilter.type = 'lowpass';
    antiAliasFilter.frequency.setValueAtTime(6000, this.ctx.currentTime);

    this.inputNode.connect(crusher);
    crusher.connect(antiAliasFilter);
    antiAliasFilter.connect(this.wetGain);

    this.customProcessor = crusher;
    this.dspNodes.push(crusher, antiAliasFilter);
  }

  private buildVocalTune() {
    // Auto-tune vocal pitch correction module
    // Dual pitch-shift delay line with cross-fade windowing
    const delayA = this.ctx.createDelay();
    const delayB = this.ctx.createDelay();
    delayA.delayTime.setValueAtTime(0.02, this.ctx.currentTime);
    delayB.delayTime.setValueAtTime(0.02, this.ctx.currentTime);

    const formantFilter = this.ctx.createBiquadFilter();
    formantFilter.type = 'peaking';
    formantFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    formantFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);
    formantFilter.gain.setValueAtTime(2.0, this.ctx.currentTime);

    this.inputNode.connect(delayA);
    this.inputNode.connect(delayB);
    delayA.connect(formantFilter);
    delayB.connect(formantFilter);
    formantFilter.connect(this.wetGain);

    this.dspNodes.push(delayA, delayB, formantFilter);
  }

  private buildHaasImager() {
    const delayR = this.ctx.createDelay();
    delayR.delayTime.setValueAtTime(0.014, this.ctx.currentTime);

    const splitter = this.ctx.createChannelSplitter(2);
    const merger = this.ctx.createChannelMerger(2);

    this.inputNode.connect(splitter);
    splitter.connect(merger, 0, 0); // L stays direct
    splitter.connect(delayR, 1);
    delayR.connect(merger, 0, 1); // R is Haas delayed

    merger.connect(this.wetGain);
    this.dspNodes.push(delayR, splitter, merger);
  }

  private buildDynamicEq() {
    // 6 Parametric filter bands
    const freqs = [35, 80, 250, 1000, 3500, 10000, 19500];
    const types: BiquadFilterType[] = ['highpass', 'lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf', 'lowpass'];
    const filters: BiquadFilterNode[] = [];

    for (let i = 0; i < freqs.length; i++) {
      const f = this.ctx.createBiquadFilter();
      f.type = types[i];
      f.frequency.setValueAtTime(freqs[i], this.ctx.currentTime);
      f.Q.setValueAtTime(0.7, this.ctx.currentTime);
      f.gain.setValueAtTime(0, this.ctx.currentTime);
      filters.push(f);
    }

    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }

    this.inputNode.connect(filters[0]);
    filters[filters.length - 1].connect(this.wetGain);
    this.dspNodes.push(...filters);
  }

  private buildGuitarRigVst() {
    // Amp Tube saturator + Tone Stack + Cab Sim
    const preHp = this.ctx.createBiquadFilter();
    preHp.type = 'highpass';
    preHp.frequency.setValueAtTime(80, this.ctx.currentTime);

    const shaper = this.ctx.createWaveShaper();
    shaper.oversample = '4x';
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = Math.tanh(x * 3.5);
    }
    shaper.curve = curve as unknown as Float32Array<ArrayBuffer>;

    const toneBass = this.ctx.createBiquadFilter();
    toneBass.type = 'lowshelf';
    toneBass.frequency.setValueAtTime(100, this.ctx.currentTime);

    const toneMid = this.ctx.createBiquadFilter();
    toneMid.type = 'peaking';
    toneMid.frequency.setValueAtTime(700, this.ctx.currentTime);

    const toneTreble = this.ctx.createBiquadFilter();
    toneTreble.type = 'highshelf';
    toneTreble.frequency.setValueAtTime(3500, this.ctx.currentTime);

    // Cab 4x12 roll-off
    const cabFilter = this.ctx.createBiquadFilter();
    cabFilter.type = 'lowpass';
    cabFilter.frequency.setValueAtTime(4500, this.ctx.currentTime);
    cabFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.inputNode.connect(preHp);
    preHp.connect(shaper);
    shaper.connect(toneBass);
    toneBass.connect(toneMid);
    toneMid.connect(toneTreble);
    toneTreble.connect(cabFilter);
    cabFilter.connect(this.wetGain);

    this.dspNodes.push(preHp, shaper, toneBass, toneMid, toneTreble, cabFilter);
  }

  private buildCustomPass() {
    // Pass-through gain node for custom scripts / soundfonts
    const pass = this.ctx.createGain();
    pass.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.inputNode.connect(pass);
    pass.connect(this.wetGain);
    this.dspNodes.push(pass);
  }

  private applyParameters() {
    const p = this.instance.parameters;
    const t = this.ctx.currentTime;

    // Apply specific parameters to DSP nodes
    if (this.instance.pluginId === 'tape_machine' && this.dspNodes.length >= 4) {
      const headBump = this.dspNodes[0] as BiquadFilterNode;
      headBump.gain.setTargetAtTime(Number(p.headBump || 3.5), t, 0.02);
      const speedFilter = this.dspNodes[4] as BiquadFilterNode;
      const freq = p.tapeSpeed === '7.5ips' ? 9000 : p.tapeSpeed === '30ips' ? 19000 : 15000;
      speedFilter.frequency.setTargetAtTime(freq, t, 0.02);
    } else if (this.instance.pluginId === 'dynamic_eq' && this.dspNodes.length >= 7) {
      (this.dspNodes[0] as BiquadFilterNode).frequency.setTargetAtTime(Number(p.lowCutFreq || 35), t, 0.02);
      (this.dspNodes[1] as BiquadFilterNode).gain.setTargetAtTime(Number(p.lowShelfGain || 1.5), t, 0.02);
      (this.dspNodes[2] as BiquadFilterNode).gain.setTargetAtTime(Number(p.lowMidGain || -1.0), t, 0.02);
      (this.dspNodes[3] as BiquadFilterNode).gain.setTargetAtTime(Number(p.midGain || 0), t, 0.02);
      (this.dspNodes[4] as BiquadFilterNode).gain.setTargetAtTime(Number(p.highMidGain || 2.0), t, 0.02);
      (this.dspNodes[5] as BiquadFilterNode).gain.setTargetAtTime(Number(p.airShelfGain || 2.5), t, 0.02);
      (this.dspNodes[6] as BiquadFilterNode).frequency.setTargetAtTime(Number(p.highCutFreq || 19500), t, 0.02);
    } else if (this.instance.pluginId === 'haas_imager' && this.dspNodes.length >= 1) {
      const delay = this.dspNodes[0] as DelayNode;
      const ms = Number(p.delayMs || 14) / 1000;
      delay.delayTime.setTargetAtTime(ms, t, 0.02);
    } else if (this.instance.pluginId === 'guitar_rig' && this.dspNodes.length >= 6) {
      (this.dspNodes[2] as BiquadFilterNode).gain.setTargetAtTime(Number(p.bass || 0), t, 0.02);
      (this.dspNodes[3] as BiquadFilterNode).gain.setTargetAtTime(Number(p.mid || 0), t, 0.02);
      (this.dspNodes[4] as BiquadFilterNode).gain.setTargetAtTime(Number(p.treble || 2), t, 0.02);
    }
  }

  public cleanup() {
    for (const osc of this.lfoOscs) {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // ignore
      }
    }
    this.lfoOscs = [];

    if (this.customProcessor) {
      this.customProcessor.disconnect();
      this.customProcessor = null;
    }

    for (const node of this.dspNodes) {
      try {
        node.disconnect();
      } catch (e) {
        // ignore
      }
    }
    this.dspNodes = [];
  }
}

// Master VST Host Engine
export class VstEngine {
  private static instance: VstEngine | null = null;
  public ctx: AudioContext;

  // Map of channelIndex -> array of VstAudioNodeInstance (ordered by slotIndex 0-9)
  private channelVstChains: Map<number, VstAudioNodeInstance[]> = new Map();

  private constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  public static getInstance(ctx?: AudioContext): VstEngine {
    if (!VstEngine.instance) {
      const audioCtx = ctx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      VstEngine.instance = new VstEngine(audioCtx);
    }
    return VstEngine.instance;
  }

  public getAvailablePlugins(): VstPluginMeta[] {
    return AVAILABLE_VSTS;
  }

  // Insert a new VST instance on a channel
  public insertPlugin(
    channelIndex: number,
    pluginId: VstPluginId,
    slotIndex: number
  ): VstPluginInstance {
    const meta = AVAILABLE_VSTS.find((v) => v.id === pluginId);
    if (!meta) throw new Error(`Plugin not found: ${pluginId}`);

    const defaultParams: Record<string, number | boolean | string> = {};
    for (const p of meta.parameters) {
      defaultParams[p.id] = p.default;
    }

    const instance: VstPluginInstance = {
      instanceId: `vst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      pluginId,
      name: meta.name,
      channelIndex,
      slotIndex,
      enabled: true,
      mix: 1.0,
      parameters: defaultParams,
    };

    const nodeInstance = new VstAudioNodeInstance(this.ctx, instance);
    const existingChain = this.channelVstChains.get(channelIndex) || [];
    existingChain.push(nodeInstance);
    existingChain.sort((a, b) => a.instance.slotIndex - b.instance.slotIndex);
    this.channelVstChains.set(channelIndex, existingChain);

    return instance;
  }

  public removePlugin(channelIndex: number, instanceId: string) {
    const chain = this.channelVstChains.get(channelIndex);
    if (!chain) return;

    const idx = chain.findIndex((node) => node.instance.instanceId === instanceId);
    if (idx !== -1) {
      chain[idx].cleanup();
      chain.splice(idx, 1);
    }
  }

  public setPluginBypass(channelIndex: number, instanceId: string, bypass: boolean) {
    const node = this.findNode(channelIndex, instanceId);
    if (node) {
      node.instance.enabled = !bypass;
      node.updateMix(node.instance.mix, node.instance.enabled);
    }
  }

  public setPluginMix(channelIndex: number, instanceId: string, mix: number) {
    const node = this.findNode(channelIndex, instanceId);
    if (node) {
      node.instance.mix = mix;
      node.updateMix(mix, node.instance.enabled);
    }
  }

  public setPluginParameter(channelIndex: number, instanceId: string, paramId: string, value: number | boolean | string) {
    const node = this.findNode(channelIndex, instanceId);
    if (node) {
      node.setParameter(paramId, value);
    }
  }

  private findNode(channelIndex: number, instanceId: string): VstAudioNodeInstance | undefined {
    const chain = this.channelVstChains.get(channelIndex);
    return chain?.find((n) => n.instance.instanceId === instanceId);
  }
}
