# Validation guide

These commands validate the local implementation; actual school acceptance is
recorded separately. Existing tooling checks also run via uv.

## Local setup

Use Node from [.node-version](../../.node-version) and npm from
[package.json](../../package.json) (`packageManager`), then `npm ci`, `npm test`, `npm run dev` and
`npm run build`. The editor opens at `/`. The retired input spike is not built
or served as a separate application. The runtime-vendoring script checks
pinned assets. Run `npm run preview` with isolation headers configured for validation.
Run `npm run test:browser` with installed Chrome/Edge (`CHROME_BIN` override)
for application regressions in `tests/browser/` (ports 4275–4276). Unit tests
and shared helpers are in `tests/unit/` and `tests/support/`. The production host must return the same headers; a successful dev server alone
is insufficient evidence. No automatic deployment is part of these commands.

## Feasibility evidence

Record in evidence/feasibility.md: commit, runtime/browser versions, opening route,
approved URL, agreed reference exercise with expected results, response headers,
crossOriginIsolated in window/worker, cold-load
network log and asset sizes. Test a normal browser first, then the actual exam
Windows laptop with every unapproved destination blocked. The product owner or
school supplies the actual laptop and confirms whitelist/opening details.

## Acceptance cases

1. Run `print(2 + 3)` and see 5; introduce/fix syntax and runtime errors.
2. Run two input() calls with visible prompts; answer after execution starts.
   Type directly beside the console prompt. Include empty and non-ASCII answers,
   repeated prompts and a prompt with no newline. Accepted answers echo once with
   a newline before later output; rejected/stale answers never echo as accepted.
3. Stop while waiting for input and while running an endless loop; run again.
   Code survives, stale events/answers do not enter the new execution.
4. Reject an input line larger than mailbox capacity visibly and without truncation.
5. Import selected supported standard modules, such as math; confirm unavailable
   packages produce an error without attempted network installation.
6. Copy multiline code containing indentation from the editor into ans.app and
   compare it exactly. Test actual clipboard behaviour on the exam laptop.
7. Edit and reload; normal initial content returns. Repeat with empty source and an
   old `klode.source.v1` value. Confirm no source save/restore or recovery warning;
   errors, Run/Stop and theme changes retain current edits, including edits during a run.
8. Verify syntax highlighting/indentation with no completion/AI interface.
9. Verify accessible system/manual icon controls and upper Run/Stop at 360×640 and
   1280×720. Check padded rounded focus, gutter visibility, long code/output, input
   reveal within the console, transcript copy and no page horizontal overflow.
10. Cold-load the production build under whitelist conditions and confirm only
    approved application/runtime resources are requested.

Write expected/actual results in evidence/acceptance.md. Record local and actual
exam evidence separately; do not mark missing laptop/hosting checks as passed.
Independent review and human merge approval precede publication.
