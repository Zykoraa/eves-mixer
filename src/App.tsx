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
import { VisualizerPanel } from './components/VisualizerPanel';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { InspirationModal } from './components/InspirationModal';
import { ExportModal } from './components/ExportModal';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { useDawStore } from './store/useDawStore';

export const App: React.FC = () => {
  const [state] = useDawStore();
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#121316] text-white select-none overflow-hidden">
      {/* Top DAW Transport & Navigation */}
      <Header
        onOpenInspiration={() => setIsInspirationOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
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
    </div>
  );
};

export default App;
