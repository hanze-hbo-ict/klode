# Working on Klode

## Working language

Use English for agent instructions, task handoffs, project documentation,
specifications, plans, tasks, GitHub issues, PRs, reviews and work reports.
Direct conversation with the human product owner remains Dutch.
The English migration is tracked in GitHub issue #8; preserve meaning and open
questions when translating any remaining artifacts. This agreement
does not determine the application's user-interface language.

## Human merge authority

Misja or any authorised human colleague with sufficient repository rights may
merge any PR, including their own, once required checks pass. No separate
second-person GitHub approval is required. Independent agent review remains part
of the workflow. Agents execute merges only on explicit human instruction.

Read `docs/workflow.md` and the applicable specification before doing work.
The project principles are in `.specify/memory/constitution.md`; the local
Spec Kit integration and its usage are documented in `docs/development.md`.
The human product owner determines scope and desired behaviour and decides merge.
Merge approval authorises publication of the approved version.

The orchestrator creates work items from conversations with the product owner and
coordinates isolated agent tasks. Each task names the specification version, scope,
acceptance criteria, inputs, deliverables and stop conditions. Use a separate
branch/worktree for development tasks. Reviewers do not contribute to the change
they review and form an independent judgment.

GitHub issues are work items; specifications in Git describe the agreed product
behaviour. Report blockers, rationale and handoffs on the issue. Do not change
acceptance criteria or product agreements without a product-owner decision.
Do not work directly on `main`, merge autonomously or publish before the human
gate. Do not implicitly adopt process rules from other repositories.
