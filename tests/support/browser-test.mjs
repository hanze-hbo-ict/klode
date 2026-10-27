import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { chromium } from 'playwright-core';
import { waitForPreview } from './preview-ready.mjs';

export async function withBrowser(run, { port = 4275 } = {}) {
  const host = '127.0.0.1';
  const origin = `http://${host}:${port}`;
  // Do not mistake an unrelated server's HTTP response for our preview.
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(port, host, resolve);
  });
  await new Promise((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));

  const preview = spawn(process.execPath, [
    'node_modules/vite/bin/vite.js', 'preview', '--host', host,
    '--port', String(port), '--strictPort',
  ], { stdio: 'pipe' });
  let browser;
  try {
    await waitForPreview(preview, `${origin}/`);
    browser = await chromium.launch({
      executablePath: process.env.CHROME_BIN || '/opt/google/chrome/chrome',
      headless: true,
      args: process.getuid?.() === 0 ? ['--no-sandbox'] : [],
    });
    return await run({ browser, origin });
  } finally {
    try {
      await browser?.close();
    } finally {
      if (preview.pid && preview.exitCode === null && preview.signalCode === null) {
        const exited = once(preview, 'exit');
        const force = setTimeout(() => preview.kill('SIGKILL'), 3000);
        try {
          preview.kill();
          await exited;
        } finally {
          clearTimeout(force);
        }
      }
    }
  }
}
