import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  X,
  Play,
  Square,
  Sparkles,
  ArrowRight,
  Activity,
  Volume2,
  FolderOpen,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { BeatboxTranscriber } from '../audio/BeatboxTranscriber';
import { AudioEngine } from '../audio/AudioEngine';
import { BeatboxDetectionResult, BeatboxHit } from '../types/daw';

interface BeatboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BeatboxModal: React.FC<BeatboxModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();
  const transcriber = BeatboxTranscriber.getInstance();
  const audioEngine = AudioEngine.getInstance();

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<BeatboxDetectionResult | null>(null);
  const [sensitivity, setSensitivity] = useState(55);
  const [notification, setNotification] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop audition audio
  const stopAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      currentSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Playback recorded beatbox buffer
  const playAudio = useCallback(() => {
    if (!result?.audioBuffer) return;
    stopAudio();
    audioEngine.resumeContext();
    const source = audioEngine.ctx.createBufferSource();
    source.buffer = result.audioBuffer;
    source.connect(audioEngine.mixer.masterChannel.inputNode);
    source.onended = () => setIsPlaying(false);
    source.start();
    currentSourceRef.current = source;
    setIsPlaying(true);
  }, [result, audioEngine, stopAudio]);

  // Record microphone beatbox
  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const arrayBuf = await blob.arrayBuffer();
        const buffer = await audioEngine.ctx.decodeAudioData(arrayBuf);
        const detection = transcriber.transcribe(buffer, state.bpm, sensitivity);
        setResult(detection);
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access is required for beatbox recording.');
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Load built-in demo beatbox pattern
  const loadDemo = () => {
    stopAudio();
    audioEngine.resumeContext();
    const buffer = transcriber.generateDemoBeatbox(audioEngine.ctx, state.bpm);
    const detection = transcriber.transcribe(buffer, state.bpm, sensitivity);
    setResult(detection);
    setNotification('Demo Beatbox pattern loaded and analyzed!');
    setTimeout(() => setNotification(null), 3000);
  };

  // Re-transcribe when sensitivity slider changes
  const handleSensitivityChange = (newSens: number) => {
    setSensitivity(newSens);
    if (result?.audioBuffer) {
      const detection = transcriber.transcribe(result.audioBuffer, state.bpm, newSens);
      setResult(detection);
    }
  };

  // Transfer detected hits to Channel Rack
  const transferToChannelRack = () => {
    if (!result || result.hits.length === 0) return;
    store.applyBeatboxHits(result.hits);
    setNotification('Transferred detected drum hits into Channel Rack!');
    setTimeout(() => {
      setNotification(null);
      onClose();
      store.setActiveView('channelRack');
    }, 1000);
  };

  // Draw waveform with hit markers
  useEffect(() => {
    if (!canvasRef.current || !result?.audioBuffer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const data = result.audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Draw waveform
    ctx.fillStyle = '#1e2332';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const min = data[i * step] || 0;
      ctx.lineTo(i, amp + min * amp * 0.9);
    }
    ctx.stroke();

    // Draw hit markers
    result.hits.forEach((hit) => {
      const x = (hit.time / result.duration) * width;

      let color = '#f97316'; // kick: orange
      if (hit.drumClass === 'snare') color = '#ef4444'; // snare: red
      else if (hit.drumClass === 'hihat') color = '#06b6d4'; // hihat: cyan

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Badge on top
      ctx.fillRect(x - 14, 2, 28, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hit.drumClass.toUpperCase().slice(0, 4), x, 12);
    });
  }, [result]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#151722] border border-[#33374c] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1e2130] border-b border-[#2b2f44]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <Mic size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">AI Beatbox-to-Drums Transcriber</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold border border-red-500/40">
                  REAL-TIME ONSET AI
                </span>
              </div>
              <p className="text-xs text-gray-400">Hum or Beatbox into Microphone $\rightarrow$ Auto-Populate FL Channel Rack</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-[#2b2f44] text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Notification */}
          {notification && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-300">
              <CheckCircle2 size={16} />
              <span>{notification}</span>
            </div>
          )}

          {/* Action Transport Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1b1e2a] p-3 rounded-xl border border-[#2d3144]">
            <div className="flex items-center gap-2">
              <button
                onClick={isRecording ? stopMicRecording : startMicRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all shadow-md ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <Mic size={15} />
                <span>{isRecording ? 'STOP RECORDING' : 'RECORD BEATBOX'}</span>
              </button>

              <button
                onClick={loadDemo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#272b3c] hover:bg-[#343a50] text-gray-200 text-xs font-mono font-bold border border-[#3b415a] transition-all"
              >
                <Sparkles size={14} className="text-yellow-400" />
                <span>Try Demo Beatbox</span>
              </button>
            </div>

            {result && (
              <button
                onClick={isPlaying ? stopAudio : playAudio}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#252a3a] hover:bg-[#32384e] text-gray-200 text-xs font-mono font-bold transition-all"
              >
                {isPlaying ? <Square size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Stop Audition' : 'Play Beatbox'}</span>
              </button>
            )}
          </div>

          {/* Waveform & Detection Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">DETECTED TRANSIENT ONSETS & CLASSIFICATIONS:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-orange-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> KICK
                </span>
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> SNARE
                </span>
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> HI-HAT
                </span>
              </div>
            </div>

            <div className="h-28 bg-[#10111a] rounded-xl border border-[#282b3d] overflow-hidden relative shadow-inner">
              <canvas
                ref={canvasRef}
                width={600}
                height={112}
                className="w-full h-full"
              />
              {!result && (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-gray-500">
                  Record your beatbox or load the demo to view transient classification
                </div>
              )}
            </div>
          </div>

          {/* Sensitivity slider */}
          <div className="bg-[#1b1e2a] p-4 rounded-xl border border-[#2d3144] space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-300 font-bold flex items-center gap-1.5">
                <Sliders size={14} className="text-teal-400" />
                <span>Detection Sensitivity:</span>
              </span>
              <span className="text-teal-400 font-bold">{sensitivity}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              value={sensitivity}
              onChange={(e) => handleSensitivityChange(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-gray-500">
              <span>Less Hits (Higher threshold)</span>
              <span>More Hits (Lower threshold)</span>
            </div>
          </div>

          {/* Detected Hits Summary Cards */}
          {result && (
            <div className="bg-[#171a26] p-4 rounded-xl border border-[#2a2e40] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-gray-300">
                  CLASSIFIED DRUM PATTERN ({result.hits.length} HITS ON {result.bpm} BPM GRID):
                </span>
              </div>

              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                {Array.from({ length: 16 }, (_, s) => {
                  const stepHits = result.hits.filter((h) => h.step === s);
                  return (
                    <div
                      key={s}
                      className={`h-12 rounded border flex flex-col items-center justify-between p-1 text-[9px] font-mono ${
                        stepHits.length > 0
                          ? 'bg-[#222738] border-teal-500/50'
                          : 'bg-[#11131c] border-[#222534] opacity-40'
                      }`}
                    >
                      <span className="text-gray-500">{s + 1}</span>
                      {stepHits.map((h, i) => (
                        <span
                          key={i}
                          className={`font-bold ${
                            h.drumClass === 'kick'
                              ? 'text-orange-400'
                              : h.drumClass === 'snare'
                              ? 'text-red-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {h.drumClass === 'kick' ? 'K' : h.drumClass === 'snare' ? 'S' : 'H'}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={transferToChannelRack}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 transition-all mt-2"
              >
                <span>Transfer {result.hits.length} Drum Hits to Channel Rack</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
