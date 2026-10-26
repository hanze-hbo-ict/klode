# Klode Constitution

## Core Principles

### I. Simplicity and exam use

Klode provides a minimal programming environment without AI assistance.
The first version supports Python in one file, `main.py`, with an editor and
input/output. Other languages are outside this first version.

### II. Usability

The interface is responsive, including on smaller screens. The theme follows
the system and can be switched manually between light and dark.

### III. Maintainability

Prefer modern JavaScript and a simple build process. Evaluate a design by the code,
configuration and upgrade responsibilities the project owns, together with its
dependency costs. Compare the complete responsibilities of proven tooling with
those of a proposed custom replacement; dependency count alone is insufficient.

Start with supported library defaults and documented APIs. A custom deviation
must serve a concrete product or user need that the default does not meet. Prefer
stable semantic interfaces over presentation values or implementation details.
When such coupling is necessary, identify it and its upgrade checks in the design
rationale. Existing product requirements remain binding until the product owner
changes them; a preference for defaults does not override agreed behaviour.

Give shared configuration an authoritative source. Derive consumers where
practical and check consistency of unavoidable copies. Generated artifacts must
be reproducible from declared inputs and exclude obsolete generated content.
Keep source readable; apply production minification in the build where needed.

Python and uv currently manage development tooling; this does not require the
browser application to have a backend. Changes to agreed process tooling remain
separate from application cleanup.

### IV. Specification as agreement

Record desired behaviour, scope and observable acceptance criteria before
implementation. Keep the specification current after changes. Mark open questions
explicitly; a technical proposal is not a product decision.
`specs/product.md` contains the current starting points and open product questions.

Product acceptance criteria describe observable user behaviour. Put replaceable
implementation choices, such as CSS rules, literal colours and parser mechanics,
in design or verification rationale unless they are explicitly agreed product
requirements. This distinction does not weaken required accessibility, appearance,
keyboard behaviour or runtime constraints.

### V. Human product owner and independent roles

The product owner is a human. The orchestrator clarifies wishes, creates GitHub
work items and coordinates isolated tasks. Developer, tester/reviewer and release
manager have bounded responsibilities. A reviewer does not assess their own
implementation. Follow `docs/werkwijze.md` for the workflow, handoffs, blockers
and escalation.

## Work items and verification

GitHub issues represent work items and refer to the specification version, scope,
acceptance criteria and dependencies. Spec Kit tasks decompose work under the
specification; issues are authoritative for work status and handoffs.
Report checks with concrete results and the reviewed commit. Distinguish local
verification from verification in the actual exam environment. Choose checks
proportionate to the change and its risk. Preserve coverage of real requirements
and demonstrated defects; neither test volume nor assertions about incidental
implementation details are goals in themselves.

## Development and review

For a nontrivial dependency choice or custom deviation, include a concise rationale
in the existing issue, design or PR: the user benefit, why defaults are insufficient,
the added maintenance coupling and relevant verification. Reference an existing
rationale rather than repeating it. Use the established independent review and
human gates; this does not add a separate approval step for routine decisions.

## Governance

The product owner decides scope, desired behaviour and merge. Fixes within the
agreed scope may go back to a preceding role; product choices and scope changes
require a human decision. Record rationale on the issue and update changed
product agreements in the specification as well.

Human merge approval authorises publication of the approved version. Failing
release checks stop publication and lead to a report back. Spec Kit commands
and workflows do not replace these authorities and gates. Changes to these
principles require an explicit product-owner decision. Record each amendment's
scope, rationale and effect on existing agreements; independent review checks the
change and applicable guidance for consistency before the human merge decision.

Version amendments semantically: a major increment for incompatible removal or
redefinition of principles or governance, a minor increment for new or materially
expanded guidance, and a patch increment for non-semantic clarification. Preserve
the original ratification date and update the amendment date for substantive
changes. Reviewers assess changes against the applicable constitution version and
record justified deviations through the existing issue/specification workflow.

**Version**: 1.1.0 | **Ratified**: 2026-10-21 | **Last Amended**: 2026-10-26

Source: agreements confirmed by the product owner in the bootstrap conversation.

Amendment 1.0.1 records the product-owner-approved name Klode (2026-10-22).
That amendment changed no principles or governance; see issue #10.

English translation under issue #8 (2026-10-23) preserves version 1.0.1 and its
ratification/amendment dates; it introduces no change to the principles.

Amendment 1.1.0 (#41, parent #40) expands maintainability and specification guidance
following the 2026-10-26 review. It introduces no application behaviour change or
additional approval gate; existing accepted requirements and human authority remain
in force. Downstream simplification is tracked separately in #42–#45.
