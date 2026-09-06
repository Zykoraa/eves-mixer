import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers,
  X,
  FolderOpen,
  Play,
  Square,
  Volume2,
  Download,
  CheckCircle2,
  Sparkles,
  Music,
  Disc,
  FileArchive,
  RefreshCw,
} from 'lucide-react';
import { StemSeparator } from '../audio/StemSeparator';
import { StemSeparationResult, PlaylistClip } from '../types/daw';
import { useDawStore } from '../store/useDawStore';
import { AudioEngine } from '../audio/AudioEngine';

interface StemSeparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StemSeparatorModal: React.FC<StemSeparatorModalProps> = ({ isOpen, onClose }) => {
  const [state, store] = useDawStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const separator = StemSeparator.getInstance();
  const audioEngine = AudioEngine.getInstance();

  const [result, setResult] = useState<StemSeparationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStemPlaying, setActiveStemPlaying] = useState<string | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Volumes & Mutes per stem
  const [stemStates, setStemStates] = useState({
    vocals: { volume: 1.0, mute: false },
    drums: { volume: 1.0, mute: false },
    bass: { volume: 1.0, mute: false },
    other: { volume: 1.0, mute: false },
  });

  useEffect(() => {
    separator.init(audioEngine.ctx);
  }, [separator, audioEngine]);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Demo audio loader
  const handleLoadDemo = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);

    const ctx = audioEngine.ctx;
    const sampleRate = ctx.sampleRate;
    const duration = 4.0;
    const buffer = ctx.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);
    const bL = buffer.getChannelData(0);
    const bR = buffer.getChannelData(1);

    // Generate demo mixed track (Kick, Snare, 808 Bass, Synth, Vocals)
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      const beatT = t % 0.5; // 120 bpm = 0.5s beat

      // Drums: Kick on beat 0, 2
      let kick = 0;
      if (t < 0.25 || (t >= 1.0 && t < 1.25) || (t >= 2.0 && t < 2.25) || (t >= 3.0 && t < 3.25)) {
        const subPhase = (t % 1.0);
        kick = Math.sin(2 * Math.PI * (120 - subPhase * 350) * subPhase) * Math.exp(-subPhase * 18);
      }

      // Drums: Snare on beat 1, 3
      let snare = 0;
      if ((t >= 0.5 && t < 0.75) || (t >= 1.5 && t < 1.75) || (t >= 2.5 && t < 2.75) || (t >= 3.5 && t < 3.75)) {
        const snPhase = ((t - 0.5) % 1.0);
        snare = (Math.random() * 2 - 1) * Math.exp(-snPhase * 16) * 0.4;
      }

      // Bass: Sub 55 Hz
      const bass = Math.sin(2 * Math.PI * 55 * t) * 0.45;

      // Vocal center: Formant vowel
      const vocal = Math.sin(2 * Math.PI * 440 * t) * Math.sin(2 * Math.PI * 880 * t) * 0.3;

      // Other / Synth: Wide stereo chorus
      const synthL = Math.sin(2 * Math.PI * 330 * t) * 0.25;
      const synthR = Math.sin(2 * Math.PI * 333 * t) * 0.25;

      bL[i] = kick * 0.6 + snare + bass + vocal + synthL;
      bR[i] = kick * 0.6 + snare + bass + vocal + synthR;
    }

    try {
      const sep = await separator.separateAudioBuffer(buffer, 'Pro_Trap_Groove_Demo.wav', (p) => {
        setProgress(Math.round(p * 100));
      });
      setResult(sep);
      showNotice('Separation complete! 4 stems extracted: Vocals, Drums, Bass, Instruments.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [audioEngine, separator]);

  // Load custom file
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await audioEngine.ctx.decodeAudioData(arrayBuffer);
      const sep = await separator.separateAudioBuffer(decoded, file.name, (p) => {
        setProgress(Math.round(p * 100));
      });
      setResult(sep);
      showNotice(`Successfully extracted 4 stems from ${file.name}!`);
    } catch (err) {
      alert('Failed to process audio file. Please choose a valid WAV or MP3 file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Audition single stem
  const playStem = (stemKey: 'vocals' | 'drums' | 'bass' | 'other', buf: AudioBuffer | null) => {
    if (!buf) return;

    if (activeStemPlaying === stemKey) {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setActiveStemPlaying(null);
      return;
    }

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (err) {}
    }

    const src = audioEngine.ctx.createBufferSource();
    src.buffer = buf;
    const gainNode = audioEngine.ctx.createGain();
    gainNode.gain.value = stemStates[stemKey].volume;

    src.connect(gainNode);
    gainNode.connect(audioEngine.ctx.destination);
    src.onended = () => {
      setActiveStemPlaying(null);
      currentSourceRef.current = null;
    };

    src.start();
    currentSourceRef.current = src;
    setActiveStemPlaying(stemKey);
  };

  // Download individual stem WAV
  const downloadStem = (name: string, buf: AudioBuffer | null) => {
    if (!buf) return;
    const blob = separator.bufferToWavBlob(buf);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export full Stem Pack ZIP
  const handleDownloadZip = async () => {
    if (!result) return;
    try {
      showNotice('Zipping stems into high-res package...');
      const zipBlob = await separator.exportStemZip(result);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.fileName.replace(/\.[^/.]+$/, '')}_Stems.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showNotice('Stem Pack ZIP downloaded successfully!');
    } catch (err) {
      alert('Failed to create ZIP file.');
    }
  };

  // Send all 4 stems into Playlist tracks
  const handleSendAllToPlaylist = () => {
    if (!result) return;

    const stems: { key: string; name: string; buffer: AudioBuffer | null; trackIdx: number; color: string }[] = [
      { key: 'vocals', name: 'Vocals', buffer: result.vocals, trackIdx: 0, color: '#06b6d4' },
      { key: 'drums', name: 'Drums', buffer: result.drums, trackIdx: 1, color: '#f97316' },
      { key: 'bass', name: 'Bass', buffer: result.bass, trackIdx: 2, color: '#a855f7' },
      { key: 'other', name: 'Instruments', buffer: result.other, trackIdx: 3, color: '#10b981' },
    ];

    const barDuration = (60 / state.bpm) * 4;
    const lengthBars = Math.max(1, Math.ceil(result.duration / barDuration));

    stems.forEach((st) => {
      if (!st.buffer) return;
      const blob = separator.bufferToWavBlob(st.buffer);
      const url = URL.createObjectURL(blob);
      audioEngine.cacheAudioBuffer(url, st.buffer);

      const clip: PlaylistClip = {
        id: `stem-${st.key}-${Date.now()}`,
        trackIndex: st.trackIdx,
        name: `${result.fileName.slice(0, 8)}: ${st.name}`,
        startBar: 0,
        lengthBars,
        color: st.color,
        type: 'audio',
        audioBlobUrl: url,
      };

      store.addPlaylistClip(clip);
    });

    showNotice('All 4 stems sent to Playlist tracks 1-4!');
    onClose();
    store.setActiveView('playlist');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="bg-[#14161f] border border-[#2b3040] rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#1b1e2a] border-b border-[#2b3040] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">EVE STEM SEPARATOR</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold border border-cyan-500/30">
                  AI 4-STEM SPLITTER
                </span>
              </div>
              <p className="text-xs text-gray-400">Harmonic-Percussive Source Separation & Spectral Masking</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242838] hover:bg-[#32374c] border border-[#373c52] text-xs font-mono text-white transition-all"
            >
              <FolderOpen size={14} />
              <span>Load Audio File</span>
            </button>
            <button
              onClick={handleLoadDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242838] hover:bg-[#32374c] border border-[#373c52] text-xs font-mono text-amber-400 transition-all"
            >
              <RefreshCw size={13} />
              <span>Load Demo Song</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#232735] transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="bg-cyan-900/80 border-b border-cyan-500/40 px-5 py-2 flex items-center gap-2 text-xs font-mono text-cyan-200">
            <CheckCircle2 size={14} className="text-cyan-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
          {/* Progress State */}
          {isProcessing && (
            <div className="bg-[#191c28] border border-cyan-500/40 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold animate-pulse">
                  SEPARATING AUDIO INTO 4 ISOLATED STEMS...
                </span>
                <span className="text-white font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#10121a] rounded-full overflow-hidden border border-[#2b3040]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-gray-400">
                Decomposing: Center-Channel Vocals &bull; Transient Drums &bull; Sub-220Hz Bass &bull; Stereo Harmonic Instruments
              </p>
            </div>
          )}

          {/* Empty State / Initial Prompt */}
          {!result && !isProcessing && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#2f3446] hover:border-cyan-500/60 rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors bg-[#11131a]"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Disc size={26} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Select Any Song, Beat, or Sample to Separate</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md">
                  Splits full mixed songs into isolated <strong>Vocals</strong>, <strong>Drums</strong>, <strong>Bass</strong>, and <strong>Instruments</strong> with 1 click.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadDemo();
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold shadow-md shadow-cyan-500/20"
              >
                Or Try with Demo Song
              </button>
            </div>
          )}

          {/* 4 Stem Channel Cards */}
          {result && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Vocals */}
              <div className="bg-[#181a25] border border-cyan-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    <span className="text-sm font-extrabold text-white">VOCALS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playStem('vocals', result.vocals)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                        activeStemPlaying === 'vocals'
                          ? 'bg-red-500 text-white'
                          : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                      }`}
                    >
                      {activeStemPlaying === 'vocals' ? <Square size={12} /> : <Play size={12} />}
                      <span>{activeStemPlaying === 'vocals' ? 'Stop' : 'Play'}</span>
                    </button>
                    <button
                      onClick={() => downloadStem(`${result.fileName}_Vocals`, result.vocals)}
                      title="Download Vocals WAV"
                      className="p-1 rounded bg-[#242738] hover:bg-[#32364c] text-gray-300 hover:text-white"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
                <div className="h-10 bg-[#0e1017] rounded-lg border border-[#2b3040] flex items-center px-3 text-[10px] font-mono text-cyan-400">
                  Mid/Center Formant Harmonic Filtered
                </div>
              </div>

              {/* Drums */}
              <div className="bg-[#181a25] border border-orange-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400" />
                    <span className="text-sm font-extrabold text-white">DRUMS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playStem('drums', result.drums)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                        activeStemPlaying === 'drums'
                          ? 'bg-red-500 text-white'
                          : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                      }`}
                    >
                      {activeStemPlaying === 'drums' ? <Square size={12} /> : <Play size={12} />}
                      <span>{activeStemPlaying === 'drums' ? 'Stop' : 'Play'}</span>
                    </button>
                    <button
                      onClick={() => downloadStem(`${result.fileName}_Drums`, result.drums)}
                      title="Download Drums WAV"
                      className="p-1 rounded bg-[#242738] hover:bg-[#32364c] text-gray-300 hover:text-white"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
                <div className="h-10 bg-[#0e1017] rounded-lg border border-[#2b3040] flex items-center px-3 text-[10px] font-mono text-orange-400">
                  Transient HPSS Percussive Extraction
                </div>
              </div>

              {/* Bass */}
              <div className="bg-[#181a25] border border-purple-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
                    <span className="text-sm font-extrabold text-white">BASS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playStem('bass', result.bass)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                        activeStemPlaying === 'bass'
                          ? 'bg-red-500 text-white'
                          : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                      }`}
                    >
                      {activeStemPlaying === 'bass' ? <Square size={12} /> : <Play size={12} />}
                      <span>{activeStemPlaying === 'bass' ? 'Stop' : 'Play'}</span>
                    </button>
                    <button
                      onClick={() => downloadStem(`${result.fileName}_Bass`, result.bass)}
                      title="Download Bass WAV"
                      className="p-1 rounded bg-[#242738] hover:bg-[#32364c] text-gray-300 hover:text-white"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
                <div className="h-10 bg-[#0e1017] rounded-lg border border-[#2b3040] flex items-center px-3 text-[10px] font-mono text-purple-400">
                  Sub-220Hz Mono Sum Harmonic Carve
                </div>
              </div>

              {/* Other / Instruments */}
              <div className="bg-[#181a25] border border-emerald-500/40 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    <span className="text-sm font-extrabold text-white">INSTRUMENTS / OTHER</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playStem('other', result.other)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                        activeStemPlaying === 'other'
                          ? 'bg-red-500 text-white'
                          : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      {activeStemPlaying === 'other' ? <Square size={12} /> : <Play size={12} />}
                      <span>{activeStemPlaying === 'other' ? 'Stop' : 'Play'}</span>
                    </button>
                    <button
                      onClick={() => downloadStem(`${result.fileName}_Instruments`, result.other)}
                      title="Download Instruments WAV"
                      className="p-1 rounded bg-[#242738] hover:bg-[#32364c] text-gray-300 hover:text-white"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
                <div className="h-10 bg-[#0e1017] rounded-lg border border-[#2b3040] flex items-center px-3 text-[10px] font-mono text-emerald-400">
                  Stereo Residual Harmonic Atmosphere
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {result && (
          <div className="px-5 py-3.5 bg-[#1b1e2a] border-t border-[#2b3040] flex items-center justify-between">
            <div className="text-xs font-mono text-gray-400">
              File: <span className="text-white font-bold">{result.fileName}</span> ({result.duration.toFixed(1)}s)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252838] hover:bg-[#33374c] border border-[#373c52] text-xs font-mono font-bold text-white transition-all"
              >
                <FileArchive size={14} className="text-amber-400" />
                <span>Export Stem Pack (ZIP)</span>
              </button>

              <button
                onClick={handleSendAllToPlaylist}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Layers size={14} />
                <span>Send All 4 Stems to Playlist</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
