import React, { useEffect, useState } from 'react';
import { useDawStore } from '../store/useDawStore';
import { AudioEngine } from '../audio/AudioEngine';
import { MidiManager } from '../audio/MidiManager';
import { isNoteInScale, NOTE_NAMES, midiToNoteName } from '../audio/Presets';

const KEY_MAP: Record<string, number> = {
  a: 60, // C4
  w: 61, // C#4
  s: 62, // D4
  e: 63, // D#4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4
  g: 67, // G4
  y: 68, // G#4
  h: 69, // A4
  u: 70, // A#4
  j: 71, // B4
  k: 72, // C5
  o: 73, // C#5
  l: 74, // D5
  p: 75, // D#5
  ';': 76, // E5
};

export const VirtualKeyboard: React.FC = () => {
  const [state, store] = useDawStore();
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [octaveShift, setOctaveShift] = useState<number>(0);

  const engine = AudioEngine.getInstance();
  const activeTrack = state.tracks.find((t) => t.id === state.selectedTrackId) || state.tracks[0];

  // Trigger Note
  const triggerNoteOn = (midi: number) => {
    engine.resumeContext();
    const shiftedMidi = midi + octaveShift * 12;
    setActiveNotes((prev) => new Set(prev).add(shiftedMidi));
    const mixerChan = engine.mixer.getChannel(activeTrack.mixerChannelIndex);
    const now = engine.ctx.currentTime;
    if (activeTrack.type === 'instrument' && activeTrack.instrumentId) {
      engine.instrumentEngine.noteOn(activeTrack.instrumentId, shiftedMidi, 0.9, now, mixerChan.inputNode);
    } else {
      engine.synthEngine.noteOn(shiftedMidi, 0.9, now, state.synthParams, mixerChan.inputNode);
    }
  };

  const triggerNoteOff = (midi: number) => {
    const shiftedMidi = midi + octaveShift * 12;
    setActiveNotes((prev) => {
      const copy = new Set(prev);
      copy.delete(shiftedMidi);
      return copy;
    });
    const now = engine.ctx.currentTime;
    if (activeTrack.type === 'instrument' && activeTrack.instrumentId) {
      engine.instrumentEngine.noteOff(activeTrack.instrumentId, shiftedMidi, now);
    } else {
      engine.synthEngine.noteOff(shiftedMidi, now, state.synthParams);
    }
  };

  // Keyboard and MIDI Listeners
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      const key = e.key.toLowerCase();
      if (KEY_MAP[key] !== undefined && !pressedKeys.has(key)) {
        pressedKeys.add(key);
        triggerNoteOn(KEY_MAP[key]);
      } else if (e.code === 'Space') {
        e.preventDefault();
        store.togglePlay();
      } else if (key === 'p') {
        store.setPlaybackMode(state.playbackMode === 'pattern' ? 'song' : 'pattern');
      } else if (key === 'm') {
        store.toggleMetronome();
      } else if (key === '1') {
        store.setActiveView('channelRack');
      } else if (key === '2') {
        store.setActiveView('pianoRoll');
      } else if (key === '3') {
        store.setActiveView('playlist');
      } else if (key === '4') {
        store.setActiveView('mixer');
      } else if (key === '5') {
        store.setActiveView('synth');
      } else if (key === '6') {
        store.setActiveView('looper');
      } else if (key === '7') {
        store.setActiveView('fxRack');
      } else if (key === '8') {
        store.setActiveView('browser');
      } else if (key === '9') {
        store.setActiveView('guitarRig');
      } else if (key === '0') {
        store.setActiveView('vstPatchbay');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (KEY_MAP[key] !== undefined) {
        pressedKeys.delete(key);
        triggerNoteOff(KEY_MAP[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Web MIDI Support
    const midi = MidiManager.getInstance();
    const unsubOn = midi.onNoteOn((note, vel) => {
      engine.resumeContext();
      setActiveNotes((prev) => new Set(prev).add(note));
      const mixerChan = engine.mixer.getChannel(activeTrack.mixerChannelIndex);
      if (activeTrack.type === 'instrument' && activeTrack.instrumentId) {
        engine.instrumentEngine.noteOn(activeTrack.instrumentId, note, vel, engine.ctx.currentTime, mixerChan.inputNode);
      } else {
        engine.synthEngine.noteOn(note, vel, engine.ctx.currentTime, state.synthParams, mixerChan.inputNode);
      }
    });
    const unsubOff = midi.onNoteOff((note) => {
      setActiveNotes((prev) => {
        const copy = new Set(prev);
        copy.delete(note);
        return copy;
      });
      if (activeTrack.type === 'instrument' && activeTrack.instrumentId) {
        engine.instrumentEngine.noteOff(activeTrack.instrumentId, note, engine.ctx.currentTime);
      } else {
        engine.synthEngine.noteOff(note, engine.ctx.currentTime, state.synthParams);
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      unsubOn();
      unsubOff();
    };
  }, [state.synthParams, state.playbackMode, activeTrack, octaveShift]);

  // Keys from C4 (60) to E5 (76)
  const keysRange = Array.from({ length: 17 }, (_, i) => 60 + i);

  return (
    <div className="h-16 bg-[#161821] border-t border-[#292c3a] flex items-center px-4 justify-between select-none">
      {/* Octave Controls */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-gray-400 uppercase">Octave:</span>
        <div className="flex bg-[#101117] rounded border border-[#2b2e3c]">
          <button
            onClick={() => setOctaveShift((prev) => Math.max(-2, prev - 1))}
            className="px-2 py-0.5 text-xs text-gray-400 hover:text-white"
          >
            -
          </button>
          <span className="px-2 py-0.5 text-xs font-mono font-bold text-orange-400">
            {octaveShift > 0 ? `+${octaveShift}` : octaveShift}
          </span>
          <button
            onClick={() => setOctaveShift((prev) => Math.min(2, prev + 1))}
            className="px-2 py-0.5 text-xs text-gray-400 hover:text-white"
          >
            +
          </button>
        </div>
      </div>

      {/* Interactive Piano Keys */}
      <div className="flex items-center h-12 relative max-w-xl flex-1 mx-4 justify-center">
        {keysRange.map((midi) => {
          const shiftedMidi = midi + octaveShift * 12;
          const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
          const inScale = isNoteInScale(shiftedMidi, state.selectedKey, state.selectedScale);
          const isDown = activeNotes.has(shiftedMidi);

          return (
            <button
              key={midi}
              onMouseDown={() => triggerNoteOn(midi)}
              onMouseUp={() => triggerNoteOff(midi)}
              onMouseLeave={() => isDown && triggerNoteOff(midi)}
              className={`h-full rounded-b transition-all relative flex flex-col justify-end pb-1 items-center font-mono ${
                isBlack
                  ? `w-6 h-8 -mx-3 z-10 text-[9px] ${
                      isDown
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-[#181a20] text-gray-400 border border-[#2b2d38] hover:bg-[#252833]'
                    }`
                  : `w-9 z-0 text-[10px] border-r border-[#262835] ${
                      isDown
                        ? 'bg-orange-400 text-white shadow-md'
                        : 'bg-[#292c3a] text-gray-300 hover:bg-[#323646]'
                    }`
              }`}
            >
              {inScale && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mb-0.5 ${
                    isDown ? 'bg-white' : 'bg-orange-500'
                  }`}
                />
              )}
              <span className="text-[9px] opacity-75">{NOTE_NAMES[shiftedMidi % 12]}</span>
            </button>
          );
        })}
      </div>

      {/* MIDI & Keyboard status */}
      <div className="text-right text-[10px] font-mono text-gray-500">
        <div>QWERTY: Keys A - L & W - P</div>
        <div className="text-orange-400/80">Active Synth: {activeTrack.name}</div>
      </div>
    </div>
  );
};
