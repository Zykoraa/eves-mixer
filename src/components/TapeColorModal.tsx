import React from 'react';
import {
  Disc,
  X,
  Power,
  Sliders,
  Sparkles,
  Volume2,
  Activity,
  Waves,
  Zap,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { TapeColorParameters } from '../types/daw';

interface TapeColorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAPE_PRESETS: { label: string; desc: string; params: Partial<TapeColorParameters> }[] = [
  {
    label: 'Warm Cassette 1985',
    desc: 'Lush tape warmth with subtle wow/flutter and analog drive',
    params: { wowFlutter: 30, flutterRate: 0.8, tapeDrive: 45, vinylNoise: 15, vinylTone: 40, dropouts: 15, spaceReverb: 10, mix: 80 },
  },
  {
    label: 'Dusty Vinyl 33 RPM',
    desc: 'Heavy surface dust crackle, needle noise, and warm tube saturation',
    params: { wowFlutter: 15, flutterRate: 0.5, tapeDrive: 25, vinylNoise: 65, vinylTone: 55, dropouts: 5, spaceReverb: 0, mix: 90 },
  },
  {
    label: 'Melted VHS Tape',
    desc: 'Extreme tape wobble, degraded frequency loss, and tape dropouts',
    params: { wowFlutter: 75, flutterRate: 2.2, tapeDrive: 55, vinylNoise: 30, vinylTone: 25, dropouts: 60, spaceReverb: 25, mix: 85 },
  },
  {
    label: 'Lo-Fi Bedroom Chill',
    desc: 'Gentle pitch instability, soft vinyl hiss, and cozy room ambience',
    params: { wowFlutter: 45, flutterRate: 1.0, tapeDrive: 30, vinylNoise: 40, vinylTone: 45, dropouts: 20, spaceReverb: 30, mix: 75 },
  },
];

export const TapeColorModal: React.FC<TapeColorModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();
  const params = state.tapeColorParams;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#18161f] border border-[#3e344e] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#221e2c] border-b border-[#352e44]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Disc size={20} className={params.enabled ? 'animate-spin' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Eve Tape Color & Vinyl Texture</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono font-bold border border-orange-500/40">
                  RC-20 VIBE
                </span>
              </div>
              <p className="text-xs text-gray-400">Vintage Tape Wow, Flutter, Tube Saturation, Vinyl Dust & Reel Dropouts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => store.updateTapeColorParams({ enabled: !params.enabled })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                params.enabled
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/30'
                  : 'bg-[#2b2736] text-gray-400 hover:text-white'
              }`}
            >
              <Power size={14} />
              <span>{params.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#2b2736] text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-gray-400 font-bold uppercase">Vintage Era Presets:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TAPE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => store.updateTapeColorParams(p.params)}
                  className="p-2.5 rounded-lg border bg-[#201c2a] border-[#372f48] hover:border-orange-500/50 text-left transition-all group"
                >
                  <div className="text-xs font-bold font-mono text-orange-300 group-hover:text-white">{p.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Module Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Wow & Flutter */}
            <div className="bg-[#1f1b29] p-4 rounded-xl border border-[#342b44] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-orange-400">
                <span className="flex items-center gap-1.5">
                  <Waves size={14} />
                  <span>WOW & FLUTTER (PITCH WOBBLE)</span>
                </span>
                <span>{params.wowFlutter}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={params.wowFlutter}
                onChange={(e) => store.updateTapeColorParams({ wowFlutter: Number(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>Flutter Speed: {params.flutterRate.toFixed(1)} Hz</span>
                <input
                  type="range"
                  min={0.2}
                  max={6.0}
                  step={0.2}
                  value={params.flutterRate}
                  onChange={(e) => store.updateTapeColorParams({ flutterRate: Number(e.target.value) })}
                  className="w-28 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 2. Tape Saturation Drive */}
            <div className="bg-[#1f1b29] p-4 rounded-xl border border-[#342b44] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
                <span className="flex items-center gap-1.5">
                  <Zap size={14} />
                  <span>TAPE / TUBE SATURATION</span>
                </span>
                <span>{params.tapeDrive}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={params.tapeDrive}
                onChange={(e) => store.updateTapeColorParams({ tapeDrive: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="text-[10px] font-mono text-gray-400">
                Asymmetrical 2nd & 3rd harmonics for magnetic reel warmth
              </div>
            </div>

            {/* 3. Vinyl Dust & Noise */}
            <div className="bg-[#1f1b29] p-4 rounded-xl border border-[#342b44] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-pink-400">
                <span className="flex items-center gap-1.5">
                  <Disc size={14} />
                  <span>VINYL DUST & SURFACE CRACKLE</span>
                </span>
                <span>{params.vinylNoise}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={params.vinylNoise}
                onChange={(e) => store.updateTapeColorParams({ vinylNoise: Number(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>Tone: {params.vinylTone < 50 ? 'Dark Hiss' : 'Bright Dust'}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.vinylTone}
                  onChange={(e) => store.updateTapeColorParams({ vinylTone: Number(e.target.value) })}
                  className="w-28 accent-pink-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 4. Dropouts & Reel Wear */}
            <div className="bg-[#1f1b29] p-4 rounded-xl border border-[#342b44] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400">
                <span className="flex items-center gap-1.5">
                  <Activity size={14} />
                  <span>TAPE DROPOUTS & WEAR</span>
                </span>
                <span>{params.dropouts}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={params.dropouts}
                onChange={(e) => store.updateTapeColorParams({ dropouts: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="text-[10px] font-mono text-gray-400">
                Randomized micro-volume dips simulating degraded physical magnetic tape
              </div>
            </div>
          </div>

          {/* Master Mix & Space Reverb */}
          <div className="bg-[#1b1724] p-4 rounded-xl border border-[#322742] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400">Vintage Spring Ambience:</span>
                <span className="text-purple-400 font-bold">{params.spaceReverb}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={params.spaceReverb}
                onChange={(e) => store.updateTapeColorParams({ spaceReverb: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="w-full sm:w-1/2">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-gray-400">Global Wet / Dry Mix:</span>
                <span className="text-orange-400 font-bold">{params.mix}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={params.mix}
                onChange={(e) => store.updateTapeColorParams({ mix: Number(e.target.value) })}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
