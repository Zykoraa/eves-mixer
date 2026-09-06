import React, { useState, useCallback, useRef } from 'react';
import {
  Music,
  X,
  Play,
  Square,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { ChordArchitect } from '../audio/ChordArchitect';
import { AudioEngine } from '../audio/AudioEngine';
import { ChordProgressionTemplate, VoicedChord } from '../types/daw';
import { midiToNoteName } from '../audio/Presets';

interface ChordArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChordArchitectModal: React.FC<ChordArchitectModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();
  const architect = ChordArchitect.getInstance();
  const audioEngine = AudioEngine.getInstance();

  const [selectedTemplate, setSelectedTemplate] = useState<ChordProgressionTemplate>(
    ChordArchitect.PROGRESSIONS[0]
  );
  const [enableVoiceLeading, setEnableVoiceLeading] = useState(true);
  const [strumSpeedMs, setStrumSpeedMs] = useState(20);
  const [baseOctave, setBaseOctave] = useState(4); // C4
  const [isPlaying, setIsPlaying] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const activeTrack = state.tracks.find((t) => t.id === state.selectedTrackId) || state.tracks[0];
  const stopAuditionRef = useRef<(() => void) | null>(null);

  // Generate current voiced chords based on selections
  const voicedChords: VoicedChord[] = architect.generateVoicedChords(
    selectedTemplate,
    state.selectedKey,
    baseOctave,
    enableVoiceLeading
  );

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (stopAuditionRef.current) {
      stopAuditionRef.current();
      stopAuditionRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Audition voiced progression
  const auditionProgression = useCallback(() => {
    stopPlayback();
    audioEngine.resumeContext();
    setIsPlaying(true);

    const stepSec = (60 / state.bpm) / 4;
    const mixerChan = audioEngine.mixer.getChannel(activeTrack.mixerChannelIndex);
    const timeouts: number[] = [];

    let curStep = 0;
    voicedChords.forEach((chord) => {
      const chordDelay = curStep * stepSec * 1000;

      const tId = window.setTimeout(() => {
        chord.midiNotes.forEach((midi, i) => {
          const strumDelay = (i * strumSpeedMs) / 1000;
          const now = audioEngine.ctx.currentTime + strumDelay;
          const dur = (chord.durationSteps * stepSec) * 0.9;

          if (activeTrack.type === 'instrument' && activeTrack.instrumentId) {
            audioEngine.instrumentEngine.noteOn(activeTrack.instrumentId, midi, 0.85, now, mixerChan.inputNode);
            audioEngine.instrumentEngine.noteOff(activeTrack.instrumentId, midi, now + dur);
          } else {
            audioEngine.synthEngine.noteOn(midi, 0.85, now, state.synthParams, mixerChan.inputNode);
            audioEngine.synthEngine.noteOff(midi, now + dur, state.synthParams);
          }
        });
      }, chordDelay);

      timeouts.push(tId);
      curStep += chord.durationSteps;
    });

    const totalDur = curStep * stepSec * 1000;
    const endTimer = window.setTimeout(() => {
      setIsPlaying(false);
    }, totalDur + 300);
    timeouts.push(endTimer);

    stopAuditionRef.current = () => {
      timeouts.forEach((t) => clearTimeout(t));
      audioEngine.synthEngine.stopAllVoices();
    };
  }, [audioEngine, activeTrack, voicedChords, state.bpm, state.synthParams, strumSpeedMs, stopPlayback]);

  // Dump chords into Piano Roll
  const sendToPianoRoll = () => {
    store.applyVoicedChordsToPianoRoll(voicedChords, activeTrack.id, 0, strumSpeedMs);
    setNotification(`Pushed ${voicedChords.length} voiced chords into Piano Roll!`);
    setTimeout(() => {
      setNotification(null);
      onClose();
      store.setActiveView('pianoRoll');
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#151722] border border-[#34394e] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1e2230] border-b border-[#2b3144]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Music size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Chord Progression Architect</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/40">
                  SCALER 2 ENGINE
                </span>
              </div>
              <p className="text-xs text-gray-400">Harmonic Progressions, Roman Numerals & Optimal Voice-Leading Solver</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopPlayback();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-[#2b3144] text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Notification */}
          {notification && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-300">
              <CheckCircle2 size={16} />
              <span>{notification}</span>
            </div>
          )}

          {/* Genre Progression Selection Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-gray-400 font-bold uppercase">Curated Harmonic Progressions:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ChordArchitect.PROGRESSIONS.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => setSelectedTemplate(prog)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate.id === prog.id
                      ? 'bg-purple-600/25 border-purple-500/60 shadow-md text-white'
                      : 'bg-[#1a1c26] border-[#292c3a] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-purple-300">{prog.name}</span>
                    <span className="text-[9px] px-1 rounded bg-[#272b3c] text-gray-400 font-mono uppercase">
                      {prog.genre}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 line-clamp-2">{prog.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voiced Chord Cards View */}
          <div className="bg-[#10121a] p-4 rounded-xl border border-[#272b3c] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-300 font-bold">
                CHORD BLOCKS IN KEY OF {state.selectedKey} {state.selectedScale.toUpperCase()}:
              </span>
              <span className="text-purple-400 font-bold">
                {enableVoiceLeading ? 'SMART VOICE LEADING (MINIMAL TRAVEL)' : 'ROOT POSITIONS'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {voicedChords.map((chord, i) => (
                <div
                  key={i}
                  className="bg-[#1b1e2a] border border-[#2e344a] p-3 rounded-lg flex flex-col justify-between space-y-2 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-purple-400">{chord.name}</span>
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {chord.romanNumeral}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[10px] text-gray-400 font-mono">Voiced Notes:</div>
                    <div className="flex flex-wrap gap-1">
                      {chord.midiNotes.map((n) => (
                        <span
                          key={n}
                          className="px-1 py-0.2 rounded bg-[#272d3e] text-[9px] font-mono text-cyan-300 font-bold"
                        >
                          {midiToNoteName(n)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Parameters: Voice Leading & Strumming */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#191c28] p-4 rounded-xl border border-[#2c3144]">
            {/* Smart Voice Leading Toggle */}
            <div className="flex items-center justify-between p-2 bg-[#12141c] rounded-lg border border-[#242838]">
              <div>
                <div className="text-xs font-mono font-bold text-gray-200">Optimal Voice Leading</div>
                <div className="text-[10px] text-gray-400">Inverts chords to minimize pitch distance</div>
              </div>
              <button
                onClick={() => setEnableVoiceLeading(!enableVoiceLeading)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  enableVoiceLeading
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-[#242838] text-gray-400 hover:text-white'
                }`}
              >
                {enableVoiceLeading ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Base Register Octave */}
            <div className="flex items-center justify-between p-2 bg-[#12141c] rounded-lg border border-[#242838]">
              <span className="text-xs font-mono font-bold text-gray-200">Register Octave:</span>
              <div className="flex bg-[#1b1f2c] rounded border border-[#2f3548]">
                {[3, 4, 5].map((oct) => (
                  <button
                    key={oct}
                    onClick={() => setBaseOctave(oct)}
                    className={`px-3 py-0.5 text-xs font-mono font-bold transition-all ${
                      baseOctave === oct
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Oct {oct}
                  </button>
                ))}
              </div>
            </div>

            {/* Strum & Humanize */}
            <div className="sm:col-span-2 space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-300 font-bold flex items-center gap-1.5">
                  <Sliders size={13} className="text-purple-400" />
                  <span>Strumming & Micro-Timing Jitter:</span>
                </span>
                <span className="text-purple-400 font-bold">
                  {strumSpeedMs === 0 ? 'Off (Block Chord)' : `${strumSpeedMs} ms / note`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={2}
                value={strumSpeedMs}
                onChange={(e) => setStrumSpeedMs(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons: Audition & Send to Piano Roll */}
          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? stopPlayback : auditionProgression}
              className="flex-1 py-2.5 rounded-lg bg-[#272c3d] hover:bg-[#343b52] text-white font-bold text-xs font-mono flex items-center justify-center gap-2 border border-[#3e4662] transition-all"
            >
              {isPlaying ? <Square size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Stop Progression' : `Audition with ${activeTrack.name}`}</span>
            </button>

            <button
              onClick={sendToPianoRoll}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
            >
              <span>Send Progression to Piano Roll</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
