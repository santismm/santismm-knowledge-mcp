---
title: "Orquestração"
summary: "O ciclo que governa o sistema: quem chama o modelo, com que contexto, o que acontece à saída, e como se coordenam vários agentes sem perder controle nem rastreabilidade."
---

# Orquestração

## Resumo executivo

A orquestração é a casa das máquinas do harness: a camada que decide *quem age, por que ordem e o que acontece quando um passo falha*. Abrange desde um único agente executando um ciclo até frotas de agentes especializados coordenados por um supervisor. Este capítulo enquadra a orquestração como a ponte entre um plano representado (HRN-009) e uma execução confiável, e sustenta que o problema central de engenharia não é a inteligência mas a **durabilidade**: fluxos de longa duração, não deterministas e com falhas parciais têm de sobreviver às quedas, retomar de forma limpa e nunca perder nem duplicar efeitos em silêncio. O valor por padrão certo é a topologia mais simples que cumpra o requisito: a complexidade na orquestração é um custo, não uma virtude.

## Conceitos-chave

- **Topologia:** a disposição dos agentes: único, pipeline, supervisor/trabalhador ou rede.
- **Agente supervisor ou orquestrador:** um agente que planeja e delega em trabalhadores (ver PAT-002).
- **Agente trabalhador:** um agente especializado que executa uma subtarefa delegada (ver PAT-005).
- **Encaminhamento:** selecionar o próximo agente, ferramenta ou ramo em função do estado.
- **Máquina de estados:** um grafo explícito de estados e transições que governa a execução.
- **Execução duradoura:** semântica de fluxo em que o progresso é persistido em pontos de controle e é retomável.
- **Passagem (handoff):** transferir controle e contexto de um agente para outro.

## Definição

> A **orquestração** é a disciplina do harness que executa um plano através de um ou vários agentes e ferramentas: seleciona a topologia, encaminha o controle, coordena o estado e garante uma execução duradoura e com exatamente o número certo de repetições perante a falha.

## Explicação detalhada

A **seleção de topologia** é a primeira decisão e a de maior consequência. Um *agente único* com ferramentas é o padrão certo para a maioria das tarefas: é o mais barato, o mais fácil de observar e o que tem menos modos de falha por coordenação. Recorra ao multiagente apenas quando a tarefa beneficie a sério: quando as subtarefas precisarem de permissões de ferramenta *diferentes*, janelas de contexto *diferentes* ou execução *paralela* e independente. As topologias habituais são: **pipeline** (sequência fixa de etapas), **supervisor/trabalhador** (PAT-002 + PAT-005: um planejador delega em especialistas e agrega) e **rede ou pares** (os agentes passam o controle livremente). O custo de coordenação sobe abruptamente com a liberdade da topologia; as redes de pares são poderosas mas as mais difíceis de tornar confiáveis, de governar e de depurar.

O **encaminhamento** é como o controle se move pelo sistema. Pode ser *dirigido pelo modelo* (o supervisor escolhe o próximo trabalhador por chamada a ferramenta), *dirigido por regras* (transições deterministas numa máquina de estados) ou *híbrido*. O encaminhamento determinista é preferível sempre que o caminho seja conhecido, porque é governável e testável; o dirigido pelo modelo se reserva para as ramificações genuinamente abertas. Codificar o fluxo como uma **máquina de estados** explícita — estados, transições permitidas e guardas — é a técnica de confiabilidade com maior alavancagem na orquestração: limita o espaço de comportamentos, torna o sistema inspecionável e permite à governança (HRN-008) ligar controles às transições.

A **durabilidade** é a propriedade que separa uma demonstração de um sistema de produção. Os fluxos agênticos são de longa duração (de segundos a horas), chamam ferramentas externas instáveis e podem cair a meio do voo. Um motor de execução duradoura persiste o progresso após cada passo, de modo que perante uma falha o fluxo *retoma* a partir do último passo concluído em vez de reiniciar. Isso exige cuidado com a semântica de efeitos: as chamadas a ferramentas com efeitos secundários têm de ser **idempotentes** ou estar protegidas com chaves de desduplicação, para que uma retoma não cobre duas vezes um cartão nem reenvie um email. Os casos difíceis são os *efeitos externos não idempotentes*; o harness trata-os com o padrão saga: registar a intenção, executar, confirmar e oferecer ações compensatórias perante uma falha parcial.

A **gestão de estado e contexto** entre agentes é onde os sistemas multiagente perdem confiabilidade. Cada passagem (PAT-005) tem de transferir *exatamente* o contexto de que o trabalhador precisa: a menos e falha; a mais e sai caro e propenso à distração. O estado compartilhado pertence a um armazém duradouro com propriedade clara, não a uma janela de contexto compartilhada flutuando livremente. A agregação das saídas dos trabalhadores precisa de um redutor explícito com resolução de conflitos, porque os trabalhadores paralelos produzirão resultados sobrepostos ou contraditórios.

Por fim, a orquestração é dona da **concorrência e do isolamento de falhas**. Os ramos paralelos (expostos pelo plano em DAG de HRN-009) melhoram a latência, mas exigem contrapressão, coordenação de limites de taxa entre ferramentas compartilhadas e compartimentação para que um trabalhador que falha não esgote o orçamento nem bloqueie os irmãos. Os tempos limite, os disjuntores e os orçamentos por trabalhador são assuntos da orquestração, não da aplicação.

## Evidência de produção

> **Cenário ilustrativo e representativo.** Nível de evidência: teórico · Confiança: média · Fonte: observação de indústria, experiência pessoal. Os números seguintes são intervalos representativos, não uma medição de uma implantação verificada concreta.

- **Contexto:** um agente de investigação e síntese que responde a perguntas empresariais complexas.
- **Cenário:** um supervisor decompõe uma pergunta, despacha trabalhadores de recuperação e análise em paralelo, e agrega uma resposta com citações.
- **Tecnologia:** motor de fluxo duradouro, topologia supervisor/trabalhador, encaminhador determinista para as etapas conhecidas, chaves de desduplicação nas ferramentas com efeitos.
- **Carga:** execuções concorrentes de vários trabalhadores; cada execução dura minutos e faz várias chamadas a ferramentas externas.
- **Resultados (representativos):** o leque paralelo costuma cortar a latência de relógio num múltiplo significativo diante da execução sequencial, enquanto os pontos de controle duradouros reduzem a taxa de execuções com falha ao eliminar os reinícios completos provocados por quedas. O custo é uma maior despesa em tokens (mais agentes, mais contexto) e uma complexidade de coordenação acrescentada.

### Lições aprendidas

A maioria das equipes recorre ao multiagente demasiado cedo. A progressão confiável é: fazer funcionar um agente único, codificá-lo como máquina de estados, acrescentar durabilidade e *só então* dividir em trabalhadores, apenas onde o paralelismo ou o isolamento de permissões compense o custo de coordenação.

## Modos de falha observados

| Modo de falha | Gatilho | Mitigação |
|---|---|---|
| Efeitos secundários duplicados | A retoma reexecuta um passo não idempotente | Chaves de idempotência / compensação saga |
| Progresso perdido numa queda | Sem pontos de controle | Motor de execução duradoura |
| Perda de contexto na passagem | O trabalhador recebe menos estado do que precisa | Contratos de passagem explícitos e tipados |
| Impasse de coordenação | Os trabalhadores esperam uns pelos outros | Encaminhamento acíclico, tempos limite, arbitragem do supervisor |
| Explosão de custo | Delegação recursiva ou entre pares sem limite | Orçamento de agentes por execução + limite de profundidade de delegação |
| Agregação contraditória | Os trabalhadores paralelos discordam | Redutor explícito com resolução de conflitos |
| Gargalo de ferramenta compartilhada | Os trabalhadores martelam uma API com limite de taxa | Limite de taxa centralizado + contrapressão |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Taxa de conclusão de tarefa | Alta | De ponta a ponta, verificada |
| Latência p50/p95/p99 | Minimizada | O paralelismo melhora p50; as caudas são dominadas pelos trabalhadores lentos |
| Taxa de sucesso de retoma | → 100 % | Fluxos que recuperam após uma queda |
| Taxa de efeitos duplicados | → 0 | Correção da idempotência |
| Custo por tarefa | Limitado | Limites de agentes, profundidade e tokens |
| Débito | Escala com a concorrência | Limitado pelos limites de taxa das ferramentas compartilhadas |

## Métricas de custo

- O **custo em tokens** cresce com o número de agentes e o contexto por agente; o multiagente é materialmente mais caro do que o agente único para a mesma tarefa.
- **Sobrecusto de orquestração:** inferência de planejamento do supervisor mais a de agregação por execução.
- **Sobrecusto de durabilidade:** as escritas de ponto de controle (baratas) diante da grande economia de não reiniciar as execuções com falha.

## Características de escalabilidade

O débito do agente único escala horizontalmente e sem estado. O supervisor/trabalhador escala as subtarefas em paralelo até aos limites de taxa das ferramentas compartilhadas, que se tornam o teto real. Os motores de fluxo duradouro escalam com o número de fluxos em andamento; o armazenamento de pontos de controle e o despachante são os componentes a dimensionar. As topologias de rede ou pares são as que pior escalam: o sobrecusto de coordenação e a superfície de falha crescem de forma superlinear com o número de agentes, e por isso as topologias de supervisor limitadas são o padrão na empresa.

## Conteúdo relacionado

- HRN-003 — O lugar da orquestração na taxonomia do harness.
- HRN-009 — O plano que a orquestração executa.
- PAT-002 — Padrão de agente supervisor.
- PAT-005 — Padrão de delegação multiagente.

## Referências

- Temporal e outros motores de fluxo de execução duradoura (padrão saga, durabilidade de fluxos).
- Anthropic, “Building Effective Agents” (agente único primeiro, orientação de topologias).
- LangGraph e a orquestração por máquina de estados para agentes.

## Perguntas frequentes

**P: Agente único ou multiagente?**
R: Por padrão, agente único. Acrescente agentes apenas por paralelismo ou por isolamento de permissões ou contexto que compense o custo de coordenação.

**P: Por que uma máquina de estados em vez de ciclos de agente livres?**
R: As máquinas de estados limitam o comportamento, são testáveis e permitem à governança ligar controles às transições. Os ciclos livres são poderosos, mas difíceis de tornar confiáveis ou auditáveis.

**P: Como evito cobrar duas vezes a um cliente numa repetição?**
R: Torne idempotentes as chamadas a ferramentas com efeitos (chaves de desduplicação) ou envolva-as numa saga com ações compensatórias, e execute-as sobre um motor duradouro que retome em vez de reiniciar.
