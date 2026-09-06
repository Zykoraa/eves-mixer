import React from 'react';
import { HelpCircle, X, Keyboard, Radio } from 'lucide-react';
import { MidiManager } from '../audio/MidiManager';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const midi = MidiManager.getInstance();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#181a24] border border-[#35394a] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1f2230] border-b border-[#2e3244]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40">
              <Keyboard size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Eve's Mixer Cheat Sheet</h2>
              <p className="text-xs text-gray-400">DAW Keybindings & Hardware MIDI Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282b3a] text-gray-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs font-mono text-gray-200 overflow-y-auto">
          {/* Hardware MIDI status */}
          <div className="p-3 bg-[#11131a] rounded-lg border border-[#2b2e3c] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio size={15} className="text-emerald-400" />
              <span>Web MIDI API Controller:</span>
            </div>
            <span className="text-emerald-400 font-bold">
              {midi.isSupported ? 'Active (Plug & Play USB MIDI)' : 'Browser MIDI Not Supported'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-orange-400 font-bold uppercase tracking-wider text-[11px]">
              Global Transport
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Play / Pause:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">Space</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Toggle PAT / SONG:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">P</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Toggle Metronome:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">M</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Audition Track:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">Click Track</kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sky-400 font-bold uppercase tracking-wider text-[11px]">
              View Navigation
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Channel Rack:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">1</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Piano Roll:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">2</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Playlist Arranger:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">3</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Mixer Console:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">4</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">EveSynth Editor:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">5</kbd>
              </div>
              <div className="p-2 bg-[#12141c] rounded border border-[#262835] flex justify-between">
                <span className="text-gray-400">Eve LoopStation:</span>
                <kbd className="px-1.5 py-0.5 bg-[#252834] rounded text-white font-bold">6</kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-pink-400 font-bold uppercase tracking-wider text-[11px]">
              Computer Keyboard Piano
            </div>
            <div className="p-2.5 bg-[#12141c] rounded border border-[#262835]">
              <div className="text-gray-300 mb-1">Play notes live without a MIDI controller:</div>
              <div className="text-gray-400">
                White Keys: <strong className="text-white">A, S, D, F, G, H, J, K, L</strong> (C, D, E, F, G, A, B, C...)
              </div>
              <div className="text-gray-400 mt-0.5">
                Black Keys: <strong className="text-white">W, E, T, Y, U, O, P</strong> (C#, D#, F#, G#, A#...)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
