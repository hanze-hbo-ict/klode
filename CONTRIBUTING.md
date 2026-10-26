# Contributing to Klode

Welcome! Start with a [GitHub issue](https://github.com/hanze-hbo-ict/klode/issues)
for a bug, suggestion or proposed change. For a bug, include the browser/version,
a minimal Python example, what happened and what you expected. Please avoid
including private student work or credentials.

## From an idea to a change

1. Agree the problem and scope with the human product owner. GitHub issues track
   work, decisions and handoffs; specifications in Git define the agreed product
   behaviour. Update the applicable specification before implementing changed
   behaviour. Do not silently change acceptance criteria.
2. Take a bounded work item with its specification commit, allowed scope,
   acceptance criteria, inputs, deliverables and stop conditions. Work in an
   isolated branch/worktree, rather than on `main`. Coordinate shared files and
   interfaces before parallel work.
3. Implement the agreed change and run relevant checks. Open a PR linking the
   issue, explaining the resulting behaviour, evidence and remaining limitations.
   Report blockers and rationale on the issue; return new product choices to the
   product owner.
4. An independent reviewer checks the specification, diff and evidence without
   writing the implementation being reviewed. Address findings within the agreed
   scope and record the reviewed commit and results.
5. An authorised human decides merge once required checks pass. Any authorised
   colleague may merge any PR, including their own; no separate second-person
   GitHub approval is required. Agents merge only on explicit human instruction.
   Human merge approval authorises publication of that approved version. Verify
   the deployment; failing release checks stop publication and are reported.

These are entry points to the existing agreements, not a separate process.
Read [AGENTS.md](AGENTS.md), the [workflow and roles](docs/workflow.md), the
[constitution](.specify/memory/constitution.md) and the applicable
[product/feature specifications](specs/product.md) before working. Agent handoffs
name the role, issue, specification version, scope, evidence and next responsible
role. Reviewers form their own judgment from those inputs.

Use English for agent instructions, issues, PRs, reviews, documentation and other
project artifacts. Direct conversation with the current product owner remains
Dutch. Existing Dutch artifacts are being addressed separately in
[issue #8](https://github.com/hanze-hbo-ict/klode/issues/8); preserve their meaning
and open questions when translating. UI language is a separate product decision.

## Design and maintenance

Apply constitution principles III–IV; see [design decisions](docs/design-decisions.md)
for examples and current follow-ups. For nontrivial tool choices or custom deviations,
link a concise rationale in the existing issue/design/PR: user benefit, why defaults
are insufficient, maintenance coupling and relevant checks. Do not create another
approval document. Preserve agreed behaviour, keep source readable and choose
checks for requirements and demonstrated defects. The existing review and human
gates apply.

## Development and checks

Use the Node/npm versions in [.node-version](.node-version) and
[package.json](package.json):

```bash
npm ci
npm run dev
npm test
npm run build
npm run test:browser
```

Choose checks relevant to the change and include their results in the PR. Browser
tests use pinned `playwright-core` and an installed Chrome/Edge executable; set
`CHROME_BIN=/path/to/browser` when it is not `/opt/google/chrome/chrome`. They start
local preview servers on ports 4275–4276 and do not download a browser.
Unit tests live in `tests/unit/`, browser regressions in `tests/browser/`, and
shared test helpers in `tests/support/`. Build before running the browser suite.

For specification tooling, use Python 3.11+ and uv:

```bash
uv sync --locked
uv run --locked specify version
uv run --locked specify check
```

See [development tooling](docs/development.md) for setup and Spec Kit usage, and
[hosting and release verification](docs/hosting.md) for deployment checks.
Spec Kit does not replace the project's role boundaries or human merge gate.
Distinguish local/browser checks from actual restricted school-laptop acceptance;
one does not prove the other.
