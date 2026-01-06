import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Polyfill node modules for browser
      "node-fetch": "isomorphic-fetch",
    },
  },
  optimizeDeps: {
    exclude: ['pyodide', '@duckdb/duckdb-wasm', 'webr'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['node-fetch', 'fs', 'path', 'crypto', 'stream'],
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI Components
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-slot',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
          ],
          // Charts & Visualization
          'vendor-charts': ['recharts', 'lucide-react'],
          // Monaco Editor (large)
          'vendor-monaco': ['@monaco-editor/react'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Tanstack Query
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'global': 'globalThis'
  }
}));
