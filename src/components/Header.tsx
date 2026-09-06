import React, { useState } from 'react';
import {
  Play,
  Square,
  Repeat,
  Volume2,
  Sparkles,
  Download,
  FolderOpen,
  Save,
  HelpCircle,
  Radio,
  Sliders,
  Music,
  Grid,
  Mic,
  Activity,
  Layers,
  Cpu,
  Compass,
  Guitar,
  Plug,
  Search,
  Scissors,
  Stethoscope,
  Circle,
  Zap,
  HardDrive,
  Disc,
  Flame,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { NOTE_NAMES, SCALE_INTERVALS } from '../audio/Presets';
import { RootNote, MusicalScale, ViewTab } from '../types/daw';
import { MidiExporter } from '../audio/MidiExporter';

interface HeaderProps {
  onOpenInspiration: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  onOpenSearch: () => void;
  onOpenGrossBeat: () => void;
  onOpenStemSeparator: () => void;
  onOpenProjectLibrary: () => void;
  onOpenMastering?: () => void;
  onOpenTapeColor?: () => void;
  onOpenBeatbox?: () => void;
  onOpenChordArchitect?: () => void;
  onOpenGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInspiration,
  onOpenExport,
  onOpenShortcuts,
  onOpenSearch,
  onOpenGrossBeat,
  onOpenStemSeparator,
  onOpenProjectLibrary,
  onOpenMastering,
  onOpenTapeColor,
  onOpenBeatbox,
  onOpenChordArchitect,
  onOpenGuide,
}) => {
  const [state, store] = useDawStore();
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Tap tempo handler
  const handleTapTempo = () => {
    const now = performance.now();
    const recentTaps = [...tapTimes.filter((t) => now - t < 3000), now];
    setTapTimes(recentTaps);

    if (recentTaps.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < recentTaps.length; i++) {
        intervals.push(recentTaps[i] - recentTaps[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgMs);
      if (calculatedBpm >= 40 && calculatedBpm <= 260) {
        store.setBpm(calculatedBpm);
      }
    }
  };

  // Save project file (JSON)
  const handleSaveProject = () => {
    const data = {
      projectName: state.projectName,
      bpm: state.bpm,
      swing: state.swing,
      selectedKey: state.selectedKey,
      selectedScale: state.selectedScale,
      tracks: state.tracks,
      patterns: state.patterns,
      clips: state.clips,
      synthParams: state.synthParams,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectName.toLowerCase().replace(/\s+/g, '-')}.evesmixer`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load project file
  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tracks && json.patterns) {
          localStorage.setItem('eves_mixer_saved_state', JSON.stringify(json));
          window.location.reload();
        }
      } catch (err) {
        alert('Invalid project file.');
      }
    };
    reader.readAsText(file);
  };

  const simpleNavItems: { id: ViewTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'channelRack', label: '1. Drums & Beat', icon: <Grid size={15} />, color: 'text-orange-400' },
    { id: 'pianoRoll', label: '2. Melody & Chords', icon: <Music size={15} />, color: 'text-sky-400' },
    { id: 'playlist', label: '3. Song Arranger', icon: <Layers size={15} />, color: 'text-purple-400' },
  ];

  const proNavItems: { id: ViewTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'channelRack', label: 'Channel Rack', icon: <Grid size={15} />, color: 'text-orange-400' },
    { id: 'pianoRoll', label: 'Piano Roll', icon: <Music size={15} />, color: 'text-sky-400' },
    { id: 'playlist', label: 'Playlist', icon: <Layers size={15} />, color: 'text-purple-400' },
    { id: 'mixer', label: 'Mixer', icon: <Sliders size={15} />, color: 'text-emerald-400' },
    { id: 'newTone', label: 'NewTone', icon: <Mic size={15} />, color: 'text-cyan-400' },
    { id: 'synth', label: 'EveSynth', icon: <Cpu size={15} />, color: 'text-pink-400' },
    { id: 'looper', label: 'LoopStation', icon: <Radio size={15} />, color: 'text-yellow-400' },
    { id: 'fxRack', label: 'FX Rack', icon: <Activity size={15} />, color: 'text-cyan-400' },
    { id: 'browser', label: 'Sounds', icon: <Compass size={15} />, color: 'text-amber-400' },
    { id: 'guitarRig', label: 'Guitar Rig', icon: <Guitar size={15} />, color: 'text-red-400' },
    { id: 'vstPatchbay', label: 'VST Host', icon: <Plug size={15} />, color: 'text-indigo-400' },
    { id: 'slicex', label: 'Slicex', icon: <Scissors size={15} />, color: 'text-amber-400' },
    { id: 'mixingDoctor', label: 'Doctor', icon: <Stethoscope size={15} />, color: 'text-teal-400' },
    { id: 'midiLearn', label: 'MIDI Learn', icon: <Sliders size={15} />, color: 'text-cyan-400' },
  ];

  const navItems = state.simpleMode ? simpleNavItems : proNavItems;

  return (
    <header className="bg-[#181a1f] border-b border-[#2e323b] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-lg select-none z-30">
      {/* Brand & Transport Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Radio size={18} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">Eve's Mixer</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono font-bold border border-orange-500/30">
                {state.simpleMode ? 'EASY BEAT' : 'PRO DAW'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 -mt-0.5 tracking-wide">
              {state.simpleMode ? 'Simple Beatmaker' : 'FL Studio Inspired Workstation'}
            </p>
          </div>
        </div>

        {/* Mode Switch: Simple vs Pro Studio */}
        <div className="flex items-center bg-[#101217] p-0.5 rounded-lg border border-[#353945]">
          <button
            onClick={() => store.setSimpleMode(true)}
            title="Clean, easy-to-use mode for fast beatmaking"
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              state.simpleMode
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles size={12} className={state.simpleMode ? 'text-yellow-300' : ''} />
            <span>Simple</span>
          </button>
          <button
            onClick={() => store.setSimpleMode(false)}
            title="Full advanced workstation with all tools, VSTs and routing"
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              !state.simpleMode
                ? 'bg-[#272a38] text-white border border-[#444a5e] shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sliders size={12} />
            <span>Pro</span>
          </button>
        </div>

        {/* FL Studio Mode Switch: PAT / SONG */}
        <div className="flex items-center bg-[#121316] p-0.5 rounded-md border border-[#353945]">
          <button
            onClick={() => store.setPlaybackMode('pattern')}
            className={`px-2.5 py-1 text-xs font-bold font-mono rounded transition-all flex items-center gap-1 ${
              state.playbackMode === 'pattern'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${state.playbackMode === 'pattern' ? 'bg-white animate-ping' : 'bg-gray-600'}`} />
            PAT
          </button>
          <button
            onClick={() => store.setPlaybackMode('song')}
            className={`px-2.5 py-1 text-xs font-bold font-mono rounded transition-all flex items-center gap-1 ${
              state.playbackMode === 'song'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${state.playbackMode === 'song' ? 'bg-white animate-ping' : 'bg-gray-600'}`} />
            SONG
          </button>
        </div>

        {/* Transport Buttons: Play, Record, Stop, Metronome */}
        <div className="flex items-center gap-1 bg-[#121316] p-1 rounded-md border border-[#353945]">
          <button
            onClick={() => store.togglePlay()}
            title="Play / Pause (Space)"
            className={`w-9 h-8 rounded flex items-center justify-center transition-all ${
              state.isPlaying
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 ring-1 ring-emerald-400'
                : 'hover:bg-[#272a33] text-gray-300 hover:text-white'
            }`}
          >
            <Play size={16} fill={state.isPlaying ? 'currentColor' : 'none'} />
          </button>

          {/* DAW Transport Record Button */}
          <button
            onClick={() => store.toggleRecordArm()}
            title={
              state.isRecording
                ? 'Recording active (Click to stop)'
                : state.isRecordArmed
                ? 'Record armed (Play to record)'
                : 'Arm Recording'
            }
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
              state.isRecording
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse ring-2 ring-red-400'
                : state.isRecordArmed
                ? 'bg-red-600/30 text-red-400 border border-red-500'
                : 'hover:bg-[#272a33] text-gray-400 hover:text-red-400'
            }`}
          >
            <Circle size={14} fill={state.isRecording || state.isRecordArmed ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => store.stopPlayback()}
            title="Stop Playback"
            className="w-8 h-8 rounded flex items-center justify-center hover:bg-[#272a33] text-gray-400 hover:text-white transition-all"
          >
            <Square size={14} fill="currentColor" />
          </button>

          <button
            onClick={() => store.toggleMetronome()}
            title="Metronome Click"
            className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold font-mono transition-all ${
              state.metronome
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Volume2 size={15} />
          </button>
        </div>

        {/* BPM & Swing LED Box */}
        <div className="flex items-center gap-2 bg-[#121316] px-3 py-1 rounded-md border border-[#353945]">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">TEMPO</div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={40}
                max={260}
                value={state.bpm}
                onChange={(e) => store.setBpm(Number(e.target.value))}
                className="w-14 bg-transparent text-emerald-400 font-mono text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
              />
              <span className="text-[10px] text-gray-500 font-mono">BPM</span>
            </div>
          </div>

          <button
            onClick={handleTapTempo}
            title="Click repeatedly to tap tempo"
            className="px-1.5 py-1 text-[10px] font-mono font-bold uppercase rounded bg-[#272a33] hover:bg-[#353945] text-gray-300 hover:text-white transition-all"
          >
            TAP
          </button>

          <div className="h-6 w-px bg-[#353945] mx-1" />

          {/* Bar / Beat Counter */}
          <div className="text-left font-mono">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">POSITION</div>
            <div className="text-sm font-bold text-orange-400">
              {String(state.currentBar + 1).padStart(2, '0')}:
              {String(Math.floor(state.currentStep / 4) + 1).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>

      {/* Center: DAW Navigation Views */}
      <nav className="flex items-center gap-1 bg-[#121316] p-1 rounded-lg border border-[#353945]">
        {navItems.map((item) => {
          const isActive = state.activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => store.setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#272a33] text-white shadow-sm border border-[#3e4352]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1c22]'
              }`}
            >
              <span className={isActive ? item.color : 'text-gray-500'}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'looper' && state.isMicActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Key/Scale lock + Creative & Export Actions */}
      <div className="flex items-center gap-2">
        {/* Musical Scale & Key Locking */}
        <div className="flex items-center gap-1 bg-[#121316] px-2 py-1 rounded-md border border-[#353945]">
          <select
            value={state.selectedKey}
            onChange={(e) => store.setKey(e.target.value as RootNote)}
            className="bg-transparent text-xs font-mono font-bold text-orange-400 focus:outline-none cursor-pointer"
          >
            {NOTE_NAMES.map((k) => (
              <option key={k} value={k} className="bg-[#181a1f] text-white">
                {k}
              </option>
            ))}
          </select>
          <select
            value={state.selectedScale}
            onChange={(e) => store.setScale(e.target.value as MusicalScale)}
            className="bg-transparent text-xs font-mono text-gray-300 focus:outline-none cursor-pointer capitalize"
          >
            {Object.keys(SCALE_INTERVALS).map((s) => (
              <option key={s} value={s} className="bg-[#181a1f] text-white">
                {s.replace(/([A-Z])/g, ' $1')}
              </option>
            ))}
          </select>
          <button
            onClick={() => store.toggleSnapToScale()}
            title="Snap to Key (Prevent wrong notes!)"
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase transition-all ${
              state.snapToScale
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            LOCK
          </button>
        </div>

        {state.simpleMode ? (
          <>
            {/* Quick 30-Sec Guide */}
            {onOpenGuide && (
              <button
                onClick={onOpenGuide}
                title="Simple 30-Second Guide: How to make a beat"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <HelpCircle size={14} className="text-sky-400" />
                <span>Quick Guide</span>
              </button>
            )}

            {/* 1-Click Trap Beat Demo */}
            <button
              onClick={() => store.loadSampleTrapBeat()}
              title="Load Complete Sample Trap Beat"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Flame size={14} className="text-yellow-300" />
              <span>Trap Beat</span>
            </button>

            {/* Make Chords */}
            {onOpenChordArchitect && (
              <button
                onClick={onOpenChordArchitect}
                title="Make chords without music theory"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Music size={14} />
                <span>Chords</span>
              </button>
            )}

            {/* Export Song */}
            <button
              onClick={onOpenExport}
              title="Export Song (WAV / MP3)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </>
        ) : (
          <>
            {/* Universal Search Button (Ctrl+K) */}
            <button
              onClick={onOpenSearch}
              title="Quick Search Instruments, VSTs, Amps & Actions (Ctrl+K)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#141620] hover:bg-[#202330] border border-[#34384a] text-xs font-mono text-gray-300 hover:text-white transition-all shadow-xs group"
            >
              <Search size={14} className="text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="hidden xl:inline text-gray-300">Search</span>
              <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-[#252838] text-[9px] font-bold text-gray-400 border border-[#383d54]">
                Ctrl+K
              </kbd>
            </button>

            {/* Eve Gross Beat Quick Access */}
            <button
              onClick={onOpenGrossBeat}
              title="Eve Gross Beat (Time-Glitch FX Unit)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
            >
              <Zap size={14} />
              <span className="hidden lg:inline">Gross Beat</span>
            </button>

            {/* AI Stem Separator Quick Access */}
            <button
              onClick={onOpenStemSeparator}
              title="AI 4-Stem Audio Separator"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
            >
              <Layers size={14} />
              <span className="hidden lg:inline">Stems</span>
            </button>

            {/* IndexedDB Project Library */}
            <button
              onClick={onOpenProjectLibrary}
              title="Project Library (IndexedDB Storage)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
            >
              <HardDrive size={14} />
              <span className="hidden lg:inline">Library</span>
            </button>

            {/* Radio Mastering Suite (LUFS) */}
            {onOpenMastering && (
              <button
                onClick={onOpenMastering}
                title="Eve Maximizer & Mastering Suite (BS.1770-4 LUFS)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
              >
                <Sliders size={14} />
                <span className="hidden lg:inline">Master</span>
              </button>
            )}

            {/* Vintage Tape & Vinyl Color */}
            {onOpenTapeColor && (
              <button
                onClick={onOpenTapeColor}
                title="Eve Tape Color & Vinyl Texture (RC-20 Style)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
              >
                <Disc size={14} />
                <span className="hidden lg:inline">Tape FX</span>
              </button>
            )}

            {/* AI Beatbox-to-Drums */}
            {onOpenBeatbox && (
              <button
                onClick={onOpenBeatbox}
                title="AI Beatbox-to-MIDI Drum Transcriber"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
              >
                <Mic size={14} />
                <span className="hidden lg:inline">Beatbox</span>
              </button>
            )}

            {/* Scaler Chord Architect */}
            {onOpenChordArchitect && (
              <button
                onClick={onOpenChordArchitect}
                title="Chord Progression Architect & Smart Voice Leading"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
              >
                <Music size={14} />
                <span className="hidden lg:inline">Chords</span>
              </button>
            )}

            {/* Standard Multi-Track MIDI Export */}
            <button
              onClick={() => MidiExporter.downloadMidi(state.projectName, state.bpm, state.tracks, state.patterns)}
              title="Export Standard Multi-Track MIDI (.MID)"
              className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-[#222533] hover:bg-[#2d3144] border border-[#393e54] text-sky-300 hover:text-white text-xs font-mono font-bold transition-all shadow-xs"
            >
              <Music size={13} />
              <span className="hidden lg:inline">.MID</span>
            </button>

            {/* 1-Click Trap Beat Demo */}
            <button
              onClick={() => store.loadSampleTrapBeat()}
              title="Load Complete Sample Trap Beat (Punchy Kick, 808 Slides, Fast Hats & Dark Melody)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all hover:scale-105"
            >
              <Flame size={14} className="text-yellow-300" />
              <span>Trap Beat</span>
            </button>

            {/* Inspiration Generator Button */}
            <button
              onClick={onOpenInspiration}
              title="Inspiration Engine (Chords, Beats & AI Melodies)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all hover:scale-105"
            >
              <Sparkles size={14} className="animate-spin text-yellow-300" />
              <span>Inspiration</span>
            </button>

            {/* Export Song */}
            <button
              onClick={onOpenExport}
              title="Export Song (WAV / Stems)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </>
        )}

        {/* Project Save / Load */}
        <button
          onClick={handleSaveProject}
          title="Save Project (.evesmixer)"
          className="p-1.5 rounded hover:bg-[#272a33] text-gray-400 hover:text-white transition-all"
        >
          <Save size={16} />
        </button>

        <label
          title="Open Project"
          className="p-1.5 rounded hover:bg-[#272a33] text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <FolderOpen size={16} />
          <input type="file" accept=".evesmixer,.json" onChange={handleLoadProject} className="hidden" />
        </label>

        {/* Shortcuts / Help */}
        <button
          onClick={onOpenShortcuts}
          title="Shortcuts & Tips"
          className="p-1.5 rounded hover:bg-[#272a33] text-gray-400 hover:text-white transition-all"
        >
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
