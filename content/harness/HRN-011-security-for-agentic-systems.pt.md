---
title: "Segurança para sistemas agênticos"
summary: "Tratar o modelo como componente não confiável e manipulável: injeção de prompts, exfiltração por ferramentas, limites de autoridade e defesa em profundidade do harness."
---

# Segurança para sistemas agênticos

## Resumo executivo

Os sistemas agênticos alargam a superfície de ataque de uma forma que as aplicações tradicionais não conhecem: o agente lê dados não confiáveis, toma decisões com consequências e possui privilégios para agir, portanto uma única entrada comprometida pode se tornar uma ação comprometida. A segurança para sistemas agênticos é a camada do harness que assume que o modelo pode ser manipulado — e será — e constrói o andaime circundante para que essa manipulação não possa causar dano. O princípio orientador é **privilégio mínimo com raio de impacto limitado**: tratar o modelo como componente não confiável, colocar os controles de segurança *fora* da sua superfície persuadível e garantir que mesmo um agente completamente sequestrado só possa causar um dano limitado e auditável.

## Conceitos-chave

- **Injeção de prompt:** conteúdo não confiável que sequestra as instruções ou objetivos do agente.
- **Injeção indireta de prompt:** injeção entregue através de dados que o agente recupera (documentos, páginas web, saídas de ferramentas).
- **Isolamento de ferramentas (sandboxing):** isolar a execução de uma ferramenta para que não possa exceder sua autoridade prevista.
- **Privilégio mínimo:** conceder a cada agente as permissões mínimas de que sua tarefa precisa.
- **Identidade do agente:** um principal distinto e atribuível para cada agente, com âmbito limitado e revogável.
- **Exfiltração de dados:** saída não autorizada de dados sensíveis através de saídas de ferramentas ou conteúdo renderizado.
- **Trifeta letal:** a combinação perigosa de acesso a dados privados, exposição a conteúdo não confiável e capacidade de comunicar para o exterior.

## Definição

> A **segurança para sistemas agênticos** é a disciplina do harness que trata o modelo como um componente não confiável e manipulável, e constrói controles de identidade, permissões, isolamento e saída de dados para que o dano máximo que qualquer agente comprometido possa causar seja limitado, atribuível e auditado.

## Explicação detalhada

A ameaça fundacional é a **injeção de prompt**, e o erro fundacional é tentar resolvê-la dentro do modelo. Nenhum grau de endurecimento do prompt de sistema trava de forma confiável uma instrução suficientemente astuta embebida em conteúdo recuperado, porque o modelo não tem uma fronteira robusta e de princípio entre “dados” e “instrução”. A injeção indireta é a variante perigosa: um agente que resume uma página web ou lê um ticket pode ser tomado pelo texto que o atacante ali plantou. A resposta do harness é **arquitetônica, não de prompting**: assumir que a injeção terá sucesso por vezes e garantir que um agente sequestrado continua sem poder fazer nada que suas *permissões* proíbam. Os guarda-corpos de entrada (detecção de injeção e jailbreak) reduzem a *frequência* das injeções bem-sucedidas; os controles de permissões e de saída limitam a *consequência*. São precisos os dois; nenhum basta por si só.

O **privilégio mínimo e a identidade do agente** são a espinha dorsal da segurança agêntica. Cada agente deveria rodar como um principal distinto e atribuível, com credenciais limitadas exatamente aos recursos de que sua tarefa precisa: tokens de vida curta, âmbitos OAuth estreitos, apenas leitura onde não for preciso escrever e isolamento de dados por inquilino aplicado *abaixo* do agente (na camada de dados), nunca pedindo educadamente ao modelo que não saia da sua faixa. Quando um agente age em nome de um usuário, deve levar a autorização desse usuário e não uma conta de serviço com poderes absolutos, para que o agente nunca possa exceder o que o usuário poderia fazer diretamente. As credenciais devem ser injetadas pelo harness no momento da chamada, jamais colocadas na janela de contexto, onde uma injeção as poderia ler e exfiltrar.

O **isolamento de ferramentas** confina a execução. As ferramentas que executam código fazem-no em caixas de areia efêmeras, com rede restringida e recursos limitados. Os catálogos de ferramentas estão em **lista de permitidos** por agente, de modo que um agente sequestrado não pode alcançar uma ferramenta que nunca lhe foi concedida. As ferramentas de alta consequência ficam por trás de uma aprovação humana (PAT-007 / PAT-001), para que mesmo uma chamada autorizada mas manipulada exija que uma pessoa a confirme. O princípio é a *defesa em profundidade*: a autorização decide *se* a chamada é permitida, a caixa de areia limita *o que pode tocar* e a porta de aprovação acrescenta um ponto de controle humano para as ações irreversíveis.

A **exfiltração de dados** é o risco agêntico mais subestimado. A “trifeta letal” — um agente com (1) acesso a dados privados, (2) exposição a conteúdo não confiável e (3) capacidade de comunicar para o exterior — é explorável: instruções injetadas dizem ao agente que embuta segredos num pedido de saída, no URL de uma imagem renderizada ou no argumento de uma ferramenta. O harness quebra a trifeta eliminando pelo menos uma das suas pernas nos contextos sensíveis: restringir os destinos de saída a uma lista de permitidos, executar verificações de prevenção de fuga de dados sobre cada carga de saída, remover ou fixar a renderização de conteúdo externo e proibir que o agente construa URL de saída arbitrários. Se um agente tiver de tocar dados privados, sua capacidade de comunicar para o exterior tem de estar fortemente restringida, e vice-versa.

Tudo isto assenta na **observabilidade e na auditabilidade** (HRN-006): cada ação, a identidade que a realizou, a decisão de permissão e a verificação de saída têm de ficar registadas de forma imutável. Uma segurança que não se consegue demonstrar é uma segurança que não se tem. Estes controles implementam as obrigações definidas no quadro de governança (GOV-001) e encaixam na taxonomia geral do harness (HRN-003).

## Evidência de produção

> **Cenário ilustrativo e representativo.** Nível de evidência: teórico · Confiança: média · Fonte: observação de indústria, experiência pessoal. As descrições seguintes são padrões representativos de ataque e mitigação, não medições de uma implantação verificada concreta.

- **Contexto:** um agente de suporte ao cliente com acesso a uma base de conhecimento e capacidade de enviar emails a clientes.
- **Cenário:** um atacante planta texto de injeção num ticket de suporte tentando fazer com que o agente envie por email os dados da conta de outro cliente para um endereço externo.
- **Tecnologia:** credenciais com âmbito por agente, lista de permitidos de saída, prevenção de fuga de dados sobre o email de saída, detecção de injeção no conteúdo recuperado, registro de auditoria.
- **Carga:** alto volume de tickets, com uma fração pequena mas não nula carregando tentativas de injeção.
- **Resultados (representativos):** em implantações desta forma, os controles arquitetônicos (lista de permitidos de saída + prevenção de fuga + privilégio mínimo) bloqueiam a *consequência* da injeção mesmo quando a detecção falha a *tentativa*, levando a exfiltração bem-sucedida para perto de zero, enquanto a detecção de injeção por si só deixa risco residual.

### Lições aprendidas

As estratégias baseadas apenas em detecção acabam por falhar; as defesas confiáveis são as arquitetônicas, as que limitam a consequência. Quebrar a trifeta letal — sobretudo restringindo a saída — faz mais pela segurança do que qualquer classificador isolado.

## Modos de falha observados

| Modo de falha | Gatilho | Mitigação |
|---|---|---|
| Injeção direta de prompt | Instrução maliciosa do usuário | Guarda-corpos de entrada + limitação de permissões |
| Injeção indireta | Texto malicioso nos dados recuperados | Tratar todo o conteúdo recuperado como não confiável; controles de saída |
| Exfiltração de dados | Trifeta letal explorada | Quebrar a trifeta: lista de permitidos de saída + prevenção de fuga |
| Escalada de privilégios | Credenciais de serviço demasiado amplas | Credenciais com âmbito por agente e vida curta; autorização delegada pelo usuário |
| Fuga de credenciais | Segredos na janela de contexto | Injetar as credenciais no momento da chamada, nunca no contexto |
| Fuga da caixa de areia | Código ou rede sem restrições nas ferramentas | Caixas de areia efêmeras, isoladas da rede e com recursos limitados |
| Delegado confuso | O agente é usado como proxy para ações proibidas | Transportar a identidade de quem chama; autorizar no efetor |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Taxa de exfiltração bem-sucedida | → 0 | A métrica que mais importa |
| Abrangência da detecção de injeção | Alta | Reduz a frequência de tentativas, não é a única defesa |
| Estreiteza do âmbito de permissões | Concessões mínimas | Auditar permissões não usadas ou demasiado amplas |
| Cobertura da lista de permitidos de saída | 100 % | Sem destinos de saída arbitrários |
| Tempo médio até à revogação | Baixo | Revogação da identidade de um agente comprometido |
| Completude de auditoria | 100 % | Toda a ação atribuível |

## Métricas de custo

- **Custo de inferência dos guarda-corpos:** os classificadores de injeção e de fuga de dados acrescentam inferência auxiliar por pedido; tem de ser orçamentada dentro do custo por tarefa.
- **Sobrecusto das caixas de areia:** o arranque de uma caixa efêmera acrescenta latência às ferramentas de código; amortiza-se com pools quentes.
- **Custo de engenharia:** a identidade com âmbito e a lista de permitidos de saída são trabalho de IAM feito à partida que se rentabiliza em todos os agentes.

## Características de escalabilidade

Os controles de permissões e identidade escalam com a infraestrutura de IAM e de segredos, sem estado por chamada. Os classificadores de guarda-corpo escalam com a capacidade de inferência e são o custo de débito; faça curto-circuito antes com verificações deterministas baratas (listas de permitidos, expressões regulares, esquema). As caixas de areia escalam com um pool gerido; os pools quentes trocam custo ocioso por latência. Os controles de saída escalam trivialmente e nunca deveriam ser o gargalo: são o controle com maior valor por custo de toda a pilha.

## Conteúdo relacionado

- HRN-003 — O lugar da segurança na taxonomia do harness.
- GOV-001 — Obrigações de governança que estes controles de segurança implementam.
- PAT-007 — Padrão de controle de ferramentas e permissões (isolamento e uso de ferramentas com porta).

## Referências

- OWASP Top 10 para aplicações LLM (LLM01 injeção de prompt, LLM06 divulgação de informação sensível).
- Simon Willison, “The lethal trifecta for AI agents”.
- NIST AI RMF e NIST SP 800-53 (privilégio mínimo, identidade).
- MITRE ATLAS — panorama de ameaças adversárias para sistemas de IA.

## Perguntas frequentes

**P: A injeção de prompt pode ser totalmente prevenida?**
R: Não. Desenhe contando com ela: assuma que por vezes terá sucesso e limite a consequência com privilégio mínimo, controle de saída e isolamento.

**P: Qual é o controle de maior valor?**
R: Quebrar a trifeta letal; da forma mais barata, restringindo a saída a uma lista de permitidos com prevenção de fuga de dados, para que um agente sequestrado não possa exfiltrar nada.

**P: Os agentes devem compartilhar uma conta de serviço?**
R: Não. Dê a cada agente uma identidade distinta, com âmbito limitado e vida curta, e faça-a transportar a autorização do usuário que chama para que nunca possa exceder os direitos desse usuário.
