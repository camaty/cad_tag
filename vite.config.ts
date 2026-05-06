import { defineConfig } from 'vitest/config';

export default defineConfig({
    base: '/cad_tag/',
    test: {
        environment: 'jsdom',
        include: ['tests/unit/**/*.test.ts']
    }
});
