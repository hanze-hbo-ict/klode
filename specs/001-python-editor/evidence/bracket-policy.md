# Python bracket policy comparison (#43)

Date: 2026-10-27. Baseline: `4f96bda51113b43e7bb257f55911cec0d85b10d9`.
Constitution 1.1.0 and current product/feature specifications apply.
Status: decision evidence; **no product behaviour or specification change approved**.

## Reproduce and scope

Run `npm ci`, then `node tests/research/bracket-policy.mjs` from the repository
root. The script uses the locked packages and reads the actual current policy
from src/editor.js without modifying it or maintaining a copied implementation.
It evaluates a research-only module with an additional private-policy export.
It compares CodeMirror's public insertBracket/deleteBracketPair operations with
ordinary insertion fallback; the normal input handler uses insertBracket for
these single-character inputs. Parser state is resolved before each operation.
The report records both resulting source and cursor, not just whether a closer
was inserted. This is a targeted state-level comparison, not browser, IME,
clipboard/undo, theme or actual-school acceptance evidence. Those existing
requirements/tests remain binding. The harness is a one-off decision aid, not
an additional CI baseline or a production module.

Locked comparison versions: autocomplete `6.20.4`, lang-python `6.2.1`,
Lezer Python `1.1.19`. No dependency upgrades.

## Findings

Of 46 selected scenarios, 28 produced identical source/cursor and 18 differed.
This is a coverage sample, not a completeness claim or a quality score.

- Normal code pairing, closer skipping, empty-pair deletion, Python quote/prefix
  and triple-quote convenience already come from the native extensions.
- The policy suppresses pairing in comments and literal string text. Native
  pairing is contextual: it can add a closer at end-of-document or before
  whitespace; it does not necessarily pair before an existing closing quote or
  a word. Therefore simply saying "defaults pair everywhere" would be inaccurate.
- This distinction also affects opposite quotes inside strings before whitespace,
  incomplete strings and raw/bytes/triple/f-string literal text.
- Inside an existing f-string replacement, both retain normal code pairing.
  Before creating a replacement (typing `{` into literal text before a space),
  defaults add `}`; our policy suppresses it. The custom filter can therefore
  remove useful help as well as avoid unwanted insertion.
- Copy/undo, input and execution are outside this filter and must remain covered
  if a later approved change removes or isolates it.

## Options for the product owner

**A — Accept native pairing (recommended for the stated simplicity priority).**
Remove the grammar-aware filter and its Prec/syntaxTree coupling, keeping the
native bracket/quote extensions and existing keyboard/history support. Accept
contextual automatic pairing in comments and string text. For literal unmatched
characters, users may need to remove an inserted closer. Amend the explicit
"avoid unwanted pairing in comments/string text" agreement in product/feature
specifications and corresponding cases; preserve all remaining requirements.
The benefit is delegating parser/quote handling to the maintained library rather
than owning a second policy based on grammar node names, parser error placement
and a prefix regex. The observable tradeoff is the extra closers shown below.

**B — Preserve current filtering.**
Keep the existing literal/comment agreement, isolate the policy in a small module
and document the rationale and upgrade checks. Retain comparison cases that
exercise comments, incomplete/escaped/prefixed strings and f-string replacements.
This keeps literal insertion convenient but retains grammar coupling; it is not
an implementation simplification equivalent to A. Fixing different f-string
behaviour would require a separate product decision.

Neither option enables code suggestions/AI or changes ordinary selection, copy,
undo, indentation, runtime input/Stop or release gates. **Wait for the owner's
choice before changing production policy, acceptance expectations or specs.**

## Scenario results

`▮` marks the insertion cursor, not source text. Newlines are shown as `\n`.
"Input" is typed character by character; `<Backspace>` invokes pair deletion
with ordinary deletion fallback. Results below are generated from the harness.

| Scenario | Initial | Input | Native | Current |
| --- | --- | --- | --- | --- |
| code: parentheses | `print▮` | `(` | `print(▮)` | `print(▮)` |
| code: square brackets | `items = ▮` | `[` | `items = [▮]` | `items = [▮]` |
| code: braces | `mapping = ▮` | `{` | `mapping = {▮}` | `mapping = {▮}` |
| code: closer skipping | `▮` | `(x)` | `(x)▮` | `(x)▮` |
| code: pair deletion | `▮` | `(<Backspace>` | `▮` | `▮` |
| code after completed string | `"done"▮` | `(` | `"done"(▮)` | `"done"(▮)` |
| comment: parentheses | `# note ▮` | `(` | `# note (▮)` | `# note (▮` |
| comment: square brackets | `# note ▮` | `[` | `# note [▮]` | `# note [▮` |
| comment: braces | `# note ▮` | `{` | `# note {▮}` | `# note {▮` |
| comment: single quote | `# note ▮` | `'` | `# note '▮'` | `# note '▮` |
| comment: double quote | `# note ▮` | `"` | `# note "▮"` | `# note "▮` |
| single string: bracket | `value = '▮text'` | `(` | `value = '(▮text'` | `value = '(▮text'` |
| single string: bracket before space | `value = 'text▮ '` | `[` | `value = 'text[▮] '` | `value = 'text[▮ '` |
| double string: bracket before closer | `value = "text▮"` | `{` | `value = "text{▮"` | `value = "text{▮"` |
| double string: bracket before space | `value = "text ▮ rest"` | `{` | `value = "text {▮} rest"` | `value = "text {▮ rest"` |
| triple string: bracket before space | `value = """text ▮ rest"""` | `(` | `value = """text (▮) rest"""` | `value = """text (▮ rest"""` |
| raw string: bracket before space | `value = r"text ▮ rest"` | `[` | `value = r"text [▮] rest"` | `value = r"text [▮ rest"` |
| unclosed raw string | `value = r"text ▮` | `(` | `value = r"text (▮)` | `value = r"text (▮` |
| unclosed triple string | `value = """text ▮` | `[` | `value = """text [▮]` | `value = """text [▮` |
| unclosed raw f-string | `value = rf"text ▮` | `(` | `value = rf"text (▮)` | `value = rf"text (▮` |
| f-string: literal before space | `value = f"text ▮ rest"` | `[` | `value = f"text [▮] rest"` | `value = f"text [▮ rest"` |
| f-string: replacement before space | `value = f"text ▮ rest"` | `{` | `value = f"text {▮} rest"` | `value = f"text {▮ rest"` |
| single string: opposite quote before space | `value = 'text ▮ rest'` | `"` | `value = 'text "▮" rest'` | `value = 'text "▮ rest'` |
| double string: opposite quote before space | `value = "text ▮ rest"` | `'` | `value = "text '▮' rest"` | `value = "text '▮ rest"` |
| single string: opposite quote | `value = '▮text'` | `"` | `value = '"▮text'` | `value = '"▮text'` |
| double string: opposite quote | `value = "▮text"` | `'` | `value = "'▮text"` | `value = "'▮text"` |
| unclosed single string | `value = 'text ▮` | `(` | `value = 'text (▮)` | `value = 'text (▮` |
| unclosed double string | `value = "text ▮` | `[` | `value = "text [▮]` | `value = "text [▮` |
| triple string: bracket | `value = """text ▮"""` | `(` | `value = """text (▮"""` | `value = """text (▮"""` |
| multiline triple string | `value = """line\ntext ▮"""` | `{` | `value = """line\ntext {▮"""` | `value = """line\ntext {▮"""` |
| raw string: bracket | `value = r"text ▮"` | `(` | `value = r"text (▮"` | `value = r"text (▮"` |
| bytes string: bracket | `value = b"text ▮"` | `[` | `value = b"text [▮"` | `value = b"text [▮"` |
| raw bytes string: bracket | `value = rb"text ▮"` | `{` | `value = rb"text {▮"` | `value = rb"text {▮"` |
| f-string: literal bracket | `value = f"text ▮"` | `(` | `value = f"text (▮"` | `value = f"text (▮"` |
| raw f-string: literal bracket | `value = rf"text ▮"` | `[` | `value = rf"text [▮"` | `value = rf"text [▮"` |
| f-string: replacement start | `value = f"text ▮"` | `{` | `value = f"text {▮"` | `value = f"text {▮"` |
| f-string: replacement code | `value = f"{call▮}"` | `(` | `value = f"{call(▮)}"` | `value = f"{call(▮)}"` |
| f-string: bracket in replacement string | `value = f"{'text ▮'}"` | `(` | `value = f"{'text (▮'}"` | `value = f"{'text (▮'}"` |
| escaped quote inside string | `value = "escaped \" text ▮"` | `(` | `value = "escaped \" text (▮"` | `value = "escaped \" text (▮"` |
| escaped slash before quote | `value = "text\▮"` | `"` | `value = "text\"▮"` | `value = "text\"▮"` |
| single quote closing and skip | `▮` | `'hello'` | `'hello'▮` | `'hello'▮` |
| double quote closing and skip | `▮` | `"hello"` | `"hello"▮` | `"hello"▮` |
| raw prefix quote closing | `value = r▮` | `"` | `value = r"▮"` | `value = r"▮"` |
| f prefix quote closing | `value = f▮` | `"` | `value = f"▮"` | `value = f"▮"` |
| triple quote closing | `▮` | `"""` | `"""▮"""` | `"""▮"""` |
| quote pair deletion | `▮` | `"<Backspace>` | `▮` | `▮` |
