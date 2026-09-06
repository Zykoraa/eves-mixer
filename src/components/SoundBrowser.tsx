import React, { useState } from 'react';
import {
  Search,
  Play,
  Plus,
  Music,
  Sliders,
  Sparkles,
  Zap,
  Volume2,
  Tag,
  FolderOpen,
  Layers,
  Flame,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { INSTRUMENT_CATALOG } from '../audio/InstrumentEngine';
import { InstrumentCategory, DrumKitId } from '../types/daw';

const CATEGORY_TABS: { id: InstrumentCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Sounds', icon: '🌟' },
  { id: 'keys', label: 'Pianos & Keys', icon: '🎹' },
  { id: 'bass', label: 'Bass & 808s', icon: '🎸' },
  { id: 'strings', label: 'Strings & Brass', icon: '🎻' },
  { id: 'guitars', label: 'Guitars & Mallets', icon: '🪕' },
  { id: 'synths', label: 'Synths & Leads', icon: '⚡' },
  { id: 'pads', label: 'Pads & Ambience', icon: '🌌' },
  { id: 'fx', label: 'SFX & Risers', icon: '💥' },
];

const DRUM_KITS: { id: DrumKitId; name: string; desc: string; color: string }[] = [
  { id: 'trap', name: '808 Trap Heat', desc: 'Hard hitting kick, rolling hats, booming 808 sub', color: '#ff763b' },
  { id: 'synthwave', name: '80s Synthwave', desc: 'Gated snare reverb, LinnDrum kick, synth toms', color: '#ec4899' },
  { id: 'lofi', name: 'Dusty Lo-Fi', desc: 'Warm vinyl kick, paper snare, loose hats', color: '#a855f7' },
  { id: 'house', name: '909 Club House', desc: 'Punchy 4/4 dance kick, 909 clap, sizzle open hat', color: '#38bdf8' },
  { id: 'acoustic', name: 'Live Studio', desc: 'Wood birch kick, brass snare wires, natural cymbals', color: '#22c55e' },
  { id: 'glitch', name: 'Cyberpunk Glitch', desc: 'Bitcrushed kicks, metallic laser snares, blip hats', color: '#eab308' },
];

export const SoundBrowser: React.FC = () => {
  const [state, store] = useDawStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory | 'all'>('all');
  const [activeAuditionId, setActiveAuditionId] = useState<string | null>(null);
  const [selectedKit, setSelectedKit] = useState<DrumKitId>('trap');

  const filteredInstruments = INSTRUMENT_CATALOG.filter((inst) => {
    const matchesCategory = selectedCategory === 'all' || inst.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inst.name.toLowerCase().includes(q) ||
      inst.description.toLowerCase().includes(q) ||
      inst.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const handleAudition = (id: string) => {
    setActiveAuditionId(id);
    store.auditionInstrument(id);
    setTimeout(() => {
      setActiveAuditionId(null);
    }, 700);
  };

  const activeTrack = state.tracks.find((t) => t.id === state.selectedTrackId);

  return (
    <div className="flex-1 flex flex-col bg-[#14151b] text-gray-200 overflow-hidden select-none border-t border-[#2e323a]">
      {/* Top Search & Filter Bar */}
      <div className="px-5 py-3 bg-[#1b1d26] border-b border-[#2a2d38] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎛️</span>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Sound & Instrument Library</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono border border-orange-500/30">
                {INSTRUMENT_CATALOG.length} PRESETS
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">
              Browse acoustic instruments, synthesizers, orchestral voices, and genre drum kits.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search instruments, tags, styles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#111217] text-gray-200 rounded-md border border-[#353948] focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      {/* Genre Drum Kits Quick Switcher */}
      <div className="px-5 py-2.5 bg-[#121318] border-b border-[#252834] flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-mono font-bold text-orange-400 flex items-center gap-1 flex-shrink-0">
          <Flame size={13} />
          <span>DRUM KITS:</span>
        </span>
        <div className="flex items-center gap-2">
          {DRUM_KITS.map((kit) => (
            <button
              key={kit.id}
              onClick={() => {
                setSelectedKit(kit.id);
                store.changeDrumKit(kit.id);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                selectedKit === kit.id
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                  : 'bg-[#1e202a] text-gray-300 hover:text-white hover:bg-[#282b39] border border-[#2f3242]'
              }`}
              title={kit.desc}
            >
              <span>{kit.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-5 py-2 bg-[#181a23] border-b border-[#272a36] flex items-center gap-1.5 overflow-x-auto">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                isActive
                  ? 'bg-[#313545] text-white border border-[#444a5f] shadow-xs'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#21232d]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Instruments Grid */}
      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 bg-[#0f1015]">
        {filteredInstruments.map((inst) => {
          const isAuditioning = activeAuditionId === inst.id;

          return (
            <div
              key={inst.id}
              className="bg-[#181a24] border border-[#292c3a] hover:border-[#3d4257] rounded-lg p-3 flex flex-col justify-between shadow-md transition-all group hover:bg-[#1d1f2b]"
            >
              <div>
                {/* Header: Name and Audition Button */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: inst.color }} />
                    <h3 className="font-bold text-xs text-gray-200 group-hover:text-white truncate">
                      {inst.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleAudition(inst.id)}
                    title="Audition Sound (Click to Play)"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      isAuditioning
                        ? 'bg-orange-500 text-white scale-110 shadow-md shadow-orange-500/40 animate-pulse'
                        : 'bg-[#252835] text-gray-400 hover:text-white hover:bg-orange-500/30'
                    }`}
                  >
                    <Play size={12} fill="currentColor" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-gray-400 leading-snug mb-2.5 line-clamp-2">
                  {inst.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {inst.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-[#111218] text-[9px] font-mono text-gray-400 border border-[#232532]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-[#252836]">
                <button
                  onClick={() => {
                    store.addInstrumentTrack(inst.id);
                    store.setActiveView('channelRack');
                  }}
                  className="flex-1 py-1.5 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-white border border-orange-500/40 text-[11px] font-bold font-mono transition-all flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus size={12} />
                  <span>Add Track</span>
                </button>

                {activeTrack && (
                  <button
                    onClick={() => {
                      store.changeTrackInstrument(activeTrack.id, inst.id);
                    }}
                    title={`Swap active track (${activeTrack.name}) to this sound`}
                    className="px-2 py-1.5 rounded bg-[#252835] hover:bg-[#323646] text-gray-300 hover:text-white text-[11px] font-mono transition-all"
                  >
                    Swap
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
