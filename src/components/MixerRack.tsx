import React, { useEffect, useState } from 'react';
import { Sliders, Volume2, Activity, Zap, Stethoscope, Radio } from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { AudioEngine } from '../audio/AudioEngine';

export const MixerRack: React.FC = () => {
  const [state, store] = useDawStore();
  const [peaks, setPeaks] = useState<number[]>(new Array(9).fill(0));

  // Poll peak meters with requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const engine = AudioEngine.getInstance();

    const updateMeters = () => {
      const currentPeaks = engine.mixer.getAllPeaks();
      setPeaks(currentPeaks);
      animId = requestAnimationFrame(updateMeters);
    };

    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#14151b] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      {/* Mixer Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1d25] border-b border-[#2a2d38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-400">
            <Sliders size={16} />
            <span>Mixer Console</span>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Selected: <strong className="text-white">{state.mixerChannels[state.selectedMixerChannelIndex]?.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => store.setActiveView('mixingDoctor')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-semibold transition-all"
          >
            <Stethoscope size={13} />
            <span>Mixing Doctor</span>
          </button>
          <button
            onClick={() => store.setActiveView('midiLearn')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold transition-all"
          >
            <Radio size={13} />
            <span>MIDI Learn</span>
          </button>
          <button
            onClick={() => store.setActiveView('fxRack')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-semibold transition-all"
          >
            <Activity size={13} />
            <span>Open FX Rack</span>
          </button>
        </div>
      </div>

      {/* Mixer Channels Strips */}
      <div className="flex-1 flex overflow-x-auto p-4 gap-2 bg-[#121318]">
        {state.mixerChannels.map((channel, idx) => {
          const isSelected = state.selectedMixerChannelIndex === idx;
          const peakVal = peaks[idx] || 0;
          const peakPct = Math.min(100, Math.round(peakVal * 100));

          return (
            <div
              key={channel.id}
              onClick={() => store.setSelectedMixerChannel(idx)}
              className={`w-28 flex flex-col items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#222530] border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#181a22] border-[#292c38] hover:bg-[#1e202a]'
              } ${idx === 0 ? 'ring-1 ring-orange-500/40' : ''}`}
            >
              {/* Channel Header */}
              <div className="w-full text-center pb-1 border-b border-[#2b2e3c]">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color }} />
                  <span className="text-[11px] font-bold text-gray-200 truncate">
                    {idx === 0 ? 'MASTER' : channel.name}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[9px] font-mono text-gray-400">
                    {idx === 0 ? 'MAIN BUS' : `INSERT ${idx}`}
                  </span>
                  {state.sidechainRoutes.some((r) => r.enabled && (r.sourceChannelIndex === idx || r.targetChannelIndex === idx)) && (
                    <span className="text-[8px] font-mono font-bold px-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      ⚡SC
                    </span>
                  )}
                </div>
              </div>

              {/* Stereo Panning Slider */}
              <div className="w-full my-2 flex flex-col items-center">
                <span className="text-[9px] font-mono text-gray-400">PAN</span>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.05"
                  value={channel.pan}
                  onChange={(e) => {
                    store.updateMixerChannel(idx, { pan: parseFloat(e.target.value) });
                  }}
                  className="w-16 h-1 bg-[#282b37] accent-emerald-400 rounded cursor-pointer"
                />
              </div>

              {/* Fader & LED Peak Meter Bar */}
              <div className="flex-1 flex items-center justify-center gap-2.5 my-2 w-full">
                {/* Vertical Fader */}
                <div className="h-44 flex flex-col items-center justify-center">
                  <input
                    type="range"
                    min="0"
                    max="1.25"
                    step="0.02"
                    value={channel.volume}
                    onChange={(e) => {
                      store.updateMixerChannel(idx, { volume: parseFloat(e.target.value) });
                    }}
                    className="w-40 h-2 bg-[#282b37] accent-emerald-500 rounded cursor-pointer transform -rotate-90 origin-center"
                  />
                </div>

                {/* LED Peak Level Ladder */}
                <div className="w-3.5 h-44 bg-[#0d0e12] rounded border border-[#262833] p-0.5 flex flex-col-reverse relative overflow-hidden">
                  <div
                    className={`w-full rounded-xs transition-all duration-75 ${
                      peakPct > 90
                        ? 'bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500'
                        : peakPct > 65
                        ? 'bg-gradient-to-t from-emerald-500 to-yellow-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ height: `${peakPct}%` }}
                  />
                  {peakPct >= 95 && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 animate-pulse" />
                  )}
                </div>
              </div>

              {/* dB Readout */}
              <div className="text-[10px] font-mono font-bold text-gray-300">
                {channel.volume === 0 ? '-INF dB' : `${(Math.log10(channel.volume) * 20).toFixed(1)} dB`}
              </div>

              {/* Mute & Solo Buttons */}
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#2b2e3c] w-full justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    store.updateMixerChannel(idx, { mute: !channel.mute });
                  }}
                  className={`w-6 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                    channel.mute ? 'bg-red-500 text-white shadow-xs' : 'bg-[#252834] text-gray-400 hover:text-white'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    store.updateMixerChannel(idx, { solo: !channel.solo });
                  }}
                  className={`w-6 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                    channel.solo ? 'bg-orange-500 text-white shadow-xs' : 'bg-[#252834] text-gray-400 hover:text-white'
                  }`}
                >
                  S
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
