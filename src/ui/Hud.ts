import { countItem } from '../core/inventory';
import type { GameState } from '../core/state/GameState';

/**
 * DOM HUD (ARCHITECTURE.md §1): reads GameState, never mutates it (§6).
 * Health + stamina bars, plus a healing-herb counter (the one consumable
 * that matters moment-to-moment, with its quick-use key).
 */
interface Bar {
  fill: HTMLDivElement;
}

export class Hud {
  private readonly root: HTMLDivElement;
  private readonly health: Bar;
  private readonly stamina: Bar;
  private readonly herbs: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.style.cssText = 'position:absolute;left:16px;bottom:14px;width:140px;';
    this.health = this.makeBar('health', '#8a2f2f');
    this.stamina = this.makeBar('stamina', '#5d8a4a');

    this.herbs = document.createElement('div');
    this.herbs.style.cssText =
      'font:10px monospace;color:#6b6558;margin-top:6px;letter-spacing:1px;';
    this.root.appendChild(this.herbs);

    document.getElementById('ui')?.appendChild(this.root);
  }

  update(state: GameState): void {
    const hpPct = (state.player.health / state.player.maxHealth) * 100;
    this.health.fill.style.width = `${hpPct}%`;

    const stPct = (state.player.stamina / state.player.maxStamina) * 100;
    this.stamina.fill.style.width = `${stPct}%`;
    // Low-stamina tint also telegraphs the sprint-restart threshold.
    this.stamina.fill.style.background = stPct < 15 ? '#8a2f2f' : '#5d8a4a';

    const herbCount = countItem(state.player.inventory, 'healing_herb');
    this.herbs.textContent = herbCount > 0 ? `herbs ×${herbCount} — H to use` : '';
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
