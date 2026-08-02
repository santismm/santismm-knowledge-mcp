---
title: "Princípios de Engenharia de Harness"
summary: "Os princípios de engenharia que se sustentam em todos os componentes do harness: fronteira de determinismo, autoridade limitada, degradação graciosa e medição antes da otimização."
---

# Princípios de Engenharia de Harness

## Resumo executivo
Os componentes respondem a *o que* um harness contém; os princípios respondem a *como* construir bem cada um. Este capítulo enuncia os princípios de engenharia transversais da Engenharia de Harness: as regras que valem tanto se estiver a desenhar memória, como orquestração, como o contrato de uma ferramenta. São deliberadamente opinativos: um princípio que se dobra a qualquer situação não é um princípio.

## Conceitos-chave
- **Princípio:** uma regra de desenho duradoura que orienta decisões em todos os componentes.
- **Fronteira de determinismo:** a linha explícita entre o que o modelo decide e o que o código decide.
- **Evidência primeiro:** nenhuma afirmação de qualidade sem medição.
- **Defesa em profundidade:** várias camadas independentes para que nenhuma falha isolada seja catastrófica.
- **Autoridade mínima:** cada componente recebe a permissão mínima necessária.
- **Degradação graciosa:** o sistema cai para um modo seguro e reduzido em vez de colapsar.

## Definição
Os **princípios de Engenharia de Harness** são um conjunto de regras de desenho transversais que governam como os componentes de um harness são construídos e compostos para que o sistema agêntico resultante seja fiável, observável, governável e seguro. São o equivalente nesta disciplina aos princípios SOLID ou à aplicação de doze fatores: não um framework, mas uma postura.

## Explicação detalhada

### 1. Fiabilidade acima de capacidade
O harness otimiza o *chão* do comportamento, não o teto. Um sistema brilhante em 95 % do tempo e catastrófico nos restantes 5 % é, numa empresa, um passivo: esses 5 % são o que sai na imprensa e na auditoria. Prefira um âmbito mais estreito executado com fiabilidade a um âmbito amplo executado de forma errática. A capacidade é o contributo do modelo; a fiabilidade é a do harness, e é essa que a empresa está a pagar.

### 2. Fronteiras de determinismo
Decida explicitamente o que o modelo pode decidir. Tudo o que *pode* ser determinístico *deve* sê-lo: validação de esquemas, encaminhamento, verificação de permissões, retentativas e pós-condições pertencem ao código, não a um prompt. O modelo reserva-se para o raciocínio genuinamente aberto que só ele consegue fazer. Traçar esta fronteira com firmeza é a decisão de maior alavancagem no desenho de um harness: encolhe a superfície sobre a qual o não determinismo pode causar dano.

### 3. Observabilidade primeiro
Instrumente antes de otimizar. Não consegue depurar, avaliar nem confiar num sistema não determinístico de vários passos que não consegue ver. Cada chamada ao modelo, cada invocação de ferramenta e cada decisão devem ser um span estruturado, rastreável e reproduzível *antes* de a funcionalidade ser dada por concluída (HRN-006). A observabilidade não é um extra de segunda fase: é precondição de todos os outros princípios, porque todos dependem de medição.

### 4. Evidência primeiro
Nenhuma afirmação de qualidade é lançada sem medição. «Parece melhor» não é uma afirmação de engenharia. As alterações passam por avaliação contra conjuntos dourados e suites de regressão (HRN-007), e toda a afirmação com consequências traz a sua proveniência (o modelo de evidência que esta mesma base de conhecimento usa). A evidência primeiro é o que converte o desenvolvimento de agentes de artesanato em engenharia.

### 5. Defesa em profundidade
Assuma que qualquer camada isolada falhará — o modelo alucinará, uma ferramenta devolverá lixo, um utilizador injetará um prompt malicioso — e garanta que nenhuma falha isolada é catastrófica. Sobreponha controlos independentes: validação de entrada *e* de saída *e* portas de permissão *e* monitorização. O modelo é um componente não confiável: trate a sua saída como trataria uma entrada de utilizador sem validação (HRN-011).

### 6. Autoridade mínima
Cada componente e cada ferramenta recebe a autoridade mínima que o seu trabalho exige, e nem mais. Apenas leitura por omissão; acesso de escrita delimitado e com porta; ações destrutivas atrás de aprovação humana (controlos da classe PAT-001). O raio de dano de um agente comprometido ou confuso está limitado pela autoridade que lhe concedeu: conceda pouca.

### 7. Degradação graciosa
Quando algo falha, falhe *para* um modo seguro e reduzido — escale para um humano, devolva uma resposta conservadora ou recuse — em vez de quebrar ou, pior, tomar com confiança uma ação errada. O harness tem de ter comportamento bem definido para o impasse, o esgotamento de orçamento, a indisponibilidade de uma ferramenta e a baixa confiança. Um sistema que não sabe desistir com segurança não está pronto para produção.

### 8. Atuação idempotente e reversível
Como o ciclo é estocástico e pode repetir, as ações sobre o mundo devem ser idempotentes quando possível e reversíveis quando não. Uma chamada repetida não pode cobrar duas vezes a um cliente; uma escrita deve poder repetir-se sem dano; as ações de alto impacto devem ser preparadas, confirmáveis e reversíveis. Este princípio é o que torna seguras as retentativas, que são imprescindíveis para a fiabilidade.

### Tensões entre princípios
Os princípios nem sempre estão alinhados. A fiabilidade acima de capacidade limita o que o modelo pode tentar; a observabilidade primeiro acrescenta latência e custo; a autoridade mínima trava o desenvolvimento. A boa engenharia de harness é a arte de resolver essas tensões *deliberadamente* e documentar o compromisso, em vez de deixar um princípio vencer em silêncio. O metaprincípio: **torne o compromisso explícito e mensurável.**

| Princípio | Risco que mitiga | Custo que impõe |
|-----------|------------------|-----------------|
| Fiabilidade acima de capacidade | Comportamento catastrófico de cauda | Âmbito reduzido |
| Fronteiras de determinismo | Não determinismo sem limites | Esforço de desenho inicial |
| Observabilidade primeiro | Execuções indepuráveis | Armazenamento, latência |
| Evidência primeiro | Regressões silenciosas | Infraestrutura de avaliação |
| Defesa em profundidade | Catástrofe por ponto único | Controlos redundantes |
| Autoridade mínima | Raio de dano amplo | Iteração mais lenta |
| Degradação graciosa | Ações erradas com confiança | Caminhos de recurso adicionais |
| Atuação idempotente | Retentativas danosas | Complexidade ao desenhar ações |

## Modos de falha observados
- **Teatro de princípios:** citá-los num documento de desenho sem os exigir no código nem no CI.
- **Perseguição de capacidades:** deixar que uma capacidade vistosa do modelo alargue o âmbito para além do que o harness consegue controlar com fiabilidade.
- **Otimizar o invisível:** afinar prompts e cadeias antes de existir observabilidade, de modo que as «melhorias» não estão medidas.
- **Falha de tudo ou nada:** sem modo degradado, a queda de um único componente derruba o sistema inteiro ou produz um erro dito com segurança.

## Métricas de custo
Os princípios trocam custo marginal por pedido (instrumentação, validação, verificações redundantes) por grandes reduções do custo da falha (incidentes, retrabalho, achados de auditoria, dano reputacional). O enquadramento economicamente correto é o *custo esperado incluindo eventos de cauda*, onde os princípios se pagam sistematicamente.

## Características de escalabilidade
Os princípios compõem à escala. As fronteiras de determinismo e a autoridade mínima delimitam a superfície de falha à medida que crescem os passos e a concorrência; observabilidade e evidência primeiro mantêm depurável e protegido de regressões um sistema que cresce. Os sistemas construídos sem os princípios tendem a degradar-se de forma superlinear ao escalar, porque cada nova capacidade acrescenta superfície sem limites, sem medição e com excesso de privilégios.

## Conteúdo relacionado
- HRN-001 — Engenharia de Harness: definição e panorama
- HRN-003 — A taxonomia do harness

## Referências
- Analogia com princípios de software estabelecidos (SOLID, doze fatores, defesa em profundidade) adaptados a sistemas agênticos.
- Observação da indústria sobre práticas de fiabilidade em sistemas agênticos, 2023–2026.
- Santa María, S. — Notas de trabalho sobre princípios de desenho de harness.

## Perguntas frequentes
**P:** Que princípio importa mais?
**R:** A observabilidade primeiro é a porta de entrada prática, porque todos os outros dependem da medição. As fronteiras de determinismo são a decisão de desenho com mais alavancagem. Reforçam-se mutuamente.

**P:** Não são simplesmente princípios gerais de engenharia de software?
**R:** Vários são adaptados da engenharia clássica, e isso é intencional: os sistemas agênticos continuam a ser software. Mas a fronteira de determinismo, medir com evidência um sistema estocástico e tratar o modelo como entrada não confiável são específicos do harness.

**P:** Como se exigem os princípios, em vez de apenas os enunciar?
**R:** Codifique-os no CI e em tempo de execução: validação de esquemas como código, portas de avaliação na fusão, verificação de permissões na fronteira da ferramenta e rastreio obrigatório. Um princípio que não é exigido é um desejo.
