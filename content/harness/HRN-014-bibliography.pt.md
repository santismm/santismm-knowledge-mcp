---
title: "Bibliografia"
summary: "Fontes, literatura de referência e observações da indústria em que se apoia o manual de Engenharia de Harness."
---

# Bibliografia

## Resumo executivo

Esta bibliografia é a lista de referências curada que sustenta o manual de Engenharia de Harness. Está organizada por temas para que quem lê possa aprofundar qualquer camada em concreto. As entradas são obras e normas reais e conhecidas. Quando aqui não se afirmam os dados exatos de citação (DOI, números de página), dá-se o título e o local ou a fonte sem inventar identificadores; convém confirmar a versão em vigor das normas que ainda evoluem. Os títulos das obras ficam na língua original, para que sejam localizáveis tal como estão.

## Definição

As referências seguintes estão agrupadas por tema. São as fontes primárias de que o manual bebe e os pontos de partida recomendados para continuar a estudar.

### 1. Fundamentos de agentes e raciocínio

- Yao, S. et al. **“ReAct: Synergizing Reasoning and Acting in Language Models”.** ICLR. O entrelaçamento de raciocinar e agir que sustenta os agentes com ferramentas.
- Wei, J. et al. **“Chain-of-Thought Prompting Elicits Reasoning in Large Language Models”.** NeurIPS. Fundacional para o raciocínio passo a passo.
- Schick, T. et al. **“Toolformer: Language Models Can Teach Themselves to Use Tools”.** NeurIPS.
- Shinn, N. et al. **“Reflexion: Language Agents with Verbal Reinforcement Learning”.** NeurIPS. O ciclo de reflexão e autocrítica (cf. PAT-003).
- Wang, L. et al. **“A Survey on Large Language Model based Autonomous Agents”.** Um levantamento amplo do espaço de desenho de agentes.
- Wang, X. et al. **“Plan-and-Solve Prompting”.** ACL. Decomposição de planejar e depois executar.

### 2. Orquestração, multiagente e execução duradoura

- Anthropic. **“Building Effective Agents”.** Orientação de engenharia sobre fluxos diante de agentes e sobre o desenho com agente único primeiro.
- Anthropic. **“How we built our multi-agent research system”.** Escrito prático sobre orquestração supervisor/trabalhador.
- LangChain. **Documentação do LangGraph** — orquestração por máquina de estados para agentes.
- Temporal e outros motores de execução duradoura. **Documentação sobre durabilidade de fluxos e o padrão saga.**
- Microsoft / AutoGen. **“AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation”.** Quadro de conversação multiagente.
- Hong, S. et al. **“MetaGPT: Meta Programming for Multi-Agent Collaborative Framework”.**

### 3. Memória e recuperação (RAG)

- Lewis, P. et al. **“Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks”.** NeurIPS. O artigo canônico de RAG.
- Gao, Y. et al. **“Retrieval-Augmented Generation for Large Language Models: A Survey”.**
- Packer, C. et al. **“MemGPT: Towards LLMs as Operating Systems”.** Hierarquia de memória e paginação para agentes.
- Asai, A. et al. **“Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection”.**

### 4. Avaliação

- Liang, P. et al. **“Holistic Evaluation of Language Models (HELM)”.** Stanford CRFM.
- Zheng, L. et al. **“Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena”.** A metodologia do LLM como juiz e seus enviesamentos.
- Es, S. et al. **“RAGAS: Automated Evaluation of Retrieval Augmented Generation”.** Métricas de ancoragem e fidelidade.
- Liu, Y. et al. **“G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment”.**
- **SWE-bench** e **GAIA** — bancos de ensaio de capacidade agêntica para tarefas de software e de assistência geral.

### 5. Segurança para sistemas agênticos

- OWASP. **“OWASP Top 10 for Large Language Model Applications”.** Inclui LLM01 injeção de prompt e LLM06 divulgação de informação sensível.
- Willison, S. **“Prompt injection”** e **“The lethal trifecta for AI agents”** (ensaios de blogue). A formulação mais clara do problema arquitetônico de injeção e exfiltração.
- Greshake, K. et al. **“Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection”.**
- MITRE. **ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems).**
- NIST. **SP 800-53** (controles de segurança e privacidade; privilégio mínimo, identidade), adaptado a sistemas de IA.

### 6. Governança, risco e normas regulatórias

- NIST. **AI Risk Management Framework (AI RMF 1.0)** e o **Generative AI Profile.**
- ISO/IEC. **42001:2023 — Inteligência artificial — Sistema de gestão.**
- ISO/IEC. **23894:2023 — IA — Orientação para a gestão do risco.**
- União Europeia. **Regulamento (UE) 2024/1689, o Regulamento Europeu de IA** — obrigações escalonadas por nível de risco para os sistemas de IA.
- OCDE. **Princípios de IA da OCDE.**
- Casa Branca e OMB dos EUA. **Orientações executivas e de gestão sobre IA digna de confiança** (como contexto das expectativas do setor público).
- Ver também GOV-001 (quadro de governança de IA empresarial) e GOV-005 (lista de verificação de controles de governança de agentes) neste corpus.

### 7. Protocolos, interoperabilidade e a camada de descoberta

- Anthropic. **Especificação do Model Context Protocol (MCP)** — interface normalizada de modelo para ferramentas e dados.
- Proposta **llms.txt** — uma convenção no nível do site para indexar conteúdo de forma apta para agentes.
- **JSON-LD / schema.org** — dados estruturados para a descoberta por máquina.
- **Especificação OpenAPI** — contratos tipados para ferramentas expostas como API.

### 8. Autorização e aplicação de políticas (adaptado da engenharia de sistemas)

- OASIS. **eXtensible Access Control Markup Language (XACML)** — o modelo de autorização PEP/PDP.
- **Open Policy Agent (OPA) / Rego** — motor de política como código.
- Saltzer, J. e Schroeder, M. **“The Protection of Information in Computer Systems”.** Origem do princípio de privilégio mínimo.

## Perguntas frequentes

**P: Porque é que faltam o DOI ou a data exata em algumas entradas?**
R: Para não inventar identificadores. São dados o título e o local ou a fonte, de modo que a obra seja localizável sem ambiguidade; convém confirmar a versão em vigor, sobretudo nas normas que evoluem (Regulamento Europeu de IA, NIST AI RMF, MCP, OWASP).

**P: Que relação tem isto com GOV-001?**
R: GOV-001 leva à prática as fontes de governança e regulação das secções 5 e 6 dentro de um quadro empresarial; esta bibliografia é a lista de leituras que está por baixo.

**P: Por onde deve começar quem chega de novo?**
R: Pela secção 1 (ReAct, Reflexion) para perceber como funcionam os agentes, pela secção 2 (“Building Effective Agents”) para saber como os construir de forma confiável, e pelas secções 5 e 6 para segurança e governança.
