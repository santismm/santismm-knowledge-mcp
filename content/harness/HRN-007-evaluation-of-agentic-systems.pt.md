---
title: "Avaliação de sistemas agênticos"
summary: "Como passar de “parece que funciona” para qualidade medida e protegida contra regressões: conjuntos de avaliação, juízes, métricas de tarefa e avaliação contínua em produção."
---

# Avaliação de sistemas agênticos

## Resumo executivo
A avaliação é o componente do harness que converte “parece que funciona” numa afirmação medida e defensável. Como os agentes não são deterministas e operam sobre tarefas abertas, não se chega à confiança à custa de asserções: é preciso medir distribuições de comportamento contra referências conhecidas e proteger-se contra regressões. Este capítulo cobre a avaliação fora de linha e em linha, os conjuntos de referência, o LLM como juiz, as suites de regressão e as métricas de conclusão de tarefa, e sustenta que a avaliação é a linha que separa o *ofício* de agentes da *engenharia* de agentes.

## Conceitos-chave
- **Avaliação fora de linha:** pontuar o agente contra um conjunto de dados fixo antes de implantar.
- **Avaliação em linha:** pontuar tráfego de produção real (com sinais de usuário ou juízes em sombra).
- **Conjunto de referência (golden set):** um conjunto curado de entradas com saídas esperadas conhecidas ou critérios de aceitação.
- **LLM como juiz:** usar um modelo para pontuar saídas contra uma rubrica quando a correspondência exata é impossível.
- **Suite de regressão:** um conjunto de casos executado em cada alteração para caçar quedas de qualidade.
- **Taxa de conclusão de tarefa:** a proporção de tentativas que alcançam o objetivo de ponta a ponta.
- **Avaliação de trajetória:** pontuar o *caminho* que o agente seguiu, não apenas sua resposta final.

## Definição
A **avaliação de um sistema agêntico** é o subsistema do harness que mede a qualidade, a segurança e a confiabilidade do comportamento do agente contra critérios definidos — sobre conjuntos curados (fora de linha) e sobre tráfego real (em linha) — e condiciona as alterações ao resultado. Responde a duas perguntas: “é suficientemente bom para sair?” e “esta alteração melhorou-o ou piorou-o?”.

## Explicação detalhada

### Por que avaliar agentes é difícil
Três propriedades tornam isto mais duro do que testar software tradicional. Primeira, o **não determinismo**: a mesma entrada pode dar saídas diferentes e até *caminhos* diferentes, portanto uma única asserção de passa/falha não significa nada; medem-se taxas sobre execuções. Segunda, a **abertura**: existem muitas respostas corretas, portanto a pontuação por correspondência exata falha e é preciso juízo por rubrica ou semântico. Terceira, as **trajetórias de vários passos**: um agente pode chegar à resposta certa por um caminho errado (inseguro, caro), portanto avaliar apenas a saída final é insuficiente. O desenho de avaliação é a arte de converter essas propriedades em sinais mensuráveis.

### Avaliação fora de linha e conjuntos de referência
A avaliação fora de linha executa o agente sobre um **conjunto de referência** — entradas curadas emparelhadas com saídas esperadas ou critérios de aceitação — antes de seja o que for entrar em produção. O conjunto de referência é o ativo mais valioso que a avaliação produz: codifica o que significa “bom” no seu domínio e acumula-se ao longo do tempo. Construa-o a partir de casos reais (anonimizados) de produção, casos de falha conhecidos e casos-limite, e *faça-o crescer com cada incidente*: quando o agente falha em produção, a correção não é apenas uma alteração de código mas um novo caso de referência, para que essa falha não possa voltar em silêncio. É essa a disciplina de regressão (conhecimento do tipo PAT-015, validação de conhecimento) que torna o sistema melhorável.

### Tipos de avaliador: cada método à sua tarefa
- **Avaliadores exatos ou por regras** para tarefas com saída verificável (um resultado SQL correto, um esquema JSON válido, um teste unitário que passa). Baratos, deterministas, de confiança: use-os sempre que puder.
- **LLM como juiz** para saídas abertas onde a correspondência exata falha (resumos, explicações, planos). Um modelo pontua contra uma rubrica. Poderoso mas falível: os juízes têm enviesamentos (posição, verbosidade, preferência por si próprios), portanto deve calibrá-los contra etiquetas humanas, usar rubricas claras e preferir a comparação aos pares à pontuação absoluta sempre que possível. Trate o juiz como *um instrumento que por sua vez precisa de avaliação*.
- **Revisão humana** para os casos de maior risco ou mais ambíguos, e para calibrar os avaliadores automáticos. É cara, por isso reserve-a para os casos que dela precisam e para manter honestos os avaliadores baratos.

### Métricas de conclusão e de trajetória
A métrica de cabeçalho de um agente costuma ser a **taxa de conclusão de tarefa**: de ponta a ponta, alcançou o objetivo? Por baixo vivem métricas de passo e de trajetória: escolheu ferramentas adequadas, evitou passos desnecessários, manteve-se dentro do orçamento e evitou ações inseguras pelo caminho? A avaliação de trajetória caça os agentes que acertam “pelas razões erradas”, que é precisamente o tipo de fragilidade que se quebra perante uma mudança de distribuição. Emparelhe a taxa de conclusão com o custo por tarefa e a taxa de violações de segurança para não otimizar uma à custa das outras.

### Avaliação em linha
A avaliação fora de linha lhe fala do seu conjunto de dados; só a **avaliação em linha** lhe fala da realidade. A avaliação em linha pontua tráfego vivo usando sinais implícitos do usuário (aceitação, edições, escalonamentos, repetições), juízes LLM em sombra rodando sobre traços de produção (HRN-006) e auditorias humanas periódicas de execuções amostradas. A avaliação em linha é ainda a forma de descobrir novos casos de referência: a produção é a fonte mais rica dos casos-limite que faltam ao seu conjunto fora de linha. O ciclo é: observar (HRN-006) → julgar em linha → colher as falhas para o conjunto de referência → proteger com regressão fora de linha.

### Portas de regressão: a avaliação como porta de CI
A disciplina se torna engenharia quando a avaliação *condiciona as alterações*. Cada edição de prompt, troca de modelo ou alteração de ferramenta é executada contra a suite de regressão, e uma queda de qualidade bloqueia o merge, exatamente como um teste unitário em falha bloqueia o código. É a forma operacional do princípio de evidência primeiro (HRN-004): nada entra em produção por intuição. Como a avaliação de agentes se baseia em taxas e é em parte julgada por um LLM, as portas usam limiares e comparação estatística em vez de um único booleano, mas o princípio é idêntico.

## Evidência de produção
> **Nível de evidência:** teórico · **Confiança:** média · **Fonte:** observação de indústria
>
> _Cenário ilustrativo e representativo, não uma implantação verificada concreta._

- **Contexto:** equipes que iteram sobre um agente em produção alterando prompts com frequência e trocando de modelos.
- **Cenário:** sem porta de avaliação, uma alteração de prompt que melhorava um caso piorou em silêncio vários outros e colocou em produção um agente pior no total; introduzir uma suite de regressão sobre conjunto de referência com LLM como juiz mais avaliadores por regras caçou a regressão antes da implantação.
- **Tecnologia:** harness de conjunto de referência, avaliadores por regras e LLM como juiz, porta de CI, juiz em linha sobre traços de produção.
- **Carga:** alterações frequentes contra um conjunto de referência que vai de dezenas a milhares de casos.
- **Resultados:** a experiência representativa é que a qualidade deixa de derivar assim que as alterações passam pela porta, e que o conjunto de referência — crescido continuamente a partir de falhas de produção — se torna o ativo mais valioso da equipe.

## Modos de falha observados
- **Entrar em produção por intuição:** alterações avaliadas testando a olho uns poucos prompts, de modo que as regressões saem sem ninguém dar conta.
- **Sobreajuste ao conjunto de referência:** afinar até o conjunto fixo passar enquanto a qualidade real estagna; mitiga-se fazendo crescer o conjunto com casos frescos de produção.
- **LLM como juiz ingênuo:** confiar num juiz não calibrado com enviesamentos conhecidos; tratar suas pontuações como verdade de campo sem validação humana.
- **Pontuar apenas a resposta final:** escapam os agentes que chegam a respostas corretas por caminhos inseguros ou caros.
- **Sem avaliação em linha:** números fora de linha excelentes que não sobrevivem ao contato com tráfego real e mutável.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Taxa de conclusão de tarefa | Dependente do domínio, com tendência | Métrica de qualidade principal |
| Taxa de aprovação da suite de regressão | 100 % antes de implantar | Porta em cada alteração |
| Concordância juiz–humano | Alta, calibrada | Valida o instrumento “LLM como juiz” |
| Taxa de violações de segurança | Perto de zero | Ao nível da trajetória, não só da resposta final |
| Custo por tarefa bem-sucedida | Minimizado | Emparelha com a conclusão para evitar sobre-otimizar |

## Métricas de custo
A avaliação acrescenta custo em três pontos: executar o agente sobre o conjunto de referência (inferência), a pontuação com LLM como juiz (mais inferência) e a revisão humana (trabalho). Controlam-se por níveis: primeiro os avaliadores por regras, baratos; o juiz LLM para o subconjunto aberto; os humanos para calibrar e para os casos de maior risco. O custo é devolvido evitando regressões, que são muito mais caras depois de implantadas. Reutilizar os traços de observabilidade (HRN-006) para reprodução fora de linha evita voltar a executar o modelo onde for possível.

## Características de escalabilidade
O custo de avaliação escala com dimensão do conjunto × custo do avaliador × frequência de alteração. À medida que o conjunto cresce, a amostragem e a pontuação por níveis mantêm acessíveis as execuções de regressão; os casos mais informativos podem ser ponderados ou executados mais vezes. A avaliação em linha escala com o tráfego amostrado e não com a totalidade. O próprio conjunto de referência escala *para cima* em valor à medida que cresce — o contrário da maioria das curvas de custo — porque cada caso acrescentado é um modo de falha protegido para sempre.

## Conteúdo relacionado
- HRN-006 — Observabilidade para sistemas agênticos
- PAT-009 — (padrão de avaliação / julgamento)
- PAT-015 — Validação de conhecimento

## Referências
- Literatura de prática sobre avaliação de LLM, calibração do LLM como juiz e conjuntos de referência.
- Observação de indústria sobre portas de regressão para sistemas agênticos, 2023–2026.
- Santa María, S. — Notas de trabalho sobre a disciplina de avaliação de agentes.

## Perguntas frequentes
**P:** Posso simplesmente confiar num LLM como juiz?
**R:** Use-o, mas trate-o como um instrumento que por sua vez precisa de avaliação. Calibre-o contra etiquetas humanas, dê-lhe rubricas explícitas, prefira a comparação aos pares e vigie os enviesamentos conhecidos (posição, verbosidade, preferência por si próprio).

**P:** De onde vêm os casos de referência?
**R:** De tráfego de produção real (anonimizado), de casos de falha conhecidos e de casos-limite; e, sobretudo, cada incidente de produção deveria acrescentar um novo caso de referência para que essa falha não se possa repetir em silêncio.

**P:** Avaliação fora de linha ou em linha, qual preciso?
**R:** Ambas. A de fora de linha condiciona as alterações antes de implantar contra um conjunto conhecido; a de em linha diz o que está realmente acontecendo e realimenta novos casos para o conjunto fora de linha. Formam um ciclo com a observabilidade.
