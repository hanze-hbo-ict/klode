# Product specification — draft

Status: agreed product scope, including feedback round 1 (#19–#24).
Public deployment: https://klode.app/. Actual school-environment acceptance remains pending.
Product name: **Klode**, selected by the product owner on 2026-10-22 (formerly Codeklad).

## Goal

Provide a minimal general online Python editor without AI assistance or code
completion. Education and exams are contextual use cases, rather than a required
workflow or an ans.app integration.

## Agreed requirements

- First version: Python in one file, `main.py`, with editor and input/output.
- Responsive layout, including smaller screens.
- Follow the system theme with a manual light/dark override.
- Prefer modern JavaScript and a simple build/maintenance process; use proven
  libraries where they add value, especially for editing.
- Exam devices are locked Windows laptops. Internet access is restricted by a URL
  whitelist to ans.app and selected editor environments; no additional specialised
  lockdown software was identified by the product owner.
- Python `input()` is answered directly within the console beside its prompt.
  Accepted input is echoed once with a newline before subsequent output; prior
  transcript is read-only. This is script stdin, not a standalone Python REPL.
- Native code selection/copy preserves exact source; copying into ans.app is one
  contextual exam workflow, not generic interface copy.
- Do not save or restore source across reloads through application-managed browser
  storage. Reload starts the normal initial document. Current code remains intact
  through execution, errors, Stop and theme changes.
- First-version Python scope is the runtime-supported standard library, without
  extra packages, user file workflows or graphics.
- Provide syntax highlighting, automatic indentation, automatic closing of `()`,
  `[]`, `{}` and matching/mismatching bracket highlighting. Mechanical bracket
  assistance is allowed; word/function completion, snippets and AI remain excluded.
  Single/double Python quotes also close automatically, using Python-aware
  prefix/triple-quote handling.
- SQL and other languages are future wishes, outside the first version.

## Proposed technical direction

Pyodide in a Web Worker, an established editor library and all required assets
served from an allowed origin. The product owner selected Netlify on 2026-10-22;
the public URL is https://klode.app/. Feasibility must be demonstrated on an actual exam
laptop with the whitelist in effect, including a cold load without cached assets.
A URL whitelist is restricted connectivity, not a requirement for fully offline use.

## Remaining questions

- Microsoft Edge is the confirmed Windows browser; opening in a new window is
  provisional. Exact versions, actual opening route and reference exercise remain
  prerequisites for the school-environment test.
- Preference persistence is not required by the current scope.
- Exact whitelisted URL/origin and hosting response-header capabilities.

## Decision provenance and repository identity

The product owner confirmed the exam constraints, interactive input, copy/paste
transfer, lack of a cross-session persistence requirement, and the name Klode on
2026-10-22. The product owner subsequently accepted standard-library-only scope
without extra packages/files/graphics, syntax highlighting and indentation without
completion, and same-session reload recovery. These decisions are recorded under issue #3. The repository is now `hanze-hbo-ict/klode`; the local checkout path may still
contain `codeklad`. Existing GitHub links redirect after the rename.

The product owner subsequently reported the local libvirt Windows/Edge HTTPS
spike works and authorised editor implementation to continue. This permits local
implementation while preserving actual school-whitelist evidence as an acceptance
and exam-use release gate; see the dated continuation decision in the feature spec.

## Feedback round 1 — 2026-10-22 (#19–#24)

The product owner approved implementation of the categorised feedback. This
supersedes the earlier same-session reload-recovery decision above: no substitute
source persistence or storage-failure messaging is required. Browser-native history
or BFCache behaviour is not an application recovery promise. Existing evidence
remains valid for its recorded commit, not proof of this revised behaviour.

Run/Stop belong near the top of the editor. Pending console input must be focused
and revealed within the console without requiring a trip to the page bottom.
Editor/console focus must remain clear and padded, rounded with its component,
and unclipped by the line-number gutter. System/light/dark use accessible local
icon controls. Keep “No code completion or AI assistance”, “A little room for
Python.” and “One file. One idea at a time.” Add a subtle repository link; remove
“Runs in your browser”, the hardcoded Python version and ans-specific instructions.

The README introduces the public general editor and live URL. CONTRIBUTING guides
humans and agents through the existing issue/specification, isolated development,
checks, independent review and human merge/publication workflow. This does not
change governance or replace the separate actual-school acceptance track.

## Local-preview refinements (#26)

Use one accessible theme button cycling system/light/dark, with only its current
icon visible. Return “One file. One idea at a time.” below the editor/workspace.
Pending console input uses the transcript font and native caret, without field
decoration or a separate send button; Enter submits. Keep the input accessible
and the surrounding console focus visible. The approved #27 interaction is one Run code/Stop/Retry button in the same
position, with an initial 300 ms Stop appearance delay for short executions and
immediate Stop on input wait. Actual Stop is immediate; there is no execution
timeout or idle reset control. Loading/Stopping disable the button; ordinary
Python errors return to Run code rather than Retry.

## Bracket assistance decision — 2026-10-23 (#29)

The product owner approved automatic bracket closing and matching. Typing a closer
before an auto-inserted closer skips it; Backspace removes an empty pair. Avoid
unwanted pairing in Python comments/string text. The product owner subsequently
approved quote closing in the same item: retain native Python-aware single/double,
prefix and triple-quote handling, closer skipping and empty-pair deletion. Keep matching and mismatch
indications readable in both themes, the keyboard navigation agreement below, exact copying
and undo/redo. The footer remains “No code completion or AI assistance”.

## Footer placement — 2026-10-23 (#34)

Group the repository link and “No code completion or AI assistance” at the left
of the footer. Allow natural wrapping on narrow screens and reserve space at the
right so the hosting badge does not obscure either item. Keep text/link unchanged.

## Editor Tab decision — 2026-10-26 (#36)

Tab indents the current or selected lines by four spaces; Shift+Tab dedents.
This supersedes the earlier ordinary-Tab focus-navigation agreement. Escape then
Tab provides a temporary keyboard escape route from the editor using supported
CodeMirror behaviour. Preserve Enter indentation, undo/copy and bracket/quote help.
After local preview, the product owner rejected the provisional visible hint:
Tab/Shift+Tab are familiar editing commands. Retain the native Escape–Tab escape
route without a visible hint for keyboard-only access to other controls. The
console remains script output/input, not a standalone REPL.

## Editor selection visibility — 2026-10-26 (#38)

Keep actual selected source visibly distinct from the subtle current-line locator
in both themes, including retained selections after focus leaves the editor.
Current-line and bracket decorations must not cover the selection layer. Preserve
syntax legibility, exact copying and keyboard behaviour; bracket outlines remain
distinct from the selection fill.

## Maintainability guidance — 2026-10-26 (#41)

Apply constitution 1.1.0 principles III–IV when designing changes. Keep product
acceptance observable and distinguish it from replaceable implementation choices.
Use supported library defaults/APIs as the starting point; justify custom behaviour
through a concrete user need and its maintenance cost in the existing issue,
design or PR. Do not count fewer packages or more tests as improvements by themselves.

The simplicity review retains Vite and the existing worker/input/output mechanisms;
implementation follow-ups are #42–#45. Existing accepted behaviour, including the
literal/comment bracket policy, remains binding until a product-owner decision
changes it. This amendment does not implement those follow-ups. See
[design decisions](../docs/design-decisions.md) for concrete rationale and open
choices. The existing independent review and human merge/publication gates remain.
