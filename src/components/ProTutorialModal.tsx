import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Music,
  Mic,
  Sliders,
  Headphones,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Activity,
  Layers,
  Zap,
  Radio,
  Download,
  Info,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';

interface ProTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChordArchitect?: () => void;
  onOpenMastering?: () => void;
}

export const ProTutorialModal: React.FC<ProTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenChordArchitect,
  onOpenMastering,
}) => {
  const [state, store] = useDawStore();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotice = (msg: string) => {
    setAppliedNotice(msg);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const steps = [
    {
      id: 'beat',
      title: 'Step 1: Building a Hard-Hitting Track Foundation',
      subtitle: 'Drums, 808 Bass, Tempo & Swing',
      icon: <Music size={22} className="text-orange-400" />,
      content: (
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Every great modern track starts with a solid rhythmic foundation. Follow these golden rules:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-orange-400 uppercase block mb-1">
                1. Tempo & Key Selection
              </span>
              <p className="text-xs text-gray-400">
                Pick your genre tempo: <strong>Trap (140-155 BPM)</strong>, <strong>Lo-Fi / Boom Bap (85-92 BPM)</strong>, or <strong>Pop / House (120-128 BPM)</strong>. Lock your key (e.g. <em>C Minor</em> or <em>F# Minor</em>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-orange-400 uppercase block mb-1">
                2. Kick & 808 Tuning
              </span>
              <p className="text-xs text-gray-400">
                Tune your 808 sub bass to match the exact root notes of your chords. Never let the kick and 808 fight for space — sidechain ducking keeps the punch clean!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-orange-400 uppercase block mb-1">
                3. Bouncing Hi-Hat Rolls
              </span>
              <p className="text-xs text-gray-400">
                Use 1/16 and 1/32 ratchets on your hats. Adding 10%–20% swing gives the beat a human, head-nodding groove instead of sounding like a robot.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-orange-400 uppercase block mb-1">
                4. Layering Snare & Claps
              </span>
              <p className="text-xs text-gray-400">
                Place snares or claps on beats 2 and 4 (or beat 3 in half-time trap). Pan your hi-hats slightly right (+15%) and open hats slightly left for stereo dimension.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-800/40 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-orange-300 block">Instant Starter Action:</span>
              <span className="text-xs text-gray-400">Load our pre-programmed 140 BPM rolling trap groove into your beatmaker.</span>
            </div>
            <button
              onClick={() => {
                store.loadSampleTrapBeat();
                showNotice('Loaded Trap Beat Groove into Project!');
              }}
              className="px-3.5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-mono font-bold text-xs shadow-md transition-all flex-shrink-0"
            >
              🔥 Load Trap Starter
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'chords',
      title: 'Step 2: Chords & Melodies (The Emotional Core)',
      subtitle: 'Harmonic Progressions & Counter-Melodies',
      icon: <Sparkles size={22} className="text-sky-400" />,
      content: (
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Catchy chords give the singer an inspiring musical bed to sing over:
          </p>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-[#141620] border border-[#272c3d] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white text-xs block">Use Proven Roman Numeral Progressions</strong>
                <span className="text-xs text-gray-400">
                  Hit songs rely on emotional progressions like <strong>i - VI - III - VII</strong> (Emotional Minor) or <strong>I - V - vi - IV</strong> (Universal Pop Anthem).
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141620] border border-[#272c3d] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white text-xs block">Smooth Voice Leading (Hungarian Inversions)</strong>
                <span className="text-xs text-gray-400">
                  Avoid jumping an octave between chords! Inverting chords so notes stay close together creates silky, professional piano and synth pads.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141620] border border-[#272c3d] flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-white text-xs block">Leave Frequency Space for the Vocals</strong>
                <span className="text-xs text-gray-400">
                  The human voice lives between <strong>300Hz and 3.5kHz</strong>. Don't crowd this zone with harsh synths; dip 1-2dB in your keys so your singing sits right in front!
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-800/40 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-sky-300 block">Instant Chord Builder:</span>
              <span className="text-xs text-gray-400">Open the Chord Architect to generate scale-locked chord progressions with Hungarian voice leading.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenChordArchitect?.();
              }}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-black font-mono font-bold text-xs shadow-md transition-all flex-shrink-0"
            >
              🎹 Open Chord Architect
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'mic',
      title: 'Step 3: Setting Up Your Mic & Capturing Clean Takes',
      subtitle: 'Hardware, Distance, Headphone Monitoring & Count-in',
      icon: <Mic size={22} className="text-red-400" />,
      content: (
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Bad recording can never be completely saved in the mix. Get a pristine source recording in 4 simple steps:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <div className="flex items-center gap-2 mb-1">
                <Headphones size={15} className="text-amber-400" />
                <span className="text-xs font-bold text-white uppercase">1. Always Wear Headphones</span>
              </div>
              <p className="text-xs text-gray-400">
                Never sing with computer speakers playing! The beat will leak into your microphone, creating a nasty hollow echo that ruins your mix.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <div className="flex items-center gap-2 mb-1">
                <Sliders size={15} className="text-amber-400" />
                <span className="text-xs font-bold text-white uppercase">2. Gain Staging (-18dB Rule)</span>
              </div>
              <p className="text-xs text-gray-400">
                Set your mic input gain so your loudest singing hits between <strong>-18dB and -12dB</strong> (green/yellow on the meter). Never hit red 0dB (digital clipping).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={15} className="text-amber-400" />
                <span className="text-xs font-bold text-white uppercase">3. Turn On 80Hz Low-Cut</span>
              </div>
              <p className="text-xs text-gray-400">
                Human singing rarely produces frequencies below 80Hz. Enabling our <strong>80Hz Low-Cut</strong> removes computer fan hum, air conditioning, and desk vibrations.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={15} className="text-amber-400" />
                <span className="text-xs font-bold text-white uppercase">4. Use 4-Beat Count-In</span>
              </div>
              <p className="text-xs text-gray-400">
                Don't scramble when recording starts! Our count-in metronome gives you 4 clear clicks (4... 3... 2... 1...) so you can breathe and land right on beat 1.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-red-300 block">Open Vocal Studio:</span>
              <span className="text-xs text-gray-400">Switch to the Vocal Studio to select your mic, enable headphone monitoring, and sing with live pitch feedback.</span>
            </div>
            <button
              onClick={() => {
                store.setActiveView('vocalStudio');
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-mono font-bold text-xs shadow-md transition-all flex-shrink-0"
            >
              🎙️ Open Vocal Studio
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'vocal-mix',
      title: 'Step 4: The Radio Vocal Mixing Chain (Step-by-Step)',
      subtitle: 'EQ, Compression, De-Essing, Pitch Correction & Reverb',
      icon: <Activity size={22} className="text-purple-400" />,
      content: (
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            This exact 6-stage signal chain is what Grammy-winning engineers use to make raw vocals sound polished, upfront, and radio-ready:
          </p>

          <div className="space-y-2">
            {[
              {
                num: '1',
                title: 'High-Pass Low Cut (85 Hz)',
                desc: 'Cleans up sub rumble and handling noise so the compressor does not pump artificially.',
              },
              {
                num: '2',
                title: 'Subtractive Mud Cut (500 Hz, -2.5 dB)',
                desc: 'Removes the "cardboard box" resonance common in bedroom acoustics and untreated rooms.',
              },
              {
                num: '3',
                title: 'De-Esser (6.5 kHz Sibilance Tamer)',
                desc: 'Gently tames harsh "S", "T", and "CH" consonants before adding high-end sparkle.',
              },
              {
                num: '4',
                title: 'Two-Stage Optical Compression (3.2:1 Ratio)',
                desc: 'Tightens dynamic range so whispery words stay loud and belted notes don\'t hurt the ears (+3.5 dB makeup gain).',
              },
              {
                num: '5',
                title: 'Commercial "Air" High Shelf (+3.5 dB at 11 kHz)',
                desc: 'Adds expensive top-end sheen and modern breath presence that sits right on top of the beat.',
              },
              {
                num: '6',
                title: 'Lush Plate Reverb (2.2s) & Synced 1/8th Ping-Pong Delay',
                desc: 'Creates a 3D stereo cloud around your voice without washing out the clarity.',
              },
            ].map((st) => (
              <div key={st.num} className="p-2.5 rounded-lg bg-[#141620] border border-[#272c3d] flex items-center gap-3">
                <span className="w-5 h-5 rounded bg-purple-500/20 text-purple-400 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {st.num}
                </span>
                <div>
                  <strong className="text-white text-xs block">{st.title}</strong>
                  <span className="text-[11px] text-gray-400">{st.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-purple-300 block">1-Click Pro Vocal Preset:</span>
              <span className="text-xs text-gray-400">Instantly loads this entire 6-stage chain onto your vocal mixer channel.</span>
            </div>
            <button
              onClick={() => {
                store.applyProVocalChain(6); // Vocal channel
                showNotice('Applied 6-Stage Radio Vocal Chain to Channel 6 (Vocals)!');
              }}
              className="px-3.5 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-mono font-bold text-xs shadow-md transition-all flex-shrink-0"
            >
              ✨ Apply Pro Vocal Chain
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'master',
      title: 'Step 5: Mastering for Streaming (Spotify & Apple Music)',
      subtitle: 'LUFS Loudness, True Peak Limiting & Stereo Imaging',
      icon: <Radio size={22} className="text-emerald-400" />,
      content: (
        <div className="space-y-4 text-sm text-gray-300">
          <p>
            Mastering prepares your finished mix for global streaming services and commercial playback:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">
                1. Spotify Target: -14 LUFS
              </span>
              <p className="text-xs text-gray-400">
                Streaming platforms normalize songs to <strong>-14 LUFS Integrated</strong>. Songs pushed too loud get automatically turned down by algorithms!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">
                2. True Peak Ceiling (-1.0 dBFS)
              </span>
              <p className="text-xs text-gray-400">
                Setting the limiter ceiling to <strong>-1.0 dBFS</strong> prevents digital inter-sample distortion when MP3/AAC encoders compress the audio.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">
                3. Mono Sub Bass Below 120Hz
              </span>
              <p className="text-xs text-gray-400">
                Sub frequencies must always be mono. Phase cancellation in low frequencies ruins club sound systems and car subwoofers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141620] border border-[#272c3d]">
              <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">
                4. Analog Tape Warmth
              </span>
              <p className="text-xs text-gray-400">
                Our <em>Eve Tape Color</em> module glues the drums, vocals, and instruments together with subtle magnetic saturation and warm analog roundness.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-300 block">Apply Radio Master Preset:</span>
              <span className="text-xs text-gray-400">Activates the Radio Mastering Suite with True Peak limiter, -14 LUFS target, and mono sub filter.</span>
            </div>
            <button
              onClick={() => {
                store.applyRadioMastering('streaming');
                showNotice('Activated Radio Mastering Suite (-14 LUFS Streaming Target)!');
              }}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-mono font-bold text-xs shadow-md transition-all flex-shrink-0"
            >
              🎛️ Master for Streaming
            </button>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[activeStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#171922] border border-[#2e3344] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1e2230] border-b border-[#2b3042]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  The Complete Music Production & Vocal Recording Guide
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  STEP-BY-STEP
                </span>
              </div>
              <p className="text-xs text-gray-400">From blank canvas to radio-ready master with vocals</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2b3042] text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="flex items-center border-b border-[#292e3e] bg-[#14161f] overflow-x-auto">
          {steps.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => setActiveStep(idx)}
              className={`flex-1 min-w-[120px] py-3 px-3 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeStep === idx
                  ? 'border-amber-400 text-amber-300 bg-[#1b1e2c]'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#181a24]'
              }`}
            >
              <span>{idx + 1}.</span>
              <span className="truncate">{st.id.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Notification pill */}
        {appliedNotice && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2 text-xs font-bold text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 size={15} />
            <span>{appliedNotice}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center gap-3 border-b border-[#272c3d] pb-3">
            <div className="p-2 rounded-lg bg-[#202433]">{current.icon}</div>
            <div>
              <h3 className="text-base font-bold text-white">{current.title}</h3>
              <p className="text-xs text-gray-400">{current.subtitle}</p>
            </div>
          </div>

          {current.content}
        </div>

        {/* Modal Footer / Navigation Buttons */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1d27] border-t border-[#292e3e]">
          <button
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeStep === 0
                ? 'opacity-30 cursor-not-allowed text-gray-500'
                : 'bg-[#252a3a] text-gray-300 hover:text-white hover:bg-[#30364a]'
            }`}
          >
            <ArrowLeft size={14} />
            <span>Previous Step</span>
          </button>

          <span className="text-xs font-mono text-gray-500">
            Step {activeStep + 1} of {steps.length}
          </span>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-mono font-bold shadow-md transition-all"
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-mono font-bold shadow-md transition-all"
            >
              <CheckCircle2 size={14} />
              <span>Finish Tutorial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
