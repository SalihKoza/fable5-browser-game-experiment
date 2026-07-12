import { ZONE_TUNING } from '../config/tuning';
import { GameEvent } from '../core/events';
import type { GameBus } from '../core/events';
import type { ZoneId } from '../core/zones';
import { Synth, type Drone } from './synth';

/**
 * Audio as an event-bus subscriber (§4): gameplay code never calls audio —
 * it emits the events it would emit anyway, and this director scores them.
 * Same architectural seat as the UI: react, never mutate.
 */
export class AudioDirector {
  private readonly synth = new Synth();
  private readonly drone: Drone;
  private readonly unsubscribes: (() => void)[];

  constructor(bus: GameBus) {
    this.drone = this.synth.startDrone();

    this.unsubscribes = [
      bus.on(GameEvent.PlayerAttacked, () =>
        this.synth.noise({ durationMs: 80, volume: 0.12, filterFreq: 2600 }),
      ),
      bus.on(GameEvent.PlayerDamaged, () => {
        this.synth.blip({ freq: 160, endFreq: 70, durationMs: 150, type: 'sawtooth', volume: 0.22 });
        this.synth.noise({ durationMs: 110, volume: 0.18, filterFreq: 700 });
      }),
      bus.on(GameEvent.EnemyDied, () =>
        this.synth.blip({ freq: 220, endFreq: 40, durationMs: 320, type: 'square', volume: 0.15 }),
      ),
      bus.on(GameEvent.ItemPickedUp, () =>
        this.synth.blip({ freq: 520, endFreq: 690, durationMs: 90, type: 'sine', volume: 0.16 }),
      ),
      bus.on(GameEvent.ChestOpened, () =>
        this.synth.blip({ freq: 310, endFreq: 415, durationMs: 220, type: 'triangle', volume: 0.2 }),
      ),
      bus.on(GameEvent.PlayerDied, () => {
        this.drone.stop();
        this.synth.blip({ freq: 190, endFreq: 28, durationMs: 900, type: 'sawtooth', volume: 0.26 });
      }),
    ];
  }

  /** Darker zones press the drone harder — the soundtrack IS the zone data. */
  setZone(zone: ZoneId): void {
    this.drone.setIntensity(ZONE_TUNING[zone].droneGain);
  }

  destroy(): void {
    for (const off of this.unsubscribes) off();
    this.drone.stop();
    this.synth.destroy();
  }
}
