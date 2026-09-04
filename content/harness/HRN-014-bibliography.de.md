---
title: Literaturverzeichnis
summary: >-
  Eine kuratierte, thematisch gegliederte Leseliste für Harness Engineering –
  Agenten und Orchestrierung, Evaluierung, Sicherheit, Governance und Standards
  sowie Protokolle –, die grundlegende Arbeiten, Branchenberichte und
  regulatorische Rahmenbedingungen abdeckt.
---
# Bibliografie

## Management-Summary

Diese Bibliografie ist das kuratierte Referenzverzeichnis, das dem Handbuch für Harness Engineering zugrunde liegt. Sie ist nach Themen geordnet, sodass Leser tief in jede einzelne Ebene eintauchen können. Die Einträge sind reale, bekannte Werke und Standards. Wo genaue Zitierdetails (DOIs, Seitenzahlen) hier nicht angegeben sind, werden Titel und Veranstaltungsort/Quelle genannt, ohne Identifikatoren zu erfinden; Leser sollten die aktuellen Versionen sich weiterentwickelnder Standards überprüfen.

## Definition

Die folgenden Referenzen sind nach Themen gruppiert. Sie sind die Primärquellen, auf die sich das Handbuch stützt, und die empfohlenen Ausgangspunkte für weitere Studien.

### 1. Grundlagen von Agenten und Reasoning

- Yao, S. et al. **"ReAct: Synergizing Reasoning and Acting in Language Models."** ICLR. Die Verzahnung von Reasoning und Handeln (Reasoning-and-Acting), die die Grundlage für werkzeugnutzende Agenten bildet.
- Wei, J. et al. **"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models."** NeurIPS. Grundlegend für schrittweises Reasoning.
- Schick, T. et al. **"Toolformer: Language Models Can Teach Themselves to Use Tools."** NeurIPS.
- Shinn, N. et al. **"Reflexion: Language Agents with Verbal Reinforcement Learning."** NeurIPS. Die Reflexions-/Selbstkritikschleife (vgl. PAT-003).
- Wang, L. et al. **"A Survey on Large Language Model based Autonomous Agents."** Ein umfassender Überblick über den Designraum von Agenten.
- Wang, X. et al. **"Plan-and-Solve Prompting."** ACL. Planen-dann-Ausführen-Dekomposition.

### 2. Orchestrierung, Multi-Agenten-Systeme und Durable Execution

- Anthropic. **"Building Effective Agents."** Technische Anleitung zu Workflows vs. Agenten und Single-Agent-First-Design.
- Anthropic. **"How we built our multi-agent research system."** Praktischer Bericht über die Supervisor/Worker-Orchestrierung.
- LangChain. **LangGraph-Dokumentation** — Zustandsmaschinen-Orchestrierung für Agenten.
- Temporal / Durable-Execution-Engines. **Dokumentation zur Workflow-Dauerhaftigkeit und dem Saga-Muster.**
- Microsoft / AutoGen. **"AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation."** Multi-Agenten-Konversations-Framework.
- Hong, S. et al. **"MetaGPT: Meta Programming for Multi-Agent Collaborative Framework."**

### 3. Speicher und Retrieval (RAG)

- Lewis, P. et al. **"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks."** NeurIPS. Das kanonische RAG-Paper.
- Gao, Y. et al. **"Retrieval-Augmented Generation for Large Language Models: A Survey."**
- Packer, C. et al. **"MemGPT: Towards LLMs as Operating Systems."** Speicherhierarchie und Paging für Agenten.
- Asai, A. et al. **"Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection."**

### 4. Evaluierung

- Liang, P. et al. **"Holistic Evaluation of Language Models (HELM)."** Stanford CRFM.
- Zheng, L. et al. **"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."** Die LLM-as-a-Judge-Methodik und ihre Verzerrungen (Biases).
- Es, S. et al. **"RAGAS: Automated Evaluation of Retrieval Augmented Generation."** Metriken für Fundierung (Groundedness) und Treue (Faithfulness).
- Liu, Y. et al. **"G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment."**
- **SWE-bench** und **GAIA** — Benchmarks für agentische Fähigkeiten bei Software- und allgemeinen Assistenzaufgaben.

### 5. Sicherheit für agentische Systeme

- OWASP. **"OWASP Top 10 for Large Language Model Applications."** Einschließlich LLM01 Prompt Injection und LLM06 Sensitive Information Disclosure.
- Willison, S. **"Prompt injection"** und **"The lethal trifecta for AI agents"** (Blog-Essays). Die klarste Formulierung des architektonischen Injektions-/Exfiltrationsproblems.
- Greshake, K. et al. **"Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection."**
- MITRE. **ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems).**
- NIST. **SP 800-53** (Sicherheits- und Datenschutzkontrollen; Least Privilege, Identität), angepasst für KI-Systeme.

### 6. Governance-, Risiko- und regulatorische Standards

- NIST. **AI Risk Management Framework (AI RMF 1.0)** und das **Generative AI Profile.**
- ISO/IEC. **42001:2023 — Artificial intelligence — Management system.**
- ISO/IEC. **23894:2023 — AI — Guidance on risk management.**
- European Union. **Verordnung (EU) 2024/1689, das EU-KI-Gesetz (EU AI Act)** — risikogestufte Verpflichtungen für KI-Systeme.
- OECD. **OECD AI Principles.**
- US White House / OMB. **Executive and management guidance on trustworthy AI** (für den Kontext zu Erwartungen im öffentlichen Sektor).
- Siehe auch GOV-001 (Enterprise AI Governance Framework) und GOV-005 (Agent Governance Controls Checklist) in diesem Korpus.

### 7. Protokolle, Interoperabilität und der Discovery-Layer

- Anthropic. **Model Context Protocol (MCP) Spezifikation** — standardisierte Schnittstelle zwischen Modell und Werkzeug/Daten.
- **llms.txt**-Vorschlag — eine Konvention auf Website-Ebene für agentenfreundliche Inhaltsindizierung.
- **JSON-LD / schema.org** — strukturierte Daten für maschinelle Erkennung (Discovery).
- **OpenAPI-Spezifikation** — typisierte Verträge für Tools, die als APIs bereitgestellt werden.

### 8. Autorisierung und Richtliniendurchsetzung (angepasst aus dem Systems Engineering)

- OASIS. **eXtensible Access Control Markup Language (XACML)** — das PEP/PDP-Autorisierungsmodell.
- **Open Policy Agent (OPA) / Rego** — Policy-as-Code-Engine.
- Saltzer, J. & Schroeder, M. **"The Protection of Information in Computer Systems."** Ursprung des Prinzips der minimalen Rechtevergabe (Least-Privilege-Prinzip).

## FAQs

**F: Warum fehlen bei einigen Einträgen DOIs oder genaue Daten?**
A: Um das Erfinden von Identifikatoren zu vermeiden. Titel und Veranstaltungsorte/Quellen werden angegeben, damit das Werk eindeutig auffindbar ist; überprüfen Sie die aktuelle Version, insbesondere bei sich weiterentwickelnden Standards (EU AI Act, NIST AI RMF, MCP, OWASP).

**F: Welcher Zusammenhang besteht zu GOV-001?**
A: GOV-001 operationalisiert die Governance- und Regulierungsquellen in den Abschnitten 5–6 in ein Enterprise-Framework; diese Bibliografie ist die zugrunde liegende Leseliste.

**F: Wo sollten Einsteiger beginnen?**
A: Abschnitt 1 (ReAct, Reflexion) für die Funktionsweise von Agenten, Abschnitt 2 (Building Effective Agents) für deren zuverlässige Entwicklung und die Abschnitte 5–6 für Sicherheit und Governance.
