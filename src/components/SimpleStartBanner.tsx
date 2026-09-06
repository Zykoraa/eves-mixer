import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Music,
  Sliders,
  Disc,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Volume2,
  Zap,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';

interface SimpleStartBannerProps {
  onOpenGuide: () => void;
  onOpenChordArchitect: () => void;
}

export const SimpleStartBanner: React.FC<SimpleStartBannerProps> = ({
  onOpenGuide,
  onOpenChordArchitect,
}) => {
  const [state, store] = useDawStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!state.simpleMode) return null;

  return (
    <div className="bg-[#181a24] border-b border-[#2d3142] px-4 py-2 text-xs select-none transition-all shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30">
            <Sparkles size={13} className="text-yellow-400 animate-spin" />
            <span>SIMPLE STUDIO</span>
          </div>
          <span className="text-gray-400 hidden sm:inline text-[11px]">
            Fast beatmaker mode — 3 steps to make a full song:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#242838] hover:bg-[#30354a] text-sky-400 hover:text-white font-medium transition-all cursor-pointer border border-[#353a50]"
          >
            <HelpCircle size={13} />
            <span>30-Sec Guide</span>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-[#252838] text-gray-400 hover:text-white transition-all cursor-pointer"
            title={isCollapsed ? 'Show Quick Tools' : 'Collapse Quick Tools'}
          >
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-2.5 pt-2 border-t border-[#252838] grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Drums */}
          <div className="p-2.5 rounded-lg bg-[#12141c] border border-[#262a38] flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-400 flex items-center gap-1">
                <Flame size={13} />
                <span>1. Instant Drum Beats</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">1-Click Grooves</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => store.loadSampleTrapBeat()}
                className="px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 font-bold transition-all text-[11px] cursor-pointer"
              >
                🔥 Trap Heat
              </button>
              <button
                onClick={() => store.applyDrumPreset('boomBap')}
                className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-medium transition-all text-[11px] cursor-pointer"
              >
                Lo-Fi BoomBap
              </button>
              <button
                onClick={() => store.applyDrumPreset('drill')}
                className="px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 font-medium transition-all text-[11px] cursor-pointer"
              >
                UK Drill
              </button>
              <button
                onClick={() => store.applyDrumPreset('house')}
                className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-medium transition-all text-[11px] cursor-pointer"
              >
                House 4/4
              </button>
            </div>
          </div>

          {/* Step 2: Chords & Melody */}
          <div className="p-2.5 rounded-lg bg-[#12141c] border border-[#262a38] flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400 flex items-center gap-1">
                <Music size={13} />
                <span>2. Harmony & Melody</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Key: {state.selectedKey} {state.selectedScale}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={onOpenChordArchitect}
                className="px-2.5 py-1 rounded bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer shadow-sm shadow-sky-600/30"
              >
                <Sparkles size={12} />
                <span>Make Chords</span>
              </button>
              <button
                onClick={() => store.randomizeMelody()}
                className="px-2 py-1 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 font-medium transition-all text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Zap size={11} />
                <span>Random Lead</span>
              </button>
            </div>
          </div>

          {/* Step 3: Sound Polish */}
          <div className="p-2.5 rounded-lg bg-[#12141c] border border-[#262a38] flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Sliders size={13} />
                <span>3. One-Click Polish</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Master & Color</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() =>
                  store.updateMasteringParams({ enabled: !state.masteringParams.enabled })
                }
                className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer border ${
                  state.masteringParams.enabled
                    ? 'bg-teal-500 text-black border-teal-400 shadow-sm shadow-teal-500/30'
                    : 'bg-[#1e212d] text-gray-400 border-[#323648] hover:text-white'
                }`}
              >
                <Volume2 size={12} />
                <span>Radio Master: {state.masteringParams.enabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() =>
                  store.updateTapeColorParams({ enabled: !state.tapeColorParams.enabled })
                }
                className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer border ${
                  state.tapeColorParams.enabled
                    ? 'bg-amber-500 text-black border-amber-400 shadow-sm shadow-amber-500/30'
                    : 'bg-[#1e212d] text-gray-400 border-[#323648] hover:text-white'
                }`}
              >
                <Disc size={12} />
                <span>Lo-Fi Tape: {state.tapeColorParams.enabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
