import assert from 'node:assert/strict';
import { withBrowser } from '../support/browser-test.mjs';
// The local preview sends Klode's isolation headers on every path, so every
// check passes here except the comparison pages' header expectations. Live
// variant headers are verified after deployment (docs/hosting.md).
const finished = (page) => page.waitForSelector('html[data-done="true"]', { timeout: 150000 });
const read = async (page) => JSON.parse(await page.locator('#report').inputValue());

await withBrowser(async ({ browser, origin }) => {
  const page = await browser.newPage({ permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true });
  await page.goto(`${origin}/diagnostics/`);
  await finished(page);
  const single = await read(page);
  assert.deepEqual(Object.keys(single.variants), ['app']);
  const { results } = single.variants.app;
  const failed = Object.entries(results).filter(([, entry]) => entry.status === 'fail');
  assert.deepEqual(failed, [], 'Every check passes in an isolated Chromium window');
  assert.equal(results.serviceWorker.value.syncRequestFromWorker.body, 'intercepted:worker');
  assert.equal(results.appCheck.value.python.endsWith(' 42'), true);
  assert.equal(results.serviceWorker.value.unregistered, true);
  assert.deepEqual(await page.locator('.summary td').allTextContents(), Array(8).fill('yes'));
  await page.getByRole('button', { name: 'Copy results' }).click();
  assert.equal(JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).app, 'Klode');

  // Run all variants in this tab; the last page shows the combined report.
  await page.getByRole('button', { name: 'Run all variants' }).click();
  await page.waitForURL(`${origin}/diagnostics/no-isolation/`, { timeout: 150000 });
  await finished(page);
  const combined = await read(page);
  assert.deepEqual(Object.keys(combined.variants), ['app', 'credentialless', 'no-isolation']);
  assert.equal(combined.variants['no-isolation'].results.pageHeaders.status, 'fail', 'Preview headers differ from no-isolation');
  assert.equal(await page.locator('.summary thead th').count(), 4);
  assert.equal(await page.evaluate(() => localStorage.getItem('klode-diagnostics-run')), null);

  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download report' }).click(),
  ]);
  assert.match(file.suggestedFilename(), /^klode-diagnostics-all-.*\.json$/);
  const saved = JSON.parse(await new Response(await file.createReadStream()).text());
  assert.deepEqual(Object.keys(saved.variants), ['app', 'credentialless', 'no-isolation']);
}, { port: 4276 });
console.log('Diagnostics browser test: OK');
