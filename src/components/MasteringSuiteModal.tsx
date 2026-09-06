import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  Power,
  Sparkles,
  Volume2,
  Gauge,
  Radio,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { MasteringSuite } from '../audio/MasteringSuite';
import { LufsMeterResult } from '../types/daw';

interface MasteringSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOUDNESS_PRESETS = [
  { label: 'Spotify / Apple (-14 LUFS)', lufs: -14, ceiling: -0.5, desc: 'Optimized for streaming normalization' },
  { label: 'Club / Banger (-9 LUFS)', lufs: -9, ceiling: -0.2, desc: 'Maximum punch and high commercial volume' },
  { label: 'Trap / Drill (-7 LUFS)', lufs: -7, ceiling: -0.1, desc: 'Aggressive clipped sub-bass loudness' },
  { label: 'Acoustic / Jazz (-18 LUFS)', lufs: -18, ceiling: -1.0, desc: 'Full dynamic range with zero squash' },
];

export const MasteringSuiteModal: React.FC<MasteringSuiteModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();
  const mastering = MasteringSuite.getInstance();

  const [metrics, setMetrics] = useState<LufsMeterResult>({
    momentaryLufs: -70,
    shortTermLufs: -70,
    integratedLufs: -70,
    truePeakDb: -70,
    gainReductionDb: 0,
  });

  const params = state.masteringParams;

  // Poll metrics at 20fps when open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setMetrics(mastering.getMetrics());
    }, 50);
    return () => clearInterval(timer);
  }, [isOpen, mastering]);

  if (!isOpen) return null;

  const lufsToPercent = (lufs: number) => {
    // -60 LUFS = 0%, 0 LUFS = 100%
    return Math.max(0, Math.min(100, ((lufs + 60) / 60) * 100));
  };

  const truePeakColor =
    metrics.truePeakDb > 0
      ? 'text-red-500'
      : metrics.truePeakDb > -1
      ? 'text-yellow-400'
      : 'text-emerald-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#161822] border border-[#363a4e] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1f2232] border-b border-[#2d3246]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Eve Maximizer & Mastering Suite</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold border border-teal-500/40">
                  BS.1770-4 LUFS
                </span>
              </div>
              <p className="text-xs text-gray-400">Radio-Ready Loudness, True-Peak Limiter & Mid-Side Stereo Imager</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => store.updateMasteringParams({ enabled: !params.enabled })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                params.enabled
                  ? 'bg-teal-500 text-black shadow-lg shadow-teal-500/30'
                  : 'bg-[#282c3c] text-gray-400 hover:text-white'
              }`}
            >
              <Power size={14} />
              <span>{params.enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#282c3c] text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Top: Digital Hardware LUFS Meter Display */}
          <div className="bg-[#10111a] border border-[#272b3c] rounded-xl p-5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-300">
                <Gauge size={16} className="text-teal-400" />
                <span>REAL-TIME LOUDNESS RADAR</span>
              </div>
              <button
                onClick={() => mastering.resetIntegratedMeter()}
                title="Reset Program LUFS measurement"
                className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-white"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>

            {/* Meter LED Bars */}
            <div className="grid grid-cols-3 gap-4 font-mono">
              {/* Momentary */}
              <div className="bg-[#181a26] p-3 rounded-lg border border-[#252838]">
                <div className="text-[10px] text-gray-400 mb-1">MOMENTARY (400ms)</div>
                <div className="text-xl font-bold text-teal-400">
                  {metrics.momentaryLufs > -65 ? `${metrics.momentaryLufs.toFixed(1)} LUFS` : '-INF'}
                </div>
                <div className="w-full h-2 bg-[#0c0d14] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-75"
                    style={{ width: `${lufsToPercent(metrics.momentaryLufs)}%` }}
                  />
                </div>
              </div>

              {/* Short-Term */}
              <div className="bg-[#181a26] p-3 rounded-lg border border-[#252838]">
                <div className="text-[10px] text-gray-400 mb-1">SHORT-TERM (3s)</div>
                <div className="text-xl font-bold text-sky-400">
                  {metrics.shortTermLufs > -65 ? `${metrics.shortTermLufs.toFixed(1)} LUFS` : '-INF'}
                </div>
                <div className="w-full h-2 bg-[#0c0d14] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all duration-75"
                    style={{ width: `${lufsToPercent(metrics.shortTermLufs)}%` }}
                  />
                </div>
              </div>

              {/* Integrated Program */}
              <div className="bg-[#181a26] p-3 rounded-lg border border-[#252838]">
                <div className="text-[10px] text-gray-400 mb-1">INTEGRATED (PROGRAM)</div>
                <div className="text-xl font-bold text-purple-400">
                  {metrics.integratedLufs > -65 ? `${metrics.integratedLufs.toFixed(1)} LUFS` : '-INF'}
                </div>
                <div className="w-full h-2 bg-[#0c0d14] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
                    style={{ width: `${lufsToPercent(metrics.integratedLufs)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* True Peak & Limiter Reduction readout */}
            <div className="mt-3 pt-3 border-t border-[#222536] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">True Peak:</span>
                <span className={`font-bold ${truePeakColor}`}>
                  {metrics.truePeakDb > -65 ? `${metrics.truePeakDb.toFixed(2)} dBFS` : '-INF'}
                </span>
                {metrics.truePeakDb > 0 && (
                  <span className="text-[9px] px-1 bg-red-600/30 text-red-400 border border-red-500/50 rounded font-bold animate-pulse">
                    CLIP
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Gain Reduction:</span>
                <span className="font-bold text-amber-400">
                  {metrics.gainReductionDb > 0.05 ? `-${metrics.gainReductionDb.toFixed(1)} dB` : '0.0 dB'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Target Presets */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-gray-400 font-bold uppercase">Commercial Target Presets:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOUDNESS_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    store.updateMasteringParams({
                      targetLufs: p.lufs,
                      ceilingDb: p.ceiling,
                    });
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    params.targetLufs === p.lufs
                      ? 'bg-teal-500/20 border-teal-500/50 text-white shadow-sm'
                      : 'bg-[#181a24] border-[#292c3a] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="text-xs font-bold font-mono text-teal-300">{p.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Limiter & Input Drive */}
            <div className="bg-[#181a26] p-4 rounded-xl border border-[#2b2f42] space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-400">
                <Volume2 size={15} />
                <span>LIMITER & GAIN DRIVE</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Master Input Gain:</span>
                  <span className="text-teal-400 font-bold">{params.inputGainDb > 0 ? `+${params.inputGainDb}` : params.inputGainDb} dB</span>
                </div>
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={params.inputGainDb}
                  onChange={(e) => store.updateMasteringParams({ inputGainDb: Number(e.target.value) })}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">True Peak Ceiling:</span>
                  <span className="text-teal-400 font-bold">{params.ceilingDb} dBFS</span>
                </div>
                <input
                  type="range"
                  min={-2.0}
                  max={-0.1}
                  step={0.1}
                  value={params.ceilingDb}
                  onChange={(e) => store.updateMasteringParams({ ceilingDb: Number(e.target.value) })}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Soft Clip Warmth:</span>
                  <span className="text-teal-400 font-bold">{params.softClipWarmth}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.softClipWarmth}
                  onChange={(e) => store.updateMasteringParams({ softClipWarmth: Number(e.target.value) })}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Right: Stereo Imager & Sub Mono */}
            <div className="bg-[#181a26] p-4 rounded-xl border border-[#2b2f42] space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400">
                <Radio size={15} />
                <span>STEREO IMAGER & SUB PURITY</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Stereo Width:</span>
                  <span className="text-sky-400 font-bold">{(params.stereoWidth * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2.0}
                  step={0.05}
                  value={params.stereoWidth}
                  onChange={(e) => store.updateMasteringParams({ stereoWidth: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#11131c] rounded-lg border border-[#232635] flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-gray-200">Mono Sub Bass (&lt;120Hz)</div>
                  <div className="text-[10px] text-gray-400">Prevents phase cancellation on club sound systems</div>
                </div>
                <button
                  onClick={() => store.updateMasteringParams({ monoSubEnabled: !params.monoSubEnabled })}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    params.monoSubEnabled
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-[#232636] text-gray-400 hover:text-white'
                  }`}
                >
                  {params.monoSubEnabled ? 'MONO ON' : 'OFF'}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400">Limiter Release:</span>
                  <span className="text-sky-400 font-bold">{params.limiterReleaseMs} ms</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={10}
                  value={params.limiterReleaseMs}
                  onChange={(e) => store.updateMasteringParams({ limiterReleaseMs: Number(e.target.value) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
