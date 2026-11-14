import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    // One file at a time: the eval's latency gate must not compete for CPU with
    // the 1,036-question generated eval running in parallel.
    fileParallelism: false,
  },
});
