import React, { useRef, useEffect } from 'react';
import {
  Activity,
  Sliders,
  Power,
  Waves,
  Disc,
  Flame,
  VolumeX,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { FxSettings } from '../types/daw';

export const FxRack: React.FC = () => {
  const [state, store] = useDawStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentChannel = state.mixerChannels[state.selectedMixerChannelIndex] || state.mixerChannels[0];
  const fx: FxSettings = currentChannel.effects;

  const updateFx = (updates: Partial<FxSettings>) => {
    const updated = { ...fx, ...updates };
    store.updateMixerChannel(state.selectedMixerChannelIndex, { effects: updated });
  };

  // Render Visual Parametric EQ frequency curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw grid background
    ctx.strokeStyle = '#272a38';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Center line (0 dB)
    ctx.strokeStyle = '#383d50';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw EQ curve
    ctx.strokeStyle = fx.eqEnabled ? '#00d2ff' : '#4b5263';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let px = 0; px < width; px++) {
      // Logarithmic freq calculation: 20Hz to 20kHz
      const freq = 20 * Math.pow(1000, px / width);
      let totalGainDb = 0;

      if (fx.eqEnabled && fx.eqBands) {
        fx.eqBands.forEach((band) => {
          const diff = Math.log10(freq / band.frequency);
          const response = Math.exp(-Math.pow(diff * band.q * 1.5, 2));
          totalGainDb += band.gain * response;
        });
      }

      const y = height / 2 - (totalGainDb / 18) * (height / 2);
      if (px === 0) {
        ctx.moveTo(px, y);
      } else {
        ctx.lineTo(px, y);
      }
    }
    ctx.stroke();

    // Draw subtle gradient fill under curve
    if (fx.eqEnabled) {
      ctx.lineTo(width, height / 2);
      ctx.lineTo(0, height / 2);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(0, 210, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 210, 255, 0.0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }, [fx]);

  return (
    <div className="flex-1 flex flex-col bg-[#14151b] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      {/* FX Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1d25] border-b border-[#2a2d38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-cyan-400">
            <Activity size={16} />
            <span>Master & Channel FX Rack</span>
          </div>

          <div className="flex items-center gap-1 bg-[#121316] px-2 py-1 rounded border border-[#353945]">
            <span className="text-[10px] text-gray-400 uppercase font-mono">CHANNEL:</span>
            <select
              value={state.selectedMixerChannelIndex}
              onChange={(e) => store.setSelectedMixerChannel(parseInt(e.target.value))}
              className="bg-transparent text-xs font-mono font-bold text-cyan-400 focus:outline-none cursor-pointer"
            >
              {state.mixerChannels.map((ch, idx) => (
                <option key={ch.id} value={idx} className="bg-[#181a1f] text-white">
                  {idx === 0 ? 'Master' : `${idx}: ${ch.name}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-gray-400 font-mono">
          DSP: 7 Professional Studio Plugins
        </span>
      </div>

      {/* FX Rack Modules Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#111217]">
        {/* Module 1: Parametric EQ */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2d3c] mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-400">
              <Waves size={15} />
              <span>Parametric 5-Band Visual EQ</span>
            </div>
            <button
              onClick={() => updateFx({ eqEnabled: !fx.eqEnabled })}
              className={`p-1 rounded transition-all ${
                fx.eqEnabled ? 'bg-cyan-500 text-white' : 'bg-[#252834] text-gray-500 hover:text-white'
              }`}
            >
              <Power size={13} />
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={600}
            height={130}
            className="w-full h-32 bg-[#0e0f14] rounded border border-[#222532] mb-3"
          />

          <div className="grid grid-cols-5 gap-2">
            {fx.eqBands.map((band, idx) => (
              <div key={idx} className="flex flex-col items-center bg-[#13141b] p-2 rounded border border-[#222430]">
                <span className="text-[10px] font-mono text-gray-400 font-bold">
                  {band.frequency < 1000 ? `${band.frequency}Hz` : `${(band.frequency / 1000).toFixed(1)}k`}
                </span>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="0.5"
                  value={band.gain}
                  onChange={(e) => {
                    const newBands = [...fx.eqBands];
                    newBands[idx] = { ...band, gain: parseFloat(e.target.value) };
                    updateFx({ eqBands: newBands });
                  }}
                  className="w-16 h-1.5 bg-[#2a2d3a] accent-cyan-400 my-1 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-cyan-300">{band.gain > 0 ? `+${band.gain}` : band.gain} dB</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module 2: Studio Reverb */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2d3c] mb-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-purple-400">
              <Disc size={15} />
              <span>Studio Reverb</span>
            </div>
            <button
              onClick={() => updateFx({ reverbEnabled: !fx.reverbEnabled })}
              className={`p-1 rounded transition-all ${
                fx.reverbEnabled ? 'bg-purple-500 text-white' : 'bg-[#252834] text-gray-500 hover:text-white'
              }`}
            >
              <Power size={13} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Decay Time</span>
                <span>{fx.reverbDecay.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="8.0"
                step="0.2"
                value={fx.reverbDecay}
                onChange={(e) => updateFx({ reverbDecay: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Wet Mix</span>
                <span>{Math.round(fx.reverbMix * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={fx.reverbMix}
                onChange={(e) => updateFx({ reverbMix: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Module 3: Ping-Pong Delay */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2d3c] mb-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
              <Activity size={15} />
              <span>Ping-Pong Delay</span>
            </div>
            <button
              onClick={() => updateFx({ delayEnabled: !fx.delayEnabled })}
              className={`p-1 rounded transition-all ${
                fx.delayEnabled ? 'bg-sky-500 text-white' : 'bg-[#252834] text-gray-500 hover:text-white'
              }`}
            >
              <Power size={13} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Delay Time</span>
                <span>{fx.delayTime.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={fx.delayTime}
                onChange={(e) => updateFx({ delayTime: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Feedback</span>
                <span>{Math.round(fx.delayFeedback * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={fx.delayFeedback}
                onChange={(e) => updateFx({ delayFeedback: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Delay Wet Mix</span>
                <span>{Math.round(fx.delayMix * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={fx.delayMix}
                onChange={(e) => updateFx({ delayMix: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Module 4: Distortion / Saturation */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2d3c] mb-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-orange-400">
              <Flame size={15} />
              <span>Saturator & Overdrive</span>
            </div>
            <button
              onClick={() => updateFx({ distortionEnabled: !fx.distortionEnabled })}
              className={`p-1 rounded transition-all ${
                fx.distortionEnabled ? 'bg-orange-500 text-white' : 'bg-[#252834] text-gray-500 hover:text-white'
              }`}
            >
              <Power size={13} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Drive</span>
                <span>{Math.round(fx.distortionDrive * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={fx.distortionDrive}
                onChange={(e) => updateFx({ distortionDrive: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">Curve:</span>
              <div className="flex gap-1">
                {(['tube', 'soft', 'hard', 'fuzz'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateFx({ distortionType: type })}
                    className={`px-2 py-0.5 text-[10px] uppercase font-mono rounded ${
                      fx.distortionType === type ? 'bg-orange-500 text-white font-bold' : 'bg-[#232634] text-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Module 5: Dynamics Compressor */}
        <div className="bg-[#191b24] border border-[#2b2e3d] rounded-lg p-3 flex flex-col shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-[#2a2d3c] mb-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
              <Sliders size={15} />
              <span>Studio Compressor</span>
            </div>
            <button
              onClick={() => updateFx({ compressorEnabled: !fx.compressorEnabled })}
              className={`p-1 rounded transition-all ${
                fx.compressorEnabled ? 'bg-emerald-500 text-white' : 'bg-[#252834] text-gray-500 hover:text-white'
              }`}
            >
              <Power size={13} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Threshold</span>
                <span>{fx.compressorThreshold} dB</span>
              </div>
              <input
                type="range"
                min="-50"
                max="0"
                step="1"
                value={fx.compressorThreshold}
                onChange={(e) => updateFx({ compressorThreshold: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-400">
                <span>Ratio</span>
                <span>{fx.compressorRatio}:1</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="0.5"
                value={fx.compressorRatio}
                onChange={(e) => updateFx({ compressorRatio: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-[#2a2d3a] accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
