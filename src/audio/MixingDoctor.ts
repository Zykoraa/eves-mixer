import { SpectralCollisionAlert, MixerChannel } from '../types/daw';
import { Mixer } from './Mixer';

export interface ChannelSpectrumEnergy {
  channelIndex: number;
  sub: number;       // 20 - 90 Hz
  mud: number;       // 90 - 350 Hz
  lowMid: number;    // 350 - 1500 Hz
  presence: number;  // 1500 - 6000 Hz
  air: number;       // 6000 - 20000 Hz
}

export class MixingDoctor {
  private static instance: MixingDoctor | null = null;
  private tempFreqData: Uint8Array = new Uint8Array(128);

  private constructor() {}

  public static getInstance(): MixingDoctor {
    if (!MixingDoctor.instance) {
      MixingDoctor.instance = new MixingDoctor();
    }
    return MixingDoctor.instance;
  }

  /**
   * Reads frequency data across all channels and identifies acoustic masking and clashing
   */
  public diagnoseMix(mixer: Mixer, channelsState: MixerChannel[]): {
    alerts: SpectralCollisionAlert[];
    energies: ChannelSpectrumEnergy[];
  } {
    const energies: ChannelSpectrumEnergy[] = [];
    const alerts: SpectralCollisionAlert[] = [];

    // Analyze Master (0) and 8 Inserts (1 to 8)
    for (let i = 0; i <= 8; i++) {
      const node = mixer.getChannel(i);
      if (!node) continue;

      if (this.tempFreqData.length !== node.analyserNode.frequencyBinCount) {
        this.tempFreqData = new Uint8Array(node.analyserNode.frequencyBinCount);
      }

      node.analyserNode.getByteFrequencyData(this.tempFreqData as unknown as Uint8Array<ArrayBuffer>);

      // FFT size is 256, bin count is 128. With 44100Hz sample rate, each bin = ~172 Hz.
      // Bin 0: 0-172 Hz, Bin 1: 172-344 Hz, Bin 2: 344-516 Hz, etc.
      const binCount = this.tempFreqData.length;
      const subEnergy = this.getBandAverage(this.tempFreqData, 0, Math.floor(binCount * 0.05));
      const mudEnergy = this.getBandAverage(this.tempFreqData, Math.floor(binCount * 0.05), Math.floor(binCount * 0.15));
      const lowMidEnergy = this.getBandAverage(this.tempFreqData, Math.floor(binCount * 0.15), Math.floor(binCount * 0.35));
      const presenceEnergy = this.getBandAverage(this.tempFreqData, Math.floor(binCount * 0.35), Math.floor(binCount * 0.65));
      const airEnergy = this.getBandAverage(this.tempFreqData, Math.floor(binCount * 0.65), binCount - 1);

      energies.push({
        channelIndex: i,
        sub: subEnergy,
        mud: mudEnergy,
        lowMid: lowMidEnergy,
        presence: presenceEnergy,
        air: airEnergy,
      });
    }

    // 1. Kick (Channel 1) vs 808 Bass (Channel 3) Sub Collision Detection
    const kickEnergy = energies.find((e) => e.channelIndex === 1);
    const bassEnergy = energies.find((e) => e.channelIndex === 3);

    if (kickEnergy && bassEnergy && kickEnergy.sub > 45 && bassEnergy.sub > 45) {
      alerts.push({
        id: 'alert_sub_kick_808',
        channelA: 1,
        channelB: 3,
        channelAName: channelsState[1]?.name || 'Kick Punch',
        channelBName: channelsState[3]?.name || '808 Bass',
        freqMin: 30,
        freqMax: 90,
        severity: 'critical',
        description: 'Kick and 808 Bass are colliding in the sub-bass register (40–80Hz)! This causes phase cancellation and weak low-end drop power.',
        suggestedAction: 'sidechain',
      });
    }

    // 2. Mud Build-up in Low-Mids (200 - 350 Hz)
    const muddyChannels = energies.filter(
      (e) => e.channelIndex > 0 && e.channelIndex !== 3 && e.mud > 60
    );

    if (muddyChannels.length >= 2) {
      const ch1 = muddyChannels[0];
      const ch2 = muddyChannels[1];
      alerts.push({
        id: `alert_mud_${ch1.channelIndex}_${ch2.channelIndex}`,
        channelA: ch1.channelIndex,
        channelB: ch2.channelIndex,
        channelAName: channelsState[ch1.channelIndex]?.name || `Channel ${ch1.channelIndex}`,
        channelBName: channelsState[ch2.channelIndex]?.name || `Channel ${ch2.channelIndex}`,
        freqMin: 180,
        freqMax: 350,
        severity: 'warning',
        description: `Excessive energy build-up in the mud zone (200–350Hz) between ${channelsState[ch1.channelIndex]?.name} and ${channelsState[ch2.channelIndex]?.name}. The mix sounds boxy.`,
        suggestedAction: 'notchEq',
      });
    }

    // 3. Sub Clutter on Melodic Instruments (Highpass Check)
    for (let c = 4; c <= 8; c++) {
      const melodicEnergy = energies.find((e) => e.channelIndex === c);
      if (melodicEnergy && melodicEnergy.sub > 50) {
        alerts.push({
          id: `alert_highpass_${c}`,
          channelA: c,
          channelB: 0,
          channelAName: channelsState[c]?.name || `Channel ${c}`,
          channelBName: 'Master Headroom',
          freqMin: 20,
          freqMax: 100,
          severity: 'warning',
          description: `${channelsState[c]?.name} contains unnecessary rumble below 100Hz eating master headroom and dirtying the 808.`,
          suggestedAction: 'highpass',
        });
      }
    }

    return { alerts, energies };
  }

  private getBandAverage(data: Uint8Array, startBin: number, endBin: number): number {
    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin && i < data.length; i++) {
      sum += data[i];
      count++;
    }
    return count > 0 ? sum / count : 0;
  }
}
