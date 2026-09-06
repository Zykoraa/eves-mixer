import { SidechainRoute } from '../types/daw';
import { Mixer } from './Mixer';

export class SidechainManager {
  private static instance: SidechainManager | null = null;
  private routes: SidechainRoute[] = [];
  private mixer: Mixer | null = null;
  private ctx: AudioContext | null = null;

  private constructor() {}

  public static getInstance(): SidechainManager {
    if (!SidechainManager.instance) {
      SidechainManager.instance = new SidechainManager();
    }
    return SidechainManager.instance;
  }

  public init(ctx: AudioContext, mixer: Mixer) {
    this.ctx = ctx;
    this.mixer = mixer;
  }

  public setRoutes(routes: SidechainRoute[]) {
    this.routes = routes;
  }

  public getRoutes(): SidechainRoute[] {
    return this.routes;
  }

  /**
   * Triggered when a sound on sourceChannelIndex plays (e.g. Kick step)
   */
  public triggerDucking(sourceChannelIndex: number, time?: number) {
    if (!this.mixer || !this.ctx) return;
    const now = time ?? this.ctx.currentTime;

    for (const route of this.routes) {
      if (!route.enabled) continue;
      if (route.sourceChannelIndex === sourceChannelIndex) {
        const targetChannel = this.mixer.getChannel(route.targetChannelIndex);
        if (!targetChannel) continue;

        const attackSec = Math.max(0.001, route.attackMs / 1000);
        const releaseSec = Math.max(0.01, route.releaseMs / 1000);

        if (route.mode === 'volume') {
          // Volume ducking
          const duckLinear = Math.pow(10, -Math.abs(route.duckingDepthDb) / 20);
          const gainParam = targetChannel.sidechainGainNode.gain;
          gainParam.cancelScheduledValues(now);
          gainParam.setValueAtTime(gainParam.value, now);
          gainParam.linearRampToValueAtTime(duckLinear, now + attackSec);
          gainParam.setTargetAtTime(1.0, now + attackSec, releaseSec / 3);
        } else {
          // Low-Shelf Ducking (cuts sub/low frequencies below 130Hz on target)
          const duckDb = -Math.abs(route.duckingDepthDb);
          const shelfParam = targetChannel.sidechainShelfNode.gain;
          shelfParam.cancelScheduledValues(now);
          shelfParam.setValueAtTime(shelfParam.value, now);
          shelfParam.linearRampToValueAtTime(duckDb, now + attackSec);
          shelfParam.setTargetAtTime(0.0, now + attackSec, releaseSec / 3);
        }
      }
    }
  }

  /**
   * Create an optimal default sidechain route (e.g. Kick -> 808 Bass)
   */
  public static createDefaultRoute(
    sourceChannel: number = 1,
    targetChannel: number = 3,
    name: string = 'Kick -> 808 Sidechain',
    mode: 'volume' | 'lowShelf' = 'lowShelf'
  ): SidechainRoute {
    return {
      id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      enabled: true,
      name,
      sourceChannelIndex: sourceChannel,
      targetChannelIndex: targetChannel,
      thresholdDb: -14,
      duckingDepthDb: mode === 'lowShelf' ? 14 : 10,
      attackMs: 2.5,
      releaseMs: 140,
      mode,
    };
  }
}
