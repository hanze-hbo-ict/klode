import { defineConfig } from 'vite';
import { runtimePath } from './runtime-config.js';
const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};
export default defineConfig({
  define: { __KLODE_RUNTIME_PATH__: JSON.stringify(runtimePath) },
  server: { headers, strictPort: true },
  preview: { headers, strictPort: true },
});
