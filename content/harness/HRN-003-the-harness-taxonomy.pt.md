---
title: "A taxonomia do harness"
summary: "Decomposição precisa dos componentes do harness — memória, ferramentas, planeamento, orquestração, observabilidade, avaliação, governação e segurança — e de como encaixam entre si."
---

# A taxonomia do harness

## Resumo executivo
O harness não é um monólito: é um conjunto de componentes distintos, cada um com uma responsabilidade clara e interfaces claras com os restantes. Este capítulo apresenta a taxonomia canónica: oito componentes — memória, ferramentas, planeamento, orquestração, observabilidade, avaliação, governação e segurança — organizados em três camadas (o ciclo de execução, as preocupações transversais e os controlos). A taxonomia é o mapa que o resto do manual preenche.

## Conceitos-chave
- **Componente:** uma parte delimitada do harness com uma única responsabilidade principal.
- **Camada de execução:** os componentes que movem o ciclo percecionar–raciocinar–agir (planeamento, orquestração, memória, ferramentas).
- **Camada transversal:** preocupações que instrumentam ou medem o ciclo sem estarem dentro dele (observabilidade, avaliação).
- **Camada de controlo:** preocupações que limitam o que o ciclo pode fazer (governação, segurança).
- **Interface:** o contrato pelo qual dois componentes trocam informação ou autoridade.

## Definição
A **taxonomia do harness** é a decomposição canónica do andaime de engenharia de um sistema agêntico em componentes e camadas com nome, definindo a responsabilidade de cada componente e as suas relações com os restantes. Serve como vocabulário partilhado e como lista de verificação: um harness de qualidade produtiva tem de abordar conscientemente cada componente, mesmo que escolha uma implementação mínima.

## Explicação detalhada

A taxonomia organiza oito componentes em três camadas. A estratificação importa: diz-lhe que componentes *fazem o trabalho*, quais *observam o trabalho* e quais *delimitam o trabalho*.

### Camada de execução — move o ciclo
Os componentes que produzem efetivamente o comportamento do agente.

- **Planeamento e gestão de objetivos (HRN-009):** decompõe um objetivo em subobjetivos, decide a ação seguinte, gere o replaneamento quando um passo falha e deteta a conclusão ou o impasse. Responde a «o que deve acontecer a seguir?».
- **Orquestração (HRN-010):** o runtime que executa o ciclo: monta o contexto, chama o modelo, despacha chamadas a ferramentas, gere retentativas e tempos-limite, encaminha entre modelos ou subagentes e aplica orçamentos. Responde a «quem corre, com quê, e o que acontece à saída».
- **Memória (HRN-005):** governa o que entra no contexto do modelo: memória de trabalho de curto prazo, armazenamentos de longo prazo, recuperação, compressão e esquecimento. Responde a «o que o modelo vê e recorda».
- **Ferramentas / atuação:** os contratos tipados através dos quais o agente lê e escreve nos sistemas da empresa, com validação explícita de entradas, esquemas de saída, idempotência e semântica de falha. Responde a «como o agente afeta o mundo».

O modelo situa-se *dentro* desta camada como componente invocado, não como o sistema. É o reenquadramento central de HRN-001.

### Camada transversal — mede o ciclo
Não produzem comportamento; tornam o comportamento visível e quantificável.

- **Observabilidade (HRN-006):** rastreio, spans, registo estruturado, contabilização de tokens e custo, e reprodução. Transforma uma execução opaca e não determinística num artefacto inspecionável. Responde a «o que aconteceu, exatamente».
- **Avaliação (HRN-007):** medição offline e online da qualidade: conjuntos dourados, LLM como juiz, suites de regressão, métricas de conclusão de tarefa. Responde a «isto é realmente bom, e está a melhorar ou a piorar?».

Observabilidade e avaliação são codependentes: a avaliação precisa dos traços que a observabilidade produz, e a observabilidade rende mais quando os seus dados alimentam a avaliação.

### Camada de controlo — delimita o ciclo
Limitam a autoridade e defendem o sistema.

- **Governação (HRN-008):** codifica política, fluxos de aprovação, prestação de contas e auditabilidade como controlos aplicados: portas com humano no ciclo, políticas de ações permitidas e registos de quem ou o quê autorizou cada ação. Responde a «isto é permitido, e quem responde?».
- **Segurança (HRN-011):** trata o modelo e as suas entradas como não confiáveis: defesa contra injeção de prompts, isolamento de ferramentas, credenciais de privilégio mínimo, validação de saídas e controlos de exfiltração de dados. Responde a «pode um adversário fazer este sistema fazer algo que não deve?».

### Como os componentes se compõem
Um pedido entra por **planeamento**, que entrega um plano à **orquestração**. A orquestração monta o contexto a partir da **memória**, chama o **modelo** e encaminha as ações escolhidas para as **ferramentas**. Ao longo de todo o processo, a **observabilidade** regista cada span e a **avaliação** pontua resultados; a **governação** trava as ações de risco e a **segurança** guarda as fronteiras. As interfaces entre componentes são onde a fiabilidade se ganha ou se perde: um contrato descuidado entre memória e orquestração, ou uma chamada do modelo a uma ferramenta sem validação, são uma fonte clássica de falha em produção.

### Como usar a taxonomia
A taxonomia é também uma **lista de maturidade**. Para cada componente, pergunte: temo-lo, é explícito, está testado? Muitos projetos de «agentes» implementam apenas a camada de execução e vão para produção sem observabilidade, avaliação, governação nem segurança: os quatro componentes que distinguem um sistema de uma demonstração. Um harness equilibrado investe nas três camadas.

| Camada | Componente | Responsabilidade principal | Capítulo |
|--------|------------|----------------------------|----------|
| Execução | Planeamento e objetivos | Decidir a ação seguinte; replanear | HRN-009 |
| Execução | Orquestração | Executar o ciclo; encaminhar; orçamentar | HRN-010 |
| Execução | Memória | Controlar o contexto; recuperar; esquecer | HRN-005 |
| Execução | Ferramentas / atuação | Agir sobre o mundo através de contratos | HRN-003 |
| Transversal | Observabilidade | Rastrear, registar, contabilizar, reproduzir | HRN-006 |
| Transversal | Avaliação | Medir qualidade; travar regressões | HRN-007 |
| Controlo | Governação | Aplicar política; aprovações; auditoria | HRN-008 |
| Controlo | Segurança | Defender contra adversários | HRN-011 |

## Modos de falha observados
- **Camadas em falta:** implementar apenas a camada de execução (um ciclo que funciona) e omitir observabilidade, avaliação, governação e segurança: o precipício da demonstração para produção.
- **Acoplamento de componentes:** diluir responsabilidades (por exemplo, a orquestração a comprimir memória em silêncio) de modo que as falhas não possam ser isoladas nem testadas.
- **Interfaces frágeis:** contratos sem validação nem tipagem entre componentes, sobretudo modelo→ferramenta e recuperação→contexto, que propagam dados maus por todo o ciclo.
- **Excesso de orquestração:** construir topologias multiagente elaboradas antes de os componentes de um único agente serem fiáveis individualmente.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Cobertura de componentes | 8/8 abordados | Cada componente implementado conscientemente ou deixado no mínimo de forma deliberada |
| Taxa de validação de interfaces | 100 % das chamadas modelo→ferramenta | Evita propagar argumentos malformados ou alucinados |
| Taxa de conclusão de tarefa | Depende do domínio | Medida pela avaliação (HRN-007) |

## Métricas de custo
O custo concentra-se na camada de execução (inferência e chamadas a ferramentas) e no armazenamento de observabilidade (o volume de traços escala com os passos). A avaliação acrescenta custo periódico por lotes. Governação e segurança são sobretudo custo fixo de engenharia. Uma heurística útil de orçamento é atribuir o custo *por componente*, para que a otimização aponte ao verdadeiro motor da despesa e não ao mais visível.

## Características de escalabilidade
Cada componente escala por um eixo diferente: a orquestração com a concorrência, a memória com o estado retido e o tamanho do corpus, a observabilidade com os passos por execução, e a avaliação com o tamanho do corpus e as chamadas ao juiz. Como escalam de forma independente, a taxonomia é também uma ferramenta de planeamento de capacidade: os estrangulamentos aparecem em componentes concretos, não «no agente» em abstrato.

## Conteúdo relacionado
- HRN-001 — Engenharia de Harness: definição e panorama
- HRN-005 — Memória em sistemas agênticos
- HRN-006 — Observabilidade para sistemas agênticos
- HRN-009 — Planeamento e gestão de objetivos
- HRN-010 — Orquestração

## Referências
- Literatura de prática sobre arquiteturas de agentes e decomposição em componentes.
- Observação da indústria sobre a estrutura de sistemas agênticos em produção, 2023–2026.
- Santa María, S. — Notas de trabalho sobre a taxonomia do harness.

## Perguntas frequentes
**P:** Porquê oito componentes e não mais ou menos?
**R:** Oito é o conjunto mínimo que cobre executar o ciclo, medi-lo e delimitá-lo sem sobreposição. Pode subdividir (por exemplo, separar ferramentas de atuação), mas as responsabilidades mantêm-se.

**P:** O modelo é um componente do harness?
**R:** O modelo é *invocado pelo* harness e situa-se dentro da camada de execução, mas não faz parte do harness: o harness é precisamente tudo o que o rodeia.

**P:** Um sistema pequeno pode saltar a camada de controlo?
**R:** Para um brinquedo, sim; para um sistema empresarial, não. Governação e segurança são o que torna seguro colocar o sistema perante clientes, reguladores e adversários. Podem ser mínimas, mas têm de ser conscientes.
