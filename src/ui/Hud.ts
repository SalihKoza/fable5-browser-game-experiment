import type { GameState } from '../core/state/GameState';

/**
 * DOM HUD (ARCHITECTURE.md §1): reads GameState, never mutates it (§6).
 * Phase 1 shows only the stamina bar — health joins in Phase 2 (combat).
 */
export class Hud {
  private readonly root: HTMLDivElement;
  private readonly staminaFill: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText =
      'position:absolute;left:16px;bottom:14px;width:140px;';

    const label = document.createElement('div');
    label.textContent = 'stamina';
    label.style.cssText =
      'font:10px monospace;color:#6b6558;margin-bottom:2px;letter-spacing:1px;';

    const track = document.createElement('div');
    track.style.cssText =
      'height:6px;background:#1a1a22;border:1px solid #2a2a35;border-radius:2px;overflow:hidden;';

    this.staminaFill = document.createElement('div');
    this.staminaFill.style.cssText =
      'height:100%;width:100%;background:#5d8a4a;transition:width 60ms linear;';

    track.appendChild(this.staminaFill);
    this.root.append(label, track);
    document.getElementById('ui')?.appendChild(this.root);
  }

  update(state: GameState): void {
    const pct = (state.player.stamina / state.player.maxStamina) * 100;
    this.staminaFill.style.width = `${pct}%`;
    // Low-stamina warning tint (also telegraphs the sprint-restart threshold).
    this.staminaFill.style.background = pct < 15 ? '#8a2f2f' : '#5d8a4a';
  }

  destroy(): void {
    this.root.remove();
  }
}
