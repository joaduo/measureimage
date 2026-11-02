import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/stores/**', 'src/composables/**', 'src/types.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
})
