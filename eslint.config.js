// Flat ESLint config. Beyond style, this file enforces ARCHITECTURE.md's
// layer boundary: src/core/ is framework-free and may never import Phaser.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/'] },
  ...tseslint.configs.recommended,
  {
    // ★ Architectural rule: the core (domain) layer must not know Phaser exists.
    files: ['src/core/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'phaser',
              message:
                'src/core/ is the framework-free domain layer (see ARCHITECTURE.md §3). Put Phaser-aware code in scenes/, systems/, or entities/.',
            },
          ],
        },
      ],
    },
  },
);
