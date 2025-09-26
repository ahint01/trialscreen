import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        // 2. Add 'alias' and 'dedupe' configuration
        alias: {
            // Allows imports from the shared folder to work correctly
            '@shared': path.resolve(__dirname, '../shared'),
        },
        dedupe: [
            // Forces Vite to resolve these packages to a single instance
            // (the one hoisted to the root node_modules)
            'react',
            'react-dom',
            '@tanstack/react-query',
        ],
    },
    server: {
        port: 5173,
        proxy: {
            '/trpc': 'http://localhost:3000'
        }
    }
});
