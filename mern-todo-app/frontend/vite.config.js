// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // --- Add optimizeDeps to exclude date-fns ---
  // Tells Vite NOT to pre-bundle/optimize the 'date-fns' package.
  // This forces Vite to use the native module resolution for date-fns.
  optimizeDeps: {
    exclude: ['date-fns'],
  },
  // --- End exclude date-fns ---


  // Optional: Configure the server port if it's not the default 5173
  server: {
     port: 5173, // Ensure this matches the port your frontend runs on
     // Optional: Add a proxy here if your backend is on a different origin (protocol, host, or port)
     // This is often necessary to avoid CORS issues for API calls.
     // proxy: {
     //   '/api': { // Any request starting with /api will be proxied
     //     target: 'http://localhost:5000', // Your backend URL (replace 5000 if different)
     //     changeOrigin: true, // Changes the origin header to the target URL
     //     rewrite: (path) => path.replace(/^\/api/, ''), // Removes the /api prefix when forwarding to backend
     //   },
     // },
  },
});