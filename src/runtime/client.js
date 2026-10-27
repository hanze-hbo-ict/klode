import { CAPACITY, HEADER_BYTES, submit } from './input-mailbox.js';
export function createRuntime(onEvent) {
  let worker, buffer, generation = 0, nextRun = 0, activeRun = null, pending = null, state;
  const emitState = (value) => { state = value; onEvent({ type: 'state', state }); };
  function initialise() {
    worker?.terminate();
    generation += 1;
    activeRun = null; pending = null;
    if (!globalThis.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
      emitState('failed');
      onEvent({ type: 'error', text: 'Python cannot start in this browser window. Open the editor using the provided secure link or contact your teacher.' });
      return;
    }
    const currentGeneration = generation;
    const outputBuffer = new SharedArrayBuffer(4);
    const outputSignal = new Int32Array(outputBuffer);
    buffer = new SharedArrayBuffer(HEADER_BYTES + CAPACITY);
    emitState('loading');
    try {
      worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (currentGeneration !== generation) return;
        if (data.type === 'ready' && state === 'loading') { emitState('ready'); return; }
        if (data.type === 'failed' && state === 'loading') { emitState('failed'); onEvent({ type: 'error', text: data.error }); return; }
        if (data.runId !== activeRun || activeRun === null) return;
        if (data.type === 'output') {
          onEvent(data);
          requestAnimationFrame(() => {
            if (currentGeneration !== generation) return;
            Atomics.store(outputSignal, 0, data.outputId); Atomics.notify(outputSignal, 0);
          });
        }
        if (data.type === 'input-request') {
          pending = { runId: data.runId, requestId: data.requestId };
          emitState('waiting-for-input'); onEvent({ type: 'input', identity: pending });
        }
        if (data.type === 'completed' || data.type === 'failed') {
          activeRun = null; pending = null;
          emitState('ready');
          if (data.type === 'failed') onEvent({ type: 'error', text: data.error });
        }
      };
      worker.onerror = (event) => {
        if (currentGeneration !== generation) return;
        activeRun = null; pending = null; emitState('failed');
        onEvent({ type: 'error', text: event.message || 'Python worker could not start. Try resetting the runtime.' });
      };
      worker.postMessage({ type: 'initialise', mailbox: buffer, outputSignal: outputBuffer, runtimeURL: new URL(__KLODE_RUNTIME_PATH__, location.origin).href });
    } catch (error) { emitState('failed'); onEvent({ type: 'error', text: String(error) }); }
  }
  return {
    initialise,
    run(source) {
      if (state !== 'ready') return false;
      activeRun = ++nextRun; pending = null; emitState('running');
      worker.postMessage({ type: 'run', runId: activeRun, source }); return true;
    },
    answer(identity, line) {
      if (state !== 'waiting-for-input' || !pending || identity.runId !== pending.runId || identity.requestId !== pending.requestId) return { ok: false, error: 'Obsolete input request.' };
      const result = submit(buffer, identity.runId, identity.requestId, line);
      if (result.ok) { pending = null; emitState('running'); }
      return result;
    },
    stop() { emitState('stopping'); initialise(); },
  };
}
