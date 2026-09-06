import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Play,
  Square,
  Sparkles,
  Layers,
  Music,
  Download,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { PitchCorrectionEngine } from '../audio/PitchCorrectionEngine';
import { PitchCorrectionSession, PitchNoteSegment, PlaylistClip } from '../types/daw';
import { midiToNoteName, NOTE_NAMES, SCALE_INTERVALS } from '../audio/Presets';
import { AudioEngine } from '../audio/AudioEngine';

export const NewToneEditorView: React.FC = () => {
  const [state, store] = useDawStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const engine = PitchCorrectionEngine.getInstance();
  const audioEngine = AudioEngine.getInstance();

  const [session, setSession] = useState<PitchCorrectionSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSegId, setSelectedSegId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    engine.init(audioEngine.ctx);
  }, [engine, audioEngine]);

  // Demo vocal generator if empty
  const loadDemoVocal = useCallback(() => {
    setIsProcessing(true);
    const ctx = audioEngine.ctx;
    const sampleRate = ctx.sampleRate;
    const duration = 3.0;
    const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    // Synthesize a singing vocal line with slight natural vibrato
    const melody = [
      { midi: 60, time: 0.0, dur: 0.65 }, // C4
      { midi: 62, time: 0.7, dur: 0.65 }, // D4
      { midi: 63, time: 1.4, dur: 0.65 }, // Eb4
      { midi: 65, time: 2.1, dur: 0.8 },  // F4
    ];

    for (const note of melody) {
      const baseFreq = 440 * Math.pow(2, (note.midi - 69) / 12);
      const startSample = Math.floor(note.time * sampleRate);
      const numSamples = Math.floor(note.dur * sampleRate);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Natural vibrato (5.5 Hz, ~15 cents) + slight drift
        const vibrato = 1 + 0.008 * Math.sin(2 * Math.PI * 5.5 * t);
        const freq = baseFreq * vibrato;

        // Formant-filtered saw-like voice wave
        const phase = (i * freq) / sampleRate;
        const fundamental = Math.sin(2 * Math.PI * phase);
        const harmonic2 = 0.5 * Math.sin(4 * Math.PI * phase);
        const harmonic3 = 0.25 * Math.sin(6 * Math.PI * phase);

        // Vocal envelope
        const env = Math.min(1.0, Math.min(i / 1000, (numSamples - i) / 2000));
        data[startSample + i] = (fundamental + harmonic2 + harmonic3) * env * 0.45;
      }
    }

    const analyzed = engine.analyzeBuffer(buffer, 'Demo Vocal Phrase.wav');
    setSession(analyzed);
    setIsProcessing(false);
  }, [audioEngine, engine]);

  // Load demo vocal on first mount if none loaded
  useEffect(() => {
    if (!session) {
      loadDemoVocal();
    }
  }, [session, loadDemoVocal]);

  // Handle local audio file load
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await audioEngine.ctx.decodeAudioData(arrayBuffer);
      const analyzed = engine.analyzeBuffer(decoded, file.name);
      setSession(analyzed);
      setSelectedSegId(analyzed.segments.length > 0 ? analyzed.segments[0].id : null);
      showNotice(`Analyzed ${analyzed.segments.length} vocal segments from ${file.name}`);
    } catch (err) {
      alert('Failed to analyze audio file. Please try a WAV or MP3 audio file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1-Click Scale Snap
  const handleSnapToScale = () => {
    if (!session) return;
    const updated = engine.snapSessionToScale(session, state.selectedKey, state.selectedScale);
    setSession(updated);
    showNotice(`Snapped ${updated.segments.length} notes to ${state.selectedKey} ${state.selectedScale}!`);
  };

  // Shift semitone of selected segment
  const handleShiftSelected = (delta: number) => {
    if (!session || !selectedSegId) return;
    const updated = {
      ...session,
      segments: session.segments.map((seg) => {
        if (seg.id === selectedSegId) {
          const nextTarget = Math.max(24, Math.min(108, seg.targetMidi + delta));
          return {
            ...seg,
            targetMidi: nextTarget,
            centDeviation: Math.round((seg.detectedMidi - nextTarget) * 100),
          };
        }
        return seg;
      }),
    };
    setSession(updated);
  };

  // Play preview
  const togglePlay = () => {
    if (!session) return;
    if (isPlaying) {
      engine.stopPreview();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      engine.playTunedPreview(session, () => setIsPlaying(false));
    }
  };

  // Dump to Piano Roll
  const handleDumpToPianoRoll = () => {
    if (!session) return;
    const activeTrack = state.tracks.find((t) => t.id === state.selectedTrackId) || state.tracks[0];
    const notes = engine.exportToPianoRollNotes(session, activeTrack.id, state.bpm);

    const currentPattern = state.patterns.find((p) => p.id === state.selectedPatternId);
    if (currentPattern) {
      // Append or replace
      currentPattern.notes = [...currentPattern.notes, ...notes];
      store.syncAudioEngineData();
      store.saveToStorage();
      showNotice(`Exported ${notes.length} vocal notes to Piano Roll!`);
    }
  };

  // Send tuned vocal to Playlist track
  const handleSendToPlaylist = () => {
    if (!session) return;
    const tunedBuffer = engine.renderTunedBuffer(session);
    if (!tunedBuffer) return;

    // Convert to audio blob
    const wavExporter = async () => {
      // Export audio buffer to wav
      const numChannels = tunedBuffer.numberOfChannels;
      const sampleRate = tunedBuffer.sampleRate;
      const length = tunedBuffer.length;
      const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
      const view = new DataView(wavBuffer);

      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + length * numChannels * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, length * numChannels * 2, true);

      let offset = 44;
      for (let i = 0; i < length; i++) {
        for (let c = 0; c < numChannels; c++) {
          const sample = Math.max(-1, Math.min(1, tunedBuffer.getChannelData(c)[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
          offset += 2;
        }
      }

      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      // Cache buffer in AudioEngine
      audioEngine.cacheAudioBuffer(url, tunedBuffer);

      const clipDurationBars = Math.ceil(tunedBuffer.duration / ((60 / state.bpm) * 4));
      const newClip: PlaylistClip = {
        id: `vocal-tuned-${Date.now()}`,
        trackIndex: 3, // row 3 for vocals
        name: `Tuned: ${session.fileName.slice(0, 12)}`,
        startBar: 0,
        lengthBars: Math.max(1, clipDurationBars),
        color: '#06b6d4',
        type: 'audio',
        audioBlobUrl: url,
      };

      store.addPlaylistClip(newClip);
      showNotice(`Tuned vocal clip sent to Playlist Track 4!`);
      store.setActiveView('playlist');
    };

    wavExporter();
  };

  // Piano key display range: C3 (48) to B5 (83)
  const lowestMidi = 48;
  const highestMidi = 76; // E5
  const midiRange = Array.from(
    { length: highestMidi - lowestMidi + 1 },
    (_, i) => highestMidi - i
  );

  const selectedSeg = session?.segments.find((s) => s.id === selectedSegId);

  return (
    <div className="flex-1 flex flex-col bg-[#13151c] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1e28] border-b border-[#2a2d38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
            <Mic size={16} />
            <span>EVE NEWTONE</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 font-bold">
              PITCH EDITOR
            </span>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#252836] hover:bg-[#34384a] text-xs font-mono text-gray-200 hover:text-white border border-[#373b4d] transition-all"
          >
            <FolderOpen size={13} />
            <span>Load Vocal Audio</span>
          </button>

          <button
            onClick={loadDemoVocal}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#252836] hover:bg-[#34384a] text-xs font-mono text-gray-400 hover:text-gray-200 border border-[#373b4d] transition-all"
          >
            <RefreshCw size={12} />
            <span>Demo Vocal</span>
          </button>

          {/* Transport Preview */}
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold font-mono transition-all ${
              isPlaying
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            {isPlaying ? <Square size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'STOP' : 'AUDITION'}</span>
          </button>
        </div>

        {/* 1-Click Scale Snap & Tuning Sliders */}
        <div className="flex items-center gap-3">
          {/* Snap to Scale */}
          <button
            onClick={handleSnapToScale}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Sparkles size={13} />
            <span>SNAP TO {state.selectedKey} {state.selectedScale.toUpperCase()}</span>
          </button>

          {/* Correction Strength Slider */}
          {session && (
            <div className="flex items-center gap-1.5 bg-[#121316] px-2.5 py-1 rounded border border-[#353945]">
              <span className="text-[10px] font-mono text-gray-400">CORRECTION:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={session.correctionAmount}
                onChange={(e) =>
                  setSession({ ...session, correctionAmount: Number(e.target.value) })
                }
                className="w-16 accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono font-bold text-cyan-400 w-8 text-right">
                {session.correctionAmount}%
              </span>
            </div>
          )}

          {/* Actions: Send to Playlist & Dump to Piano Roll */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSendToPlaylist}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-mono font-bold transition-all"
              title="Place tuned vocal as audio clip on Playlist"
            >
              <Layers size={13} />
              <span>To Playlist</span>
            </button>
            <button
              onClick={handleDumpToPianoRoll}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-600/30 hover:bg-sky-600 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-mono font-bold transition-all"
              title="Dump vocal pitch notes to Piano Roll"
            >
              <Music size={13} />
              <span>To Piano Roll</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="bg-cyan-900/80 border-b border-cyan-500/40 px-4 py-1.5 flex items-center gap-2 text-xs font-mono text-cyan-200">
          <CheckCircle2 size={14} className="text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Pitch Grid Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Vertical Piano Keys (Left) */}
        <div className="w-20 bg-[#171922] border-r border-[#2d303d] flex flex-col flex-shrink-0 overflow-hidden">
          <div className="flex-1 flex flex-col">
            {midiRange.map((midi) => {
              const noteName = midiToNoteName(midi);
              const isBlack = noteName.includes('#');

              return (
                <div
                  key={midi}
                  className={`flex-1 border-b flex items-center justify-end px-2 text-[10px] font-mono font-bold transition-colors ${
                    isBlack
                      ? 'bg-[#1e202b] text-gray-400 border-[#2b2e3c]'
                      : 'bg-[#292d3c] text-white border-[#383d4f]'
                  }`}
                >
                  <span>{noteName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note Grid Timeline (Right) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#101218]">
          <div
            className="h-full relative min-w-[1200px]"
            style={{ width: `${Math.max(1200, (session?.audioBuffer?.duration || 4) * 320)}px` }}
          >
            {/* Horizontal pitch row lanes */}
            {midiRange.map((midi) => {
              const isBlack = midiToNoteName(midi).includes('#');
              return (
                <div
                  key={midi}
                  className={`w-full border-b border-[#1c1f2b] ${
                    isBlack ? 'bg-[#12141a]' : 'bg-[#151720]'
                  }`}
                  style={{ height: `${100 / midiRange.length}%` }}
                />
              );
            })}

            {/* Note Blocks */}
            {session?.segments.map((seg) => {
              const rowIndex = highestMidi - seg.targetMidi;
              if (rowIndex < 0 || rowIndex >= midiRange.length) return null;

              const totalDuration = session.audioBuffer?.duration || 4;
              const leftPercent = (seg.startTime / totalDuration) * 100;
              const widthPercent = Math.max(1.5, (seg.duration / totalDuration) * 100);
              const isSelected = selectedSegId === seg.id;

              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedSegId(seg.id)}
                  className={`absolute rounded-md border shadow-lg cursor-pointer transition-all flex flex-col justify-center px-2 select-none group ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-white ring-2 ring-cyan-400 z-20 scale-105'
                      : 'bg-gradient-to-r from-cyan-600/80 to-blue-700/80 border-cyan-400/50 hover:brightness-110 z-10'
                  }`}
                  style={{
                    top: `${(rowIndex / midiRange.length) * 100}%`,
                    height: `${100 / midiRange.length}%`,
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                >
                  <div className="flex items-center justify-between pointer-events-none text-white font-mono font-bold text-[10px] truncate">
                    <span className="truncate">{midiToNoteName(seg.targetMidi)}</span>
                    <span className="text-[9px] opacity-75">
                      {seg.centDeviation > 0 ? `+${seg.centDeviation}c` : `${seg.centDeviation}c`}
                    </span>
                  </div>

                  {/* Micro-pitch trajectory wavy line */}
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-0.5 pointer-events-none">
                    <div
                      className="h-full bg-cyan-200"
                      style={{
                        width: '100%',
                        transform: `translateY(${Math.max(-2, Math.min(2, seg.centDeviation / 25))}px)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Note Inspector Bar */}
      <div className="h-12 bg-[#171923] border-t border-[#292d3b] px-5 flex items-center justify-between text-xs font-mono">
        {selectedSeg ? (
          <div className="flex items-center gap-6 text-gray-300">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">SELECTED NOTE:</span>
              <span className="font-extrabold text-cyan-400 text-sm">
                {midiToNoteName(selectedSeg.targetMidi)} ({selectedSeg.targetMidi})
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500">TRANSPOSE:</span>
              <button
                onClick={() => handleShiftSelected(1)}
                className="p-1 rounded bg-[#252836] hover:bg-[#34384a] text-cyan-400 hover:text-white"
                title="Shift +1 semitone"
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={() => handleShiftSelected(-1)}
                className="p-1 rounded bg-[#252836] hover:bg-[#34384a] text-cyan-400 hover:text-white"
                title="Shift -1 semitone"
              >
                <ArrowDown size={13} />
              </button>
            </div>

            <div>
              <span className="text-gray-500">DETECTED PITCH:</span>{' '}
              <span className="text-white font-bold">{selectedSeg.detectedMidi} MIDI</span>
            </div>

            <div>
              <span className="text-gray-500">DEVIATION:</span>{' '}
              <span
                className={`font-bold ${
                  Math.abs(selectedSeg.centDeviation) < 15 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {selectedSeg.centDeviation > 0
                  ? `+${selectedSeg.centDeviation} cents`
                  : `${selectedSeg.centDeviation} cents`}
              </span>
            </div>

            <div>
              <span className="text-gray-500">DURATION:</span>{' '}
              <span className="text-white font-bold">{selectedSeg.duration.toFixed(2)}s</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Click any vocal pitch note block to inspect and transpose</div>
        )}

        <div className="text-[11px] text-gray-500">
          Eve NewTone Engine &bull; Autocorrelation Monophonic Formant Resynthesis
        </div>
      </div>
    </div>
  );
};
