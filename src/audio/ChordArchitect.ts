import { ChordProgressionTemplate, VoicedChord, PianoNote, RootNote } from '../types/daw';
import { NOTE_NAMES } from './Presets';

/**
 * ChordArchitect: Scaler-Style Harmonic Progression Generator
 * Features:
 * - Curated genre chord progressions with Roman numeral analysis
 * - Optimal Voice Leading solver: minimizes voice travel distance between inversions
 * - Strumming & humanization dynamics
 * - Piano Roll export
 */
export class ChordArchitect {
  private static instance: ChordArchitect;

  public static readonly PROGRESSIONS: ChordProgressionTemplate[] = [
    {
      id: 'neo-soul-dream',
      name: 'Neo-Soul Butter & Silk',
      genre: 'neoSoul',
      desc: 'Lush 9th & 11th chords with classic soulful voice leading',
      key: 'D',
      scale: 'minor',
      chords: [
        { name: 'Dm9', roman: 'i9', intervals: [0, 3, 7, 10, 14] },
        { name: 'G13', roman: 'IV13', intervals: [5, 9, 12, 15, 21] },
        { name: 'Cmaj9', roman: 'bVIImaj9', intervals: [10, 14, 17, 21, 26] },
        { name: 'A7#9', roman: 'V7#9', intervals: [7, 11, 14, 17, 22] },
      ],
    },
    {
      id: 'dark-trap-808',
      name: 'Dark Trap Menace',
      genre: 'darkTrap',
      desc: 'Sinister harmonic minor progression for sliding 808s',
      key: 'C',
      scale: 'minor',
      chords: [
        { name: 'Cm', roman: 'i', intervals: [0, 3, 7] },
        { name: 'Ab', roman: 'VI', intervals: [8, 12, 15] },
        { name: 'Fm', roman: 'iv', intervals: [5, 8, 12] },
        { name: 'G', roman: 'V', intervals: [7, 11, 14] },
      ],
    },
    {
      id: 'uk-drill-bounce',
      name: 'UK / NY Drill Minor Walk',
      genre: 'drill',
      desc: 'Tense minor second and fourth tension chords',
      key: 'F#',
      scale: 'minor',
      chords: [
        { name: 'F#m7', roman: 'i7', intervals: [0, 3, 7, 10] },
        { name: 'Gmaj7', roman: 'bIImaj7', intervals: [1, 5, 8, 12] },
        { name: 'Em7', roman: 'vii7', intervals: [10, 13, 17, 20] },
        { name: 'F#m', roman: 'i', intervals: [0, 3, 7] },
      ],
    },
    {
      id: 'city-pop-royal',
      name: 'Japanese City Pop (Royal Road)',
      genre: 'cityPop',
      desc: 'The iconic IVmaj7 - III7 - vi7 - I7 progression used in legendary Japanese funk',
      key: 'F',
      scale: 'major',
      chords: [
        { name: 'Bbmaj7', roman: 'IVmaj7', intervals: [5, 9, 12, 16] },
        { name: 'A7', roman: 'III7', intervals: [4, 8, 11, 14] },
        { name: 'Dm7', roman: 'vi7', intervals: [9, 12, 16, 19] },
        { name: 'F7', roman: 'I7', intervals: [0, 4, 7, 10] },
      ],
    },
    {
      id: 'synthwave-drive',
      name: '80s Synthwave Outrun',
      genre: 'synthwave',
      desc: 'Epic nostalgic synth chords with rolling bass energy',
      key: 'A',
      scale: 'minor',
      chords: [
        { name: 'Am', roman: 'i', intervals: [0, 3, 7] },
        { name: 'F', roman: 'VI', intervals: [8, 12, 15] },
        { name: 'C', roman: 'III', intervals: [3, 7, 10] },
        { name: 'G', roman: 'VII', intervals: [10, 14, 17] },
      ],
    },
    {
      id: 'lofi-nostalgia',
      name: 'Dusty Lo-Fi Nostalgia',
      genre: 'lofi',
      desc: 'Warm jazz minor 7ths for sleepy bedroom beats',
      key: 'Eb',
      scale: 'major',
      chords: [
        { name: 'Ebmaj7', roman: 'Imaj7', intervals: [0, 4, 7, 11] },
        { name: 'Cm7', roman: 'vi7', intervals: [9, 12, 15, 19] },
        { name: 'Fm7', roman: 'ii7', intervals: [2, 5, 9, 12] },
        { name: 'Bb7', roman: 'V7', intervals: [7, 10, 14, 17] },
      ],
    },
    {
      id: 'cinematic-glory',
      name: 'Cinematic Hans Hero',
      genre: 'cinematic',
      desc: 'Massive emotional orchestral rise and fall',
      key: 'D',
      scale: 'minor',
      chords: [
        { name: 'Dm', roman: 'i', intervals: [0, 3, 7] },
        { name: 'Bb', roman: 'VI', intervals: [8, 12, 15] },
        { name: 'Gm', roman: 'iv', intervals: [5, 8, 12] },
        { name: 'A', roman: 'V', intervals: [7, 11, 14] },
      ],
    },
  ];

  private constructor() {}

  public static getInstance(): ChordArchitect {
    if (!ChordArchitect.instance) {
      ChordArchitect.instance = new ChordArchitect();
    }
    return ChordArchitect.instance;
  }

  /**
   * Generates optimal voice-led pitches for a selected progression
   */
  public generateVoicedChords(
    template: ChordProgressionTemplate,
    rootKey: RootNote = 'C',
    baseOctave: number = 4, // C4 = 60
    enableSmartVoiceLeading: boolean = true
  ): VoicedChord[] {
    const rootMidiBase = 12 * (baseOctave + 1) + NOTE_NAMES.indexOf(rootKey);
    const results: VoicedChord[] = [];

    let prevNotes: number[] | null = null;

    for (let c = 0; c < template.chords.length; c++) {
      const chordDef = template.chords[c];
      const rawNotes = chordDef.intervals.map((inter) => rootMidiBase + inter);

      if (!enableSmartVoiceLeading || !prevNotes) {
        // Standard root position clamped to reasonable register (48 - 84)
        const adjustedNotes = rawNotes.map((n) => {
          while (n < 50) n += 12;
          while (n > 82) n -= 12;
          return n;
        }).sort((a, b) => a - b);

        results.push({
          name: chordDef.name,
          romanNumeral: chordDef.roman,
          midiNotes: adjustedNotes,
          rootMidi: rootMidiBase,
          durationSteps: 8, // 2 beats
        });
        prevNotes = adjustedNotes;
      } else {
        // Optimal Voice Leading:
        // Find octave permutation of rawNotes that minimizes sum of distances to prevNotes
        const voiced = this.solveOptimalVoiceLeading(rawNotes, prevNotes);
        results.push({
          name: chordDef.name,
          romanNumeral: chordDef.roman,
          midiNotes: voiced,
          rootMidi: rootMidiBase,
          durationSteps: 8,
        });
        prevNotes = voiced;
      }
    }

    return results;
  }

  /**
   * Evaluates octave shifts per voice to minimize pitch travel from previous chord
   */
  private solveOptimalVoiceLeading(currentNotes: number[], prevNotes: number[]): number[] {
    const candidates: number[][] = [];

    // Base pitch classes relative to middle register
    const basePitches = currentNotes.map((n) => (n % 12));

    // Try common inversions and octave layouts
    const octaveOffsets = [-12, 0, 12];
    let bestNotes = [...currentNotes];
    let minDistance = Infinity;

    // Center register around average of prevNotes
    const prevAvg = prevNotes.reduce((a, b) => a + b, 0) / prevNotes.length;

    // Generate candidate voicings
    for (let inv = 0; inv < currentNotes.length; inv++) {
      const inverted = [...currentNotes];
      for (let i = 0; i < inv; i++) {
        inverted[i] += 12;
      }

      for (const oct of octaveOffsets) {
        const shifted = inverted.map((n) => n + oct).sort((a, b) => a - b);
        const shiftAvg = shifted.reduce((a, b) => a + b, 0) / shifted.length;

        // Skip if outside comfortable keyboard range (44 to 88)
        if (shifted[0] < 44 || shifted[shifted.length - 1] > 88) continue;

        // Calculate pitch travel distance
        let dist = 0;
        for (let i = 0; i < Math.min(shifted.length, prevNotes.length); i++) {
          dist += Math.abs(shifted[i] - prevNotes[i]);
        }
        // Penalize wide deviations from previous center
        dist += Math.abs(shiftAvg - prevAvg) * 1.5;

        if (dist < minDistance) {
          minDistance = dist;
          bestNotes = shifted;
        }
      }
    }

    return bestNotes;
  }

  /**
   * Converts voiced chords into PianoNotes ready for the Piano Roll
   */
  public toPianoNotes(
    voicedChords: VoicedChord[],
    trackId: string,
    startStep: number = 0,
    strumSpeedMs: number = 18,
    bpm: number = 130
  ): PianoNote[] {
    const notes: PianoNote[] = [];
    let curStep = startStep;

    const msPerStep = (60000 / bpm) / 4;
    const strumStepOffset = strumSpeedMs / msPerStep;

    for (const chord of voicedChords) {
      for (let i = 0; i < chord.midiNotes.length; i++) {
        const midi = chord.midiNotes[i];
        // Humanized micro-timing and velocity
        const strumOffset = i * strumStepOffset;
        const velocity = Math.min(1.0, 0.75 + (i % 2 === 0 ? 0.1 : -0.05) + Math.random() * 0.08);

        notes.push({
          id: `chord-${Date.now()}-${curStep}-${midi}-${i}`,
          trackId,
          midiNote: midi,
          startStep: Math.round(curStep + strumOffset),
          durationSteps: Math.max(1, chord.durationSteps - 1),
          velocity: Number(velocity.toFixed(2)),
        });
      }
      curStep += chord.durationSteps;
    }

    return notes;
  }
}
