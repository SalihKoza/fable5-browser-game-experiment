/**
 * Composition root (ARCHITECTURE.md §3): the only file that knows about both
 * the Phaser engine configuration AND the full scene list. Nothing else in
 * the codebase constructs or references the Game instance.
 */
import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { PlayScene } from './scenes/PlayScene';
import { DeadScene } from './scenes/DeadScene';

new Phaser.Game({
  parent: 'game',
  // Fixed internal resolution, scaled to fit (§7) — pixel-art constraint.
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  pixelArt: true,
  backgroundColor: '#0a0a0f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      // Fixed-step simulation so gameplay speed never depends on refresh rate (§7).
      fixedStep: true,
      fps: GAME_CONFIG.physicsFps,
      debug: GAME_CONFIG.debugPhysics,
    },
  },
  // Scene order matters: the first scene auto-starts the flow FSM (§6).
  scene: [BootScene, PreloadScene, MenuScene, PlayScene, DeadScene],
});
