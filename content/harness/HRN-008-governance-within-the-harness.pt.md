---
title: "Governança dentro do harness"
summary: "Traduzir a política em controles aplicados: aprovações humanas, rastreabilidade, identidade do agente e prestação de contas exigíveis num ambiente regulado."
---

# Governança dentro do harness

## Resumo executivo

A governança não é um documento que vive numa wiki: num sistema agêntico confiável é uma **camada de execução do harness**. Este capítulo sustenta que as obrigações de IA empresarial (regulatórias, contratuais e baseadas em risco) têm de ser compiladas em controles executáveis situados no caminho crítico entre a intenção do modelo e a ação do sistema. A Engenharia de Harness trata a governança como código: pontos de decisão de política, portas de aprovação e guarda-corpos que observam, permitem, transformam ou bloqueiam cada chamada a ferramenta. Sem essa camada, a autonomia de um agente está por governar por construção; com ela, a autonomia se torna limitada, auditável e defensável.

## Conceitos-chave

- **Ponto de aplicação de política (PEP):** o componente do harness que intercepta uma ação do agente e consulta uma decisão.
- **Ponto de decisão de política (PDP):** o motor que avalia a política contra o contexto da ação e devolve permitir, negar ou transformar.
- **Guarda-corpo:** uma verificação em execução sobre entradas ou saídas (conteúdo, esquema, dados pessoais, jurisdição) que restringe o comportamento.
- **Porta de aprovação:** um controle que suspende a execução à espera de uma decisão humana ou de uma autoridade superior (ver PAT-001).
- **Política como código:** regras de governança expressas num formato declarativo, versionado e testável.
- **Rastro de auditoria:** o registro imutável do que foi tentado, do que foi decidido e por quê.

## Definição

> A **governança dentro do harness** é a disciplina de incorporar a aplicação de políticas, os fluxos de aprovação e os guarda-corpos como uma camada de execução de primeira classe de um sistema agêntico, de modo que toda a ação iniciada pelo modelo seja mediada por uma decisão explícita e auditável derivada da política da empresa.

## Explicação detalhada

A camada de governança se estrutura em torno da clássica **separação PEP/PDP** tomada da arquitetura de autorização (XACML, OPA) e adaptada a agentes não deterministas. O ponto de aplicação é tecido no caminho de invocação de ferramentas do harness, de modo que *nenhuma* ação com efeito — enviar um email, escrever numa base de dados, transferir fundos, chamar uma API externa — chegue a um efetor sem ser avaliada antes. O ponto de decisão avalia a ação contra um **pacote de políticas**: um conjunto de regras versionado e testável que cobre em nome de quem o agente age, que classes de dados toca, que jurisdições se aplicam e que limites de despesa ou de raio de impacto estão em vigor.

Para além do simples permitir/negar importam três resultados de aplicação. **Transformar** permite ao harness autorizar uma ação neutralizando seu risco: redigir dados pessoais antes de uma chamada de saída, reduzir o âmbito de uma consulta ou limitar o montante de uma transação. **Escalar** encaminha a ação para uma porta de aprovação (PAT-001), suspendendo de forma duradoura o plano do agente até que um humano ou um agente supervisor decida. **Negar com explicação** devolve uma justificação estruturada ao contexto do agente para que o ciclo de raciocínio replaneie em vez de repetir às cegas.

Os guarda-corpos operam em duas fronteiras. Os *guarda-corpos de entrada* filtram o conteúdo recuperado e as instruções do usuário à procura de injeção, padrões de jailbreak e pedidos fora de âmbito antes de influenciarem o plano. Os *guarda-corpos de saída* validam o conteúdo gerado e os argumentos estruturados das ferramentas contra esquema, política de conteúdo e regras de fuga de dados antes de atravessarem a fronteira de confiança. E algo essencial: os guarda-corpos são **em camadas, não únicos**. Um só classificador é um único ponto de falha, portanto a defesa em profundidade combina verificações deterministas (expressões regulares, esquema, listas de permitidos), estatísticas (classificadores) e baseadas em modelo (LLM como juiz), com valores padrão conservadores de fechamento em caso de falha para as ações de alto risco.

A governança define ainda o **gradiente de autonomia**. O harness atribui a cada classe de ação um modo de controle dentro de um espectro: totalmente autônomo, autônomo com registro, humano no ciclo (aprovação obrigatória) ou humano sobre o ciclo (o humano pode interromper). Esse mapeamento é ele próprio política: um reembolso abaixo de 50 € pode ser autônomo; um reembolso acima de 5.000 €, ou qualquer ação que toque dados regulados, exige uma porta de aprovação. A taxonomia destes modos de controle se liga diretamente à taxonomia do harness (HRN-003) e ao quadro de governança empresarial (GOV-001), que fornece as obrigações que esta camada compila.

Por fim, a governança só é credível se for **observável e demonstrável**. Cada decisão — a ação proposta, a versão de política consultada, as entradas, o veredicto e a justificação — é escrita num rastro de auditoria imutável e consultável. É isso que converte “temos uma política de IA” em “podemos demonstrar, ação a ação, que a política foi aplicada”, que é o patamar probatório que reguladores e auditores aplicam de fato.

## Evidência de produção

> **Cenário ilustrativo e representativo.** Nível de evidência: teórico · Confiança: média · Fonte: observação de indústria, experiência pessoal. Os números seguintes são intervalos realistas extraídos de padrões observados, não medições de uma implantação verificada concreta.

- **Contexto:** um agente de back-office de serviços financeiros que redige e executa remediações a clientes.
- **Cenário:** o agente deve resolver autonomamente disputas de valor baixo sem nunca movimentar fundos acima de um limiar nem tocar dados de outro cliente.
- **Tecnologia:** orquestrador com um PEP em cada chamada a ferramenta; pacote de políticas ao estilo OPA; guarda-corpos de classificador, esquema e lista de permitidos; fila de aprovação duradoura.
- **Carga:** dezenas de milhares de ações por dia, com uma percentagem de um só dígito encaminhada para portas de aprovação.
- **Resultados (representativos):** em implantações ilustrativas desta forma, as camadas de governança costumam reduzir numa ordem de grandeza as violações de política de severidade alta diante de uma linha de base por governar, à custa de uma latência acrescentada por ação da ordem das dezenas baixas de milissegundos para as verificações deterministas, e de uma latência ponta a ponta nas ações escaladas limitada pelo tempo de resposta humano.

### Lições aprendidas

Os valores padrão de fechamento em caso de falha nas classes de ação de alto risco não são negociáveis; as falhas caras vêm de ações que *nunca foram avaliadas* porque se acrescentou uma ferramenta nova sem a política correspondente. A governança tem, por isso, de controlar o **registro de ferramentas**, não apenas sua invocação.

## Modos de falha observados

| Modo de falha | Gatilho | Mitigação |
|---|---|---|
| Contorno de política | Ferramenta nova acrescentada sem gancho PEP | Controlar o registro de ferramentas; negar por padrão o que não está mapeado |
| Evasão de guarda-corpo | A injeção de prompt reescreve a intenção e passa um único classificador | Guarda-corpos em camadas com fechamento em caso de falha; verificações de entrada e de saída |
| Fadiga de aprovação | Portas demasiado largas inundam os humanos, que carimbam sem olhar | Portas por nível de risco; auto-aprovar o de baixo risco com registro |
| Política desatualizada | O pacote de políticas se desalinha da regulação | Versionar e testar a política como código; revisão periódica de conformidade |
| Transformação silenciosa | A redação corrompe uma ação legítima | Registar as transformações; devolver a justificação ao contexto do agente |
| Lacunas de auditoria | As decisões não são persistidas antes de a ação ser executada | Auditoria por escrita antecipada; negar se o destino de auditoria não estiver disponível |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Cobertura de política (classes de ação mapeadas) | 100 % | Por mapear → negar por padrão |
| Taxa de violações de severidade alta | → 0 | Por cada 10.000 ações |
| Precisão da porta de aprovação | Alta | Fração de escalonamentos que se justificavam |
| Latência de decisão (p95) | < 50 ms no determinista | Exclui a espera de aprovação humana |
| Completude de auditoria | 100 % | Toda a ação com efeito tem registro de decisão |
| Tempo médio de atualização de política | Baixo (horas) | CI/CD de política como código |

## Métricas de custo

- **Sobrecusto de governança por ação:** as verificações deterministas acrescentam computação desprezável; os guarda-corpos baseados em modelo acrescentam uma ou mais chamadas de inferência auxiliares, que devem ser orçamentadas dentro do custo por tarefa.
- **Custo de aprovação humana:** o custo variável dominante; minimiza-se com uma classificação de risco precisa para que só escale o que o merece.
- **Custo de engenharia:** redação de políticas e testes de conformidade; amortiza-se reutilizando pacotes de políticas entre agentes.

## Características de escalabilidade

A aplicação determinista escala horizontalmente e sem estado junto do orquestrador. Os guarda-corpos baseados em modelo escalam com a capacidade de inferência e são o gargalo de débito com volumes altos de ações: coloque-os em cache e faça curto-circuito antes com verificações deterministas baratas. As portas de aprovação escalam com capacidade humana, não com computação, portanto o objetivo de desenho é manter a fração escalada pequena e estável à medida que o volume de ações cresce.

## Conteúdo relacionado

- HRN-003 — Taxonomia de camadas do harness e modos de controle.
- GOV-001 — Quadro de governança de IA empresarial (as obrigações que esta camada aplica).
- PAT-001 — Padrão de aprovação humana (o mecanismo da porta de aprovação).

## Referências

- NIST AI Risk Management Framework (AI RMF 1.0).
- ISO/IEC 42001:2023 — sistemas de gestão de IA.
- OASIS XACML e o modelo de autorização PEP/PDP.
- Open Policy Agent (OPA) — motor de política como código.

## Perguntas frequentes

**P: Porque não resolver a governança no prompt?**
R: As instruções do prompt são orientadoras e derrubáveis por injeção; a aplicação ao nível do harness é obrigatória e auditável. A governança tem de ficar fora da superfície persuadível do modelo.

**P: Controlar cada ação não acrescenta demasiada latência?**
R: As verificações deterministas custam entre uns poucos e umas dezenas de milissegundos. Só as ações escaladas incorrem em demora à escala humana, e são deliberadamente raras.

**P: Em que difere isto de GOV-001?**
R: GOV-001 define as obrigações e o quadro; HRN-008 é como essas obrigações são compiladas em controles de execução dentro do harness.
