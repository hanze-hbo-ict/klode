import { EditorView } from '@codemirror/view';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Own semantic categories, not another theme's incidental hex values.
export const highlighting = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--syntax-keyword)' },
  { tag: [tags.number, tags.atom, tags.bool, tags.null], color: 'var(--syntax-number)' },
  { tag: [tags.string, tags.regexp, tags.escape], color: 'var(--syntax-string)' },
  { tag: [tags.definition(tags.variableName), tags.definition(tags.propertyName), tags.typeName, tags.namespace, tags.className, tags.special(tags.variableName)], color: 'var(--syntax-name)' },
  { tag: [tags.comment, tags.meta], color: 'var(--muted)' },
  { tag: tags.invalid, color: 'var(--error)' },
]);

// Layout and app palette integration; native cursor/gutter-line/bracket fills
// follow CodeMirror's own light/dark defaults. No !important cascade overrides.
export const editorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px', backgroundColor: 'var(--panel)', color: 'var(--ink)' },
  '&.cm-focused': { outline: 'none' }, // The padded outer #editor supplies focus.
  '.cm-scroller': { fontFamily: '"Cascadia Code","SFMono-Regular",Consolas,monospace', overflow: 'auto', lineHeight: '1.8' },
  '.cm-content': { padding: '12px 0' },
  '.cm-line': { padding: '0 12px' },
  '.cm-gutters': { backgroundColor: 'var(--gutter)', color: 'var(--muted)', borderRight: '1px solid var(--line)', paddingLeft: '6px', minWidth: '36px' },
  // Keep the owner-approved #38 distinction, including selections after blur.
  '.cm-activeLine': { backgroundColor: 'var(--active-line)' },
  '& .cm-selectionBackground': { backgroundColor: 'var(--selection)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': { backgroundColor: 'var(--selection)' },
  // Outlines distinguish bracket boundaries; mismatch also has a non-colour cue.
  '.cm-matchingBracket': { outline: '1px solid var(--accent)', outlineOffset: '-1px', borderRadius: '2px' },
  '.cm-nonmatchingBracket': { outline: '1px solid var(--error)', outlineOffset: '-1px', textDecoration: 'underline wavy var(--error)', borderRadius: '2px' },
  '@media(max-width:740px)': { '&': { fontSize: '13px' } },
});

const light = EditorView.theme({}, { dark: false });
const dark = EditorView.theme({}, { dark: true });
export const themeMode = (mode) => mode === 'dark' ? dark : light;
