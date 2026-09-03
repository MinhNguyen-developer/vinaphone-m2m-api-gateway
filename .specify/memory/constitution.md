<!--
Sync Impact Report
Version change: unversioned placeholder -> 1.0.0
Modified principles:
- I. Code Quality and Domain Clarity
- II. Test-First Verification
- III. User Experience Consistency
- IV. Performance Budgets and Efficient Data Access
- V. Reliability, Observability, and Safe Change Control
Added sections:
- Quality Gates and Testing Standards
- Experience and Performance Standards
Removed sections:
- None
Templates reviewed:
- ✅ .specify/templates/plan-template.md reviewed; no edits needed
- ✅ .specify/templates/spec-template.md reviewed; no edits needed
- ✅ .specify/templates/tasks-template.md reviewed; no edits needed
- ✅ .github/agents/speckit.constitution.agent.md reviewed; no edits needed
- ✅ .github/workflows/prompts/speckit.constitution.prompt.md reviewed; no edits needed
Follow-up TODOs:
- None
-->

# Vinaphone M2M API Gateway Constitution

## Core Principles

### I. Code Quality and Domain Clarity

All application logic MUST be organized around explicit domain concepts, not ad hoc
controller code or duplicated mapping logic. Services own business rules, controllers
stay thin, and reusable transformations between Vinaphone payloads, database entities,
and dashboard DTOs must live in named modules with strict TypeScript types. Any use of
`any`, untyped external payloads, or implicit mutation requires a documented boundary
adapter and a clear reason. The goal is simple: make every change easy to reason about,
review, and regression-test.

### II. Test-First Verification

Behavioral changes MUST be accompanied by tests that fail before implementation. Every
bug fix MUST add a regression test; every new endpoint, sync flow, or state transition
MUST have coverage for the success path and the relevant failure path. Unit tests cover
pure logic, integration tests cover controller/service/database boundaries, and
end-to-end tests protect critical API journeys. Tests MUST assert user-visible behavior
and contract shape, not implementation details.

### III. User Experience Consistency

Externally visible names, statuses, and response shapes MUST remain consistent across the
API, docs, and dashboard. A domain term introduced in one place must use the same label
everywhere unless a migration plan explicitly renames it. New or changed endpoints MUST
preserve backward compatibility or be versioned deliberately, and error responses MUST
be normalized so the dashboard can render predictable empty, loading, and failure states.
Inconsistent vocabulary or status mapping is treated as a defect, not a styling choice.

### IV. Performance Budgets and Efficient Data Access

Every feature that touches list views, sync jobs, or upstream lookups MUST declare a
measurable performance budget before it ships. List endpoints MUST paginate, queries MUST
select only the fields they need, and hot paths MUST avoid N+1 database access and
repeated upstream calls. Background sync and bulk operations MUST be batched,
timeout-bound, and safe to retry so they cannot block normal API traffic. Performance
regressions are defects when they increase latency, fan-out, or database load without a
documented justification.

### V. Reliability, Observability, and Safe Change Control

Any change that can affect auth, sync, billing-adjacent counts, or persisted SIM state
MUST be traceable in logs and recoverable in production. Structured logs, meaningful error
context, and idempotent mutation patterns are required for background jobs and external
integrations. Breaking schema, contract, or state changes MUST include a migration path,
rollback plan, and explicit compatibility notes. If a change cannot be safely observed or
reversed, it is not ready to merge.

## Quality Gates and Testing Standards

All pull requests MUST pass the repository's standard checks before merge: `npm run lint`,
`npm run test`, and `npm run test:e2e` when behavior spans HTTP flows or database state.
Significant logic changes SHOULD also run `npm run test:cov` so coverage drops are visible
rather than accidental. Tests for new features MUST be added alongside the code, and fixes
for production bugs MUST include a regression test that proves the bug cannot reappear
quietly.

Code review MUST reject changes that hide business rules in controllers, rely on untyped
external data without validation, or introduce mocks where a real boundary test is more
appropriate. Database migrations and seed changes MUST be accompanied by validation that
the new schema is compatible with the current application paths or by an explicit migration
note.

## Experience and Performance Standards

Dashboard-facing API changes MUST preserve consistent terminology, stable field names, and
predictable status semantics so the UI can show the same meaning everywhere. Any
user-facing loading, empty, or error state should be supported by the API contract rather
than inferred from brittle client-side conventions. Copy, labels, and status badges should
be updated together when a domain term changes.

Performance expectations MUST be explicit in each meaningful spec, plan, or pull request.
List endpoints default to pagination, batch jobs default to incremental processing, and
upstream-dependent operations default to caching or throttling when repeated reads are
likely. If a new feature creates measurable latency, query-count growth, or memory
pressure, the change MUST document the budget and the mitigation.

## Governance

This constitution overrides conflicting conventions in READMEs, templates, and
implementation notes. If a proposed change conflicts with these principles, the
constitution wins until it is formally amended.

Amendments require a written rationale, a semantic version bump, and an updated ratification
date. MAJOR versions are reserved for incompatible principle changes or removals, MINOR
versions for new principles or materially expanded guidance, and PATCH versions for
clarifications or wording fixes. The current version is 1.0.0, ratified on 2026-07-21, and
last amended on 2026-07-21.

Every spec, plan, and task set generated for this repository MUST include an explicit
constitution check. Reviewers MUST block merges that violate the quality, testing, UX
consistency, or performance rules above unless the pull request also documents the
exception and the mitigation plan.

**Version**: 1.0.0 | **Ratified**: 2026-07-21 | **Last Amended**: 2026-07-21
