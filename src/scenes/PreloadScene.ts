import Phaser from 'phaser';
import { GAME_CONFIG, SceneKey } from '../config/game';

/** Shape of public/assets/manifest.json — every loadable asset, declared once. */
interface AssetManifest {
  images: { key: string; url: string }[];
  audio: { key: string; url: string }[];
  data: { key: string; url: string }[];
}

/**
 * PreloadScene: manifest-driven loading with a progress bar (ARCHITECTURE.md §10).
 * The manifest is the single audit point for everything that ships; a missing
 * asset fails loudly here, at boot — not as an invisible sprite at minute 20.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    this.drawProgressBar();
    // Two-pass load: fetch the manifest itself, then queue everything it lists.
    this.load.json('manifest', 'assets/manifest.json');
    this.load.once('filecomplete-json-manifest', () => {
      const manifest = this.cache.json.get('manifest') as AssetManifest;
      for (const img of manifest.images) this.load.image(img.key, img.url);
      for (const snd of manifest.audio) this.load.audio(snd.key, snd.url);
      for (const dat of manifest.data) this.load.json(dat.key, dat.url);
    });
  }

  create(): void {
    this.scene.start(SceneKey.Menu);
  }

  private drawProgressBar(): void {
    const { width, height } = GAME_CONFIG;
    const barW = width * 0.5;
    const box = this.add.rectangle(width / 2, height / 2, barW + 4, 12, 0x1a1a22);
    const bar = this.add
      .rectangle(width / 2 - barW / 2, height / 2, 0, 8, 0x8a2f2f)
      .setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => {
      bar.width = barW * p;
    });
    this.load.once('complete', () => {
      bar.destroy();
      box.destroy();
    });
  }
}
