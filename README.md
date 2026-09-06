# 🎛️ Eve's Mixer

> **The Ultimate All-in-One FL Studio-Inspired Digital Audio Workstation for the Web.**  
> Create beats, compose melodies, synthesize sounds, record and loop your microphone with bar quantization, mix tracks with studio DSP effects, and render radio-ready master WAVs.

[![Deploy to GitHub Pages](https://github.com/Zykoraa/eves-mixer/actions/workflows/deploy.yml/badge.svg)](https://github.com/Zykoraa/eves-mixer/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Web Audio API](https://img.shields.io/badge/Audio-WebAudio%20DSP-emerald.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## ✨ Features Overview

### 1. 🥁 Channel Rack (FL Studio Step Sequencer)
- **Classic 16/32 Step Drum Machine**: Alternating 4-beat color groupings with moving playhead LED indicators.
- **Dedicated Procedural Drum Synth**:
  - **Punchy Kick**: Exponential sub-drop with click transient.
  - **808 Sub Boom**: Sustained low-frequency bass with pitch envelope.
  - **Snare**: Dual tone body + shaped white noise snare wire snap.
  - **Hand Clap**: 3 staggered micro-burst impulses + room decay.
  - **Closed & Open Hi-Hats**: Metallic sizzle with choke-group behavior.
  - **Tuned Tom, Rimshot, Shimmering Crash & Glitch FX**.
- **Custom Audio Sample Drag-and-Drop**: Load any `.wav`, `.mp3`, or audio file into any channel pad.
- **Per-Channel Controls**: Volume & Stereo Panning knobs, Mute & Solo LEDs, Mixer channel routing.
- **1-Click Beat Templates**: Trap Rolling Hats, 4-on-the-Floor House, Swung Lo-Fi Boom Bap, UK Drill.

### 2. 🎹 Piano Roll (Chromatic Note Editor)
- **Melodic Note Matrix**: Multi-octave chromatic grid (C2 to B5) with interactive audition keys.
- **Scale Highlighting & "Never Play a Wrong Note" Mode**:
  - Highlights notes belonging to chosen key and scale (Major, Minor, Dorian, Pentatonic, Blues, Harmonic Minor, Japanese Hirajoshi).
  - Optional scale-lock automatically snaps any played or drawn note into key.
- **Chord Stamper Tool**: Stamp Major, Minor, 7th, Maj7, Min7, Suspended 4th, or Add9 chords with a single click.
- **Velocity Lane**: Per-note volume stalks with interactive velocity sliders.
- **Melody Randomizer**: Generates riffs mathematically locked to your key.

### 3. 🎼 Playlist Arrangement (Song Timeline)
- **Song Mode vs. Pattern Mode**: Switch between looping a pattern (`PAT`) or playing the entire song timeline (`SONG`).
- **Multitrack Timeline**: 8+ arrangement rows for arranging patterns and microphone audio clips.
- **Bar Scrubber & Loop Markers**: Continuous playhead cursor tracking song position.

### 4. 🎚️ 8-Channel Mixer Console
- **Master Bus + 8 Dedicated Insert Channels** (Drums, Hats, 808 Bass, Lead Synth, Sampler, Mic Looper, Inserts 7 & 8).
- **Studio Peak Meters**: Real-time dB level ladder with green, yellow, and red clipping alerts.
- **Hardware-Style Faders & Panning**: Smooth volume sliders with logarithmic dB scales.
- **Master Limiter**: Soft-knee lookahead limiter on the master output to prevent harsh digital distortion.

### 5. 🎙️ Eve LoopStation (Microphone Recording & 4-Deck Looper)
- **Live Microphone Input**: Real-time voice oscilloscope and input VU meter.
- **Direct Monitoring**: Toggle live headphone monitoring with built-in feedback protection.
- **4 Synchronized Quantized Looper Decks**:
  - **Bar Quantization**: Set loop length to 1, 2, 4, or 8 bars; recording starts exactly on the next downbeat and wraps cleanly.
  - **Infinite Overdubbing**: Layer beatboxing, vocals, harmonies, acoustic instruments, or speech without quality loss.
  - **Creative Performance Modifiers**:
    - **REV**: Reverse audio playback on the fly.
    - **1/2x**: Half-speed tape-stop slow-down.
  - **Send to Playlist**: Drop your vocal or beatbox loop straight into the song arrangement timeline as an audio clip!
  - **Download WAV**: Export individual loop recordings.

### 6. ⚡ Studio DSP Effects Rack
- **Parametric 5-Band Visual EQ**: Interactive frequency response curve with real-time spectrum analysis.
- **Studio Reverb**: Rich algorithmic decay, room sizing, damping, and wet/dry balance.
- **Ping-Pong Stereo Delay**: Tempo-synced delay times with cross-feedback and filtering.
- **Analog Saturator & Overdrive**: Tube warmth, soft clipping, hard clipping, and fuzz modes.
- **Studio Compressor**: Threshold, ratio, attack, release, and makeup gain.

### 7. 🤖 EveSynth (Dual-Oscillator Analog Synthesizer)
- **Dual Multi-Waveform Oscillators**: Sine, Triangle, Sawtooth, Square, and White Noise.
- **Sub-Oscillator & Detune**: Fat, detuned unison spreads and deep sub-octave reinforcement.
- **24dB Resonant Biquad Filter**: Lowpass, Highpass, and Bandpass modes with envelope modulation.
- **Dual ADSR Envelopes**: Independent Amplitude and Filter Attack/Decay/Sustain/Release.
- **LFO Modulation**: Routable to Cutoff, Pitch (vibrato), or Pan.
- **Polyphony**: Monophonic legato with portamento glide vs. 8-voice polyphony for lush chords.
- **Curated Presets**: Cyberpunk Saw Lead, Neo 808 Sub, Sunset Lo-Fi Keys, Ethereal Dream Pad, Hyperpop Pluck, Acid 303 Bass.

### 8. 💡 Inspiration Engine (AI / Algorithmic Music Assistant)
- **1-Click Chord Progression Generator**: Neo-Soul Romance, Lo-Fi Chill Hop, Dark Trap Melancholy, Synthwave Night Ride, Hyperpop Energy.
- **Scale-Locked Lead Generator**: Instantly fills your piano roll with musical riffs that always fit your harmony.

### 9. 🎛️ Wave Candy & Virtual Keyboard
- **Wave Candy Master Visualizer**: Combined real-time FFT spectrum analyzer and oscilloscope.
- **Computer Keyboard Piano**: Play instruments live using QWERTY keys (`A-L` and `W-P`).
- **Web MIDI Controller Integration**: Plug in any USB MIDI keyboard or pad controller — detected automatically with velocity sensitivity!

### 10. 💾 Offline Studio WAV Exporter
- **OfflineAudioContext Rendering**: Renders full song arrangements in seconds without audio dropouts or glitches.
- **Project Save & Load**: Save `.evesmixer` project files and load them anytime.

---

## 🚀 Future Roadmap & Improvement Ideas

1. **Stem Separation & Vocal De-Bleed**: Integrating WebAssembly AI models (like demucs-lite) directly in-browser to separate vocals, drums, bass, and accompaniment from uploaded audio tracks.
2. **Audio Clip Slicing & Pitch Shifting in Playlist**: Granular timestretching algorithms so audio loops automatically adapt to any BPM changes.
3. **MIDI File Drag & Drop**: Import standard `.mid` files directly into the Piano Roll.
4. **Cloud Project Sync & Collaboration**: P2P WebRTC audio jamming with friends in real time.
5. **Custom VST/Wasm Plugin Slot**: Allow loading WebAssembly DSP effects and SoundFonts (`.sf2`).

---

## ⌨️ Keyboard Shortcuts Reference

| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause Transport |
| `P` | Toggle Pattern (`PAT`) vs. Song (`SONG`) Mode |
| `M` | Toggle Metronome Click |
| `1` | Open Channel Rack |
| `2` | Open Piano Roll |
| `3` | Open Playlist Arranger |
| `4` | Open Mixer Console |
| `5` | Open EveSynth Editor |
| `6` | Open Eve LoopStation |
| `7` | Open FX Rack |
| `A, S, D, F, G, H, J, K, L` | White Piano Keys (C4 to E5) |
| `W, E, T, Y, U, O, P` | Black Piano Keys (C#4 to D#5) |

---

## 🛠️ Local Development & Running

```bash
# Clone the repository
git clone git@github.com:Zykoraa/eves-mixer.git
cd eves-mixer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📜 License

MIT License © 2026 Eve (Zykoraa). Free to use, modify, and create music with!
