// This delays only the Stop presentation; termination itself is immediate.
export const STOP_REVEAL_MS = 300;
export function createExecutionControl(
  render,
  actions,
  timers = {
    set: (callback, delay) => setTimeout(callback, delay),
    clear: (id) => clearTimeout(id),
  },
) {
  let state,
    action = null,
    timer = null,
    version = 0,
    stopVisible = false;
  function cancelReveal() {
    version += 1;
    if (timer !== null) timers.clear(timer);
    timer = null;
  }
  function show(label, nextAction = null) {
    action = nextAction;
    render({ label, disabled: nextAction === null });
  }
  return {
    state(next) {
      const previous = state;
      state = next;
      if (next === 'running') {
        if (stopVisible) {
          show('Stop', 'stop');
          return;
        }
        show('Run code');
        if (previous === 'running') return;
        cancelReveal();
        const current = version;
        timer = timers.set(() => {
          if (current !== version || state !== 'running') return;
          timer = null;
          stopVisible = true;
          show('Stop', 'stop');
        }, STOP_REVEAL_MS);
        return;
      }
      cancelReveal();
      stopVisible = next === 'waiting-for-input';
      if (stopVisible) show('Stop', 'stop');
      else if (next === 'ready') show('Run code', 'run');
      else if (next === 'failed') show('Retry', 'retry');
      else show(next === 'stopping' ? 'Stopping…' : 'Loading…');
    },
    activate() {
      if (action !== null) actions[action]();
    },
  };
}
