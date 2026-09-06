import React, { useEffect, useState, useRef } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  Zap,
  CheckCircle2,
  RefreshCw,
  Activity,
  Sliders,
  Sparkles,
  Waves,
  ShieldAlert,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { MixingDoctor, ChannelSpectrumEnergy } from '../audio/MixingDoctor';
import { AudioEngine } from '../audio/AudioEngine';

export const MixingDoctorView: React.FC = () => {
  const [state, store] = useDawStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [energies, setEnergies] = useState<ChannelSpectrumEnergy[]>([]);
  const [activeFixMsg, setActiveFixMsg] = useState<string | null>(null);

  // Real-time animation loop scanning frequency collisions
  useEffect(() => {
    let animId: number;
    const audioEngine = AudioEngine.getInstance();
    const doctor = MixingDoctor.getInstance();

    const loop = () => {
      const diag = doctor.diagnoseMix(audioEngine.mixer, state.mixerChannels);
      setEnergies(diag.energies);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state.mixerChannels]);

  // Draw multi-channel spectral collision radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#0f1116';
    ctx.fillRect(0, 0, width, height);

    // Bands: Sub (0-20%), Mud (20-40%), LowMid (40-60%), Presence (60-80%), Air (80-100%)
    const bandLabels = ['SUB (20-80Hz)', 'MUD (80-300Hz)', 'LOW-MID (300-1.5k)', 'PRESENCE (1.5-6k)', 'AIR (6-20k)'];
    const bandWidth = width / 5;

    // Draw background bands & labels
    bandLabels.forEach((label, idx) => {
      const x = idx * bandWidth;
      // Alternate subtle striping
      ctx.fillStyle = idx % 2 === 0 ? '#141720' : '#11131a';
      ctx.fillRect(x, 0, bandWidth, height);

      // Border
      ctx.strokeStyle = '#232734';
      ctx.strokeRect(x, 0, bandWidth, height);

      // Label
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(label, x + 8, 16);
    });

    // Draw energy bars for each channel
    const channelColors = [
      '#ffffff', // Master
      '#f97316', // Drums/Kick
      '#00d2ff', // Hats
      '#a855f7', // 808 Bass
      '#ec4899', // Synth
      '#22c55e', // Keys
      '#eab308', // Looper
      '#ef4444', // Guitar
      '#8b5cf6', // VST
    ];

    energies.forEach((chEnergy) => {
      const chIdx = chEnergy.channelIndex;
      const color = channelColors[chIdx] || '#38bdf8';
      const bands = [chEnergy.sub, chEnergy.mud, chEnergy.lowMid, chEnergy.presence, chEnergy.air];

      bands.forEach((val, bIdx) => {
        const x = bIdx * bandWidth + 10 + (chIdx * (bandWidth - 20)) / 9;
        const barW = Math.max(3, (bandWidth - 24) / 9);
        const norm = Math.min(1.0, val / 140);
        const barH = norm * (height - 35);
        const y = height - 10 - barH;

        ctx.fillStyle = `${color}cc`;
        ctx.fillRect(x, y, barW, barH);
      });
    });

    // Highlight Collision Alert Zones
    state.spectralAlerts.forEach((alert) => {
      if (alert.freqMin <= 80) {
        // Sub clash zone
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, bandWidth, height);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, bandWidth - 4, height - 4);
      } else if (alert.freqMin >= 180 && alert.freqMax <= 350) {
        // Mud clash zone
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.fillRect(bandWidth, 0, bandWidth, height);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(bandWidth + 2, 2, bandWidth - 4, height - 4);
      }
    });
  }, [energies, state.spectralAlerts]);

  const handleFix = (alertId: string, desc: string) => {
    store.autoFixCollision(alertId);
    setActiveFixMsg(`Applied Auto-Fix: ${desc}!`);
    setTimeout(() => setActiveFixMsg(null), 3500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111317] text-white select-none overflow-hidden border-t border-[#252834]">
      {/* Top AI Mixing Doctor Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#181a22] border-b border-[#2a2d38] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">Eve Mixing Doctor</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
                SPECTRAL COLLISION RADAR
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">Real-Time Acoustic Masking & Phase Clash Analyzer</p>
          </div>
        </div>

        {/* Status & Diagnostic trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#12141a] px-3 py-1 rounded-md border border-[#2d313e] text-xs font-mono">
            <Activity size={14} className="text-emerald-400 animate-pulse" />
            <span className="text-gray-400">STATUS:</span>
            <span className={state.spectralAlerts.length > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {state.spectralAlerts.length > 0 ? `${state.spectralAlerts.length} Conflicts Detected` : 'Acoustic Spectrum Balanced'}
            </span>
          </div>

          <button
            onClick={() => store.runDoctorDiagnostics()}
            className="px-3 py-1.5 rounded bg-[#252834] hover:bg-[#2f3342] text-xs font-mono font-bold text-gray-200 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={13} />
            <span>Scan Mix Now</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
        {/* Left Column: Spectral Radar Visualizer */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-300">
              <Waves size={14} className="text-teal-400" />
              <span>MULTI-TRACK REAL-TIME FREQUENCY DISTRIBUTION</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500">Master + 8 Channel Inserts</span>
          </div>

          {/* Canvas */}
          <div className="relative rounded-lg overflow-hidden border border-[#2d313f] shadow-inner bg-[#0f1116] flex-1">
            <canvas
              ref={canvasRef}
              width={700}
              height={260}
              className="w-full h-full block"
            />
          </div>

          {/* Channel Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono bg-[#161822] p-2 rounded border border-[#272b38]">
            {state.mixerChannels.map((ch, idx) => (
              <div key={ch.id} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                <span className="text-gray-300 font-medium">{ch.name}</span>
              </div>
            ))}
          </div>

          {activeFixMsg && (
            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 px-3 py-2 rounded text-xs font-mono font-bold animate-bounce">
              <CheckCircle2 size={15} />
              <span>{activeFixMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Active Collision Diagnostics & 1-Click Fix Actions */}
        <div className="w-full md:w-96 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
              <ShieldAlert size={14} />
              <span>CLINICAL DIAGNOSIS & 1-CLICK FIXES</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
              {state.spectralAlerts.length} Open
            </span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {state.spectralAlerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#2d313f] rounded-lg bg-[#141620]">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-sm font-bold font-mono text-emerald-400">Mix is Clean & Balanced</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  No severe frequency masking or sub-bass collisions detected across channels. Low end is punchy and headroom is intact!
                </p>
              </div>
            ) : (
              state.spectralAlerts.map((alert) => {
                const isCrit = alert.severity === 'critical';

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                      isCrit
                        ? 'bg-red-950/20 border-red-500/40 shadow-sm shadow-red-500/10'
                        : 'bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          isCrit ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {isCrit ? 'CRITICAL COLLISION' : 'ACOUSTIC MASKING'}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {alert.freqMin}Hz – {alert.freqMax}Hz
                      </span>
                    </div>

                    <div className="text-xs font-bold font-mono text-gray-200">
                      {alert.channelAName} ⚡ {alert.channelBName}
                    </div>

                    <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                      {alert.description}
                    </p>

                    <button
                      onClick={() => handleFix(alert.id, alert.suggestedAction)}
                      className={`mt-1 py-1.5 px-3 rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow transition-all ${
                        alert.suggestedAction === 'sidechain'
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white'
                          : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white'
                      }`}
                    >
                      <Zap size={13} />
                      <span>
                        {alert.suggestedAction === 'sidechain'
                          ? '1-Click Auto-Sidechain Ducking'
                          : alert.suggestedAction === 'notchEq'
                          ? '1-Click Carve 250Hz Notch EQ'
                          : '1-Click Highpass Filter (100Hz)'}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Sidechain Routes Status Panel */}
          <div className="bg-[#161822] p-3 rounded-lg border border-[#2a2d39] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-gray-300">
              <div className="flex items-center gap-1.5">
                <Sliders size={13} className="text-orange-400" />
                <span>ACTIVE SIDECHAIN DUCKING</span>
              </div>
              <span className="text-[10px] text-orange-400">{state.sidechainRoutes.length} Route(s)</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
              {state.sidechainRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-2 rounded bg-[#1c1e2b] border border-[#2b2e3e] text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-gray-200">{route.name}</div>
                    <div className="text-[10px] text-gray-400">
                      Depth: -{route.duckingDepthDb}dB | Mode: {route.mode} | Rel: {route.releaseMs}ms
                    </div>
                  </div>
                  <button
                    onClick={() => store.updateSidechainRoute(route.id, { enabled: !route.enabled })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      route.enabled ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {route.enabled ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
