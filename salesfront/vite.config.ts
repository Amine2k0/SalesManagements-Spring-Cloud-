import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type ProxyOptions } from 'vite'

// The app calls the API on its own origin (/api/...) and the dev server forwards those
// requests to the Spring Cloud Gateway, so the browser never makes a cross-origin call.
// Port 4200 is also the origin the gateway's CORS default allows, for builds that point
// VITE_API_URL straight at the gateway.
const gateway = process.env.GATEWAY_URL ?? 'http://localhost:8989'

// Proxied calls are same-origin for the browser, so drop the Origin header: otherwise the
// gateway runs its CORS check against whatever host the app was opened on (127.0.0.1,
// a LAN address) and rejects every POST that is not from exactly http://localhost:4200.
const api: ProxyOptions = {
  target: gateway,
  changeOrigin: true,
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4200,
    strictPort: true,
    proxy: { '/api': api },
  },
  preview: {
    port: 4200,
    proxy: { '/api': api },
  },
})
