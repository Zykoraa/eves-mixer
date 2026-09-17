import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Volume2,
  Headphones,
  Activity,
  Sliders,
  Sparkles,
  CheckCircle2,
  Play,
  Square,
  Circle,
  RefreshCw,
  Layers,
  Download,
  Music,
  AlertCircle,
  Info,
  Zap,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { PlaylistRecorder, LivePitchInfo, RecordingResult } from '../audio/PlaylistRecorder';
import { AudioEngine } from '../audio/AudioEngine';
import { isNoteInScale, NOTE_NAMES } from '../audio/Presets';
import { RootNote, MusicalScale, PlaylistClip } from '../types/daw';

interface RecordedTake {
  id: string;
  blobUrl: string;
  audioBuffer: AudioBuffer;
  durationSeconds: number;
  startBar: number;
  trackIndex: number;
  timestamp: string;
}

export const VocalStudioView: React.FC = () => {
  const [state, store] = useDawStore();
  const recorder = PlaylistRecorder.getInstance();
  const audioEngine = AudioEngine.getInstance();

  // Hardware mic states
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [inputGain, setInputGain] = useState<number>(1.0);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [monitorVolume, setMonitorVolume] = useState<number>(0.8);
  const [lowCut, setLowCut] = useState<boolean>(true);

  // Metering & Tuner
  const [peakLevel, setPeakLevel] = useState<number>(0);
  const [rmsLevel, setRmsLevel] = useState<number>(0);
  const [currentPitch, setCurrentPitch] = useState<LivePitchInfo | null>(null);

  // Recording & Count-in
  const [countInBeats, setCountInBeats] = useState<number>(4); // 4 beats = 1 bar
  const [countInValue, setCountInValue] = useState<number | null>(null);
  const [targetTrackIdx, setTargetTrackIdx] = useState<number>(4); // Default to Track 5 (index 4)
  const [takes, setTakes] = useState<RecordedTake[]>([]);
  const [activeAuditionId, setActiveAuditionId] = useState<string | null>(null);
  const auditionSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [appliedPresetName, setAppliedPresetName] = useState<string | null>(null);

  // Load available audio input devices
  const refreshDevices = useCallback(async () => {
    try {
      // Prompt permissions once if needed
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach((t) => t.stop()));
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
      setDevices(audioInputs);
      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate audio inputs:', err);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Hook up audio engine and listeners
  useEffect(() => {
    recorder.init(audioEngine.ctx);

    const unsubLevel = recorder.addLevelListener((pk, rms) => {
      setPeakLevel(pk);
      setRmsLevel(rms);
    });

    const unsubPitch = recorder.addPitchListener((pitch) => {
      setCurrentPitch(pitch);
    });

    return () => {
      unsubLevel();
      unsubPitch();
    };
  }, [audioEngine, recorder]);

  // Apply device selection
  const handleDeviceChange = async (devId: string) => {
    setSelectedDeviceId(devId);
    await recorder.ensureMediaStream(devId);
  };

  // Toggle headphone monitor
  const handleToggleMonitoring = async () => {
    const next = !isMonitoring;
    if (next) {
      const ok = await recorder.ensureMediaStream(selectedDeviceId);
      if (ok) {
        recorder.setMonitoring(true, monitorVolume);
        setIsMonitoring(true);
      }
    } else {
      recorder.setMonitoring(false);
      setIsMonitoring(false);
    }
  };

  // Toggle low cut
  const handleToggleLowCut = () => {
    const next = !lowCut;
    setLowCut(next);
    recorder.setLowCut(next);
  };

  // Input gain slider
  const handleGainChange = (val: number) => {
    setInputGain(val);
    recorder.setInputGain(val);
  };

  // Play a count-in metronome beep
  const playBeep = (freq: number, dur: number = 0.08) => {
    try {
      const ctx = audioEngine.ctx;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      g.gain.setValueAtTime(0.35, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
  };

  // Start recording with optional count-in
  const handleStartVocalRecording = async () => {
    if (state.isRecording) {
      handleStopVocalRecording();
      return;
    }

    const ready = await recorder.ensureMediaStream(selectedDeviceId);
    if (!ready) {
      alert('Could not access your microphone. Please check browser microphone permissions.');
      return;
    }

    // Arm the target playlist track
    state.playlistTracks.forEach((t, i) => {
      t.isArmed = i === targetTrackIdx;
    });
    store.syncAudioEngineData();

    if (countInBeats > 0) {
      // 4-beat count-in
      const beatMs = (60 / state.bpm) * 1000;
      let remaining = countInBeats;
      setCountInValue(remaining);
      playBeep(remaining === 1 ? 1200 : 800);

      const countInterval = window.setInterval(async () => {
        remaining -= 1;
        if (remaining > 0) {
          setCountInValue(remaining);
          playBeep(remaining === 1 ? 1200 : 800);
        } else {
          clearInterval(countInterval);
          setCountInValue(null);
          // Start playback and recording right on beat 1
          if (!state.isPlaying) {
            store.togglePlay();
          }
          await recorder.startRecording(targetTrackIdx, state.currentBar, state.bpm);
          store.setRecording(true);
        }
      }, beatMs);
    } else {
      if (!state.isPlaying) {
        store.togglePlay();
      }
      await recorder.startRecording(targetTrackIdx, state.currentBar, state.bpm);
      store.setRecording(true);
    }
  };

  const handleStopVocalRecording = () => {
    setCountInValue(null);
    const result: RecordingResult | null = recorder.stopRecording();
    store.setRecording(false);

    if (state.isPlaying) {
      store.stopPlayback();
    }

    if (result) {
      audioEngine.cacheAudioBuffer(result.blobUrl, result.audioBuffer);
      const newClip: PlaylistClip = {
        id: `vocal-take-${Date.now()}`,
        trackIndex: result.trackIndex,
        name: `Vocal Take (Bar ${result.startBar + 1})`,
        startBar: result.startBar,
        lengthBars: result.durationBars,
        color: '#f59e0b',
        type: 'audio',
        audioBlobUrl: result.blobUrl,
      };
      store.addPlaylistClip(newClip);

      // Add to session takes
      const take: RecordedTake = {
        id: newClip.id,
        blobUrl: result.blobUrl,
        audioBuffer: result.audioBuffer,
        durationSeconds: result.durationSeconds,
        startBar: result.startBar,
        trackIndex: result.trackIndex,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setTakes((prev) => [take, ...prev]);
    }
  };

  // Audition a take
  const handleAuditionTake = (take: RecordedTake) => {
    if (activeAuditionId === take.id) {
      if (auditionSourceRef.current) {
        try { auditionSourceRef.current.stop(); } catch {}
        auditionSourceRef.current = null;
      }
      setActiveAuditionId(null);
      return;
    }

    if (auditionSourceRef.current) {
      try { auditionSourceRef.current.stop(); } catch {}
      auditionSourceRef.current = null;
    }

    const ctx = audioEngine.ctx;
    const src = ctx.createBufferSource();
    src.buffer = take.audioBuffer;
    src.connect(ctx.destination);
    src.onended = () => setActiveAuditionId(null);
    src.start();
    auditionSourceRef.current = src;
    setActiveAuditionId(take.id);
  };

  // Vocal Presets
  const applyPreset = (name: string) => {
    setAppliedPresetName(name);
    store.applyProVocalChain(targetTrackIdx + 1);
    setTimeout(() => setAppliedPresetName(null), 2500);
  };

  // Scale analysis for tuner
  const isCurrentPitchInKey = currentPitch
    ? isNoteInScale(Math.round(currentPitch.midi), state.selectedKey, state.selectedScale)
    : false;

  return (
    <div className="flex-1 flex flex-col bg-[#111318] text-gray-200 overflow-y-auto select-none p-4 md:p-6 space-y-6">
      {/* Top Banner / Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#1a1e29] via-[#1f2230] to-[#181a24] p-5 rounded-2xl border border-[#2d3244] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Mic size={28} className={state.isRecording ? 'animate-bounce text-red-400' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Vocal Studio & Recording Booth</h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                PRO VOCAL ENGINE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Zero-latency headphone monitoring, real-time key tuner, 80Hz rumble cut, and 1-click radio vocal chains.
            </p>
          </div>
        </div>

        {/* Current Scale / Key Indicator */}
        <div className="flex items-center gap-3 bg-[#141620] px-4 py-2.5 rounded-xl border border-[#2a2f42]">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 uppercase font-mono block">SONG KEY & SCALE</span>
            <span className="text-sm font-bold text-sky-400 font-mono">
              {state.selectedKey} {state.selectedScale.toUpperCase()}
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
        </div>
      </div>

      {/* Main Grid: Left Controls (Mic, Tuner, Presets), Right (Transport & Takes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mic Hardware & Tuner (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Hardware Input & Monitoring */}
          <div className="bg-[#181b24] p-5 rounded-2xl border border-[#2c3142] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#292e3e] pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Microphone Hardware & Monitor</h2>
              </div>
              <button
                onClick={refreshDevices}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded bg-[#222736] hover:bg-[#2b3144] transition-colors"
              >
                <RefreshCw size={12} />
                <span>Refresh Inputs</span>
              </button>
            </div>

            <div className="space-y-3">
              {/* Mic Selector */}
              <div>
                <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                  Audio Input Device (Microphone):
                </label>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="w-full bg-[#12141c] text-xs text-gray-200 border border-[#2f354a] rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
                >
                  {devices.length === 0 ? (
                    <option value="">Default Microphone</option>
                  ) : (
                    devices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Input Gain Slider & VU Peak Meter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>MIC INPUT GAIN:</span>
                    <span className="text-amber-400 font-bold">{Math.round(inputGain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={2.0}
                    step={0.05}
                    value={inputGain}
                    onChange={(e) => handleGainChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#252a38] rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
                    <span>LIVE PEAK LEVEL:</span>
                    <span
                      className={`font-bold ${
                        peakLevel > 0.85 ? 'text-red-400' : peakLevel > 0.6 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {peakLevel > 0 ? `${Math.round(20 * Math.log10(peakLevel))} dB` : '-inf'}
                    </span>
                  </div>
                  {/* Visual VU Meter Bar */}
                  <div className="w-full h-3.5 bg-[#12141c] rounded-md overflow-hidden border border-[#2f354a] flex">
                    <div
                      className="h-full transition-all duration-75"
                      style={{
                        width: `${Math.min(100, peakLevel * 100)}%`,
                        background:
                          peakLevel > 0.88
                            ? 'linear-gradient(to right, #22c55e, #eab308, #ef4444)'
                            : peakLevel > 0.65
                            ? 'linear-gradient(to right, #22c55e, #eab308)'
                            : '#22c55e',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Toggles: Low-Cut 80Hz & Headphone Monitoring */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleToggleLowCut}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    lowCut
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                      : 'bg-[#141620] border-[#292e3e] text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity size={18} className={lowCut ? 'text-amber-400' : 'text-gray-500'} />
                    <div className="text-left">
                      <span className="text-xs font-bold block">80Hz Low-Cut Filter</span>
                      <span className="text-[10px] text-gray-400">Eliminates room rumble & mic thumps</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      lowCut ? 'bg-amber-500 text-black' : 'bg-[#222736] text-gray-400'
                    }`}
                  >
                    {lowCut ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={handleToggleMonitoring}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isMonitoring
                      ? 'bg-sky-500/15 border-sky-500/50 text-sky-200'
                      : 'bg-[#141620] border-[#292e3e] text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Headphones size={18} className={isMonitoring ? 'text-sky-400 animate-pulse' : 'text-gray-500'} />
                    <div className="text-left">
                      <span className="text-xs font-bold block">Headphone Monitoring</span>
                      <span className="text-[10px] text-gray-400">Hear your singing in real-time</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isMonitoring ? 'bg-sky-500 text-black' : 'bg-[#222736] text-gray-400'
                    }`}
                  >
                    {isMonitoring ? 'LIVE' : 'MUTE'}
                  </span>
                </button>
              </div>

              {/* Headphone warning tip */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/30 text-sky-300 text-xs">
                <Info size={15} className="flex-shrink-0 text-sky-400" />
                <span>
                  <strong>Tip for clean recordings:</strong> Always wear headphones when singing so the beat doesn't leak into your mic.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Real-time Pitch & Key Tuner */}
          <div className="bg-[#181b24] p-5 rounded-2xl border border-[#2c3142] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#292e3e] pb-3">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-sky-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Real-Time Pitch Tuner</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                LIVE DETECTOR
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-[#12141c] border border-[#252a38]">
              {/* Main Sung Note Display */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all shadow-xl ${
                    currentPitch
                      ? isCurrentPitchInKey
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/20'
                        : 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/20'
                      : 'bg-[#1b1e2a] border-[#2f3548] text-gray-500'
                  }`}
                >
                  <span className="text-3xl font-black font-mono">
                    {currentPitch ? currentPitch.noteName : '--'}
                  </span>
                  <span className="text-[10px] font-mono">
                    {currentPitch ? `${currentPitch.freq} Hz` : 'Sing into mic'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono text-gray-400 block uppercase">SCALE COMPLIANCE:</span>
                  {currentPitch ? (
                    isCurrentPitchInKey ? (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400">
                        <CheckCircle2 size={16} />
                        <span>IN KEY ({state.selectedKey} {state.selectedScale})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-400">
                        <AlertCircle size={16} />
                        <span>OUT OF SCALE</span>
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-gray-500 italic">Sing a note to check pitch...</span>
                  )}
                </div>
              </div>

              {/* Pitch Deviation Needle (-50 to +50 cents) */}
              <div className="w-full sm:w-48 space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>-50¢ FLAT</span>
                  <span className="font-bold text-white">
                    {currentPitch ? `${currentPitch.cents > 0 ? '+' : ''}${currentPitch.cents}¢` : '0¢'}
                  </span>
                  <span>SHARP +50¢</span>
                </div>

                <div className="relative w-full h-3 bg-[#1d202c] rounded-full overflow-hidden border border-[#31374a]">
                  {/* Center zero line */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 z-10" />
                  {/* Deviation indicator */}
                  {currentPitch && (
                    <div
                      className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 ${
                        Math.abs(currentPitch.cents) <= 10 ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-amber-400'
                      }`}
                      style={{
                        left: `calc(${50 + (currentPitch.cents / 50) * 45}% - 5px)`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 1-Click Pro Vocal Chains */}
          <div className="bg-[#181b24] p-5 rounded-2xl border border-[#2c3142] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#292e3e] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. 1-Click Radio Vocal Chains</h2>
              </div>
              {appliedPresetName && (
                <span className="text-xs text-emerald-400 font-bold animate-pulse">
                  ✓ Applied: {appliedPresetName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'pop',
                  name: 'Modern Radio Pop',
                  desc: 'Air boost at 11kHz, 3.2:1 optical compression, silky plate reverb, low cut',
                  color: 'hover:border-pink-500/50 hover:bg-pink-500/10',
                  badge: 'POP / BILLBOARD',
                },
                {
                  id: 'trap',
                  name: 'Trap / Auto-Tune Rap',
                  desc: 'Punchy fast compressor, presence boost, tempo-synced 1/8 slap delay',
                  color: 'hover:border-amber-500/50 hover:bg-amber-500/10',
                  badge: 'TRAP / HIP-HOP',
                },
                {
                  id: 'rnb',
                  name: 'Warm R&B / Lo-Fi',
                  desc: 'Mids warmth, subtle tube color, dark chamber ambience, de-essing curve',
                  color: 'hover:border-purple-500/50 hover:bg-purple-500/10',
                  badge: 'R&B / SOUL',
                },
                {
                  id: 'ballad',
                  name: 'Spacious Ballad',
                  desc: 'Smooth transparent dynamics, stereo ping-pong delay, lush 2.8s reverb',
                  color: 'hover:border-sky-500/50 hover:bg-sky-500/10',
                  badge: 'BALLAD / INDIE',
                },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.name)}
                  className={`p-3.5 rounded-xl border border-[#2a2f40] bg-[#141620] text-left transition-all ${preset.color} group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {preset.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#242938] text-gray-300">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recording Controls & Takes (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Big Recording Transport */}
          <div className="bg-[#181b24] p-5 rounded-2xl border border-[#2c3142] shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#292e3e] pb-3">
              <div className="flex items-center gap-2">
                <Circle size={18} className="text-red-500" fill="currentColor" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Vocal Take Recorder</h2>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  state.isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : countInValue !== null
                    ? 'bg-amber-500 text-black animate-bounce'
                    : 'bg-[#242938] text-gray-400'
                }`}
              >
                {state.isRecording ? '● RECORDING' : countInValue !== null ? `COUNT-IN: ${countInValue}` : 'READY'}
              </span>
            </div>

            {/* Target Track Selector */}
            <div>
              <label className="text-[11px] font-mono text-gray-400 uppercase block mb-1">
                Record Into Playlist Track:
              </label>
              <select
                value={targetTrackIdx}
                onChange={(e) => setTargetTrackIdx(Number(e.target.value))}
                className="w-full bg-[#12141c] text-xs text-gray-200 border border-[#2f354a] rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer font-bold"
              >
                {state.playlistTracks.map((t, idx) => (
                  <option key={t.id} value={idx}>
                    Track {idx + 1}: {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Count-in Selector */}
            <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1">
              <span>METRONOME COUNT-IN:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: 'None', val: 0 },
                  { label: '1 Bar (4 Beats)', val: 4 },
                  { label: '2 Bars (8 Beats)', val: 8 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setCountInBeats(item.val)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                      countInBeats === item.val
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#222736] text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Huge Action Button */}
            <div className="pt-2">
              {countInValue !== null ? (
                <div className="w-full py-6 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex flex-col items-center justify-center animate-pulse">
                  <span className="text-4xl font-black text-amber-300 font-mono">{countInValue}</span>
                  <span className="text-xs font-mono text-amber-200 uppercase mt-1">GET READY TO SING!</span>
                </div>
              ) : (
                <button
                  onClick={state.isRecording ? handleStopVocalRecording : handleStartVocalRecording}
                  className={`w-full py-5 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-3 ${
                    state.isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/40 animate-pulse'
                      : 'bg-gradient-to-r from-red-600 via-amber-600 to-red-500 hover:brightness-110 text-white shadow-red-500/25 hover:scale-[1.01]'
                  }`}
                >
                  {state.isRecording ? (
                    <>
                      <Square size={20} fill="currentColor" />
                      <span>STOP & SAVE VOCAL TAKE</span>
                    </>
                  ) : (
                    <>
                      <Circle size={20} fill="currentColor" />
                      <span>START VOCAL RECORDING</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              Recorded takes are instantly placed on your song arranger timeline and stored in your session takes below.
            </p>
          </div>

          {/* Card: Session Takes Manager */}
          <div className="bg-[#181b24] p-5 rounded-2xl border border-[#2c3142] shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#292e3e] pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Session Takes ({takes.length})</h2>
              </div>
              {takes.length > 0 && (
                <button
                  onClick={() => setTakes([])}
                  className="text-[10px] text-gray-400 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Clear List</span>
                </button>
              )}
            </div>

            {takes.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#12141c] border border-dashed border-[#2b3040] text-center space-y-1">
                <Mic size={24} className="mx-auto text-gray-500 mb-2" />
                <p className="text-xs font-bold text-gray-300">No vocal takes recorded yet</p>
                <p className="text-[11px] text-gray-500">Hit Start Vocal Recording above to capture your vocals!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {takes.map((take, idx) => (
                  <div
                    key={take.id}
                    className="p-3 rounded-xl bg-[#13151e] border border-[#272c3d] flex items-center justify-between gap-2 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">Take #{takes.length - idx}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({take.durationSeconds.toFixed(1)}s)</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block">
                        Placed on Track {take.trackIndex + 1} at Bar {take.startBar + 1} • {take.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audition Play */}
                      <button
                        onClick={() => handleAuditionTake(take)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          activeAuditionId === take.id
                            ? 'bg-amber-500 text-black'
                            : 'bg-[#222736] text-gray-300 hover:text-white hover:bg-[#2e3448]'
                        }`}
                        title="Audition Take"
                      >
                        {activeAuditionId === take.id ? <Square size={14} /> : <Play size={14} />}
                      </button>

                      {/* Send to NewTone pitch editor */}
                      <button
                        onClick={() => {
                          store.setActiveView('newTone');
                        }}
                        className="p-1.5 rounded-lg bg-[#222736] text-cyan-300 hover:text-white hover:bg-cyan-600/30 transition-colors text-[10px] font-mono font-bold flex items-center gap-1"
                        title="Tune in NewTone Pitch Editor"
                      >
                        <span>TUNE</span>
                        <ArrowRight size={11} />
                      </button>

                      {/* Download WAV */}
                      <a
                        href={take.blobUrl}
                        download={`vocal-take-${idx + 1}.wav`}
                        className="p-1.5 rounded-lg bg-[#222736] text-gray-300 hover:text-white hover:bg-[#2e3448] transition-colors"
                        title="Download WAV"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
