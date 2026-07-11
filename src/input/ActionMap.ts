import Phaser from 'phaser';
import { Action, type InputSnapshot } from '../core/input';

/**
 * Input ADAPTER (ARCHITECTURE.md §9): the only file that knows physical key
 * codes. Translates Phaser keyboard state into the framework-free
 * InputSnapshot once per tick. Rebinding or gamepad support later = changes
 * here only.
 */
const DEFAULT_BINDINGS: Record<Action, number[]> = {
  [Action.MoveUp]: [Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP],
  [Action.MoveDown]: [Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN],
  [Action.MoveLeft]: [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT],
  [Action.MoveRight]: [
    Phaser.Input.Keyboard.KeyCodes.D,
    Phaser.Input.Keyboard.KeyCodes.RIGHT,
  ],
  [Action.Sprint]: [Phaser.Input.Keyboard.KeyCodes.SHIFT],
};

export class ActionMap {
  private readonly keys = new Map<Action, Phaser.Input.Keyboard.Key[]>();

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) return; // e.g. headless / no keyboard: NULL-like snapshots
    for (const [action, codes] of Object.entries(DEFAULT_BINDINGS)) {
      this.keys.set(
        action as Action,
        codes.map((c) => keyboard.addKey(c)),
      );
    }
  }

  /** Sample once per tick (§9) — systems all see this identical snapshot. */
  snapshot(): InputSnapshot {
    const held = (a: Action): boolean =>
      (this.keys.get(a) ?? []).some((k) => k.isDown);

    return {
      axisX: (held(Action.MoveRight) ? 1 : 0) - (held(Action.MoveLeft) ? 1 : 0),
      axisY: (held(Action.MoveDown) ? 1 : 0) - (held(Action.MoveUp) ? 1 : 0),
      sprintHeld: held(Action.Sprint),
    };
  }
}
