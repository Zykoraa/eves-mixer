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
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { NOTE_NAMES, SCALE_INTERVALS } from '../audio/Presets';
import { RootNote, MusicalScale, ViewTab } from '../types/daw';

interface HeaderProps {
  onOpenInspiration: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInspiration,
  onOpenExport,
  onOpenShortcuts,
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

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'channelRack', label: 'Channel Rack', icon: <Grid size={15} />, color: 'text-orange-400' },
    { id: 'pianoRoll', label: 'Piano Roll', icon: <Music size={15} />, color: 'text-sky-400' },
    { id: 'playlist', label: 'Playlist', icon: <Layers size={15} />, color: 'text-purple-400' },
    { id: 'mixer', label: 'Mixer', icon: <Sliders size={15} />, color: 'text-emerald-400' },
    { id: 'synth', label: 'EveSynth', icon: <Cpu size={15} />, color: 'text-pink-400' },
    { id: 'looper', label: 'LoopStation', icon: <Mic size={15} />, color: 'text-yellow-400' },
    { id: 'fxRack', label: 'FX Rack', icon: <Activity size={15} />, color: 'text-cyan-400' },
  ];

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
                PRO DAW
              </span>
            </div>
            <p className="text-[10px] text-gray-400 -mt-0.5 tracking-wide">FL Studio Inspired Workstation</p>
          </div>
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

        {/* Transport Buttons: Play, Stop, Metronome */}
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
