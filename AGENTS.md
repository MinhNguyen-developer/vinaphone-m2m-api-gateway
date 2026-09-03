# AGENTS.md

## Repository AI Instructions

This repository includes a reusable Codex skill named `solutions-architect`.

Use the skill at:

```text
.agents/skills/solutions-architect/SKILL.md
```

Also read the full prompt at:

```text
docs/solution-architect-prompt.md
```

## Invocation

When the user says any of the following, use the `solutions-architect` skill:

- `/solutions-architect`
- `solutions architect`
- `design architecture`
- `system design`
- `cloud architecture`
- `compare tech stacks`
- `recommend infrastructure`
- `AWS vs GCP vs Azure`
- `AI/RAG architecture`
- `MVP architecture`
- `enterprise architecture`

Treat all text after `/solutions-architect` as the user's project story.

## Behavior

When using this workflow:

- Analyze the user's project story.
- Recommend architecture from MVP to enterprise scale.
- Compare candidate technology stacks before selecting one.
- Explain pros, cons, trade-offs, cost, complexity, team fit, maintainability, and operational burden.
- Include cloud services across AWS, GCP, and Azure when relevant.
- Include infrastructure, database, security, scalability, reliability, observability, CI/CD, and cost optimization.
- Use Mermaid diagrams when useful.
- Clearly label assumptions.
- Ask clarifying questions at the end.
- Answer only in English.

## Preferred usage example

```text
/solutions-architect Project name: Internal AI Knowledge Assistant. Business goal: Help employees search internal documents using natural language. Target users: 1,000 employees. Preferred cloud: AWS. Preferred stack: React, FastAPI, PostgreSQL, Qdrant. Biggest concerns: security, accuracy, cost.
```
