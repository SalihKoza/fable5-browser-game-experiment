/**
 * DOM debug overlay (fps, scene, entity count). Lives in the #ui layer above
 * the canvas — demonstrating the DOM-overlay UI pattern from ARCHITECTURE.md §1
 * before the real HUD exists.
 */
export class DebugOverlay {
  private readonly el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'debug-overlay';
    document.getElementById('ui')?.appendChild(this.el);
  }

  update(lines: Record<string, string | number>): void {
    this.el.textContent = Object.entries(lines)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }

  destroy(): void {
    this.el.remove();
  }
}
