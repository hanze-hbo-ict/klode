# Development environment

Use Python satisfying the Python requirement in [pyproject.toml](../pyproject.toml) and `uv`. `pyproject.toml` manages development tooling;
Klode currently has no Python application package. The editor runs as a
JavaScript/Pyodide application in the browser.

Spec Kit is pinned to `specify-cli==1.2.2`. The lockfile records transitive
dependencies.

## Installation and checks

```bash
uv sync --locked
uv run --locked specify version
uv run --locked specify check
```

Do not install a global copy of the CLI for this project. If the default uv cache
is not writable in a sandbox, use a local cache:

```bash
uv --cache-dir .uv-cache run --locked --offline specify version
```

The offline route requires an installed environment or a populated cache.

## Using Spec Kit

The integration was generated with the bundled templates from version 1.2.2:

```bash
uv run --locked specify init /tmp/codeklad-speckit-stage \
  --integration codex --script sh --non-interactive
```

The `.specify` and `.agents` directories were then copied into Klode without
overwriting existing project files. The constitution template was filled with
the previously confirmed project agreements. Init metadata and manifests preserve
the provenance of generated files. The staging directory was only for bootstrap;
use an empty directory for subsequent generation.

Start Codex from Klode to discover the project skills in `.agents/skills`.
Relevant commands in the agent conversation are:

- `$speckit-constitution`: maintain the project principles.
- `$speckit-specify`: draft a feature specification.
- `$speckit-clarify`: clarify open questions.
- `$speckit-plan`: create a technical plan.
- `$speckit-tasks`: break a plan into tasks.
- `$speckit-analyze`: assess consistency between artifacts.
- `$speckit-implement`: execute an assigned implementation.
- `$speckit-converge`: identify remaining work.

Skills may become visible in an ongoing agent session only after a restart.
CLI commands are terminal commands; the skills above are not.

## Alignment with our workflow

Read `AGENTS.md`, `docs/workflow.md` and the project principles before use.
`specs/product.md` remains the product overview. Spec Kit normally places features
under `specs/<number>-<name>/`. The current editor specification is
`specs/001-python-editor/spec.md`; unresolved product questions remain explicit.

GitHub issues remain authoritative for work status and handoffs. A `tasks.md`
decomposes work under the specification; link tasks to work items once GitHub is
available. Implement only within the assigned role and scope. The bundled
`speckit` workflow does not implement our role loop, independent review or human
merge gate. Do not use it as a replacement for those agreements.

For upgrades, deliberately change the dependency and lockfile, generate in an
empty temporary directory and review differences before adoption. Preserve the
project's own principles and process agreements.

## Current status

CLI 1.2.2, Codex skills, templates and Bash scripts are available locally.
Bootstrap was merged through PR #5. The `Tooling` workflow checks the development
environment and bundled Spec Kit files. See
[branch protection and checks](branch-protection.md) for the configuration and
limitations of the merge gate.

The public editor is live at https://klode.app/. See
[hosting and release verification](hosting.md) for Netlify configuration and
remaining operational/school-environment checks, and [CONTRIBUTING](../CONTRIBUTING.md)
for the contributor workflow.
