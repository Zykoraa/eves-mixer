import React, { useRef } from 'react';
import {
  Volume2,
  Plus,
  Trash2,
  Shuffle,
  Music2,
  FolderOpen,
  ChevronRight,
  Sparkles,
  Play,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { ChannelTrack } from '../types/daw';
import { AudioEngine } from '../audio/AudioEngine';

export const ChannelRack: React.FC = () => {
  const [state, store] = useDawStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetSampleTrackId = useRef<string | null>(null);

  const currentPattern = state.patterns.find((p) => p.id === state.selectedPatternId) || state.patterns[0];
  const stepCount = currentPattern?.lengthSteps || 16;

  // Custom audio upload for sampler tracks
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetSampleTrackId.current) return;

    try {
      const { url } = await AudioEngine.getInstance().drumSynth.loadAudioFile(file);
      const track = state.tracks.find((t) => t.id === targetSampleTrackId.current);
      if (track) {
        track.customAudioUrl = url;
        track.customAudioName = file.name;
        track.name = file.name.slice(0, 16);
        store.syncAudioEngineData();
      }
    } catch (err) {
      console.error('Error loading audio file:', err);
    }
  };

  const triggerSampleUpload = (trackId: string) => {
    targetSampleTrackId.current = trackId;
    fileInputRef.current?.click();
  };

  // Add new track
  const handleAddNewTrack = (type: 'drum' | 'synth' | 'instrument' | 'sampler') => {
    const id = `track-${Date.now()}`;
    const newTrack: ChannelTrack = {
      id,
      name:
        type === 'synth'
          ? 'Synth Lead 2'
          : type === 'instrument'
          ? 'Concert Grand Piano'
          : type === 'sampler'
          ? 'Sample Pad'
          : 'Percussion',
      type,
      instrumentId: type === 'instrument' ? 'grand_piano' : undefined,
      soundId: type === 'drum' ? 'rim' : undefined,
      color:
        type === 'synth'
          ? '#ec4899'
          : type === 'instrument'
          ? '#38bdf8'
          : type === 'sampler'
          ? '#22c55e'
          : '#f59e0b',
      volume: 0.85,
      pan: 0,
      mute: false,
      solo: false,
      mixerChannelIndex: type === 'synth' ? 4 : 5,
      steps: {
        [state.selectedPatternId]: Array.from({ length: 16 }, () => ({ active: false, velocity: 0.8 })),
      },
    };
    state.tracks.push(newTrack);
    store.syncAudioEngineData();
    store.saveToStorage();
  };

  // Delete track
  const handleDeleteTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.tracks.length <= 1) return;
    const filtered = state.tracks.filter((t) => t.id !== id);
    state.tracks = filtered;
    store.syncAudioEngineData();
    store.saveToStorage();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#16171d] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      <input type="file" ref={fileInputRef} accept="audio/*" onChange={handleFileUpload} className="hidden" />

      {/* Channel Rack Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1f2129] border-b border-[#2e323a]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-gray-200">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500" />
            <span>Channel Rack</span>
          </div>

          {/* Pattern Selector */}
          <div className="flex items-center gap-1 bg-[#121316] px-2 py-1 rounded border border-[#353945]">
            <span className="text-[10px] text-gray-400 uppercase font-mono">PAT:</span>
            <select
              value={state.selectedPatternId}
              onChange={(e) => store.setSelectedPattern(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-orange-400 focus:outline-none cursor-pointer"
            >
              {state.patterns.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#181a1f] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              const newPatId = `pat-${state.patterns.length + 1}`;
              state.patterns.push({
                id: newPatId,
                name: `Pattern ${state.patterns.length + 1}`,
                color: '#38bdf8',
                lengthSteps: 16,
                notes: [],
              });
              store.setSelectedPattern(newPatId);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#2a2d38] hover:bg-[#383d4c] text-xs font-semibold text-gray-300 hover:text-white transition-all"
          >
            <Plus size={13} />
            <span>New Pat</span>
          </button>
        </div>

        {/* Quick Drum Generator Shortcuts */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => store.applyDrumPreset('trap')}
            className="px-2 py-1 text-[11px] font-mono rounded bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 transition-all flex items-center gap-1"
          >
            <Sparkles size={12} />
            Trap
          </button>
          <button
            onClick={() => store.applyDrumPreset('drill')}
            className="px-2 py-1 text-[11px] font-mono rounded bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 transition-all flex items-center gap-1"
          >
            <Sparkles size={12} />
            Drill
          </button>
          <button
            onClick={() => store.applyDrumPreset('boomBap')}
            className="px-2 py-1 text-[11px] font-mono rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 transition-all flex items-center gap-1"
          >
            <Sparkles size={12} />
            Boom Bap
          </button>
          <button
            onClick={() => store.applyDrumPreset('synthwave')}
            className="px-2 py-1 text-[11px] font-mono rounded bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 border border-pink-500/30 transition-all flex items-center gap-1"
          >
            <Sparkles size={12} />
            Synthwave
          </button>
          <button
            onClick={() => store.applyDrumPreset('house')}
            className="px-2 py-1 text-[11px] font-mono rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 transition-all flex items-center gap-1"
          >
            <Sparkles size={12} />
            House 4/4
          </button>
          <button
            onClick={() => store.applyDrumPreset('phonk')}
            className="px-2 py-1 text-[11px] font-mono rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-all flex items-center gap-1"
          >
            <Sparkles size={12} />
            Phonk
          </button>
          <button
            onClick={() => store.resetToProDemo()}
            title="Reload high-quality default pro trap beat"
            className="px-2 py-1 text-[11px] font-mono rounded bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 transition-all flex items-center gap-1 ml-auto"
          >
            <RotateCcw size={11} />
            Reset Pro Beat
          </button>
        </div>
      </div>

      {/* Step Sequencer Grid Rows */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
        {state.tracks.map((track) => {
          const trackSteps = track.steps[state.selectedPatternId] || [];

          return (
            <div
              key={track.id}
              className={`flex items-center gap-2 p-1.5 rounded-md transition-colors border ${
                state.selectedTrackId === track.id
                  ? 'bg-[#222530] border-[#424858]'
                  : 'bg-[#1b1c24] border-[#292c37] hover:bg-[#20222c]'
              }`}
            >
              {/* Mute & Solo LEDs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    track.mute = !track.mute;
                    store.syncAudioEngineData();
                  }}
                  title="Mute Track"
                  className={`w-4 h-4 rounded-xs text-[9px] font-bold font-mono flex items-center justify-center transition-all ${
                    track.mute
                      ? 'bg-red-500 text-white shadow-xs shadow-red-500'
                      : 'bg-[#2d313d] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => {
                    track.solo = !track.solo;
                    store.syncAudioEngineData();
                  }}
                  title="Solo Track"
                  className={`w-4 h-4 rounded-xs text-[9px] font-bold font-mono flex items-center justify-center transition-all ${
                    track.solo
                      ? 'bg-orange-500 text-white shadow-xs shadow-orange-500'
                      : 'bg-[#2d313d] text-gray-500 hover:text-gray-300'
                  }`}
                >
                  S
                </button>
              </div>

              {/* Volume & Pan Faders */}
              <div className="flex items-center gap-1">
                <div title={`Volume: ${Math.round(track.volume * 100)}%`} className="flex flex-col items-center">
                  <input
                    type="range"
                    min="0"
                    max="1.2"
                    step="0.05"
                    value={track.volume}
                    onChange={(e) => {
                      track.volume = parseFloat(e.target.value);
                      store.syncAudioEngineData();
                    }}
                    className="w-12 h-1.5 bg-[#2d313d] accent-orange-500 rounded cursor-pointer"
                  />
                </div>
                <div title={`Pan: ${track.pan}`} className="flex flex-col items-center">
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={track.pan}
                    onChange={(e) => {
                      track.pan = parseFloat(e.target.value);
                      store.syncAudioEngineData();
                    }}
                    className="w-10 h-1.5 bg-[#2d313d] accent-sky-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Channel Name Button (Click to Audition, Double Click for Piano Roll) */}
              <button
                onClick={() => {
                  store.setSelectedTrack(track.id);
                  store.auditionTrack(track);
                }}
                onDoubleClick={() => {
                  store.setSelectedTrack(track.id);
                  store.setActiveView('pianoRoll');
                }}
                className="flex items-center justify-between w-40 px-2.5 py-1 rounded bg-[#262935] hover:bg-[#313545] border border-[#3b4050] text-left group transition-all"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: track.color }} />
                  <span className="text-xs font-bold text-gray-200 group-hover:text-white truncate">
                    {track.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#181a20] text-gray-400">
                  {track.type === 'synth' ? 'SYNTH' : track.type === 'instrument' ? 'INST' : track.type === 'sampler' ? 'SMP' : 'DRUM'}
                </span>
              </button>

              {/* Mixer Channel Assignment */}
              <button
                onClick={() => {
                  store.setSelectedMixerChannel(track.mixerChannelIndex);
                  store.setActiveView('mixer');
                }}
                title="Assigned Mixer Track"
                className="px-1.5 py-0.5 rounded bg-[#1c1e26] border border-[#2f3342] text-[10px] font-mono font-bold text-sky-400 hover:text-white hover:bg-sky-500/20"
              >
                {track.mixerChannelIndex === 0 ? 'M' : `CH${track.mixerChannelIndex}`}
              </button>

              {/* Step Sequencer Buttons (16/32 steps, grouped in 4-step blocks) */}
              <div className="flex items-center gap-1 ml-1 flex-1">
                {Array.from({ length: stepCount }, (_, stepIdx) => {
                  const step = trackSteps[stepIdx];
                  const isActive = step?.active ?? false;
                  const isCurrent = state.isPlaying && state.currentStep === stepIdx;

                  // 4-step alternating background color (FL Studio design)
                  const isAltGroup = Math.floor(stepIdx / 4) % 2 === 1;

                  return (
                    <button
                      key={stepIdx}
                      onClick={() => store.toggleStep(track.id, stepIdx)}
                      className={`h-7 flex-1 min-w-[20px] rounded-xs border transition-all duration-75 relative flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-white z-10 scale-105'
                          : ''
                      } ${
                        isActive
                          ? 'bg-gradient-to-b from-orange-400 to-orange-600 border-orange-300 shadow-md shadow-orange-500/40'
                          : isAltGroup
                          ? 'bg-[#2f3340] border-[#3f4557] hover:bg-[#3d4253]'
                          : 'bg-[#222530] border-[#313645] hover:bg-[#2d3140]'
                      }`}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white" />
                      )}
                      {stepIdx % 4 === 0 && !isActive && (
                        <div className="w-1 h-1 rounded-full bg-gray-500 opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sampler Upload / Edit Action */}
              {track.type === 'sampler' && (
                <button
                  onClick={() => triggerSampleUpload(track.id)}
                  title="Load Custom WAV/MP3 Sample"
                  className="p-1 rounded bg-[#282b37] hover:bg-[#373b4c] text-emerald-400 hover:text-white transition-all"
                >
                  <FolderOpen size={13} />
                </button>
              )}

              {/* Quick Piano Roll Link */}
              <button
                onClick={() => {
                  store.setSelectedTrack(track.id);
                  store.setActiveView('pianoRoll');
                }}
                title="Open in Piano Roll"
                className="p-1 rounded bg-[#282b37] hover:bg-[#373b4c] text-sky-400 hover:text-white transition-all"
              >
                <Music2 size={13} />
              </button>

              {/* Delete Track */}
              <button
                onClick={(e) => handleDeleteTrack(track.id, e)}
                title="Delete Track"
                className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar: Add Instruments / Drums / Sampler */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1d25] border-t border-[#2a2d38]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddNewTrack('instrument')}
            className="px-2 py-1 text-xs font-semibold rounded bg-[#282b37] hover:bg-[#35394a] text-sky-400 hover:text-white border border-[#383d4f] flex items-center gap-1 transition-all"
          >
            <Plus size={13} />
            Instrument
          </button>
          <button
            onClick={() => handleAddNewTrack('drum')}
            className="px-2 py-1 text-xs font-semibold rounded bg-[#282b37] hover:bg-[#35394a] text-orange-400 hover:text-white border border-[#383d4f] flex items-center gap-1 transition-all"
          >
            <Plus size={13} />
            Drum Voice
          </button>
          <button
            onClick={() => handleAddNewTrack('synth')}
            className="px-2 py-1 text-xs font-semibold rounded bg-[#282b37] hover:bg-[#35394a] text-pink-400 hover:text-white border border-[#383d4f] flex items-center gap-1 transition-all"
          >
            <Plus size={13} />
            Synth Track
          </button>
          <button
            onClick={() => handleAddNewTrack('sampler')}
            className="px-2 py-1 text-xs font-semibold rounded bg-[#282b37] hover:bg-[#35394a] text-emerald-400 hover:text-white border border-[#383d4f] flex items-center gap-1 transition-all"
          >
            <Plus size={13} />
            Audio Sampler
          </button>
          <button
            onClick={() => store.setActiveView('browser')}
            className="px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Compass size={13} />
            <span>Sound Library (40+ Sounds)</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-500 font-mono">
          Tip: Click Sound Library to browse &amp; audition 40+ presets
        </div>
      </div>
    </div>
  );
};
