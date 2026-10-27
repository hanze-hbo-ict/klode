// One independent buffer per worker generation. All identities are positive i32.
export const CAPACITY = 65536;
export const HEADER_BYTES = 16;
export const STATE = 0,
  RUN = 1,
  REQUEST = 2,
  LENGTH = 3;
export const WAITING = 0,
  ANSWER = 1;
export function views(buffer) {
  return {
    control: new Int32Array(buffer, 0, 4),
    bytes: new Uint8Array(buffer, HEADER_BYTES),
  };
}
export function submit(buffer, runId, requestId, line) {
  const { control, bytes } = views(buffer);
  if (
    Atomics.load(control, RUN) !== runId ||
    Atomics.load(control, REQUEST) !== requestId ||
    Atomics.load(control, STATE) !== WAITING
  )
    return { ok: false, error: 'Obsolete input request.' };
  if (/[\r\n]/u.test(line)) return { ok: false, error: 'Enter a single line.' };
  const encoded = new TextEncoder().encode(line);
  if (encoded.length > CAPACITY)
    return {
      ok: false,
      error: `Input exceeds ${CAPACITY} UTF-8 bytes; nothing was submitted.`,
    };
  bytes.set(encoded);
  Atomics.store(control, LENGTH, encoded.length);
  Atomics.store(control, STATE, ANSWER);
  Atomics.notify(control, STATE);
  return { ok: true };
}

export function stdinLine(buffer) {
  const { control, bytes } = views(buffer);
  const length = Atomics.load(control, LENGTH);
  if (length < 0 || length > CAPACITY) throw new Error('Invalid input length');
  // Always include LF so empty lines are explicit in the stdin callback.
  // Browser TextDecoder rejects SharedArrayBuffer-backed views. Copy first.
  return (
    new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(0, length)) +
    '\n'
  );
}
