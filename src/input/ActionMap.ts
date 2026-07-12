import Phaser from 'phaser';
import { Action, type InputSnapshot } from '../core/input';

/**
 * Input ADAPTER (ARCHITECTURE.md §9): the only file that knows physical key
 * codes. Translates Phaser keyboard + pointer state into the framework-free
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
  [Action.Attack]: [Phaser.Input.Keyboard.KeyCodes.J, Phaser.Input.Keyboard.KeyCodes.SPACE],
  [Action.Interact]: [Phaser.Input.Keyboard.KeyCodes.E],
  [Action.ToggleInventory]: [
    Phaser.Input.Keyboard.KeyCodes.I,
    Phaser.Input.Keyboard.KeyCodes.TAB,
  ],
  [Action.QuickHeal]: [Phaser.Input.Keyboard.KeyCodes.H],
  [Action.ToggleMute]: [Phaser.Input.Keyboard.KeyCodes.M],
};

export class ActionMap {
  private readonly keys = new Map<Action, Phaser.Input.Keyboard.Key[]>();
  private readonly pointer?: Phaser.Input.Pointer;
  /** Manual edge tracking for the pointer (keys get JustDown from Phaser). */
  private pointerWasDown = false;

  constructor(scene: Phaser.Scene) {
    this.pointer = scene.input.activePointer;
    const keyboard = scene.input.keyboard;
    if (!keyboard) return; // e.g. headless: NULL-like snapshots
    // Tab would move browser focus out of the game — capture it (§9 hygiene).
    keyboard.addCapture(Phaser.Input.Keyboard.KeyCodes.TAB);
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
    // JustDown is a consuming read — exactly one snapshot() per tick may call it.
    const justPressed = (a: Action): boolean =>
      (this.keys.get(a) ?? [])
        .map((k) => Phaser.Input.Keyboard.JustDown(k))
        .some(Boolean);

    const pointerDown = this.pointer?.leftButtonDown() ?? false;
    const pointerJustDown = pointerDown && !this.pointerWasDown;
    this.pointerWasDown = pointerDown;

    return {
      axisX: (held(Action.MoveRight) ? 1 : 0) - (held(Action.MoveLeft) ? 1 : 0),
      axisY: (held(Action.MoveDown) ? 1 : 0) - (held(Action.MoveUp) ? 1 : 0),
      sprintHeld: held(Action.Sprint),
      attackPressed: justPressed(Action.Attack) || pointerJustDown,
      interactPressed: justPressed(Action.Interact),
      inventoryPressed: justPressed(Action.ToggleInventory),
      quickHealPressed: justPressed(Action.QuickHeal),
      mutePressed: justPressed(Action.ToggleMute),
    };
  }
}
