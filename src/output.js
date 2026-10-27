export function createOutput(output, error) {
  let chunks = [],
    frame = null;
  function flush() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (!chunks.length) return;
    const text = chunks.join('');
    chunks = [];
    output.append(document.createTextNode(text));
  }
  function showError(text) {
    flush();
    error.textContent = text;
    error.hidden = !text;
  }
  return {
    clear() {
      chunks = [];
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      output.textContent = '';
      showError('');
    },
    append(text) {
      chunks.push(text);
      if (frame === null) frame = requestAnimationFrame(flush);
    },
    flush,
    reveal() {
      flush();
      const container = output.closest('.console-body');
      container.scrollTop = container.scrollHeight;
    },
    error: showError,
  };
}
