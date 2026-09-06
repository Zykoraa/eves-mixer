import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Music,
  Mic,
  Play,
  Scissors,
  TrendingUp,
  Circle,
  Radio,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { PlaylistClip, AutomationTargetType } from '../types/daw';
import { AutomationCurveClip } from './AutomationCurveClip';
import { PlaylistRecorder } from '../audio/PlaylistRecorder';

const AUTOMATION_TARGET_PRESETS: { type: AutomationTargetType; channelIndex?: number; label: string; color: string }[] = [
  { type: 'synthCutoff', label: 'Eve Lead Cutoff', color: '#ec4899' },
  { type: 'masterVolume', label: 'Master Volume', color: '#ff763b' },
  { type: 'mixerReverbMix', channelIndex: 1, label: 'Drums Reverb Mix', color: '#06b6d4' },
  { type: 'mixerFilterCutoff', channelIndex: 3, label: '808 Filter Sweep', color: '#a855f7' },
  { type: 'mixerDelayMix', channelIndex: 4, label: 'Lead Delay Mix', color: '#eab308' },
];

export const Playlist: React.FC = () => {
  const [state, store] = useDawStore();
  const [selectedSourceType, setSelectedSourceType] = useState<'pattern' | 'audio' | 'automation'>('pattern');
  const [selectedPatternId, setSelectedPatternId] = useState<string>(state.selectedPatternId);
  const [selectedAutoPresetIdx, setSelectedAutoPresetIdx] = useState<number>(0);
  const [clipLengthBars, setClipLengthBars] = useState<number>(4);

  const totalBars = 32;
  const [livePeaks, setLivePeaks] = useState<number[]>([]);

  useEffect(() => {
    const recorder = PlaylistRecorder.getInstance();
    const unsub = recorder.addWaveformListener((peaks) => {
      setLivePeaks(peaks);
    });
    return () => {
      unsub();
    };
  }, []);

  // Handle placing a clip on track row and bar
  const handleCellClick = (trackIndex: number, barIndex: number) => {
    // Check if there is already a clip at this position
    const existingIndex = state.clips.findIndex(
      (c) => c.trackIndex === trackIndex && barIndex >= c.startBar && barIndex < c.startBar + c.lengthBars
    );

    if (existingIndex >= 0) {
      // Remove clip
      const clip = state.clips[existingIndex];
      if (clip.automationClipId) {
        store.removeAutomationClip(clip.automationClipId);
      } else {
        store.removePlaylistClip(clip.id);
      }
      return;
    }

    // Add clip
    if (selectedSourceType === 'pattern') {
      const pattern = state.patterns.find((p) => p.id === selectedPatternId) || state.patterns[0];
      const newClip: PlaylistClip = {
        id: `clip-${Date.now()}`,
        trackIndex,
        patternId: pattern.id,
        name: pattern.name,
        startBar: barIndex,
        lengthBars: clipLengthBars,
        color: pattern.color,
        type: 'pattern',
      };
      store.addPlaylistClip(newClip);
    } else if (selectedSourceType === 'audio') {
      const newClip: PlaylistClip = {
        id: `audio-${Date.now()}`,
        trackIndex,
        name: 'Vocal Audio Clip',
        startBar: barIndex,
        lengthBars: 2,
        color: '#eab308',
        type: 'audio',
      };
      store.addPlaylistClip(newClip);
    } else {
      // Add Automation Clip
      const preset = AUTOMATION_TARGET_PRESETS[selectedAutoPresetIdx];
      store.addAutomationClip({
        name: preset.label,
        color: preset.color,
        trackIndex,
        startBar: barIndex,
        lengthBars: clipLengthBars,
        target: {
          type: preset.type,
          channelIndex: preset.channelIndex,
          label: preset.label,
        },
        nodes: [
          { id: `node-1`, bar: 0, value: 0.25, tension: 0.35 },
          { id: `node-2`, bar: clipLengthBars * 0.5, value: 0.85, tension: -0.35 },
          { id: `node-3`, bar: clipLengthBars, value: 0.3, tension: 0 },
        ],
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#14161d] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      {/* Playlist Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1b1e27] border-b border-[#2a2d38]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-purple-400">
            <Layers size={16} />
            <span>Playlist Arrangement</span>
          </div>

          {/* Source Palette Switcher: Patterns vs Audio Loops vs Automation */}
          <div className="flex items-center bg-[#121316] p-0.5 rounded border border-[#353945]">
            <button
              onClick={() => setSelectedSourceType('pattern')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                selectedSourceType === 'pattern' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music size={13} />
              <span>Patterns</span>
            </button>
            <button
              onClick={() => setSelectedSourceType('audio')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                selectedSourceType === 'audio' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mic size={13} />
              <span>Audio</span>
            </button>
            <button
              onClick={() => setSelectedSourceType('automation')}
              className={`px-2.5 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                selectedSourceType === 'automation' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp size={13} />
              <span>Automation</span>
            </button>
          </div>

          {/* Pattern Picker */}
          {selectedSourceType === 'pattern' && (
            <div className="flex items-center gap-1 bg-[#121316] px-2 py-1 rounded border border-[#353945]">
              <span className="text-[10px] text-gray-400 uppercase font-mono">CLIP:</span>
              <select
                value={selectedPatternId}
                onChange={(e) => setSelectedPatternId(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-purple-400 focus:outline-none cursor-pointer"
              >
                {state.patterns.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#181a1f] text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Automation Target Picker */}
          {selectedSourceType === 'automation' && (
            <div className="flex items-center gap-1 bg-[#121316] px-2 py-1 rounded border border-[#353945]">
              <span className="text-[10px] text-gray-400 uppercase font-mono">TARGET:</span>
              <select
                value={selectedAutoPresetIdx}
                onChange={(e) => setSelectedAutoPresetIdx(Number(e.target.value))}
                className="bg-transparent text-xs font-mono font-bold text-pink-400 focus:outline-none cursor-pointer"
              >
                {AUTOMATION_TARGET_PRESETS.map((p, idx) => (
                  <option key={p.label} value={idx} className="bg-[#181a1f] text-white">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clip Length in Bars */}
          <div className="flex items-center gap-1 text-xs text-gray-400 font-mono">
            <span>BARS:</span>
            {[1, 2, 4, 8].map((b) => (
              <button
                key={b}
                onClick={() => setClipLengthBars(b)}
                className={`px-1.5 py-0.5 rounded text-[11px] ${
                  clipLengthBars === b
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-[#232631] text-gray-400 hover:text-gray-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-gray-400">
          {/* Direct Audio Recording Arm Button */}
          <button
            onClick={() => store.toggleRecordArm()}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold rounded transition-all ${
              state.isRecording
                ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50'
                : state.isRecordArmed
                ? 'bg-red-600/30 text-red-300 border border-red-500/60'
                : 'bg-[#232631] text-gray-400 hover:text-red-400 border border-transparent'
            }`}
            title="Arm Recording into Playlist Track (Play to record)"
          >
            <Circle size={10} fill={state.isRecordArmed || state.isRecording ? 'currentColor' : 'none'} />
            <span>{state.isRecording ? 'RECORDING...' : state.isRecordArmed ? 'ARMED' : 'ARM REC'}</span>
          </button>

          <span>Click track to Paint / Remove clip</span>
          <button
            onClick={() => {
              state.clips = [];
              store.syncAudioEngineData();
              store.saveToStorage();
            }}
            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
            title="Clear Arrangement"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Playlist Multitrack Arrangement Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers Column (Left) */}
        <div className="w-40 bg-[#181a22] border-r border-[#2d303b] flex flex-col flex-shrink-0">
          <div className="h-7 bg-[#1b1d25] border-b border-[#2a2d38] flex items-center px-3 text-[10px] font-mono text-gray-400 uppercase font-bold">
            TRACKS
          </div>

          <div className="flex-1 overflow-y-auto">
            {state.playlistTracks.map((track, trackIdx) => (
              <div
                key={track.id}
                className="h-14 px-3 flex items-center justify-between border-b border-[#252835] bg-[#1a1c24] hover:bg-[#1e202b] transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: track.color }} />
                  <span className="text-xs font-bold text-gray-200 truncate">{track.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      state.playlistTracks.forEach((t, i) => {
                        t.isArmed = i === trackIdx ? !t.isArmed : false;
                      });
                      store.syncAudioEngineData();
                    }}
                    title={track.isArmed ? 'Track Armed for Direct Recording' : 'Arm Track for Recording'}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-0.5 transition-all ${
                      track.isArmed
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/50 animate-pulse'
                        : 'bg-[#2b2e3c] text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <span>REC</span>
                  </button>

                  <button
                    onClick={() => {
                      track.mute = !track.mute;
                      store.syncAudioEngineData();
                    }}
                    className={`w-4 h-4 rounded-xs text-[9px] font-bold font-mono flex items-center justify-center ${
                      track.mute ? 'bg-red-500 text-white' : 'bg-[#2b2e3c] text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    M
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Grid (Right) */}
        <div className="flex-1 overflow-x-auto flex flex-col bg-[#121319] relative">
          {/* Bar Numbers Header */}
          <div className="flex h-7 bg-[#1b1e27] border-b border-[#2a2d38] sticky top-0 z-20 min-w-max">
            {Array.from({ length: totalBars }, (_, bar) => (
              <div
                key={bar}
                className={`w-20 border-r border-[#2a2d38] text-[10px] font-mono font-bold text-center flex items-center justify-center ${
                  bar % 4 === 0 ? 'bg-[#252936] text-purple-400' : 'text-gray-500'
                }`}
              >
                Bar {bar + 1}
              </div>
            ))}
          </div>

          {/* Grid Rows per Track */}
          <div className="flex-1 flex flex-col min-w-max relative">
            {/* Song Playhead Line */}
            {state.isPlaying && state.playbackMode === 'song' && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-lg shadow-sky-500/50 z-30 pointer-events-none transition-all duration-75"
                style={{
                  left: `${(state.currentBar / totalBars) * (totalBars * 80)}px`,
                }}
              />
            )}

            {state.playlistTracks.map((_, trackIdx) => {
              const trackClips = state.clips.filter((c) => c.trackIndex === trackIdx);

              return (
                <div
                  key={trackIdx}
                  className="h-14 border-b border-[#20222d] flex relative bg-[#13141c]"
                >
                  {/* Live Streaming Recording Waveform Block */}
                  {state.playlistTracks[trackIdx]?.isArmed && state.isRecording && (
                    <div
                      className="absolute top-1 bottom-1 rounded-sm border-2 border-red-500 bg-red-950/80 z-30 flex items-center px-2 shadow-lg shadow-red-500/40 overflow-hidden"
                      style={{
                        left: '0px',
                        width: `${Math.max(60, (state.currentBar + 1) * 80)}px`,
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-300 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>REC...</span>
                      </div>
                      <div className="flex-1 flex items-center gap-0.5 h-6 ml-3 overflow-hidden">
                        {livePeaks.slice(-25).map((pk, pIdx) => (
                          <div
                            key={pIdx}
                            className="w-1 bg-red-400 rounded-xs transition-all"
                            style={{ height: `${Math.max(15, pk * 100)}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty Grid Cells */}
                  {Array.from({ length: totalBars }, (_, bar) => (
                    <div
                      key={bar}
                      onClick={() => handleCellClick(trackIdx, bar)}
                      className={`w-20 h-full border-r cursor-pointer transition-colors hover:bg-purple-500/10 ${
                        bar % 4 === 0 ? 'border-r-[#2f3342]' : 'border-r-[#1e202a]'
                      }`}
                    />
                  ))}

                  {/* Rendered Clips */}
                  {trackClips.map((clip) => {
                    if (clip.type === 'automation' && clip.automationClipId) {
                      const autoClip = state.automationClips.find((c) => c.id === clip.automationClipId);
                      if (autoClip) {
                        return (
                          <AutomationCurveClip
                            key={clip.id}
                            clip={autoClip}
                            width={clip.lengthBars * 80}
                            height={54}
                          />
                        );
                      }
                    }

                    return (
                      <div
                        key={clip.id}
                        onClick={() => store.removePlaylistClip(clip.id)}
                        title={`${clip.name} (Click to remove)`}
                        className="absolute top-1 bottom-1 rounded-sm border px-2 flex items-center justify-between text-xs font-mono font-bold text-white shadow-md z-10 cursor-pointer overflow-hidden group hover:brightness-110"
                        style={{
                          left: `${clip.startBar * 80 + 2}px`,
                          width: `${clip.lengthBars * 80 - 4}px`,
                          backgroundColor: `${clip.color}dd`,
                          borderColor: clip.color,
                        }}
                      >
                        <div className="flex items-center gap-1 truncate">
                          {clip.type === 'pattern' ? <Music size={12} /> : <Mic size={12} />}
                          <span className="truncate">{clip.name}</span>
                        </div>
                        <span className="text-[10px] opacity-75">{clip.lengthBars}B</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
