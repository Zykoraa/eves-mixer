import React, { useState } from 'react';
import {
  Sliders,
  Radio,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Cpu,
  Volume2,
  Activity,
  Zap,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { MidiManager } from '../audio/MidiManager';
import { MidiLearnManager, MidiLearnTarget } from '../audio/MidiLearnManager';

interface MidiLearnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MidiLearnModal: React.FC<MidiLearnModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();
  const midiManager = MidiManager.getInstance();
  const midiLearn = MidiLearnManager.getInstance();

  const [customTargetType, setCustomTargetType] = useState<'mixerVolume' | 'mixerPan' | 'synthCutoff' | 'tempo'>('mixerVolume');
  const [customChannel, setCustomChannel] = useState<number>(0);

  if (!isOpen) return null;

  const quickTargets: MidiLearnTarget[] = [
    { targetType: 'mixerVolume', channelIndex: 0, name: 'Master Volume', min: 0, max: 1.25 },
    { targetType: 'mixerPan', channelIndex: 0, name: 'Master Pan', min: -1, max: 1 },
    { targetType: 'synthCutoff', name: 'Eve Lead Cutoff', min: 40, max: 18000 },
    { targetType: 'tempo', name: 'Master Tempo (BPM)', min: 60, max: 200 },
    { targetType: 'mixerVolume', channelIndex: 1, name: 'Channel 1 (Kick) Volume', min: 0, max: 1.25 },
    { targetType: 'mixerVolume', channelIndex: 3, name: 'Channel 3 (808) Volume', min: 0, max: 1.25 },
    { targetType: 'mixerVolume', channelIndex: 4, name: 'Channel 4 (Synth) Volume', min: 0, max: 1.25 },
    { targetType: 'mixerVolume', channelIndex: 7, name: 'Channel 7 (Guitar) Volume', min: 0, max: 1.25 },
  ];

  const handleStartLearn = (t: MidiLearnTarget) => {
    store.startMidiLearn(t);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-3xl bg-[#181a24] border border-[#323647] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#141620] border-b border-[#2b2e3d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sliders size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white tracking-tight">Hardware WebMIDI Learn</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold border border-cyan-500/30">
                  MIDI CC MAPPER
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono">Map physical knobs, sliders, & faders to any DAW control</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#252838] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Hardware Device Connection Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#12141c] border border-[#272a39] text-xs font-mono">
            <div className="flex items-center gap-2">
              <Radio size={15} className="text-emerald-400 animate-pulse" />
              <span className="text-gray-300 font-bold">Detected MIDI Controllers:</span>
              <span className="text-emerald-400">
                {midiManager.connectedDevices.length > 0
                  ? midiManager.connectedDevices.join(', ')
                  : 'WebMIDI Ready (Connect any USB/Bluetooth MIDI Device)'}
              </span>
            </div>

            {midiLearn.lastReceivedCc && (
              <div className="text-[10px] text-gray-400 bg-[#1c1f2b] px-2 py-0.5 rounded border border-[#2f3346]">
                Last In: CC #{midiLearn.lastReceivedCc.cc} (Val: {midiLearn.lastReceivedCc.value})
              </div>
            )}
          </div>

          {/* Active MIDI Learn Banner */}
          {state.isMidiLearning && (
            <div className="p-4 rounded-lg bg-cyan-950/40 border-2 border-cyan-400/80 shadow-lg shadow-cyan-500/20 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Activity size={20} className="animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-cyan-300 font-mono">
                    MIDI LEARN ACTIVE: {state.learningTarget?.name}
                  </div>
                  <div className="text-xs text-gray-300">
                    Turn any physical knob, slider, or fader on your hardware controller to bind!
                  </div>
                </div>
              </div>

              <button
                onClick={() => store.cancelMidiLearn()}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs font-mono font-bold text-white shadow transition-all"
              >
                Cancel Learn
              </button>
            </div>
          )}

          {/* Quick Bind Shortcuts */}
          <div>
            <div className="text-[11px] font-mono uppercase text-gray-400 font-bold mb-2 flex items-center gap-1.5">
              <Zap size={13} className="text-amber-400" />
              <span>1-Click MIDI Learn Bindings</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickTargets.map((target) => (
                <button
                  key={target.name}
                  onClick={() => handleStartLearn(target)}
                  className="p-2.5 rounded-lg border border-[#2c3041] hover:border-cyan-400/60 bg-[#151722] hover:bg-[#1c202e] flex flex-col justify-between text-left transition-all group shadow-sm"
                >
                  <span className="text-xs font-mono font-bold text-gray-200 group-hover:text-cyan-300 truncate">
                    {target.name}
                  </span>
                  <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-cyan-400">
                    <span>Click to Learn</span>
                    <Plus size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Mappings Table */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono uppercase text-gray-400 font-bold mb-2">
              <span>Active Hardware CC Mappings ({state.midiMappings.length})</span>
              {state.midiMappings.length > 0 && (
                <button
                  onClick={() => store.clearMidiMappings()}
                  className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-1"
                >
                  <Trash2 size={11} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="rounded-lg border border-[#2b2e3e] overflow-hidden bg-[#13151e]">
              {state.midiMappings.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-gray-500">
                  No MIDI CC mappings configured yet. Click any quick target above to bind hardware controls!
                </div>
              ) : (
                <div className="divide-y divide-[#232635]">
                  {state.midiMappings.map((m) => (
                    <div
                      key={m.id}
                      className="px-3.5 py-2.5 flex items-center justify-between hover:bg-[#191c28] transition-colors text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          CC #{m.ccNumber}
                        </span>
                        <div>
                          <div className="font-bold text-gray-200">{m.name}</div>
                          <div className="text-[10px] text-gray-500">
                            Range: {m.min} to {m.max} {m.channel ? `(Ch: ${m.channel})` : '(Omni)'}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => store.removeMidiMapping(m.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                        title="Remove Mapping"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#141620] border-t border-[#2b2e3d] flex items-center justify-between">
          <span className="text-[11px] font-mono text-gray-500">
            Mappings automatically save to your project state.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#2b2e3d] hover:bg-[#383d50] text-xs font-mono font-bold text-white transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
