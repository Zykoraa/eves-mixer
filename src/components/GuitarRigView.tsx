import React, { useState, useEffect, useRef } from 'react';
import {
  Guitar,
  Power,
  Volume2,
  Sliders,
  Radio,
  Disc,
  Mic,
  Activity,
  Layers,
  Zap,
  Sparkles,
  Play,
  Square,
  RefreshCw,
  Gauge,
  CheckCircle2,
  VolumeX,
} from 'lucide-react';
import { useDawStore } from '../store/useDawStore';
import { AudioEngine } from '../audio/AudioEngine';
import {
  GuitarAmpModel,
  GuitarCabModel,
  TunerResult,
} from '../audio/GuitarEngine';

export const GuitarRigView: React.FC = () => {
  const [state, store] = useDawStore();
  const engine = AudioEngine.getInstance();

  // Audio input devices
  const [inputDevices, setInputDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [channelMode, setChannelMode] = useState<'left' | 'right' | 'stereo'>('left');

  // Real-time meter & tuner state
  const [inputPeak, setInputPeak] = useState<number>(0);
  const [tunerData, setTunerData] = useState<TunerResult | null>(null);
  const [isRecordingRiff, setIsRecordingRiff] = useState<boolean>(false);

  // Active sub-tab in Guitar Rig
  const [activeTab, setActiveTab] = useState<'rig' | 'tuner' | 'pedals'>('rig');

  // Enumerate input devices on mount
  useEffect(() => {
    engine.guitarEngine.getAudioInputDevices().then((devices) => {
      setInputDevices(devices);
      if (devices.length > 0 && !selectedDevice) {
        setSelectedDevice(devices[0].deviceId);
      }
    });
  }, [engine]);

  // Real-time animation loop for input peak meter and chromatic tuner
  useEffect(() => {
    let animId: number;
    const updateTick = () => {
      if (state.isGuitarActive) {
        const peak = engine.guitarEngine.getInputPeak();
        setInputPeak(peak);

        if (state.isGuitarTuning || activeTab === 'tuner') {
          const pitch = engine.guitarEngine.detectPitch();
          setTunerData(pitch);
        }
      } else {
        setInputPeak(0);
        setTunerData(null);
      }
      animId = requestAnimationFrame(updateTick);
    };

    animId = requestAnimationFrame(updateTick);
    return () => cancelAnimationFrame(animId);
  }, [state.isGuitarActive, state.isGuitarTuning, activeTab, engine]);

  const handleTogglePower = async () => {
    await store.toggleGuitarInput(selectedDevice || undefined, channelMode);
  };

  const handleStartRiffRecord = () => {
    setIsRecordingRiff(true);
    store.startGuitarTakeRecording();
  };

  const handleStopRiffRecord = () => {
    setIsRecordingRiff(false);
    store.recordGuitarTakeToPlaylist();
  };

  const ampModels: { id: GuitarAmpModel; name: string; subtitle: string; badge: string; color: string; bg: string }[] = [
    {
      id: 'fenderClean',
      name: "Fender '65 Twin Reverb",
      subtitle: 'Glassy Sparkle & Clean Scoop',
      badge: 'CLEAN / TWEED',
      color: 'text-amber-400',
      bg: 'from-amber-950/40 via-[#1e1b18] to-[#121316]',
    },
    {
      id: 'marshallPlexi',
      name: "Marshall '59 Super Lead Plexi",
      subtitle: 'British Crunch & Mid-Range Punch',
      badge: 'VINTAGE CRUNCH',
      color: 'text-yellow-400',
      bg: 'from-yellow-950/40 via-[#211f18] to-[#121316]',
    },
    {
      id: 'mesaDual',
      name: 'Mesa Boogie Dual Rectifier',
      subtitle: 'Modern High Gain Chug & Liquid Lead',
      badge: 'HIGH GAIN / METAL',
      color: 'text-red-400',
      bg: 'from-red-950/40 via-[#221818] to-[#121316]',
    },
    {
      id: 'voxAc30',
      name: 'Vox AC30 Top Boost',
      subtitle: '60s British Chime, Jangle & Treble Bite',
      badge: 'CHIME / JANGLE',
      color: 'text-emerald-400',
      bg: 'from-emerald-950/40 via-[#18211c] to-[#121316]',
    },
    {
      id: 'ampegBass',
      name: 'Ampeg SVT Classic Bass',
      subtitle: 'Thundering Low-End Bass Rig Authority',
      badge: 'BASS GUITAR',
      color: 'text-sky-400',
      bg: 'from-sky-950/40 via-[#181d22] to-[#121316]',
    },
    {
      id: 'acousticDi',
      name: 'Acoustic Studio DI Preamp',
      subtitle: 'Piezo De-Quacking & Natural Resonance',
      badge: 'ACOUSTIC / PIEZO',
      color: 'text-orange-400',
      bg: 'from-orange-950/40 via-[#221b18] to-[#121316]',
    },
  ];

  const cabModels: { id: GuitarCabModel; name: string; desc: string }[] = [
    { id: 'v30_4x12', name: 'Celestion 4x12 Vintage 30', desc: 'Punchy 2.8kHz mid bite, tight low end' },
    { id: 'twin_2x12', name: "Fender 2x12 Open Back", desc: 'Airy highs, wide stereo dispersion' },
    { id: 'vox_1x12', name: 'Vox 1x12 Alnico Blue', desc: 'Warm bell-like midrange resonance' },
    { id: 'ampeg_8x10', name: 'Ampeg 8x10 Bass Fridge', desc: 'Sub-bass slam and focused thump' },
    { id: 'bypass', name: 'Direct Line (Cab Bypass)', desc: 'Unfiltered direct recording sound' },
  ];

  const currentAmp = ampModels.find((a) => a.id === state.guitarAmpModel) || ampModels[0];

  return (
    <div className="flex-1 flex flex-col bg-[#0f1013] text-gray-200 overflow-hidden font-sans select-none">
      {/* Top Guitar Rig Master Input & Header Bar */}
      <div className="bg-[#16181e] border-b border-[#2a2d39] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-lg shadow-red-500/20">
            <Guitar size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide">Eve Guitar Rig Pro</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40 uppercase">
                Amp & Pedalboard
              </span>
            </div>
            <p className="text-xs text-gray-400">Tube Amp Modeling, Speaker IRs & Chromatic Tuner</p>
          </div>
        </div>

        {/* Master Input Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Power ON / OFF */}
          <button
            onClick={handleTogglePower}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-md ${
              state.isGuitarActive
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-[#232734] hover:bg-[#2e3344] text-gray-400'
            }`}
          >
            <Power size={14} className={state.isGuitarActive ? 'animate-spin' : ''} />
            {state.isGuitarActive ? 'RIG ACTIVE' : 'CONNECT GUITAR'}
          </button>

          {/* Audio Input Device Dropdown */}
          <select
            value={selectedDevice}
            onChange={(e) => {
              setSelectedDevice(e.target.value);
              if (state.isGuitarActive) {
                store.toggleGuitarInput(e.target.value, channelMode);
              }
            }}
            className="bg-[#1c1f2a] border border-[#34384a] text-xs text-gray-200 px-2 py-1.5 rounded-lg font-mono focus:outline-hidden focus:border-red-500 max-w-[180px] truncate"
          >
            {inputDevices.length === 0 ? (
              <option value="">Default Audio Input</option>
            ) : (
              inputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))
            )}
          </select>

          {/* Channel Selector (Input 1, Input 2, Stereo) */}
          <div className="flex items-center bg-[#181a24] p-0.5 rounded-lg border border-[#2e3244] text-[11px] font-mono">
            {(['left', 'right', 'stereo'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setChannelMode(mode);
                  if (state.isGuitarActive) {
                    store.toggleGuitarInput(selectedDevice, mode);
                  }
                }}
                className={`px-2 py-1 rounded transition-all capitalize ${
                  channelMode === mode ? 'bg-red-500 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {mode === 'left' ? 'In 1 (L)' : mode === 'right' ? 'In 2 (R)' : 'Stereo'}
              </button>
            ))}
          </div>

          {/* High-Z Preamp Gain Slider */}
          <div className="flex items-center gap-1.5 bg-[#181a24] px-2.5 py-1 rounded-lg border border-[#2e3244]">
            <span className="text-[11px] font-mono text-gray-400">Preamp:</span>
            <input
              type="range"
              min={-18}
              max={18}
              step={1}
              value={state.guitarGain}
              onChange={(e) => store.setGuitarGain(Number(e.target.value))}
              className="w-16 accent-red-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-red-400 w-8 text-right">
              {state.guitarGain > 0 ? `+${state.guitarGain}` : state.guitarGain}dB
            </span>
          </div>

          {/* Real-time Peak Meter */}
          <div className="flex flex-col gap-0.5 w-16">
            <div className="flex justify-between text-[9px] font-mono text-gray-400">
              <span>IN</span>
              <span>{inputPeak > 0.95 ? 'CLIP' : `${Math.round(inputPeak * 100)}%`}</span>
            </div>
            <div className="h-2 w-full bg-[#101218] rounded overflow-hidden p-0.5 border border-[#2c3040]">
              <div
                className={`h-full rounded-xs transition-all duration-75 ${
                  inputPeak > 0.9 ? 'bg-red-500' : inputPeak > 0.6 ? 'bg-yellow-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, inputPeak * 100)}%` }}
              />
            </div>
          </div>

          {/* Direct Monitor Toggle */}
          <button
            onClick={() => store.toggleGuitarDirectMonitor()}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border transition-all ${
              state.guitarDirectMonitor
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-[#181a24] text-gray-400 border-[#2e3244] hover:text-gray-300'
            }`}
          >
            <Volume2 size={13} />
            Monitor
          </button>

          {/* Riff Take Recording Button */}
          {!isRecordingRiff ? (
            <button
              onClick={handleStartRiffRecord}
              disabled={!state.isGuitarActive}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white shadow-md transition-all disabled:opacity-40"
            >
              <Disc size={13} />
              Record Take
            </button>
          ) : (
            <button
              onClick={handleStopRiffRecord}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black animate-pulse shadow-md transition-all"
            >
              <Square size={13} />
              Drop to Playlist
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-[#13151b] border-b border-[#252834] px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('rig')}
            className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'rig'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d26]'
            }`}
          >
            <Guitar size={14} />
            Amp & Cab Stack
          </button>

          <button
            onClick={() => setActiveTab('pedals')}
            className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'pedals'
                ? 'bg-amber-500 text-black shadow-sm font-black'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d26]'
            }`}
          >
            <Sparkles size={14} />
            Stompbox Pedalboard ({Object.values(state.guitarPedals).filter((v, i) => i % 3 === 0 && v === true).length} Active)
          </button>

          <button
            onClick={() => {
              setActiveTab('tuner');
              store.setGuitarTuner(true);
            }}
            className={`px-3 py-1 text-xs font-bold font-mono rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'tuner'
                ? 'bg-emerald-500 text-black shadow-sm font-black'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1d26]'
            }`}
          >
            <Gauge size={14} />
            Chromatic Tuner
          </button>
        </div>

        {/* Mixer Routing Badge */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
          <span>Routing:</span>
          <select
            value={state.guitarRoutingChannel}
            onChange={(e) => store.setGuitarRoutingChannel(Number(e.target.value))}
            className="bg-[#1c1e28] border border-[#2f3342] text-xs text-red-400 font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            {state.mixerChannels.map((ch, idx) => (
              <option key={ch.id} value={idx}>
                Ch {idx}: {ch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Viewport Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ======================= TAB 1: AMP & CAB STACK ======================= */}
        {activeTab === 'rig' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {/* Amp Head Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {ampModels.map((amp) => (
                <button
                  key={amp.id}
                  onClick={() => store.setGuitarAmpModel(amp.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    state.guitarAmpModel === amp.id
                      ? 'bg-[#222533] border-red-500 shadow-lg shadow-red-500/20'
                      : 'bg-[#151720] border-[#292d3c] hover:border-[#3d4358] text-gray-400'
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/40 text-gray-300 block w-fit mb-1">
                      {amp.badge}
                    </span>
                    <div className={`text-xs font-bold ${state.guitarAmpModel === amp.id ? 'text-white' : 'text-gray-300'}`}>
                      {amp.name}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 line-clamp-1">{amp.subtitle}</div>
                </button>
              ))}
            </div>

            {/* Photorealistic Amp Head Hardware Chassis */}
            <div className={`p-6 rounded-2xl border border-[#3e4358] shadow-2xl bg-gradient-to-b ${currentAmp.bg} relative overflow-hidden`}>
              {/* Amp Brand Plate */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-wider uppercase text-white font-serif drop-shadow-md">
                      {currentAmp.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 text-amber-300 border border-amber-500/30">
                      TUBE VOICED
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">{currentAmp.subtitle}</div>
                </div>

                {/* Tube Glow Jewel Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 border-white/30 shadow-lg transition-all ${
                    state.isGuitarActive ? 'bg-red-500 shadow-red-500 animate-pulse' : 'bg-red-950'
                  }`} />
                  <span className="text-[11px] font-mono text-gray-300 uppercase">Power</span>
                </div>
              </div>

              {/* Amp Knobs Tone Stack */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
                {/* Preamp Drive */}
                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono font-bold text-red-400 mb-2 uppercase">Preamp Drive</span>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={state.guitarAmpSettings.drive}
                    onChange={(e) => store.setGuitarAmpSettings({ drive: Number(e.target.value) })}
                    className="w-24 accent-red-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white mt-2">
                    {state.guitarAmpSettings.drive.toFixed(1)}
                  </span>
                </div>

                {/* Bass */}
                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono font-bold text-gray-300 mb-2 uppercase">Bass</span>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={state.guitarAmpSettings.bass}
                    onChange={(e) => store.setGuitarAmpSettings({ bass: Number(e.target.value) })}
                    className="w-24 accent-orange-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white mt-2">
                    {state.guitarAmpSettings.bass > 0 ? `+${state.guitarAmpSettings.bass}` : state.guitarAmpSettings.bass} dB
                  </span>
                </div>

                {/* Middle */}
                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono font-bold text-gray-300 mb-2 uppercase">Middle</span>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={state.guitarAmpSettings.mid}
                    onChange={(e) => store.setGuitarAmpSettings({ mid: Number(e.target.value) })}
                    className="w-24 accent-yellow-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white mt-2">
                    {state.guitarAmpSettings.mid > 0 ? `+${state.guitarAmpSettings.mid}` : state.guitarAmpSettings.mid} dB
                  </span>
                </div>

                {/* Treble */}
                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono font-bold text-gray-300 mb-2 uppercase">Treble</span>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={state.guitarAmpSettings.treble}
                    onChange={(e) => store.setGuitarAmpSettings({ treble: Number(e.target.value) })}
                    className="w-24 accent-sky-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white mt-2">
                    {state.guitarAmpSettings.treble > 0 ? `+${state.guitarAmpSettings.treble}` : state.guitarAmpSettings.treble} dB
                  </span>
                </div>

                {/* Presence */}
                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono font-bold text-gray-300 mb-2 uppercase">Presence</span>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={state.guitarAmpSettings.presence}
                    onChange={(e) => store.setGuitarAmpSettings({ presence: Number(e.target.value) })}
                    className="w-24 accent-purple-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white mt-2">
                    {state.guitarAmpSettings.presence > 0 ? `+${state.guitarAmpSettings.presence}` : state.guitarAmpSettings.presence} dB
                  </span>
                </div>

                {/* Master Volume */}
                <div className="flex flex-col items-center bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 mb-2 uppercase">Master</span>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={state.guitarAmpSettings.master}
                    onChange={(e) => store.setGuitarAmpSettings({ master: Number(e.target.value) })}
                    className="w-24 accent-emerald-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-white mt-2">
                    {Math.round(state.guitarAmpSettings.master * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cabinet Simulator Section */}
            <div className="bg-[#151720] border border-[#2b2e3e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Disc size={18} className="text-amber-400" />
                  <span className="text-sm font-bold text-white">Speaker Cabinet IR Simulator</span>
                </div>
                <span className="text-xs font-mono text-gray-400">
                  Current: <strong className="text-amber-400">{cabModels.find((c) => c.id === state.guitarCabModel)?.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {cabModels.map((cab) => (
                  <button
                    key={cab.id}
                    onClick={() => store.setGuitarCabModel(cab.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      state.guitarCabModel === cab.id
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                        : 'bg-[#1b1e2a] border-[#2c3042] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-xs font-bold text-white mb-1">{cab.name}</div>
                    <div className="text-[10px] text-gray-400">{cab.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Noise Gate & Studio Utility Strip */}
            <div className="bg-[#151720] border border-[#2b2e3e] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => store.setGuitarGate(!state.guitarNoiseGate)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                    state.guitarNoiseGate
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                      : 'bg-[#1b1e2a] text-gray-500 border-[#2b2e3e]'
                  }`}
                >
                  NOISE GATE: {state.guitarNoiseGate ? 'ACTIVE' : 'BYPASS'}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400">Threshold:</span>
                  <input
                    type="range"
                    min={-75}
                    max={-20}
                    step={1}
                    value={state.guitarGateThreshold}
                    onChange={(e) => store.setGuitarGate(state.guitarNoiseGate, Number(e.target.value))}
                    className="w-24 accent-emerald-500 h-1.5 bg-gray-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono text-emerald-400">{state.guitarGateThreshold} dB</span>
                </div>
              </div>

              <div className="text-xs text-gray-400 font-mono flex items-center gap-4">
                <span>Direct Monitor: <strong className="text-white">{state.guitarDirectMonitor ? 'ON' : 'OFF'}</strong></span>
                <span>Active Rig Latency: <strong className="text-emerald-400">~2.2 ms (Zero Lag)</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: STOMPBOX PEDALBOARD ======================= */}
        {activeTab === 'pedals' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="text-xs text-gray-400 font-mono flex items-center justify-between">
              <span>Click the 3PDT footswitch on any pedal to stomp it on or bypass:</span>
              <button
                onClick={() =>
                  store.setGuitarPedals({
                    compEnabled: false,
                    driveEnabled: false,
                    fuzzEnabled: false,
                    wahEnabled: false,
                    chorusEnabled: false,
                    delayEnabled: false,
                    reverbEnabled: false,
                  })
                }
                className="px-2.5 py-1 rounded bg-[#202330] hover:bg-[#2b2f42] text-xs font-mono text-gray-300"
              >
                Bypass All Pedals
              </button>
            </div>

            {/* Visual Pedal Floor Board */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* PEDAL 1: Sustainer / Compressor */}
              <div className="bg-[#242216] border-2 border-yellow-600/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-yellow-400 uppercase tracking-widest font-mono">
                    Sustainer
                  </span>
                  <div className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
                    state.guitarPedals.compEnabled ? 'bg-yellow-400 shadow-yellow-400' : 'bg-yellow-950'
                  }`} />
                </div>

                <div className="space-y-3 my-2">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Sustain</span>
                      <span>{Math.round(state.guitarPedals.compSustain * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.compSustain}
                      onChange={(e) => store.setGuitarPedals({ compSustain: Number(e.target.value) })}
                      className="w-full accent-yellow-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Output</span>
                      <span>{Math.round(state.guitarPedals.compLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.compLevel}
                      onChange={(e) => store.setGuitarPedals({ compLevel: Number(e.target.value) })}
                      className="w-full accent-yellow-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => store.setGuitarPedals({ compEnabled: !state.guitarPedals.compEnabled })}
                  className="mt-3 w-full py-2 rounded-xl bg-black/60 hover:bg-black text-yellow-400 border border-yellow-600/40 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-inner"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 shadow-md" />
                  {state.guitarPedals.compEnabled ? 'COMP ENGAGED' : 'BYPASS'}
                </button>
              </div>

              {/* PEDAL 2: Tube Screamer Overdrive (TS9) */}
              <div className="bg-[#14281a] border-2 border-emerald-500/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-mono">
                    TS9 Overdrive
                  </span>
                  <div className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
                    state.guitarPedals.driveEnabled ? 'bg-emerald-400 shadow-emerald-400 animate-pulse' : 'bg-emerald-950'
                  }`} />
                </div>

                <div className="space-y-2 my-1">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Drive</span>
                      <span>{Math.round(state.guitarPedals.driveGain * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.driveGain}
                      onChange={(e) => store.setGuitarPedals({ driveGain: Number(e.target.value) })}
                      className="w-full accent-emerald-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Tone</span>
                      <span>{Math.round(state.guitarPedals.driveTone * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.driveTone}
                      onChange={(e) => store.setGuitarPedals({ driveTone: Number(e.target.value) })}
                      className="w-full accent-emerald-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Level</span>
                      <span>{Math.round(state.guitarPedals.driveLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.driveLevel}
                      onChange={(e) => store.setGuitarPedals({ driveLevel: Number(e.target.value) })}
                      className="w-full accent-emerald-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => store.setGuitarPedals({ driveEnabled: !state.guitarPedals.driveEnabled })}
                  className="mt-3 w-full py-2 rounded-xl bg-black/60 hover:bg-black text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-inner"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 shadow-md" />
                  {state.guitarPedals.driveEnabled ? 'DRIVE ENGAGED' : 'BYPASS'}
                </button>
              </div>

              {/* PEDAL 3: Vintage Silicon Fuzz */}
              <div className="bg-[#2c1a14] border-2 border-orange-500/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-orange-400 uppercase tracking-widest font-mono">
                    Vintage Fuzz
                  </span>
                  <div className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
                    state.guitarPedals.fuzzEnabled ? 'bg-orange-400 shadow-orange-400 animate-pulse' : 'bg-orange-950'
                  }`} />
                </div>

                <div className="space-y-2 my-1">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Fuzz</span>
                      <span>{Math.round(state.guitarPedals.fuzzGain * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.fuzzGain}
                      onChange={(e) => store.setGuitarPedals({ fuzzGain: Number(e.target.value) })}
                      className="w-full accent-orange-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Tone</span>
                      <span>{Math.round(state.guitarPedals.fuzzTone * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.fuzzTone}
                      onChange={(e) => store.setGuitarPedals({ fuzzTone: Number(e.target.value) })}
                      className="w-full accent-orange-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Volume</span>
                      <span>{Math.round(state.guitarPedals.fuzzLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.fuzzLevel}
                      onChange={(e) => store.setGuitarPedals({ fuzzLevel: Number(e.target.value) })}
                      className="w-full accent-orange-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => store.setGuitarPedals({ fuzzEnabled: !state.guitarPedals.fuzzEnabled })}
                  className="mt-3 w-full py-2 rounded-xl bg-black/60 hover:bg-black text-orange-400 border border-orange-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-inner"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 shadow-md" />
                  {state.guitarPedals.fuzzEnabled ? 'FUZZ ENGAGED' : 'BYPASS'}
                </button>
              </div>

              {/* PEDAL 4: Auto-Wah / Envelope Filter */}
              <div className="bg-[#24172a] border-2 border-purple-500/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-purple-400 uppercase tracking-widest font-mono">
                    Auto-Wah
                  </span>
                  <div className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
                    state.guitarPedals.wahEnabled ? 'bg-purple-400 shadow-purple-400' : 'bg-purple-950'
                  }`} />
                </div>

                <div className="space-y-3 my-2">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Sensitivity</span>
                      <span>{Math.round(state.guitarPedals.wahSensitivity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.wahSensitivity}
                      onChange={(e) => store.setGuitarPedals({ wahSensitivity: Number(e.target.value) })}
                      className="w-full accent-purple-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Pedal Treadle</span>
                      <span>{Math.round(state.guitarPedals.wahManual * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.wahManual}
                      onChange={(e) => store.setGuitarPedals({ wahManual: Number(e.target.value) })}
                      className="w-full accent-purple-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => store.setGuitarPedals({ wahEnabled: !state.guitarPedals.wahEnabled })}
                  className="mt-3 w-full py-2 rounded-xl bg-black/60 hover:bg-black text-purple-400 border border-purple-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-inner"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 shadow-md" />
                  {state.guitarPedals.wahEnabled ? 'WAH ENGAGED' : 'BYPASS'}
                </button>
              </div>

              {/* PEDAL 5: Analog Chorus */}
              <div className="bg-[#12242a] border-2 border-cyan-500/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest font-mono">
                    Analog Chorus
                  </span>
                  <div className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
                    state.guitarPedals.chorusEnabled ? 'bg-cyan-400 shadow-cyan-400' : 'bg-cyan-950'
                  }`} />
                </div>

                <div className="space-y-2 my-1">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Rate</span>
                      <span>{state.guitarPedals.chorusRate.toFixed(1)} Hz</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={5.0}
                      step={0.1}
                      value={state.guitarPedals.chorusRate}
                      onChange={(e) => store.setGuitarPedals({ chorusRate: Number(e.target.value) })}
                      className="w-full accent-cyan-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Depth</span>
                      <span>{Math.round(state.guitarPedals.chorusDepth * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.chorusDepth}
                      onChange={(e) => store.setGuitarPedals({ chorusDepth: Number(e.target.value) })}
                      className="w-full accent-cyan-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Mix</span>
                      <span>{Math.round(state.guitarPedals.chorusMix * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.chorusMix}
                      onChange={(e) => store.setGuitarPedals({ chorusMix: Number(e.target.value) })}
                      className="w-full accent-cyan-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => store.setGuitarPedals({ chorusEnabled: !state.guitarPedals.chorusEnabled })}
                  className="mt-3 w-full py-2 rounded-xl bg-black/60 hover:bg-black text-cyan-400 border border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-inner"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 shadow-md" />
                  {state.guitarPedals.chorusEnabled ? 'CHORUS ENGAGED' : 'BYPASS'}
                </button>
              </div>

              {/* PEDAL 6: Analog Delay */}
              <div className="bg-[#12192a] border-2 border-blue-500/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-blue-400 uppercase tracking-widest font-mono">
                    Analog Delay
                  </span>
                  <div className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
                    state.guitarPedals.delayEnabled ? 'bg-blue-400 shadow-blue-400' : 'bg-blue-950'
                  }`} />
                </div>

                <div className="space-y-2 my-1">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Time</span>
                      <span>{Math.round(state.guitarPedals.delayTime * 1000)} ms</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.8}
                      step={0.01}
                      value={state.guitarPedals.delayTime}
                      onChange={(e) => store.setGuitarPedals({ delayTime: Number(e.target.value) })}
                      className="w-full accent-blue-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Feedback</span>
                      <span>{Math.round(state.guitarPedals.delayFeedback * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={0.85}
                      step={0.05}
                      value={state.guitarPedals.delayFeedback}
                      onChange={(e) => store.setGuitarPedals({ delayFeedback: Number(e.target.value) })}
                      className="w-full accent-blue-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Mix</span>
                      <span>{Math.round(state.guitarPedals.delayMix * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.delayMix}
                      onChange={(e) => store.setGuitarPedals({ delayMix: Number(e.target.value) })}
                      className="w-full accent-blue-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => store.setGuitarPedals({ delayEnabled: !state.guitarPedals.delayEnabled })}
                  className="mt-3 w-full py-2 rounded-xl bg-black/60 hover:bg-black text-blue-400 border border-blue-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-inner"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 shadow-md" />
                  {state.guitarPedals.delayEnabled ? 'DELAY ENGAGED' : 'BYPASS'}
                </button>
              </div>

              {/* PEDAL 7: Spring Reverb Tank */}
              <div className="bg-[#291515] border-2 border-red-500/60 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-red-400 uppercase tracking-widest font-mono">
                    Spring Reverb
                  </span>
                  <div className={`w-3 h-3 rounded-full border border-white/20 shadow-md ${
                    state.guitarPedals.reverbEnabled ? 'bg-red-400 shadow-red-400' : 'bg-red-950'
                  }`} />
                </div>

                <div className="space-y-3 my-2">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Tank Dwell / Size</span>
                      <span>{state.guitarPedals.reverbSize.toFixed(1)} s</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={4.0}
                      step={0.1}
                      value={state.guitarPedals.reverbSize}
                      onChange={(e) => store.setGuitarPedals({ reverbSize: Number(e.target.value) })}
                      className="w-full accent-red-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>Reverb Mix</span>
                      <span>{Math.round(state.guitarPedals.reverbMix * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={state.guitarPedals.reverbMix}
                      onChange={(e) => store.setGuitarPedals({ reverbMix: Number(e.target.value) })}
                      className="w-full accent-red-400 h-1.5 bg-gray-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => store.setGuitarPedals({ reverbEnabled: !state.guitarPedals.reverbEnabled })}
                  className="mt-3 w-full py-2 rounded-xl bg-black/60 hover:bg-black text-red-400 border border-red-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-inner"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-gray-400 bg-gray-700 shadow-md" />
                  {state.guitarPedals.reverbEnabled ? 'REVERB ENGAGED' : 'BYPASS'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: CHROMATIC GUITAR TUNER ======================= */}
        {activeTab === 'tuner' && (
          <div className="max-w-2xl mx-auto space-y-6 bg-[#161822] border border-[#2e3346] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282d3e] pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Gauge size={18} className="text-emerald-400" />
                  Chromatic Auto-Correlation Tuner
                </h2>
                <p className="text-xs text-gray-400">Pluck any guitar or bass string to detect pitch</p>
              </div>

              {/* Silent Tuning Mute Button */}
              <button
                onClick={() => store.setGuitarTuner(true, !state.guitarTunerMute)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                  state.guitarTunerMute
                    ? 'bg-red-500/20 text-red-400 border-red-500/50'
                    : 'bg-[#1e2230] text-gray-400 border-[#30354a]'
                }`}
              >
                {state.guitarTunerMute ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {state.guitarTunerMute ? 'MUTED (SILENT TUNING)' : 'AUDIO AUDIBLE'}
              </button>
            </div>

            {/* Glowing Note Readout Display */}
            <div className="py-8 flex flex-col items-center justify-center bg-[#0d0e14] rounded-2xl border border-[#262938] relative overflow-hidden">
              {tunerData ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black text-white font-mono tracking-tight drop-shadow-md">
                      {tunerData.note}
                    </span>
                    <span className="text-2xl font-bold text-gray-400 font-mono">
                      {tunerData.octave}
                    </span>
                  </div>

                  {tunerData.stringName && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 mt-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      {tunerData.stringName}
                    </span>
                  )}

                  <div className="text-sm font-mono text-gray-400 mt-2">
                    {tunerData.frequency.toFixed(1)} Hz
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-gray-500 font-mono">
                  <Activity size={36} className="animate-pulse mb-2 text-gray-600" />
                  <span className="text-sm">Pluck a guitar string to tune...</span>
                  <span className="text-xs text-gray-600 mt-1">Make sure Guitar Power is turned on</span>
                </div>
              )}

              {/* Analog Tuning Meter Needle (-50 to +50 cents) */}
              <div className="w-full max-w-md px-6 mt-6">
                <div className="relative h-6 bg-[#1a1c26] rounded-full border border-[#2f3448] overflow-hidden flex items-center justify-center">
                  {/* Center Perfect In-Tune Line */}
                  <div className="absolute top-0 bottom-0 w-1 bg-emerald-400 z-10" />

                  {/* Moving Cents Indicator */}
                  {tunerData && (
                    <div
                      className={`absolute top-1 bottom-1 w-3 rounded-full transition-all duration-75 shadow-lg ${
                        tunerData.inTune ? 'bg-emerald-400 shadow-emerald-400' : 'bg-red-400 shadow-red-400'
                      }`}
                      style={{
                        left: `calc(50% + ${(tunerData.cents / 50) * 45}% - 6px)`,
                      }}
                    />
                  )}
                </div>

                <div className="flex justify-between text-[11px] font-mono text-gray-400 mt-1.5 px-2">
                  <span>-50 Flat (b)</span>
                  <span className={tunerData?.inTune ? 'text-emerald-400 font-bold text-xs' : 'text-gray-500'}>
                    {tunerData?.inTune ? '✓ IN TUNE' : '0'}
                  </span>
                  <span>+50 Sharp (#)</span>
                </div>
              </div>
            </div>

            {/* Standard Reference Guitar Tuning Matrix */}
            <div className="p-3 bg-[#11131a] rounded-xl border border-[#262a38]">
              <div className="text-xs font-bold text-gray-300 mb-2">Standard 6-String Guitar Reference Pitch:</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                <div className="p-2 bg-[#191b26] rounded border border-[#2e3346]">
                  <span className="text-gray-400 block text-[10px]">6th (Low E)</span>
                  <strong className="text-white">E2 (82.4 Hz)</strong>
                </div>
                <div className="p-2 bg-[#191b26] rounded border border-[#2e3346]">
                  <span className="text-gray-400 block text-[10px]">5th (A)</span>
                  <strong className="text-white">A2 (110.0 Hz)</strong>
                </div>
                <div className="p-2 bg-[#191b26] rounded border border-[#2e3346]">
                  <span className="text-gray-400 block text-[10px]">4th (D)</span>
                  <strong className="text-white">D3 (146.8 Hz)</strong>
                </div>
                <div className="p-2 bg-[#191b26] rounded border border-[#2e3346]">
                  <span className="text-gray-400 block text-[10px]">3rd (G)</span>
                  <strong className="text-white">G3 (196.0 Hz)</strong>
                </div>
                <div className="p-2 bg-[#191b26] rounded border border-[#2e3346]">
                  <span className="text-gray-400 block text-[10px]">2nd (B)</span>
                  <strong className="text-white">B3 (246.9 Hz)</strong>
                </div>
                <div className="p-2 bg-[#191b26] rounded border border-[#2e3346]">
                  <span className="text-gray-400 block text-[10px]">1st (High E)</span>
                  <strong className="text-white">E4 (329.6 Hz)</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
