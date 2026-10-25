import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Corpus-wide tests read all 305,648 TAHOT rows (~5s on a slow runner); don't fail a release run on it.
    testTimeout: 30000,
  },
});
