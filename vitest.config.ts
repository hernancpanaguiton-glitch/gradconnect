import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Frontend tests.
 *
 * Kept separate from vite.config.js because the Laravel plugin expects to be
 * building assets for the app, not running in a jsdom process.
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/tests/setup.ts'],
        include: ['resources/js/**/*.test.{ts,tsx}'],
        restoreMocks: true,
    },
});
