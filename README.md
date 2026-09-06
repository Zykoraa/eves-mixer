# 🎛️ Eve's Mixer

> **The Ultimate All-in-One FL Studio-Inspired Digital Audio Workstation for the Web.**  
> Create beats, compose melodies, synthesize sounds, record and loop your microphone with bar quantization, mix tracks with studio DSP effects, and render radio-ready master WAVs.

[![Deploy to GitHub Pages](https://github.com/Zykoraa/eves-mixer/actions/workflows/deploy.yml/badge.svg)](https://github.com/Zykoraa/eves-mixer/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT)
[![Web Audio API](https://img.shields.io/badge/Audio-WebAudio%20DSP-emerald.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## ✨ Features Overview

### 1. 🥁 Channel Rack & Drum Kits
- **Classic 16/32 Step Drum Machine**: Alternating 4-beat color groupings with moving playhead LED indicators.
- **6 Curated Genre Drum Kits**:
  - **Trap / Hip-Hop**: Hard punchy kick, heavy distorted 808 sub, snappy snare, crisp clap, sizzle hats.
  - **Synthwave 80s**: Deep electro kick, gated reverb snare, Simmons tom, analog claps.
  - **Lo-Fi Chill**: Warm vinyl kick, brushed rimshot, taped snare, organic hats.
  - **House / EDM**: Round 909-style kick, punchy 909 snare, open pedal hat, disco clap.
  - **Acoustic Studio**: Natural resonant kick, tight beechwood snare, acoustic tom, bright crash.
  - **Cyber Glitch**: Bitcrushed click kick, digital glitch zap snare, metallic transient hats.
- **Custom Audio Sample Drag-and-Drop**: Load any `.wav`, `.mp3`, or audio file into any channel pad.
- **Per-Channel Controls**: Volume & Stereo Panning knobs, Mute & Solo LEDs, Mixer channel routing.
- **1-Click Beat Templates**: Trap Rolling Hats, 4-on-the-Floor House, Swung Lo-Fi Boom Bap, UK Drill.

### 2. 🎻 Complete 40+ Instrument Sound Library & Sound Browser
- **40+ Pure Web Audio Physically Modeled Instruments** (zero loading lag, offline ready):
  - **Keys & Organs**: Concert Grand Piano, Vintage Rhodes MK1, Wurlitzer 200A, Clavinet D6, Hammond B3 Tonewheel, Church Pipe Organ, Baroque Harpsichord, FM Digital DX Piano.
  - **Bass**: Trap 808 Sub, Acoustic Upright Bass, Slap Funk Bass, Reese Bass, Acid 303 Acidline, Sub Sine Bass.
  - **Strings & Orchestral**: Concert Violin/Cello Strings, Pizzicato Strings, Silver Flute, Andean Pan Flute, Orchestral Brass Ensemble.
  - **Guitars**: Acoustic Folk Guitar, Clean Electric Strat, Overdriven Rock Lead.
  - **Mallets & Ethnic**: African Kalimba, Wooden Marimba, Jazz Vibraphone, Caribbean Steel Pan, Japanese Koto.
  - **Synths & Leads**: Trance Supersaw, 8-Bit Chiptune Square, Modern Hyperpop Pluck, Analog Pulse Bass.
  - **Pads & Vocals**: Ethereal Dream Pad, Vowel Choir Aahs, Ambient Texture, Cyber Space Drone.
  - **SFX**: Laser Zap, Downlifter Sweep, Uplifter Rise, Coin Pickup.
- **Interactive Sound Browser (Shortcut `8`)**:
  - Search by name, filter by 8 categories.
  - Instant live auditioning previews.
  - 1-click **Add Track to Rack** or **Swap Selected Instrument**.

### 3. 🎹 Piano Roll (Chromatic Note Editor)
- **Melodic Note Matrix**: Multi-octave chromatic grid (C2 to B5) with interactive audition keys.
- **Scale Highlighting & "Never Play a Wrong Note" Mode**:
  - Highlights notes belonging to chosen key and scale (Major, Minor, Dorian, Pentatonic, Blues, Harmonic Minor, Japanese Hirajoshi).
  - Optional scale-lock automatically snaps any played or drawn note into key.
- **Chord Stamper Tool**: Stamp Major, Minor, 7th, Maj7, Min7, Suspended 4th, or Add9 chords with a single click.
- **Velocity Lane**: Per-note volume stalks with interactive velocity sliders.
- **Melody Randomizer**: Generates riffs mathematically locked to your key.

### 4. 🎼 Playlist Arrangement (Song Timeline)
- **Song Mode vs. Pattern Mode**: Switch between looping a pattern (`PAT`) or playing the entire song timeline (`SONG`).
- **Multitrack Timeline**: 8+ arrangement rows for arranging patterns and microphone audio clips.
- **Bar Scrubber & Loop Markers**: Continuous playhead cursor tracking song position.

### 5. 🎚️ 8-Channel Mixer Console
- **Master Bus + 8 Dedicated Insert Channels** (Drums, Hats, 808 Bass, Lead Synth, Sampler, Mic Looper, Inserts 7 & 8).
- **Studio Peak Meters**: Real-time dB level ladder with green, yellow, and red clipping alerts.
- **Hardware-Style Faders & Panning**: Smooth volume sliders with logarithmic dB scales.
- **Master Limiter**: Soft-knee lookahead limiter on the master output to prevent harsh digital distortion.

### 6. 🎙️ Eve LoopStation (Microphone Recording & 4-Deck Looper)
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

### 7. ⚡ Studio DSP Effects Rack
- **Parametric 5-Band Visual EQ**: Interactive frequency response curve with real-time spectrum analysis.
- **Studio Reverb**: Rich algorithmic decay, room sizing, damping, and wet/dry balance.
- **Ping-Pong Stereo Delay**: Tempo-synced delay times with cross-feedback and filtering.
- **Analog Saturator & Overdrive**: Tube warmth, soft clipping, hard clipping, and fuzz modes.
- **Studio Compressor**: Threshold, ratio, attack, release, and makeup gain.

### 8. 🤖 EveSynth (Dual-Oscillator Analog Synthesizer)
- **Dual Multi-Waveform Oscillators**: Sine, Triangle, Sawtooth, Square, and White Noise.
- **Sub-Oscillator & Detune**: Fat, detuned unison spreads and deep sub-octave reinforcement.
- **24dB Resonant Biquad Filter**: Lowpass, Highpass, and Bandpass modes with envelope modulation.
- **Dual ADSR Envelopes**: Independent Amplitude and Filter Attack/Decay/Sustain/Release.
- **LFO Modulation**: Routable to Cutoff, Pitch (vibrato), or Pan.
- **Polyphony**: Monophonic legato with portamento glide vs. 8-voice polyphony for lush chords.
- **Curated Presets**: Cyberpunk Saw Lead, Neo 808 Sub, Sunset Lo-Fi Keys, Ethereal Dream Pad, Hyperpop Pluck, Acid 303 Bass.

### 9. 💡 Inspiration Engine (AI / Algorithmic Music Assistant)
- **1-Click Chord Progression Generator**: Neo-Soul Romance, Lo-Fi Chill Hop, Dark Trap Melancholy, Synthwave Night Ride, Hyperpop Energy.
- **Scale-Locked Lead Generator**: Instantly fills your piano roll with musical riffs that always fit your harmony.

### 10. 🎛️ Wave Candy & Virtual Keyboard
- **Wave Candy Master Visualizer**: Combined real-time FFT spectrum analyzer and oscilloscope.
- **Computer Keyboard Piano**: Play instruments live using QWERTY keys (`A-L` and `W-P`).
- **Web MIDI Controller Integration**: Plug in any USB MIDI keyboard or pad controller — detected automatically with velocity sensitivity!

### 11. 💾 Offline Studio WAV Exporter
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

### 12. 🎸 Eve Guitar Rig Pro (Shortcut `9`)
- **Direct Instrument Input**:
  - Connect your electric or acoustic guitar via USB audio interface (Focusrite, Behringer, etc.) or line-in.
  - Input selector: Mono Left (Input 1), Mono Right (Input 2), or Stereo.
  - High-Z Preamp Gain slider (-18dB to +18dB) with dual peak VU meters and clipping indicators.
  - Studio Noise Gate with threshold control to eliminate 60Hz single-coil pickup hum.
  - Direct zero-latency headphone monitoring toggle.
- **Built-in Chromatic Guitar & Bass Tuner**:
  - Real-time auto-correlation pitch detection algorithm calculating exact Hz, note, octave, and cents (-50 to +50).
  - Prominent letter readout, analog-style cents needle meter, and neon green "IN TUNE" lock.
  - Silent tuning mute switch.
- **6 Tube Amp Heads**:
  - *Fender '65 Twin Reverb* (Glassy cleans, scooped mids, tube sparkle).
  - *Marshall '59 Super Lead Plexi* (Classic British rock crunch & mid punch).
  - *Mesa Boogie Dual Rectifier* (Modern high-gain chug & liquid lead sustain).
  - *Vox AC30 Top Boost* (60s British jangle chime & treble boost bite).
  - *Ampeg SVT Classic Bass* (Thundering bass guitar rig authority).
  - *Acoustic Studio DI Preamp* (Piezo de-quacking notch & body resonance).
- **Speaker Cabinet IR Simulator**:
  - Celestion 4x12 Vintage 30s, Fender 2x12 Open Back, Vox 1x12 Alnico Blue, Ampeg 8x10 Bass Fridge, or Direct DI bypass.
- **7 Stompbox Floor Pedals**:
  - Sustainer Compressor, TS9 Tube Screamer Overdrive, Vintage Silicon Fuzz, Auto-Wah Envelope Filter, Stereo Analog Chorus, Bucket-Brigade Tape Delay, and Spring Reverb Tank.
  - Interactive 3PDT footswitches with click toggles and LED indicators.
- **Direct Riff Recording**:
  - Record guitar takes live and drop them directly onto the Playlist timeline arrangement or send to Eve LoopStation decks.

### 13. 🔌 VST Host & Plugin Patchbay (Shortcut `0`)
- **FL Studio-Style Mixer FX Slots**:
  - 10 insert slots on every mixer channel (Master + 8 Inserts).
  - Reorder, bypass, wet/dry mix, and parameter inspection.
- **Built-in Studio Web VSTs**:
  - **Eve Guitar Rig VST**: Insert the full guitar amplifier & cab processor on any mixer channel.
  - **Eve Vocal Auto-Tune**: Real-time pitch correction with hard-tune speed, scale locking, and formant control.
  - **Eve Vintage Tape 1974**: Analog reel-to-reel tape saturation, wow/flutter modulation, and 15/30 IPS speed modeling.
  - **Eve Dimension D Chorus**: Roland Dimension D style 4-button spatial stereo widening without mono phase issues.
  - **Eve 8-Bit Lo-Fi Degrader**: Variable bit depth (2 to 16 bits) and sample rate decimation for chiptune and hyperpop.
  - **Eve 8-Band Surgical Dynamic EQ**: 8 parametric frequency bands with visual interactive response.
  - **Eve Haas 3D Spatial Imager**: Micro-delay psychoacoustic spatial placement.
  - **Eve SoundFont / SF2 Instrument Host**: Multi-timbral General MIDI soundbank synth with preset library and `.sf2` file loader.
- **Web Audio Modules (WAM v2) Remote Loader**:
  - Load external WAM plugins and AudioWorklet modules directly via CDN or GitHub URL.
- **Live JavaScript DSP AudioWorklet Sandbox**:
  - Code real-time DSP audio algorithms directly in the browser and test them immediately on live audio.
- **Hardware Web MIDI Output Patchbay**:
  - Send MIDI notes and CC messages from tracks to external hardware synthesizers, guitar multi-effects pedals, or desktop DAWs (via loopMIDI / IAC Bus).

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
| `8` | Open Sound Browser |
| `9` | Open Eve Guitar Rig & Tuner |
| `0` | Open VST Host & Plugin Patchbay |
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
