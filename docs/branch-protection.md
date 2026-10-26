# Branch protection and checks

Work item: [#2](https://github.com/hanze-hbo-ict/klode/issues/2).
GitHub settings are authoritative for the current protection of this public repository.

## Required tooling check

The `Tooling` workflow runs on every PR and on pushes to `main`. Its
`Tooling checks` job installs the locked development tools on Python 3.11,
then validates JSON/TOML, 22 bundled Spec Kit hashes, Bash syntax, template
resolution and the Spec Kit tool check.

Run locally:

```bash
uv sync --locked
uv run --locked python scripts/check-tooling.py
uv run --locked specify check
```

Application tests and validation on an actual exam laptop follow during
implementation. Hosting and publication remain in issue #4.

## Main protection

On 2026-10-22 the product owner clarified that any authorised human collaborator
may merge any PR, including their own. A separate GitHub approval from a second
account is not required. The settings were updated and read back through the API:

- Require a PR, with zero required approving reviews.
- Do not require approval of the latest push or dismiss stale approvals.
- Apply the remaining rules to administrators as well (`enforce_admins=true`).
- Require `Tooling checks`, bound to GitHub Actions app 15368, on a branch
  that is up to date with `main`.
- Require resolved review conversations; disallow force-pushes and deletion.

Misja or another colleague with sufficient repository permissions may merge any
PR once these checks pass, regardless of its author. Repository permissions were
not changed. Optional GitHub reviews and independent agent reviews remain useful,
but a second human approval is not a prerequisite for merge.

The human merge decision remains required by `docs/workflow.md`. An agent may
execute a merge when explicitly instructed by an authorised human; it must not
merge autonomously. GitHub cannot distinguish a human from an agent using the
same account, so this part of the gate remains a process agreement.

Sources: [GitHub branch protection API](https://docs.github.com/en/rest/branches/branch-protection)
and [uv in GitHub Actions](https://docs.astral.sh/uv/guides/integration/github/).
