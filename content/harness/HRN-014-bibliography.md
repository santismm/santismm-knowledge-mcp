---
id: HRN-014
title: Bibliography
domain: Harness
category: Reference
status: Draft
author: Santiago Santa María
created: 2026-06-21
updated: 2026-06-21
summary: A curated, themed reading list for Harness Engineering—agents and orchestration, evaluation, security, governance and standards, and protocols—covering foundational papers, industry writeups, and regulatory frameworks.
evidence_level: theoretical
confidence_level: high
source_type:
  - industry_observation
  - paper
related:
  - HRN-001
  - GOV-001
tags:
  - bibliography
  - reference
  - reading-list
  - standards
---

# Bibliography

## Executive Summary

This bibliography is the curated reference list underpinning the Harness Engineering handbook. It is organized by theme so a reader can go deep on any single layer. Entries are real, well-known works and standards. Where exact citation details (DOIs, page numbers) are not asserted here, the title and venue/source are given without fabricating identifiers; readers should confirm current versions of evolving standards.

## Definition

The following references are grouped by theme. They are the primary sources the handbook draws on and the recommended starting points for further study.

### 1. Foundations of agents and reasoning

- Yao, S. et al. **"ReAct: Synergizing Reasoning and Acting in Language Models."** ICLR. The reasoning-and-acting interleaving that underpins tool-using agents.
- Wei, J. et al. **"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models."** NeurIPS. Foundational to step-by-step reasoning.
- Schick, T. et al. **"Toolformer: Language Models Can Teach Themselves to Use Tools."** NeurIPS.
- Shinn, N. et al. **"Reflexion: Language Agents with Verbal Reinforcement Learning."** NeurIPS. The reflection/self-critique loop (cf. PAT-003).
- Wang, L. et al. **"A Survey on Large Language Model based Autonomous Agents."** A broad survey of the agent design space.
- Wang, X. et al. **"Plan-and-Solve Prompting."** ACL. Plan-then-execute decomposition.

### 2. Orchestration, multi-agent, and durable execution

- Anthropic. **"Building Effective Agents."** Engineering guidance on workflows vs. agents and single-agent-first design.
- Anthropic. **"How we built our multi-agent research system."** Practical supervisor/worker orchestration writeup.
- LangChain. **LangGraph documentation** — state-machine orchestration for agents.
- Temporal / durable-execution engines. **Documentation on workflow durability and the Saga pattern.**
- Microsoft / AutoGen. **"AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation."** Multi-agent conversation framework.
- Hong, S. et al. **"MetaGPT: Meta Programming for Multi-Agent Collaborative Framework."**

### 3. Memory and retrieval (RAG)

- Lewis, P. et al. **"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks."** NeurIPS. The canonical RAG paper.
- Gao, Y. et al. **"Retrieval-Augmented Generation for Large Language Models: A Survey."**
- Packer, C. et al. **"MemGPT: Towards LLMs as Operating Systems."** Memory hierarchy and paging for agents.
- Asai, A. et al. **"Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection."**

### 4. Evaluation

- Liang, P. et al. **"Holistic Evaluation of Language Models (HELM)."** Stanford CRFM.
- Zheng, L. et al. **"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."** The LLM-as-judge methodology and its biases.
- Es, S. et al. **"RAGAS: Automated Evaluation of Retrieval Augmented Generation."** Groundedness and faithfulness metrics.
- Liu, Y. et al. **"G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment."**
- **SWE-bench** and **GAIA** — agentic capability benchmarks for software and general assistance tasks.

### 5. Security for agentic systems

- OWASP. **"OWASP Top 10 for Large Language Model Applications."** Including LLM01 Prompt Injection and LLM06 Sensitive Information Disclosure.
- Willison, S. **"Prompt injection"** and **"The lethal trifecta for AI agents"** (blog essays). The clearest articulation of the architectural injection/exfiltration problem.
- Greshake, K. et al. **"Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection."**
- MITRE. **ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems).**
- NIST. **SP 800-53** (security and privacy controls; least privilege, identity) as adapted for AI systems.

### 6. Governance, risk, and regulatory standards

- NIST. **AI Risk Management Framework (AI RMF 1.0)** and the **Generative AI Profile.**
- ISO/IEC. **42001:2023 — Artificial intelligence — Management system.**
- ISO/IEC. **23894:2023 — AI — Guidance on risk management.**
- European Union. **Regulation (EU) 2024/1689, the EU AI Act** — risk-tiered obligations for AI systems.
- OECD. **OECD AI Principles.**
- US White House / OMB. **Executive and management guidance on trustworthy AI** (for context on public-sector expectations).
- See also GOV-001 (Enterprise AI Governance Framework) and GOV-005 (Agent Governance Controls Checklist) in this corpus.

### 7. Protocols, interoperability, and the discovery layer

- Anthropic. **Model Context Protocol (MCP) specification** — standardized model-to-tool/data interface.
- **llms.txt** proposal — a site-level convention for agent-friendly content indexing.
- **JSON-LD / schema.org** — structured data for machine discovery.
- **OpenAPI Specification** — typed contracts for tools exposed as APIs.

### 8. Authorization and policy enforcement (adapted from systems engineering)

- OASIS. **eXtensible Access Control Markup Language (XACML)** — the PEP/PDP authorization model.
- **Open Policy Agent (OPA) / Rego** — policy-as-code engine.
- Saltzer, J. & Schroeder, M. **"The Protection of Information in Computer Systems."** Origin of the least-privilege principle.

## FAQs

**Q: Why are some entries missing DOIs or exact dates?**
A: To avoid fabricating identifiers. Titles and venues/sources are given so the work is unambiguously locatable; confirm the current version, especially for evolving standards (EU AI Act, NIST AI RMF, MCP, OWASP).

**Q: How does this relate to GOV-001?**
A: GOV-001 operationalizes the governance and regulatory sources in sections 5–6 into an enterprise framework; this bibliography is the underlying reading list.

**Q: Where should a newcomer start?**
A: Section 1 (ReAct, Reflexion) for how agents work, section 2 (Building Effective Agents) for how to engineer them reliably, and sections 5–6 for security and governance.
