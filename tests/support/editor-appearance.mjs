// A native CodeMirror caret must contrast with the app panel in the resolved
// mode. This catches a light-mode editor inside a dark app without depending on
// generated theme classes or an exact upstream colour literal.
export function waitForEditorTheme(page) {
  return page.waitForFunction(() => {
    const brightness = colour => colour.match(/\d+/g).slice(0, 3)
      .map(Number).reduce((sum, channel) => sum + channel, 0);
    const caret = brightness(getComputedStyle(document.querySelector('.cm-cursor')).borderLeftColor);
    const paper = brightness(getComputedStyle(document.querySelector('.cm-editor')).backgroundColor);
    return document.documentElement.dataset.theme === 'dark' ? caret > paper : caret < paper;
  });
}
