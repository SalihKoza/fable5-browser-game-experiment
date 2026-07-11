/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the production build works from any static host / subfolder.
  base: './',
  build: {
    // Phaser is large; silence the default 500 kB warning consciously (ADR-001).
    chunkSizeWarningLimit: 1600,
  },
  test: {
    // Unit tests cover only framework-free core logic — no browser, no Phaser.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
