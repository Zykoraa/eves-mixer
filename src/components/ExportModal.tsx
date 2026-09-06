import React, { useState } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  FileAudio,
  Archive,
  Layers,
  Sparkles,
  Loader2,
  Sliders,
  Music,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { OfflineRenderer } from '../audio/OfflineRenderer';
import { MidiExporter } from '../audio/MidiExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [state] = useDawStore();
  const [exportMode, setExportMode] = useState<'master' | 'stems' | 'midi'>('stems');
  const [bitDepth, setBitDepth] = useState<16 | 32>(16);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Ready');
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; filename: string } | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(5);
    setStatusText('Preparing export...');
    setDownloadReady(null);

    try {
      if (exportMode === 'midi') {
        const midiBlob = MidiExporter.generateMidi(
          state.projectName,
          state.bpm,
          state.tracks,
          state.patterns
        );
        const filename = `${state.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mid`;
        setDownloadReady({ blob: midiBlob, filename });
        setIsExporting(false);
        setProgress(100);
        setStatusText('Standard Multi-Track MIDI (.MID) ready!');
        return;
      }

      if (exportMode === 'stems') {
        const zipBlob = await OfflineRenderer.renderStemsToZip(
          state.projectName,
          state.tracks,
          state.patterns,
          state.clips,
          state.synthParams,
          state.bpm,
          state.totalBars,
          { bitDepth, includeMaster: true, normalize: false },
          (pct, text) => {
            setProgress(pct);
            setStatusText(text);
          }
        );

        const filename = `${state.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-stems.zip`;
        setDownloadReady({ blob: zipBlob, filename });
      } else {
        const wavBlob = await OfflineRenderer.renderSong(
          state.tracks,
          state.patterns,
          state.clips,
          state.synthParams,
          state.bpm,
          state.totalBars,
          bitDepth,
          (pct) => {
            setProgress(pct);
            setStatusText(`Rendering Master Mix (${pct}%)...`);
          }
        );

        const filename = `${state.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-master-${bitDepth}bit.wav`;
        setDownloadReady({ blob: wavBlob, filename });
      }

      setIsExporting(false);
      setProgress(100);
      setStatusText('Render complete!');
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      alert('Error during audio render.');
    }
  };

  const handleDownloadFile = () => {
    if (!downloadReady) return;
    OfflineRenderer.downloadBlob(downloadReady.blob, downloadReady.filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#181a24] border border-[#35394a] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-950/60 via-[#1f2230] to-[#181a24] border-b border-[#2e3244]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Audio & Stems</h2>
              <p className="text-xs text-gray-400">Offline Non-Realtime High-Speed DSP Bounce</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#282b3a] text-gray-400 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-gray-200">
          {/* Export Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#12141c] p-1 rounded-lg border border-[#2b2e3e]">
            <button
              onClick={() => {
                setExportMode('stems');
                setDownloadReady(null);
              }}
              className={`py-2 px-2 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                exportMode === 'stems'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Archive size={13} />
              <span>Stems (.ZIP)</span>
            </button>
            <button
              onClick={() => {
                setExportMode('master');
                setDownloadReady(null);
              }}
              className={`py-2 px-2 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                exportMode === 'master'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileAudio size={13} />
              <span>Master (.WAV)</span>
            </button>
            <button
              onClick={() => {
                setExportMode('midi');
                setDownloadReady(null);
              }}
              className={`py-2 px-2 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                exportMode === 'midi'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music size={13} />
              <span>MIDI (.MID)</span>
            </button>
          </div>

          {/* Bit Depth & Project Summary */}
          <div className="bg-[#12141c] p-3.5 rounded-lg border border-[#2b2e3e] space-y-2.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400">Project:</span>
              <span className="text-white font-bold">{state.projectName}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400">BPM & Key:</span>
              <span className="text-orange-400 font-bold">{state.bpm} BPM • {state.selectedKey} {state.selectedScale}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400">Length:</span>
              <span className="text-sky-400 font-bold">{state.totalBars} Bars ({(state.totalBars * (60 / state.bpm) * 4).toFixed(1)}s)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-[#252838]">
              <span className="text-gray-400">Audio Precision:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setBitDepth(16)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    bitDepth === 16 ? 'bg-cyan-600 text-white' : 'bg-[#232634] text-gray-400'
                  }`}
                >
                  16-bit PCM
                </button>
                <button
                  onClick={() => setBitDepth(32)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    bitDepth === 32 ? 'bg-cyan-600 text-white' : 'bg-[#232634] text-gray-400'
                  }`}
                >
                  32-bit Float
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar & Status */}
          {isExporting && (
            <div className="space-y-1.5 bg-[#12141c] p-3 rounded-lg border border-[#2d3142]">
              <div className="flex justify-between text-xs font-mono text-emerald-400">
                <span className="truncate max-w-[280px]">{statusText}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#1b1e2a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {downloadReady && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-mono">
              <CheckCircle2 size={16} />
              <span>Render ready: {downloadReady.filename}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!downloadReady ? (
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                <span>{isExporting ? 'Bouncing DSP Offline...' : exportMode === 'stems' ? 'Export Stems ZIP Package' : 'Export 32/16-bit Master WAV'}</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadFile}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/40 transition-all"
              >
                <Download size={15} />
                <span>Download {exportMode === 'stems' ? 'ZIP Archive' : 'WAV Master'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
