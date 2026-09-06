import React from 'react';
import {
  Sparkles,
  X,
  Music,
  Zap,
  Disc,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { INSPIRATION_PROGRESSIONS } from '../audio/Presets';

interface InspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InspirationModal: React.FC<InspirationModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#181a24] border border-[#35394a] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-purple-900/50 via-[#1f2230] to-[#181a24] border-b border-[#2e3244]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <Sparkles size={18} className="animate-spin text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Inspiration Engine</h2>
              <p className="text-xs text-gray-400">AI-Assisted Chord Progressions & Beat Generators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282b3a] text-gray-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-gray-200">
          {/* Section 1: Instant Chord Progressions */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-purple-400 mb-2.5">
              <Music size={15} />
              <span>1-Click Chord Progression Generator</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {INSPIRATION_PROGRESSIONS.map((prog, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    store.applyInspirationProgression(prog);
                    onClose();
                  }}
                  className="p-3 rounded-lg bg-[#12141c] hover:bg-[#202332] border border-[#2c3042] hover:border-purple-500/60 cursor-pointer transition-all group shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors">
                        {prog.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                        {prog.genre}
                      </span>
                    </div>
                    <div className="flex gap-1 my-2 flex-wrap">
                      {prog.chords.map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-[#1c1f2b] text-[10px] font-mono text-gray-300 border border-[#2c3040]"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-[#232635]">
                    <span>Key: {prog.key} {prog.scale}</span>
                    <span className="text-purple-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Apply <ArrowRight size={10} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Drum Grooves */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-orange-400 mb-2.5">
              <Flame size={15} />
              <span>Instant Beat & Groove Templates</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  store.loadSampleTrapBeat();
                  onClose();
                }}
                className="p-3 rounded-lg bg-[#12141c] hover:bg-[#222536] border border-[#2c3042] text-left hover:border-orange-500/60 transition-all"
              >
                <div className="text-xs font-bold text-orange-400 mb-1">Trap Banger</div>
                <div className="text-[10px] text-gray-400">140 BPM • 808 Slides, Fast Hats & Melody</div>
              </button>

              <button
                onClick={() => {
                  store.applyDrumPreset('drill');
                  onClose();
                }}
                className="p-3 rounded-lg bg-[#12141c] hover:bg-[#222536] border border-[#2c3042] text-left hover:border-yellow-500/60 transition-all"
              >
                <div className="text-xs font-bold text-yellow-400 mb-1">UK/NY Drill</div>
                <div className="text-[10px] text-gray-400">142 BPM • Sliding 808s & 3rd-Beat Snare</div>
              </button>

              <button
                onClick={() => {
                  store.applyDrumPreset('boomBap');
                  onClose();
                }}
                className="p-3 rounded-lg bg-[#12141c] hover:bg-[#222536] border border-[#2c3042] text-left hover:border-purple-500/60 transition-all"
              >
                <div className="text-xs font-bold text-purple-400 mb-1">90s Boom Bap</div>
                <div className="text-[10px] text-gray-400">90 BPM • 28% MPC Swing & Vinyl Pocket</div>
              </button>

              <button
                onClick={() => {
                  store.applyDrumPreset('synthwave');
                  onClose();
                }}
                className="p-3 rounded-lg bg-[#12141c] hover:bg-[#222536] border border-[#2c3042] text-left hover:border-pink-500/60 transition-all"
              >
                <div className="text-xs font-bold text-pink-400 mb-1">Synthwave Drive</div>
                <div className="text-[10px] text-gray-400">124 BPM • Gated Reverb Snare & 16th Bass</div>
              </button>

              <button
                onClick={() => {
                  store.applyDrumPreset('house');
                  onClose();
                }}
                className="p-3 rounded-lg bg-[#12141c] hover:bg-[#222536] border border-[#2c3042] text-left hover:border-sky-500/60 transition-all"
              >
                <div className="text-xs font-bold text-sky-400 mb-1">Club House 4/4</div>
                <div className="text-[10px] text-gray-400">126 BPM • Pumping 909 & Offbeat Hat</div>
              </button>

              <button
                onClick={() => {
                  store.applyDrumPreset('phonk');
                  onClose();
                }}
                className="p-3 rounded-lg bg-[#12141c] hover:bg-[#222536] border border-[#2c3042] text-left hover:border-red-500/60 transition-all"
              >
                <div className="text-xs font-bold text-red-400 mb-1">Drift Phonk</div>
                <div className="text-[10px] text-gray-400">155 BPM • Distorted 808 & Hyper Hats</div>
              </button>
            </div>
          </div>

          {/* Section 3: Scale-Locked Melody Randomizer */}
          <div className="p-3.5 rounded-lg bg-gradient-to-r from-pink-950/30 to-purple-950/30 border border-pink-500/30 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-pink-300">Generate Scale-Locked Lead Melody</div>
              <p className="text-[11px] text-gray-400">
                Randomizes notes mathematically locked to <strong>{state.selectedKey} {state.selectedScale}</strong> so you never play a wrong note.
              </p>
            </div>
            <button
              onClick={() => {
                store.randomizeMelody();
                onClose();
              }}
              className="px-3 py-1.5 rounded-md bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold font-mono transition-all flex items-center gap-1 shadow-md shadow-pink-500/30"
            >
              <Zap size={13} />
              <span>Generate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
