import React, { useState } from 'react';
import { Header } from './components/Header';
import { ChannelRack } from './components/ChannelRack';
import { PianoRoll } from './components/PianoRoll';
import { Playlist } from './components/Playlist';
import { MixerRack } from './components/MixerRack';
import { SynthEditor } from './components/SynthEditor';
import { LoopStationView } from './components/LoopStationView';
import { FxRack } from './components/FxRack';
import { SoundBrowser } from './components/SoundBrowser';
import { GuitarRigView } from './components/GuitarRigView';
import { VstPatchbay } from './components/VstPatchbay';
import { VisualizerPanel } from './components/VisualizerPanel';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { InspirationModal } from './components/InspirationModal';
import { ExportModal } from './components/ExportModal';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { SearchModal } from './components/SearchModal';
import { useDawStore } from './store/useDawStore';

export const App: React.FC = () => {
  const [state] = useDawStore();
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global search shortcut (Ctrl+K or Cmd+K or /)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#121316] text-white select-none overflow-hidden">
      {/* Top DAW Transport & Navigation */}
      <Header
        onOpenInspiration={() => setIsInspirationOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {state.activeView === 'channelRack' && <ChannelRack />}
        {state.activeView === 'pianoRoll' && <PianoRoll />}
        {state.activeView === 'playlist' && <Playlist />}
        {state.activeView === 'mixer' && <MixerRack />}
        {state.activeView === 'synth' && <SynthEditor />}
        {state.activeView === 'looper' && <LoopStationView />}
        {state.activeView === 'fxRack' && <FxRack />}
        {state.activeView === 'browser' && <SoundBrowser />}
        {state.activeView === 'guitarRig' && <GuitarRigView />}
        {state.activeView === 'vstPatchbay' && <VstPatchbay />}
      </main>

      {/* Wave Candy Master FFT Visualizer */}
      <VisualizerPanel />

      {/* Interactive Bottom Piano & Web MIDI Controller Bar */}
      <VirtualKeyboard />

      {/* Modals & Dialogs */}
      <InspirationModal
        isOpen={isInspirationOpen}
        onClose={() => setIsInspirationOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <KeyboardShortcuts
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenInspiration={() => setIsInspirationOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />
    </div>
  );
};

export default App;
