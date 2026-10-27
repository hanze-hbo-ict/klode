# Design decisions and maintenance

Constitution 1.1.0 principles III–IV guide these decisions. Record rationale in the
existing issue/design/PR and link it where needed. A small local choice needs only
a short explanation; this page does not introduce another approval process.
Product requirements describe what the user can observe. Implementation rationale
explains how the current design meets them and what maintaining it costs.

## Examples from the simplicity review (#40–#41)

| Choice | Rationale and maintenance boundary | Current disposition |
| --- | --- | --- |
| Vite | Resolves package/CSS imports, bundles the worker and emits static assets. A custom server replaces only serving; a fair comparison includes the remaining build responsibilities. | Retain; no build-tool replacement in #40. |
| Syntax highlighting | Map semantic categories such as keywords and strings to a deliberate theme. Mapping another theme's exact hex values ties semantics to upstream presentation. | Semantic tags and a theme compartment implemented in #42; palette remains local. |
| Python bracket policy | Current custom filtering satisfies agreed literal/comment behaviour, but depends on parser node names and error recovery. Native defaults differ. | #43 compares options; an owner decision precedes any changed behaviour. |
| Worker/input/output protocol | Shared input supports synchronous Python input without blocking the UI. Worker termination, identities and output backpressure support responsive Stop, stale-event rejection and lossless finite output. | Preserve these requirements; implementation details may change only with evidence that the same behaviour holds. |
| Runtime metadata and generated assets | Repeated version literals can drift; old generated versions can leak into local build output. Authoritative inputs and clean generation reduce that responsibility. | #44 addresses packaging/configuration without upgrading the runtime. |

These are current decisions and identified follow-ups, not claims that the planned
cleanups are already implemented. Existing accepted visual and keyboard behaviour,
copy fidelity, source preservation and actual school-environment acceptance remain
in force.

## Applying the guidance

For a proposed customisation, first check whether supported defaults meet the
user need. If they do not, explain the difference and use the smallest supported
extension that meets the agreed behaviour. If coupling to implementation details
is unavoidable, identify that surface and its upgrade checks. A dependency upgrade
need not revalidate every library feature: select checks for the actual integration,
agreed requirements and known regressions, plus any new concerns from the upgrade.

Keep product assertions about visibility, readability and interaction distinct
from replaceable mechanisms. For example, selected text must be clearly visible in
both themes; a test can check the rendered result without making a particular CSS
selector or literal colour a permanent product requirement. Explicit owner-approved
appearance choices still apply until changed through the existing workflow.

Evaluate tool replacements by responsibilities gained and removed, including
build/development configuration and upgrade work. Consolidate shared inputs where
practical; check unavoidable copies consumed by external tools. Format source for
review and let the build minimise production assets. Preserve meaningful regression
tests instead of growing or deleting tests to meet a numerical target.

## CodeMirror theme boundary (#42)

The app resolves System/Light/Dark and passes the resolved mode to a CodeMirror
compartment. Reconfiguration changes only the theme extension; it preserves the
editor instance, document, selection and undo history. Syntax styling uses six
semantic tag groups from the already locked Lezer highlighting package, declared
as a direct dependency because application code now imports it.

Editor appearance is owned in `src/editor-theme.js` through documented theme
selectors. No generated CodeMirror class names or upstream hex-colour mapping are
used. The Python literal/comment bracket policy is unchanged and remains #43.

| Cue | Native comparison and resulting choice |
| --- | --- |
| Cursor and active-line gutter | Native light/dark cues are sufficient once CodeMirror receives the correct mode. Removed our colour overrides. |
| Selection and current line | Native dark selection/current-line fills are visually close in this app palette. Retain the owner-approved #38 selection fill and low-alpha current line, verified by rendered-pixel regression. |
| Gutter surface, type and layout | Keep app palette, readable font, padding and bounded scrolling. These integrate the editor with the existing panels. |
| Keyboard focus | Keep the padded outer editor focus border; suppress only the duplicate inner outline. |
| Brackets | Native translucent fills remain. Retain thin boundary outlines and the mismatch underline to distinguish cues without relying on colour alone. |

These retained choices use the supported theme API rather than `!important`
stylesheet overrides. The focused selection selector matches the specificity of
CodeMirror's documented selection-layer structure; regression checks cover actual
rendered selection in both modes and after blur. Visual comparisons are reviewed
locally before merge; this record does not introduce new product behaviour.

## Runtime metadata and generated assets (#44)

The exact Pyodide dependency in package.json owns the runtime version.
`runtime-config.js` derives the served path and declares deployed-file SHA-256
pins; packaging and the browser network audit consume the same metadata. Vite inserts
only the derived path into the client, keeping package/tooling metadata out of the
browser bundle. The
installed package must match the declared version. Per-file pins remain an
intentional second check beyond npm archive integrity: unexpected deployed bytes
fail the build before previous generated output is changed.

Only the named runtime assets inside numeric release directories under
`public/runtime/` are owned generated files. Packaging removes those assets from
previous/current versions, removes empty directories, then writes verified inputs.
It preserves unrelated files, credentials, notices and licences; it refuses numeric
version-directory symlinks rather than following them. Unrelated files are not
classified as obsolete generated runtime content. Vite regenerates dist normally.

For an upgrade, deliberately update the exact package dependency and npm lockfile,
review/update file pins and runtime licence notices, then build and run runtime
and browser regressions. There is no separate path/version literal to update.
A clean build and a build with prior generated releases must contain the same
runtime assets. This cleanup does not upgrade Pyodide or change worker/input/Stop.
