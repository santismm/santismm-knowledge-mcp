---
title: "Estudos de caso em Engenharia de Harness"
summary: "Três casos compostos e anonimizados analisados pelo seu harness: o que falhou, que controle o teria evitado e o que se aprendeu ao levá-los para produção."
---

# Estudos de caso em Engenharia de Harness

## Resumo executivo

Este capítulo assenta as camadas abstratas do harness em três histórias de ponta a ponta. Cada uma é um **caso composto, representativo e anonimizado**, sintetizado a partir de padrões comuns na indústria: não é o relato de uma implantação concreta com nome próprio nem uma fonte de métricas verificadas. O que interessa é mostrar como as camadas interagem sob carga, como a memória, o planejamento, a orquestração, a governança, a segurança e a observabilidade deixam de ser capítulos separados e se tornam um só sistema. Lidos em conjunto, os casos reforçam a tese de que a confiabilidade nos agentes empresariais é uma propriedade de engenharia do harness, não uma propriedade emergente do modelo.

## Conceitos-chave

- **Estudo de caso composto:** um cenário ilustrativo montado a partir de padrões recorrentes do mundo real, explicitamente não uma implantação verificada concreta.
- **De ponta a ponta:** desde a recepção da intenção até à ação verificada, governada e observada.
- **Interação de camadas do harness:** como se compõem memória, planejamento, orquestração, governança, segurança e observabilidade.

## Definição

> Um **estudo de caso de Engenharia de Harness** é uma narrativa estruturada que segue um objetivo através de todas as camadas de um sistema agêntico para expor as decisões de desenho, os modos de falha e as compensações que determinam a confiabilidade.

## Explicação detalhada

### Caso 1 — Operações financeiras: o agente de reconciliação

> Caso composto representativo. Sem métricas verificadas; os intervalos são ilustrativos.

**Objetivo.** Reconciliar autonomamente as transações diárias entre dois livros contabilísticos e remediar as discrepâncias sob uma autoridade de despesa estrita.

**Desenho do harness.** O planejamento (HRN-009) decompõe o objetivo num DAG: extrair, casar, classificar discrepâncias, remediar, reportar. A orquestração (HRN-010) executa-o sobre um **motor de fluxo duradouro**, de modo que uma queda noturna retoma a partir do último ponto de controle em vez de reiniciar — crítico porque alguns passos de remediação movem dinheiro e nunca podem ser executados duas vezes (chaves de idempotência e compensação saga). A governança (HRN-008) coloca uma **porta de aprovação** em qualquer remediação acima de um limiar; abaixo dele, o agente age autonomamente com registro de auditoria completo. A memória (HRN-005) guarda as regras de reconciliação e os precedentes de resolução. A observabilidade (HRN-006) traça cada decisão de correspondência.

**Resultado (ilustrativo).** O agente liquida autonomamente a cauda longa de discrepâncias triviais e escala as de consequência, deslocando o esforço humano de *fazer* a reconciliação para *aprovar* exceções. **Lição:** a durabilidade e a idempotência foram as decisões portantes; a “inteligência” foi a parte fácil.

### Caso 2 — Apoio ao cliente: o agente de resolução

> Caso composto representativo. Sem métricas verificadas; os intervalos são ilustrativos.

**Objetivo.** Resolver tickets de apoio de ponta a ponta — responder a perguntas, atualizar contas, emitir pequenos créditos — sem nunca deixar escapar os dados de um cliente para outro e sem ser sequestrado pelo conteúdo do ticket.

**Desenho do harness.** Este é um harness **com a segurança primeiro** (HRN-011). Cada instância de agente transporta a autorização *do cliente que pede*, de modo que o isolamento de dados é aplicado abaixo do modelo e não por prompting. O conteúdo recuperado da base de conhecimento e do ticket é tratado como não confiável; a **saída está em lista de permitidos** e as mensagens de saída passam por prevenção de fuga de dados, quebrando a trifeta letal mesmo quando a detecção de injeção falha uma tentativa. Uma topologia de agente único (HRN-010) mantém-no simples; um passo de reflexão (autoverificação ao estilo PAT-003) revê a resposta redigida antes do envio. A governança encaminha para um humano os créditos acima de um limiar pequeno.

**Resultado (ilustrativo).** A maioria dos tickets se resolve sem intervenção humana; as tentativas de injeção nos tickets não chegam a causar dano porque a *consequência* está limitada pelas permissões e pelo controle de saída, não apenas pela detecção. **Lição:** a segurança arquitetônica ganhou à segurança por classificador; a vitória veio de restringir o que um agente sequestrado *podia* fazer.

### Caso 3 — Trabalho do conhecimento: o agente de investigação e síntese

> Caso composto representativo. Sem métricas verificadas; os intervalos são ilustrativos.

**Objetivo.** Responder a perguntas internas complexas com uma síntese citada e de confiança sobre um corpus grande.

**Desenho do harness.** Uma topologia **supervisor/trabalhador** (HRN-010, PAT-002 + PAT-005): o supervisor decompõe a pergunta e despacha em paralelo trabalhadores de recuperação e análise, e depois um agregador reconcilia seus achados numa resposta com citações. A memória (HRN-005) fornece o contexto de recuperação; o planejamento (HRN-009) é entrelaçado, porque o caminho depende do que a recuperação inicial trouxer à superfície. A avaliação (HRN-007) executa uma verificação de ancoragem com LLM como juiz que *rejeita a resposta se as afirmações não estiverem citadas*, realimentando um replanejamento. A observabilidade traça o leque para que o custo e a latência por trabalhador sejam visíveis.

**Resultado (ilustrativo).** O leque paralelo melhora a latência diante da investigação sequencial à custa de uma maior despesa em tokens; a porta de ancoragem é o que torna a saída suficientemente confiável para ser publicada. **Lição:** aqui o multiagente ganhou sua complexidade precisamente pelo *paralelismo* e pela necessidade de verificar antes de responder, não porque o multiagente seja inerentemente melhor.

### Observações transversais

Nos três se repetem as mesmas verdades: (1) ganha a topologia mais simples que cumpre o requisito; (2) a durabilidade e a idempotência, não a esperteza, decidem se um agente de longa duração é apto para produção; (3) a governança e a segurança são camadas *de execução*, não documentos; (4) a verificação (avaliação) antes de agir é o que converte uma saída plausível numa saída de confiança. Tudo isto se liga às arquiteturas de referência (ARCH-001, ARCH-002) e reformula a tese central de HRN-001: a confiabilidade é construída dentro do harness.

## Evidência de produção

> **Cenários ilustrativos e representativos.** Nível de evidência: teórico · Confiança: média · Fonte: observação de indústria, experiência pessoal. Os três casos são compostos anonimizados montados a partir de padrões recorrentes. Não contêm medições de nenhuma implantação de produção verificada, e qualquer quantidade é um intervalo ilustrativo.

- **Contexto:** operações financeiras, suporte ao cliente e trabalho do conhecimento empresarial.
- **Cenário:** automação agêntica de ponta a ponta sob restrições empresariais reais (autoridade de despesa, isolamento de dados, confiança nas citações).
- **Tecnologia:** motores de fluxo duradouro, identidade de agente com âmbito, listas de permitidos de saída, orquestração supervisor/trabalhador, avaliação com LLM como juiz.
- **Resultados:** direcionais e qualitativos; apresentados para ilustrar compensações de desenho, não para afirmar resultados medidos.

### Lições aprendidas

A lição recorrente é a contenção: as equipes que tiveram sucesso acrescentaram complexidade (multiagente, autonomia) *apenas* onde um requisito concreto o justificava, e investiram cedo nas camadas pouco vistosas — durabilidade, identidade, auditoria — que decidem se alguma coisa funciona em produção.

## Modos de falha observados

| Caso | Modo de falha dominante | Mitigação decisiva |
|---|---|---|
| Reconciliação | Executar duas vezes um passo que move dinheiro ao retomar | Chaves de idempotência + compensação saga |
| Apoio ao cliente | Exfiltração de dados via conteúdo injetado no ticket | Autorização delegada pelo usuário + lista de permitidos de saída + prevenção de fuga |
| Investigação | Afirmações sem suporte apresentadas como fatos | Porta de avaliação de ancoragem antes de responder |

## KPIs

| Métrica | Reconciliação | Apoio ao cliente | Investigação |
|---|---|---|---|
| Taxa de conclusão de tarefa | Alta (com escalonamento) | Alta | Alta |
| Taxa de intervenção humana | Baixa (só exceções) | Baixa | Moderada (revisão) |
| Taxa de incidentes de segurança | → 0 (despesa com porta) | → 0 (raio de impacto limitado) | → 0 (só com citações) |
| Latência | Tolerante a lotes | Interativa | Melhorada pelo leque |
| Custo por tarefa | Baixo | Baixo | Maior (multiagente) |

## Métricas de custo

- **Reconciliação:** barata por tarefa (agente único, determinista); o custo dominante é a aprovação humana de exceções.
- **Apoio ao cliente:** barata por tarefa; a inferência de guarda-corpos e prevenção de fuga é o acréscimo marginal.
- **Investigação:** a mais cara por tarefa, pela despesa em tokens do multiagente; justifica-se pela latência em paralelo e pela qualidade verificada.

## Características de escalabilidade

Os casos de agente único (reconciliação, suporte ao cliente) escalam horizontalmente e de forma barata, limitados pelos limites de taxa das ferramentas externas e pela capacidade de aprovação humana. O caso multiagente de investigação escala as subtarefas em paralelo até aos limites de taxa da recuperação compartilhada, com o custo em tokens crescendo a cada trabalhador acrescentado: a clássica troca latência-custo que define quando vale a pena o multiagente.

## Conteúdo relacionado

- ARCH-001 — Arquitetura de referência que exemplifica fluxos duradouros de agente único.
- ARCH-002 — Arquitetura de referência que exemplifica a orquestração supervisor/trabalhador.
- HRN-001 — Definição e panorama (a tese que estes casos reforçam).

## Referências

- Anthropic, “Building Effective Agents” e publicações sobre sistemas de investigação multiagente.
- Post-mortems e escritos de arquitetura do setor sobre fluxos agênticos duradouros.
- Os capítulos HRN-005 a HRN-011, que estes casos compõem.

## Perguntas frequentes

**P: São implantações reais?**
R: Não. São compostos anonimizados montados a partir de padrões recorrentes da indústria, apresentados para ilustrar compensações de desenho. Não contêm métricas de produção verificadas.

**P: Qual é a lição mais transferível?**
R: Acrescente complexidade apenas onde um requisito a exija, e invista primeiro em durabilidade, identidade e auditoria: as camadas que decidem se um agente sobrevive à produção.

**P: Porque é que o multiagente aparece apenas no caso 3?**
R: Porque é o único caso em que o paralelismo e a verificação justificavam o custo de coordenação. Os outros são deliberadamente de agente único.
