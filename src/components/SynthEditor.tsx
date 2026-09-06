import React from 'react';
import {
  Cpu,
  Waves,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { SYNTH_PRESETS } from '../audio/Presets';
import { SynthParameters } from '../types/daw';

export const SynthEditor: React.FC = () => {
  const [state, store] = useDawStore();
  const params = state.synthParams;

  const updateParams = (updates: Partial<SynthParameters>) => {
    store.setSynthParams({ ...params, ...updates });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#14151b] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      {/* Synth Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1d25] border-b border-[#2a2d38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-pink-400">
            <Cpu size={16} />
            <span>EveSynth (Analog Dual-Oscillator Workstation)</span>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-1 bg-[#121316] px-2 py-1 rounded border border-[#353945]">
            <span className="text-[10px] text-gray-400 uppercase font-mono">PRESET:</span>
            <select
              value={state.selectedPresetId}
              onChange={(e) => store.loadPreset(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-pink-400 focus:outline-none cursor-pointer"
            >
              {Object.entries(SYNTH_PRESETS).map(([id, p]) => (
                <option key={id} value={id} className="bg-[#181a1f] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
          <div className="flex items-center gap-1.5">
            <span>GLIDE:</span>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={params.glide}
              onChange={(e) => updateParams({ glide: parseFloat(e.target.value) })}
              className="w-16 h-1.5 bg-[#2b2e3c] accent-pink-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1">
            <span>POLYPHONY:</span>
            <button
              onClick={() => updateParams({ polyphony: params.polyphony === 1 ? 8 : 1 })}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                params.polyphony === 1 ? 'bg-orange-500 text-white' : 'bg-pink-500 text-white'
              }`}
            >
              {params.polyphony === 1 ? 'MONO (LEAD/BASS)' : 'POLY (8 VOICES)'}
            </button>
          </div>
        </div>
      </div>

      {/* Synth Controls Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#111217]">
        {/* OSCILLATOR 1 */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center gap-1.5 pb-2 border-b border-[#292c3a] text-xs font-bold text-pink-400 mb-3">
            <Waves size={14} />
            <span>OSCILLATOR 1</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-gray-400 block mb-1">Waveform:</span>
              <div className="grid grid-cols-4 gap-1">
                {(['sawtooth', 'square', 'triangle', 'sine'] as const).map((wave) => (
                  <button
                    key={wave}
                    onClick={() => updateParams({ osc1Waveform: wave })}
                    className={`py-1 text-[10px] uppercase font-bold rounded ${
                      params.osc1Waveform === wave ? 'bg-pink-500 text-white' : 'bg-[#242735] text-gray-400'
                    }`}
                  >
                    {wave.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Octave: {params.osc1Octave}</span>
              <div className="flex gap-1">
                {[-2, -1, 0, 1, 2].map((oct) => (
                  <button
                    key={oct}
                    onClick={() => updateParams({ osc1Octave: oct })}
                    className={`w-6 h-5 rounded text-[10px] ${
                      params.osc1Octave === oct ? 'bg-pink-500 text-white font-bold' : 'bg-[#242735] text-gray-400'
                    }`}
                  >
                    {oct}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Detune</span>
                <span>{params.osc1Detune} cents</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={params.osc1Detune}
                onChange={(e) => updateParams({ osc1Detune: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-pink-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Volume</span>
                <span>{Math.round(params.osc1Volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.osc1Volume}
                onChange={(e) => updateParams({ osc1Volume: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-pink-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* OSCILLATOR 2 & SUB */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center gap-1.5 pb-2 border-b border-[#292c3a] text-xs font-bold text-pink-400 mb-3">
            <Waves size={14} />
            <span>OSCILLATOR 2 & SUB</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-gray-400 block mb-1">Waveform:</span>
              <div className="grid grid-cols-5 gap-1">
                {(['sawtooth', 'square', 'triangle', 'sine', 'noise'] as const).map((wave) => (
                  <button
                    key={wave}
                    onClick={() => updateParams({ osc2Waveform: wave })}
                    className={`py-1 text-[9px] uppercase font-bold rounded ${
                      params.osc2Waveform === wave ? 'bg-pink-500 text-white' : 'bg-[#242735] text-gray-400'
                    }`}
                  >
                    {wave.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Octave: {params.osc2Octave}</span>
              <div className="flex gap-1">
                {[-2, -1, 0, 1, 2].map((oct) => (
                  <button
                    key={oct}
                    onClick={() => updateParams({ osc2Octave: oct })}
                    className={`w-6 h-5 rounded text-[10px] ${
                      params.osc2Octave === oct ? 'bg-pink-500 text-white font-bold' : 'bg-[#242735] text-gray-400'
                    }`}
                  >
                    {oct}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Detune</span>
                <span>{params.osc2Detune} cents</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={params.osc2Detune}
                onChange={(e) => updateParams({ osc2Detune: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-pink-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Sub Oscillator</span>
                <span>{Math.round(params.subOscVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.subOscVolume}
                onChange={(e) => updateParams({ subOscVolume: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 24dB RESONANT FILTER */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center gap-1.5 pb-2 border-b border-[#292c3a] text-xs font-bold text-sky-400 mb-3">
            <Sliders size={14} />
            <span>RESONANT FILTER</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <span className="text-gray-400 block mb-1">Filter Type:</span>
              <div className="grid grid-cols-3 gap-1">
                {(['lowpass', 'highpass', 'bandpass'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateParams({ filterType: type })}
                    className={`py-1 text-[10px] uppercase font-bold rounded ${
                      params.filterType === type ? 'bg-sky-500 text-white' : 'bg-[#242735] text-gray-400'
                    }`}
                  >
                    {type.replace('pass', '')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Cutoff Frequency</span>
                <span>{Math.round(params.filterCutoff)} Hz</span>
              </div>
              <input
                type="range"
                min="50"
                max="16000"
                step="50"
                value={params.filterCutoff}
                onChange={(e) => updateParams({ filterCutoff: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Resonance (Q)</span>
                <span>{params.filterResonance.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="18"
                step="0.5"
                value={params.filterResonance}
                onChange={(e) => updateParams({ filterResonance: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Envelope Amount</span>
                <span>{params.filterEnvAmount} Hz</span>
              </div>
              <input
                type="range"
                min="-6000"
                max="8000"
                step="100"
                value={params.filterEnvAmount}
                onChange={(e) => updateParams({ filterEnvAmount: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-sky-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* AMPLITUDE ENVELOPE (ADSR) */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center gap-1.5 pb-2 border-b border-[#292c3a] text-xs font-bold text-emerald-400 mb-3">
            <Zap size={14} />
            <span>AMP ENVELOPE (ADSR)</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <div className="flex justify-between text-gray-400">
                <span>Attack</span>
                <span>{params.ampAttack.toFixed(3)}s</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="1.5"
                step="0.01"
                value={params.ampAttack}
                onChange={(e) => updateParams({ ampAttack: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Decay</span>
                <span>{params.ampDecay.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="2.0"
                step="0.02"
                value={params.ampDecay}
                onChange={(e) => updateParams({ ampDecay: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Sustain</span>
                <span>{Math.round(params.ampSustain * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={params.ampSustain}
                onChange={(e) => updateParams({ ampSustain: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-gray-400">
                <span>Release</span>
                <span>{params.ampRelease.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="3.0"
                step="0.05"
                value={params.ampRelease}
                onChange={(e) => updateParams({ ampRelease: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
