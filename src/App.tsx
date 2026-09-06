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
import { SlicexView } from './components/SlicexView';
import { MixingDoctorView } from './components/MixingDoctorView';
import { MidiLearnModal } from './components/MidiLearnModal';
import { NewToneEditorView } from './components/NewToneEditorView';
import { GrossBeatModal } from './components/GrossBeatModal';
import { StemSeparatorModal } from './components/StemSeparatorModal';
import { ProjectLibraryModal } from './components/ProjectLibraryModal';
import { useDawStore } from './store/useDawStore';

export const App: React.FC = () => {
  const [state, store] = useDawStore();
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGrossBeatOpen, setIsGrossBeatOpen] = useState(false);
  const [isStemSeparatorOpen, setIsStemSeparatorOpen] = useState(false);
  const [isProjectLibraryOpen, setIsProjectLibraryOpen] = useState(false);

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
        onOpenGrossBeat={() => setIsGrossBeatOpen(true)}
        onOpenStemSeparator={() => setIsStemSeparatorOpen(true)}
        onOpenProjectLibrary={() => setIsProjectLibraryOpen(true)}
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
        {state.activeView === 'slicex' && <SlicexView />}
        {state.activeView === 'mixingDoctor' && <MixingDoctorView />}
        {state.activeView === 'newTone' && <NewToneEditorView />}
      </main>

      <MidiLearnModal
        isOpen={state.activeView === 'midiLearn'}
        onClose={() => store.setActiveView('mixer')}
      />

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

      <GrossBeatModal
        isOpen={isGrossBeatOpen}
        onClose={() => setIsGrossBeatOpen(false)}
      />

      <StemSeparatorModal
        isOpen={isStemSeparatorOpen}
        onClose={() => setIsStemSeparatorOpen(false)}
      />

      <ProjectLibraryModal
        isOpen={isProjectLibraryOpen}
        onClose={() => setIsProjectLibraryOpen(false)}
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
        onOpenGrossBeat={() => setIsGrossBeatOpen(true)}
        onOpenStemSeparator={() => setIsStemSeparatorOpen(true)}
        onOpenProjectLibrary={() => setIsProjectLibraryOpen(true)}
      />
    </div>
  );
};

export default App;
