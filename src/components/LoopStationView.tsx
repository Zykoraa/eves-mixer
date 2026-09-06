import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Circle,
  Play,
  Square,
  Volume2,
  Trash2,
  Download,
  Layers,
  Headphones,
  Sliders,
  Radio,
  PlusCircle,
  Activity,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { AudioEngine } from '../audio/AudioEngine';
import { LooperDeck } from '../types/daw';

export const LoopStationView: React.FC = () => {
  const [state, store] = useDawStore();
  const [micPeak, setMicPeak] = useState<number>(0);
  const [activeRecordingDeck, setActiveRecordingDeck] = useState<number | null>(null);
  const [deckProgresses, setDeckProgresses] = useState<Record<number, number>>({});
  const micScopeCanvasRef = useRef<HTMLCanvasElement>(null);

  const engine = AudioEngine.getInstance();
  const looper = engine.looperStation;

  // Poll mic VU meter, deck playheads, & draw live oscilloscope
  useEffect(() => {
    let animId: number;

    const renderLoopFrame = () => {
      // 1. Mic & oscilloscope
      if (state.isMicActive) {
        const peak = looper.getMicPeak();
        setMicPeak(peak);

        const canvas = micScopeCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            const pcmData = new Float32Array(looper.micAnalyser.frequencyBinCount);
            looper.micAnalyser.getFloatTimeDomainData(pcmData as unknown as Float32Array<ArrayBuffer>);

            ctx.fillStyle = '#0e1017';
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#eab308';
            ctx.beginPath();

            const sliceWidth = width / pcmData.length;
            let x = 0;
            for (let i = 0; i < pcmData.length; i++) {
              const v = pcmData[i];
              const y = height / 2 + v * (height / 2.2);
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

      // 2. Poll playheads for playing decks
      const progresses: Record<number, number> = {};
      state.looperDecks.forEach((deck) => {
        if (deck.status === 'playing') {
          progresses[deck.deckNumber] = looper.getDeckProgress(deck.deckNumber);
        }
      });
      setDeckProgresses(progresses);

      animId = requestAnimationFrame(renderLoopFrame);
    };

    animId = requestAnimationFrame(renderLoopFrame);
    return () => cancelAnimationFrame(animId);
  }, [state.isMicActive, state.looperDecks, looper]);

  // Handle Record / Overdub on a Deck with Quantized Auto-Stop
  const handleToggleRecord = async (deck: LooperDeck) => {
    if (deck.source === 'mic' && !state.isMicActive) {
      const ok = await store.toggleMicrophone();
      if (!ok) return;
    }

    if (activeRecordingDeck === deck.deckNumber) {
      // Stop recording manually
      completeRecording(deck);
    } else {
      // Start recording / overdub
      const isOverdub = deck.audioBuffer !== null;
      setActiveRecordingDeck(deck.deckNumber);
      store.updateLooperDeck(deck.deckNumber - 1, {
        status: isOverdub ? 'overdubbing' : 'recording',
      });

      // Pass auto-stop callback for quantized recording
      looper.startRecording(
        deck.deckNumber,
        state.bpm,
        deck.recordedBars,
        deck.source || 'mic',
        () => {
          // Auto-stop triggered when target bar duration completes
          completeRecording(deck);
        }
      );
    }
  };

  // Complete recording and crossfade
  const completeRecording = (deck: LooperDeck) => {
    const result = looper.stopRecording(state.bpm, deck.recordedBars);
    setActiveRecordingDeck(null);

    if (result) {
      let finalBuffer = result.buffer;
      if (deck.audioBuffer && deck.status === 'overdubbing') {
        finalBuffer = looper.overdubBuffer(deck.audioBuffer, result.buffer);
      }

      const updatedDeck: LooperDeck = {
        ...deck,
        audioBuffer: finalBuffer,
        waveform: result.waveform,
        status: 'playing',
      };

      store.updateLooperDeck(deck.deckNumber - 1, {
        audioBuffer: finalBuffer,
        waveform: result.waveform,
        status: 'playing',
      });

      // Start continuous click-free playback
      looper.startDeckPlayback(updatedDeck, state.bpm);
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
      filter: 0,
      stutterRate: 0,
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

  // Stutter trigger helper
  const handleSetStutter = (deck: LooperDeck, rate: number) => {
    const nextRate = deck.stutterRate === rate ? 0 : rate;
    store.updateLooperDeck(deck.deckNumber - 1, { stutterRate: nextRate });
    looper.setDeckStutter(deck.deckNumber, nextRate, state.bpm);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0e1015] text-gray-200 overflow-hidden select-none font-sans">
      {/* Mic Looper Header Strip */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#161822] border-b border-[#252835] gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Radio size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wide">Eve Live Loop Station (4-Deck)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30 uppercase">
                Quantized & Resample
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Bar-synced seamless audio capture with DJ Dual Filter, Beat Repeat & direct Channel Rack export
            </p>
          </div>
        </div>

        {/* Global Mic & Audio Monitor Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => store.toggleMicrophone()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              state.isMicActive
                ? 'bg-red-500 text-white shadow-md shadow-red-500/40 animate-pulse'
                : 'bg-[#222533] text-gray-300 hover:text-white border border-[#313549]'
            }`}
          >
            {state.isMicActive ? <Mic size={13} /> : <MicOff size={13} />}
            <span>{state.isMicActive ? 'Mic Active' : 'Enable Mic'}</span>
          </button>

          <button
            onClick={() => store.toggleDirectMonitor()}
            title="Direct Monitoring (Use Headphones!)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
              state.directMonitor
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'bg-[#1b1e2a] text-gray-400 hover:text-gray-200 border-[#2b2f42]'
            }`}
          >
            <Headphones size={13} />
            <span>Direct Monitor</span>
          </button>

          <div className="flex items-center gap-1.5 bg-[#1b1e2a] px-3 py-1 rounded-xl border border-[#2a2e40] text-xs font-mono text-gray-400">
            <span>MIC:</span>
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

      {/* Live Input Preview & Oscilloscope Banner */}
      <div className="bg-[#12141c] px-4 py-2 border-b border-[#202330] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <canvas
            ref={micScopeCanvasRef}
            width={340}
            height={38}
            className="w-72 h-9 bg-[#090a0e] rounded-lg border border-[#1f222e]"
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-400 uppercase">Input Level</span>
            <div className="w-32 h-2 bg-[#191b26] rounded-full overflow-hidden border border-[#282c3c] mt-1">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
                style={{ width: `${Math.min(100, micPeak * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] font-mono text-gray-400">
          <div className="text-yellow-400 font-bold">Tempo Sync: {state.bpm} BPM</div>
          <div className="text-gray-500">Auto-Seam Equal-Power Crossfade • Zero Click Restart</div>
        </div>
      </div>

      {/* 4 Dedicated Looper Decks Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-[#0d0f14]">
        {state.looperDecks.map((deck) => {
          const isRecording = activeRecordingDeck === deck.deckNumber;
          const hasAudio = deck.audioBuffer !== null;
          const progress = deckProgresses[deck.deckNumber] ?? 0;

          return (
            <div
              key={deck.id}
              className={`bg-[#151722] border rounded-2xl p-4 flex flex-col justify-between shadow-xl transition-all ${
                isRecording
                  ? 'border-red-500 ring-2 ring-red-500/40 shadow-red-500/20'
                  : deck.status === 'playing'
                  ? 'border-yellow-500/60 shadow-yellow-500/10'
                  : 'border-[#262a3c]'
              }`}
            >
              {/* Deck Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-[#25293a]">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isRecording
                        ? 'bg-red-500 animate-ping'
                        : deck.status === 'playing'
                        ? 'bg-yellow-400 shadow-xs shadow-yellow-400'
                        : 'bg-gray-600'
                    }`}
                  />
                  <span className="font-extrabold text-sm text-white tracking-wide">{deck.name}</span>
                </div>

                {/* Input Source & Quantized Length Pickers */}
                <div className="flex items-center gap-2">
                  {/* Source Selector: Mic / Guitar / Master */}
                  <div className="flex items-center gap-1 bg-[#10121a] p-1 rounded-lg border border-[#232738]">
                    {(['mic', 'guitar', 'master'] as const).map((src) => (
                      <button
                        key={src}
                        onClick={() => store.updateLooperDeck(deck.deckNumber - 1, { source: src })}
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded uppercase transition-all ${
                          (deck.source || 'mic') === src
                            ? src === 'guitar'
                              ? 'bg-emerald-500 text-black'
                              : src === 'master'
                              ? 'bg-purple-500 text-white'
                              : 'bg-yellow-500 text-black'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                        title={`Record from ${src.toUpperCase()}`}
                      >
                        {src}
                      </button>
                    ))}
                  </div>

                  {/* Bars selector */}
                  <div className="flex items-center gap-0.5 bg-[#10121a] p-1 rounded-lg border border-[#232738]">
                    {[1, 2, 4, 8].map((bars) => (
                      <button
                        key={bars}
                        onClick={() => store.updateLooperDeck(deck.deckNumber - 1, { recordedBars: bars })}
                        className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-all ${
                          deck.recordedBars === bars
                            ? 'bg-yellow-500 text-black font-extrabold shadow-xs'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {bars}B
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Waveform Visualizer & Live Animated Playhead */}
              <div className="h-24 bg-[#090a0f] rounded-xl border border-[#1f2230] my-3 relative overflow-hidden flex items-center justify-center">
                {hasAudio && deck.waveform.length > 0 ? (
                  <div className="w-full h-full relative flex items-center justify-between px-2">
                    {deck.waveform.map((val, idx) => (
                      <div
                        key={idx}
                        className="w-1 bg-yellow-400/90 rounded-full transition-all"
                        style={{ height: `${Math.max(12, val * 92)}%` }}
                      />
                    ))}

                    {/* Live Playhead Line */}
                    {deck.status === 'playing' && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/80 transition-all duration-75 z-10 pointer-events-none"
                        style={{ left: `${progress * 100}%` }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-gray-600 flex items-center gap-2">
                    <Activity size={16} className={isRecording ? 'text-red-500 animate-spin' : 'text-gray-700'} />
                    <span>
                      {isRecording
                        ? `RECORDING [${deck.source?.toUpperCase() || 'MIC'}] • AUTO-QUANTIZE ${deck.recordedBars} BARS...`
                        : `DECK READY • TAP RECORD TO CAPTURE ${deck.source?.toUpperCase() || 'MIC'}`}
                    </span>
                  </div>
                )}
              </div>

              {/* DJ Dual Filter & Performance Controls Strip */}
              <div className="grid grid-cols-2 gap-3 py-2 px-1 border-t border-[#222638]">
                {/* DJ Dual Filter (-100% LP to +100% HP) */}
                <div className="flex flex-col bg-[#10121a] p-2 rounded-xl border border-[#222638]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span className="font-bold flex items-center gap-1">
                      <Sliders size={11} className="text-yellow-400" />
                      DJ DUAL FILTER
                    </span>
                    <button
                      onClick={() => {
                        store.updateLooperDeck(deck.deckNumber - 1, { filter: 0 });
                      }}
                      className="text-[9px] text-gray-500 hover:text-white"
                      title="Reset filter"
                    >
                      FLAT
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.02"
                    value={deck.filter || 0}
                    onChange={(e) => {
                      const f = parseFloat(e.target.value);
                      store.updateLooperDeck(deck.deckNumber - 1, { filter: f });
                    }}
                    className="w-full h-1.5 bg-[#252838] accent-yellow-400 rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono mt-1">
                    <span className={deck.filter < -0.05 ? 'text-cyan-400 font-bold' : 'text-gray-600'}>
                      LP: {Math.round(Math.abs(Math.min(0, deck.filter || 0)) * 100)}%
                    </span>
                    <span className={deck.filter > 0.05 ? 'text-orange-400 font-bold' : 'text-gray-600'}>
                      HP: {Math.round(Math.max(0, deck.filter || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Beat Repeat / Stutter Roll */}
                <div className="flex flex-col bg-[#10121a] p-2 rounded-xl border border-[#222638]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mb-1">
                    <span className="font-bold flex items-center gap-1">
                      <Zap size={11} className="text-yellow-400" />
                      BEAT REPEAT / STUTTER
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[
                      { label: 'NORM', val: 0 },
                      { label: '1/2', val: 0.5 },
                      { label: '1/4', val: 0.25 },
                      { label: '1/8', val: 0.125 },
                      { label: '1/16', val: 0.0625 },
                    ].map((st) => (
                      <button
                        key={st.label}
                        disabled={!hasAudio}
                        onClick={() => handleSetStutter(deck, st.val)}
                        className={`flex-1 py-1 text-[9px] font-mono font-bold rounded transition-all ${
                          (deck.stutterRate || 0) === st.val && st.val > 0
                            ? 'bg-yellow-500 text-black shadow-xs'
                            : 'bg-[#1e2230] text-gray-400 hover:text-white disabled:opacity-30'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deck Action Controls & Export Bar */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#25293a]">
                <div className="flex items-center gap-1.5">
                  {/* Record / Overdub Button */}
                  <button
                    onClick={() => handleToggleRecord(deck)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold transition-all ${
                      isRecording
                        ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/40'
                        : hasAudio
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                    }`}
                  >
                    <Circle size={12} fill={isRecording ? 'currentColor' : 'none'} />
                    <span>{isRecording ? 'STOP' : hasAudio ? 'OVERDUB' : 'RECORD'}</span>
                  </button>

                  {/* Play / Pause Button */}
                  {hasAudio && (
                    <button
                      onClick={() => handleTogglePlayDeck(deck)}
                      className={`p-2 rounded-xl transition-all ${
                        deck.status === 'playing'
                          ? 'bg-yellow-500 text-black font-bold'
                          : 'bg-[#222534] text-gray-300 hover:text-white'
                      }`}
                    >
                      {deck.status === 'playing' ? <Square size={13} /> : <Play size={13} />}
                    </button>
                  )}

                  {/* Reverse & Half-speed modifiers */}
                  {hasAudio && (
                    <>
                      <button
                        onClick={() => {
                          const rev = !deck.reverse;
                          store.updateLooperDeck(deck.deckNumber - 1, { reverse: rev });
                          if (deck.status === 'playing') looper.startDeckPlayback({ ...deck, reverse: rev }, state.bpm);
                        }}
                        title="Reverse Loop"
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold ${
                          deck.reverse ? 'bg-purple-600 text-white' : 'bg-[#202330] text-gray-400 hover:text-white'
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
                        title="Half Speed (1/2x)"
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold ${
                          deck.halfSpeed ? 'bg-cyan-600 text-white' : 'bg-[#202330] text-gray-400 hover:text-white'
                        }`}
                      >
                        1/2x
                      </button>
                    </>
                  )}
                </div>

                {/* Export & Rack Routing Actions */}
                <div className="flex items-center gap-1.5">
                  {hasAudio && (
                    <>
                      {/* Send to Channel Rack as a Sampler Track */}
                      <button
                        onClick={() => {
                          store.sendDeckToChannelRack(deck.deckNumber);
                          alert(`Added Deck ${deck.deckNumber} loop as a Sampler Track in Channel Rack!`);
                        }}
                        title="Export to Channel Rack Sampler Track"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/40 text-xs font-mono font-bold transition-all"
                      >
                        <PlusCircle size={13} />
                        <span>To Rack</span>
                      </button>

                      {/* Drop to Playlist */}
                      <button
                        onClick={() => store.sendDeckToPlaylist(deck.deckNumber)}
                        title="Drop to Playlist Arrangement"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/40 text-xs font-mono font-bold transition-all"
                      >
                        <Layers size={13} />
                        <span>Playlist</span>
                      </button>

                      <button
                        onClick={() => handleDownloadDeckWav(deck)}
                        title="Download WAV file"
                        className="p-1.5 rounded-xl bg-[#202330] hover:bg-[#2c3044] text-gray-300 hover:text-white transition-all"
                      >
                        <Download size={13} />
                      </button>

                      <button
                        onClick={() => handleClearDeck(deck.deckNumber)}
                        title="Clear Deck"
                        className="p-1.5 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
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

