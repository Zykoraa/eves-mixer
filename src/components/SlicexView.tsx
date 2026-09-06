import React, { useEffect, useRef, useState } from 'react';
import {
  Scissors,
  Play,
  Upload,
  Sparkles,
  Sliders,
  Grid,
  Music,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { AudioSlice } from '../types/daw';

export const SlicexView: React.FC = () => {
  const [state, store] = useDawStore();
  const session = state.slicexSession;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dumpSuccessMsg, setDumpSuccessMsg] = useState<string | null>(null);

  // Initialize demo breakbeat if session is empty
  useEffect(() => {
    if (!session.audioBuffer) {
      store.loadSlicexDemo();
    }
  }, [session.audioBuffer]);

  // Render waveform with slices on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !session.audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const buffer = session.audioBuffer;
    const channelData = buffer.getChannelData(0);
    const totalSamples = buffer.length;

    // Clear background
    ctx.fillStyle = '#101217';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#1d212b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Center zero line
    ctx.strokeStyle = '#272b38';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // 1. Draw Slice Regions and highlights
    session.slices.forEach((slice) => {
      const startX = (slice.startSample / totalSamples) * width;
      const endX = (slice.endSample / totalSamples) * width;
      const sliceW = Math.max(1, endX - startX);
      const isSelected = slice.id === session.selectedSliceId;

      // Fill background of slice
      ctx.fillStyle = isSelected ? `${slice.color}35` : `${slice.color}12`;
      ctx.fillRect(startX, 0, sliceW, height);

      // Slice vertical boundary
      ctx.strokeStyle = slice.color;
      ctx.lineWidth = isSelected ? 2 : 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top flag marker
      ctx.fillStyle = slice.color;
      ctx.fillRect(startX, 0, Math.min(sliceW, 44), 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`S${slice.sliceIndex + 1}`, startX + 4, 13);
    });

    // 2. Draw Waveform Path
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const step = Math.ceil(totalSamples / width);
    const amp = height / 2.2;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      const offset = i * step;

      for (let j = 0; j < step; j++) {
        const datum = channelData[offset + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const yLow = (1 + min) * amp;
      const yHigh = (1 + max) * amp;

      if (i === 0) {
        ctx.moveTo(i, yLow);
      } else {
        ctx.lineTo(i, yLow);
        ctx.lineTo(i, yHigh);
      }
    }
    ctx.stroke();
  }, [session.audioBuffer, session.slices, session.selectedSliceId]);

  // Handle canvas click to select & preview slice
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !session.audioBuffer) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const sampleIndex = ratio * session.audioBuffer.length;

    const matched = session.slices.find(
      (s) => sampleIndex >= s.startSample && sampleIndex <= s.endSample
    );

    if (matched) {
      store.selectSlicexSlice(matched.id);
      store.auditionSlicexSlice(matched);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      store.loadSlicexFile(file);
    }
  };

  const showNotification = (msg: string) => {
    setDumpSuccessMsg(msg);
    setTimeout(() => setDumpSuccessMsg(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#111317] text-white select-none overflow-hidden border-t border-[#252834]">
      {/* Top Slicex Header / Action Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#181a22] border-b border-[#2a2d38] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
            <Scissors size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">Eve Slicex</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30">
                AI TRANSIENT SLICER
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono truncate max-w-xs">{session.fileName}</p>
          </div>
        </div>

        {/* Transient Sensitivity Knob & Controls */}
        <div className="flex items-center gap-4 bg-[#12141a] px-3 py-1 rounded-md border border-[#2d313e]">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-amber-400" />
            <span className="text-[10px] uppercase font-mono text-gray-400 font-bold">Sensitivity:</span>
            <input
              type="range"
              min={10}
              max={95}
              value={session.sensitivity}
              onChange={(e) => store.setSlicexSensitivity(Number(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-amber-400 w-8">{session.sensitivity}%</span>
          </div>

          <div className="h-4 w-px bg-[#2d313e]" />

          <span className="text-xs font-mono font-bold text-emerald-400">
            {session.slices.length} Slices Found
          </span>
        </div>

        {/* Sample Actions */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded bg-[#252834] hover:bg-[#2f3342] text-xs font-mono font-bold text-gray-200 flex items-center gap-1.5 transition-all"
          >
            <Upload size={13} />
            <span>Load Audio File</span>
          </button>
          <button
            onClick={() => store.loadSlicexDemo()}
            className="px-2.5 py-1.5 rounded bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-xs font-mono font-bold text-white shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Sparkles size={13} />
            <span>Demo Breakbeat</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Waveform Display */}
      <div className="p-4 flex flex-col gap-3">
        <div className="relative rounded-lg overflow-hidden border border-[#2e3240] shadow-inner bg-[#101217]">
          <canvas
            ref={canvasRef}
            width={1000}
            height={160}
            onClick={handleCanvasClick}
            className="w-full h-40 cursor-pointer block"
          />
          <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] font-mono text-gray-500 bg-[#161822]/80 px-2 py-0.5 rounded border border-[#2d303d]">
            Click any slice region to audition
          </div>
        </div>

        {/* 1-Click Export / Dump Action Bar */}
        <div className="flex items-center justify-between bg-[#161822] p-2 rounded-md border border-[#2a2d3a]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-gray-400">DUMP ACTIONS:</span>
            <button
              onClick={() => {
                store.dumpSlicexToChannelRack('kit');
                showNotification('Dumped 8 slices as drum kit channels to Channel Rack!');
              }}
              className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold shadow flex items-center gap-1.5 transition-all"
            >
              <Grid size={14} />
              <span>Dump Slices to Channel Rack</span>
            </button>
            <button
              onClick={() => {
                store.dumpSlicexToChannelRack('chromatic');
                showNotification('Dumped slices chromatic piano roll notes!');
              }}
              className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold shadow flex items-center gap-1.5 transition-all"
            >
              <Music size={14} />
              <span>Dump to Piano Roll (C5 Chromatic)</span>
            </button>
          </div>

          {dumpSuccessMsg && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/30 animate-pulse">
              <CheckCircle2 size={13} />
              <span>{dumpSuccessMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* MPC / Drum Pad Grid to Audition & Play Slices */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="text-[10px] font-mono uppercase text-gray-400 font-bold mb-2 tracking-wider">
          MPC SLICE AUDITION PADS ({session.slices.length} SLICES)
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {session.slices.map((slice) => {
            const isSelected = slice.id === session.selectedSliceId;

            return (
              <button
                key={slice.id}
                onClick={() => {
                  store.selectSlicexSlice(slice.id);
                  store.auditionSlicexSlice(slice);
                }}
                className={`h-24 rounded-lg p-2.5 flex flex-col justify-between text-left transition-all border shadow-md relative overflow-hidden group ${
                  isSelected
                    ? 'border-white ring-2 ring-amber-400 shadow-amber-500/20'
                    : 'border-[#2c303f] hover:border-[#454b5f] bg-[#171922]'
                }`}
                style={{
                  backgroundColor: isSelected ? `${slice.color}35` : '#171922',
                }}
              >
                {/* Pad Glow indicator */}
                <div
                  className="w-2.5 h-2.5 rounded-full mb-1 transition-transform group-hover:scale-125"
                  style={{ backgroundColor: slice.color }}
                />

                <div className="truncate">
                  <div className="text-sm font-extrabold font-mono text-white">
                    Pad {slice.sliceIndex + 1}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400">
                    {(slice.duration * 1000).toFixed(0)} ms
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-gray-500 group-hover:text-amber-400">
                  <span>Audition</span>
                  <Volume2 size={11} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
