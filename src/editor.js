import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from '@codemirror/view';
import { pythonLanguage } from '@codemirror/lang-python';
import {
  syntaxHighlighting,
  indentOnInput,
  indentUnit,
  bracketMatching,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';

import { highlighting, editorTheme, themeMode } from './editor-theme.js';

export function createEditor(parent, source) {
  // Use only the language parser, not python()'s completion-support extension.
  // Tab indents; CodeMirror provides Escape-then-Tab focus navigation.
  const appearance = new Compartment();
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: source,
      extensions: [
        editorTheme,
        appearance.of(themeMode('light')),
        pythonLanguage,
        syntaxHighlighting(highlighting),
        indentOnInput(),
        indentUnit.of('    '),
        closeBrackets(),
        bracketMatching(),
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        keymap.of([
          indentWithTab,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.contentAttributes.of({
          'aria-label': 'main.py Python source',
          spellcheck: 'false',
          autocorrect: 'off',
          autocapitalize: 'off',
        }),
      ],
    }),
  });
  return {
    source: () => view.state.doc.toString(),
    focus: () => view.focus(),
    setTheme: (mode) =>
      view.dispatch({ effects: appearance.reconfigure(themeMode(mode)) }),
  };
}
