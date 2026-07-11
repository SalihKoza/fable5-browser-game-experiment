import Phaser from 'phaser';
import { SceneKey } from '../config/game';

/**
 * BootScene: first scene to run. Global engine setup only (no asset loading —
 * that's PreloadScene's job). Kept separate so "configure the engine" and
 * "load the content" remain distinct, restartable steps.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    // Future home of: registering custom pipelines, reading user settings.
    this.scene.start(SceneKey.Preload);
  }
}
