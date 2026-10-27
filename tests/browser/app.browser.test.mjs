import { runtimePath, runtimeHashes } from '../../runtime-config.js';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { waitForPreview } from '../support/preview-ready.mjs';
import { waitForEditorTheme } from '../support/editor-appearance.mjs';
const port = 4275, origin = `http://127.0.0.1:${port}`;
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'pipe' });
let browser, negative;
const passed = [];
try {
  await waitForPreview(preview, `${origin}/`);
  browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/google/chrome/chrome', headless: true,
    args: process.getuid?.() === 0 ? ['--no-sandbox'] : [] });
  const context = await browser.newContext({ serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1280, height: 900 } });
  const requests = [], blocked = [], errors = [];
  context.on('request', (request) => requests.push(request.url()));
  await context.route('**/*', async (route) => {
    if (new URL(route.request().url()).origin !== origin) { blocked.push(route.request().url()); await route.abort(); return; }
    await route.continue();
  });
  const page = await context.newPage(); page.on('pageerror', (error) => errors.push(String(error)));
  const state = (value) => page.waitForFunction((v) => document.querySelector('#status').dataset.state === v, value, { timeout: 30000 });
  const editor = page.locator('.cm-content');
  // CodeMirror virtualises lines; inspect the actual source through native copy,
  // rather than assuming every line is currently represented in the DOM.
  async function source() {
    await editor.focus(); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('ControlOrMeta+c');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    await page.keyboard.press('ArrowRight'); return text;
  }
  async function theme(mode) {
    for (let step = 0; step < 3; step++) {
      if (await page.locator('#theme').getAttribute('data-theme-choice') === mode) {
        await waitForEditorTheme(page);
        return;
      }
      await page.locator('#theme').click();
    }
    assert.equal(await page.locator('#theme').getAttribute('data-theme-choice'), mode);
  }
  async function edit(text) {
    await page.locator('#editor').click({ position: { x: 80, y: 25 } }); await page.keyboard.press('ControlOrMeta+a');
    if (text) await page.keyboard.insertText(text); else await page.keyboard.press('Backspace');
    assert.equal(await source(), text);
  }
  async function run(text) { await edit(text); await page.locator('#run').click(); }
  async function answer(text) { await state('waiting-for-input'); await page.locator('#answer').fill(text); await page.locator('#answer').press('Enter'); }
  await page.goto(origin); await state('ready');
  const initialSource = await source();
  assert.equal(await page.locator('#stop').count(), 0);
  const actionWidth = (await page.locator('#run').boundingBox()).width;
  assert.equal(await page.locator('body').textContent().then((text) => /ans\.app|Runs in your browser|Python 3\.14|stays in this tab/.test(text)), false);
  assert.equal(await page.getByRole('link', { name: 'Klode on GitHub' }).getAttribute('href'), 'https://github.com/hanze-hbo-ict/klode');
  assert.equal(await page.evaluate(() => crossOriginIsolated), true);
  await edit('print(2 + 3)'); await page.getByRole('button', { name: 'Run code', exact: true }).focus();
  await page.keyboard.press('Space'); await state('ready');
  assert.equal(await page.locator('#output').textContent(), '5\n'); passed.push('run/edit');
  for (const [code, expected] of [['if :', /SyntaxError/], ['1 / 0', /ZeroDivisionError/]]) {
    await run(code); await state('ready'); assert.match(await page.locator('#error').textContent(), expected);
  }
  await run('print("corrected")'); await state('ready'); assert.equal(await page.locator('#error').isVisible(), false); passed.push('syntax/runtime error recovery');
  await run('naam = input("Jouw naam? ")\nprint("Hello", naam)');
  await state('waiting-for-input');
  assert.equal(await page.locator('#answer').evaluate((input) => input === document.activeElement), true);
  assert.equal(await page.locator('#submit').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Stop', exact: true }).isEnabled(), true);
  assert.equal((await page.locator('#run').boundingBox()).width, actionWidth);
  assert.equal(await page.getByRole('textbox', { name: 'Program input', exact: true }).count(), 1);
  assert.equal(await page.locator('#answer').evaluate((input) => { const css = getComputedStyle(input); return css.borderTopWidth === '0px' && css.borderBottomWidth === '0px' && css.outlineStyle === 'none' && css.backgroundColor === 'rgba(0, 0, 0, 0)'; }), true);
  assert.notEqual(await page.locator('.console-body').evaluate((body) => getComputedStyle(body).borderColor), 'rgba(0, 0, 0, 0)');
  await page.locator('#answer').fill('Misja'); await page.keyboard.press('Enter'); await state('ready');
  assert.equal(await page.locator('#output').textContent(), 'Jouw naam? Misja\nHello Misja\n');
  // A second submission after acceptance cannot echo or deliver the line twice.
  await page.locator('#input-form').evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })));
  assert.equal(await page.locator('#output').textContent(), 'Jouw naam? Misja\nHello Misja\n');
  assert.equal(await page.locator('#output').evaluate((output) => output.isContentEditable), false);
  await page.locator('#output').evaluate((output) => {
    const range = document.createRange(); range.selectNodeContents(output);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
  });
  await page.keyboard.press('ControlOrMeta+c');
  // Native DOM selection omits a terminal line break; transcript itself is exact above.
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'Jouw naam? Misja\nHello Misja');
  passed.push('exact name transcript; Enter, accepted-only echo and selectable readonly history');
  await run('first=input("First: ")\nsecond=input("Second: ")\nprint(repr(first), repr(second))');
  await state('waiting-for-input'); assert.equal(await page.locator('#output').textContent(), 'First: ');
  assert.equal(await page.getByRole('button', { name: 'Stop', exact: true }).isEnabled(), true);
  await theme('dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await answer(''); await answer('你好 🙂 café'); await state('ready');
  assert.equal(await page.locator('#output').textContent(), "First: \nSecond: 你好 🙂 café\n'' '你好 🙂 café'\n"); passed.push('ordered empty/Unicode input; responsive waiting UI');
  await run('print("Prompt", end="")\nx=input()\nprint(len(x))'); await state('waiting-for-input');
  assert.equal(await page.locator('#output').textContent(), 'Prompt');
  await answer('🙂'.repeat(16385)); assert.match(await page.locator('#error').textContent(), /65536/);
  assert.equal(await page.locator('#output').textContent(), 'Prompt');
  await answer('ok'); await state('ready'); assert.equal(await page.locator('#output').textContent(), 'Promptok\n2\n'); passed.push('no-newline prompt; oversize retry');
  for (const code of ['input("Wait: ")', 'while True:\n    pass', 'while True:\n    print("x")']) {
    await run(code); await state(code.startsWith('input') ? 'waiting-for-input' : 'running');
    if (code.includes('print')) await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'Stop', exact: true }).click({ timeout: 5000 }); await state('ready');
    assert.equal(await source(), code);
    await page.locator('#input-form').evaluate((form) => form.dispatchEvent(new Event('submit', { cancelable: true })));
    await run('print(5)'); await state('ready'); assert.equal(await page.locator('#output').textContent(), '5\n');
  }
  passed.push('Stop wait/loop/output flood, stale form and rerun preserves source');
  await run('input("Before edit: ")'); await state('waiting-for-input');
  const revised = 'print("edited during execution")'; await edit(revised);
  await theme('light'); assert.equal(await source(), revised);
  await page.getByRole('button', { name: 'Stop', exact: true }).click(); await state('ready'); assert.equal(await source(), revised);
  await run('input("Continue: ")'); await state('waiting-for-input');
  await edit(revised); await answer('continue'); await state('ready'); assert.equal(await source(), revised);
  await run('input("Fail: ")\n1/0'); await state('waiting-for-input');
  await edit(revised); await answer('fail'); await state('ready'); assert.equal(await source(), revised);
  assert.match(await page.locator('#error').textContent(), /ZeroDivisionError/);
  passed.push('edits during active execution survive theme, Stop, completion and failure');
  await run('for i in range(10000):\n    print(i)'); await state('ready');
  assert.equal(await page.locator('#output').textContent(), Array.from({ length: 10000 }, (_, i) => `${i}\n`).join(''));
  await run('import sys\nfor i in range(100):\n    print("out", end="", flush=True)\n    print("err", end="", file=sys.stderr, flush=True)'); await state('ready');
  assert.equal(await page.locator('#output').textContent(), 'outerr'.repeat(100));
  await run('print("tail", end="")'); await state('ready');
  assert.equal(await page.locator('#output').textContent(), 'tail');
  await run('for i in range(1000):\n    print(i)\ninput("Last prompt: ")'); await state('waiting-for-input');
  assert.equal(await page.locator('.console-body').evaluate((output) => output.scrollHeight - output.scrollTop - output.clientHeight <= 2), true);
  assert.ok((await page.locator('#output').textContent()).endsWith('Last prompt: '));
  await answer(''); await state('ready');
  passed.push('batched finite output preserves every line, flushed stream order, final tail and visible prompt after long output');
  await run('x=42'); await state('ready'); await run('print(x)'); await state('ready');
  assert.match(await page.locator('#error').textContent(), /NameError/); passed.push('fresh namespaces');
  await run('import math\nprint(math.sqrt(25))\nimport definitely_unavailable_klode_module'); await state('ready');
  assert.equal(await page.locator('#output').textContent(), '5.0\n'); assert.match(await page.locator('#error').textContent(), /ModuleNotFoundError/);
  await run('print("<img src=x onerror=alert(1)>")'); await state('ready');
  assert.equal(await page.locator('#output img').count(), 0); passed.push('supported/unavailable imports; safe output');
  const multiline = 'def greet():\n    print("你好🙂")\n\ngreet()\n';
  await edit(multiline); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('ControlOrMeta+c');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), multiline); passed.push('native multiline clipboard');
  // A previous app version may have left source in storage. Never read or overwrite it.
  await page.evaluate(() => { sessionStorage.setItem('klode.source.v1', 'old source'); localStorage.setItem('klode.source.v1', 'old local source'); });
  for (const text of [multiline, '']) {
    await edit(text); await page.reload(); await state('ready');
    assert.equal(await source(), initialSource);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('klode.source.v1')), 'old source');
    assert.equal(await page.evaluate(() => localStorage.getItem('klode.source.v1')), 'old local source');
    assert.equal(await page.locator('#storage-warning').count(), 0);
  }
  passed.push('reload initialises default source; old storage ignored and never written');
  await edit('if True:'); await page.keyboard.press('End'); await page.keyboard.press('Enter');
  assert.equal(await source(), 'if True:\n    ');
  assert.ok(await page.locator('.cm-line span').count() > 0);
  await page.keyboard.insertText('pri'); await page.waitForTimeout(300);
  await page.keyboard.press('Control+Space');
  assert.equal(await page.locator('.cm-tooltip-autocomplete').count(), 0); passed.push('syntax, automatic indentation, no completion');
  const retained = await source();
  for (const [width, height] of [[1280, 720], [360, 640]]) {
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    for (const mode of ['system', 'light', 'dark']) {
      await theme(mode);
      if (mode !== 'system') assert.equal(await page.locator('html').getAttribute('data-theme'), mode);
      assert.equal(await page.locator('#theme').getAttribute('data-theme-choice'), mode);
      assert.equal(await page.locator('[data-theme-choice]').count(), 1);
      assert.match(await page.locator('#theme').getAttribute('aria-label'), new RegExp(mode, 'i'));
      assert.equal(await page.locator('#theme svg:visible').count(), 1);
    }
    for (const id of ['run', 'console-title']) await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  }
  await theme('system'); await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark'); await waitForEditorTheme(page);
  await page.emulateMedia({ colorScheme: 'light' }); await page.waitForFunction(() => document.documentElement.dataset.theme === 'light'); await waitForEditorTheme(page);
  assert.equal(await source(), retained); passed.push('360/1280 layout and live system/manual themes preserve source');
  for (const [width, height] of [[1280, 720], [360, 640]]) {
    await page.setViewportSize({ width, height }); await page.evaluate(() => window.scrollTo(0, 0));
    const runBox = await page.locator('#run').boundingBox();
    const editorBox = await page.locator('#editor').boundingBox();
    const payoff = await page.getByText('One file. One idea at a time.', { exact: true }).boundingBox();
    const workspace = await page.locator('.workspace').boundingBox();
    assert.ok(payoff.y >= editorBox.y + editorBox.height && payoff.y >= workspace.y + workspace.height, 'payoff below workspace');
    assert.ok(runBox.y >= 0 && runBox.y + runBox.height < height && runBox.y < editorBox.y, 'Run above editor and visible');
    for (const mode of ['light', 'dark']) {
      await theme(mode);
      await run('for i in range(1000):\n    print(i)\nx=input("Your answer: ")\nprint(repr(x))');
      await state('waiting-for-input');
      const answerBox = await page.locator('#answer').boundingBox();
      assert.ok(answerBox.y >= 0 && answerBox.y + answerBox.height <= height, 'pending input in viewport');
      assert.equal(await page.evaluate(() => window.scrollY), 0, 'focus only scrolls console');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('#answer').fill('<b>safe</b>'); await page.keyboard.press('Enter'); await state('ready');
      assert.equal(await page.locator('#output b').count(), 0);
      assert.ok((await page.locator('#output').textContent()).endsWith("Your answer: <b>safe</b>\n'<b>safe</b>'\n"));
    }
    await run('input("P" * 500)'); await state('waiting-for-input');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await answer('long prompt'); await state('ready');
    const longCode = '# a longer source line\n'.repeat(250) + 'print(1)';
    await page.locator('#editor').click({ position: { x: 80, y: 25 } }); await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.insertText(longCode);
    await page.keyboard.press('ControlOrMeta+a'); await page.keyboard.press('ControlOrMeta+c');
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), longCode);
    assert.equal(await page.locator('.cm-scroller').evaluate((node) => node.scrollHeight > node.clientHeight), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
  await theme('system'); await page.locator('#theme').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#theme').getAttribute('data-theme-choice'), 'light');
  await page.keyboard.press('Space'); assert.equal(await page.locator('#theme').getAttribute('data-theme-choice'), 'dark');
  await page.keyboard.press('Space'); assert.equal(await page.locator('#theme').getAttribute('data-theme-choice'), 'system');
  await theme('light');
  await page.emulateMedia({ colorScheme: 'dark' }); assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  passed.push('upper controls, console-local focus and long content at 1280x720/360x640 in both themes; keyboard theme override');
  const storagePage = await context.newPage();
  await storagePage.addInitScript(() => { window.storageReads = 0; for (const name of ['sessionStorage', 'localStorage']) Object.defineProperty(window, name, { get() { window.storageReads++; throw new DOMException('Blocked', 'SecurityError'); } }); });
  await storagePage.goto(origin); await storagePage.waitForFunction(() => document.querySelector('#status').dataset.state === 'ready');
  assert.equal(await storagePage.locator('#storage-warning').count(), 0);
  await storagePage.locator('.cm-content').click(); await storagePage.keyboard.press('ControlOrMeta+a'); await storagePage.keyboard.insertText('print(8)');
  await storagePage.locator('#run').click(); await storagePage.waitForFunction(() => document.querySelector('#output').textContent === '8\n');
  assert.equal(await storagePage.evaluate(() => window.storageReads), 0);
  passed.push('blocked storage needs no warning; editing/execution work without storage access');
  assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
  for (const file of Object.keys(runtimeHashes)) {
    assert.ok(requests.includes(`${origin}${runtimePath}${file}`), `Missing runtime request ${file}`);
  }
  passed.push('cold context same-origin worker/runtime audit');
  await run('input("Keyboard stop: ")'); await state('waiting-for-input');
  await page.getByRole('button', { name: 'Stop', exact: true }).focus(); await page.keyboard.press('Space');
  await state('ready'); assert.equal(await page.getByRole('button', { name: 'Run code', exact: true }).isEnabled(), true);
  passed.push('one stable execution button with keyboard Run/Stop and immediate Stop during input');
  const retryContext = await browser.newContext();
  let failWorker = true;
  await retryContext.route('**/assets/worker-*.js', async (route) => {
    if (failWorker) { failWorker = false; await route.abort(); } else await route.continue();
  });
  const retryPage = await retryContext.newPage(); await retryPage.goto(origin);
  await retryPage.waitForFunction(() => document.querySelector('#status').dataset.state === 'failed');
  assert.equal(await retryPage.getByRole('button', { name: 'Retry', exact: true }).isEnabled(), true);
  await retryPage.locator('.cm-content').focus(); await retryPage.keyboard.press('ControlOrMeta+a'); await retryPage.keyboard.insertText('print("retry preserved source")');
  await retryPage.getByRole('button', { name: 'Retry', exact: true }).click();
  await retryPage.waitForFunction(() => document.querySelector('#status').dataset.state === 'ready');
  await retryPage.getByRole('button', { name: 'Run code', exact: true }).click();
  await retryPage.waitForFunction(() => document.querySelector('#output').textContent === 'retry preserved source\n');
  assert.equal(await retryPage.getByRole('button', { name: 'Run code', exact: true }).isEnabled(), true);
  await retryContext.close(); passed.push('failed worker offers Retry, recovers runtime and preserves edited source');
  const html = (await readFile('dist/index.html', 'utf8')).replaceAll('src="/assets/', `src="${origin}/assets/`).replaceAll('href="/assets/', `href="${origin}/assets/`);
  negative = createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
  await new Promise((resolve) => negative.listen(4276, '127.0.0.1', resolve));
  const negativePage = await browser.newPage(); await negativePage.goto('http://127.0.0.1:4276');
  await negativePage.waitForFunction(() => document.querySelector('#status').dataset.state === 'failed');
  assert.match(await negativePage.locator('#error').textContent(), /provided secure link/); assert.equal(await negativePage.getByRole('button', { name: 'Retry', exact: true }).isEnabled(), true); passed.push('missing isolation capability failure');
  console.log(JSON.stringify({ result: 'pass', browser: browser.version(), cases: passed, requests: [...new Set(requests)] }, null, 2));
} finally {
  await browser?.close(); if (negative) await new Promise((resolve) => negative.close(resolve)); preview.kill();
}
