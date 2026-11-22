import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { runtimePath } from './runtime-config.js';

// public/_headers is the only source of the response headers: Cloudflare Pages
// applies it in production, and dev/preview send its /* rule.
function allPathHeaders() {
  const headers = {};
  let path;
  for (const line of readFileSync(new URL('./public/_headers', import.meta.url), 'utf8').split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) path = line.trim();
    else if (path === '/*') {
      const [name, ...value] = line.trim().split(':');
      headers[name.trim()] = value.join(':').trim();
    }
  }
  return headers;
}
const headers = allPathHeaders();
export default defineConfig({
  define: { __KLODE_RUNTIME_PATH__: JSON.stringify(runtimePath) },
  server: { headers, strictPort: true },
  preview: { headers, strictPort: true },
});
