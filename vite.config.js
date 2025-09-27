import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "src": path.resolve(__dirname, "./src")
    },
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    dedupe: ['react', 'react-dom', 'lucide-react'] // Prevent duplicate packages
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true, // Better handling for mixed modules
      include: [/node_modules/]
    },
    minify: 'esbuild',
    rollupOptions: {
      external: [
        '@fontsource/ibm-plex-mono/400.css',
      ],
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return; // Suppress use strict warnings
        }
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return; // Suppress circular dependency warnings
        }
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts',
      'tailwind-merge',
      'class-variance-authority',
      '@radix-ui/react-dialog',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-slot',
      'firebase/auth',
      'firebase/firestore'
    ],
    force: true, // Force optimization to ensure proper bundling
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      jsx: 'automatic'
    }
  }
});