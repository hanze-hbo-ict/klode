import './styles.css';
import { createEditor } from './editor.js';
import { createTheme } from './theme.js';
import { createOutput } from './output.js';
import { createInput } from './input.js';
import { createExecutionControl } from './execution.js';
import { createRuntime } from './runtime/client.js';
const $ = (id) => document.getElementById(id);
const editor = createEditor(
  $('editor'),
  '# Write your Python code here\nprint("Hello, world!")\n',
);
createTheme($('theme'), editor.setTheme);
const output = createOutput($('output'), $('error'));
const labels = {
  loading: 'Loading Python…',
  ready: 'Ready',
  running: 'Running',
  'waiting-for-input': 'Waiting for input',
  stopping: 'Stopping…',
  failed: 'Unavailable',
};
const input = createInput($('input-form'), $('answer'), (identity, line) => {
  const result = runtime.answer(identity, line);
  if (result.ok) {
    output.append(line + '\n');
    output.flush();
    output.reveal();
  }
  output.error(result.error ?? '');
  return result.ok;
});
const execution = createExecutionControl(
  ({ label, disabled }) => {
    $('run').textContent = label;
    const symbol = { 'Run code': '▶', Stop: '■' }[label];
    if (symbol) {
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = symbol;
      $('run').prepend(icon, ' ');
    }
    $('run').dataset.action = disabled
      ? 'busy'
      : ({ 'Run code': 'run', Stop: 'stop', Retry: 'retry' }[label] ?? 'busy');
    $('run').disabled = disabled;
  },
  {
    run() {
      output.clear();
      runtime.run(editor.source());
    },
    stop() {
      output.error('');
      runtime.stop();
    },
    retry() {
      output.error('');
      runtime.initialise();
    },
  },
);
const runtime = createRuntime((event) => {
  if (event.type === 'state') {
    output.flush();
    if (event.state === 'ready' || event.state === 'waiting-for-input')
      output.reveal();
    $('status').textContent = labels[event.state];
    $('status').dataset.state = event.state;
    execution.state(event.state);
    if (event.state !== 'waiting-for-input') input.clear();
  }
  if (event.type === 'input') input.request(event.identity);
  if (event.type === 'output') output.append(event.text);
  if (event.type === 'error') output.error(event.text);
});
$('run').addEventListener('click', () => execution.activate());
runtime.initialise();
