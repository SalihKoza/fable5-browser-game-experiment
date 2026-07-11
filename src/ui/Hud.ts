import type { GameState } from '../core/state/GameState';

/**
 * DOM HUD (ARCHITECTURE.md §1): reads GameState, never mutates it (§6).
 * Health (Phase 2) + stamina (Phase 1) bars.
 */
interface Bar {
  fill: HTMLDivElement;
}

export class Hud {
  private readonly root: HTMLDivElement;
  private readonly health: Bar;
  private readonly stamina: Bar;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:absolute;left:16px;bottom:14px;width:140px;';
    this.health = this.makeBar('health', '#8a2f2f');
    this.stamina = this.makeBar('stamina', '#5d8a4a');
    document.getElementById('ui')?.appendChild(this.root);
  }

  update(state: GameState): void {
    const hpPct = (state.player.health / state.player.maxHealth) * 100;
    this.health.fill.style.width = `${hpPct}%`;

    const stPct = (state.player.stamina / state.player.maxStamina) * 100;
    this.stamina.fill.style.width = `${stPct}%`;
    // Low-stamina tint also telegraphs the sprint-restart threshold.
    this.stamina.fill.style.background = stPct < 15 ? '#8a2f2f' : '#5d8a4a';
  }

  destroy(): void {
    this.root.remove();
  }

  private makeBar(name: string, color: string): Bar {
    const label = document.createElement('div');
    label.textContent = name;
    label.style.cssText =
      'font:10px monospace;color:#6b6558;margin:4px 0 2px;letter-spacing:1px;';

    const track = document.createElement('div');
    track.style.cssText =
      'height:6px;background:#1a1a22;border:1px solid #2a2a35;border-radius:2px;overflow:hidden;';

    const fill = document.createElement('div');
    fill.style.cssText = `height:100%;width:100%;background:${color};transition:width 60ms linear;`;

    track.appendChild(fill);
    this.root.append(label, track);
    return { fill };
  }
}
