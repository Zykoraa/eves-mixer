// MidiExporter.ts - Standard Multi-Track MIDI (.MID) File Generator
// Generates SMF Format 1 (Multi-Track) standard MIDI files from Channel Rack steps & Piano Roll notes.

import { ChannelTrack, Pattern, PianoNote } from '../types/daw';

const DRUM_NOTE_MAP: Record<string, number> = {
  kick: 36,        // C1 Acoustic Bass Drum
  snare: 38,       // D1 Acoustic Snare
  clap: 39,        // D#1 Hand Clap
  hihat_closed: 42,// F#1 Closed Hi-Hat
  hihat_open: 46,  // A#1 Open Hi-Hat
  '808': 35,       // B0 Acoustic Bass Drum
  tom: 45,         // A1 Low Tom
  rim: 37,         // C#1 Side Stick
  crash: 49,       // C#2 Crash Cymbal 1
  fx: 56,          // G#2 Cowbell / Sound FX
};

interface MidiEvent {
  tick: number;
  type: 'noteOn' | 'noteOff' | 'meta';
  channel: number; // 0 to 15
  note?: number;
  velocity?: number;
  metaBytes?: number[];
}

export class MidiExporter {
  private static PPQ = 480; // Ticks per quarter note (standard FL Studio PPQ)

  // Encode variable-length quantity (VLQ)
  private static encodeVlq(value: number): number[] {
    let v = value;
    let buffer = v & 0x7f;
    const bytes: number[] = [];

    while ((v >>= 7) > 0) {
      buffer <<= 8;
      buffer |= 0x80;
      buffer += v & 0x7f;
    }

    while (true) {
      bytes.push(buffer & 0xff);
      if (buffer & 0x80) {
        buffer >>= 8;
      } else {
        break;
      }
    }
    return bytes;
  }

  // Write big-endian 16-bit integer
  private static write16(val: number): number[] {
    return [(val >> 8) & 0xff, val & 0xff];
  }

  // Write big-endian 32-bit integer
  private static write32(val: number): number[] {
    return [(val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff];
  }

  // Generate complete Standard MIDI File (SMF Format 1)
  public static generateMidi(
    projectName: string,
    bpm: number,
    tracks: ChannelTrack[],
    patterns: Pattern[]
  ): Blob {
    const ticksPerQuarter = this.PPQ;
    const ticksPer16th = ticksPerQuarter / 4; // 120 ticks

    const trackChunks: number[][] = [];

    // =========================================================================
    // Track 0: Conductor / Tempo Track
    // =========================================================================
    const conductorEvents: MidiEvent[] = [];

    // Track Name Meta Event
    const nameBytes = Array.from(new TextEncoder().encode(`${projectName} - Conductor`));
    conductorEvents.push({
      tick: 0,
      type: 'meta',
      channel: 0,
      metaBytes: [0xff, 0x03, nameBytes.length, ...nameBytes],
    });

    // Time Signature: 4/4, 24 MIDI clocks per quarter, 8 32nd notes per 24 clocks
    conductorEvents.push({
      tick: 0,
      type: 'meta',
      channel: 0,
      metaBytes: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08],
    });

    // Set Tempo: Microseconds per quarter note = 60,000,000 / BPM
    const microSecPerQuarter = Math.round(60000000 / Math.max(40, Math.min(260, bpm)));
    conductorEvents.push({
      tick: 0,
      type: 'meta',
      channel: 0,
      metaBytes: [
        0xff,
        0x51,
        0x03,
        (microSecPerQuarter >> 16) & 0xff,
        (microSecPerQuarter >> 8) & 0xff,
        microSecPerQuarter & 0xff,
      ],
    });

    // End of track meta event
    conductorEvents.push({
      tick: ticksPerQuarter * 4,
      type: 'meta',
      channel: 0,
      metaBytes: [0xff, 0x2f, 0x00],
    });

    trackChunks.push(this.buildTrackChunk(conductorEvents));

    // =========================================================================
    // Tracks 1..N: Channel & Instrument Tracks
    // =========================================================================
    tracks.forEach((track, trkIdx) => {
      const events: MidiEvent[] = [];
      const midiChannel = track.type === 'drum' ? 9 : (trkIdx % 15 === 9 ? 10 : trkIdx % 15);

      // Track Name
      const trkNameBytes = Array.from(new TextEncoder().encode(track.name));
      events.push({
        tick: 0,
        type: 'meta',
        channel: midiChannel,
        metaBytes: [0xff, 0x03, trkNameBytes.length, ...trkNameBytes],
      });

      // Collect all patterns' events for this track
      patterns.forEach((pattern) => {
        // 1. Channel Rack Steps
        const trackSteps = track.steps[pattern.id];
        if (trackSteps) {
          trackSteps.forEach((step, stepIdx) => {
            if (!step || !step.active) return;

            const baseMidi =
              track.type === 'drum' && track.soundId
                ? DRUM_NOTE_MAP[track.soundId] || 36
                : 60 + (step.pitchOffset || 0);

            const baseTick = stepIdx * ticksPer16th;
            const ratchet = step.ratchetCount && step.ratchetCount > 1 ? step.ratchetCount : 1;
            const subTickDur = Math.floor(ticksPer16th / ratchet);

            for (let r = 0; r < ratchet; r++) {
              const startTick = baseTick + r * subTickDur;
              const noteDur = Math.max(15, Math.floor(subTickDur * 0.85));

              let vel = Math.round(step.velocity * 127);
              if (ratchet > 1) {
                if (step.velocityRamp === 'up') {
                  vel = Math.round(step.velocity * (0.35 + 0.65 * (r / (ratchet - 1))) * 127);
                } else if (step.velocityRamp === 'down') {
                  vel = Math.round(step.velocity * (1.0 - 0.65 * (r / (ratchet - 1))) * 127);
                }
              }
              vel = Math.max(1, Math.min(127, vel));

              const pitchOffset =
                ratchet > 1 && step.pitchRamp ? Math.round((step.pitchRamp * r) / (ratchet - 1)) : 0;
              const noteNumber = Math.max(0, Math.min(127, baseMidi + pitchOffset));

              events.push({
                tick: startTick,
                type: 'noteOn',
                channel: midiChannel,
                note: noteNumber,
                velocity: vel,
              });

              events.push({
                tick: startTick + noteDur,
                type: 'noteOff',
                channel: midiChannel,
                note: noteNumber,
                velocity: 0,
              });
            }
          });
        }

        // 2. Piano Roll Notes
        if (pattern.notes) {
          pattern.notes
            .filter((n) => n.trackId === track.id)
            .forEach((note) => {
              const startTick = note.startStep * ticksPer16th;
              const durationTicks = Math.max(15, Math.floor(note.durationSteps * ticksPer16th * 0.95));
              const vel = Math.max(1, Math.min(127, Math.round(note.velocity * 127)));

              events.push({
                tick: startTick,
                type: 'noteOn',
                channel: midiChannel,
                note: Math.max(0, Math.min(127, note.midiNote)),
                velocity: vel,
              });

              events.push({
                tick: startTick + durationTicks,
                type: 'noteOff',
                channel: midiChannel,
                note: Math.max(0, Math.min(127, note.midiNote)),
                velocity: 0,
              });
            });
        }
      });

      // End of Track Event
      const lastTick = events.length > 0 ? Math.max(...events.map((e) => e.tick)) + 120 : 480;
      events.push({
        tick: lastTick,
        type: 'meta',
        channel: midiChannel,
        metaBytes: [0xff, 0x2f, 0x00],
      });

      trackChunks.push(this.buildTrackChunk(events));
    });

    // =========================================================================
    // Header Chunk (MThd)
    // =========================================================================
    // Header format: 'MThd' (4 bytes), length = 6 (4 bytes), format = 1 (2 bytes),
    // numTracks = N (2 bytes), division = PPQ (2 bytes)
    const headerChunk: number[] = [
      0x4d, 0x54, 0x68, 0x64, // 'MThd'
      0x00, 0x00, 0x00, 0x06, // length = 6
      0x00, 0x01,             // Format 1: Multi-track synchronous
      ...this.write16(trackChunks.length),
      ...this.write16(ticksPerQuarter),
    ];

    // Combine all chunks into flat binary Uint8Array
    const fullBinary: number[] = [...headerChunk];
    trackChunks.forEach((chunk) => {
      fullBinary.push(...chunk);
    });

    return new Blob([new Uint8Array(fullBinary)], { type: 'audio/midi' });
  }

  // Build a single MTrk chunk from sorted MIDI events
  private static buildTrackChunk(events: MidiEvent[]): number[] {
    // Sort events chronologically
    const sorted = [...events].sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      // NoteOff before NoteOn if simultaneous
      if (a.type === 'noteOff' && b.type === 'noteOn') return -1;
      if (a.type === 'noteOn' && b.type === 'noteOff') return 1;
      return 0;
    });

    const trackData: number[] = [];
    let lastTick = 0;

    sorted.forEach((e) => {
      const deltaTick = Math.max(0, e.tick - lastTick);
      lastTick = e.tick;

      // Delta time in VLQ format
      trackData.push(...this.encodeVlq(deltaTick));

      if (e.type === 'meta' && e.metaBytes) {
        trackData.push(...e.metaBytes);
      } else if (e.type === 'noteOn' && e.note !== undefined && e.velocity !== undefined) {
        trackData.push(0x90 | (e.channel & 0x0f), e.note, e.velocity);
      } else if (e.type === 'noteOff' && e.note !== undefined) {
        trackData.push(0x80 | (e.channel & 0x0f), e.note, e.velocity || 0);
      }
    });

    // Wrap with MTrk header + 32-bit chunk length
    return [
      0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
      ...this.write32(trackData.length),
      ...trackData,
    ];
  }

  // Trigger immediate browser download of the .mid file
  public static downloadMidi(
    projectName: string,
    bpm: number,
    tracks: ChannelTrack[],
    patterns: Pattern[]
  ) {
    const blob = this.generateMidi(projectName, bpm, tracks, patterns);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}.mid`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
