---
title: 参考文献
summary: >-
  一份精心策划的 Harness Engineering（智能体支撑系统工程）主题阅读清单——涵盖 Agent
  与编排、评估、安全、治理与标准以及协议——包括奠基性论文、行业报告和监管框架。
---
# 参考文献

## 执行摘要

本参考文献是支撑 Harness Engineering（智能体支撑系统工程）手册的精选参考列表。它按主题进行组织，以便读者能够深入研究任何单一层级。所列条目均为真实的、广为人知的著作和标准。在未明确给出具体引用细节（如 DOI、页码）的地方，仅提供标题和发表场所/来源，而不杜撰标识符；读者应自行确认不断演进的标准之最新版本。

## 定义

以下参考文献按主题分组。它们是本手册借鉴的主要来源，也是推荐的进一步学习起点。

### 1. 智能体与推理基础

- Yao, S. 等人。**"ReAct: Synergizing Reasoning and Acting in Language Models."** ICLR。奠定使用工具的智能体基础的推理与行动交织机制。
- Wei, J. 等人。**"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models."** NeurIPS。逐步推理的基础。
- Schick, T. 等人。**"Toolformer: Language Models Can Teach Themselves to Use Tools."** NeurIPS。
- Shinn, N. 等人。**"Reflexion: Language Agents with Verbal Reinforcement Learning."** NeurIPS。反思/自我批判循环（参见 PAT-003）。
- Wang, L. 等人。**"A Survey on Large Language Model based Autonomous Agents."** 对智能体设计空间的广泛综述。
- Wang, X. 等人。**"Plan-and-Solve Prompting."** ACL。先计划后执行的分解。

### 2. 编排、多智能体与持久化执行

- Anthropic。**"Building Effective Agents."** 关于工作流与智能体以及单智能体优先设计的工程指导。
- Anthropic。**"How we built our multi-agent research system."** 实用的主管/工作者（supervisor/worker）编排报告。
- LangChain。**LangGraph 文档** —— 智能体的状态机编排。
- Temporal / 持久化执行引擎。**关于工作流持久性和 Saga 模式的文档。**
- Microsoft / AutoGen。**"AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation."** 多智能体对话框架。
- Hong, S. 等人。**"MetaGPT: Meta Programming for Multi-Agent Collaborative Framework."**

### 3. 记忆与检索（RAG）

- Lewis, P. 等人。**"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks."** NeurIPS。经典的 RAG 论文。
- Gao, Y. 等人。**"Retrieval-Augmented Generation for Large Language Models: A Survey."**
- Packer, C. 等人。**"MemGPT: Towards LLMs as Operating Systems."** 智能体的内存层级与分页。
- Asai, A. 等人。**"Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection."**

### 4. 评估

- Liang, P. 等人。**"Holistic Evaluation of Language Models (HELM)."** 斯坦福 CRFM。
- Zheng, L. 等人。**"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."** LLM 作为裁判（LLM-as-a-judge）的方法论及其偏差。
- Es, S. 等人。**"RAGAS: Automated Evaluation of Retrieval Augmented Generation."** 归因性（Groundedness）和忠实度（Faithfulness）指标。
- Liu, Y. 等人。**"G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment."**
- **SWE-bench** 和 **GAIA** —— 针对软件和通用助手任务的智能体能力基准。

### 5. 智能体系统的安全性

- OWASP。**"OWASP Top 10 for Large Language Model Applications."** 包括 LLM01 提示词注入和 LLM06 敏感信息泄露。
- Willison, S. **"Prompt injection"** 和 **"The lethal trifecta for AI agents"**（博客文章）。对架构注入/外泄问题最清晰的阐述。
- Greshake, K. 等人。**"Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection."**
- MITRE。**ATLAS（人工智能系统对抗性威胁景观）。**
- NIST。**SP 800-53**（安全和隐私控制；最小特权、身份），已适配人工智能系统。

### 6. 治理、风险与监管标准

- NIST。**AI 风险管理框架（AI RMF 1.0）**和**生成式 AI 概况（Generative AI Profile）。**
- ISO/IEC。**42001:2023 —— 人工智能 —— 管理体系。**
- ISO/IEC。**23894:2023 —— AI —— 风险管理指南。**
- 欧盟。**Regulation (EU) 2024/1689，欧盟 AI 法案（EU AI Act）** —— 针对 AI 系统的风险分级义务。
- OECD。**OECD AI 原则。**
- 美国白宫 / OMB。**关于可信 AI 的行政与管理指南**（用于提供公共部门预期的背景信息）。
- 另请参阅本语料库中的 GOV-001（企业 AI 治理框架）和 GOV-005（智能体治理控制清单）。

### 7. 协议、互操作性与发现层

- Anthropic。**模型上下文协议（MCP）规范** —— 标准化的模型到工具/数据接口。
- **llms.txt** 提案 —— 针对智能体友好型内容索引的站点级约定。
- **JSON-LD / schema.org** —— 用于机器发现的结构化数据。
- **OpenAPI 规范** —— 暴露为 API 的工具的有类型契约。

### 8. 授权与策略执行（改编自系统工程）

- OASIS。**可扩展访问控制标记语言（XACML）** —— PEP/PDP 授权模型。
- **Open Policy Agent (OPA) / Rego** —— 策略即代码引擎。
- Saltzer, J. 和 Schroeder, M. **"The Protection of Information in Computer Systems."** 最小特权原则的起源。

## 常见问题

**问：为什么有些条目缺少 DOI 或确切日期？**
**答：为了避免杜撰标识符。提供标题和发表场所/来源是为了能够明确地定位著作；请确认当前版本，特别是对于不断演进的标准（欧盟 AI 法案、NIST AI RMF、MCP、OWASP）。**

**问：这与 GOV-001 有何关系？**
**答：GOV-001 将第 5-6 节中的治理和监管来源转化为企业框架；本参考文献是其底层的阅读清单。**

**问：新手应该从哪里开始？**
**答：第 1 节（ReAct、Reflexion）了解智能体的工作原理，第 2 节（Building Effective Agents）了解如何可靠地构建它们，以及第 5-6 节了解安全与治理。**
