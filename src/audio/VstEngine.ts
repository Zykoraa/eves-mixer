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
  | 'ott_compressor'
  | 'space_reverb'
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

export interface VstPreset {
  id: string;
  name: string;
  description?: string;
  parameters: Record<string, number | boolean | string>;
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
  presets?: VstPreset[];
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
    id: 'ott_compressor',
    name: 'Eve OTT 3-Band Dynamics',
    category: 'dynamics_eq',
    developer: 'Eve Sound Dynamics',
    version: '1.5.0',
    description: 'The definitive 3-band upward & downward multiband compressor. Delivers hyper-compressed modern trap punch, crispy tops, and loud sustained harmonics.',
    icon: 'Zap',
    parameters: [
      { id: 'depth', name: 'Compression Depth', type: 'knob', min: 0, max: 100, step: 1, default: 75, unit: '%' },
      { id: 'time', name: 'Time / Speed', type: 'knob', min: 10, max: 300, step: 5, default: 100, unit: '%' },
      { id: 'inGain', name: 'Input Gain', type: 'knob', min: -18, max: 18, step: 0.5, default: 0, unit: 'dB' },
      { id: 'outGain', name: 'Output Gain', type: 'knob', min: -18, max: 18, step: 0.5, default: 0, unit: 'dB' },
      { id: 'upwardRatio', name: 'Upward Comp', type: 'knob', min: 1, max: 8, step: 0.2, default: 3.5, unit: 'x' },
      { id: 'downwardRatio', name: 'Downward Comp', type: 'knob', min: 1, max: 12, step: 0.5, default: 4.0, unit: 'x' },
    ],
    presets: [
      { id: 'trap_smash', name: 'Modern Trap Smash', description: 'Hard upward pump with screaming highs', parameters: { depth: 85, time: 90, inGain: 2, outGain: 0, upwardRatio: 4.5, downwardRatio: 5.0 } },
      { id: 'drum_bus', name: 'Snappy Drum Bus Punch', description: 'Fast attack to glue drum transient punch', parameters: { depth: 60, time: 60, inGain: 0, outGain: 1.5, upwardRatio: 3.0, downwardRatio: 4.0 } },
      { id: 'vocal_presence', name: 'Vocal In-Your-Face', description: 'Forward vocal sheen that cuts through loud 808s', parameters: { depth: 70, time: 120, inGain: 1, outGain: 0, upwardRatio: 3.8, downwardRatio: 3.5 } },
      { id: 'sub_tightener', name: 'Sub Bass Tightener', description: 'Even out low-end bass spikes', parameters: { depth: 90, time: 180, inGain: -1, outGain: 2, upwardRatio: 5.0, downwardRatio: 6.0 } },
      { id: 'edm_lead', name: 'Crisp EDM Lead Brightener', description: 'Extreme sizzle for synth chords and leads', parameters: { depth: 80, time: 80, inGain: 3, outGain: -1, upwardRatio: 4.0, downwardRatio: 4.5 } },
    ],
  },
  {
    id: 'space_reverb',
    name: 'Eve Fruity Space Reverb 2 & Shimmer',
    category: 'space_delay',
    developer: 'Eve Acoustic Labs',
    version: '2.4.0',
    description: 'Stereo algorithmic space reverberator with 4-comb diffusion, damping control, stereo width expansion, and pitch-reflected shimmer tail.',
    icon: 'Sparkles',
    parameters: [
      { id: 'decayTime', name: 'Decay Time', type: 'knob', min: 0.2, max: 10, step: 0.1, default: 2.5, unit: 's' },
      { id: 'roomSize', name: 'Room Size', type: 'knob', min: 10, max: 100, step: 1, default: 60, unit: '%' },
      { id: 'damping', name: 'HF Damping Filter', type: 'knob', min: 1000, max: 18000, step: 100, default: 7000, unit: 'Hz' },
      { id: 'stereoSeparation', name: 'Stereo Width', type: 'knob', min: 50, max: 200, step: 1, default: 130, unit: '%' },
      { id: 'shimmer', name: 'Shimmer Reflection', type: 'knob', min: 0, max: 100, step: 1, default: 25, unit: '%' },
      { id: 'preDelay', name: 'Pre-Delay', type: 'knob', min: 0, max: 150, step: 1, default: 15, unit: 'ms' },
    ],
    presets: [
      { id: 'shimmer_cathedral', name: 'Cathedral of Shimmer', description: 'Ethereal +1 octave angelic tail', parameters: { decayTime: 5.5, roomSize: 85, damping: 8000, stereoSeparation: 150, shimmer: 65, preDelay: 25 } },
      { id: 'plate_140', name: 'Vintage EMT 140 Plate', description: 'Silky smooth vintage studio plate', parameters: { decayTime: 2.2, roomSize: 50, damping: 4500, stereoSeparation: 110, shimmer: 0, preDelay: 10 } },
      { id: 'tight_room', name: 'Tight Drum Room', description: 'Short acoustic ambience for snares and claps', parameters: { decayTime: 0.7, roomSize: 30, damping: 5500, stereoSeparation: 100, shimmer: 0, preDelay: 5 } },
      { id: 'infinite_cloud', name: 'Infinite Ambient Cloud', description: 'Massive atmospheric pad wash', parameters: { decayTime: 9.5, roomSize: 95, damping: 10000, stereoSeparation: 180, shimmer: 80, preDelay: 40 } },
      { id: 'gated_snare', name: '80s Gated Snare Room', description: 'Punchy 80s Phil Collins gated tail', parameters: { decayTime: 1.2, roomSize: 65, damping: 6000, stereoSeparation: 140, shimmer: 15, preDelay: 12 } },
    ],
  },
  {
    id: 'guitar_rig',
    name: 'Eve Guitar Rig & Amp VST',
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
    presets: [
      { id: 'nashville_clean', name: 'Nashville Glass Clean', description: 'Crystal chime Fender Twin with air', parameters: { ampModel: 'fenderClean', drive: 2.0, bass: 0, mid: 0, treble: 3, presence: 2, cabModel: 'twin_2x12', tsOverdrive: false, vintageFuzz: false } },
      { id: 'plexi_rock', name: "Marshall '59 Plexi Crunch", description: 'Classic 70s stadium rock crunch', parameters: { ampModel: 'marshallPlexi', drive: 6.5, bass: 1, mid: 2, treble: 3, presence: 2.5, cabModel: 'v30_4x12', tsOverdrive: true, vintageFuzz: false } },
      { id: 'metal_mesa', name: 'Mesa Dual Metal High-Gain', description: 'Scooped mids and chugging bottom end', parameters: { ampModel: 'mesaDual', drive: 8.5, bass: 4, mid: -2, treble: 4, presence: 3, cabModel: 'v30_4x12', tsOverdrive: false, vintageFuzz: false } },
      { id: 'sludge_fuzz', name: 'Doom Sludge Fuzz', description: 'Thick vintage fuzz with roaring sustain', parameters: { ampModel: 'marshallPlexi', drive: 7.0, bass: 5, mid: -1, treble: 1, presence: 0, cabModel: 'v30_4x12', tsOverdrive: false, vintageFuzz: true } },
      { id: 'svt_bass', name: 'Ampeg SVT Monster Bass', description: 'Punchy growl for 4-string and 5-string bass', parameters: { ampModel: 'ampegBass', drive: 4.5, bass: 6, mid: 1, treble: 2, presence: 1, cabModel: 'ampeg_8x10', tsOverdrive: false, vintageFuzz: false } },
    ],
  },
  {
    id: 'vocal_tune',
    name: 'Eve Vocal Auto-Tune',
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
    presets: [
      { id: 'tpain_robot', name: 'T-Pain Robotic Hard Tune', description: 'Zero retune speed for unmistakable robotic snap', parameters: { retuneSpeed: 0, correctionAmount: 100, scale: 'minor', formantShift: 0, vibratoDepth: 0 } },
      { id: 'trap_travis', name: 'Modern Trap Autotune', description: 'Fast correction with slight vocal vibrato', parameters: { retuneSpeed: 8, correctionAmount: 90, scale: 'minor', formantShift: 0, vibratoDepth: 10 } },
      { id: 'studio_subtle', name: 'Subtle Transparent Tracking', description: 'Invisible natural pitch correction', parameters: { retuneSpeed: 45, correctionAmount: 55, scale: 'chromatic', formantShift: 0, vibratoDepth: 25 } },
      { id: 'monster_deep', name: 'Low Voice Pitch Drop', description: 'Deep pitched formant monster voice', parameters: { retuneSpeed: 15, correctionAmount: 85, scale: 'chromatic', formantShift: -5, vibratoDepth: 0 } },
      { id: 'chipmunk_high', name: 'High Pitch Chipmunk', description: 'Upward formant shift for hyperpop hooks', parameters: { retuneSpeed: 12, correctionAmount: 90, scale: 'chromatic', formantShift: 6, vibratoDepth: 15 } },
    ],
  },
  {
    id: 'tape_machine',
    name: 'Eve Vintage Tape 1974',
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
    presets: [
      { id: 'master_30ips', name: 'Warm 1/2-Inch Master Tape', description: 'Hi-Fi 30 IPS mastering gloss', parameters: { drive: 35, headBump: 3.0, wowFlutter: 15, tapeSpeed: '30ips', tapeHiss: false } },
      { id: 'cassette_grime', name: 'Dusty Cassette 4-Track', description: 'Gritty 7.5 IPS tape with authentic hiss', parameters: { drive: 65, headBump: 4.5, wowFlutter: 45, tapeSpeed: '7.5ips', tapeHiss: true } },
      { id: 'psychedelic_flutter', name: 'Psychedelic Wow Flutter', description: 'Heavy reel wobble and pitch modulation', parameters: { drive: 40, headBump: 2.0, wowFlutter: 85, tapeSpeed: '15ips', tapeHiss: false } },
      { id: 'bass_bump', name: 'Sub Bass Head Bump', description: 'Massive low-end warmth around 70Hz', parameters: { drive: 25, headBump: 8.0, wowFlutter: 10, tapeSpeed: '15ips', tapeHiss: false } },
    ],
  },
  {
    id: 'dimension_chorus',
    name: 'Eve Dimension D Chorus',
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
    presets: [
      { id: 'juno_chorus', name: 'Juno-106 Studio Chorus', description: 'The famous analog synth width', parameters: { mode: 'mode2', stereoSpread: 120, mix: 50 } },
      { id: 'hyper_dimension', name: 'Hyper-Dimension Width', description: 'All buttons engaged for gigantic spatial spread', parameters: { mode: 'allIn', stereoSpread: 180, mix: 75 } },
      { id: 'subtle_acoustic', name: 'Subtle Acoustic Shimmer', description: 'Delicate stereo halo for acoustic guitar', parameters: { mode: 'mode1', stereoSpread: 90, mix: 35 } },
      { id: 'lush_dream', name: 'Lush Stereo Dreamscape', description: 'Swirling stereo modulation for pads', parameters: { mode: 'mode4', stereoSpread: 160, mix: 65 } },
    ],
  },
  {
    id: 'bitcrusher',
    name: 'Eve 8-Bit Lo-Fi Degrader',
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
    presets: [
      { id: 'gameboy_8bit', name: 'Nintendo 8-Bit Chiptune', description: 'Retro handheld console crunch', parameters: { bitDepth: 8, downsample: 6, filterCutoff: 4500, mix: 85 } },
      { id: 'sp1200_12bit', name: 'Vintage SP-1200 12-Bit', description: 'Golden era hip-hop sampler warmth', parameters: { bitDepth: 12, downsample: 2, filterCutoff: 8500, mix: 60 } },
      { id: 'hyperpop_destroy', name: 'Hyperpop Digital Destroy', description: 'Harsh digital clipping and alias artifacts', parameters: { bitDepth: 4, downsample: 16, filterCutoff: 3000, mix: 90 } },
      { id: 'phone_filter', name: 'Telephone Lo-Fi Filter', description: 'Band-limited telephone receiver character', parameters: { bitDepth: 6, downsample: 8, filterCutoff: 2600, mix: 100 } },
    ],
  },
  {
    id: 'dynamic_eq',
    name: 'Eve 8-Band Surgical Dynamic EQ',
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
    presets: [
      { id: 'master_air', name: 'Mastering Air & Low Lift', description: 'Sub cut with top-end air boost', parameters: { lowCutFreq: 30, lowShelfGain: 2.0, lowMidGain: -1.0, midGain: 0, highMidGain: 1.5, airShelfGain: 3.5, highCutFreq: 20000 } },
      { id: 'drum_contour', name: 'Snappy Drum Bus Contour', description: 'Mud scoop with snap presence', parameters: { lowCutFreq: 40, lowShelfGain: 3.0, lowMidGain: -2.5, midGain: -0.5, highMidGain: 3.0, airShelfGain: 2.0, highCutFreq: 19000 } },
      { id: 'de_esser', name: 'Harsh Sibilance De-Esser', description: 'Tames harsh 4kHz piercing frequencies', parameters: { lowCutFreq: 35, lowShelfGain: 0, lowMidGain: 0, midGain: 0, highMidGain: -4.5, airShelfGain: 0, highCutFreq: 18500 } },
      { id: 'bass_clarifier', name: 'Bass Mud Clarifier', description: 'Cleans out 250Hz boxy boom', parameters: { lowCutFreq: 35, lowShelfGain: 2.5, lowMidGain: -4.0, midGain: 0, highMidGain: 1.0, airShelfGain: 1.5, highCutFreq: 19500 } },
    ],
  },
  {
    id: 'haas_imager',
    name: 'Eve Haas 3D Spatial Imager',
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
    presets: [
      { id: 'wide_stereo', name: 'Wide Stereo Spread', description: 'Standard studio Haas width', parameters: { delayMs: 14, channel: 'right', crossfeed: 30, mix: 60 } },
      { id: 'subtle_room', name: 'Subtle Spatial Room', description: 'Mild 3D dimensional thickening', parameters: { delayMs: 8, channel: 'right', crossfeed: 15, mix: 40 } },
      { id: 'extreme_3d', name: 'Extreme 3D Hologram', description: 'Pushes sound completely outside the speakers', parameters: { delayMs: 26, channel: 'left', crossfeed: 50, mix: 80 } },
    ],
  },
  {
    id: 'soundfont_player',
    name: 'Eve SoundFont / SF2 Instrument Host',
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
    presets: [
      { id: 'grand_piano_pre', name: 'Acoustic Concert Grand', description: 'Full dynamic acoustic piano', parameters: { gmPreset: 'grandPiano', attack: 0.01, release: 0.8, filterCutoff: 15000 } },
      { id: 'dx7_pre', name: 'DX7 Electric Piano', description: 'Lush 80s FM electric keys', parameters: { gmPreset: 'epianoDx', attack: 0.01, release: 0.7, filterCutoff: 12000 } },
      { id: 'organ_pre', name: 'Drawbar Hammond Organ', description: 'Gospel and jazz rock organ', parameters: { gmPreset: 'drawbarOrgan', attack: 0.005, release: 0.1, filterCutoff: 16000 } },
      { id: 'strings_pre', name: 'Orchestral String Ensemble', description: 'Sweeping slow-attack violins', parameters: { gmPreset: 'stringEnsemble', attack: 0.3, release: 1.2, filterCutoff: 11000 } },
      { id: 'slap_pre', name: 'Slap Funk Bass', description: 'Punchy thumb slap bass guitar', parameters: { gmPreset: 'slapBass', attack: 0.005, release: 0.4, filterCutoff: 14000 } },
    ],
  },
  {
    id: 'custom_wam',
    name: 'Web Audio Module (WAM / ES Plugin Host)',
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
      case 'ott_compressor':
        this.buildOttCompressor();
        break;
      case 'space_reverb':
        this.buildSpaceReverb();
        break;
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

  private buildOttCompressor() {
    const p = this.instance.parameters;
    const t = this.ctx.currentTime;

    // 3-Band Linkwitz-Riley Crossover: Low (<140Hz), Mid (140-2500Hz), High (>2500Hz)
    const lowLpf = this.ctx.createBiquadFilter();
    lowLpf.type = 'lowpass';
    lowLpf.frequency.setValueAtTime(140, t);

    const midHpf = this.ctx.createBiquadFilter();
    midHpf.type = 'highpass';
    midHpf.frequency.setValueAtTime(140, t);
    const midLpf = this.ctx.createBiquadFilter();
    midLpf.type = 'lowpass';
    midLpf.frequency.setValueAtTime(2500, t);

    const highHpf = this.ctx.createBiquadFilter();
    highHpf.type = 'highpass';
    highHpf.frequency.setValueAtTime(2500, t);

    // Dynamics Compressors per band
    const compLow = this.ctx.createDynamicsCompressor();
    compLow.threshold.setValueAtTime(-24, t);
    compLow.knee.setValueAtTime(12, t);
    compLow.ratio.setValueAtTime(Number(p.downwardRatio || 4.0), t);
    compLow.attack.setValueAtTime(0.012, t);
    compLow.release.setValueAtTime(0.12, t);

    const compMid = this.ctx.createDynamicsCompressor();
    compMid.threshold.setValueAtTime(-20, t);
    compMid.knee.setValueAtTime(10, t);
    compMid.ratio.setValueAtTime(Number(p.downwardRatio || 4.0), t);
    compMid.attack.setValueAtTime(0.008, t);
    compMid.release.setValueAtTime(0.08, t);

    const compHigh = this.ctx.createDynamicsCompressor();
    compHigh.threshold.setValueAtTime(-18, t);
    compHigh.knee.setValueAtTime(8, t);
    compHigh.ratio.setValueAtTime(Number(p.downwardRatio || 4.0), t);
    compHigh.attack.setValueAtTime(0.004, t);
    compHigh.release.setValueAtTime(0.06, t);

    // Saturators for upward punch & presence
    const gainLow = this.ctx.createGain();
    gainLow.gain.setValueAtTime(1.1, t);
    const gainMid = this.ctx.createGain();
    gainMid.gain.setValueAtTime(1.0, t);
    const gainHigh = this.ctx.createGain();
    gainHigh.gain.setValueAtTime(1.2, t);

    const outSummer = this.ctx.createGain();
    outSummer.gain.setValueAtTime(1.0, t);

    // Routing
    this.inputNode.connect(lowLpf);
    lowLpf.connect(compLow);
    compLow.connect(gainLow);
    gainLow.connect(outSummer);

    this.inputNode.connect(midHpf);
    midHpf.connect(midLpf);
    midLpf.connect(compMid);
    compMid.connect(gainMid);
    gainMid.connect(outSummer);

    this.inputNode.connect(highHpf);
    highHpf.connect(compHigh);
    compHigh.connect(gainHigh);
    gainHigh.connect(outSummer);

    outSummer.connect(this.wetGain);

    this.dspNodes.push(
      lowLpf,
      midHpf,
      midLpf,
      highHpf,
      compLow,
      compMid,
      compHigh,
      gainLow,
      gainMid,
      gainHigh,
      outSummer
    );
  }

  private buildSpaceReverb() {
    const p = this.instance.parameters;
    const t = this.ctx.currentTime;

    // Pre-delay
    const preDelay = this.ctx.createDelay();
    preDelay.delayTime.setValueAtTime(Number(p.preDelay || 15) / 1000, t);

    // 4 parallel comb delays for smooth spatial reflection
    const delayTimes = [0.031, 0.039, 0.047, 0.057];
    const combNodes: AudioNode[] = [];
    const merger = this.ctx.createChannelMerger(2);

    const damping = this.ctx.createBiquadFilter();
    damping.type = 'lowpass';
    damping.frequency.setValueAtTime(Number(p.damping || 7000), t);

    // Shimmer feedback loop (+1 octave tone reflection)
    const shimmerHpf = this.ctx.createBiquadFilter();
    shimmerHpf.type = 'highpass';
    shimmerHpf.frequency.setValueAtTime(1800, t);
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime((Number(p.shimmer || 25) / 100) * 0.45, t);

    this.inputNode.connect(preDelay);

    delayTimes.forEach((dt, idx) => {
      const d = this.ctx.createDelay();
      d.delayTime.setValueAtTime(dt, t);
      const fb = this.ctx.createGain();
      fb.gain.setValueAtTime(0.72, t);

      preDelay.connect(d);
      d.connect(fb);
      fb.connect(d);
      d.connect(damping);

      combNodes.push(d, fb);
    });

    damping.connect(merger, 0, 0);
    damping.connect(merger, 0, 1);

    damping.connect(shimmerHpf);
    shimmerHpf.connect(shimmerGain);
    shimmerGain.connect(preDelay);

    merger.connect(this.wetGain);

    this.dspNodes.push(preDelay, damping, shimmerHpf, shimmerGain, merger, ...combNodes);
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
    if (this.instance.pluginId === 'ott_compressor' && this.dspNodes.length >= 11) {
      const compLow = this.dspNodes[4] as DynamicsCompressorNode;
      const compMid = this.dspNodes[5] as DynamicsCompressorNode;
      const compHigh = this.dspNodes[6] as DynamicsCompressorNode;
      const downRatio = Math.max(1, Number(p.downwardRatio || 4.0));
      compLow.ratio.setTargetAtTime(downRatio, t, 0.02);
      compMid.ratio.setTargetAtTime(downRatio, t, 0.02);
      compHigh.ratio.setTargetAtTime(downRatio, t, 0.02);

      const inGainVal = Math.pow(10, Number(p.inGain || 0) / 20);
      const outGainVal = Math.pow(10, Number(p.outGain || 0) / 20);
      const depthVal = Number(p.depth || 75) / 100;
      const outSummer = this.dspNodes[10] as GainNode;
      outSummer.gain.setTargetAtTime(inGainVal * outGainVal * (0.6 + depthVal * 0.4), t, 0.02);
    } else if (this.instance.pluginId === 'space_reverb' && this.dspNodes.length >= 4) {
      const preDelay = this.dspNodes[0] as DelayNode;
      preDelay.delayTime.setTargetAtTime(Number(p.preDelay || 15) / 1000, t, 0.02);
      const damping = this.dspNodes[1] as BiquadFilterNode;
      damping.frequency.setTargetAtTime(Number(p.damping || 7000), t, 0.02);
      const shimmerGain = this.dspNodes[3] as GainNode;
      shimmerGain.gain.setTargetAtTime((Number(p.shimmer || 25) / 100) * 0.45, t, 0.02);
    } else if (this.instance.pluginId === 'tape_machine' && this.dspNodes.length >= 4) {
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

  public applyPreset(channelIndex: number, instanceId: string, parameters: Record<string, number | boolean | string>) {
    const node = this.findNode(channelIndex, instanceId);
    if (node) {
      for (const [k, v] of Object.entries(parameters)) {
        node.setParameter(k, v);
      }
    }
  }

  private findNode(channelIndex: number, instanceId: string): VstAudioNodeInstance | undefined {
    const chain = this.channelVstChains.get(channelIndex);
    return chain?.find((n) => n.instance.instanceId === instanceId);
  }
}
