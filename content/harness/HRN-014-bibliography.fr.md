---
title: Bibliographie
summary: >-
  Une liste de lecture thématique et sélectionnée pour le Harness Engineering —
  agents et orchestration, évaluation, sécurité, gouvernance et normes, et
  protocoles — couvrant les articles fondamentaux, les rapports de l'industrie
  et les cadres réglementaires.
---
# Bibliographie

## Résumé exécutif

Cette bibliographie est la liste de références sélectionnées qui sous-tend le manuel de Harness Engineering. Elle est organisée par thème afin de permettre au lecteur d'approfondir chaque couche. Les entrées sont des ouvrages et des normes réels et reconnus. Lorsque les détails précis de citation (DOI, numéros de page) ne sont pas spécifiés ici, le titre et le lieu/la source sont indiqués sans inventer d'identifiants ; les lecteurs sont invités à vérifier les versions actuelles des normes en constante évolution.

## Définition

Les références suivantes sont regroupées par thème. Elles constituent les sources primaires sur lesquelles s'appuie le manuel et les points de départ recommandés pour une étude plus approfondie.

### 1. Fondations des agents et du raisonnement

- Yao, S. et al. **"ReAct: Synergizing Reasoning and Acting in Language Models."** ICLR. L'imbrication du raisonnement et de l'action qui sous-tend les agents utilisant des outils.
- Wei, J. et al. **"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models."** NeurIPS. Fondateur pour le raisonnement étape par étape.
- Schick, T. et al. **"Toolformer: Language Models Can Teach Themselves to Use Tools."** NeurIPS.
- Shinn, N. et al. **"Reflexion: Language Agents with Verbal Reinforcement Learning."** NeurIPS. La boucle de réflexion/auto-critique (cf. PAT-003).
- Wang, L. et al. **"A Survey on Large Language Model based Autonomous Agents."** Un large panorama de l'espace de conception des agents.
- Wang, X. et al. **"Plan-and-Solve Prompting."** ACL. Décomposition planification-puis-exécution.

### 2. Orchestration, multi-agents et exécution durable

- Anthropic. **"Building Effective Agents."** Guide d'ingénierie sur les workflows par rapport aux agents et la conception privilégiant un agent unique.
- Anthropic. **"How we built our multi-agent research system."** Compte-rendu pratique sur l'orchestration superviseur/exécutant.
- LangChain. **Documentation de LangGraph** — orchestration par machine à états pour les agents.
- Temporal / moteurs d'exécution durable. **Documentation sur la durabilité des workflows et le modèle Saga.**
- Microsoft / AutoGen. **"AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation."** Framework de conversation multi-agents.
- Hong, S. et al. **"MetaGPT: Meta Programming for Multi-Agent Collaborative Framework."**

### 3. Mémoire et récupération (RAG)

- Lewis, P. et al. **"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks."** NeurIPS. L'article de référence sur le RAG.
- Gao, Y. et al. **"Retrieval-Augmented Generation for Large Language Models: A Survey."**
- Packer, C. et al. **"MemGPT: Towards LLMs as Operating Systems."** Hiérarchie de mémoire et pagination pour les agents.
- Asai, A. et al. **"Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection."**

### 4. Évaluation

- Liang, P. et al. **"Holistic Evaluation of Language Models (HELM)."** Stanford CRFM.
- Zheng, L. et al. **"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."** La méthodologie du LLM-comme-juge et ses biais.
- Es, S. et al. **"RAGAS: Automated Evaluation of Retrieval Augmented Generation."** Métriques d'ancrage (groundedness) et de fidélité.
- Liu, Y. et al. **"G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment."**
- **SWE-bench** et **GAIA** — benchmarks de capacités agentiques pour les tâches logicielles et d'assistance générale.

### 5. Sécurité des systèmes agentiques

- OWASP. **"OWASP Top 10 for Large Language Model Applications."** Incluant LLM01 Injection de prompt et LLM06 Divulgation d'informations sensibles.
- Willison, S. **"Prompt injection"** et **"The lethal trifecta for AI agents"** (essais de blog). L'articulation la plus claire du problème architectural d'injection/exfiltration.
- Greshake, K. et al. **"Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection."**
- MITRE. **ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems).**
- NIST. **SP 800-53** (contrôles de sécurité et de confidentialité ; moindre privilège, identité) tel qu'adapté pour les systèmes d'IA.

### 6. Gouvernance, risques et normes réglementaires

- NIST. **AI Risk Management Framework (AI RMF 1.0)** et le **Generative AI Profile.**
- ISO/IEC. **42001:2023 — Intelligence artificielle — Système de management.**
- ISO/IEC. **23894:2023 — IA — Recommandations relatives à la gestion des risques.**
- Union européenne. **Règlement (UE) 2024/1689, le règlement sur l'IA de l'UE (EU AI Act)** — obligations basées sur les niveaux de risque pour les systèmes d'IA.
- OCDE. **Principes de l'OCDE sur l'IA.**
- Maison-Blanche / OMB (États-Unis). **Directives exécutives et de gestion sur l'IA de confiance** (pour le contexte des attentes du secteur public).
- Voir également GOV-001 (Enterprise AI Governance Framework) et GOV-005 (Agent Governance Controls Checklist) dans ce corpus.

### 7. Protocoles, interopérabilité et couche de découverte

- Anthropic. **Spécification du Model Context Protocol (MCP)** — interface standardisée modèle-vers-outil/données.
- Proposition **llms.txt** — une convention au niveau du site pour un indexage de contenu adapté aux agents.
- **JSON-LD / schema.org** — données structurées pour la découverte par les machines.
- **Spécification OpenAPI** — contrats typés pour les outils exposés sous forme d'API.

### 8. Autorisation et application des politiques (adapté de l'ingénierie des systèmes)

- OASIS. **eXtensible Access Control Markup Language (XACML)** — le modèle d'autorisation PEP/PDP.
- **Open Policy Agent (OPA) / Rego** — moteur de politique sous forme de code (policy-as-code).
- Saltzer, J. & Schroeder, M. **"The Protection of Information in Computer Systems."** Origine du principe du moindre privilège.

## FAQ

**Q : Pourquoi certaines entrées n'ont-elles pas de DOI ou de dates précises ?**
R : Pour éviter d'inventer des identifiants. Les titres et les lieux/sources sont indiqués afin que l'œuvre soit localisable de manière univoque ; vérifiez la version actuelle, en particulier pour les normes en évolution (EU AI Act, NIST AI RMF, MCP, OWASP).

**Q : Quel est le rapport avec GOV-001 ?**
R : GOV-001 opérationnalise les sources de gouvernance et de réglementation des sections 5 et 6 dans un cadre d'entreprise ; cette bibliographie constitue la liste de lecture sous-jacente.

**Q : Par quoi un débutant devrait-il commencer ?**
R : La section 1 (ReAct, Reflexion) pour comprendre le fonctionnement des agents, la section 2 (Building Effective Agents) pour savoir comment les concevoir de manière fiable, et les sections 5 et 6 pour la sécurité et la gouvernance.
