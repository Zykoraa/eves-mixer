type NoteOnCallback = (midiNote: number, velocity: number) => void;
type NoteOffCallback = (midiNote: number) => void;

export class MidiManager {
  private static instance: MidiManager | null = null;
  public isSupported: boolean = false;
  public connectedDevices: string[] = [];

  private onNoteOnListeners: Set<NoteOnCallback> = new Set();
  private onNoteOffListeners: Set<NoteOffCallback> = new Set();

  private constructor() {
    this.initMidi();
  }

  public static getInstance(): MidiManager {
    if (!MidiManager.instance) {
      MidiManager.instance = new MidiManager();
    }
    return MidiManager.instance;
  }

  private async initMidi() {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      this.isSupported = true;
      try {
        const midiAccess = await navigator.requestMIDIAccess();
        this.updateInputs(midiAccess);
        midiAccess.onstatechange = () => {
          this.updateInputs(midiAccess);
        };
      } catch (err) {
        console.warn('Web MIDI Access request rejected:', err);
      }
    }
  }

  private updateInputs(midiAccess: MIDIAccess) {
    const devices: string[] = [];
    midiAccess.inputs.forEach((input) => {
      devices.push(input.name || 'Unknown MIDI Controller');
      input.onmidimessage = (msg) => this.handleMidiMessage(msg);
    });
    this.connectedDevices = devices;
  }

  private handleMidiMessage(event: MIDIMessageEvent) {
    if (!event.data) return;
    const [status, note, velocity] = event.data;
    const command = status >> 4;

    // 0x9 = Note On (with velocity > 0)
    if (command === 9) {
      if (velocity > 0) {
        this.onNoteOnListeners.forEach((cb) => cb(note, velocity / 127));
      } else {
        // Velocity 0 is note off
        this.onNoteOffListeners.forEach((cb) => cb(note));
      }
    } else if (command === 8) {
      // 0x8 = Note Off
      this.onNoteOffListeners.forEach((cb) => cb(note));
    }
  }

  public onNoteOn(cb: NoteOnCallback) {
    this.onNoteOnListeners.add(cb);
    return () => this.onNoteOnListeners.delete(cb);
  }

  public onNoteOff(cb: NoteOffCallback) {
    this.onNoteOffListeners.add(cb);
    return () => this.onNoteOffListeners.delete(cb);
  }
}
