---
title: "Breve história da Engenharia de Harness"
summary: "Como a indústria passou da engenharia de prompts para os sistemas agênticos, e porque o andaime em torno do modelo acabou por ser a disciplina que decide a fiabilidade."
---

# Breve história da Engenharia de Harness

## Resumo executivo
A Engenharia de Harness não apareceu já formada. Emergiu ao longo de quatro eras que se sobrepõem: engenharia de prompts, uso de ferramentas, agentes e, por fim, harnesses. Cada era resolveu um problema e deixou a descoberto o seguinte. Este capítulo percorre esse arco, nomeia os pontos de inflexão e explica porque a acumulação dessas lições cristalizou numa disciplina cuja unidade de trabalho é o sistema inteiro, não o prompt.

## Conceitos-chave
- **Engenharia de prompts:** dar forma a uma única interação com o modelo através de instruções, exemplos e formatação.
- **Uso de ferramentas (function calling):** dotar o modelo da capacidade de emitir chamadas estruturadas a funções externas.
- **Agente:** um modelo que executa um ciclo de percecionar, raciocinar e agir rumo a um objetivo, com memória e ferramentas.
- **Harness:** o andaime de engenharia completo em torno do modelo que torna fiável o sistema agêntico.
- **Ponto de inflexão:** o momento em que uma abstração anterior deixa de escalar e obriga a acrescentar uma camada nova.

## Definição
A **história da Engenharia de Harness** é a progressão pela qual o foco do esforço de engenharia se deslocou para fora: do prompt para a interação com o modelo, depois para o ciclo e finalmente para o sistema inteiro que rodeia o modelo, até se reconhecer que construir esse sistema é uma disciplina por direito próprio.

## Explicação detalhada

### Era 1 — Engenharia de prompts (a interação única)
A primeira vaga tratou o modelo como um oráculo: redija o prompt certo e leia a resposta. As técnicas acumularam-se depressa: instruções, exemplos few-shot, enquadramento de papel, cadeia de pensamento e formatos de saída rígidos. A engenharia de prompts era real e útil, mas otimizava *uma só* chamada ao modelo. O seu teto chegava no momento em que uma tarefa exigia que o modelo *fizesse* algo no mundo, ou que recordasse seja o que for para além da janela de contexto. A lição: um prompt melhor não converte um oráculo sem estado num sistema.

### Era 2 — Uso de ferramentas (o modelo age e recupera)
A segunda vaga deu mãos ao modelo. O function calling permitiu ao modelo emitir pedidos estruturados que o código circundante executava: pesquisa, calculadoras, consultas a bases de dados, chamadas a API. A geração aumentada por recuperação (RAG) atacou o problema do conhecimento trazendo o contexto relevante em tempo de consulta em vez de confiar em que estivesse memorizado. Foi uma mudança arquitetónica genuína: passou a haver *código em torno do modelo* que importava. Mas continuava a ser em larga medida um único salto: chamar o modelo, executar uma ferramenta, devolver o resultado. Os problemas de fiabilidade surgiram de imediato: as ferramentas falham, devolvem dados malformados, expiram ou são invocadas com argumentos alucinados. A lição: assim que o modelo toca em sistemas reais são precisos contratos, validação e tratamento de falhas — engenharia, não prompting.

### Era 3 — Agentes (o ciclo)
A terceira vaga fechou o ciclo. Em vez de um salto, o modelo iterava: observar resultados, raciocinar, voltar a agir, até cumprir o objetivo. Apareceram padrões como os ciclos de raciocinar-e-agir, os planeadores com ferramentas e as decomposições multiagente, empacotados em frameworks populares. Os agentes já conseguiam reservar uma viagem, refatorizar código ou triar um ticket ao longo de muitos passos. E foi aqui que os modos de falha *a sério* afloraram à escala: ciclos que não terminam, erros que se compõem quando um passo mau envenena o resto, custo descontrolado, janelas de contexto transbordadas de histórico acumulado, e a impossibilidade de depurar a posteriori uma execução não determinista de vários passos. As frameworks de agentes tornaram o ciclo fácil de *escrever* e quase impossível de *operar com fiabilidade*. A lição: um ciclo sem disciplina de memória, observabilidade, avaliação e autoridade limitada é um passivo, não um produto.

### Era 4 — Harnesses (o sistema)
A quarta vaga — onde vive hoje a disciplina — é o reconhecimento de que tudo o que rodeia o modelo *é o problema de engenharia*. As equipas que levavam agentes para produção empresarial descobriram que dedicavam quase todo o seu esforço não ao modelo, nem sequer ao ciclo do agente, mas a:

- A **memória** que decide o que o modelo vê e o que esquece (HRN-005);
- A **observabilidade** que converte uma execução opaca em traços reproduzíveis (HRN-006);
- A **avaliação** que transforma «parece que está bem» em qualidade medida e protegida contra regressões (HRN-007);
- A **governação** que aplica política e aprovação humana como código;
- A **segurança** que trata o modelo como um componente não confiável e injetável por prompt;
- A **orquestração** que limita o ciclo, encaminha o trabalho e degrada com elegância.

Esse conjunto é o harness. Dar-lhe nome importou: reenquadrou «construí um agente» (uma demonstração) como «construí um harness» (um sistema que se pode pôr à frente de clientes e auditores). HRN-003 formaliza os componentes como taxonomia.

### Porque mudaram os nomes
Cada mudança de nome refletiu um alargamento da unidade de responsabilidade. Prompt → a chamada. Uso de ferramentas → a chamada mais as suas ações. Agente → o ciclo. Harness → o sistema, incluindo as partes que nenhuma demonstração mostra: o que acontece às três da manhã sob carga, sob ataque, sob auditoria. A história é, no essencial, a constatação progressiva de que a parte difícil nunca foi o modelo.

## Evidência de produção
> **Nível de evidência:** teórico · **Confiança:** média · **Fonte:** observação de indústria
>
> _Relato ilustrativo e representativo, não uma implantação verificada concreta._

- **Contexto:** equipas empresariais que adotam agentes LLM entre 2023 e 2026.
- **Cenário:** uma equipa entrega uma demonstração de agente impressionante e depois dedica os dois trimestres seguintes não a melhorar o modelo, mas a construir gestão de memória, tracing, harnesses de avaliação, portas de aprovação e defesas contra injeção de prompts para que seja seguro em produção.
- **Tecnologia:** LLM de fronteira, API de function calling, armazéns vetoriais, frameworks de agentes, backends de tracing.
- **Carga:** de um punhado de execuções de demonstração a tráfego sustentado de produção com utilizadores adversários.
- **Resultados:** a experiência representativa é que o harness, e não o modelo, consome a maior parte do esforço de engenharia e é o que em última instância condiciona o lançamento em produção.

## Modos de falha observados
- **Enganar-se na era:** tratar um problema de uso de ferramentas como um problema de prompt, ou um problema de agente como um de ferramentas: aplicar a abstração de ontem à falha de hoje.
- **A framework como estratégia:** assumir que uma framework de agentes *é* o harness; as frameworks fornecem o ciclo, não a observabilidade, a avaliação, a governação nem a segurança.
- **Saltar diretamente para multiagente:** recorrer a enxames de agentes elaborados antes de o harness de um só agente ser fiável, multiplicando a superfície de falha.

## Características de escalabilidade
Cada era empurrou o estrangulamento de fiabilidade mais para fora. À medida que os sistemas escalaram em passos e ferramentas, a restrição determinante passou de «o prompt é bom?» para «o ciclo termina, mantém-se dentro do orçamento e continua auditável?», que é precisamente o domínio do harness.

## Conteúdo relacionado
- HRN-001 — Engenharia de Harness: definição e panorama
- HRN-003 — A taxonomia do harness

## Referências
- Observação de indústria sobre a evolução dos padrões de aplicação de LLM, 2020–2026.
- Literatura de prática sobre RAG, function calling e ciclos de agentes.
- Santa María, S. — Notas de trabalho sobre o aparecimento da Engenharia de Harness.

## Perguntas frequentes
**P:** Algum produto ou artigo inventou a Engenharia de Harness?
**R:** Não. Surgiu da experiência convergente de muitas equipas que embateram no mesmo muro: os agentes são fáceis de demonstrar e difíceis de operar. A disciplina é um nome para as lições, não um artefacto concreto.

**P:** As eras anteriores estão obsoletas?
**R:** Não: ficam subsumidas. O prompting, o uso de ferramentas e os ciclos de agentes são todos componentes dentro de um harness moderno. O harness acrescenta as camadas que os tornam de confiança.

**P:** O que vem depois dos harnesses?
**R:** Provavelmente padronização e maturidade de ferramentaria — plataformas de harness partilhadas, normas interoperáveis de observabilidade e avaliação, e governação integrada nos runtimes — mais do que um paradigma inteiramente novo. A unidade de responsabilidade (o sistema) já é estável.
