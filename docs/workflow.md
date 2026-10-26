# Workflow

## Working language

The product owner decided on 2026-10-22 that English is the working language
for agents and project artifacts: instructions, handoffs, documentation,
specifications, plans, tasks, issues, PRs, reviews and work reports. Direct
conversation between the product owner and assistant remains Dutch.

Apply this agreement to new work immediately. Existing Dutch artifacts and
templates will be corrected separately under
[issue #8](https://github.com/hanze-hbo-ict/klode/issues/8). Preserve decisions,
requirements, acceptance criteria and unresolved questions when translating.
Historical comments and closed work items may remain in their original language.
The application's user-interface language is a separate product decision.

## Human merge decision

Misja or any other authorised human colleague with sufficient repository rights
may merge any PR, including one created under their own account. Required checks
and other branch protection rules must pass; a separate GitHub approval by a
second person is not required. Independent agent review remains part of the
workflow. An agent may execute a merge on explicit human instruction, and must
not merge autonomously. This clarification was confirmed on 2026-10-22 (#2).

## Responsibilities

The product owner is a human: Misja or a colleague. The orchestrator helps clarify
wishes, creates work items and tracks progress, dependencies and handoffs. The
developer implements a bounded task. The independent tester/reviewer assesses
the result against the specification. The release manager checks readiness,
publishes after the human gate and verifies the deployment. Concrete tooling for
these roles still needs to be established.

## Workflow

1. The product owner and orchestrator record the desired behaviour and scope.
2. The orchestrator creates a GitHub issue with specification references, scope,
   acceptance criteria, dependencies and expected deliverables.
3. The developer works in a separate branch/worktree and delivers a PR with
   relevant checks and a link to the issue.
4. An independent tester/reviewer reports findings and evidence.
5. The orchestrator routes fixes within existing agreements back to the appropriate
   role. Product choices and scope changes go to the product owner.
6. The product owner reviews the concrete PR and decides merge.
7. Merge approval authorises publication. The release manager checks that the
   approved version is published and verifies the result. Failing checks stop
   publication and lead to a report back.

## Handoffs and isolation

Each task names the role, issue, specification version/commit, inputs, allowed
changes, acceptance criteria, expected result and stop conditions. Give reviewers
the specification, diff and verifiable results; their judgment must not depend on
the implementation conversation. Parallel work requires explicit agreements about
shared interfaces and files.

A handoff names the reviewed commit, checks performed, results, remaining
uncertainties and the next responsible role. A blocker includes the problem,
evidence, impact and, where possible, options or a concrete decision question.
Fix rounds are bounded by the task; repeated lack of progress is escalated to
the product owner.

## Sources and maintenance

Specifications in Git describe product behaviour. Issues track work, rationale
and decisions. PRs contain changes and verification. Record decisions that change
product behaviour in the specification as well. A substantial scope change
requires a human decision before dependent implementation continues.

A PR for the human gate describes the problem, result, demonstrated acceptance
criteria, limitations and a preview where appropriate. Distinguish successful
local checks from checks in the actual exam environment.

Spec Kit 1.2.2 is installed locally with the Codex integration. The project
principles are in `.specify/memory/constitution.md`. Task files decompose work
under the specification; GitHub issues are authoritative for work status and
handoffs. The bundled workflow does not implement our role loop: the orchestrator
guards role boundaries and the human gate. These agreements also apply when a
Spec Kit command suggests otherwise.
