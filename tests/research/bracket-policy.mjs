// One-off decision evidence for #43, not a production module or test baseline.
// Run: node tests/research/bracket-policy.mjs
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { EditorState } from '@codemirror/state';
import { pythonLanguage } from '@codemirror/lang-python';
import { ensureSyntaxTree } from '@codemirror/language';
import { closeBrackets, insertBracket, deleteBracketPair } from '@codemirror/autocomplete';

// Read the recorded pre-decision policy without copying its implementation.
// Resolve its imports before evaluating a research-only module with one extra export.
const editorURL = new URL('../../src/editor.js', import.meta.url);
const baseline = '4f96bda51113b43e7bb257f55911cec0d85b10d9';
const source = execFileSync('git', ['show', `${baseline}:src/editor.js`], {
  cwd: new URL('../../', import.meta.url), encoding: 'utf8',
}).replace(
  /from\s+(['"])([^'"]+)\1/g,
  (_, quote, specifier) => `from ${JSON.stringify(specifier.startsWith('.')
    ? new URL(specifier, editorURL).href : import.meta.resolve(specifier))}`,
);
const { bracketData } = await import(`data:text/javascript;base64,${Buffer.from(`${source}\nexport { bracketData };`).toString('base64')}`);

const cases = [
  ['code: parentheses', 'print|', '('],
  ['code: square brackets', 'items = |', '['],
  ['code: braces', 'mapping = |', '{'],
  ['code: closer skipping', '|', '(x)'],
  ['code: pair deletion', '|', '(<Backspace>'],
  ['code after completed string', '"done"|', '('],
  ['comment: parentheses', '# note |', '('],
  ['comment: square brackets', '# note |', '['],
  ['comment: braces', '# note |', '{'],
  ['comment: single quote', '# note |', "'"],
  ['comment: double quote', '# note |', '"'],
  ['single string: bracket', "value = '|text'", '('],
  ['single string: bracket before space', "value = 'text| '", '['],
  ['double string: bracket before closer', 'value = "text|"', '{'],
  ['double string: bracket before space', 'value = "text | rest"', '{'],
  ['triple string: bracket before space', 'value = """text | rest"""', '('],
  ['raw string: bracket before space', 'value = r"text | rest"', '['],
  ['unclosed raw string', 'value = r"text |', '('],
  ['unclosed triple string', 'value = """text |', '['],
  ['unclosed raw f-string', 'value = rf"text |', '('],
  ['f-string: literal before space', 'value = f"text | rest"', '['],
  ['f-string: replacement before space', 'value = f"text | rest"', '{'],
  ['single string: opposite quote before space', "value = 'text | rest'", '"'],
  ['double string: opposite quote before space', 'value = "text | rest"', "'"],
  ['single string: opposite quote', "value = '|text'", '"'],
  ['double string: opposite quote', 'value = "|text"', "'"],
  ['unclosed single string', "value = 'text |", '('],
  ['unclosed double string', 'value = "text |', '['],
  ['triple string: bracket', 'value = """text |"""', '('],
  ['multiline triple string', 'value = """line\ntext |"""', '{'],
  ['raw string: bracket', 'value = r"text |"', '('],
  ['bytes string: bracket', 'value = b"text |"', '['],
  ['raw bytes string: bracket', 'value = rb"text |"', '{'],
  ['f-string: literal bracket', 'value = f"text |"', '('],
  ['raw f-string: literal bracket', 'value = rf"text |"', '['],
  ['f-string: replacement start', 'value = f"text |"', '{'],
  ['f-string: replacement code', 'value = f"{call|}"', '('],
  ['f-string: bracket in replacement string', 'value = f"{\'text |\'}"', '('],
  ['escaped quote inside string', String.raw`value = "escaped \" text |"`, '('],
  ['escaped slash before quote', 'value = "text\\|"', '"'],
  ['single quote closing and skip', '|', "'hello'"],
  ['double quote closing and skip', '|', '"hello"'],
  ['raw prefix quote closing', 'value = r|', '"'],
  ['f prefix quote closing', 'value = f|', '"'],
  ['triple quote closing', '|', '"""'],
  ['quote pair deletion', '|', '"<Backspace>'],
];

function apply(initial, input, custom) {
  const cursor = initial.indexOf('|');
  let state = EditorState.create({
    doc: initial.replace('|', ''), selection: { anchor: cursor },
    extensions: [pythonLanguage, closeBrackets(), ...(custom ? [bracketData] : [])],
  });
  for (const char of input.match(/<Backspace>|[\s\S]/g)) {
    ensureSyntaxTree(state, state.doc.length, 100);
    if (char === '<Backspace>') {
      if (!deleteBracketPair({ state, dispatch: tr => { state = tr.state; } })) {
        const at = state.selection.main.head;
        state = state.update({ changes: { from: Math.max(0, at - 1), to: at }, selection: { anchor: Math.max(0, at - 1) } }).state;
      }
    } else {
      const transaction = insertBracket(state, char);
      state = transaction ? transaction.state : state.update(state.replaceSelection(char), { userEvent: 'input.type' }).state;
    }
  }
  const at = state.selection.main.head;
  return `${state.sliceDoc(0, at)}|${state.sliceDoc(at)}`;
}

const lock = JSON.parse(await readFile(new URL('../../package-lock.json', import.meta.url)));
console.log(JSON.stringify({
  versions: Object.fromEntries(['@codemirror/autocomplete', '@codemirror/lang-python', '@lezer/python'].map(name => [name, lock.packages[`node_modules/${name}`].version])),
  cases: cases.map(([name, initial, input]) => ({
    name, initial, input, standard: apply(initial, input, false), current: apply(initial, input, true),
  })),
}, null, 2));
