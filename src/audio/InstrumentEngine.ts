import { InstrumentCategory, InstrumentDefinition } from '../types/daw';
import { midiToFrequency } from './Presets';

export const INSTRUMENT_CATALOG: InstrumentDefinition[] = [
  // --- PIANOS & KEYBOARDS ---
  {
    id: 'grand_piano',
    name: 'Concert Grand Piano',
    category: 'keys',
    description: 'Acoustic concert grand with dynamic hammer strike and multi-harmonic string sustain.',
    defaultOctave: 4,
    color: '#38bdf8',
    tags: ['acoustic', 'piano', 'classical', 'pop', 'ballad'],
  },
  {
    id: 'rhodes_ep',
    name: 'Vintage Rhodes EP',
    category: 'keys',
    description: 'Warm electric piano with metallic tine bell transient and subtle stereo vibrato.',
    defaultOctave: 4,
    color: '#0284c7',
    tags: ['electric', 'vintage', 'rhodes', 'neo-soul', 'jazz', 'lo-fi'],
  },
  {
    id: 'wurlitzer',
    name: '70s Wurlitzer Reed',
    category: 'keys',
    description: 'Biting vintage reed piano with subtle overdrive and rhythmic tremolo.',
    defaultOctave: 4,
    color: '#0ea5e9',
    tags: ['vintage', 'wurlitzer', 'rock', 'soul'],
  },
  {
    id: 'clavinet',
    name: 'Funky D6 Clavinet',
    category: 'keys',
    description: 'Sharp percussive plectrum snap for punchy funk and disco grooves.',
    defaultOctave: 4,
    color: '#7dd3fc',
    tags: ['funk', 'disco', 'percussive', 'pluck'],
  },
  {
    id: 'hammond_organ',
    name: 'B3 Tonewheel Organ',
    category: 'keys',
    description: 'Rich drawbar organ with fast Leslie rotary speaker chorus & tremolo.',
    defaultOctave: 4,
    color: '#bae6fd',
    tags: ['organ', 'gospel', 'blues', 'rock'],
  },
  {
    id: 'church_organ',
    name: 'Cathedral Pipe Organ',
    category: 'keys',
    description: 'Massive multi-octave pipe cluster with colossal reverberant decay.',
    defaultOctave: 3,
    color: '#e0f2fe',
    tags: ['church', 'pipe', 'gothic', 'orchestral'],
  },
  {
    id: 'harpsichord',
    name: 'Baroque Harpsichord',
    category: 'keys',
    description: 'Plucked quill plectrum with crisp, metallic high harmonics.',
    defaultOctave: 4,
    color: '#f0f9ff',
    tags: ['baroque', 'classical', 'bright'],
  },

  // --- BASS & 808S ---
  {
    id: 'deep_808',
    name: 'Neo 808 Sub Boom',
    category: 'bass',
    description: 'Clean deep sub fundamental with smooth pitch-bend drop.',
    defaultOctave: 2,
    color: '#a855f7',
    tags: ['808', 'sub', 'trap', 'hiphop'],
  },
  {
    id: 'distorted_808',
    name: 'Heavy Drill Overdrive 808',
    category: 'bass',
    description: 'Screaming wave-folded 808 with harsh mid-range distortion and slides.',
    defaultOctave: 2,
    color: '#9333ea',
    tags: ['808', 'drill', 'distorted', 'trap'],
  },
  {
    id: 'acoustic_upright',
    name: 'Acoustic Upright Bass',
    category: 'bass',
    description: 'Warm wooden upright double bass with organic finger plucks.',
    defaultOctave: 2,
    color: '#c084fc',
    tags: ['acoustic', 'jazz', 'upright', 'natural'],
  },
  {
    id: 'slap_bass',
    name: 'Funk Slap Bass',
    category: 'bass',
    description: 'Percussive thumb slap with bright metallic snap and woody resonance.',
    defaultOctave: 2,
    color: '#d8b4fe',
    tags: ['slap', 'funk', 'pop', 'disco'],
  },
  {
    id: 'reese_bass',
    name: 'Analog Reese Drone Bass',
    category: 'bass',
    description: 'Multi-saw unison detuned bass with slow phased pulse.',
    defaultOctave: 2,
    color: '#7e22ce',
    tags: ['reese', 'dnb', 'dubstep', 'ambient'],
  },
  {
    id: 'acid_303',
    name: 'TB-303 Acid Bassline',
    category: 'bass',
    description: 'Screaming resonant lowpass squelch for hypnotic techno and acid house.',
    defaultOctave: 2,
    color: '#581c87',
    tags: ['acid', '303', 'techno', 'house'],
  },
  {
    id: 'synthwave_bass',
    name: '80s Synthwave Punch Bass',
    category: 'bass',
    description: 'Driving analog square-saw bass with fast punchy filter envelope.',
    defaultOctave: 2,
    color: '#e9d5ff',
    tags: ['synthwave', '80s', 'retro', 'driving'],
  },

  // --- STRINGS & ORCHESTRAL ---
  {
    id: 'string_ensemble',
    name: 'Symphonic String Section',
    category: 'strings',
    description: 'Lush violin, viola and cello section with rich vibrato and warm attack.',
    defaultOctave: 4,
    color: '#ec4899',
    tags: ['strings', 'orchestral', 'violin', 'cinematic'],
  },
  {
    id: 'pizzicato_strings',
    name: 'Orchestral Pizzicato',
    category: 'strings',
    description: 'Snappy staccato plucked orchestral string section.',
    defaultOctave: 4,
    color: '#db2777',
    tags: ['strings', 'pizzicato', 'staccato', 'trap'],
  },
  {
    id: 'flute',
    name: 'Concert Flute',
    category: 'strings',
    description: 'Airy breathy concert woodwind with natural expressive vibrato.',
    defaultOctave: 5,
    color: '#f472b6',
    tags: ['flute', 'woodwind', 'airy', 'melody'],
  },
  {
    id: 'pan_flute',
    name: 'Andean Pan Flute',
    category: 'strings',
    description: 'Haunting hollow wooden pipe with chuff breath attack.',
    defaultOctave: 5,
    color: '#fbcfe8',
    tags: ['panflute', 'ethnic', 'chuff', 'chill'],
  },
  {
    id: 'brass_horns',
    name: 'Symphonic Brass Section',
    category: 'strings',
    description: 'French horns and trumpets with dynamic harmonic swell.',
    defaultOctave: 3,
    color: '#be185d',
    tags: ['brass', 'horns', 'fanfare', 'epic'],
  },
  {
    id: 'synth_brass',
    name: '80s Retro Synth Brass',
    category: 'strings',
    description: 'Iconic punchy polyphonic brass synth inspired by classic Oberheim/Juno.',
    defaultOctave: 4,
    color: '#9d174d',
    tags: ['synthbrass', '80s', 'jump', 'retro'],
  },

  // --- GUITARS & MALLETS ---
  {
    id: 'acoustic_guitar',
    name: 'Acoustic Nylon Guitar',
    category: 'guitars',
    description: 'Warm plucked string physical model with harmonic decay.',
    defaultOctave: 4,
    color: '#f59e0b',
    tags: ['guitar', 'nylon', 'acoustic', 'fingerstyle'],
  },
  {
    id: 'clean_electric_guitar',
    name: 'Clean Electric Strat',
    category: 'guitars',
    description: 'Bright magnetic coil electric guitar with transparent sustain.',
    defaultOctave: 4,
    color: '#d97706',
    tags: ['guitar', 'electric', 'clean', 'indie'],
  },
  {
    id: 'kalimba',
    name: 'African Thumb Piano (Kalimba)',
    category: 'guitars',
    description: 'Sweet metal tine tines on wooden soundboard with sparkling overtones.',
    defaultOctave: 5,
    color: '#fbbf24',
    tags: ['kalimba', 'plucked', 'bell', 'chill'],
  },
  {
    id: 'marimba',
    name: 'Rosewood Marimba',
    category: 'guitars',
    description: 'Warm hollow wooden bar resonance with quick felt mallet hits.',
    defaultOctave: 4,
    color: '#fde68a',
    tags: ['marimba', 'mallet', 'wooden', 'percussive'],
  },
  {
    id: 'vibraphone',
    name: 'Jazz Vibraphone',
    category: 'guitars',
    description: 'Luminous metallic tone with motor-driven tremolo vibrato.',
    defaultOctave: 4,
    color: '#b45309',
    tags: ['vibraphone', 'jazz', 'metallic', 'tremolo'],
  },
  {
    id: 'steel_drum',
    name: 'Caribbean Steel Pan',
    category: 'guitars',
    description: 'Bright dual-harmonic tuned steel pan with island bounce.',
    defaultOctave: 4,
    color: '#78350f',
    tags: ['steeldrum', 'caribbean', 'bright', 'tropical'],
  },
  {
    id: 'koto',
    name: 'Japanese Koto Zither',
    category: 'guitars',
    description: 'Traditional plucked silk string with subtle micro-pitch bend.',
    defaultOctave: 4,
    color: '#fef3c7',
    tags: ['koto', 'asian', 'silk', 'plucked'],
  },

  // --- SYNTHS & LEADS ---
  {
    id: 'supersaw_lead',
    name: 'Festival EDM Supersaw',
    category: 'synths',
    description: 'Massive 7-voice detuned sawtooth unison with wide stereo imaging.',
    defaultOctave: 4,
    color: '#ff763b',
    tags: ['supersaw', 'edm', 'lead', 'future-bass'],
  },
  {
    id: 'hyperpop_lead',
    name: 'Hyperpop Square Chirp',
    category: 'synths',
    description: 'Fast pitch-swept square wave with glassy digital presence.',
    defaultOctave: 5,
    color: '#ff8c5a',
    tags: ['hyperpop', 'chirp', 'square', 'glitch'],
  },
  {
    id: 'chiptune_8bit',
    name: 'Game Boy 8-Bit Lead',
    category: 'synths',
    description: 'Authentic retro arcade pulse wave with arpeggio vibrato.',
    defaultOctave: 5,
    color: '#ffa67e',
    tags: ['chiptune', '8bit', 'arcade', 'retro'],
  },
  {
    id: 'synth_choir',
    name: 'Vocal Formant Choir',
    category: 'synths',
    description: 'Human vocal tract resonances singing ethereal "Aah" / "Ooh" harmonies.',
    defaultOctave: 4,
    color: '#ffc1a3',
    tags: ['vocal', 'choir', 'formant', 'ambient'],
  },
  {
    id: 'cyberpunk_lead',
    name: 'Cyberpunk Industrial Lead',
    category: 'synths',
    description: 'Distorted sync oscillator with aggressive overdrive cut.',
    defaultOctave: 4,
    color: '#ea580c',
    tags: ['cyberpunk', 'industrial', 'lead', 'distorted'],
  },

  // --- PADS & ATMOSPHERES ---
  {
    id: 'dream_pad',
    name: 'Ethereal Dream Pad',
    category: 'pads',
    description: 'Gentle slow attack with warm stereo detune and wide reverb tail.',
    defaultOctave: 3,
    color: '#22c55e',
    tags: ['pad', 'ambient', 'dreamy', 'lush'],
  },
  {
    id: 'shimmer_pad',
    name: 'Crystal Shimmer Pad',
    category: 'pads',
    description: 'High octave glittering wash with crystalline decay.',
    defaultOctave: 4,
    color: '#16a34a',
    tags: ['shimmer', 'celestial', 'crystal', 'reverb'],
  },
  {
    id: 'lofi_tape_pad',
    name: 'Dusty Lo-Fi Tape Pad',
    category: 'pads',
    description: 'Warm analog pad with subtle wow & flutter pitch drift and tape saturation.',
    defaultOctave: 3,
    color: '#4ade80',
    tags: ['lofi', 'tape', 'flutter', 'dusty'],
  },
  {
    id: 'dark_cinema_drone',
    name: 'Dark Cinema Drone',
    category: 'pads',
    description: 'Deep ominous tension texture with slow lowpass filter modulation.',
    defaultOctave: 2,
    color: '#15803d',
    tags: ['cinema', 'drone', 'dark', 'tension'],
  },

  // --- SFX & RISERS ---
  {
    id: 'laser_zap',
    name: 'Sci-Fi Laser Blip',
    category: 'fx',
    description: 'Hyper-fast downward frequency pitch sweep for retro future accents.',
    defaultOctave: 5,
    color: '#06b6d4',
    tags: ['fx', 'laser', 'scifi', 'blip'],
  },
  {
    id: 'white_noise_riser',
    name: 'EDM Noise Riser',
    category: 'fx',
    description: 'Filtered resonant white noise sweeping upward for tension drops.',
    defaultOctave: 4,
    color: '#0891b2',
    tags: ['fx', 'riser', 'sweep', 'edm'],
  },
  {
    id: 'sub_impact',
    name: 'Cinema Sub Impact Boom',
    category: 'fx',
    description: 'Tremendous low-frequency impact boom for drops and downbeats.',
    defaultOctave: 2,
    color: '#22d3ee',
    tags: ['fx', 'sub', 'boom', 'impact'],
  },
  {
    id: 'retro_coin',
    name: '8-Bit Coin Pickup',
    category: 'fx',
    description: 'Classic video game coin collect arpeggiated chime.',
    defaultOctave: 5,
    color: '#67e8f9',
    tags: ['fx', '8bit', 'coin', 'retro'],
  },
];

export class InstrumentEngine {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;
  private activeVoices: Map<string, { stop: (time: number) => void }> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.generateNoiseBuffer();
  }

  private generateNoiseBuffer() {
    const size = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public noteOn(
    instrumentId: string,
    midiNote: number,
    velocity: number = 0.9,
    time: number,
    destination: AudioNode
  ): void {
    const key = `${instrumentId}-${midiNote}`;
    if (this.activeVoices.has(key)) {
      this.noteOff(instrumentId, midiNote, time);
    }

    const now = Math.max(time, this.ctx.currentTime);
    const freq = midiToFrequency(midiNote);

    switch (instrumentId) {
      case 'grand_piano':
        this.playGrandPiano(key, freq, velocity, now, destination);
        break;
      case 'rhodes_ep':
        this.playRhodes(key, freq, velocity, now, destination);
        break;
      case 'wurlitzer':
        this.playWurlitzer(key, freq, velocity, now, destination);
        break;
      case 'clavinet':
        this.playClavinet(key, freq, velocity, now, destination);
        break;
      case 'hammond_organ':
        this.playHammondOrgan(key, freq, velocity, now, destination);
        break;
      case 'church_organ':
        this.playChurchOrgan(key, freq, velocity, now, destination);
        break;
      case 'harpsichord':
        this.playHarpsichord(key, freq, velocity, now, destination);
        break;
      case 'acoustic_upright':
        this.playUprightBass(key, freq, velocity, now, destination);
        break;
      case 'distorted_808':
        this.playDistorted808(key, freq, velocity, now, destination);
        break;
      case 'slap_bass':
        this.playSlapBass(key, freq, velocity, now, destination);
        break;
      case 'reese_bass':
        this.playReeseBass(key, freq, velocity, now, destination);
        break;
      case 'string_ensemble':
        this.playStrings(key, freq, velocity, now, destination);
        break;
      case 'pizzicato_strings':
        this.playPizzicato(key, freq, velocity, now, destination);
        break;
      case 'flute':
        this.playFlute(key, freq, velocity, now, destination);
        break;
      case 'pan_flute':
        this.playPanFlute(key, freq, velocity, now, destination);
        break;
      case 'brass_horns':
        this.playBrass(key, freq, velocity, now, destination);
        break;
      case 'synth_brass':
        this.playSynthBrass(key, freq, velocity, now, destination);
        break;
      case 'acoustic_guitar':
        this.playAcousticGuitar(key, freq, velocity, now, destination);
        break;
      case 'clean_electric_guitar':
        this.playElectricGuitar(key, freq, velocity, now, destination);
        break;
      case 'kalimba':
        this.playKalimba(key, freq, velocity, now, destination);
        break;
      case 'marimba':
        this.playMarimba(key, freq, velocity, now, destination);
        break;
      case 'vibraphone':
        this.playVibraphone(key, freq, velocity, now, destination);
        break;
      case 'steel_drum':
        this.playSteelDrum(key, freq, velocity, now, destination);
        break;
      case 'koto':
        this.playKoto(key, freq, velocity, now, destination);
        break;
      case 'supersaw_lead':
        this.playSupersaw(key, freq, velocity, now, destination);
        break;
      case 'hyperpop_lead':
        this.playHyperpop(key, freq, velocity, now, destination);
        break;
      case 'chiptune_8bit':
        this.playChiptune(key, freq, velocity, now, destination);
        break;
      case 'synth_choir':
        this.playChoir(key, freq, velocity, now, destination);
        break;
      case 'cyberpunk_lead':
        this.playCyberpunkLead(key, freq, velocity, now, destination);
        break;
      case 'shimmer_pad':
        this.playShimmerPad(key, freq, velocity, now, destination);
        break;
      case 'lofi_tape_pad':
        this.playLoFiPad(key, freq, velocity, now, destination);
        break;
      case 'dark_cinema_drone':
        this.playDarkDrone(key, freq, velocity, now, destination);
        break;
      case 'laser_zap':
        this.playLaserZap(key, freq, velocity, now, destination);
        break;
      case 'white_noise_riser':
        this.playNoiseRiser(key, freq, velocity, now, destination);
        break;
      case 'sub_impact':
        this.playSubImpact(key, freq, velocity, now, destination);
        break;
      case 'retro_coin':
        this.playRetroCoin(key, freq, velocity, now, destination);
        break;
      default:
        // Default to piano
        this.playGrandPiano(key, freq, velocity, now, destination);
        break;
    }
  }

  public noteOff(instrumentId: string, midiNote: number, time: number): void {
    const key = `${instrumentId}-${midiNote}`;
    const voice = this.activeVoices.get(key);
    if (voice) {
      voice.stop(time);
      this.activeVoices.delete(key);
    }
  }

  // --- 1. CONCERT GRAND PIANO ---
  private playGrandPiano(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.9, time + 0.005);
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.4, time + 0.8);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 3.0);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(16000, freq * (3.5 + velocity * 4)), time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(150, freq * 1.5), time + 2.0);

    // Hammer click transient
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(freq * 4, time);
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.25 * velocity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
    clickOsc.connect(clickGain);
    clickGain.connect(filter);
    clickOsc.start(time);
    clickOsc.stop(time + 0.03);

    // Fundamental & Harmonics
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.setValueAtTime(2.5, time);

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 2, time);
    const osc3Gain = this.ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.25, time);
    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc3.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.25);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          osc3.stop();
          voiceGain.disconnect();
        } catch {}
      }, 350);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 2. VINTAGE RHODES ELECTRIC PIANO ---
  private playRhodes(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.85, time + 0.008);
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.5, time + 0.5);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 3.5);

    // Tine transient chime
    const tine = this.ctx.createOscillator();
    tine.type = 'sine';
    tine.frequency.setValueAtTime(freq * 7, time);
    const tineGain = this.ctx.createGain();
    tineGain.gain.setValueAtTime(0.4 * velocity, time);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
    tine.connect(tineGain);

    // Warm body (sine + subtle triangle)
    const body = this.ctx.createOscillator();
    body.type = 'sine';
    body.frequency.setValueAtTime(freq, time);

    const tri = this.ctx.createOscillator();
    tri.type = 'triangle';
    tri.frequency.setValueAtTime(freq * 2, time);
    const triGain = this.ctx.createGain();
    triGain.gain.setValueAtTime(0.2, time);
    tri.connect(triGain);

    // Vibrato LFO
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(4.5, time);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(1.8, time); // Subtle frequency flutter
    lfo.connect(lfoGain);
    lfoGain.connect(body.frequency);
    lfo.start(time);

    body.connect(voiceGain);
    triGain.connect(voiceGain);
    tineGain.connect(voiceGain);
    voiceGain.connect(dest);

    tine.start(time);
    body.start(time);
    tri.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.3);
      setTimeout(() => {
        try {
          tine.stop();
          body.stop();
          tri.stop();
          lfo.stop();
          voiceGain.disconnect();
        } catch {}
      }, 400);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 3. 70S WURLITZER REED ---
  private playWurlitzer(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.01);
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.45, time + 0.4);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.Q.setValueAtTime(1.2, time);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.2);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 250);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 4. CLAVINET D6 ---
  private playClavinet(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.85, time + 0.002);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(12000, freq * 6), time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 0.15);
    filter.Q.setValueAtTime(4.0, time);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.08);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 150);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 5. B3 DRAWBAR ORGAN ---
  private playHammondOrgan(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.7, time);

    // Harmonic drawbars: 1x, 2x, 3x, 4x
    const drawbars = [1, 2, 3, 4];
    const oscs: OscillatorNode[] = [];

    drawbars.forEach((mult, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * mult, time);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4 / (i + 1), time);
      osc.connect(g);
      g.connect(voiceGain);
      osc.start(time);
      oscs.push(osc);
    });

    voiceGain.connect(dest);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.05);
      setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        voiceGain.disconnect();
      }, 100);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 6. CATHEDRAL PIPE ORGAN ---
  private playChurchOrgan(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.75, time + 0.05);

    const pipeMults = [0.5, 1, 2, 4];
    const oscs: OscillatorNode[] = [];

    pipeMults.forEach((mult) => {
      const osc = this.ctx.createOscillator();
      osc.type = mult <= 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * mult, time);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.25, time);
      osc.connect(g);
      g.connect(voiceGain);
      osc.start(time);
      oscs.push(osc);
    });

    voiceGain.connect(dest);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.5);
      setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        voiceGain.disconnect();
      }, 600);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 7. HARPSICHORD ---
  private playHarpsichord(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.8, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, time);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.05);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 100);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 8. ACOUSTIC UPRIGHT BASS ---
  private playUprightBass(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.95, time + 0.01);
    voiceGain.gain.exponentialRampToValueAtTime(velocity * 0.3, time + 0.4);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + 0.5);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.15);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 200);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 9. DISTORTED OVERDRIVE 808 ---
  private playDistorted808(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.9, time + 0.005);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    // Pitch punch drop
    osc.frequency.setValueAtTime(freq * 1.8, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.06);

    const shaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(44100);
    for (let i = 0; i < 44100; i++) {
      const x = (i * 2) / 44100 - 1;
      curve[i] = Math.tanh(x * 3.5); // Hard saturation
    }
    shaper.curve = curve as unknown as Float32Array<ArrayBuffer>;

    osc.connect(shaper);
    shaper.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.2);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 250);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 10. FUNK SLAP BASS ---
  private playSlapBass(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.9, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);

    // Pop attack transient
    const pop = this.ctx.createOscillator();
    pop.type = 'square';
    pop.frequency.setValueAtTime(freq * 4, time);
    pop.frequency.exponentialRampToValueAtTime(freq, time + 0.04);
    const popGain = this.ctx.createGain();
    popGain.gain.setValueAtTime(0.6 * velocity, time);
    popGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    pop.connect(popGain);
    pop.start(time);
    pop.stop(time + 0.06);

    // Body
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.15);
    filter.Q.setValueAtTime(3.0, time);

    popGain.connect(voiceGain);
    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.08);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 150);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 11. ANALOG REESE BASS ---
  private playReeseBass(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.8, time);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    osc1.detune.setValueAtTime(-14, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.setValueAtTime(14, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, time);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.15);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 200);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 12. SYMPHONIC STRINGS ---
  private playStrings(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    // Smooth bow attack
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.7, time + 0.18);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    osc1.detune.setValueAtTime(-8, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.setValueAtTime(8, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);

    // Vibrato
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(5.2, time);
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(4.0, time);
    vibrato.connect(vibGain);
    vibGain.connect(osc1.detune);
    vibGain.connect(osc2.detune);
    vibrato.start(time);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.45);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          vibrato.stop();
          voiceGain.disconnect();
        } catch {}
      }, 550);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 13. PIZZICATO STRINGS ---
  private playPizzicato(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.85, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(8000, freq * 4), time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.1, time + 0.1);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.05);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 100);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 14. CONCERT FLUTE ---
  private playFlute(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.75, time + 0.06);

    // Pure tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Breathy noise
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(freq * 2, time);
      noiseFilter.Q.setValueAtTime(3.0, time);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08 * velocity, time);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(voiceGain);
      noise.start(time);
    }

    // Vibrato
    const vib = this.ctx.createOscillator();
    vib.frequency.setValueAtTime(5.5, time);
    const vibG = this.ctx.createGain();
    vibG.gain.setValueAtTime(freq * 0.02, time);
    vib.connect(vibG);
    vibG.connect(osc.frequency);
    vib.start(time);

    osc.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.15);
      setTimeout(() => {
        try {
          osc.stop();
          vib.stop();
          voiceGain.disconnect();
        } catch {}
      }, 200);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 15. PAN FLUTE ---
  private playPanFlute(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.04);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, time);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.2);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 250);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 16. SYMPHONIC BRASS ---
  private playBrass(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.08);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.frequency.linearRampToValueAtTime(freq * 4.5, time + 0.2);

    osc1.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.2);
      setTimeout(() => {
        try {
          osc1.stop();
          voiceGain.disconnect();
        } catch {}
      }, 250);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 17. 80S SYNTH BRASS ---
  private playSynthBrass(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.02);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);
    osc1.detune.setValueAtTime(-6, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.setValueAtTime(6, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.linearRampToValueAtTime(4500, time + 0.1);
    filter.frequency.exponentialRampToValueAtTime(1800, time + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.2);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 250);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 18. ACOUSTIC NYLON GUITAR ---
  private playAcousticGuitar(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.85, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(10000, freq * 5), time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.3);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.15);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 200);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 19. CLEAN ELECTRIC GUITAR ---
  private playElectricGuitar(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.8, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.2);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq, time);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.25, time);
    osc2.connect(osc2Gain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, time);

    osc1.connect(filter);
    osc2Gain.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.2);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 250);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 20. KALIMBA (THUMB PIANO) ---
  private playKalimba(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.9, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.4);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 3, time);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.35, time);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.15);
    osc2.connect(osc2Gain);

    osc1.connect(voiceGain);
    osc2Gain.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.1);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 150);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 21. ROSEWOOD MARIMBA ---
  private playMarimba(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.95, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 4, time); // 4th harmonic wood resonance
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.4, time);
    osc2Gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc2.connect(osc2Gain);

    osc1.connect(voiceGain);
    osc2Gain.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.05);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 100);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 22. JAZZ VIBRAPHONE ---
  private playVibraphone(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.85, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.8);

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Motor Tremolo
    const trem = this.ctx.createOscillator();
    trem.frequency.setValueAtTime(4.2, time);
    const tremGain = this.ctx.createGain();
    tremGain.gain.setValueAtTime(0.3, time);
    trem.connect(tremGain.gain);
    trem.start(time);

    osc.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.2);
      setTimeout(() => {
        try {
          osc.stop();
          trem.stop();
          voiceGain.disconnect();
        } catch {}
      }, 250);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 23. CARIBBEAN STEEL DRUM ---
  private playSteelDrum(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.9, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, time); // Non-harmonic metallic ratio
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.5, time);
    osc2.connect(osc2Gain);

    osc1.connect(voiceGain);
    osc2Gain.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.1);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 150);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 24. JAPANESE KOTO ---
  private playKoto(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.9, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    // Koto pitch bend up on pick
    osc.frequency.setValueAtTime(freq * 0.97, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 2, time);
    filter.Q.setValueAtTime(2.5, time);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.1);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 150);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 25. FESTIVAL EDM SUPERSAW ---
  private playSupersaw(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.75, time + 0.01);

    const detunes = [-24, -14, -6, 0, 6, 14, 24];
    const oscs: OscillatorNode[] = [];

    detunes.forEach((cents) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(cents, time);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.2, time);
      osc.connect(g);
      g.connect(voiceGain);
      osc.start(time);
      oscs.push(osc);
    });

    voiceGain.connect(dest);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.25);
      setTimeout(() => {
        oscs.forEach((o) => {
          try {
            o.stop();
          } catch {}
        });
        voiceGain.disconnect();
      }, 300);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 26. HYPERPOP CHIRP ---
  private playHyperpop(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.8, time);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.03);

    osc.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.05);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 100);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 27. 8-BIT CHIPTUNE ---
  private playChiptune(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.75, time);

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    osc.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.03);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 80);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 28. VOCAL CHOIR ---
  private playChoir(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.75, time + 0.15);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Formant 1: ~800Hz, Formant 2: ~1200Hz ("Aah")
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(800, time);
    f1.Q.setValueAtTime(5.0, time);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1250, time);
    f2.Q.setValueAtTime(5.0, time);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(voiceGain);
    f2.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.35);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 400);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 29. CYBERPUNK LEAD ---
  private playCyberpunkLead(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(velocity * 0.8, time);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, time);
    filter.Q.setValueAtTime(6.0, time);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.1);
      setTimeout(() => {
        try {
          osc.stop();
          voiceGain.disconnect();
        } catch {}
      }, 150);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 30. CRYSTAL SHIMMER PAD ---
  private playShimmerPad(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.7, time + 0.3);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.4, time);
    osc2.connect(osc2Gain);

    osc1.connect(voiceGain);
    osc2Gain.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.6);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 700);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 31. LO-FI TAPE PAD ---
  private playLoFiPad(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.7, time + 0.15);

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Tape wow/flutter LFO
    const wow = this.ctx.createOscillator();
    wow.frequency.setValueAtTime(1.8, time);
    const wowG = this.ctx.createGain();
    wowG.gain.setValueAtTime(3.5, time);
    wow.connect(wowG);
    wowG.connect(osc.detune);
    wow.start(time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.4);
      setTimeout(() => {
        try {
          osc.stop();
          wow.stop();
          voiceGain.disconnect();
        } catch {}
      }, 500);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 32. DARK CINEMA DRONE ---
  private playDarkDrone(key: string, freq: number, velocity: number, time: number, dest: AudioNode) {
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.linearRampToValueAtTime(velocity * 0.8, time + 0.4);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, time);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 0.5, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, time);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(dest);

    osc1.start(time);
    osc2.start(time);

    const stop = (relTime: number) => {
      const release = Math.max(relTime, this.ctx.currentTime);
      voiceGain.gain.cancelScheduledValues(release);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, release);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, release + 0.8);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          voiceGain.disconnect();
        } catch {}
      }, 900);
    };

    this.activeVoices.set(key, { stop });
  }

  // --- 33. LASER ZAP FX ---
  private playLaserZap(key: string, _freq: number, velocity: number, time: number, dest: AudioNode) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.2);

    this.activeVoices.set(key, { stop: () => {} });
  }

  // --- 34. WHITE NOISE RISER FX ---
  private playNoiseRiser(key: string, _freq: number, velocity: number, time: number, dest: AudioNode) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(8000, time + 1.8);
    filter.Q.setValueAtTime(4.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(velocity * 0.8, time + 1.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 2.0);

    this.activeVoices.set(key, { stop: () => {} });
  }

  // --- 35. SUB IMPACT BOOM FX ---
  private playSubImpact(key: string, _freq: number, velocity: number, time: number, dest: AudioNode) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.6);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 1.1, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.5);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 1.6);

    this.activeVoices.set(key, { stop: () => {} });
  }

  // --- 36. RETRO COIN FX ---
  private playRetroCoin(key: string, _freq: number, velocity: number, time: number, dest: AudioNode) {
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, time); // B5
    osc.frequency.setValueAtTime(1318.51, time + 0.08); // E6

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.6, time);
    gain.gain.setValueAtTime(velocity * 0.6, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.38);

    this.activeVoices.set(key, { stop: () => {} });
  }
}
