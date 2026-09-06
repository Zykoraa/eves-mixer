type NoteOnCallback = (midiNote: number, velocity: number) => void;
type NoteOffCallback = (midiNote: number) => void;
export type ControlChangeCallback = (controller: number, value: number, channel: number) => void;

export class MidiManager {
  private static instance: MidiManager | null = null;
  public isSupported: boolean = false;
  public connectedDevices: string[] = [];
  public connectedOutputs: string[] = [];

  private midiAccess: MIDIAccess | null = null;
  private outputMap: Map<string, MIDIOutput> = new Map();
  private onNoteOnListeners: Set<NoteOnCallback> = new Set();
  private onNoteOffListeners: Set<NoteOffCallback> = new Set();
  private onControlChangeListeners: Set<ControlChangeCallback> = new Set();

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
        const access = await navigator.requestMIDIAccess({ sysex: false });
        this.midiAccess = access;
        this.updatePorts(access);
        access.onstatechange = () => {
          this.updatePorts(access);
        };
      } catch (err) {
        console.warn('Web MIDI Access request rejected:', err);
      }
    }
  }

  private updatePorts(access: MIDIAccess) {
    // Inputs
    const inDevices: string[] = [];
    access.inputs.forEach((input) => {
      const name = input.name || 'Unknown MIDI Controller';
      inDevices.push(name);
      input.onmidimessage = (msg) => this.handleMidiMessage(msg);
    });
    this.connectedDevices = inDevices;

    // Outputs
    const outDevices: string[] = [];
    this.outputMap.clear();
    access.outputs.forEach((output) => {
      const name = output.name || 'Unknown MIDI Output';
      outDevices.push(name);
      this.outputMap.set(name, output);
    });
    this.connectedOutputs = outDevices;
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
    } else if (command === 11) {
      // 0xb = Control Change (CC)
      const channel = (status & 0x0f) + 1;
      this.onControlChangeListeners.forEach((cb) => cb(note, velocity, channel));
    }
  }

  public sendNoteOn(note: number, velocity: number = 0.8, channel: number = 0, targetDeviceName?: string) {
    const status = 0x90 | (channel & 0x0f);
    const velByte = Math.max(0, Math.min(127, Math.round(velocity * 127)));
    const data = [status, note & 0x7f, velByte];

    if (targetDeviceName && this.outputMap.has(targetDeviceName)) {
      this.outputMap.get(targetDeviceName)?.send(data);
    } else {
      // Send to all available outputs
      this.outputMap.forEach((out) => out.send(data));
    }
  }

  public sendNoteOff(note: number, channel: number = 0, targetDeviceName?: string) {
    const status = 0x80 | (channel & 0x0f);
    const data = [status, note & 0x7f, 0];

    if (targetDeviceName && this.outputMap.has(targetDeviceName)) {
      this.outputMap.get(targetDeviceName)?.send(data);
    } else {
      this.outputMap.forEach((out) => out.send(data));
    }
  }

  public sendControlChange(controller: number, value: number, channel: number = 0, targetDeviceName?: string) {
    const status = 0xb0 | (channel & 0x0f);
    const data = [status, controller & 0x7f, value & 0x7f];

    if (targetDeviceName && this.outputMap.has(targetDeviceName)) {
      this.outputMap.get(targetDeviceName)?.send(data);
    } else {
      this.outputMap.forEach((out) => out.send(data));
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

  public onControlChange(cb: ControlChangeCallback) {
    this.onControlChangeListeners.add(cb);
    return () => this.onControlChangeListeners.delete(cb);
  }
}
