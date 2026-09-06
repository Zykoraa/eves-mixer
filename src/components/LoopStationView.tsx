import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Circle,
  Play,
  Square,
  Repeat,
  Volume2,
  Trash2,
  Download,
  Layers,
  ArrowRight,
  Headphones,
  Sliders,
  Radio,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { AudioEngine } from '../audio/AudioEngine';
import { LooperDeck } from '../types/daw';

export const LoopStationView: React.FC = () => {
  const [state, store] = useDawStore();
  const [micPeak, setMicPeak] = useState<number>(0);
  const [activeRecordingDeck, setActiveRecordingDeck] = useState<number | null>(null);
  const micScopeCanvasRef = useRef<HTMLCanvasElement>(null);

  const engine = AudioEngine.getInstance();
  const looper = engine.looperStation;

  // Poll mic VU meter & draw live oscilloscope
  useEffect(() => {
    let animId: number;

    const renderScope = () => {
      if (state.isMicActive) {
        const peak = looper.getMicPeak();
        setMicPeak(peak);

        // Draw oscilloscope
        const canvas = micScopeCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            const pcmData = new Float32Array(looper.micAnalyser.frequencyBinCount);
            looper.micAnalyser.getFloatTimeDomainData(pcmData as unknown as Float32Array<ArrayBuffer>);

            ctx.fillStyle = '#0f1015';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#eab308';
            ctx.beginPath();

            const sliceWidth = width / pcmData.length;
            let x = 0;
            for (let i = 0; i < pcmData.length; i++) {
              const v = pcmData[i];
              const y = (height / 2) + v * (height / 2.2);
              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            ctx.stroke();
          }
        }
      } else {
        setMicPeak(0);
      }
      animId = requestAnimationFrame(renderScope);
    };

    animId = requestAnimationFrame(renderScope);
    return () => cancelAnimationFrame(animId);
  }, [state.isMicActive, looper]);

  // Handle Record / Overdub on a Deck
  const handleToggleRecord = async (deck: LooperDeck) => {
    if (!state.isMicActive) {
      const ok = await store.toggleMicrophone();
      if (!ok) return;
    }

    if (activeRecordingDeck === deck.deckNumber) {
      // Stop recording
      const result = looper.stopRecording();
      setActiveRecordingDeck(null);

      if (result) {
        let finalBuffer = result.buffer;
        if (deck.audioBuffer && deck.status === 'overdubbing') {
          finalBuffer = looper.overdubBuffer(deck.audioBuffer, result.buffer);
        }

        store.updateLooperDeck(deck.deckNumber - 1, {
          audioBuffer: finalBuffer,
          waveform: result.waveform,
          status: 'playing',
        });

        // Start playback looping
        looper.startDeckPlayback(
          { ...deck, audioBuffer: finalBuffer, status: 'playing' },
          state.bpm
        );
      }
    } else {
      // Start recording / overdub
      const isOverdub = deck.audioBuffer !== null;
      setActiveRecordingDeck(deck.deckNumber);
      store.updateLooperDeck(deck.deckNumber - 1, {
        status: isOverdub ? 'overdubbing' : 'recording',
      });
      looper.startRecording(deck.deckNumber);
    }
  };

  // Toggle Deck Playback
  const handleTogglePlayDeck = (deck: LooperDeck) => {
    if (!deck.audioBuffer) return;
    if (deck.status === 'playing') {
      looper.stopDeckPlayback(deck.deckNumber);
      store.updateLooperDeck(deck.deckNumber - 1, { status: 'paused' });
    } else {
      looper.startDeckPlayback(deck, state.bpm);
      store.updateLooperDeck(deck.deckNumber - 1, { status: 'playing' });
    }
  };

  // Clear Deck
  const handleClearDeck = (deckNumber: number) => {
    looper.stopDeckPlayback(deckNumber);
    store.updateLooperDeck(deckNumber - 1, {
      audioBuffer: null,
      status: 'empty',
      waveform: [],
    });
  };

  // Download raw loop as WAV
  const handleDownloadDeckWav = (deck: LooperDeck) => {
    if (!deck.audioBuffer) return;
    const blob = looper.bufferToWavBlob(deck.audioBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EvesMixer-Loop-Deck${deck.deckNumber}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#14151b] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      {/* Mic Looper Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1b1d25] border-b border-[#2a2d38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-yellow-400">
            <Mic size={16} />
            <span>Eve LoopStation (4-Deck Live Looper)</span>
          </div>

          <button
            onClick={() => store.toggleMicrophone()}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-all ${
              state.isMicActive
                ? 'bg-red-500 text-white shadow-md shadow-red-500/40 animate-pulse'
                : 'bg-[#252834] text-gray-300 hover:text-white'
            }`}
          >
            {state.isMicActive ? <Mic size={13} /> : <MicOff size={13} />}
            <span>{state.isMicActive ? 'Mic Active (Live)' : 'Enable Microphone'}</span>
          </button>
        </div>

        {/* Mic Settings & Headphone Direct Monitor */}
        <div className="flex items-center gap-3">
          {/* Direct Monitor Switch */}
          <button
            onClick={() => store.toggleDirectMonitor()}
            title="Direct Monitoring (Use Headphones!)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
              state.directMonitor
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                : 'bg-[#21232d] text-gray-400 hover:text-gray-200'
            }`}
          >
            <Headphones size={13} />
            <span>Direct Monitor</span>
          </button>

          {/* Mic Gain Slider */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
            <span>MIC GAIN:</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={state.micGain}
              onChange={(e) => store.setMicGain(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-[#2b2e3c] accent-yellow-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Mic Input Preview & Oscilloscope Banner */}
      <div className="bg-[#101116] px-4 py-2 border-b border-[#232632] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <canvas
            ref={micScopeCanvasRef}
            width={360}
            height={44}
            className="w-80 h-11 bg-[#0b0c10] rounded border border-[#212431]"
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Input Level</span>
            <div className="w-36 h-2 bg-[#1a1c24] rounded-full overflow-hidden border border-[#2a2d3a] mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
                style={{ width: `${Math.min(100, micPeak * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] font-mono text-gray-400">
          <div>Bar Quantized Recording • Latency Compensated</div>
          <div className="text-yellow-400/80">Loops route directly into Mixer Channel 6</div>
        </div>
      </div>

      {/* 4 Dedicated Looper Decks Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#121318]">
        {state.looperDecks.map((deck) => {
          const isRecording = activeRecordingDeck === deck.deckNumber;
          const hasAudio = deck.audioBuffer !== null;

          return (
            <div
              key={deck.id}
              className={`bg-[#191b24] border rounded-lg p-3 flex flex-col justify-between shadow-md transition-all ${
                isRecording
                  ? 'border-red-500 ring-1 ring-red-500/50 shadow-red-500/20'
                  : deck.status === 'playing'
                  ? 'border-yellow-500/60 shadow-yellow-500/10'
                  : 'border-[#292c3a]'
              }`}
            >
              {/* Deck Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#292c3a]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-xs shadow-yellow-400" />
                  <span className="font-bold text-sm text-gray-200">{deck.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">Length:</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 4, 8].map((bars) => (
                      <button
                        key={bars}
                        onClick={() => store.updateLooperDeck(deck.deckNumber - 1, { recordedBars: bars })}
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                          deck.recordedBars === bars
                            ? 'bg-yellow-500 text-black font-bold'
                            : 'bg-[#242735] text-gray-400'
                        }`}
                      >
                        {bars}B
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Waveform Visualizer or Empty State */}
              <div className="h-20 bg-[#0d0e12] rounded border border-[#222530] my-3 relative overflow-hidden flex items-center justify-center">
                {hasAudio && deck.waveform.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-between px-2">
                    {deck.waveform.map((val, idx) => (
                      <div
                        key={idx}
                        className="w-1 bg-yellow-400 rounded-full"
                        style={{ height: `${Math.max(10, val * 90)}%` }}
                      />
                    ))}
                    {deck.status === 'playing' && (
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md animate-pulse" />
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-gray-600 flex items-center gap-1">
                    <Radio size={14} />
                    <span>{isRecording ? 'RECORDING IN PROGRESS...' : 'DECK EMPTY • READY FOR MIC'}</span>
                  </div>
                )}
              </div>

              {/* Deck Action Controls */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#292c3a]">
                <div className="flex items-center gap-1.5">
                  {/* Record / Overdub Button */}
                  <button
                    onClick={() => handleToggleRecord(deck)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold font-mono transition-all ${
                      isRecording
                        ? 'bg-red-600 text-white animate-bounce shadow-md shadow-red-600/40'
                        : hasAudio
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                    }`}
                  >
                    <Circle size={12} fill={isRecording ? 'currentColor' : 'none'} />
                    <span>{isRecording ? 'STOP REC' : hasAudio ? 'OVERDUB' : 'RECORD'}</span>
                  </button>

                  {/* Play / Pause Button */}
                  {hasAudio && (
                    <button
                      onClick={() => handleTogglePlayDeck(deck)}
                      className={`p-1.5 rounded transition-all ${
                        deck.status === 'playing'
                          ? 'bg-yellow-500 text-black'
                          : 'bg-[#252834] text-gray-300 hover:text-white'
                      }`}
                    >
                      {deck.status === 'playing' ? <Square size={14} /> : <Play size={14} />}
                    </button>
                  )}

                  {/* Creative Performance Modifiers */}
                  {hasAudio && (
                    <>
                      <button
                        onClick={() => {
                          const rev = !deck.reverse;
                          store.updateLooperDeck(deck.deckNumber - 1, { reverse: rev });
                          if (deck.status === 'playing') looper.startDeckPlayback({ ...deck, reverse: rev }, state.bpm);
                        }}
                        title="Reverse Loop"
                        className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold ${
                          deck.reverse ? 'bg-purple-600 text-white' : 'bg-[#242735] text-gray-400'
                        }`}
                      >
                        REV
                      </button>

                      <button
                        onClick={() => {
                          const half = !deck.halfSpeed;
                          store.updateLooperDeck(deck.deckNumber - 1, { halfSpeed: half });
                          if (deck.status === 'playing') looper.startDeckPlayback({ ...deck, halfSpeed: half }, state.bpm);
                        }}
                        title="Half Speed (1/2x Slow-down)"
                        className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold ${
                          deck.halfSpeed ? 'bg-cyan-600 text-white' : 'bg-[#242735] text-gray-400'
                        }`}
                      >
                        1/2x
                      </button>
                    </>
                  )}
                </div>

                {/* Export / Playlist Integrations */}
                <div className="flex items-center gap-1.5">
                  {hasAudio && (
                    <>
                      <button
                        onClick={() => store.sendDeckToPlaylist(deck.deckNumber)}
                        title="Drop Recorded Loop into Playlist Arrangement!"
                        className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40 text-xs font-semibold transition-all"
                      >
                        <Layers size={13} />
                        <span>To Playlist</span>
                      </button>

                      <button
                        onClick={() => handleDownloadDeckWav(deck)}
                        title="Download WAV file"
                        className="p-1 rounded bg-[#242735] hover:bg-[#323647] text-gray-300 hover:text-white transition-all"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        onClick={() => handleClearDeck(deck.deckNumber)}
                        title="Clear Deck"
                        className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
