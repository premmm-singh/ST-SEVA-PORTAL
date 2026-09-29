import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const handleProxyError = (proxy, _options) => {
  proxy.on('error', (err, req, res) => {
    if (res && !res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        detail: 'FastAPI Backend service on port 8000 is unavailable or starting up.',
        error: err.code
      }));
    }
  });
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: handleProxyError
      },
      '/chat': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: handleProxyError
      }
    }
  }
})
