---
title: 参考文献
summary: >-
  ハーネスエンジニアリング (Harness
  Engineering)（エージェントとオーケストレーション、評価、セキュリティ、ガバナンスと標準、およびプロトコル）に関する、基礎的な論文、業界のレポート、および規制の枠組みを網羅した、厳選されたテーマ別の読書リスト。
---
# 参考文献

## エグゼクティブサマリー

この参考文献は、ハーネスエンジニアリング (Harness Engineering) ハンドブックの基礎となる、厳選された参照リストです。読者が任意のレイヤーを深く掘り下げられるよう、テーマ別に整理されています。掲載されている項目は、実在する著名な著作や標準規格です。正確な引用の詳細（DOI、ページ番号）がここに明記されていない場合は、識別子を捏造することなく、タイトルと発表の場/情報源を示しています。進化し続ける標準規格については、読者自身で最新バージョンを確認してください。

## 定義

以下の参考文献はテーマ別に分類されています。これらは本ハンドブックが依拠している主要な情報源であり、さらなる学習のための推奨される出発点です。

### 1. エージェントと推論の基礎

- Yao, S. et al. **"ReAct: Synergizing Reasoning and Acting in Language Models."** ICLR. ツールを使用するエージェントの基盤となる、推論と行動の交互作用。
- Wei, J. et al. **"Chain-of-Thought Prompting Elicits Reasoning in Large Language Models."** NeurIPS. 段階的な推論の基礎。
- Schick, T. et al. **"Toolformer: Language Models Can Teach Themselves to Use Tools."** NeurIPS.
- Shinn, N. et al. **"Reflexion: Language Agents with Verbal Reinforcement Learning."** NeurIPS. リフレクション/自己批判ループ（PAT-003を参照）。
- Wang, L. et al. **"A Survey on Large Language Model based Autonomous Agents."** エージェント設計空間の幅広いサーベイ。
- Wang, X. et al. **"Plan-and-Solve Prompting."** ACL. 「計画してから実行する」分解。

### 2. オーケストレーション、マルチエージェント、および永続的実行

- Anthropic. **"Building Effective Agents."** ワークフロー対エージェント、およびシングルエージェント優先設計に関するエンジニアリングガイダンス。
- Anthropic. **"How we built our multi-agent research system."** 実践的なスーパーバイザー/ワーカーオーケストレーションの解説。
- LangChain. **LangGraph ドキュメント** — エージェント向けの状態マシンオーケストレーション。
- Temporal / 永続的実行エンジン。**ワークフローの永続性とSagaパターンに関するドキュメント。**
- Microsoft / AutoGen. **"AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation."** マルチエージェント会話フレームワーク。
- Hong, S. et al. **"MetaGPT: Meta Programming for Multi-Agent Collaborative Framework."**

### 3. メモリと検索（RAG）

- Lewis, P. et al. **"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks."** NeurIPS. RAGの代表的な論文。
- Gao, Y. et al. **"Retrieval-Augmented Generation for Large Language Models: A Survey."**
- Packer, C. et al. **"MemGPT: Towards LLMs as Operating Systems."** エージェント向けのメモリ階層とページング。
- Asai, A. et al. **"Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection."**

### 4. 評価

- Liang, P. et al. **"Holistic Evaluation of Language Models (HELM)."** Stanford CRFM。
- Zheng, L. et al. **"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."** LLM-as-a-Judge（評価者としてのLLM）の手法とそのバイアス。
- Es, S. et al. **"RAGAS: Automated Evaluation of Retrieval Augmented Generation."** グラウンデッドネス（根拠性）とフェイスフルネス（忠実性）のメトリクス。
- Liu, Y. et al. **"G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment."**
- **SWE-bench** および **GAIA** — ソフトウェアおよび一般的なアシスタントタスク向けのエージェント能力ベンチマーク。

### 5. エージェントシステムのセキュリティ

- OWASP. **"OWASP Top 10 for Large Language Model Applications."** LLM01 プロンプトインジェクションおよび LLM06 機密情報の漏洩を含む。
- Willison, S. **"Prompt injection"** および **"The lethal trifecta for AI agents"**（ブログエッセイ）。アーキテクチャ上のインジェクション/流出問題の最も明確な表明。
- Greshake, K. et al. **"Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection."**
- MITRE. **ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems)。**
- NIST. **SP 800-53**（セキュリティおよびプライバシー管理策、最小権限、アイデンティティ）のAIシステム向け適応。

### 6. ガバナンス、リスク、および規制基準

- NIST. **AIリスクマネジメントフレームワーク (AI RMF 1.0)** および **生成AIプロファイル。**
- ISO/IEC. **42001:2023 — 人工知能 — マネジメントシステム。**
- ISO/IEC. **23894:2023 — AI — リスクマネジメントに関する指針。**
- 欧州連合. **規則 (EU) 2024/1689、EU AI法** — AIシステムに対するリスク段階別の義務。
- OECD. **OECD AI原則。**
- 米国ホワイトハウス / OMB. **信頼できるAIに関する大統領令および管理ガイダンス**（公共セクターの期待に関する背景として）。
- 本コーパス内の GOV-001（エンタープライズAIガバナンスフレームワーク）および GOV-005（エージェントガバナンス管理策チェックリスト）も参照。

### 7. プロトコル、相互運用性、およびディスカバリーレイヤー

- Anthropic. **Model Context Protocol (MCP) 仕様** — 標準化されたモデル対ツール/データインターフェース。
- **llms.txt** 提案 — エージェントフレンドリーなコンテンツインデックス作成のためのサイトレベルの規約。
- **JSON-LD / schema.org** — 機械によるディスカバリーのための構造化データ。
- **OpenAPI仕様** — APIとして公開されるツールの型定義されたコントラクト。

### 8. 認可とポリシー適用（システムエンジニアリングからの適応）

- OASIS. **eXtensible Access Control Markup Language (XACML)** — PEP/PDP認可モデル。
- **Open Policy Agent (OPA) / Rego** — Policy-as-Codeエンジン。
- Saltzer, J. & Schroeder, M. **"The Protection of Information in Computer Systems."** 最小権限の原則の起源。

## FAQ

**Q: 一部の項目にDOIや正確な日付がないのはなぜですか？**
**A: 識別子の捏造を避けるためです。著作を明確に特定できるようタイトルと発表の場/情報源を示しています。特に進化し続ける標準規格（EU AI法、NIST AI RMF、MCP、OWASP）については、最新バージョンを確認してください。**

**Q: これはGOV-001とどのように関係していますか？**
**A: GOV-001は、セクション5〜6のガバナンスおよび規制の情報源をエンタープライズフレームワークとして運用可能にするものであり、この参考文献はその基礎となる読書リストです。**

**Q: 初学者はどこから始めるべきですか？**
**A: エージェントの仕組みについてはセクション1（ReAct、Reflexion）、それらを高い信頼性で構築する方法についてはセクション2（Building Effective Agents）、そしてセキュリティとガバナンスについてはセクション5〜6から始めてください。**
