import React, { useState } from 'react';
import {
  Pencil,
  Eraser,
  Sparkles,
  Trash2,
  Volume2,
  Plus,
  ArrowUp,
  ArrowDown,
  Layers,
  Music,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { PianoNote } from '../types/daw';
import {
  isNoteInScale,
  midiToNoteName,
  CHORD_TEMPLATES,
  NOTE_NAMES,
  SCALE_INTERVALS,
} from '../audio/Presets';
import { AudioEngine } from '../audio/AudioEngine';

export const PianoRoll: React.FC = () => {
  const [state, store] = useDawStore();
  const [activeTool, setActiveTool] = useState<'pencil' | 'eraser' | 'chord'>('pencil');
  const [selectedChordType, setSelectedChordType] = useState<string>('min7');
  const [noteDuration, setNoteDuration] = useState<number>(2); // in 16th steps

  const currentPattern = state.patterns.find((p) => p.id === state.selectedPatternId) || state.patterns[0];
  const activeTrack = state.tracks.find((t) => t.id === state.selectedTrackId) || state.tracks[0];

  // Piano Roll pitch range: C3 (48) up to B5 (83) = 36 semitones
  const lowestMidi = 48; // C3
  const highestMidi = 83; // B5
  const midiRange = Array.from(
    { length: highestMidi - lowestMidi + 1 },
    (_, i) => highestMidi - i // Top to bottom (high pitch to low pitch)
  );

  const totalSteps = currentPattern?.lengthSteps || 16;
  const notes = currentPattern?.notes.filter((n) => n.trackId === activeTrack.id) || [];

  // Audition MIDI note
  const auditionNote = (midiNote: number) => {
    const engine = AudioEngine.getInstance();
    engine.resumeContext();
    const mixerChan = engine.mixer.getChannel(activeTrack.mixerChannelIndex);
    const now = engine.ctx.currentTime;
    engine.synthEngine.noteOn(midiNote, 0.9, now, state.synthParams, mixerChan.inputNode);
    setTimeout(() => {
      engine.synthEngine.noteOff(midiNote, now + 0.35, state.synthParams);
    }, 350);
  };

  // Click on grid cell
  const handleCellClick = (midiNote: number, step: number) => {
    // If Snap to Scale is enabled and note not in scale, find nearest scale note
    let actualMidi = midiNote;
    if (state.snapToScale && !isNoteInScale(midiNote, state.selectedKey, state.selectedScale)) {
      // Snap up or down
      const intervals = SCALE_INTERVALS[state.selectedScale];
      const rootIdx = NOTE_NAMES.indexOf(state.selectedKey);
      for (let offset = 1; offset <= 2; offset++) {
        if (isNoteInScale(midiNote + offset, state.selectedKey, state.selectedScale)) {
          actualMidi = midiNote + offset;
          break;
        } else if (isNoteInScale(midiNote - offset, state.selectedKey, state.selectedScale)) {
          actualMidi = midiNote - offset;
          break;
        }
      }
    }

    if (activeTool === 'eraser') {
      // Find note at this cell
      const target = notes.find(
        (n) => n.midiNote === actualMidi && step >= n.startStep && step < n.startStep + n.durationSteps
      );
      if (target) {
        store.removePianoNote(target.id);
      }
      return;
    }

    if (activeTool === 'chord') {
      // Stamp chord template
      const template = CHORD_TEMPLATES[selectedChordType];
      if (template) {
        template.intervals.forEach((interval) => {
          store.addPianoNote({
            id: `note-chord-${actualMidi + interval}-${step}-${Date.now()}`,
            trackId: activeTrack.id,
            midiNote: actualMidi + interval,
            startStep: step,
            durationSteps: noteDuration,
            velocity: 0.85,
          });
        });
        auditionNote(actualMidi);
      }
      return;
    }

    // Default Pencil: Toggle or Add
    const existing = notes.find(
      (n) => n.midiNote === actualMidi && step >= n.startStep && step < n.startStep + n.durationSteps
    );
    if (existing) {
      store.removePianoNote(existing.id);
    } else {
      store.addPianoNote({
        id: `note-${actualMidi}-${step}-${Date.now()}`,
        trackId: activeTrack.id,
        midiNote: actualMidi,
        startStep: step,
        durationSteps: noteDuration,
        velocity: 0.85,
      });
      auditionNote(actualMidi);
    }
  };

  // Transpose notes
  const handleTranspose = (semitones: number) => {
    if (!currentPattern) return;
    currentPattern.notes = currentPattern.notes.map((n) => {
      if (n.trackId === activeTrack.id) {
        return { ...n, midiNote: Math.max(24, Math.min(108, n.midiNote + semitones)) };
      }
      return n;
    });
    store.syncAudioEngineData();
    store.saveToStorage();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#14151b] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      {/* Piano Roll Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1d25] border-b border-[#2a2d38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-sky-400">
            <Music size={16} />
            <span>Piano Roll</span>
          </div>

          {/* Active Track Selector */}
          <div className="flex items-center gap-1 bg-[#121316] px-2 py-1 rounded border border-[#353945]">
            <span className="text-[10px] text-gray-400 uppercase font-mono">TRACK:</span>
            <select
              value={state.selectedTrackId}
              onChange={(e) => store.setSelectedTrack(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-sky-400 focus:outline-none cursor-pointer"
            >
              {state.tracks.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#181a1f] text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tool Switcher: Draw, Erase, Chord Stamper */}
          <div className="flex items-center bg-[#121316] p-0.5 rounded border border-[#353945]">
            <button
              onClick={() => setActiveTool('pencil')}
              className={`p-1.5 rounded transition-all ${
                activeTool === 'pencil' ? 'bg-sky-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Draw Notes"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-1.5 rounded transition-all ${
                activeTool === 'eraser' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Erase Notes"
            >
              <Eraser size={14} />
            </button>
            <button
              onClick={() => setActiveTool('chord')}
              className={`p-1.5 rounded transition-all ${
                activeTool === 'chord' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Chord Stamper"
            >
              <Layers size={14} />
            </button>
          </div>

          {/* Chord Stamper Dropdown */}
          {activeTool === 'chord' && (
            <select
              value={selectedChordType}
              onChange={(e) => setSelectedChordType(e.target.value)}
              className="bg-[#121316] text-xs font-mono text-purple-400 border border-purple-500/40 px-2 py-1 rounded focus:outline-none cursor-pointer"
            >
              {Object.entries(CHORD_TEMPLATES).map(([key, item]) => (
                <option key={key} value={key} className="bg-[#181a1f] text-white">
                  {item.name}
                </option>
              ))}
            </select>
          )}

          {/* Note Length Selector */}
          <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
            <span>LEN:</span>
            {[1, 2, 4, 8].map((l) => (
              <button
                key={l}
                onClick={() => setNoteDuration(l)}
                className={`px-1.5 py-0.5 rounded text-[11px] ${
                  noteDuration === l
                    ? 'bg-sky-500 text-white font-bold'
                    : 'bg-[#232631] text-gray-400 hover:text-gray-200'
                }`}
              >
                {l}st
              </button>
            ))}
          </div>
        </div>

        {/* Right Tools: Transposition, Randomizer, Clear */}
        <div className="flex items-center gap-2">
          {/* Transpose */}
          <div className="flex items-center bg-[#121316] rounded border border-[#353945]">
            <button
              onClick={() => handleTranspose(12)}
              title="Transpose Up Octave (+12)"
              className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-[#252834] rounded-l flex items-center gap-0.5"
            >
              <ArrowUp size={12} />
              <span>Oct</span>
            </button>
            <button
              onClick={() => handleTranspose(-12)}
              title="Transpose Down Octave (-12)"
              className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-[#252834] rounded-r border-l border-[#353945] flex items-center gap-0.5"
            >
              <ArrowDown size={12} />
              <span>Oct</span>
            </button>
          </div>

          {/* Randomize Melody strictly locked to key */}
          <button
            onClick={() => store.randomizeMelody()}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-semibold transition-all"
          >
            <Sparkles size={13} />
            <span>Scale Melody</span>
          </button>

          {/* Clear Notes */}
          <button
            onClick={() => store.clearPatternNotes()}
            title="Clear Pattern Notes"
            className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Piano Roll Grid Canvas View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Piano Keys Column */}
        <div className="w-24 bg-[#181a22] border-r border-[#2d303b] overflow-y-auto flex flex-col flex-shrink-0">
          {midiRange.map((midi) => {
            const isBlackKey = [1, 3, 6, 8, 10].includes(midi % 12);
            const inScale = isNoteInScale(midi, state.selectedKey, state.selectedScale);
            const noteLabel = midiToNoteName(midi);

            return (
              <button
                key={midi}
                onClick={() => auditionNote(midi)}
                className={`h-6 text-left px-2 flex items-center justify-between border-b text-[10px] font-mono font-bold transition-colors ${
                  isBlackKey
                    ? 'bg-[#1b1d24] text-gray-400 border-[#2b2d38] hover:bg-[#252833]'
                    : 'bg-[#292c38] text-gray-200 border-[#383b4b] hover:bg-[#343847]'
                } ${inScale ? 'border-r-2 border-r-orange-500' : 'opacity-60'}`}
              >
                <span>{noteLabel}</span>
                {inScale && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </button>
            );
          })}
        </div>

        {/* Right: Step Grid Matrix */}
        <div className="flex-1 overflow-auto flex flex-col relative bg-[#12131a]">
          {/* Header Step Numbers */}
          <div className="flex h-6 bg-[#1b1d25] border-b border-[#2a2d38] sticky top-0 z-20">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`flex-1 border-r border-[#2a2d38] text-[9px] font-mono text-center flex items-center justify-center ${
                  i % 4 === 0 ? 'bg-[#242733] font-bold text-orange-400' : 'text-gray-500'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Grid Rows per pitch */}
          <div className="flex flex-col relative">
            {/* Playhead indicator bar */}
            {state.isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-orange-400 shadow-lg shadow-orange-500/50 z-10 pointer-events-none transition-all duration-75"
                style={{
                  left: `${(state.currentStep / totalSteps) * 100}%`,
                }}
              />
            )}

            {midiRange.map((midi) => {
              const inScale = isNoteInScale(midi, state.selectedKey, state.selectedScale);
              const isBlackKey = [1, 3, 6, 8, 10].includes(midi % 12);

              return (
                <div
                  key={midi}
                  className={`flex h-6 border-b ${
                    isBlackKey ? 'bg-[#151720] border-[#222530]' : 'bg-[#181a24] border-[#262936]'
                  } ${!inScale ? 'opacity-40' : ''}`}
                >
                  {Array.from({ length: totalSteps }, (_, step) => {
                    // Check if note exists starting or active at this step
                    const note = notes.find(
                      (n) => n.midiNote === midi && step >= n.startStep && step < n.startStep + n.durationSteps
                    );
                    const isStart = note?.startStep === step;

                    return (
                      <div
                        key={step}
                        onClick={() => handleCellClick(midi, step)}
                        className={`flex-1 border-r cursor-pointer transition-colors relative flex items-center ${
                          step % 4 === 0 ? 'border-r-[#333847]' : 'border-r-[#20232e]'
                        } hover:bg-sky-500/20`}
                      >
                        {note && (
                          <div
                            className={`absolute inset-0 m-0.5 rounded-xs flex items-center px-1 text-[9px] font-mono font-bold text-white shadow-md ${
                              isStart
                                ? 'bg-gradient-to-r from-sky-400 to-sky-600 border-l-2 border-l-white'
                                : 'bg-sky-600/80'
                            }`}
                          >
                            {isStart && midiToNoteName(midi)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Velocity Lane */}
      <div className="h-16 bg-[#161820] border-t border-[#2a2d38] flex items-center px-4">
        <div className="w-24 text-[10px] font-mono text-gray-400 flex items-center gap-1">
          <Volume2 size={12} />
          <span>VELOCITY</span>
        </div>
        <div className="flex-1 flex items-end h-10 gap-1">
          {Array.from({ length: totalSteps }, (_, step) => {
            const stepNotes = notes.filter((n) => n.startStep === step);
            const avgVel = stepNotes.length > 0 ? stepNotes[0].velocity : 0;

            return (
              <div
                key={step}
                className="flex-1 h-full bg-[#1e212b] rounded-t flex items-end p-0.5 relative group"
              >
                {avgVel > 0 && (
                  <div
                    className="w-full bg-gradient-to-t from-sky-500 to-emerald-400 rounded-t shadow-xs"
                    style={{ height: `${avgVel * 100}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
