import React, { useRef, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { useDawStore } from '../store/useDawStore';
import { Volume2, VolumeX } from 'lucide-react';

export const VisualizerPanel: React.FC = () => {
  const [state, store] = useDawStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const masterCh = state.mixerChannels[0];
  const isMuted = masterCh?.mute || false;
  const masterVol = isMuted ? 0 : (masterCh?.volume ?? 0.7);

  useEffect(() => {
    let animId: number;
    const engine = AudioEngine.getInstance();
    const analyser = engine.mixer.masterChannel.analyserNode;
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          analyser.getByteFrequencyData(dataArray as unknown as Uint8Array<ArrayBuffer>);
          analyser.getByteTimeDomainData(timeDomainArray as unknown as Uint8Array<ArrayBuffer>);

          // Background
          ctx.fillStyle = '#0f1015';
          ctx.fillRect(0, 0, width, height);

          // 1. Draw Spectrum Analyzer Bars
          const barWidth = (width / bufferLength) * 1.5;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * (height * 0.85);

            // FL Studio Neon Gradient (Cyan -> Green -> Orange)
            const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
            grad.addColorStop(0, 'rgba(0, 210, 255, 0.6)');
            grad.addColorStop(0.5, 'rgba(55, 214, 122, 0.8)');
            grad.addColorStop(1, 'rgba(255, 118, 59, 0.9)');

            ctx.fillStyle = grad;
            ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
          }

          // 2. Overlay Oscilloscope Waveform Line
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          const sliceWidth = width / bufferLength;
          let oscX = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = timeDomainArray[i] / 128.0;
            const y = (v * height) / 2;
            if (i === 0) {
              ctx.moveTo(oscX, y);
            } else {
              ctx.lineTo(oscX, y);
            }
            oscX += sliceWidth;
          }
          ctx.stroke();
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="h-10 bg-[#0c0d12] border-t border-[#232530] px-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest hidden sm:inline">
          MASTER WAVE CANDY
        </span>
      </div>

      {/* Visualizer Canvas */}
      <canvas ref={canvasRef} width={420} height={32} className="h-8 max-w-[320px] sm:max-w-[420px] flex-1 rounded bg-[#090a0e]" />

      {/* Persistent Bottom Master Output Volume Bar */}
      <div className="flex items-center gap-2 shrink-0 bg-[#141620] px-2.5 py-1 rounded-md border border-[#2c3144]">
        <button
          onClick={() => {
            if (masterCh) {
              store.updateMixerChannel(0, { mute: !masterCh.mute });
            }
          }}
          title={isMuted ? 'Unmute Master Output' : 'Mute Master Output'}
          className={`p-1 rounded cursor-pointer transition-colors ${
            isMuted ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          {isMuted || masterVol === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="text-gray-400 text-[10px] hidden md:inline">VOLUME:</span>
          <span className={isMuted ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
            {isMuted ? 'MUTED' : `${Math.round(masterVol * 100)}%`}
          </span>
          <input
            type="range"
            min={0}
            max={1.0}
            step={0.01}
            value={masterVol}
            onChange={(e) => {
              const val = Number(e.target.value);
              store.updateMixerChannel(0, { volume: val, mute: false });
            }}
            title={`Master Volume: ${Math.round(masterVol * 100)}%`}
            className="w-20 sm:w-28 h-1.5 bg-[#252838] accent-emerald-400 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="text-[10px] font-mono text-gray-500 hidden lg:block shrink-0">
        44.1 kHz • 24-bit DSP
      </div>
    </div>
  );
};
