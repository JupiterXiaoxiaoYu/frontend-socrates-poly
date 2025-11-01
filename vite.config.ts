import react from "@vitejs/plugin-react-swc";
import path from 'path'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      include: ['crypto', 'stream', 'buffer', 'process', 'util']
    })
  ],
  resolve: {
    alias: {
      // Allow importing source files from parent directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // Allow external connections (useful for WSL)
    port: 5173, // Specify port
    watch: {
      usePolling: true,
      interval: 1000, // Poll every 1 second
      ignored: ['**/node_modules/**', '**/.git/**'] // Ignore large directories
    },
    fs: {
      strict: false // Allow serving files from project root
    }
  },
  define: {
    global: 'globalThis',
  },
  envPrefix: ['VITE_', 'REACT_APP_'], // Support REACT_APP environment variables
  build: {
    // // Disable code minification
    // minify: false,
    // // Disable code splitting, bundle all code into single file
    // rollupOptions: {
    //   output: {
    //     manualChunks: undefined,
    //     // Ensure all JS files have readable names
    //     entryFileNames: 'assets/[name].js',
    //     chunkFileNames: 'assets/[name].js',
    //     assetFileNames: 'assets/[name].[ext]'
    //   }
    // },
    // // Generate source map for debugging
    // sourcemap: true
  }
}) 