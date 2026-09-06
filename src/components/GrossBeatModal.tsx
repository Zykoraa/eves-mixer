import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  X,
  Power,
  RotateCcw,
  Zap,
  Volume2,
  Clock,
  Disc,
} from 'lucide-react';
import { GrossBeatEngine, GrossBeatTimePreset, GrossBeatVolPreset, SplinePoint } from '../audio/GrossBeatEngine';
import { useDawStore } from '../store/useDawStore';

interface GrossBeatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIME_PRESETS: { id: GrossBeatTimePreset; label: string; desc: string; color: string }[] = [
  { id: 'halfSpeed', label: '1/2 Speed (Half-Time)', desc: 'Iconic Drake / Metro Boomin pitch drop', color: 'bg-orange-500' },
  { id: 'doubleSpeed', label: '2x Speed', desc: 'Double tempo acceleration', color: 'bg-amber-500' },
  { id: 'reverse1Bar', label: 'Reverse 1 Bar', desc: 'Full bar backward sweep', color: 'bg-purple-500' },
  { id: 'reverse2Beats', label: 'Reverse 2 Beats', desc: '1/2 bar backward bounce', color: 'bg-indigo-500' },
  { id: 'vinylStop', label: 'Vinyl Stop', desc: 'Turntable motor stop curve', color: 'bg-red-500' },
  { id: 'stutter8th', label: 'Stutter 1/8', desc: 'Trance / Trap syncopated stutter', color: 'bg-cyan-500' },
  { id: 'stutter16th', label: 'Stutter 1/16', desc: 'Machine gun rapid roll', color: 'bg-sky-500' },
  { id: 'tripletGlitch', label: 'Triplet Glitch', desc: '3-over-4 drill time warp', color: 'bg-pink-500' },
  { id: 'scratchSpin', label: 'DJ Scratch', desc: 'Back-and-forth vinyl scrub', color: 'bg-emerald-500' },
  { id: 'custom', label: 'Custom Spline', desc: 'Click graph to draw envelope', color: 'bg-yellow-500' },
];

const VOL_PRESETS: { id: GrossBeatVolPreset; label: string; desc: string }[] = [
  { id: 'bypass', label: 'Vol: Normal', desc: 'Full audio level' },
  { id: 'sidechainPump', label: 'Vol: 4-Floor Pump', desc: 'Quarter-note ducking' },
  { id: 'tranceGate8th', label: 'Vol: 1/8 Trance Gate', desc: 'Rhythmic 1/8 chop' },
  { id: 'stutterGate16th', label: 'Vol: 1/16 Stutter', desc: 'Fast gate staccato' },
  { id: 'tripletGate', label: 'Vol: Triplet Gate', desc: 'Tri-beat rhythmic gate' },
];

export const GrossBeatModal: React.FC<GrossBeatModalProps> = ({ isOpen, onClose }) => {
  const [state] = useDawStore();
  const engine = GrossBeatEngine.getInstance();

  const [enabled, setEnabled] = useState(engine.enabled);
  const [timePreset, setTimePreset] = useState<GrossBeatTimePreset>(engine.timePreset);
  const [volPreset, setVolPreset] = useState<GrossBeatVolPreset>(engine.volPreset);
  const [mix, setMix] = useState(engine.mix);
  const [customPoints, setCustomPoints] = useState<SplinePoint[]>(engine.customTimePoints);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentPhaseRef = useRef<number>(0);

  // Sync BPM
  useEffect(() => {
    engine.setBpm(state.bpm);
  }, [state.bpm, engine]);

  // Subscribe to transport phase for smooth playhead rendering
  useEffect(() => {
    const unsub = engine.addPhaseListener((phase) => {
      currentPhaseRef.current = phase;
    });
    return () => {
      unsub();
    };
  }, [engine]);

  // Draw curve and playhead
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#101216';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (16 columns for 16th notes, 4 major beats)
    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * w;
      const isBeat = i % 4 === 0;
      ctx.strokeStyle = isBeat ? '#2c313d' : '#1c1f28';
      ctx.lineWidth = isBeat ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal grid lines (4 quarters)
    for (let j = 0; j <= 4; j++) {
      const y = (j / 4) * h;
      ctx.strokeStyle = j % 2 === 0 ? '#2c313d' : '#1c1f28';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Baseline diagonal (normal 1:1 line)
    ctx.strokeStyle = '#252936';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve fill & stroke
    ctx.lineWidth = 3;
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#f97316');
    gradient.addColorStop(0.5, '#ec4899');
    gradient.addColorStop(1, '#06b6d4');
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    const resolution = 200;
    for (let i = 0; i <= resolution; i++) {
      const p = i / resolution;
      const yVal = engine.evaluateTimeCurve(p);
      const px = p * w;
      const py = h - yVal * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Custom points if in custom mode
    if (timePreset === 'custom') {
      for (const pt of customPoints) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pt.x * w, h - pt.y * h, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Transport Playhead
    if (state.isPlaying) {
      const playheadX = currentPhaseRef.current * w;
      const playheadY = h - engine.evaluateTimeCurve(currentPhaseRef.current) * h;

      // Vertical line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();

      // Glowing contact orb
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(playheadX, playheadY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    animFrameRef.current = requestAnimationFrame(drawGraph);
  }, [engine, state.isPlaying, timePreset, customPoints]);

  useEffect(() => {
    if (isOpen) {
      animFrameRef.current = requestAnimationFrame(drawGraph);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, drawGraph]);

  if (!isOpen) return null;

  const handleTogglePower = () => {
    const next = !enabled;
    setEnabled(next);
    engine.setEnabled(next);
  };

  const handleSelectTimePreset = (preset: GrossBeatTimePreset) => {
    setTimePreset(preset);
    engine.timePreset = preset;
    if (!enabled) {
      setEnabled(true);
      engine.setEnabled(true);
    }
  };

  const handleSelectVolPreset = (preset: GrossBeatVolPreset) => {
    setVolPreset(preset);
    engine.volPreset = preset;
  };

  const handleMixChange = (val: number) => {
    setMix(val);
    engine.setMix(val);
  };

  // Canvas click for custom spline editing
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (timePreset !== 'custom') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));

    const newPoints = [...customPoints, { x, y }].sort((a, b) => a.x - b.x);
    setCustomPoints(newPoints);
    engine.customTimePoints = newPoints;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#14161f] border border-[#2b3040] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#1b1e2a] border-b border-[#2b3040] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">EVE GROSS BEAT</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono font-bold border border-orange-500/30">
                  TIME-GLITCH FX
                </span>
              </div>
              <p className="text-xs text-gray-400">Circular Audio Ring Buffer Modulation & Gating Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Power Switch */}
            <button
              onClick={handleTogglePower}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                enabled
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                  : 'bg-[#232735] text-gray-400 hover:text-gray-200'
              }`}
            >
              <Power size={14} />
              <span>{enabled ? 'ACTIVE' : 'BYPASS'}</span>
            </button>

            {/* Dry/Wet Mix */}
            <div className="flex items-center gap-2 bg-[#0e1017] px-3 py-1 rounded-lg border border-[#2b3040]">
              <span className="text-[11px] font-mono text-gray-400">MIX:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={mix}
                onChange={(e) => handleMixChange(Number(e.target.value))}
                className="w-20 accent-orange-500 cursor-pointer"
              />
              <span className="text-[11px] font-mono font-bold text-orange-400 w-9 text-right">
                {Math.round(mix * 100)}%
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#232735] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 flex flex-col md:flex-row gap-5 overflow-y-auto">
          {/* Left: Interactive Canvas Curve Display */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-gray-300">
                <Clock size={14} className="text-orange-400" />
                <span className="font-bold">TIME MODULATION ENVELOPE (1 BAR / 4 BEATS)</span>
              </div>
              {timePreset === 'custom' && (
                <button
                  onClick={() => {
                    const defaultPts = [
                      { x: 0, y: 0 },
                      { x: 0.5, y: 0.25 },
                      { x: 1, y: 0.5 },
                    ];
                    setCustomPoints(defaultPts);
                    engine.customTimePoints = defaultPts;
                  }}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                >
                  <RotateCcw size={12} />
                  <span>Reset Spline</span>
                </button>
              )}
            </div>

            <div className="relative w-full aspect-[2/1] bg-[#101216] rounded-xl border border-[#2b3040] overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={600}
                height={300}
                onClick={handleCanvasClick}
                className={`w-full h-full block ${timePreset === 'custom' ? 'cursor-crosshair' : ''}`}
              />
              <div className="absolute bottom-2 left-3 text-[10px] font-mono text-gray-500">
                BEAT 1 &bull; BEAT 2 &bull; BEAT 3 &bull; BEAT 4
              </div>
              <div className="absolute top-2 right-3 text-[10px] font-mono text-orange-400 font-bold bg-black/50 px-2 py-0.5 rounded border border-orange-500/20">
                {timePreset.toUpperCase()}
              </div>
            </div>

            {/* Performance Momentary Trigger Pads */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold">Quick Drops:</span>
              <button
                onMouseDown={() => {
                  engine.timePreset = 'halfSpeed';
                  engine.setEnabled(true);
                  setEnabled(true);
                  setTimePreset('halfSpeed');
                }}
                onMouseUp={() => {
                  engine.timePreset = 'bypass';
                  setTimePreset('bypass');
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600 border border-orange-500/40 text-orange-300 hover:text-white text-xs font-mono font-bold transition-all active:scale-95"
              >
                HOLD 1/2 SPEED
              </button>
              <button
                onMouseDown={() => {
                  engine.timePreset = 'reverse1Bar';
                  engine.setEnabled(true);
                  setEnabled(true);
                  setTimePreset('reverse1Bar');
                }}
                onMouseUp={() => {
                  engine.timePreset = 'bypass';
                  setTimePreset('bypass');
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-mono font-bold transition-all active:scale-95"
              >
                HOLD REVERSE
              </button>
              <button
                onMouseDown={() => {
                  engine.timePreset = 'vinylStop';
                  engine.setEnabled(true);
                  setEnabled(true);
                  setTimePreset('vinylStop');
                }}
                onMouseUp={() => {
                  engine.timePreset = 'bypass';
                  setTimePreset('bypass');
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-mono font-bold transition-all active:scale-95"
              >
                HOLD VINYL STOP
              </button>
            </div>
          </div>

          {/* Right: Presets Panel */}
          <div className="w-full md:w-72 flex flex-col gap-4">
            {/* Time Presets */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-300 mb-2">
                <Disc size={13} className="text-amber-400" />
                <span>TIME PRESETS</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectTimePreset(p.id)}
                    className={`px-3 py-2 rounded-lg text-left transition-all border ${
                      timePreset === p.id
                        ? 'bg-orange-500/20 border-orange-500/50 text-white shadow-md'
                        : 'bg-[#1a1c26] border-[#2b3040] text-gray-300 hover:bg-[#222533]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{p.label}</span>
                      {timePreset === p.id && (
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Gating Presets */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-300 mb-2">
                <Volume2 size={13} className="text-cyan-400" />
                <span>VOLUME GATING</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {VOL_PRESETS.map((vp) => (
                  <button
                    key={vp.id}
                    onClick={() => handleSelectVolPreset(vp.id)}
                    className={`px-3 py-1.5 rounded-lg text-left transition-all border ${
                      volPreset === vp.id
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-md'
                        : 'bg-[#1a1c26] border-[#2b3040] text-gray-400 hover:bg-[#222533]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{vp.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{vp.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
