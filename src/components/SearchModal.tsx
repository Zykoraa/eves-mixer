import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Music,
  Plug,
  Guitar,
  Sliders,
  Sparkles,
  Play,
  Volume2,
  Grid,
  Layers,
  Mic,
  Cpu,
  Activity,
  Compass,
  Download,
  Flame,
  HelpCircle,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { INSTRUMENT_CATALOG } from '../audio/InstrumentEngine';
import { AVAILABLE_VSTS, VstPluginId } from '../audio/VstEngine';
import { DrumKitId, MusicalScale, RootNote, ViewTab } from '../types/daw';
import { GuitarAmpModel, GuitarPedalSettings } from '../audio/GuitarEngine';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'instrument' | 'vst' | 'guitar' | 'drumKit' | 'scale' | 'view' | 'action';
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  tags?: string[];
  onSelect: () => void;
  onAudition?: () => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExport?: () => void;
  onOpenInspiration?: () => void;
  onOpenShortcuts?: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onOpenExport,
  onOpenInspiration,
  onOpenShortcuts,
}) => {
  const [state, store] = useDawStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [auditioningId, setAuditioningId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus search input whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build the complete universal search database
  const allItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. All 40+ Synthesized Instruments
    INSTRUMENT_CATALOG.forEach((inst) => {
      items.push({
        id: `inst-${inst.id}`,
        title: inst.name,
        subtitle: inst.description,
        category: 'instrument',
        badge: `${inst.category.toUpperCase()} INST`,
        badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        icon: <Music size={16} className="text-sky-400" />,
        tags: [inst.category, ...inst.tags, 'sound', 'preset', 'melody'],
        onSelect: () => {
          store.addInstrumentTrack(inst.id);
          store.setActiveView('channelRack');
          onClose();
        },
        onAudition: () => {
          setAuditioningId(`inst-${inst.id}`);
          store.auditionInstrument(inst.id);
          setTimeout(() => setAuditioningId(null), 600);
        },
      });
    });

    // 2. All Studio VST Plugins
    AVAILABLE_VSTS.forEach((vst) => {
      items.push({
        id: `vst-${vst.id}`,
        title: vst.name,
        subtitle: `${vst.description} (${vst.developer})`,
        category: 'vst',
        badge: `${vst.category.replace('_', ' ').toUpperCase()} VST`,
        badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        icon: <Plug size={16} className="text-indigo-400" />,
        tags: ['vst', 'plugin', 'effect', vst.category, vst.developer],
        onSelect: () => {
          store.setActiveView('vstPatchbay');
          // If not inserted, insert on current selected channel
          const exists = state.vstInstances.some((v) => v.pluginId === vst.id);
          if (!exists) {
            store.insertVstPlugin(state.selectedVstChannelIndex, vst.id, 0);
          }
          onClose();
        },
      });
    });

    // 3. Guitar Rig Models, Amps & Pedals
    const guitarAmps: { id: GuitarAmpModel; name: string; desc: string }[] = [
      { id: 'fenderClean', name: "Fender '65 Twin Reverb", desc: 'Glassy clean scoop & tube warmth' },
      { id: 'marshallPlexi', name: "Marshall '59 Plexi Crunch", desc: 'British rock overdrive & mid punch' },
      { id: 'mesaDual', name: 'Mesa Dual Rectifier', desc: 'Modern high gain metal chug & solo lead' },
      { id: 'voxAc30', name: 'Vox AC30 Top Boost', desc: '60s British jangle chime & treble bite' },
      { id: 'ampegBass', name: 'Ampeg SVT Bass Rig', desc: 'Deep low-end authority for bass guitars' },
      { id: 'acousticDi', name: 'Acoustic Studio DI Preamp', desc: 'Piezo de-quacking & natural acoustic tone' },
    ];

    guitarAmps.forEach((amp) => {
      items.push({
        id: `amp-${amp.id}`,
        title: `Amp: ${amp.name}`,
        subtitle: amp.desc,
        category: 'guitar',
        badge: 'TUBE AMP',
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: <Guitar size={16} className="text-red-400" />,
        tags: ['guitar', 'amp', 'head', 'tube', 'drive', 'distortion'],
        onSelect: () => {
          store.setGuitarAmpModel(amp.id);
          store.setActiveView('guitarRig');
          onClose();
        },
      });
    });

    // Guitar Pedals
    const pedals: { key: keyof GuitarPedalSettings; name: string; desc: string }[] = [
      { key: 'driveEnabled', name: 'TS9 Tube Screamer Overdrive', desc: 'Mid-hump overdrive pedal' },
      { key: 'fuzzEnabled', name: 'Vintage Silicon Fuzz', desc: 'Hard clipping fuzz distortion' },
      { key: 'wahEnabled', name: 'Auto-Wah Envelope Filter', desc: 'Dynamic picking bandpass filter' },
      { key: 'chorusEnabled', name: 'Analog Stereo Chorus', desc: 'Lush modulated swirl pedal' },
      { key: 'delayEnabled', name: 'Analog Bucket Brigade Delay', desc: 'Warm tape style repeats' },
      { key: 'reverbEnabled', name: 'Spring Reverb Tank', desc: 'Surf rock metallic spring reflections' },
    ];

    pedals.forEach((p) => {
      items.push({
        id: `pedal-${String(p.key)}`,
        title: `Pedal: ${p.name}`,
        subtitle: p.desc,
        category: 'guitar',
        badge: 'STOMPBOX',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: <Guitar size={16} className="text-amber-400" />,
        tags: ['guitar', 'pedal', 'stompbox', 'effect'],
        onSelect: () => {
          store.setGuitarPedals({ [p.key]: true });
          store.setActiveView('guitarRig');
          onClose();
        },
      });
    });

    items.push({
      id: 'guitar-tuner',
      title: 'Chromatic Guitar & Bass Tuner',
      subtitle: 'Real-time pitch detection, cents needle meter, and silent tuning',
      category: 'guitar',
      badge: 'TUNER',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: <Activity size={16} className="text-emerald-400" />,
      tags: ['guitar', 'tuner', 'tune', 'pitch', 'hz'],
      onSelect: () => {
        store.setGuitarTuner(true);
        store.setActiveView('guitarRig');
        onClose();
      },
    });

    // 4. Drum Kits & Beat Patterns
    const kits: { id: DrumKitId; name: string; desc: string }[] = [
      { id: 'trap', name: '808 Trap Heat Drum Kit', desc: 'Hard punchy kick, heavy sub, snappy clap' },
      { id: 'synthwave', name: '80s Synthwave Drum Kit', desc: 'Gated snare reverb, LinnDrum kick, synth toms' },
      { id: 'lofi', name: 'Dusty Lo-Fi Drum Kit', desc: 'Warm vinyl kick, brushed rim, loose organic hats' },
      { id: 'house', name: '909 Club House Drum Kit', desc: 'Round 4/4 dance kick, 909 snare, open hat' },
      { id: 'acoustic', name: 'Live Acoustic Studio Drum Kit', desc: 'Natural birch snare, beech kick, bright crash' },
      { id: 'glitch', name: 'Cyberpunk Glitch Drum Kit', desc: 'Bitcrushed click kicks, metallic zap snares' },
    ];

    kits.forEach((k) => {
      items.push({
        id: `kit-${k.id}`,
        title: k.name,
        subtitle: k.desc,
        category: 'drumKit',
        badge: 'DRUM KIT',
        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        icon: <Flame size={16} className="text-orange-400" />,
        tags: ['drum', 'kit', 'beat', 'drums', k.id],
        onSelect: () => {
          store.changeDrumKit(k.id);
          store.setActiveView('channelRack');
          onClose();
        },
      });
    });

    const beatTemplates: { id: 'trap' | 'boomBap' | 'house' | 'drill'; name: string; desc: string }[] = [
      { id: 'trap', name: 'Trap Rolling Hats Beat Template', desc: '140 BPM fast hats and hard kick drop' },
      { id: 'boomBap', name: 'Swung Lo-Fi Boom Bap Template', desc: '92 BPM swung groove and vinyl pocket' },
      { id: 'house', name: '4-on-the-Floor House Groove Template', desc: '126 BPM classic four-on-the-floor dance rhythm' },
      { id: 'drill', name: 'UK / NY Drill Bounce Template', desc: '142 BPM sliding hats and syncopated snare' },
    ];

    beatTemplates.forEach((bt) => {
      items.push({
        id: `beat-${bt.id}`,
        title: `Beat: ${bt.name}`,
        subtitle: bt.desc,
        category: 'drumKit',
        badge: 'GROOVE TEMPLATE',
        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        icon: <Activity size={16} className="text-orange-400" />,
        tags: ['beat', 'groove', 'pattern', 'template', 'drum', bt.id],
        onSelect: () => {
          store.applyDrumPreset(bt.id);
          store.setActiveView('channelRack');
          onClose();
        },
      });
    });

    // 5. Musical Scales & Keys
    const scales: { id: MusicalScale; name: string }[] = [
      { id: 'major', name: 'Major (Ionian)' },
      { id: 'minor', name: 'Natural Minor (Aeolian)' },
      { id: 'dorian', name: 'Dorian Mode' },
      { id: 'pentatonicMajor', name: 'Major Pentatonic' },
      { id: 'pentatonicMinor', name: 'Minor Pentatonic' },
      { id: 'blues', name: 'Blues Scale' },
      { id: 'harmonicMinor', name: 'Harmonic Minor' },
      { id: 'japanese', name: 'Japanese Hirajoshi' },
    ];

    scales.forEach((s) => {
      items.push({
        id: `scale-${s.id}`,
        title: `Key & Scale: ${s.name}`,
        subtitle: `Lock keyboard and piano roll notes to ${s.name}`,
        category: 'scale',
        badge: 'SCALE LOCK',
        badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        icon: <Sparkles size={16} className="text-pink-400" />,
        tags: ['scale', 'key', 'harmony', 'lock', s.id],
        onSelect: () => {
          store.setScale(s.id);
          store.toggleSnapToScale();
          store.setActiveView('pianoRoll');
          onClose();
        },
      });
    });

    // 6. DAW Views Navigation
    const views: { id: ViewTab; name: string; desc: string; shortcut: string }[] = [
      { id: 'channelRack', name: 'Channel Rack', desc: 'FL Studio 16/32 step drum sequencer', shortcut: '1' },
      { id: 'pianoRoll', name: 'Piano Roll', desc: 'Multi-octave chromatic note editor with chord stamper', shortcut: '2' },
      { id: 'playlist', name: 'Playlist Arranger', desc: 'Multitrack timeline for patterns and audio recordings', shortcut: '3' },
      { id: 'mixer', name: 'Mixer Console', desc: '8 insert channels + master bus with limiter & peak meters', shortcut: '4' },
      { id: 'synth', name: 'EveSynth Editor', desc: 'Dual-oscillator subtractive analog synthesizer', shortcut: '5' },
      { id: 'looper', name: 'Eve LoopStation', desc: '4-deck microphone looper with bar quantization & reverse', shortcut: '6' },
      { id: 'fxRack', name: 'FX Effects Rack', desc: 'Parametric EQ, Algorithmic Reverb, Delay & Saturator', shortcut: '7' },
      { id: 'browser', name: 'Sound Browser', desc: 'Library of 40+ modeled instruments and soundbanks', shortcut: '8' },
      { id: 'guitarRig', name: 'Eve Guitar Rig Pro', desc: 'Amp heads, speaker cab IRs, pedalboard and tuner', shortcut: '9' },
      { id: 'vstPatchbay', name: 'VST Host & Plugin Patchbay', desc: 'Mixer insert slots and Web Audio Modules', shortcut: '0' },
    ];

    views.forEach((v) => {
      items.push({
        id: `view-${v.id}`,
        title: `Navigate to ${v.name}`,
        subtitle: `${v.desc} (Hotkey ${v.shortcut})`,
        category: 'view',
        badge: `KEY ${v.shortcut}`,
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: <ArrowRight size={16} className="text-emerald-400" />,
        tags: ['view', 'navigate', 'window', 'page', v.id],
        onSelect: () => {
          store.setActiveView(v.id);
          onClose();
        },
      });
    });

    // 7. DAW Actions & Utilities
    items.push({
      id: 'act-export',
      title: 'Export Song to Master WAV',
      subtitle: 'Render radio-ready 44.1kHz 16-bit WAV file offline',
      category: 'action',
      badge: 'ACTION',
      badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      icon: <Download size={16} className="text-teal-400" />,
      tags: ['export', 'render', 'wav', 'save', 'audio', 'download'],
      onSelect: () => {
        onClose();
        onOpenExport?.();
      },
    });

    items.push({
      id: 'act-inspiration',
      title: 'Open Inspiration Engine',
      subtitle: '1-click chord progression generator and melodic assistant',
      category: 'action',
      badge: 'AI ASSIST',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      icon: <Sparkles size={16} className="text-purple-400" />,
      tags: ['inspiration', 'chords', 'progressions', 'generate', 'ai'],
      onSelect: () => {
        onClose();
        onOpenInspiration?.();
      },
    });

    items.push({
      id: 'act-randomize',
      title: 'Randomize Scale-Locked Melody',
      subtitle: 'Instantly generate mathematical melodies matching your chosen key',
      category: 'action',
      badge: 'CREATIVE',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      icon: <Sparkles size={16} className="text-purple-400" />,
      tags: ['randomize', 'melody', 'riff', 'generate'],
      onSelect: () => {
        store.randomizeMelody();
        store.setActiveView('pianoRoll');
        onClose();
      },
    });

    items.push({
      id: 'act-metronome',
      title: 'Toggle Metronome Click',
      subtitle: `Currently ${state.metronome ? 'Enabled' : 'Disabled'}`,
      category: 'action',
      badge: 'TRANSPORT',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: <Activity size={16} className="text-amber-400" />,
      tags: ['metronome', 'click', 'tempo', 'bpm', 'time'],
      onSelect: () => {
        store.toggleMetronome();
        onClose();
      },
    });

    items.push({
      id: 'act-shortcuts',
      title: 'Open Keybinding Cheat Sheet',
      subtitle: 'Full list of keyboard shortcuts and Web MIDI setup',
      category: 'action',
      badge: 'HELP',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      icon: <HelpCircle size={16} className="text-blue-400" />,
      tags: ['help', 'shortcuts', 'keys', 'cheat', 'midi'],
      onSelect: () => {
        onClose();
        onOpenShortcuts?.();
      },
    });

    return items;
  }, [state, store, onClose, onOpenExport, onOpenInspiration, onOpenShortcuts]);

  // Filter items based on query & category
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allItems.filter((item) => {
      const matchesFilter = selectedFilter === 'all' || item.category === selectedFilter;
      if (!matchesFilter) return false;
      if (!q) return true;

      const inTitle = item.title.toLowerCase().includes(q);
      const inSubtitle = item.subtitle.toLowerCase().includes(q);
      const inTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      return inTitle || inSubtitle || inTags;
    });
  }, [allItems, query, selectedFilter]);

  // Keyboard navigation inside search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          filteredResults[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const categoryFilters = [
    { id: 'all', label: 'All Results' },
    { id: 'instrument', label: 'Instruments' },
    { id: 'vst', label: 'VST Plugins' },
    { id: 'guitar', label: 'Guitar Rig' },
    { id: 'drumKit', label: 'Drums & Beats' },
    { id: 'scale', label: 'Scales' },
    { id: 'view', label: 'DAW Views' },
    { id: 'action', label: 'Actions' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-xs p-4 pt-16 select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#161822] border border-[#34384a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-[#1e2230] border-b border-[#2e3344]">
          <Search size={20} className="text-orange-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search 40+ instruments, VSTs, guitar amps, drum kits, views, actions..."
            className="w-full bg-transparent text-sm font-medium text-white placeholder-gray-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="px-2 py-0.5 rounded bg-[#2a2f42] text-[10px] font-mono font-bold text-gray-400 border border-[#3d435a]">
            ESC
          </kbd>
        </div>

        {/* Category Filter Pills */}
        <div className="px-5 py-2 bg-[#12141c] border-b border-[#252834] flex gap-1.5 overflow-x-auto text-xs font-mono">
          {categoryFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFilter(f.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                selectedFilter === f.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-[#1a1c26] text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div ref={listRef} className="p-3 overflow-y-auto flex-1 space-y-1 max-h-[55vh]">
          {filteredResults.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 font-mono">
              <Search size={32} className="text-gray-600 mb-2" />
              <span className="text-sm font-bold text-gray-400">No matching items found</span>
              <span className="text-xs text-gray-600 mt-1">Try searching "piano", "808", "auto-tune", "fender", or "trap"</span>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={item.onSelect}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-[#222738] border-orange-500/70 shadow-md'
                      : 'bg-[#151722] border-[#252938] hover:border-[#353b50]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 shrink-0">
                      {item.icon}
                    </div>
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                          {item.title}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {item.onAudition && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onAudition?.();
                        }}
                        className={`p-1.5 rounded-lg border transition-all ${
                          auditioningId === item.id
                            ? 'bg-sky-500 text-white border-sky-400 scale-110 shadow-md shadow-sky-500/30'
                            : 'bg-[#1b1e2a] hover:bg-[#252a3a] text-gray-300 border-[#2d3246]'
                        }`}
                        title="Audition Preview"
                      >
                        <Volume2 size={13} className={auditioningId === item.id ? 'animate-pulse' : ''} />
                      </button>
                    )}

                    <div
                      className={`text-[10px] font-mono flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                        isSelected ? 'bg-orange-500 text-white font-bold' : 'text-gray-500 group-hover:text-gray-300'
                      }`}
                    >
                      <span>Select</span>
                      <CornerDownLeft size={11} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Footer Tip */}
        <div className="px-5 py-2.5 bg-[#12141c] border-t border-[#232634] flex items-center justify-between text-[11px] font-mono text-gray-400">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-[#1e2230] rounded text-gray-300 font-bold">↑</kbd> <kbd className="px-1.5 py-0.5 bg-[#1e2230] rounded text-gray-300 font-bold">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-[#1e2230] rounded text-gray-300 font-bold">↵ Enter</kbd> to select</span>
            <span><kbd className="px-1.5 py-0.5 bg-[#1e2230] rounded text-gray-300 font-bold">Esc</kbd> to close</span>
          </div>
          <span className="text-gray-500">{filteredResults.length} items searchable</span>
        </div>
      </div>
    </div>
  );
};
