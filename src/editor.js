import { EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view';
import { pythonLanguage } from '@codemirror/lang-python';
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle, indentOnInput, indentUnit, bracketMatching, syntaxTree } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';

const palette = { '#404740': 'var(--muted)', '#708': 'var(--syntax-keyword)', '#219': 'var(--syntax-number)', '#164': 'var(--syntax-name)', '#a11': 'var(--syntax-string)', '#e40': 'var(--syntax-number)', '#00f': 'var(--syntax-name)', '#30a': 'var(--syntax-name)', '#085': 'var(--syntax-name)', '#167': 'var(--syntax-name)', '#256': 'var(--syntax-name)', '#00c': 'var(--syntax-name)', '#940': 'var(--muted)', '#f00': 'var(--error)' };
const highlighting = HighlightStyle.define(defaultHighlightStyle.specs.map((spec) => ({ ...spec, ...(spec.color ? { color: palette[spec.color] } : {}) })));
// Keep Python's quote/prefix handling, but avoid pairing brackets in literal
// text or any delimiters in comments. Reuse the language's existing syntax tree.
const bracketData = Prec.highest(EditorState.languageData.of((state, pos) => {
  const config = state.facet(pythonLanguage.data).find((data) => data.closeBrackets)?.closeBrackets;
  for (let node = syntaxTree(state).resolveInner(pos, -1); node; node = node.parent) {
    if (node.name === 'Comment') return [{ closeBrackets: { brackets: [] } }];
    // An f-string replacement is Python code, rather than literal string text.
    if (node.name === 'FormatReplacement') break;
    if (node.name === 'String' || node.name === 'FormatString') {
      // A completed string ends before this insertion position. An unclosed
      // string has a trailing parser error and still contains the caret.
      if (pos < node.to || node.lastChild?.type.isError) {
        const quote = state.sliceDoc(node.from, node.to).match(/^[rubf]*(['"])/i)?.[1];
        // Retain the string's own delimiter for skip/delete behaviour, while
        // other quote characters and brackets remain literal text.
        return [{ closeBrackets: { ...config, brackets: quote ? [quote, quote.repeat(3)] : [] } }];
      }
      break;
    }
  }
  return config ? [{ closeBrackets: config }] : [];
}));
export function createEditor(parent, source, onChange) {
  // Use only the language parser, not python()'s completion-support extension.
  // Tab indents; CodeMirror provides Escape-then-Tab focus navigation.
  const view = new EditorView({
    parent,
    state: EditorState.create({ doc: source, extensions: [
      pythonLanguage, syntaxHighlighting(highlighting), indentOnInput(), indentUnit.of('    '),
      bracketData, closeBrackets(), bracketMatching(),
      lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(), drawSelection(), history(),
      keymap.of([indentWithTab, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
      EditorView.contentAttributes.of({ 'aria-label': 'main.py Python source', 'aria-describedby': 'editor-keys', spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
      EditorView.updateListener.of((update) => { if (update.docChanged) onChange(update.state.doc.toString()); }),
    ] }),
  });
  return { source: () => view.state.doc.toString(), focus: () => view.focus() };
}
