---
title: "Memória em sistemas agênticos"
summary: "O que o modelo vê e o que não vê: recuperação, compressão de contexto, memória de trabalho e de longo prazo, e as decisões de esquecimento que determinam custo e qualidade."
---

# Memória em sistemas agênticos

## Resumo executivo
A memória é o componente do harness que decide o que o modelo vê em cada chamada e o que persiste entre chamadas. Como o modelo não tem estado e sua janela de contexto é um orçamento rígido e caro, a memória não é uma funcionalidade de base de dados acrescentada no fim: é um sistema de curadoria ativo e com critério. Este capítulo cobre a hierarquia de memória (de trabalho, de curto prazo, de longo prazo), a janela de contexto como restrição determinante e as três operações que tornam a memória tratável à escala: recuperação, compressão e esquecimento.

## Conceitos-chave
- **Memória de trabalho:** o contexto imediato sobre o qual o modelo está raciocinando neste momento, ou seja, o prompt montado do passo atual.
- **Memória de curto prazo:** o estado acumulado da tarefa ou sessão em andamento (conversa, resultados intermédios, bloco de rascunho).
- **Memória de longo prazo:** conhecimento persistente entre sessões: preferências do usuário, resultados anteriores, fatos da organização.
- **Janela de contexto:** o orçamento fixo de tokens de uma única chamada ao modelo; o recurso mais escasso do ciclo.
- **Recuperação:** selecionar os elementos relevantes de um armazém maior para os colocar no contexto.
- **Compressão:** reduzir a pegada em tokens de uma informação preservando seu conteúdo útil (resumo, destilação).
- **Esquecimento:** descartar ou reduzir deliberadamente o peso de informação para controlar custo, relevância e desatualização.

## Definição
A **memória num sistema agêntico** é o subsistema do harness que gerencia o ciclo de vida da informação que o modelo utiliza — sua aquisição, armazenamento, seleção para o contexto, compressão e remoção — ao longo dos horizontes temporais de um passo, de uma tarefa e da vida inteira do sistema. Sua função é colocar a informação *certa* no contexto limitado do modelo no momento *certo*, e mais nada.

## Explicação detalhada

### A janela de contexto é um orçamento, não um contêiner
O fato mais importante sobre a memória é que a janela de contexto é *finita e cara*, e que a qualidade se degrada à medida que se enche. Mesmo com janelas grandes, meter lá tudo eleva custo e latência e dilui a atenção do modelo sobre o que importa (o efeito “perdido no meio”). A engenharia de memória é, por isso, um problema de *orçamentação*: cada token gasto em histórico ou contexto recuperado é um token que não é gasto raciocinando. O harness tem de decidir continuamente o que merece seu lugar na janela.

### A hierarquia de memória
- A **memória de trabalho** é o que está na janela de contexto para a chamada atual. É montada de novo em cada passo a partir dos restantes níveis.
- A **memória de curto prazo** guarda o estado em evolução da tarefa em andamento: a conversa até ao momento, os resultados de ferramentas e um bloco de raciocínio intermédio. Cresce de forma monótona se não for gerida, e por isso é o alvo principal da compressão e do esquecimento.
- A **memória de longo prazo** persiste entre tarefas e sessões: armazéns semânticos (frequentemente indexados vetorialmente para recuperação por similaridade), perfis e fatos estruturados (chave-valor ou relacionais), e registros episódicos de resultados de tarefas passadas com que o agente pode aprender. A memória de longo prazo é o que permite a um agente ser *consistente* entre sessões e *melhorar* ao longo do tempo.

### Recuperação: escolher o que trazer à superfície
A recuperação seleciona elementos relevantes da memória de longo prazo (e por vezes da de curto prazo) para os injetar na memória de trabalho. A abordagem dominante é a similaridade semântica sobre embeddings, muitas vezes complementada com pesquisa lexical por palavras-chave (recuperação híbrida) e reordenação. A qualidade da recuperação domina a qualidade da resposta: um contexto irrelevante ou ausente não se corrige com um prompt melhor. Entre os refinamentos habituais estão a reescrita de consultas, a filtragem por metadados e a ponderação por recência ou autoridade. Padrões como PAT-006 (recuperação de conhecimento) formalizam estas decisões.

### Compressão: caber mais dentro do orçamento
Quando a memória de curto prazo transborda o orçamento, o harness comprime-a. As técnicas vão do truncamento simples (descartar os turnos mais antigos) ao resumo incremental (substituir os turnos velhos por um resumo acumulado) e à compressão hierárquica ou semântica (resumir a várias granularidades e guardar apontadores para o detalhe). A compressão é, por definição, com perda, portanto a pergunta de engenharia é *o que se pode perder sem risco*, e isso depende da tarefa. Um agente de programação tem de preservar os identificadores exatos; um agente de suporte ao cliente pode resumir a conversa de circunstância com agressividade.

### Esquecimento: deliberado, não acidental
O esquecimento é um controle ativo, não uma falha. O harness tem de descartar informação desatualizada (um dado que mudou), irrelevante (contexto fora de tema) ou fora de orçamento (despejo sob pressão). Sem esquecimento explícito, a memória de longo prazo acumula contradições e ruído, e a de curto prazo transborda. As boas políticas de esquecimento reduzem peso por recência e relevância, fazem expirar os fatos de volatilidade conhecida e resolvem conflitos (ganha o valor autorizado mais recente). O esquecimento é ainda uma superfície de *governança*: os requisitos de retenção de dados e de direito ao esquecimento vivem aqui.

### Escrita e consolidação de memória
Para fechar o ciclo, o harness decide o que *escrever de volta* na memória depois de um passo ou de uma tarefa: extrair fatos duradouros, resumir o episódio, atualizar o perfil do usuário. Esse passo de consolidação — análogo a passar a memória de trabalho para armazenamento de longo prazo — é o que converte um modelo sem estado num sistema que acumula conhecimento. Feito sem cuidado, é também a forma como um agente envenena seu próprio contexto futuro com um “fato” alucinado, e por isso as escritas devem ser validadas como qualquer outra atuação.

### A memória como superfície de ataque
Tudo o que é escrito em memória e depois lido para o contexto é um vetor de injeção de prompts. Os documentos recuperados e os “fatos” armazenados podem transportar instruções adversárias. A memória interseta, portanto, diretamente com a segurança (HRN-011): trate o conteúdo recuperado e recordado como entrada não confiável, não como prompt de sistema de confiança.

## Evidência de produção
> **Nível de evidência:** teórico · **Confiança:** média · **Fonte:** observação de indústria
>
> _Cenário ilustrativo e representativo, não uma implantação verificada concreta._

- **Contexto:** agentes assistentes empresariais de longa duração (suporte ao cliente, investigação, programação) a operar em sessões de muitos turnos.
- **Cenário:** a acumulação ingênua do histórico completo da conversa na janela de contexto dispara custo e latência e afunda a qualidade da resposta à medida que a sessão se prolonga; introduzir resumo incremental mais recuperação híbrida restaura a qualidade a uma fração do custo em tokens.
- **Tecnologia:** LLM de fronteira, armazém vetorial, recuperador híbrido com reordenação, modelo de resumo para a compressão.
- **Carga:** sessões que vão de uns poucos turnos a centenas, com armazéns de longo prazo de milhares a milhões de elementos.
- **Resultados:** a experiência representativa é uma redução substancial de tokens por turno e uma maior consistência da tarefa assim que a memória é gerida ativamente em vez de acumulada de forma passiva.

## Modos de falha observados
- **Transbordo de contexto:** uma memória de curto prazo não gerida excede a janela e trunca precisamente a informação que importava.
- **Perdido no meio:** um contexto sobrecarregado degrada a atenção ao conteúdo central do prompt; mais contexto produz piores respostas.
- **Falha de recuperação:** o documento relevante nunca vem à superfície e o modelo responde com segurança a partir de uma lacuna.
- **Memória desatualizada ou contraditória:** o armazém de longo prazo guarda fatos vencidos ou em conflito e o agente age sobre o errado.
- **Envenenamento de memória:** um “fato” alucinado ou adversário é escrito de volta e contamina o raciocínio futuro.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Precisão / abrangência de recuperação | Dependente do domínio, medida | Qualidade dos elementos trazidos para o contexto |
| Utilização do contexto | Abaixo da janela, com folga | Tokens usados diante do orçamento por chamada |
| Tokens por turno | Minimizados a qualidade constante | Motor direto de custo |
| Ancoragem da resposta | Alta | Proporção de afirmações sustentadas pelo contexto recuperado |

## Métricas de custo
A memória é uma alavanca de custo de primeira ordem. Os tokens colocados em contexto são pagos em cada chamada, portanto a compressão e uma recuperação precisa reduzem diretamente a despesa de inferência. A memória de longo prazo acrescenta custo de armazenamento e de indexação por embeddings, e a compressão acrescenta chamadas a um modelo de resumo. O saldo é quase sempre favorável: a gestão ativa de memória troca resumo e indexação baratos em lote por tokens de contexto caros por chamada.

## Características de escalabilidade
A memória escala em dois eixos: duração da sessão (que governa a memória de curto prazo e a frequência de compressão) e dimensão do corpus (que governa o armazém de longo prazo e a latência de recuperação). A latência e a qualidade da recuperação são os gargalos habituais à medida que o armazém de longo prazo cresce; o particionamento, a filtragem e a reordenação se tornam necessários. E o essencial: uma memória bem gerida mantém *plano* o custo por chamada mesmo com sessões longas, enquanto a acumulação ingênua o faz crescer sem limite.

## Conteúdo relacionado
- HRN-003 — A taxonomia do harness
- PAT-004 — (padrão de memória / contexto)
- PAT-006 — (padrão de recuperação de conhecimento)

## Referências
- Investigação sobre os efeitos da dimensão do contexto nos LLM (“perdido no meio”).
- Literatura de prática sobre RAG, recuperação híbrida e reordenação.
- Santa María, S. — Notas de trabalho sobre arquitetura de memória de agentes.

## Perguntas frequentes
**P:** Com janelas de contexto de um milhão de tokens, a engenharia de memória não fica obsoleta?
**R:** Não. As janelas maiores elevam o orçamento, mas não o eliminam: o custo, a latência e a diluição de atenção continuam a escalar com aquilo que se lá mete. As janelas grandes tornam a engenharia de memória *mais* valiosa, não menos, porque a tentação de sobrecarregar é maior.

**P:** A memória não é simplesmente RAG?
**R:** A recuperação (RAG) é uma operação dentro da memória. A memória cobre ainda o estado de trabalho e de curto prazo, a compressão, o esquecimento e a consolidação por escrita. RAG sem isso tudo está incompleto.

**P:** Deve o modelo decidir o que recordar?
**R:** Em parte. O modelo pode propor o que consolidar, mas o harness deve validar e governar as escritas: as autoescritas sem validação são a forma como os agentes envenenam sua própria memória.
