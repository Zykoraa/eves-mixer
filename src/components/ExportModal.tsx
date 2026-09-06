import React, { useState } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  FileAudio,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { WavExporter } from '../audio/WavExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [state] = useDawStore();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadReady, setDownloadReady] = useState<Blob | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress(10);
    setDownloadReady(null);

    try {
      const blob = await WavExporter.exportSongToWav(
        state.tracks,
        state.patterns,
        state.clips,
        state.synthParams,
        state.bpm,
        state.totalBars,
        (pct) => setProgress(pct)
      );

      setDownloadReady(blob);
      setIsExporting(false);
      setProgress(100);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
      alert('Error during audio render.');
    }
  };

  const handleDownloadFile = () => {
    if (!downloadReady) return;
    WavExporter.downloadBlob(
      downloadReady,
      `${state.projectName.toLowerCase().replace(/\s+/g, '-')}-master.wav`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#181a24] border border-[#35394a] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-950/60 via-[#1f2230] to-[#181a24] border-b border-[#2e3244]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Audio (Studio WAV)</h2>
              <p className="text-xs text-gray-400">Offline Sample-Accurate 44.1kHz 16-bit Master</p>
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
          <div className="bg-[#12141c] p-3.5 rounded-lg border border-[#2b2e3e] space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400">Track:</span>
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
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-emerald-400">
                <span>Rendering Audio DSP...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#12141c] rounded-full overflow-hidden border border-[#2d3142]">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {downloadReady && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-mono">
              <CheckCircle2 size={16} />
              <span>Studio master audio rendered successfully!</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!downloadReady ? (
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={15} className="animate-spin" /> : <FileAudio size={15} />}
                <span>{isExporting ? 'Rendering...' : 'Render Master WAV'}</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadFile}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/40 transition-all"
              >
                <Download size={15} />
                <span>Download WAV File</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
