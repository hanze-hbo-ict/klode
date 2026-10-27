export function createInput(form, answer, onSubmit) {
  let pending = null;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!pending) return;
    // Capture the request identity before submission, never reuse a stale form.
    const line = answer.value;
    if (onSubmit(pending, line)) {
      pending = null;
      form.hidden = true;
    }
  });
  const resize = () => {
    answer.style.width = `${Math.max(8, answer.value.length + 1)}ch`;
  };
  answer.addEventListener('input', resize);
  return {
    request(identity) {
      pending = identity;
      answer.value = '';
      form.hidden = false;
      resize();
      answer.focus({ preventScroll: true });
      const consoleBody = form.closest('.console-body');
      consoleBody.scrollTop = consoleBody.scrollHeight;
    },
    clear() {
      pending = null;
      answer.value = '';
      form.hidden = true;
    },
  };
}
