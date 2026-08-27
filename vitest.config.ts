import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // The @/ alias Next resolves from tsconfig paths. Vitest does not read
  // tsconfig, so without this every component test fails on its first import.
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  // tsconfig says jsx: "preserve" because Next does the transform. Vitest runs
  // the files itself, so it needs a real transform of its own.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    // A component test needs a DOM; a pure-function test does not, and paying
    // for jsdom on all 292 of them would slow the suite for nothing.
    environmentMatchGlobs: [['**/*.test.tsx', 'jsdom']],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.idea/**',
      '**/.git/**',
      '**/.cache/**',
      '.worktrees/**', // git worktrees are separate branch checkouts; their tests are not this branch's tests
    ],
  },
});
