---
title: "Observabilidade para sistemas agênticos"
summary: "Transformar cada passo do agente num traço reproduzível: spans, atribuição de custo, depuração de ciclos não determinísticos e os sinais que tornam a confiabilidade mensurável."
---

# Observabilidade para sistemas agênticos

## Resumo executivo
A observabilidade é o componente do harness que converte uma execução de agente opaca e não determinista num artefacto inspecionável e reproduzível. Não se pode depurar, avaliar, governar nem confiar num sistema estocástico de vários passos que não se vê, e por isso a observabilidade é uma precondição de quase todas as outras capacidades do harness, não um acrescento de segunda fase. Este capítulo cobre traços e spans adaptados a agentes, a contabilidade de tokens e custo como telemetria de primeira classe, os ganchos de avaliação e a reprodução determinista.

## Conceitos-chave
- **Traço:** o registro completo de uma única execução do agente, do princípio ao fim, do objetivo ao resultado.
- **Span:** uma unidade de trabalho dentro de um traço (uma chamada ao modelo, uma invocação de ferramenta, uma recuperação, uma decisão) com entradas, saídas, tempos e metadados.
- **Contabilidade de tokens e custo:** acompanhamento por span e por traço dos tokens de entrada e saída e do custo resultante.
- **Gancho de avaliação:** um ponto de instrumentação onde a lógica de avaliação pode pontuar um span ou um traço, em linha ou fora de linha.
- **Reprodução (replay):** voltar a executar de forma determinista um traço gravado para reproduzir e depurar o comportamento.
- **Cardinalidade:** a dimensionalidade das etiquetas de telemetria; uma cardinalidade alta ajuda à análise mas eleva o custo de armazenamento.

## Definição
A **observabilidade para sistemas agênticos** é o subsistema do harness que captura, estrutura e armazena um registro completo e consultável de cada execução do agente — seus spans, entradas, saídas, chamadas ao modelo, chamadas a ferramentas, custos e decisões — de modo que qualquer execução possa ser compreendida a posteriori, comparada entre versões, pontuada por avaliação e reproduzida de forma determinista. Responde à pergunta “o que aconteceu exatamente, e por quê?”.

## Explicação detalhada

### Por que a observabilidade clássica não chega
O APM tradicional assume serviços deterministas: um pedido, algumas chamadas síncronas, uma resposta. Os sistemas agênticos quebram essas premissas. Uma mesma execução pode seguir *um caminho diferente de cada vez*, abrir-se em leque sobre muitas chamadas a modelo e a ferramentas, iterar um número desconhecido de vezes e produzir entradas e saídas *em linguagem natural* que as métricas comuns não sabem resumir. A observabilidade para agentes tem, portanto, de capturar não só latência e erros, mas o *conteúdo semântico* de cada passo: o prompt enviado, a resposta devolvida, os argumentos escolhidos para a ferramenta, o raciocínio. Sem esse conteúdo, um traço diz *que* o agente falhou mas nunca *por quê*.

### Traços e spans, adaptados a agentes
O modelo de traço e span do tracing distribuído é a espinha dorsal certa, com tipos de span específicos de agentes:
- Os **spans de chamada ao modelo** registam o prompt montado (ou uma referência a ele), a resposta, o modelo e seus parâmetros, as contagens de tokens e a latência.
- Os **spans de chamada a ferramenta** registam a ferramenta, os argumentos (já validados), o resultado ou o erro, e as repetições.
- Os **spans de recuperação** registam a consulta, os elementos devolvidos e suas pontuações: indispensável para diagnosticar falhas de memória.
- Os **spans de decisão ou plano** registam a escolha da próxima ação pelo agente e, quando existe, sua justificação.

Os spans se encaixam uns nos outros até formar a árvore causal completa de uma execução. Quanto mais rico for o conteúdo capturado, mais depurável é o sistema, à custa de armazenamento e de exposição de dados, que têm de ser geridos (redação, amostragem, retenção).

### A contabilidade de tokens e custo como telemetria de primeira classe
Nos sistemas agênticos o *custo é um comportamento*, não apenas uma fatura. Uma regressão que provoca um ciclo de raciocínio a mais ou um contexto inchado se manifesta primeiro como um pico de tokens. A observabilidade tem, por isso, de tratar as contagens de tokens e o custo derivado como métricas de primeira classe, atribuídos por span, por traço, por usuário e por versão do agente. Isso torna detectáveis as regressões de custo, alertáveis os ciclos descontrolados e mensurável a economia por tarefa, fechando o círculo com a disciplina de métricas de custo que atravessa todo o manual.

### Ganchos de avaliação
Observabilidade e avaliação (HRN-007) são codependentes. A avaliação precisa dos traços; a observabilidade rende mais quando seus dados alimentam a pontuação. O harness deve expor *ganchos de avaliação*: pontos de instrumentação onde um avaliador (uma regra, um classificador ou um LLM como juiz) se pode ligar a um span ou a um traço, seja *em linha* (pontuando tráfego vivo para monitoramento) ou *fora de linha* (reproduzindo traços armazenados contra um modelo ou um prompt novos). Desenhar esses ganchos dentro do formato de traço desde o primeiro dia é o que torna barata a avaliação contínua mais tarde.

### Reprodução determinista
A capacidade mais poderosa e específica dos agentes é a reprodução: voltar a executar um traço gravado para reproduzir seu comportamento. Como o modelo não é determinista, uma reprodução a sério exige capturar o suficiente para *fixar* a execução: saídas do modelo gravadas (para reproduzir sem voltar a chamá-lo), resultados de ferramentas, contexto recuperado e sementes aleatórias quando aplicável. A reprodução permite três coisas de outro modo quase impossíveis: reproduzir localmente uma falha de produção, submeter a teste de regressão uma alteração de prompt ou de modelo contra tráfego histórico real, e comparar em A/B duas versões do harness sobre entradas idênticas. Um harness sem reprodução depura à base de suposições.

### Privacidade, redação e retenção
Capturar prompts e respostas completos significa capturar dados potencialmente sensíveis. A observabilidade tem de integrar redação (limpeza de dados pessoais), controles de acesso sobre o armazém de traços e políticas de retenção: são preocupações de governança (HRN-008) e de segurança (HRN-011) que a camada de observabilidade aplica na prática.

## Evidência de produção
> **Nível de evidência:** teórico · **Confiança:** média · **Fonte:** observação de indústria
>
> _Cenário ilustrativo e representativo, não uma implantação verificada concreta._

- **Contexto:** equipes que operam agentes de vários passos em produção e que entraram em produção com pouco mais do que logging básico.
- **Cenário:** uma falha intermitente (o agente toma de vez em quando uma ação errada) é indiagnosticável a partir dos logs; depois de acrescentar captura completa de traços e spans com reprodução, a execução que falhou é reproduzida localmente e rastreada até uma falha de recuperação que tinha alimentado o modelo com um documento enganador.
- **Tecnologia:** backend de tracing com tipos de span conscientes do agente, armazém de traços, ferramentaria de reprodução, telemetria de tokens e custo.
- **Carga:** tráfego de produção com falhas de cauda longa, difíceis de reproduzir.
- **Resultados:** a experiência representativa é que o tempo médio até ao diagnóstico cai drasticamente assim que as execuções estão completamente traçadas e são reproduzíveis, e que as regressões de custo se tornam visíveis no momento exato em que ocorrem.

## Modos de falha observados
- **Logs sem estrutura:** texto livre que regista *que* algo aconteceu mas não a árvore de spans, as entradas e as saídas necessárias para o compreender.
- **Sem captura de conteúdo:** capturar latência e erros mas não prompts nem respostas, deixando as falhas indiagnosticáveis.
- **Cardinalidade e armazenamento sem limite:** capturar tudo com fidelidade máxima em cada execução, disparando o custo de armazenamento; são precisos amostragem e política de retenção.
- **Sem reprodução:** incapacidade de reproduzir falhas não deterministas, o que obriga a depurar por suposições.
- **Fuga de privacidade:** capturar conteúdo sensível de prompts sem redação nem controle de acesso.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Cobertura de tracing | ~100 % das execuções | Cada execução de produção produz um traço |
| Tempo médio até ao diagnóstico | Minimizado | Do aviso de falha à causa raiz via traços e reprodução |
| Cobertura de atribuição de custo | Por span / traço / versão | Permite detectar regressões de custo |
| Fidelidade de reprodução | Alta | Proporção de traços gravados que se reproduzem de forma determinista |

## Métricas de custo
A observabilidade acrescenta custo de armazenamento (proporcional a traços × spans × conteúdo capturado) e uma pequena sobrecarga de execução por span. A amostragem, a redação, a retenção por níveis e o guardar referências em vez de cargas grandes mantêm isso sob controle. O custo é devolvido com juros pela resolução mais rápida de incidentes e por *tornar observável o próprio token e seu custo*, o que costuma trazer à luz economias de inferência que empequenecem a despesa em observabilidade.

## Características de escalabilidade
O volume de traços escala com tráfego × passos por execução, portanto os fluxos agênticos profundos geram desproporcionadamente mais telemetria do que os serviços planos. O armazenamento e o custo de consulta são os gargalos; a amostragem por cabeçalho e por cauda, a agregação e os níveis de retenção mantêm-no limitado. O armazenamento para reprodução escala com a fidelidade capturada, trocando armazenamento por reprodutibilidade.

## Conteúdo relacionado
- HRN-003 — A taxonomia do harness
- HRN-007 — Avaliação de sistemas agênticos

## Referências
- Conceitos de tracing distribuído (spans, traços) adaptados a cargas agênticas.
- Literatura de prática sobre observabilidade e ferramentaria de tracing para LLM.
- Santa María, S. — Notas de trabalho sobre observabilidade e reprodução de agentes.

## Perguntas frequentes
**P:** Não bastam os logs?
**R:** Não. Os logs sem estrutura não permitem reconstruir a árvore causal de spans de uma execução ramificada de vários passos, e raramente capturam o conteúdo semântico (prompts, respostas, contexto recuperado) necessário para explicar uma falha. São precisos traços estruturados com reprodução.

**P:** Por que medir o custo na camada de observabilidade?
**R:** Porque nos sistemas agênticos o custo é um *comportamento*: os ciclos a mais e o contexto inchado aparecem como picos de tokens antes de aparecerem em qualquer outro lugar. A telemetria de custo é como se caçam essas regressões.

**P:** Qual é a capacidade mais valiosa de todas?
**R:** A reprodução determinista. Converte “não conseguimos reproduzi-lo” numa sessão de depuração local rotineira e permite submeter as alterações a teste de regressão contra tráfego histórico real.
