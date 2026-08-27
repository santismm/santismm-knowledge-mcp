---
id: HRN-013
title: Glossary
domain: Harness
category: Reference
status: Draft
author: Santiago Santa María
created: 2026-06-21
updated: 2026-06-21
summary: A canonical glossary of Harness Engineering and agentic-systems terminology—harness, agent, tool, orchestration, evaluation, span, RAG, MCP, guardrail, and more—with crisp, citable definitions.
evidence_level: theoretical
confidence_level: high
source_type:
  - industry_observation
related:
  - HRN-001
tags:
  - glossary
  - reference
  - terminology
---

# Glossary

## Executive Summary

This glossary is the canonical reference for terms used across the Harness Engineering handbook and the wider Santismm Knowledge Platform. Definitions are crisp, machine-extractable, and intended to be cited directly. Where a term has a dedicated chapter, the entry points to it.

## Definition

The following are the canonical definitions of terms used throughout this corpus. Terms are grouped for readability; within groups they are roughly ordered from foundational to specialized.

### Core concepts

- **Agent:** a system that uses a language model in a loop to pursue a goal, deciding which actions (tool calls) to take based on observations until a stopping condition is met.
- **Agentic system:** a software system whose behavior is driven by one or more agents, including all the surrounding scaffolding required to make them reliable.
- **Harness:** the engineered scaffolding around a model — memory, tools, planning, orchestration, observability, evaluation, governance, and security — that turns a raw model into a reliable agentic system.
- **Harness Engineering:** the emerging discipline responsible for building reliable agentic systems for enterprise environments by designing and operating the harness.
- **Model / LLM:** the underlying large language model that performs reasoning and generation; in the harness it is treated as a powerful but non-deterministic, manipulable component.
- **Autonomy gradient:** the spectrum of control modes from fully autonomous to human-in-the-loop, assigned per action class by policy.
- **Blast radius:** the maximum harm an action (or a compromised agent) can cause; a core quantity to bound.

### Tools and actions

- **Tool:** a function or capability the agent can invoke to observe or affect the world (search, code execution, API call, database query).
- **Tool call / function call:** a structured request from the model to invoke a tool with arguments.
- **Effector:** a tool that produces a side effect in an external system (sends, writes, transfers).
- **Idempotency:** the property that performing an operation multiple times has the same effect as performing it once; essential for safe retries and resumes.
- **Side effect:** an externally visible change produced by a tool call.
- **Allowlist:** an explicit set of permitted items (tools, egress destinations); the safe default for security-sensitive choices.

### Memory and context

- **Context window:** the bounded span of tokens the model can attend to in a single inference.
- **Memory:** the harness layer that persists and retrieves information across steps and sessions (short-term, long-term, episodic, semantic).
- **RAG (Retrieval-Augmented Generation):** supplying the model with relevant retrieved content at inference time so its output is grounded in a corpus rather than parametric memory alone.
- **Embedding:** a vector representation of text used for semantic similarity search in retrieval.
- **Vector store:** a database optimized for nearest-neighbor search over embeddings.
- **Grounding:** anchoring generated claims in retrieved, citable evidence.
- **Context engineering:** the practice of deciding precisely what information enters the context window for each step.

### Planning

- **Goal:** the desired end-state with explicit success criteria.
- **Plan:** an ordered or partially-ordered set of tasks expected to achieve a goal.
- **Decomposition:** breaking a goal into sub-tasks (see PAT-010, HRN-009).
- **DAG (Directed Acyclic Graph):** a plan representation that captures task dependencies and exposes parallelism.
- **Replanning:** revising a plan in response to failure, new information, or changed constraints.
- **Termination criteria:** the budgets and conditions (steps, time, cost) that stop an agent safely.

### Orchestration

- **Orchestration:** the harness layer that drives execution across agents and tools (see HRN-010).
- **Topology:** the arrangement of agents — single, pipeline, supervisor/worker, or network.
- **Supervisor (orchestrator) agent:** an agent that plans and delegates to worker agents (see PAT-002).
- **Worker agent:** a specialized agent that executes a delegated sub-task (see PAT-005).
- **Routing:** selecting the next agent, tool, or branch based on state.
- **Handoff:** transfer of control and context from one agent to another.
- **State machine:** an explicit graph of states and governed transitions controlling execution.
- **Durable execution:** workflow semantics where progress is checkpointed and resumable across failures.
- **Saga:** a sequence of operations with compensating actions to undo partial work on failure.

### Governance and security

- **Governance:** the runtime harness layer enforcing policy, approvals, and guardrails (see HRN-008).
- **Policy-as-code:** governance rules expressed in a declarative, versioned, testable format.
- **PEP / PDP:** Policy Enforcement Point (intercepts actions) and Policy Decision Point (evaluates policy).
- **Guardrail:** a runtime check on inputs or outputs that constrains agent behavior.
- **Approval gate:** a control that suspends execution pending a human or higher-authority decision (see PAT-001).
- **Least privilege:** granting each agent the minimum permissions required for its task.
- **Agent identity:** a distinct, attributable, scoped, revocable principal for each agent.
- **Prompt injection:** untrusted content that hijacks an agent's instructions or goals.
- **Indirect prompt injection:** injection delivered via data the agent retrieves.
- **Data exfiltration:** unauthorized egress of sensitive data through agent outputs or tool arguments.
- **Lethal trifecta:** the dangerous combination of private-data access, untrusted-content exposure, and external communication ability.
- **Sandbox:** an isolated, resource- and network-constrained environment for executing untrusted tools/code.
- **DLP (Data Loss Prevention):** controls that detect and block sensitive data in outbound payloads.

### Observability and evaluation

- **Observability:** the harness layer that makes agent behavior inspectable via traces, logs, and metrics (see HRN-006).
- **Trace:** the end-to-end record of a single agent run.
- **Span:** a single timed unit of work within a trace (one tool call, one model call), the building block of distributed tracing.
- **Evaluation (eval):** the systematic measurement of agent quality, safety, and reliability (see HRN-007).
- **LLM-as-judge:** using a model to score another model's outputs against a rubric.
- **Groundedness:** the degree to which generated claims are supported by provided evidence.
- **Regression suite:** a fixed set of evaluation cases run on every change to catch quality regressions.
- **Eval-driven development:** building and changing agents against a measurable evaluation harness.

### Protocols and standards

- **MCP (Model Context Protocol):** an open protocol for connecting models/agents to tools and data sources through a standardized interface.
- **Tool schema:** the typed declaration of a tool's name, arguments, and description that the model uses to call it.
- **llms.txt:** a proposed convention for a site-level Markdown file that surfaces a curated, agent-friendly index of content.
- **JSON-LD:** structured data format used to make documents machine-readable in the discovery layer.
- **NIST AI RMF / ISO 42001 / EU AI Act:** the principal AI risk, management-system, and regulatory frameworks an enterprise harness must satisfy (see HRN-014, GOV-001).

## FAQs

**Q: Where do I cite a definition from?**
A: Cite the term by name plus `HRN-013`. Where a term has a dedicated chapter, prefer citing that chapter for depth.

**Q: A term I need is missing — what do I do?**
A: Add it here in the appropriate group with a crisp one-sentence definition, and link the dedicated chapter if one exists.
