import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'))

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
