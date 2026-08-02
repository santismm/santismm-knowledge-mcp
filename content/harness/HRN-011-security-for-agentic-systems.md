---
id: HRN-011
title: Security for Agentic Systems
domain: Harness
category: Security
status: Draft
author: Santiago Santa María
created: 2026-06-21
updated: 2026-06-21
summary: Security for agentic systems is the harness layer that defends against prompt injection, sandboxes tools and permissions, prevents data exfiltration, and enforces agent identity and least privilege across every action.
evidence_level: theoretical
confidence_level: medium
source_type:
  - industry_observation
  - personal_experience
related:
  - HRN-003
  - GOV-001
  - PAT-007
tags:
  - security
  - prompt-injection
  - least-privilege
  - sandboxing
  - data-exfiltration
  - agent-identity
---

# Security for Agentic Systems

## Executive Summary

Agentic systems expand the attack surface in a way traditional applications do not: the agent reads untrusted data, makes consequential decisions, and holds privileges to act — so a single compromised input can become a compromised action. Security for agentic systems is the harness layer that assumes the model can and will be manipulated, and engineers the surrounding scaffolding so that manipulation cannot cause harm. The governing principle is **least privilege with a constrained blast radius**: treat the model as an untrusted component, place security controls *outside* its persuadable surface, and ensure that even a fully hijacked agent can do only bounded, auditable damage.

## Key Concepts

- **Prompt injection:** untrusted content that hijacks the agent's instructions or goals.
- **Indirect prompt injection:** injection delivered via data the agent retrieves (documents, web pages, tool outputs).
- **Tool sandboxing:** isolating tool execution so it cannot exceed its intended authority.
- **Least privilege:** granting each agent the minimum permissions needed for its task.
- **Agent identity:** a distinct, attributable principal for each agent, scoped and revocable.
- **Data exfiltration:** unauthorized egress of sensitive data through tool outputs or rendered content.
- **Lethal trifecta:** the dangerous combination of access to private data, exposure to untrusted content, and the ability to externally communicate.

## Definition

> **Security for agentic systems** is the harness discipline of treating the model as an untrusted, manipulable component and engineering identity, permission, isolation, and egress controls so that the maximum harm any compromised agent can cause is bounded, attributable, and auditable.

## Architecture Diagram

```mermaid
flowchart LR
    UNT[Untrusted Inputs\nuser, web, docs, tool output] --> IG[Input Guardrails\ninjection detection]
    IG --> AGENT[Agent Reasoning Loop\n(treated as untrusted)]
    AGENT -->|proposed tool call| AUTH[AuthZ + Least Privilege\nagent identity, scoped creds]
    AUTH --> SBX[Tool Sandbox\nisolation, allowlist]
    SBX --> EFF[Effector / External System]
    EFF --> OG[Output / Egress Guardrails\nDLP, exfil checks]
    OG --> SINK[Allowed Destination]
    AUTH -.deny/quarantine.-> BLK[Block + Alert]
    AGENT --> AUD[(Immutable Audit Log)]
    AUTH --> AUD
    OG --> AUD
```

## Detailed Explanation

The foundational threat is **prompt injection**, and the foundational mistake is trying to solve it inside the model. No amount of system-prompt hardening reliably stops a sufficiently clever instruction embedded in retrieved content, because the model has no robust, principled boundary between "data" and "instruction." Indirect injection is the dangerous variant: an agent that summarizes a web page or reads a ticket can be commandeered by text the attacker planted there. The harness response is **architectural, not prompt-based**: assume injection will sometimes succeed, and ensure that a hijacked agent still cannot do anything its *permissions* forbid. Input guardrails (injection/jailbreak detection) reduce the *frequency* of successful injection; permission and egress controls bound the *consequence*. Both are required; neither alone suffices.

**Least privilege and agent identity** are the spine of agentic security. Each agent should run as a distinct, attributable principal with credentials scoped to exactly the resources its task requires — short-lived tokens, narrow OAuth scopes, read-only where writes aren't needed, and per-tenant data isolation enforced *below* the agent (in the data layer), never by asking the model nicely to stay in its lane. When an agent acts on behalf of a user, it should carry that user's authorization, not a god-mode service account, so the agent can never exceed what the user could do directly. Credentials must be injected by the harness at call time, never placed in the context window where injection could read and exfiltrate them.

**Tool sandboxing** isolates execution. Code-running tools execute in ephemeral, network-restricted, resource-capped sandboxes. Tool catalogs are **allowlisted** per agent, so a hijacked agent cannot reach a tool it was never granted. High-consequence tools sit behind human approval (PAT-007 / PAT-001) so that even an authorized-but-manipulated call requires a human to commit it. The principle is *defense in depth*: AuthZ decides *whether* a call is permitted, the sandbox bounds *what the call can touch*, and the approval gate adds a human checkpoint for irreversible actions.

**Data exfiltration** is the most under-appreciated agentic risk. The "lethal trifecta" — an agent with (1) access to private data, (2) exposure to untrusted content, and (3) the ability to communicate externally — is exploitable: injected instructions tell the agent to embed secrets into an outbound request, a rendered image URL, or a tool argument. The harness breaks the trifecta by removing at least one leg for sensitive contexts: restrict egress destinations to an allowlist, run data-loss-prevention checks on every outbound payload, strip or pin external content rendering, and forbid the agent from constructing arbitrary outbound URLs. If an agent must touch private data, its ability to communicate externally must be tightly constrained, and vice versa.

Underpinning all of it is **observability and auditability** (HRN-006): every action, the identity that performed it, the permission decision, and the egress check must be logged immutably. Security you cannot prove is security you do not have. These controls implement the obligations defined in the governance framework (GOV-001) and slot into the broader harness taxonomy (HRN-003).

## Production Evidence

> **Illustrative / representative scenario.** Evidence level: theoretical · Confidence: medium · Source: industry_observation, personal_experience. The descriptions below are representative attack/mitigation patterns, not measurements from one verified deployment.

- **Context:** A customer-support agent with access to a knowledge base and the ability to email customers.
- **Scenario:** An attacker plants injection text in a support ticket attempting to make the agent email another customer's account data to an external address.
- **Technology:** Per-agent scoped credentials, egress allowlist, DLP on outbound mail, injection detection on retrieved content, audit log.
- **Load:** High ticket volume; a small but nonzero fraction carry injection attempts.
- **Results (representative):** In deployments of this shape, the architectural controls (egress allowlist + DLP + least privilege) block the *consequence* of injection even when detection misses the *attempt*, reducing successful exfiltration toward zero while injection-detection alone leaves residual risk.

### Lessons Learned

Detection-only strategies fail eventually; the reliable defenses are the architectural ones that bound consequence. Breaking the lethal trifecta — especially constraining egress — does more for safety than any single classifier.

## Observed Failure Modes

| Failure Mode | Trigger | Mitigation |
|---|---|---|
| Direct prompt injection | Malicious user instruction | Input guardrails + permission bounding |
| Indirect injection | Malicious text in retrieved data | Treat all retrieved content as untrusted; egress controls |
| Data exfiltration | Lethal trifecta exploited | Break the trifecta: egress allowlist + DLP |
| Privilege escalation | Over-broad service credentials | Per-agent scoped, short-lived creds; user-delegated authZ |
| Credential leakage | Secrets in context window | Inject creds at call time, never in context |
| Sandbox escape | Unrestricted code/network in tools | Network-isolated, resource-capped ephemeral sandboxes |
| Confused deputy | Agent misused as a proxy for forbidden actions | Carry caller identity; authZ at the effector |

## KPIs

| Metric | Target | Notes |
|---|---|---|
| Successful exfiltration rate | → 0 | The metric that matters most |
| Injection detection recall | High | Reduces attempt frequency, not the sole defense |
| Permission scope tightness | Minimal grants | Audit for unused/over-broad permissions |
| Egress allowlist coverage | 100% | No arbitrary outbound destinations |
| Mean time to revoke | Low | Compromised agent identity revocation |
| Audit completeness | 100% | Every action attributable |

## Cost Metrics

- **Guardrail inference cost:** injection/DLP classifiers add auxiliary inference per request — budget in cost-per-task.
- **Sandbox overhead:** ephemeral sandbox spin-up adds latency to code tools; amortize with warm pools.
- **Engineering cost:** scoped identity and egress allowlisting are upfront IAM work that pays back across all agents.

## Scaling Characteristics

Permission and identity controls scale with the IAM/secrets infrastructure, statelessly per call. Guardrail classifiers scale with inference capacity and are the throughput cost; short-circuit with cheap deterministic checks (allowlists, regex, schema) first. Sandboxes scale with a managed pool; warm pools trade idle cost for latency. Egress controls scale trivially and should never be the bottleneck — they are the cheapest high-value control in the stack.

## Related Content

- HRN-003 — Security's place in the harness taxonomy.
- GOV-001 — Governance obligations that security controls implement.
- PAT-007 — Tool/permission control pattern (sandboxing and gated tool use).

## References

- OWASP Top 10 for LLM Applications (LLM01 Prompt Injection, LLM06 Sensitive Information Disclosure).
- Simon Willison, "The lethal trifecta for AI agents."
- NIST AI RMF and NIST SP 800-53 (least privilege, identity).
- MITRE ATLAS — adversarial threat landscape for AI systems.

## FAQs

**Q: Can prompt injection be fully prevented?**
A: No. Engineer for it: assume injection succeeds sometimes and bound the consequence with least privilege, egress control, and sandboxing.

**Q: What is the single highest-value control?**
A: Breaking the lethal trifecta — most cheaply by constraining egress to an allowlist with DLP — so a hijacked agent cannot exfiltrate data.

**Q: Should agents share a service account?**
A: No. Give each agent a distinct, scoped, short-lived identity, and have it carry the calling user's authorization so it can never exceed the user's own rights.
