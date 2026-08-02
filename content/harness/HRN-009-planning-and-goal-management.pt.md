---
title: "Planejamento e gestão de objetivos"
summary: "Decomposição de objetivos, gestão de subobjetivos e replanejamento: quando o harness deixa o modelo decidir e quando fixa o caminho em código."
---

# Planejamento e gestão de objetivos

## Resumo executivo

Um agente confiável não se limita a reagir token a token: persegue um objetivo através de um plano representado e inspecionável. O planejamento e gestão de objetivos é a camada do harness que converte um objetivo de alto nível num plano estruturado e executável, acompanha seu estado ao longo de uma execução de horizonte longo e o revisa quando a realidade se afasta do previsto. Este capítulo trata o plano como uma **estrutura de dados de primeira classe** pertencente ao harness, não como uma cadeia de pensamento efêmera presa na janela de contexto. Externalizar o plano é o que torna o comportamento do agente auditável, retomável e recuperável.

## Conceitos-chave

- **Objetivo:** o estado final desejado que é atribuído ao agente, com critérios de sucesso.
- **Plano:** um conjunto ordenado ou parcialmente ordenado de tarefas que se espera que alcancem o objetivo.
- **Tarefa ou passo:** uma unidade atômica de trabalho mapeada para uma ou mais chamadas a ferramenta.
- **Decomposição:** o ato de dividir um objetivo em tarefas (ver PAT-010).
- **Representação do plano:** a estrutura explícita (lista, árvore, DAG, máquina de estados) em que o plano é armazenado.
- **Replanejamento:** rever o plano em resposta a uma falha, a informação nova ou a uma mudança de restrições.
- **Estado do plano:** o registro duradouro de que passos estão pendentes, em andamento, concluídos ou com falha.

## Definição

> O **planejamento e gestão de objetivos** é a disciplina do harness que representa um objetivo e seu plano decomposto como estado explícito e duradouro; seleciona e sequencia tarefas contra esse plano; e reconcilia continuamente o plano com os resultados observados através de replanejamento.

## Explicação detalhada

O planejamento começa pela **decomposição**: converter um objetivo em tarefas cuja conclusão, no conjunto, satisfaz os critérios de sucesso do objetivo (PAT-010 nomeia este padrão). As estratégias de decomposição trocam custo por adaptabilidade. *Planejar e depois executar* fixa um plano completo à partida: barato, previsível e fácil de governar, mas frágil quando o mundo o surpreende. O *planejamento entrelaçado* (a família ReAct) planeja um passo de cada vez a partir das observações: adaptável e robusto, mas mais caro e mais difícil de limitar. O *planejamento hierárquico* combina os dois: um plano grosseiro de fases, cada uma expandida em passos concretos mesmo a tempo. Os harnesses maduros escolhem consoante a tarefa: os fluxos deterministas e bem compreendidos favorecem planejar e depois executar; a investigação aberta favorece o entrelaçamento.

A **representação do plano** é a decisão portante. Uma lista plana de tarefas basta para trabalho linear; um **DAG** captura dependências e desbloqueia o paralelismo (o orquestrador, HRN-010, pode despachar ramos independentes simultaneamente); uma **máquina de estados** é o adequado quando as transições são governadas e têm de poder ser enumeradas exaustivamente. Seja qual for a forma, o plano tem de estar *externalizado e persistido*. Um plano que só vive dentro do contexto do modelo se perde numa queda, é invisível para a observabilidade e impossível de governar. Externalizá-lo permite ao harness retomar a partir do último estado duradouro, permite às pessoas inspecioná-lo e editá-lo, e permite à camada de governança (HRN-008) raciocinar sobre o que o agente tenciona fazer *antes* de o fazer.

A **gestão de objetivos** é a camada acima dos planos concretos. Acompanha os critérios de sucesso de forma explícita, de modo que a conclusão é *verificada* em vez de afirmada pelo modelo. Gerencia subobjetivos e suas dependências, resolve conflitos e prioridades entre objetivos, e faz cumprir condições de terminação — orçamentos de passos, de tempo e tetos de custo — que evitam a falha clássica de um agente iterando eternamente sobre um objetivo inalcançável. Os critérios de terminação fazem parte da especificação do objetivo, não são uma ideia posterior.

O **replanejamento** é onde o planejamento ganha seu lugar num sistema *confiável*. O mundo não é estacionário: as ferramentas falham, os dados expiram, os pressupostos se quebram. O ciclo de replanejamento compara o resultado de cada passo com o esperado e desencadeia uma revisão perante a divergência: um passo com falha, uma pré-condição que não se verifica mais ou informação nova que invalida as tarefas seguintes. Um replanejamento eficaz é *limitado*: prefira a reparação local (repetir, substituir uma ferramenta, inserir um passo de recuperação) a descartar o plano inteiro, e escale para uma redecomposição completa apenas quando a reparação local falha repetidamente. Isto se liga diretamente aos padrões de estratégia de recuperação e evita que o replanejamento entre em ciclo. Um orçamento de replanejamento — um limite ao número de vezes que um plano pode ser revisto antes de escalar para um humano ou um supervisor — impede que o agente queime custo dentro de um ciclo de planejamento.

## Evidência de produção

> **Cenário ilustrativo e representativo.** Nível de evidência: teórico · Confiança: média · Fonte: observação de indústria, experiência pessoal. Os intervalos seguintes são representativos de padrões observados, não medições de um sistema verificado concreto.

- **Contexto:** um agente de migração de dados de vários passos que reconcilia registros entre sistemas.
- **Cenário:** o objetivo (“migrar e reconciliar a conta X”) se decompõe em fases de extração, transformação, validação e carregamento, com dependências entre passos.
- **Tecnologia:** plano em DAG persistido num armazém duradouro; replanejamento entrelaçado perante falhas de validação; orçamentos de passos e de custo.
- **Carga:** tarefas de horizonte longo que abrangem de minutos a horas, com dezenas de passos cada uma.
- **Resultados (representativos):** externalizar o plano e acrescentar replanejamento limitado costuma elevar substancialmente a taxa de conclusão de tarefa diante de uma linha de base de planejar uma só vez, em tarefas com taxas de falha realistas, sobretudo por recuperar localmente de falhas transitórias em vez de abortar a execução inteira.

### Lições aprendidas

Os maiores ganhos de confiabilidade não vêm de planos iniciais mais inteligentes, mas de um **replanejamento barato e bem limitado** e de **orçamentos de terminação explícitos**. Os agentes sem limite falham iterando; os agentes limitados falham em segurança e escalam.

## Modos de falha observados

| Modo de falha | Gatilho | Mitigação |
|---|---|---|
| Perda do plano numa queda | O plano só vive no contexto | Persistir o plano como estado duradouro |
| Ciclo infinito | Sem orçamento de terminação | Orçamentos de passos, tempo e custo, mais limite de replanejamento |
| Sobredecomposição | O objetivo é partido em microtarefas triviais | Ajustar a granularidade do passo às chamadas a ferramenta |
| Replanejamento em ciclo | Redecomposição completa perante cada falha menor | Reparação local limitada antes de replanejar globalmente |
| Conclusão por verificar | O modelo afirma ter terminado sem verificar os critérios | Verificação explícita dos critérios de sucesso |
| Violação de dependências | Um passo é executado antes de sua pré-condição se verificar | Ordem do DAG imposta pelo orquestrador |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Taxa de conclusão de tarefa | Alta | Ao nível do objetivo, com critérios verificados |
| Passos por tarefa | Mínimos | Menos é mais barato; vigiar a sobredecomposição |
| Taxa de replanejamento | Baixa ou moderada | Os picos assinalam planos frágeis ou ferramentas instáveis |
| Sucesso de recuperação do plano | Alto | Fração de falhas reparadas sem abortar |
| Taxa de incumprimento de orçamento | → 0 | Tarefas que batem nos tetos de passos ou custo |

## Métricas de custo

- O **custo por tarefa** escala com passos × inferência por passo + custo de ferramentas; a sobredecomposição inflaciona-o diretamente.
- **Sobrecusto de planejamento:** o planejamento entrelaçado acrescenta uma chamada de inferência por passo; planejar e depois executar amortiza uma única chamada de planejamento por muitos passos.
- **Custo de replanejamento:** cada replanejamento é inferência adicional; o limite de replanejamento limita o custo no pior caso por tarefa.

## Características de escalabilidade

Os planos em DAG escalam o débito de execução ao expor ao orquestrador os ramos paralelizáveis. A complexidade do plano escala o custo de inferência de planejamento de forma superlinear, portanto a decomposição hierárquica (planejar fases de forma grosseira e expandir preguiçosamente) mantém limitado o custo de planejamento por tarefa à medida que os objetivos crescem. O estado duradouro do plano escala com o número de objetivos concorrentes em andamento, não com sua duração, o que faz do armazém de estado o componente a dimensionar para a concorrência.

## Conteúdo relacionado

- HRN-003 — Onde encaixa o planejamento na taxonomia do harness.
- HRN-010 — A orquestração executa o plano e despacha os ramos paralelos.
- PAT-010 — Padrão de decomposição de objetivos.

## Referências

- Yao et al., “ReAct: Synergizing Reasoning and Acting in Language Models”.
- Wang et al., “Plan-and-Solve Prompting”.
- Planejamento clássico em IA: literatura sobre STRIPS e HTN (redes hierárquicas de tarefas).

## Perguntas frequentes

**P: O plano deve viver na janela de contexto?**
R: Não. Persista-o como estado duradouro. O contexto é volátil, limitado em dimensão e ingovernável; um plano persistido é retomável, inspecionável e auditável.

**P: Planejar e depois executar, ou entrelaçar?**
R: Escolha consoante a tarefa. Os fluxos deterministas favorecem planejar e depois executar; as tarefas abertas ou propensas a falhar favorecem o replanejamento entrelaçado. O planejamento hierárquico mistura os dois.

**P: Como evito que um agente itere para sempre?**
R: Faça com que os critérios de terminação façam parte do objetivo: orçamentos de passos, tempo e custo mais um limite de replanejamento, com escalonamento para um humano ou supervisor perante o incumprimento.
