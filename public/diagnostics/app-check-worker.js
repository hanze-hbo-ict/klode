// Klode's app check for the diagnostics page: start the bundled Python runtime
// in a module worker and run one line of Python. The page sends
// { type: 'run', options } with URLs already resolved, and expects
// { ok, value, pass } or { ok: false, error } back.
self.onmessage = async ({ data }) => {
  try {
    const started = performance.now();
    const { loadPyodide } = await import(`${data.options.runtime}pyodide.mjs`);
    const python = await loadPyodide({
      indexURL: data.options.runtime,
      packages: [],
      stdout: () => {},
      stderr: () => {},
    });
    const loadedMs = Math.round(performance.now() - started);
    const answer = python.runPython('import sys\nf"{sys.version.split()[0]} {6 * 7}"');
    postMessage({ ok: true, pass: / 42$/.test(answer), value: { loadedMs, pyodide: python.version, python: answer } });
  } catch (error) {
    postMessage({ ok: false, error: `${error?.name ?? 'Error'}: ${error?.message ?? error}` });
  }
};
