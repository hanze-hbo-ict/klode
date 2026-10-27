import {
  views,
  STATE,
  RUN,
  REQUEST,
  LENGTH,
  WAITING,
  ANSWER,
  CAPACITY,
  stdinLine,
} from './input-mailbox.js';
let python,
  mailbox,
  runId = 0,
  requestId = 0;
let queuedOutput = [],
  lastFlush = 0,
  queuedSize = 0,
  outputSignal,
  outputId = 0;
function flushOutput() {
  if (!queuedOutput.length) return;
  // Preserve stream ordering while bounding synchronous Python's message rate.
  const flushing = queuedOutput;
  queuedOutput = [];
  queuedSize = 0;
  for (const chunk of flushing) {
    const text = chunk.parts.join('');
    for (let offset = 0; offset < text.length; ) {
      let end = Math.min(offset + 8192, text.length);
      if (end < text.length && /[\uD800-\uDBFF]/u.test(text[end - 1])) end -= 1;
      const id = ++outputId;
      send('output', {
        channel: chunk.channel,
        text: text.slice(offset, end),
        outputId: id,
      });
      // Backpressure bounds UI work without discarding any program output.
      if (outputSignal) {
        let acknowledged;
        while ((acknowledged = Atomics.load(outputSignal, 0)) !== id)
          Atomics.wait(outputSignal, 0, acknowledged);
      }
      offset = end;
    }
  }
  lastFlush = performance.now();
}
function queueOutput(channel, text) {
  const tail = queuedOutput.at(-1);
  if (tail?.channel === channel) tail.parts.push(text);
  else queuedOutput.push({ channel, parts: [text] });
  queuedSize += text.length;
  if (queuedSize >= 8192 || performance.now() - lastFlush >= 50) flushOutput();
}
const send = (type, fields = {}) => postMessage({ type, runId, ...fields });
function readLine() {
  flushOutput();
  const { control } = views(mailbox);
  requestId += 1;
  Atomics.store(control, RUN, runId);
  Atomics.store(control, REQUEST, requestId);
  Atomics.store(control, LENGTH, 0);
  Atomics.store(control, STATE, WAITING);
  send('input-request', { requestId });
  while (Atomics.load(control, STATE) === WAITING)
    Atomics.wait(control, STATE, WAITING);
  const length = Atomics.load(control, LENGTH);
  if (
    Atomics.load(control, STATE) !== ANSWER ||
    Atomics.load(control, RUN) !== runId ||
    Atomics.load(control, REQUEST) !== requestId ||
    length < 0 ||
    length > CAPACITY
  )
    throw new Error('Invalid input mailbox');
  // Return an explicit newline even for empty answers.
  return stdinLine(mailbox);
}
function flushPythonStreams() {
  // Python may buffer writes without a newline. Flush them at execution end.
  try {
    python?.runPython(
      "__import__('sys').stdout.flush(); __import__('sys').stderr.flush()",
    );
  } catch {
    /* Preserve the original program failure if a stream was replaced/closed. */
  }
}
function output(channel) {
  const decoder = new TextDecoder();
  return {
    write(bytes) {
      queueOutput(channel, decoder.decode(bytes, { stream: true }));
      return bytes.length;
    },
  };
}
onmessage = async ({ data }) => {
  try {
    if (data.type === 'initialise') {
      if (!self.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined')
        throw new Error('Worker is not cross-origin isolated');
      mailbox = data.mailbox;
      outputSignal = data.outputSignal
        ? new Int32Array(data.outputSignal)
        : null;
      const { loadPyodide } = await import(
        /* @vite-ignore */ `${data.runtimeURL}pyodide.mjs`
      );
      python = await loadPyodide({
        indexURL: data.runtimeURL,
        packages: [],
        stdout: () => {},
        stderr: () => {},
      });
      python.setStdout(output('stdout'));
      python.setStderr(output('stderr'));
      python.setStdin({ stdin: readLine, isatty: false });
      send('ready', {
        isolated: self.crossOriginIsolated,
        version: python.version,
      });
    } else if (data.type === 'run') {
      runId = data.runId;
      requestId = 0;
      queuedOutput = [];
      queuedSize = 0;
      lastFlush = performance.now();
      const globals = python.toPy({ __name__: '__main__' });
      try {
        // No loadPackagesFromImports, micropip or automatic import downloads.
        const result = python.runPython(data.source, {
          globals,
          filename: 'main.py',
        });
        result?.destroy?.();
        flushPythonStreams();
        flushOutput();
        send('completed');
      } finally {
        globals.destroy();
      }
    }
  } catch (error) {
    flushPythonStreams();
    flushOutput();
    send('failed', { error: String(error) });
  }
};
