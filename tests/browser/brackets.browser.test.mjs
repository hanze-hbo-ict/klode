import assert from 'node:assert/strict';
import { withBrowser } from '../support/browser-test.mjs';
import { waitForEditorTheme } from '../support/editor-appearance.mjs';

const passed = [];
await withBrowser(async ({ browser, origin }) => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  await page.goto(origin);
  const editor = page.locator('.cm-content');
  const keyboard = page.keyboard;
  async function setSource(text) {
    await editor.focus(); await keyboard.press('ControlOrMeta+a');
    if (text) await keyboard.insertText(text); else await keyboard.press('Backspace');
  }
  async function source() {
    await keyboard.press('ControlOrMeta+a'); await keyboard.press('ControlOrMeta+c');
    const text = await page.evaluate(() => navigator.clipboard.readText());
    await keyboard.press('ArrowRight');
    return text;
  }
  for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
    await setSource(''); await keyboard.type(open);
    // Type content before inspecting the document: proves the caret was inside.
    await keyboard.type('x'); await keyboard.type(close);
    assert.equal(await source(), `${open}x${close}`);
    await setSource(''); await keyboard.type(open); await keyboard.press('Backspace');
    assert.equal(await source(), '');
  }
  passed.push('three bracket types: real typing, inner caret, closer skip and empty-pair Backspace');
  await setSource(''); await keyboard.type('([{x}])');
  assert.equal(await source(), '([{x}])');
  passed.push('nested pairs and exact native copy');
  await setSource(''); await page.waitForTimeout(600);
  await keyboard.type('('); await keyboard.press('ControlOrMeta+z');
  assert.equal(await source(), '');
  await keyboard.press('ControlOrMeta+y'); assert.equal(await source(), '()');
  passed.push('undo and redo treat bracket insertion as one edit');
  for (const prefix of ['# comment ', 'text = "inside ', "text = 'inside ", 'text = """inside ', 'text = f"inside ']) {
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      await setSource(prefix); await keyboard.type(open);
      assert.equal(await source(), prefix + open + close);
    }
  }
  for (const quote of ["'", '"']) {
    await setSource(''); await keyboard.type(quote + 'text' + quote);
    assert.equal(await source(), quote + 'text' + quote);
    await setSource(''); await keyboard.type(quote); await keyboard.press('Backspace');
    assert.equal(await source(), '');
    await setSource(''); // CodeMirror skips the entire generated triple closer on one quote key.
    await keyboard.type(quote.repeat(3) + 'text' + quote);
    assert.equal(await source(), quote.repeat(3) + 'text' + quote.repeat(3));
    await setSource('# comment '); await keyboard.type(quote); assert.equal(await source(), '# comment ' + quote.repeat(2));
  }
  for (const prefix of ['f', 'r', 'b', 'fr']) {
    await setSource(prefix); await keyboard.type('"text"'); assert.equal(await source(), prefix + '"text"');
  }
  await setSource(''); await keyboard.type(`"don't"`); assert.equal(await source(), `"don't"`);
  await setSource(''); await keyboard.type("'say \"hello\"'"); assert.equal(await source(), "'say \"hello\"'");
  await setSource(''); await keyboard.type("\"say \\\"hello\\\"\"");
  assert.equal(await source(), "\"say \\\"hello\\\"\"");
  await setSource('text = "inside "'); await keyboard.press('ArrowLeft');
  await keyboard.type('('); assert.equal(await source(), 'text = "inside ("');
  await setSource('text = f"{value}"'); await keyboard.press('ArrowLeft'); await keyboard.press('ArrowLeft');
  await keyboard.type('('); assert.equal(await source(), 'text = f"{value()}"');
  await setSource('value = "done"'); await keyboard.type('(');
  assert.equal(await source(), 'value = "done"()');
  await setSource('text = f"value  rest"'); await keyboard.press('Home');
  for (let i = 0; i < 'text = f"value '.length; i++) await keyboard.press('ArrowRight');
  await keyboard.type('{');
  assert.equal(await source(), 'text = f"value {} rest"');
  passed.push('native contextual pairing in comments/unfinished strings/f-string replacement starts; quote/prefix/triple help and code after strings');
  for (const mode of ['light', 'dark']) {
    for (let i = 0; i < 3 && await page.locator('#theme').getAttribute('data-theme-choice') !== mode; i++) await page.locator('#theme').click();
    await setSource('(x)'); await keyboard.press('ArrowLeft');
    await page.waitForFunction(() => document.querySelectorAll('.cm-matchingBracket').length === 2);
    assert.deepEqual(await page.locator('.cm-matchingBracket').allTextContents(), ['(', ')']);
    const match = await page.locator('.cm-matchingBracket').first().evaluate((node) => {
      const css = getComputedStyle(node); return { outline: css.outlineStyle, width: css.outlineWidth, background: css.backgroundColor, text: css.color };
    });
    assert.equal(match.outline, 'solid'); assert.equal(match.width, '1px'); assert.notEqual(match.background, match.text);
    await setSource('(x]'); await keyboard.press('ArrowLeft');
    await page.waitForFunction(() => document.querySelectorAll('.cm-nonmatchingBracket').length > 0);
    const mismatch = await page.locator('.cm-nonmatchingBracket').first().evaluate((node) => {
      const css = getComputedStyle(node); return { outline: css.outlineStyle, decoration: css.textDecorationStyle, background: css.backgroundColor, text: css.color };
    });
    assert.equal(mismatch.outline, 'solid'); assert.equal(mismatch.decoration, 'wavy'); assert.notEqual(mismatch.background, mismatch.text);
  }
  passed.push('matching and mismatching indications in both themes, with visible outline and mismatch underline');
  const originalEditor = await editor.elementHandle();
  await setSource('value = 42'); await page.waitForTimeout(600);
  await keyboard.press('End'); await keyboard.type(' # note'); await keyboard.press('Home');
  for (let i = 0; i < 5; i++) await keyboard.press('Shift+ArrowRight');
  for (let i = 0; i < 3; i++) {
    await page.locator('#theme').click();
    await waitForEditorTheme(page);
  }
  await editor.focus(); await keyboard.press('ControlOrMeta+c');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'value');
  assert.equal(await originalEditor.evaluate(node => node === document.querySelector('.cm-content')), true);
  await keyboard.press('ControlOrMeta+z'); assert.equal(await source(), 'value = 42');
  await keyboard.press('ControlOrMeta+y'); assert.equal(await source(), 'value = 42 # note');
  passed.push('native editor theme follows app mode without replacing editor, selection or undo history');
  await page.waitForFunction(() => document.querySelector('#status').dataset.state === 'ready');
  const broken = 'if True:\nprint("hallo")';
  const fixed = 'if True:\n    print("hallo")';
  await setSource(broken); await keyboard.press('Home'); await page.waitForTimeout(600);
  await keyboard.press('Tab');
  assert.equal(await editor.evaluate((node) => node === document.activeElement), true);
  assert.equal(await source(), fixed);
  await keyboard.press('ControlOrMeta+z'); assert.equal(await source(), broken);
  await keyboard.press('ControlOrMeta+y'); assert.equal(await source(), fixed);
  await page.locator('#run').click();
  await page.waitForFunction(() => document.querySelector('#output').textContent === 'hallo\n');
  await editor.focus(); await keyboard.press('Home'); await keyboard.press('Shift+Tab');
  assert.equal(await editor.evaluate((node) => node === document.activeElement), true);
  assert.equal(await source(), broken);
  await setSource('print(1)\nprint(2)'); await keyboard.press('ControlOrMeta+a');
  await keyboard.press('Tab');
  assert.equal(await editor.innerText(), '    print(1)\n    print(2)');
  await keyboard.press('Shift+Tab'); assert.equal(await source(), 'print(1)\nprint(2)');
  await keyboard.press('Escape'); await keyboard.press('Tab');
  assert.equal(await page.locator('#output').evaluate((node) => node === document.activeElement), true);
  // Refocus, then another editing key cancels the temporary escape mode.
  await editor.focus(); await keyboard.press('ArrowLeft'); await keyboard.press('Tab');
  assert.equal(await editor.evaluate((node) => node === document.activeElement), true);
  await keyboard.press('Escape'); await keyboard.press('Shift+Tab');
  assert.equal(await page.locator('#run').evaluate((node) => node === document.activeElement), true);
  await keyboard.press('Shift+Tab');
  assert.equal(await page.locator('#theme').evaluate((node) => node === document.activeElement), true);
  await editor.focus(); await keyboard.press('Escape'); await page.waitForTimeout(2100);
  await keyboard.press('Tab');
  assert.equal(await editor.evaluate((node) => node === document.activeElement), true);
  assert.equal(await page.locator('#editor-keys').count(), 0);
  for (const width of [360, 1280]) for (const mode of ['light', 'dark']) {
    await page.setViewportSize({ width, height: 640 });
    for (let i = 0; i < 3 && await page.locator('#theme').getAttribute('data-theme-choice') !== mode; i++) await page.locator('#theme').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `/tmp/klode-tab-${width}-${mode}.png`, fullPage: true });
  }
  passed.push('Tab/Shift+Tab correct and run the reported example, selection indentation, undo/redo/copy; temporary Escape navigation to console/Run/theme without a visible keyboard hint');
  await setSource('pri'); await keyboard.type('n'); await keyboard.press('Control+Space');
  assert.equal(await page.locator('.cm-tooltip-autocomplete').count(), 0);
  await keyboard.press('Escape'); await keyboard.press('Tab'); assert.equal(await editor.evaluate((node) => node === document.activeElement), false);
  assert.equal(await page.getByText('No code completion or AI assistance', { exact: true }).count(), 1);
  passed.push('no completion popup; Escape then Tab navigates focus; footer retained');
  console.log(JSON.stringify({ result: 'pass', browser: browser.version(), cases: passed }, null, 2));
});
