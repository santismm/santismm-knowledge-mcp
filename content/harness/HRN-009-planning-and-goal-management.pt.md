---
title: "Planeamento e gestão de objetivos"
summary: "Decomposição de objetivos, gestão de subobjetivos e replaneamento: quando o harness deixa o modelo decidir e quando fixa o caminho em código."
---

# Planeamento e gestão de objetivos

## Resumo executivo

Um agente fiável não se limita a reagir token a token: persegue um objetivo através de um plano representado e inspecionável. O planeamento e gestão de objetivos é a camada do harness que converte um objetivo de alto nível num plano estruturado e executável, acompanha o seu estado ao longo de uma execução de horizonte longo e revê-o quando a realidade se afasta do previsto. Este capítulo trata o plano como uma **estrutura de dados de primeira classe** pertencente ao harness, não como uma cadeia de pensamento efémera presa na janela de contexto. Externalizar o plano é o que torna o comportamento do agente auditável, retomável e recuperável.

## Conceitos-chave

- **Objetivo:** o estado final desejado que é encomendado ao agente, com critérios de sucesso.
- **Plano:** um conjunto ordenado ou parcialmente ordenado de tarefas que se espera que alcancem o objetivo.
- **Tarefa ou passo:** uma unidade atómica de trabalho mapeada para uma ou mais chamadas a ferramenta.
- **Decomposição:** o ato de partir um objetivo em tarefas (ver PAT-010).
- **Representação do plano:** a estrutura explícita (lista, árvore, DAG, máquina de estados) em que o plano é armazenado.
- **Replaneamento:** rever o plano em resposta a uma falha, a informação nova ou a uma mudança de restrições.
- **Estado do plano:** o registo duradouro de que passos estão pendentes, em curso, feitos ou falhados.

## Definição

> O **planeamento e gestão de objetivos** é a disciplina do harness que representa um objetivo e o seu plano decomposto como estado explícito e duradouro; seleciona e sequencia tarefas contra esse plano; e reconcilia continuamente o plano com os resultados observados através de replaneamento.

## Explicação detalhada

O planeamento começa pela **decomposição**: converter um objetivo em tarefas cuja conclusão, no conjunto, satisfaz os critérios de sucesso do objetivo (PAT-010 nomeia este padrão). As estratégias de decomposição trocam custo por adaptabilidade. *Planear e depois executar* fixa um plano completo à partida: barato, previsível e fácil de governar, mas frágil quando o mundo o surpreende. O *planeamento entrelaçado* (a família ReAct) planeia um passo de cada vez a partir das observações: adaptável e robusto, mas mais caro e mais difícil de limitar. O *planeamento hierárquico* combina os dois: um plano grosseiro de fases, cada uma expandida em passos concretos mesmo a tempo. Os harnesses maduros escolhem consoante a tarefa: os fluxos deterministas e bem compreendidos favorecem planear e depois executar; a investigação aberta favorece o entrelaçamento.

A **representação do plano** é a decisão portante. Uma lista plana de tarefas basta para trabalho linear; um **DAG** captura dependências e desbloqueia o paralelismo (o orquestrador, HRN-010, pode despachar ramos independentes em simultâneo); uma **máquina de estados** é o adequado quando as transições são governadas e têm de poder ser enumeradas exaustivamente. Seja qual for a forma, o plano tem de estar *externalizado e persistido*. Um plano que só vive dentro do contexto do modelo perde-se numa queda, é invisível para a observabilidade e impossível de governar. Externalizá-lo permite ao harness retomar a partir do último estado duradouro, permite às pessoas inspecioná-lo e editá-lo, e permite à camada de governação (HRN-008) raciocinar sobre o que o agente tenciona fazer *antes* de o fazer.

A **gestão de objetivos** é a camada acima dos planos concretos. Acompanha os critérios de sucesso de forma explícita, de modo que a conclusão é *verificada* em vez de afirmada pelo modelo. Gere subobjetivos e as suas dependências, resolve conflitos e prioridades entre objetivos, e faz cumprir condições de terminação — orçamentos de passos, de tempo e tetos de custo — que evitam a falha clássica de um agente a iterar eternamente sobre um objetivo inalcançável. Os critérios de terminação fazem parte da especificação do objetivo, não são uma ideia posterior.

O **replaneamento** é onde o planeamento ganha o seu lugar num sistema *fiável*. O mundo não é estacionário: as ferramentas falham, os dados caducam, os pressupostos quebram-se. O ciclo de replaneamento compara o resultado de cada passo com o esperado e desencadeia uma revisão perante a divergência: um passo falhado, uma pré-condição que já não se verifica ou informação nova que invalida as tarefas seguintes. Um replaneamento eficaz é *limitado*: prefira a reparação local (repetir, substituir uma ferramenta, inserir um passo de recuperação) a descartar o plano inteiro, e escale para uma redecomposição completa apenas quando a reparação local falha repetidamente. Isto liga-se diretamente aos padrões de estratégia de recuperação e evita que o replaneamento entre em ciclo. Um orçamento de replaneamento — um limite ao número de vezes que um plano pode ser revisto antes de escalar para um humano ou um supervisor — impede que o agente queime custo dentro de um ciclo de planeamento.

## Evidência de produção

> **Cenário ilustrativo e representativo.** Nível de evidência: teórico · Confiança: média · Fonte: observação de indústria, experiência pessoal. Os intervalos seguintes são representativos de padrões observados, não medições de um sistema verificado concreto.

- **Contexto:** um agente de migração de dados de vários passos que reconcilia registos entre sistemas.
- **Cenário:** o objetivo («migrar e reconciliar a conta X») decompõe-se em fases de extração, transformação, validação e carregamento, com dependências entre passos.
- **Tecnologia:** plano em DAG persistido num armazém duradouro; replaneamento entrelaçado perante falhas de validação; orçamentos de passos e de custo.
- **Carga:** tarefas de horizonte longo que abrangem de minutos a horas, com dezenas de passos cada uma.
- **Resultados (representativos):** externalizar o plano e acrescentar replaneamento limitado costuma elevar substancialmente a taxa de conclusão de tarefa face a uma linha de base de planear uma só vez, em tarefas com taxas de falha realistas, sobretudo por recuperar localmente de falhas transitórias em vez de abortar a execução inteira.

### Lições aprendidas

Os maiores ganhos de fiabilidade não vêm de planos iniciais mais inteligentes, mas de um **replaneamento barato e bem limitado** e de **orçamentos de terminação explícitos**. Os agentes sem limite falham a iterar; os agentes limitados falham em segurança e escalam.

## Modos de falha observados

| Modo de falha | Gatilho | Mitigação |
|---|---|---|
| Perda do plano numa queda | O plano só vive no contexto | Persistir o plano como estado duradouro |
| Ciclo infinito | Sem orçamento de terminação | Orçamentos de passos, tempo e custo, mais limite de replaneamento |
| Sobredecomposição | O objetivo é partido em microtarefas triviais | Ajustar a granularidade do passo às chamadas a ferramenta |
| Replaneamento em ciclo | Redecomposição completa perante cada falha menor | Reparação local limitada antes de replanear globalmente |
| Conclusão por verificar | O modelo afirma ter terminado sem verificar os critérios | Verificação explícita dos critérios de sucesso |
| Violação de dependências | Um passo é executado antes de a sua pré-condição se verificar | Ordem do DAG imposta pelo orquestrador |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Taxa de conclusão de tarefa | Alta | Ao nível do objetivo, com critérios verificados |
| Passos por tarefa | Mínimos | Menos é mais barato; vigiar a sobredecomposição |
| Taxa de replaneamento | Baixa ou moderada | Os picos assinalam planos frágeis ou ferramentas instáveis |
| Sucesso de recuperação do plano | Alto | Fração de falhas reparadas sem abortar |
| Taxa de incumprimento de orçamento | → 0 | Tarefas que batem nos tetos de passos ou custo |

## Métricas de custo

- O **custo por tarefa** escala com passos × inferência por passo + custo de ferramentas; a sobredecomposição inflaciona-o diretamente.
- **Sobrecusto de planeamento:** o planeamento entrelaçado acrescenta uma chamada de inferência por passo; planear e depois executar amortiza uma única chamada de planeamento por muitos passos.
- **Custo de replaneamento:** cada replaneamento é inferência adicional; o limite de replaneamento limita o custo no pior caso por tarefa.

## Características de escalabilidade

Os planos em DAG escalam o débito de execução ao expor ao orquestrador os ramos paralelizáveis. A complexidade do plano escala o custo de inferência de planeamento de forma superlinear, pelo que a decomposição hierárquica (planear fases de forma grosseira e expandir preguiçosamente) mantém limitado o custo de planeamento por tarefa à medida que os objetivos crescem. O estado duradouro do plano escala com o número de objetivos concorrentes em curso, não com a sua duração, o que faz do armazém de estado o componente a dimensionar para a concorrência.

## Conteúdo relacionado

- HRN-003 — Onde encaixa o planeamento na taxonomia do harness.
- HRN-010 — A orquestração executa o plano e despacha os ramos paralelos.
- PAT-010 — Padrão de decomposição de objetivos.

## Referências

- Yao et al., «ReAct: Synergizing Reasoning and Acting in Language Models».
- Wang et al., «Plan-and-Solve Prompting».
- Planeamento clássico em IA: literatura sobre STRIPS e HTN (redes hierárquicas de tarefas).

## Perguntas frequentes

**P: O plano deve viver na janela de contexto?**
R: Não. Persista-o como estado duradouro. O contexto é volátil, limitado em dimensão e ingovernável; um plano persistido é retomável, inspecionável e auditável.

**P: Planear e depois executar, ou entrelaçar?**
R: Escolha consoante a tarefa. Os fluxos deterministas favorecem planear e depois executar; as tarefas abertas ou propensas a falhar favorecem o replaneamento entrelaçado. O planeamento hierárquico mistura os dois.

**P: Como evito que um agente itere para sempre?**
R: Faça com que os critérios de terminação façam parte do objetivo: orçamentos de passos, tempo e custo mais um limite de replaneamento, com escalonamento para um humano ou supervisor perante o incumprimento.
