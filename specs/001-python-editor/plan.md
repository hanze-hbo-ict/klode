# Implementation Plan: Klode minimal Python editor

**Branch**: `001-python-editor` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)
**Input**: Product-owner decisions under #3 and feedback #19–#24; constitution v1.0.1.
**Status**: Revised feedback plan; actual school acceptance remains pending.
Public deployment exists on Cloudflare Pages (#57); revised changes still require review/human merge.

## Summary

Build a static single-page JavaScript application with CodeMirror 6 and Pyodide
in a module worker. Interactive input uses a shared-memory mailbox and is entered
within the console, echoing accepted lines before later output. Source has no
application-managed reload persistence. Prove runtime input and
whitelisted loading before building the full interface. Keep all runtime assets
on the approved origin. No framework, backend, extra packages, user file workflows,
graphics, completion or AI features.

## Technical Context

**Language/Version**: Modern JavaScript ES modules; Python via pinned Pyodide.
Pin exact supported Node, Vite, CodeMirror and Pyodide versions during setup.
**Dependencies**: Vite, explicit CodeMirror Python/highlighting/indentation extensions,
locally packaged Pyodide runtime/stdlib; npm lockfile. Existing uv remains dev tooling.
**Storage**: in-memory document only; no application-managed source persistence.
**Validation**: production build, browser acceptance cases in quickstart, network
origin audit, input/cancellation/reload scenarios; retain existing Tooling checks.
**Target**: locked Windows exam laptop with whitelisted network access; actual
browser/version and opening route recorded at feasibility. Standalone tab is a
design proposal, not a confirmed school workflow.
**Project type**: Static web application.
**Performance**: UI remains interactive during Python execution/input wait;
collect cold-load timing and asset sizes during feasibility without inventing an SLA.
**Constraints**: HTTPS, cross-origin isolation for shared memory, allowed-origin-only
asset loading, ordinary copying into ans.app, one file main.py.
**Scope**: One local student program and one active execution; no server state.

## Constitution Check

Pre-design: pass. One-file Python/no AI, responsive themes, simple modern JS,
proven editor, explicit spec, isolated work and independent review are retained.
Post-design: pass. Exact exam evidence is gated, not claimed; Cloudflare Pages is selected by the product owner, with no
autonomous publication. Node/Vite supplement
uv tooling for browser assets and do not add a Python backend.

## Feasibility gate

The implemented local runtime spike proves input, Unicode,
empty answers, visible non-newline prompts, Stop/restart, same-origin cold loading
and required local isolation headers. The product owner also reports successful
LAN HTTPS use in a Windows/Edge VM. Under the continuation decision below, local
UI implementation may proceed. Actual school browser, opening route, whitelist
and candidate HTTPS host evidence remain an acceptance/exam-use release gate.
No silent fallback to preloaded input or an unapproved CDN.
Cloudflare Pages is the public host since 2026-11-16 (#57). Revised deployments must follow the human
gate; preparing this plan does not authorise publication. Coordinate provisioning
with #4 and report a blocker if the actual-environment gate cannot be executed.

## Project Structure

```text
specs/001-python-editor/
  spec.md, plan.md, research.md, data-model.md, quickstart.md, tasks.md
  contracts/ui-runtime.md
  evidence/feasibility.md, evidence/acceptance.md  # local/actual results kept separate
index.html
src/
  main.js, editor.js, output.js, input.js, execution.js, theme.js, styles.css
  runtime/client.js, runtime/worker.js, runtime/input-mailbox.js
public/runtime/<pinned-version>/
scripts/vendor-runtime.mjs
package.json, package-lock.json, vite.config.js
```

## Delivery strategy

1. Setup and isolated feasibility spike, with an independent evidence review.
2. Editing/execution, then interactive input, exact clipboard/no source persistence, then themes.
3. Build/origin audit and actual Windows acceptance evidence.
4. Independent review and human merge decision for every implementation PR;
   publication follows only the approved release route.

Treat each story as an independently verifiable increment. Full first-version
acceptance requires all P1 stories and the agreed responsive/theme requirements.
GitHub issues own status and handoffs; tasks.md is the dependency decomposition.
No constitution exceptions or additional complexity waivers are proposed.

## Product-owner continuation decision — 2026-10-22

The product owner reports the LAN HTTPS input spike works in their libvirt
Windows VM using Edge, and explicitly authorises continuing with the editor.
This is user-reported VM smoke evidence; exact OS/browser versions and per-case
results were not supplied. It is not a passed school-laptop whitelist test.

On this basis, local UI/runtime implementation may proceed before the remaining
school-environment evidence. The actual Windows school whitelist, opening route,
reference exercise, cold loading and ans.app clipboard checks remain mandatory
before claiming exam suitability or releasing for exam use. T005–T006, T016 and
T021 remain incomplete until that evidence is collected/reviewed. This decision
supersedes the earlier implementation stop on unavailable school-device access;
it does not weaken the product requirements or authorise production deployment.

## Feedback-round implementation sequence (#19–#24)

Review the revised specification first. Remove source save/restore and ans-specific
UI; leave historical evidence unchanged. Keep code ownership independent of the
executed snapshot. Then coordinate console DOM/CSS and upper editor controls in a
single integration sequence: read-only safe transcript plus a labelled active input
at its current prompt, internal console scrolling/focus, accepted-answer echo before
worker continuation output. Preserve the shared mailbox and ordered output ACK
protocol; no full REPL or output cap. Use accessible locally packaged theme icons
and a simplified footer. Update public README/CONTRIBUTING from agreed behaviour.

Validate new source initialization, exact input transcript/order, rejection and
stale events, Stop/flood/rerun, transcript selection and focus at 1280×720/360×640.
Retain existing same-origin, no-completion/AI and school acceptance boundaries.

## Local-preview refinements (#26)

Keep existing native input/form semantics and make only its presentation
terminal-like: transparent undecorated input, native caret and Enter submission
without a separate send button. Retain console focus indication and labels.
Replace the theme group with one current-mode icon button cycling system, light,
dark. Move the payoff below the workspace. Approved #27 adds one state-dependent
execution button with a cancellable 300 ms reveal timer, immediate Stop during input
wait and persistent Stop after resumption. Do not delay actual Stop or change the
runtime/mailbox/ACK protocol. Loading/Stopping are disabled; failure offers Retry.
