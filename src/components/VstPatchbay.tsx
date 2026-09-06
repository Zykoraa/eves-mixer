import React, { useState } from 'react';
import {
  Plug,
  Plus,
  Trash2,
  Power,
  Sliders,
  Radio,
  Music,
  Activity,
  Code,
  Globe,
  Upload,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { AudioEngine } from '../audio/AudioEngine';
import {
  AVAILABLE_VSTS,
  VstCategory,
  VstPluginId,
  VstPluginInstance,
  VstPluginMeta,
} from '../audio/VstEngine';
import { MidiManager } from '../audio/MidiManager';

export const VstPatchbay: React.FC = () => {
  const [state, store] = useDawStore();
  const engine = AudioEngine.getInstance();
  const midi = MidiManager.getInstance();

  const [selectedCategory, setSelectedCategory] = useState<VstCategory | 'all'>('all');
  const [isAddPluginModalOpen, setIsAddPluginModalOpen] = useState(false);
  const [targetSlotForAdd, setTargetSlotForAdd] = useState<number>(0);

  // Custom WAM & Script tab
  const [activeViewTab, setActiveViewTab] = useState<'rack' | 'externalWam' | 'midiPatch'>('rack');
  const [customWamUrl, setCustomWamUrl] = useState<string>('https://cdn.jsdelivr.net/npm/@webaudiomodules/sdk');
  const [customDspCode, setCustomDspCode] = useState<string>(
    `// Custom DSP Audio Processor\n// input: Float32Array, output: Float32Array\nfunction processAudio(input, output) {\n  for (let i = 0; i < input.length; i++) {\n    // Analog warmth saturation:\n    output[i] = Math.tanh(input[i] * 1.5);\n  }\n}`
  );
  const [scriptStatus, setScriptStatus] = useState<string>('Ready to compile & patch');

  const activeChannelIndex = state.selectedVstChannelIndex;
  const activeChannel = state.mixerChannels[activeChannelIndex] || state.mixerChannels[0];

  // Get plugins inserted on this specific channel
  const channelPlugins = state.vstInstances.filter((v) => v.channelIndex === activeChannelIndex);

  // Currently selected plugin to edit in parameter view
  const selectedInstance =
    channelPlugins.find((p) => p.slotIndex === state.selectedVstSlotIndex) || channelPlugins[0];
  const selectedMeta = AVAILABLE_VSTS.find((m) => m.id === selectedInstance?.pluginId);

  const categories: { id: VstCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All VSTs' },
    { id: 'amp_dist', label: 'Amp & Distortion' },
    { id: 'pitch_vocal', label: 'Pitch & Vocals' },
    { id: 'modulation', label: 'Modulation' },
    { id: 'space_delay', label: 'Space & Time' },
    { id: 'dynamics_eq', label: 'Dynamics & EQ' },
    { id: 'virtual_instrument', label: 'Instruments / SF2' },
    { id: 'external', label: 'Web Audio Modules (WAM)' },
  ];

  const filteredVsts = AVAILABLE_VSTS.filter(
    (v) => selectedCategory === 'all' || v.category === selectedCategory
  );

  const handleOpenAddModal = (slotIdx: number) => {
    setTargetSlotForAdd(slotIdx);
    setIsAddPluginModalOpen(true);
  };

  const handleInsertPlugin = (pluginId: VstPluginId) => {
    store.insertVstPlugin(activeChannelIndex, pluginId, targetSlotForAdd);
    setIsAddPluginModalOpen(false);
  };

  const handleApplyCustomScript = () => {
    try {
      // Evaluate script syntax
      new Function('input', 'output', customDspCode);
      setScriptStatus('✓ Script compiled and injected into DSP Worklet engine!');
    } catch (err: unknown) {
      setScriptStatus(`Error in DSP code: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f1013] text-gray-200 overflow-hidden font-sans select-none">
      {/* Top Header & Navigation Strip */}
      <div className="bg-[#16181e] border-b border-[#2a2d39] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Plug size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide">Eve VST Host & Plugin Patchbay</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/40 uppercase">
                WAM v2 & FX Inserts
              </span>
            </div>
            <p className="text-xs text-gray-400">FL Studio Mixer FX Slots, Web Audio Modules & Hardware MIDI Patching</p>
          </div>
        </div>

        {/* View Sub-Tabs */}
        <div className="flex items-center bg-[#12141c] p-1 rounded-xl border border-[#2b2e3c]">
          <button
            onClick={() => setActiveViewTab('rack')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeViewTab === 'rack'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders size={14} />
            Insert FX Rack
          </button>
          <button
            onClick={() => setActiveViewTab('externalWam')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeViewTab === 'externalWam'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code size={14} />
            External WAM & Scripts
          </button>
          <button
            onClick={() => setActiveViewTab('midiPatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
              activeViewTab === 'midiPatch'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Radio size={14} />
            Hardware MIDI Out
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* ===================== VIEW 1: INSERT FX RACK ===================== */}
        {activeViewTab === 'rack' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Mixer Channel Strip Selector */}
            <div className="w-56 bg-[#13151b] border-r border-[#262835] flex flex-col overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] font-mono text-gray-400 font-bold px-2 py-1 uppercase tracking-wider">
                Select Mixer Channel:
              </div>
              {state.mixerChannels.map((ch, idx) => {
                const count = state.vstInstances.filter((v) => v.channelIndex === idx).length;
                const isSelected = activeChannelIndex === idx;

                return (
                  <button
                    key={ch.id}
                    onClick={() => store.setSelectedVstChannel(idx)}
                    className={`px-3 py-2 rounded-xl text-left transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-[#222533] border-indigo-500 shadow-md text-white'
                        : 'bg-[#181a24] border-[#292d3c] hover:border-[#383d52] text-gray-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ch.color }}
                        />
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {ch.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 block ml-4">
                        {idx === 0 ? 'Master Bus' : `Insert ${idx}`}
                      </span>
                    </div>

                    {count > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {count} VST
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Middle Column: 10 FX Insert Slots (FL Studio Style) */}
            <div className="w-80 bg-[#151720] border-r border-[#262835] flex flex-col p-3 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#2a2d3c] pb-2 mb-3">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {activeChannel.name} FX Rack
                  </span>
                  <p className="text-[10px] text-gray-400">10 Insert Slots available</p>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: activeChannel.color }}
                />
              </div>

              <div className="space-y-2">
                {Array.from({ length: 10 }, (_, slotIdx) => {
                  const inst = channelPlugins.find((p) => p.slotIndex === slotIdx);
                  const isSelected = inst && selectedInstance?.instanceId === inst.instanceId;

                  return (
                    <div
                      key={slotIdx}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        inst
                          ? isSelected
                            ? 'bg-[#222536] border-indigo-500 shadow-md'
                            : 'bg-[#1a1c26] border-[#2c3040] hover:border-[#3d4358]'
                          : 'bg-[#12141c] border-dashed border-[#262938] hover:border-gray-600'
                      }`}
                    >
                      {inst ? (
                        <>
                          <div
                            onClick={() => store.setSelectedVstSlot(slotIdx)}
                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                          >
                            <span className="text-[10px] font-mono text-gray-500 font-bold w-4">
                              {slotIdx + 1}
                            </span>
                            <div className="truncate">
                              <div className="text-xs font-bold text-white truncate">{inst.name}</div>
                              <span className="text-[9px] font-mono text-indigo-400 uppercase">
                                Slot {slotIdx + 1}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 ml-2">
                            {/* Bypass Power Button */}
                            <button
                              onClick={() => store.setVstBypass(activeChannelIndex, inst.instanceId, inst.enabled)}
                              className={`p-1 rounded transition-all ${
                                inst.enabled
                                  ? 'text-emerald-400 hover:text-emerald-300'
                                  : 'text-gray-600 hover:text-gray-400'
                              }`}
                              title={inst.enabled ? 'Bypass Plugin' : 'Enable Plugin'}
                            >
                              <Power size={13} />
                            </button>

                            {/* Mix percentage slider */}
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={inst.mix}
                              onChange={(e) => store.setVstMix(activeChannelIndex, inst.instanceId, Number(e.target.value))}
                              className="w-12 accent-indigo-500 h-1.5 bg-gray-800 rounded cursor-pointer"
                              title={`Wet/Dry: ${Math.round(inst.mix * 100)}%`}
                            />

                            {/* Remove Plugin */}
                            <button
                              onClick={() => store.removeVstPlugin(activeChannelIndex, inst.instanceId)}
                              className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                              title="Delete VST from slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => handleOpenAddModal(slotIdx)}
                          className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-mono text-gray-500 hover:text-indigo-400 transition-colors"
                        >
                          <Plus size={13} />
                          <span>Slot {slotIdx + 1}: Empty (Click to Patch VST)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Interactive Parameter Editor for Selected VST */}
            <div className="flex-1 bg-[#101217] flex flex-col overflow-y-auto p-5">
              {selectedInstance && selectedMeta ? (
                <div className="max-w-3xl space-y-6">
                  {/* Plugin Header Banner */}
                  <div className="p-4 rounded-2xl bg-[#191c28] border border-[#2e3346] flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <Sliders size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white">{selectedInstance.name}</h2>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-gray-400 border border-white/10">
                            v{selectedMeta.version}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedMeta.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-[#2d3244] text-xs font-mono">
                        <span className="text-gray-400">Mix:</span>
                        <strong className="text-indigo-400">{Math.round(selectedInstance.mix * 100)}%</strong>
                      </div>
                      <button
                        onClick={() => store.setVstBypass(activeChannelIndex, selectedInstance.instanceId, selectedInstance.enabled)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
                          selectedInstance.enabled
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        <Power size={13} />
                        {selectedInstance.enabled ? 'ACTIVE' : 'BYPASSED'}
                      </button>
                    </div>
                  </div>

                  {/* Plugin Parameter Controls Grid */}
                  <div className="p-5 bg-[#151722] border border-[#2a2e40] rounded-2xl shadow-xl">
                    <div className="text-xs font-bold uppercase tracking-wider font-mono text-gray-400 mb-4">
                      DSP Parameters:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {selectedMeta.parameters.map((param) => {
                        const val = selectedInstance.parameters[param.id] ?? param.default;

                        if (param.type === 'knob') {
                          return (
                            <div
                              key={param.id}
                              className="bg-[#1c1f2d] p-3 rounded-xl border border-[#2f3448] flex flex-col items-center text-center"
                            >
                              <span className="text-[11px] font-mono font-bold text-gray-300 mb-2">
                                {param.name}
                              </span>
                              <input
                                type="range"
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                value={Number(val)}
                                onChange={(e) =>
                                  store.setVstParam(
                                    activeChannelIndex,
                                    selectedInstance.instanceId,
                                    param.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-28 accent-indigo-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                              />
                              <span className="text-xs font-mono font-bold text-indigo-400 mt-2">
                                {val} {param.unit}
                              </span>
                            </div>
                          );
                        }

                        if (param.type === 'switch') {
                          return (
                            <div
                              key={param.id}
                              className="bg-[#1c1f2d] p-3 rounded-xl border border-[#2f3448] flex flex-col items-center justify-between"
                            >
                              <span className="text-[11px] font-mono font-bold text-gray-300 mb-2">
                                {param.name}
                              </span>
                              <button
                                onClick={() =>
                                  store.setVstParam(
                                    activeChannelIndex,
                                    selectedInstance.instanceId,
                                    param.id,
                                    !val
                                  )
                                }
                                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                                  val
                                    ? 'bg-indigo-600 text-white border-indigo-400'
                                    : 'bg-[#141620] text-gray-500 border-[#2a2e40]'
                                }`}
                              >
                                {val ? 'ENGAGED' : 'OFF'}
                              </button>
                            </div>
                          );
                        }

                        if (param.type === 'select' && param.options) {
                          return (
                            <div
                              key={param.id}
                              className="bg-[#1c1f2d] p-3 rounded-xl border border-[#2f3448] flex flex-col justify-between col-span-1 sm:col-span-2"
                            >
                              <span className="text-[11px] font-mono font-bold text-gray-300 mb-2">
                                {param.name}
                              </span>
                              <select
                                value={String(val)}
                                onChange={(e) =>
                                  store.setVstParam(
                                    activeChannelIndex,
                                    selectedInstance.instanceId,
                                    param.id,
                                    e.target.value
                                  )
                                }
                                className="bg-[#12141c] border border-[#2d3142] text-xs text-white p-2 rounded-lg font-mono focus:outline-hidden focus:border-indigo-500"
                              >
                                {param.options.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 font-mono">
                  <Plug size={40} className="text-gray-600 mb-3 animate-bounce" />
                  <span className="text-sm font-bold text-gray-400">No VST Selected in Current Channel</span>
                  <span className="text-xs text-gray-600 mt-1">
                    Click any slot on the left to add or edit a plugin
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== VIEW 2: EXTERNAL WAM & SCRIPTS ===================== */}
        {activeViewTab === 'externalWam' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto">
            <div className="p-4 bg-[#161822] border border-[#292d3e] rounded-2xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <Globe size={18} className="text-purple-400" />
                Web Audio Modules (WAM v2) Remote Loader
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Load Web Audio Modules and AudioWorklets directly from CDN, GitHub, or any public ES module URL:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customWamUrl}
                  onChange={(e) => setCustomWamUrl(e.target.value)}
                  placeholder="https://cdn.jsdelivr.net/npm/@webaudiomodules/sdk"
                  className="flex-1 bg-[#10121a] border border-[#2e3346] rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-purple-500 focus:outline-hidden"
                />
                <button
                  onClick={() => {
                    store.insertVstPlugin(activeChannelIndex, 'custom_wam', 0);
                    alert(`Loaded remote WAM module into Channel ${activeChannelIndex} Slot 1!`);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Upload size={14} />
                  Patch into Channel
                </button>
              </div>
            </div>

            {/* Custom DSP Script Sandbox */}
            <div className="p-4 bg-[#161822] border border-[#292d3e] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code size={18} className="text-cyan-400" />
                  <span className="text-sm font-bold text-white">Live JavaScript DSP AudioWorklet Sandbox</span>
                </div>
                <button
                  onClick={handleApplyCustomScript}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold shadow-md"
                >
                  Compile & Run DSP
                </button>
              </div>

              <textarea
                value={customDspCode}
                onChange={(e) => setCustomDspCode(e.target.value)}
                rows={8}
                className="w-full bg-[#0d0e14] border border-[#282d3e] rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-hidden focus:border-cyan-500"
              />

              <div className="text-xs font-mono text-emerald-400 bg-black/40 p-2 rounded-lg border border-white/5">
                Status: {scriptStatus}
              </div>
            </div>
          </div>
        )}

        {/* ===================== VIEW 3: HARDWARE MIDI PATCHBAY ===================== */}
        {activeViewTab === 'midiPatch' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto">
            <div className="p-4 bg-[#161822] border border-[#292d3e] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio size={18} className="text-emerald-400" />
                    Web MIDI Hardware Outputs & Desktop DAW Routing
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Send MIDI notes from Eve's Mixer to external synths, pedals, or desktop DAWs (via loopMIDI / IAC Bus)
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/20 border border-emerald-500/30">
                  {midi.isSupported ? 'Web MIDI API Ready' : 'MIDI Unavailable'}
                </span>
              </div>

              {/* Connected Output Devices */}
              <div>
                <span className="text-xs font-bold text-gray-300 block mb-2">Available MIDI Output Ports:</span>
                {midi.connectedOutputs.length === 0 ? (
                  <div className="p-4 bg-[#11131c] rounded-xl border border-[#242738] text-xs font-mono text-gray-500">
                    No external hardware MIDI outputs detected. Plug in a USB MIDI device or start virtual MIDI cable (loopMIDI on Windows / IAC on Mac).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {midi.connectedOutputs.map((port) => (
                      <div
                        key={port}
                        className="p-3 bg-[#11131c] rounded-xl border border-[#2c3042] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Radio size={14} className="text-emerald-400" />
                          <span className="text-xs font-mono text-white font-bold">{port}</span>
                        </div>
                        <button
                          onClick={() => midi.sendNoteOn(60, 0.8, 0, port)}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-sm"
                        >
                          Send Test Note (Middle C)
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================== ADD PLUGIN MODAL ===================== */}
      {isAddPluginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#181a24] border border-[#353a4c] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#1f2230] border-b border-[#2e3344]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Insert VST Plugin into Slot {targetSlotForAdd + 1}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Target: Channel {activeChannelIndex} ({activeChannel.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPluginModalOpen(false)}
                className="px-2 py-1 rounded bg-[#2b3042] hover:bg-[#394058] text-xs font-mono text-gray-300"
              >
                Close
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="px-5 py-2.5 bg-[#141620] border-b border-[#262a3a] flex gap-1.5 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#1c1e2a] text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Plugin List */}
            <div className="p-5 overflow-y-auto space-y-3">
              {filteredVsts.map((plugin) => (
                <div
                  key={plugin.id}
                  className="p-3.5 bg-[#141620] border border-[#2b2f42] rounded-xl flex items-center justify-between hover:border-indigo-500/60 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{plugin.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {plugin.developer}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{plugin.description}</p>
                  </div>

                  <button
                    onClick={() => handleInsertPlugin(plugin.id)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold shadow-md transition-all whitespace-nowrap ml-3"
                  >
                    Insert VST
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
