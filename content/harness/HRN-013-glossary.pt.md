---
title: "Glossário"
summary: "Definições canônicas dos termos de Engenharia de Harness usados em todo o manual, para que o vocabulário não derive entre capítulos."
---

# Glossário

## Resumo executivo

Este glossário é a referência canônica dos termos usados em todo o manual de Engenharia de Harness e no resto da Santismm Knowledge Platform. As definições são concisas, extraíveis por máquina e pensadas para serem citadas diretamente. Quando um termo tem capítulo próprio, a entrada remete para ele.

## Definição

O que se segue são as definições canônicas dos termos usados ao longo deste corpus. Os termos estão agrupados por legibilidade; dentro de cada grupo vão aproximadamente do fundacional ao especializado.

Os nomes ingleses de uso estabelecido na indústria (*harness*, *tool*, *span*, *prompt*, *guardrail*…) são preservados e acompanhados do equivalente em português onde existe um assente. **Harness** não se traduz: é o termo próprio da disciplina.

### Conceitos fundamentais

- **Agente:** um sistema que usa um modelo de linguagem dentro de um ciclo para perseguir um objetivo, decidindo que ações (chamadas a ferramentas) tomar a partir das observações até se cumprir uma condição de paragem.
- **Sistema agêntico:** um sistema de software cujo comportamento é conduzido por um ou vários agentes, incluindo todo o andaime circundante necessário para os tornar confiáveis.
- **Harness:** o andaime de engenharia em torno de um modelo — memória, ferramentas, planejamento, orquestração, observabilidade, avaliação, governança e segurança — que converte um modelo em bruto num sistema agêntico confiável.
- **Engenharia de Harness:** a disciplina emergente responsável por construir sistemas agênticos confiáveis para ambientes empresariais, desenhando e operando o harness.
- **Modelo / LLM:** o grande modelo de linguagem subjacente que raciocina e gera; dentro do harness é tratado como um componente poderoso mas não determinista e manipulável.
- **Gradiente de autonomia:** o espectro de modos de controle, de totalmente autônomo a humano no ciclo, atribuído por política a cada classe de ação.
- **Raio de impacto (*blast radius*):** o dano máximo que uma ação, ou um agente comprometido, pode causar; uma grandeza central a limitar.

### Ferramentas e ações

- **Ferramenta (*tool*):** uma função ou capacidade que o agente pode invocar para observar ou afetar o mundo (pesquisa, execução de código, chamada a uma API, consulta a uma base de dados).
- **Chamada a ferramenta (*function calling*):** um pedido estruturado do modelo para invocar uma ferramenta com argumentos.
- **Efetor:** uma ferramenta que produz um efeito secundário num sistema externo (envia, escreve, transfere).
- **Idempotência:** a propriedade pela qual executar uma operação várias vezes tem o mesmo efeito que executá-la uma vez; indispensável para repetições e retomas seguras.
- **Efeito secundário:** uma alteração visível do exterior produzida por uma chamada a ferramenta.
- **Lista de permitidos (*allowlist*):** um conjunto explícito de elementos autorizados (ferramentas, destinos de saída); o padrão seguro nas decisões sensíveis à segurança.

### Memória e contexto

- **Janela de contexto:** o troço limitado de tokens a que o modelo pode atender numa única inferência.
- **Memória:** a camada do harness que persiste e recupera informação entre passos e sessões (de curto prazo, de longo prazo, episódica, semântica).
- **RAG (geração aumentada por recuperação):** fornecer ao modelo conteúdo relevante recuperado em tempo de inferência, de modo que sua saída fique ancorada num corpus e não apenas na memória paramétrica.
- **Embedding (representação vetorial):** uma representação em vetor de um texto, usada para a pesquisa por similaridade semântica na recuperação.
- **Armazém vetorial:** uma base de dados otimizada para a pesquisa de vizinhos mais próximos sobre embeddings.
- **Ancoragem (*grounding*):** sustentar as afirmações geradas em evidência recuperada e citável.
- **Engenharia de contexto:** a prática de decidir com precisão que informação entra na janela de contexto em cada passo.

### Planejamento

- **Objetivo:** o estado final desejado, com critérios de sucesso explícitos.
- **Plano:** um conjunto ordenado ou parcialmente ordenado de tarefas que se espera que alcancem um objetivo.
- **Decomposição:** partir um objetivo em subtarefas (ver PAT-010 e HRN-009).
- **DAG (grafo acíclico dirigido):** uma representação de plano que captura as dependências entre tarefas e expõe o paralelismo.
- **Replanejamento:** rever um plano em resposta a uma falha, a informação nova ou a uma mudança de restrições.
- **Critérios de terminação:** os orçamentos e condições (passos, tempo, custo) que param um agente em segurança.

### Orquestração

- **Orquestração:** a camada do harness que conduz a execução através de agentes e ferramentas (ver HRN-010).
- **Topologia:** a disposição dos agentes: único, pipeline, supervisor/trabalhador ou rede.
- **Agente supervisor (orquestrador):** um agente que planeja e delega em agentes trabalhadores (ver PAT-002).
- **Agente trabalhador:** um agente especializado que executa uma subtarefa delegada (ver PAT-005).
- **Encaminhamento:** selecionar o próximo agente, ferramenta ou ramo em função do estado.
- **Passagem (*handoff*):** transferência de controle e contexto de um agente para outro.
- **Máquina de estados:** um grafo explícito de estados e transições governadas que controla a execução.
- **Execução duradoura:** semântica de fluxo em que o progresso é persistido em pontos de controle e é retomável perante as falhas.
- **Saga:** uma sequência de operações com ações compensatórias que desfazem o trabalho parcial perante uma falha.

### Governança e segurança

- **Governança:** a camada de execução do harness que aplica política, aprovações e guarda-corpos (ver HRN-008).
- **Política como código:** regras de governança expressas num formato declarativo, versionado e testável.
- **PEP / PDP:** ponto de aplicação de política (intercepta as ações) e ponto de decisão de política (avalia a política).
- **Guarda-corpo (*guardrail*):** uma verificação em execução sobre entradas ou saídas que restringe o comportamento do agente.
- **Porta de aprovação:** um controle que suspende a execução à espera de uma decisão humana ou de uma autoridade superior (ver PAT-001).
- **Privilégio mínimo:** conceder a cada agente as permissões mínimas de que sua tarefa precisa.
- **Identidade do agente:** um principal distinto, atribuível, com âmbito limitado e revogável para cada agente.
- **Injeção de prompt:** conteúdo não confiável que sequestra as instruções ou objetivos de um agente.
- **Injeção indireta de prompt:** injeção entregue através de dados que o agente recupera.
- **Exfiltração de dados:** saída não autorizada de dados sensíveis através das saídas do agente ou dos argumentos das ferramentas.
- **Trifeta letal:** a combinação perigosa de acesso a dados privados, exposição a conteúdo não confiável e capacidade de comunicação externa.
- **Caixa de areia (*sandbox*):** um ambiente isolado, com recursos e rede restringidos, para executar ferramentas ou código não confiáveis.
- **DLP (prevenção de fuga de dados):** controles que detectam e bloqueiam dados sensíveis nas cargas de saída.

### Observabilidade e avaliação

- **Observabilidade:** a camada do harness que torna inspecionável o comportamento do agente através de traços, registros e métricas (ver HRN-006).
- **Traço:** o registro de ponta a ponta de uma única execução do agente.
- **Span:** uma unidade de trabalho temporizada dentro de um traço (uma chamada a ferramenta, uma chamada ao modelo); o tijolo básico do tracing distribuído.
- **Avaliação (*eval*):** a medição sistemática da qualidade, da segurança e da confiabilidade do agente (ver HRN-007).
- **LLM como juiz:** usar um modelo para pontuar as saídas de outro modelo contra uma rubrica.
- **Ancoragem (*groundedness*):** o grau em que as afirmações geradas são sustentadas pela evidência fornecida.
- **Suite de regressão:** um conjunto fixo de casos de avaliação executado em cada alteração para caçar quedas de qualidade.
- **Desenvolvimento guiado por avaliação:** construir e alterar agentes contra um harness de avaliação mensurável.

### Protocolos e normas

- **MCP (Model Context Protocol):** um protocolo aberto para ligar modelos e agentes a ferramentas e fontes de dados através de uma interface normalizada.
- **Esquema de ferramenta:** a declaração tipada do nome, dos argumentos e da descrição de uma ferramenta, que o modelo usa para invocá-la.
- **llms.txt:** uma convenção proposta para um arquivo Markdown no nível do site que expõe um índice de conteúdo curado e apto para agentes.
- **JSON-LD:** formato de dados estruturados usado para tornar os documentos legíveis por máquina na camada de descoberta.
- **NIST AI RMF / ISO 42001 / Regulamento Europeu de IA:** os principais quadros de risco, de sistema de gestão e regulatório que um harness empresarial deve satisfazer (ver HRN-014 e GOV-001).

## Perguntas frequentes

**P: De onde cito uma definição?**
R: Cite o termo pelo nome junto de `HRN-013`. Quando o termo tiver capítulo próprio, é preferível citar esse capítulo para mais profundidade.

**P: Falta um termo de que preciso, o que faço?**
R: Acrescente-o aqui, no grupo que corresponder, com uma definição nítida de uma frase, e ligue o capítulo dedicado se existir.
