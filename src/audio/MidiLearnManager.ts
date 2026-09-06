import { MidiCcMapping } from '../types/daw';
import { MidiManager } from './MidiManager';

export interface MidiLearnTarget {
  targetType: MidiCcMapping['targetType'];
  channelIndex?: number;
  paramId?: string;
  name: string;
  min: number;
  max: number;
}

export class MidiLearnManager {
  private static instance: MidiLearnManager | null = null;
  private midiManager: MidiManager;
  private mappings: MidiCcMapping[] = [];
  public isLearning: boolean = false;
  public learningTarget: MidiLearnTarget | null = null;
  public lastReceivedCc: { cc: number; value: number; channel: number } | null = null;

  private onMappingsChangeListeners: Set<(mappings: MidiCcMapping[]) => void> = new Set();
  private onParameterChangeListeners: Set<(mapping: MidiCcMapping, scaledValue: number) => void> = new Set();
  private onLearnStatusListeners: Set<(isLearning: boolean, target: MidiLearnTarget | null) => void> = new Set();

  private constructor() {
    this.midiManager = MidiManager.getInstance();
    this.loadSavedMappings();

    // Hook into Web MIDI CC stream
    this.midiManager.onControlChange((controller, value, channel) => {
      this.handleControlChange(controller, value, channel);
    });
  }

  public static getInstance(): MidiLearnManager {
    if (!MidiLearnManager.instance) {
      MidiLearnManager.instance = new MidiLearnManager();
    }
    return MidiLearnManager.instance;
  }

  private loadSavedMappings() {
    try {
      const saved = localStorage.getItem('eves_mixer_midi_mappings');
      if (saved) {
        this.mappings = JSON.parse(saved);
      } else {
        // Default useful hardware mappings (e.g. Master Volume CC7, Pan CC10, Filter CC74)
        this.mappings = [
          {
            id: 'map_master_vol',
            ccNumber: 7, // Standard MIDI Master Volume
            channel: 0,
            name: 'Master Volume',
            targetType: 'mixerVolume',
            channelIndex: 0,
            min: 0,
            max: 1.25,
          },
          {
            id: 'map_master_pan',
            ccNumber: 10, // Standard MIDI Pan
            channel: 0,
            name: 'Master Pan',
            targetType: 'mixerPan',
            channelIndex: 0,
            min: -1,
            max: 1,
          },
          {
            id: 'map_synth_cutoff',
            ccNumber: 74, // Standard MIDI Brightness / Cutoff
            channel: 0,
            name: 'EveSynth Cutoff',
            targetType: 'synthCutoff',
            min: 40,
            max: 18000,
          },
        ];
      }
    } catch (e) {
      console.warn('Failed to load MIDI mappings:', e);
    }
  }

  private saveMappings() {
    try {
      localStorage.setItem('eves_mixer_midi_mappings', JSON.stringify(this.mappings));
    } catch (e) {
      // Ignore
    }
    this.onMappingsChangeListeners.forEach((cb) => cb([...this.mappings]));
  }

  public getMappings(): MidiCcMapping[] {
    return [...this.mappings];
  }

  public startLearn(target: MidiLearnTarget) {
    this.isLearning = true;
    this.learningTarget = target;
    this.onLearnStatusListeners.forEach((cb) => cb(true, target));
  }

  public cancelLearn() {
    this.isLearning = false;
    this.learningTarget = null;
    this.onLearnStatusListeners.forEach((cb) => cb(false, null));
  }

  public addMapping(mapping: MidiCcMapping) {
    this.mappings = this.mappings.filter(
      (m) => !(m.targetType === mapping.targetType && m.channelIndex === mapping.channelIndex && m.paramId === mapping.paramId)
    );
    this.mappings.push(mapping);
    this.saveMappings();
  }

  public removeMapping(id: string) {
    this.mappings = this.mappings.filter((m) => m.id !== id);
    this.saveMappings();
  }

  public clearAll() {
    this.mappings = [];
    this.saveMappings();
  }

  private handleControlChange(controller: number, value: number, channel: number) {
    this.lastReceivedCc = { cc: controller, value, channel };

    // 1. If currently in MIDI Learn mode, bind incoming CC to the pending target!
    if (this.isLearning && this.learningTarget) {
      const newMapping: MidiCcMapping = {
        id: `map_${Date.now()}_${controller}`,
        ccNumber: controller,
        channel,
        name: this.learningTarget.name,
        targetType: this.learningTarget.targetType,
        channelIndex: this.learningTarget.channelIndex,
        paramId: this.learningTarget.paramId,
        min: this.learningTarget.min,
        max: this.learningTarget.max,
      };

      this.addMapping(newMapping);
      this.cancelLearn();
      return;
    }

    // 2. Dispatch mapped CC value to registered listeners
    const matched = this.mappings.filter(
      (m) => m.ccNumber === controller && (m.channel === 0 || m.channel === channel)
    );

    for (const mapping of matched) {
      const normalized = value / 127.0;
      const scaled = mapping.min + normalized * (mapping.max - mapping.min);
      this.onParameterChangeListeners.forEach((cb) => cb(mapping, scaled));
    }
  }

  public onParameterChange(cb: (mapping: MidiCcMapping, scaledValue: number) => void) {
    this.onParameterChangeListeners.add(cb);
    return () => this.onParameterChangeListeners.delete(cb);
  }

  public onMappingsChange(cb: (mappings: MidiCcMapping[]) => void) {
    this.onMappingsChangeListeners.add(cb);
    return () => this.onMappingsChangeListeners.delete(cb);
  }

  public onLearnStatus(cb: (isLearning: boolean, target: MidiLearnTarget | null) => void) {
    this.onLearnStatusListeners.add(cb);
    return () => this.onLearnStatusListeners.delete(cb);
  }
}
