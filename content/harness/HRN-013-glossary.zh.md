---
title: 词汇表
summary: >-
  一份权威的 Harness Engineering
  和智能体系统术语词汇表——包含支撑系统（harness）、智能体（agent）、工具（tool）、编排（orchestration）、评估（evaluation）、跨度（span）、RAG、MCP、护栏（guardrail）等——并配有清晰、可引用的定义。
---
# 术语表

## 执行摘要

本术语表是 Harness Engineering（智能体支撑系统工程）手册以及更广泛的 Santismm 知识平台中所用术语的权威参考。定义简明扼要、可机器提取，并旨在被直接引用。若某个术语设有专门的章节，该条目将指向该章节。

## 定义

以下是整个语料库中所用术语的权威定义。为了便于阅读，术语进行了分组；在各组内部，它们大致按照从基础到专业的顺序排列。

### 核心概念

- **Agent：** 一种在循环中使用语言模型来追求目标的系统，它根据观察结果决定采取哪些行动（工具调用），直到满足停止条件。
- **Agentic system：** 一种行为由一个或多个 Agent 驱动的软件系统，包括使其可靠运行所需的所有周边脚手架。
- **Harness：** 围绕模型构建的工程化脚手架——包括内存/记忆、工具、规划、编排、可观测性、评估、治理和安全——它将原始模型转化为可靠的 Agentic system。
- **Harness Engineering：** 负责通过设计和运行 Harness 来为企业环境构建可靠 Agentic system 的新兴学科。
- **Model / LLM：** 进行推理和生成的底层大语言模型；在 Harness 中，它被视为一个强大但非确定性且可被操纵的组件。
- **Autonomy gradient：** 从完全自主到人机协同（human-in-the-loop）的控制模式光谱，由策略按行动类别进行分配。
- **Blast radius：** 一项行动（或受损的 Agent）所能造成的最大危害；这是需要限制的核心指标。

### 工具与行动

- **Tool：** Agent 可以调用以观察或影响世界的函数或功能（如搜索、代码执行、API 调用、数据库查询）。
- **Tool call / function call：** 来自模型的、带有参数的调用工具的结构化请求。
- **Effector：** 在外部系统中产生副作用的工具（如发送、写入、传输）。
- **Idempotency：** 多次执行某一操作与执行一次具有相同效果的特性；这对于安全的重试和恢复至关重要。
- **Side effect：** 工具调用产生的外部可见的变化。
- **Allowlist：** 明确允许的项目集合（如工具、出口目的地）；是安全敏感型选择的安全默认设置。

### 内存/记忆与上下文

- **Context window：** 模型在单次推理中可以关注的有界 Token 范围。
- **Memory：** 在步骤和会话之间持久化和检索信息的 Harness 层（包括短期、长期、情景和语义记忆）。
- **RAG (Retrieval-Augmented Generation)：** 在推理时向模型提供检索到的相关内容，使其输出基于语料库，而非仅仅依赖参数记忆。
- **Embedding：** 用于检索中语义相似度搜索的文本向量表示。
- **Vector store：** 针对嵌入的最近邻搜索进行优化的数据库。
- **Grounding：** 将生成的陈述锚定在检索到的、可引用的证据中。
- **Context engineering：** 精确决定每个步骤中哪些信息进入上下文窗口的实践。

### 规划

- **Goal：** 具有明确成功标准的期望终态。
- **Plan：** 预期实现目标的有序或半有序任务集。
- **Decomposition：** 将目标分解为子任务（参见 PAT-010、HRN-009）。
- **DAG (Directed Acyclic Graph)：** 一种捕获任务依赖关系并展示并行性的计划表示形式。
- **Replanning：** 针对失败、新信息或变化的约束条件对计划进行修订。
- **Termination criteria：** 安全停止 Agent 的预算和条件（步骤、时间、成本）。

### 编排

- **Orchestration：** 驱动跨 Agent 和工具执行的 Harness 层（参见 HRN-010）。
- **Topology：** Agent 的排列方式——单体、流水线、主管/工作者（supervisor/worker）或网络。
- **Supervisor (orchestrator) agent：** 进行规划并向工作者 Agent 进行分派的 Agent（参见 PAT-002）。
- **Worker agent：** 执行分派的子任务的专业化 Agent（参见 PAT-005）。
- **Routing：** 根据状态选择下一个 Agent、工具或分支。
- **Handoff：** 控制权和上下文从一个 Agent 转移到另一个 Agent。
- **State machine：** 控制执行的、由状态和受控转换组成的显式图。
- **Durable execution：** 一种工作流语义，其进度会被记录检查点，并可在发生故障时恢复。
- **Saga：** 一系列操作，带有在失败时撤销部分工作的补偿行动。

### 治理与安全

- **Governance：** 执行策略、审批和护栏的运行时 Harness 层（参见 HRN-008）。
- **Policy-as-code：** 以声明式、版本化、可测试格式表达的治理规则。
- **PEP / PDP：** 策略执行点（Policy Enforcement Point，拦截行动）和策略决策点（Policy Decision Point，评估策略）。
- **Guardrail：** 对输入或输出的运行时检查，用以约束 Agent 的行为。
- **Approval gate：** 在等待人工或更高权限决策期间暂停执行的控制机制（参见 PAT-001）。
- **Least privilege：** 授予每个 Agent 执行其任务所需的最小权限。
- **Agent identity：** 为每个 Agent 提供的独特、可追溯、有范围限制且可撤销的主体身份。
- **Prompt injection：** 劫持 Agent 指令或目标的不受信任内容。
- **Indirect prompt injection：** 通过 Agent 检索的数据传递的注入。
- **Data exfiltration：** 敏感数据通过 Agent 输出或工具参数未经授权地流出。
- **Lethal trifecta：** 访问私有数据、暴露于不受信任内容以及具备外部通信能力这一危险组合。
- **Sandbox：** 用于执行不受信任工具/代码的隔离、资源和网络受限的环境。
- **DLP (Data Loss Prevention)：** 检测并拦截出站负载中敏感数据的控制措施。

### 可观测性与评估

- **Observability：** 通过 Trace（追踪）、Log（日志）和 Metric（指标）使 Agent 行为可检查的 Harness 层（参见 HRN-006）。
- **Trace：** 单次 Agent 运行的端到端记录。
- **Span：** Trace 内的单个计时工作单元（一次工具调用、一次模型调用），是分布式追踪的构建块。
- **Evaluation (eval)：** 对 Agent 质量、安全性和可靠性的系统性度量（参见 HRN-007）。
- **LLM-as-judge：** 使用一个模型根据评分标准对另一个模型的输出进行评分。
- **Groundedness：** 生成的陈述得到所提供证据支持的程度。
- **Regression suite：** 在每次变更时运行的一组固定评估案例，用以捕获质量退化。
- **Eval-driven development：** 针对可度量的评估 Harness 构建和更改 Agent。

### 协议与标准

- **MCP (Model Context Protocol)：** 一种通过标准化接口将模型/Agent 连接到工具和数据源的开放协议。
- **Tool schema：** 模型用于调用工具的工具名称、参数和描述的类型化声明。
- **llms.txt：** 一种建议的规范，用于站点级的 Markdown file，以呈现精选的、对 Agent 友好的内容索引。
- **JSON-LD：** 用于在发现层使文档具备机器可读性的结构化数据格式。
- **NIST AI RMF / ISO 42001 / EU AI Act：** 企业 Harness 必须满足的主要 AI 风险、管理体系和监管框架（参见 HRN-014、GOV-001）。

## 常见问题

**问：我应该从哪里引用定义？**
答：通过术语名称加上 `HRN-013` 进行引用。若某个术语设有专门的章节，为了深入探讨，请优先引用该章节。

**问：我需要的术语缺失了——我该怎么办？**
答：将其添加到此处适当的分组中，并附上简明的一句话定义，如果存在专门的章节，请链接该章节。
