import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
import { waitForPreview } from '../support/preview-ready.mjs';
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4275'], { stdio: 'pipe' });
let browser;
const passed = [];
try {
  await waitForPreview(preview, 'http://127.0.0.1:4275/');
  browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/google/chrome/chrome', headless: true,
    args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] });
  const page = await browser.newPage({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:4275/');
  const editor = page.locator('.cm-content');
  const code = 'value = "hello" if True else ""   # note\nnumber = 42               \nprint(value)              \n# outside                 ';
  async function select(kind) {
    await editor.focus(); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.insertText(code);
    await page.keyboard.press('ControlOrMeta+Home');
    if (kind === 'all') await page.keyboard.press('ControlOrMeta+a');
    else if (kind === 'multiline') {
      await page.keyboard.press('Shift+ArrowDown'); await page.keyboard.press('Shift+ArrowDown'); await page.keyboard.press('Shift+End');
    } else {
      for (let i = 0; i < 22; i++) await page.keyboard.press('Shift+ArrowRight');
    }
    await page.waitForFunction(() => document.querySelectorAll('.cm-selectionBackground').length > 0);
  }
  // Inspect the rendered PNG, not just CSS: an opaque active-line decoration can
  // completely hide a correctly coloured selection layer drawn underneath it.
  async function selectionPixels() {
    const selected = await page.locator('.cm-selectionBackground').last().boundingBox();
    const line = await page.locator('.cm-activeLine').boundingBox();
    const points = [{ x: selected.x + selected.width - 7, y: selected.y + 1 }, { x: line.x + line.width - 12, y: selected.y + 1 }];
    const png = await page.screenshot();
    return page.evaluate(async ({ data, points }) => {
      const image = new Image(); image.src = data; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      return points.map(({ x, y }) => [...ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data].slice(0, 3));
    }, { data: `data:image/png;base64,${png.toString('base64')}`, points });
  }
  for (const mode of ['light', 'dark']) {
    // Exercise the actual theme control rather than changing CodeMirror's DOM.
    for (let i = 0; i < 3 && await page.locator('#theme').getAttribute('data-theme-choice') !== mode; i++) await page.locator('#theme').click();
    for (const kind of ['partial', 'multiline', 'all']) {
      await select(kind);
      for (const focused of [true, false]) {
        if (!focused) await page.locator('#theme').focus();
        const [selected, rest] = await selectionPixels();
        assert.ok(selected.reduce((sum, value, i) => sum + Math.abs(value - rest[i]), 0) > 40,
          `Rendered selection must differ from its active row: ${mode}/${kind}/focused=${focused}, ${selected} vs ${rest}`);
      }
      passed.push(`${mode} ${kind} rendered selection remains visible when focused and blurred`);
    }
    await editor.focus(); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('ControlOrMeta+c');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), code);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ControlOrMeta+Home');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Home'); for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight');
    const bracketFill = await page.locator('.cm-matchingBracket').first().evaluate(n => getComputedStyle(n).backgroundColor);
    assert.match(bracketFill, /^rgba\(/, 'Keep CodeMirror’s translucent bracket cue');
    await page.keyboard.press('Shift+ArrowRight');
    assert.equal(await page.locator('.cm-matchingBracket').count(), 0, 'Bracket cue must not masquerade as a nonempty selection');
    await select('multiline');
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 720 });
      await page.screenshot({ path: `/tmp/klode-selection-${width}-${mode}.png`, fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
  }
  console.log(JSON.stringify({ result: 'pass', browser: browser.version(), cases: passed }, null, 2));
} finally { await browser?.close(); preview.kill(); }
