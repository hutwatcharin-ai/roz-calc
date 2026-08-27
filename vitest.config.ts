import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
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
