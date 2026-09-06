import React from 'react';
import {
  X,
  Play,
  Flame,
  Sparkles,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';

interface SimpleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimpleGuideModal: React.FC<SimpleGuideModalProps> = ({ isOpen, onClose }) => {
  const [, store] = useDawStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-fadeIn">
      <div className="bg-[#181a24] border border-[#35394a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-950/60 via-[#1f2230] to-[#181a24] border-b border-[#2e3244]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Sparkles size={22} className="text-yellow-400 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">How to Make a Beat in 30 Seconds</h2>
              <p className="text-xs text-gray-400">Simple 3-step guide — No music theory needed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#282b3a] text-gray-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-200">
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-xl bg-[#12141d] border border-[#2a2d3d] hover:border-orange-500/50 transition-colors">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg border border-orange-500/30">
              1
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Build the Drums (Beat)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                  Drums & Beat tab
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Click any colored square on the grid to place a drum hit. Click it again to turn it off. 
                Want instant drums? Just click the <strong>🔥 Instant Beat</strong> button to drop in a pro-made groove!
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-xl bg-[#12141d] border border-[#2a2d3d] hover:border-sky-500/50 transition-colors">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg border border-sky-500/30">
              2
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Add Melody & Chords</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                  Melody & Chords tab
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Click the <strong>✨ Make Chords</strong> button in the top bar to audition beautiful chord progressions 
                and send them to your track with one click. Or click on the piano keys to draw notes — the scale lock 
                makes sure you never hit an off-key note!
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-xl bg-[#12141d] border border-[#2a2d3d] hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              3
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Press Play & Polish</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Spacebar / Play Button
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Hit the <strong>Spacebar</strong> to hear your song! Toggle <strong>Radio Master</strong> for that loud, punchy radio sound, 
                or turn on <strong>Lo-Fi Warmth</strong> for retro vinyl texture. When you love it, click <strong>Export</strong> to download it!
              </p>
            </div>
          </div>

          {/* Quick 1-Click Action */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-900/30 via-red-950/20 to-[#12141d] border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="font-bold text-sm text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <Flame size={16} className="text-orange-400" />
                <span>Want to hear an example first?</span>
              </div>
              <p className="text-xs text-gray-400">
                Load a pre-made sample trap beat complete with 808 slides, drums, and melody.
              </p>
            </div>
            <button
              onClick={() => {
                store.loadSampleTrapBeat();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-105 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Play size={14} fill="currentColor" />
              <span>Load Sample Beat Now</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#14161f] border-t border-[#2a2d3d] flex items-center justify-between text-xs text-gray-400">
          <span>Tip: You can switch to <strong>Pro Studio</strong> in the top-right anytime for full advanced controls.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#242838] hover:bg-[#32364c] text-white font-semibold transition-all cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
