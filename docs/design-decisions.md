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
| Syntax highlighting | Map semantic categories such as keywords and strings to a deliberate theme. Mapping another theme's exact hex values ties semantics to upstream presentation. | Existing implementation remains; semantic theming/dark-mode integration is #42. |
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
