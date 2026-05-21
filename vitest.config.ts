import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// vite.config.ts와 분리한다 — 테스트는 PWA/프록시 미들웨어 플러그인이 필요 없고,
// 그것들을 로드하면 loadEnv 등 부수효과만 늘어난다. alias만 동일하게 맞춘다.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
})
