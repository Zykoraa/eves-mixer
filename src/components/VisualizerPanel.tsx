import React, { useRef, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

export const VisualizerPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    <div className="h-10 bg-[#0c0d12] border-t border-[#232530] px-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">
          MASTER WAVE CANDY
        </span>
      </div>
      <canvas ref={canvasRef} width={420} height={32} className="h-8 w-96 rounded bg-[#090a0e]" />
      <div className="text-[10px] font-mono text-gray-500">
        44.1 kHz • 24-bit WebAudio DSP
      </div>
    </div>
  );
};
