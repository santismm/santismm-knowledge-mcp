---
title: "Bibliografía"
summary: "Fuentes, literatura de referencia y observaciones de industria en las que se apoya el manual de Ingeniería de Harness."
---

# Bibliografía

## Resumen ejecutivo

Esta bibliografía es la lista de referencias curada que sostiene el manual de Ingeniería de Harness. Está organizada por temas para que quien lee pueda profundizar en cualquier capa concreta. Las entradas son obras y estándares reales y conocidos. Cuando aquí no se afirman los datos exactos de cita (DOI, números de página), se da el título y el lugar o la fuente sin inventar identificadores; conviene confirmar la versión vigente de los estándares que aún evolucionan. Los títulos de las obras se dejan en su idioma original, para que sean localizables tal cual.

## Definición

Las referencias siguientes están agrupadas por tema. Son las fuentes primarias de las que bebe el manual y los puntos de partida recomendados para seguir estudiando.

### 1. Fundamentos de agentes y razonamiento

- Yao, S. et al. **«ReAct: Synergizing Reasoning and Acting in Language Models».** ICLR. El entrelazado de razonar y actuar que sostiene a los agentes con herramientas.
- Wei, J. et al. **«Chain-of-Thought Prompting Elicits Reasoning in Large Language Models».** NeurIPS. Fundacional para el razonamiento paso a paso.
- Schick, T. et al. **«Toolformer: Language Models Can Teach Themselves to Use Tools».** NeurIPS.
- Shinn, N. et al. **«Reflexion: Language Agents with Verbal Reinforcement Learning».** NeurIPS. El bucle de reflexión y autocrítica (cf. PAT-003).
- Wang, L. et al. **«A Survey on Large Language Model based Autonomous Agents».** Un repaso amplio del espacio de diseño de agentes.
- Wang, X. et al. **«Plan-and-Solve Prompting».** ACL. Descomposición de planificar y luego ejecutar.

### 2. Orquestación, multiagente y ejecución duradera

- Anthropic. **«Building Effective Agents».** Guía de ingeniería sobre flujos frente a agentes y sobre el diseño con agente único primero.
- Anthropic. **«How we built our multi-agent research system».** Escrito práctico sobre orquestación supervisor/trabajador.
- LangChain. **Documentación de LangGraph** — orquestación por máquina de estados para agentes.
- Temporal y otros motores de ejecución duradera. **Documentación sobre durabilidad de flujos y el patrón saga.**
- Microsoft / AutoGen. **«AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation».** Marco de conversación multiagente.
- Hong, S. et al. **«MetaGPT: Meta Programming for Multi-Agent Collaborative Framework».**

### 3. Memoria y recuperación (RAG)

- Lewis, P. et al. **«Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks».** NeurIPS. El artículo canónico de RAG.
- Gao, Y. et al. **«Retrieval-Augmented Generation for Large Language Models: A Survey».**
- Packer, C. et al. **«MemGPT: Towards LLMs as Operating Systems».** Jerarquía de memoria y paginación para agentes.
- Asai, A. et al. **«Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection».**

### 4. Evaluación

- Liang, P. et al. **«Holistic Evaluation of Language Models (HELM)».** Stanford CRFM.
- Zheng, L. et al. **«Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena».** La metodología del LLM como juez y sus sesgos.
- Es, S. et al. **«RAGAS: Automated Evaluation of Retrieval Augmented Generation».** Métricas de anclaje y fidelidad.
- Liu, Y. et al. **«G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment».**
- **SWE-bench** y **GAIA** — bancos de pruebas de capacidad agéntica para tareas de software y de asistencia general.

### 5. Seguridad para sistemas agénticos

- OWASP. **«OWASP Top 10 for Large Language Model Applications».** Incluye LLM01 inyección de prompt y LLM06 divulgación de información sensible.
- Willison, S. **«Prompt injection»** y **«The lethal trifecta for AI agents»** (ensayos de blog). La formulación más clara del problema arquitectónico de inyección y exfiltración.
- Greshake, K. et al. **«Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection».**
- MITRE. **ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems).**
- NIST. **SP 800-53** (controles de seguridad y privacidad; mínimo privilegio, identidad), adaptado a sistemas de IA.

### 6. Gobernanza, riesgo y estándares regulatorios

- NIST. **AI Risk Management Framework (AI RMF 1.0)** y el **Generative AI Profile.**
- ISO/IEC. **42001:2023 — Inteligencia artificial — Sistema de gestión.**
- ISO/IEC. **23894:2023 — IA — Guía para la gestión del riesgo.**
- Unión Europea. **Reglamento (UE) 2024/1689, el Reglamento Europeo de IA** — obligaciones escalonadas por nivel de riesgo para los sistemas de IA.
- OCDE. **Principios de IA de la OCDE.**
- Casa Blanca y OMB de EE. UU. **Guías ejecutivas y de gestión sobre IA digna de confianza** (como contexto de las expectativas del sector público).
- Véanse también GOV-001 (marco de gobernanza de IA empresarial) y GOV-005 (lista de verificación de controles de gobernanza de agentes) en este corpus.

### 7. Protocolos, interoperabilidad y la capa de descubrimiento

- Anthropic. **Especificación del Model Context Protocol (MCP)** — interfaz estandarizada de modelo a herramientas y datos.
- Propuesta **llms.txt** — una convención a nivel de sitio para indexar contenido de forma apta para agentes.
- **JSON-LD / schema.org** — datos estructurados para el descubrimiento por máquina.
- **Especificación OpenAPI** — contratos tipados para herramientas expuestas como API.

### 8. Autorización y aplicación de políticas (adaptado de la ingeniería de sistemas)

- OASIS. **eXtensible Access Control Markup Language (XACML)** — el modelo de autorización PEP/PDP.
- **Open Policy Agent (OPA) / Rego** — motor de política como código.
- Saltzer, J. y Schroeder, M. **«The Protection of Information in Computer Systems».** Origen del principio de mínimo privilegio.

## Preguntas frecuentes

**P: ¿Por qué a algunas entradas les faltan el DOI o la fecha exacta?**
R: Para no inventar identificadores. Se dan el título y el lugar o la fuente, de modo que la obra sea localizable sin ambigüedad; conviene confirmar la versión vigente, sobre todo en los estándares que evolucionan (Reglamento Europeo de IA, NIST AI RMF, MCP, OWASP).

**P: ¿Qué relación tiene esto con GOV-001?**
R: GOV-001 lleva a la práctica las fuentes de gobernanza y regulación de las secciones 5 y 6 dentro de un marco empresarial; esta bibliografía es la lista de lecturas que hay debajo.

**P: ¿Por dónde debería empezar quien llega nuevo?**
R: Por la sección 1 (ReAct, Reflexion) para entender cómo funcionan los agentes, la sección 2 («Building Effective Agents») para saber cómo construirlos de forma fiable, y las secciones 5 y 6 para seguridad y gobernanza.
