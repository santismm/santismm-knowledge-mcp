---
title: "Planificación y gestión de objetivos"
summary: "Descomposición de objetivos, gestión de subobjetivos y replanificación: cuándo deja el harness decidir al modelo y cuándo fija el camino en código."
---

# Planificación y gestión de objetivos

## Resumen ejecutivo

Un agente fiable no se limita a reaccionar token a token: persigue un objetivo a través de un plan representado e inspeccionable. La planificación y gestión de objetivos es la capa del harness que convierte un objetivo de alto nivel en un plan estructurado y ejecutable, sigue su estado a lo largo de una ejecución de horizonte largo y lo revisa cuando la realidad se aparta de lo previsto. Este capítulo trata el plan como una **estructura de datos de primera clase** propiedad del harness, no como una cadena de pensamiento efímera atrapada en la ventana de contexto. Externalizar el plan es lo que hace el comportamiento del agente auditable, reanudable y recuperable.

## Conceptos clave

- **Objetivo:** el estado final deseado que se encarga al agente, con criterios de éxito.
- **Plan:** un conjunto ordenado o parcialmente ordenado de tareas que se espera que alcancen el objetivo.
- **Tarea o paso:** una unidad atómica de trabajo mapeada a una o varias llamadas a herramienta.
- **Descomposición:** el acto de partir un objetivo en tareas (véase PAT-010).
- **Representación del plan:** la estructura explícita (lista, árbol, DAG, máquina de estados) en la que se almacena el plan.
- **Replanificación:** revisar el plan en respuesta a un fallo, a información nueva o a un cambio de restricciones.
- **Estado del plan:** el registro duradero de qué pasos están pendientes, en curso, hechos o fallidos.

## Definición

> La **planificación y gestión de objetivos** es la disciplina del harness que representa un objetivo y su plan descompuesto como estado explícito y duradero; selecciona y secuencia tareas contra ese plan; y reconcilia continuamente el plan con los resultados observados mediante replanificación.

## Explicación detallada

La planificación empieza por la **descomposición**: convertir un objetivo en tareas cuya finalización, en conjunto, satisface los criterios de éxito del objetivo (PAT-010 nombra este patrón). Las estrategias de descomposición intercambian coste por adaptabilidad. *Planificar y luego ejecutar* fija un plan completo por adelantado: barato, predecible y fácil de gobernar, pero frágil cuando el mundo lo sorprende. La *planificación entrelazada* (la familia ReAct) planifica un paso cada vez a partir de las observaciones: adaptable y robusta, pero más cara y más difícil de acotar. La *planificación jerárquica* combina ambas: un plan grueso de fases, cada una expandida en pasos concretos justo a tiempo. Los harness maduros eligen según la tarea: los flujos deterministas y bien entendidos favorecen planificar y luego ejecutar; la investigación abierta favorece el entrelazado.

La **representación del plan** es la decisión portante. Una lista plana de tareas basta para trabajo lineal; un **DAG** captura dependencias y desbloquea el paralelismo (el orquestador, HRN-010, puede despachar ramas independientes de forma concurrente); una **máquina de estados** es lo adecuado cuando las transiciones están gobernadas y deben poder enumerarse de forma exhaustiva. Sea cual sea la forma, el plan debe estar *externalizado y persistido*. Un plan que solo vive dentro del contexto del modelo se pierde ante una caída, es invisible para la observabilidad e imposible de gobernar. Externalizarlo permite al harness reanudar desde el último estado duradero, permite a las personas inspeccionarlo y editarlo, y permite a la capa de gobernanza (HRN-008) razonar sobre lo que el agente pretende hacer *antes* de que lo haga.

La **gestión de objetivos** es la capa por encima de los planes concretos. Sigue los criterios de éxito de forma explícita, de modo que la finalización se *verifica* en lugar de que la afirme el modelo. Gestiona subobjetivos y sus dependencias, resuelve conflictos y prioridades entre objetivos, y hace cumplir condiciones de terminación —presupuestos de pasos, de tiempo y techos de coste— que evitan el fallo clásico de un agente iterando eternamente sobre un objetivo inalcanzable. Los criterios de terminación forman parte de la especificación del objetivo, no son una ocurrencia tardía.

La **replanificación** es donde la planificación se gana su sitio en un sistema *fiable*. El mundo no es estacionario: las herramientas fallan, los datos caducan, las suposiciones se rompen. El bucle de replanificación compara el resultado de cada paso con lo esperado y dispara una revisión ante la divergencia: un paso fallido, una precondición que ya no se cumple o información nueva que invalida las tareas posteriores. Una replanificación eficaz es *acotada*: prefiere la reparación local (reintentar, sustituir una herramienta, insertar un paso de recuperación) a descartar el plan entero, y escala a una redescomposición completa solo cuando la reparación local falla repetidamente. Esto enlaza directamente con los patrones de estrategia de recuperación y evita que la replanificación entre en bucle. Un presupuesto de replanificación —un tope al número de veces que un plan puede revisarse antes de escalar a un humano o a un supervisor— impide que el agente queme coste dentro de un bucle de planificación.

## Evidencia de producción

> **Escenario ilustrativo y representativo.** Nivel de evidencia: teórico · Confianza: media · Fuente: observación de industria, experiencia personal. Los rangos siguientes son representativos de patrones observados, no mediciones de un sistema verificado concreto.

- **Contexto:** un agente de migración de datos de varios pasos que reconcilia registros entre sistemas.
- **Escenario:** el objetivo («migrar y reconciliar la cuenta X») se descompone en fases de extracción, transformación, validación y carga, con dependencias entre pasos.
- **Tecnología:** plan en DAG persistido en un almacén duradero; replanificación entrelazada ante fallos de validación; presupuestos de pasos y de coste.
- **Carga:** tareas de horizonte largo que abarcan de minutos a horas, con decenas de pasos cada una.
- **Resultados (representativos):** externalizar el plan y añadir replanificación acotada suele elevar sustancialmente la tasa de finalización de tarea frente a una línea base de planificar una sola vez, en tareas con tasas de fallo realistas, sobre todo por recuperarse localmente de fallos transitorios en lugar de abortar la ejecución entera.

### Lecciones aprendidas

Las mayores ganancias de fiabilidad no vienen de planes iniciales más inteligentes, sino de una **replanificación barata y bien acotada** y de **presupuestos de terminación explícitos**. Los agentes sin límite fallan iterando; los agentes acotados fallan de forma segura y escalan.

## Modos de fallo observados

| Modo de fallo | Disparador | Mitigación |
|---|---|---|
| Pérdida del plan ante una caída | El plan solo vive en el contexto | Persistir el plan como estado duradero |
| Bucle infinito | Sin presupuesto de terminación | Presupuestos de pasos, tiempo y coste, más tope de replanificación |
| Sobredescomposición | El objetivo se parte en microtareas triviales | Ajustar la granularidad del paso a las llamadas a herramienta |
| Replanificación en bucle | Redescomposición completa ante cada fallo menor | Reparación local acotada antes de replanificar globalmente |
| Finalización sin verificar | El modelo afirma haber terminado sin comprobar los criterios | Verificación explícita de los criterios de éxito |
| Violación de dependencias | Un paso se ejecuta antes de que su precondición se cumpla | Orden del DAG impuesto por el orquestador |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Tasa de finalización de tarea | Alta | A nivel de objetivo, con criterios verificados |
| Pasos por tarea | Mínimos | Menos es más barato; vigilar la sobredescomposición |
| Tasa de replanificación | Baja o moderada | Los picos señalan planes frágiles o herramientas inestables |
| Éxito de recuperación del plan | Alto | Fracción de fallos reparados sin abortar |
| Tasa de incumplimiento de presupuesto | → 0 | Tareas que topan con los techos de pasos o coste |

## Métricas de coste

- El **coste por tarea** escala con pasos × inferencia por paso + coste de herramientas; la sobredescomposición lo infla directamente.
- **Sobrecoste de planificación:** la planificación entrelazada añade una llamada de inferencia por paso; planificar y luego ejecutar amortiza una única llamada de planificación entre muchos pasos.
- **Coste de replanificación:** cada replanificación es inferencia adicional; el tope de replanificación acota el coste en el peor caso por tarea.

## Características de escalado

Los planes en DAG escalan el rendimiento de ejecución al exponer al orquestador las ramas paralelizables. La complejidad del plan escala el coste de inferencia de planificación de forma superlineal, así que la descomposición jerárquica (planificar fases a grandes rasgos y expandir de forma perezosa) mantiene acotado el coste de planificación por tarea a medida que crecen los objetivos. El estado duradero del plan escala con el número de objetivos concurrentes en vuelo, no con su longitud, lo que convierte al almacén de estado en el componente que hay que dimensionar para la concurrencia.

## Contenido relacionado

- HRN-003 — Dónde encaja la planificación en la taxonomía del harness.
- HRN-010 — La orquestación ejecuta el plan y despacha las ramas paralelas.
- PAT-010 — Patrón de descomposición de objetivos.

## Referencias

- Yao et al., «ReAct: Synergizing Reasoning and Acting in Language Models».
- Wang et al., «Plan-and-Solve Prompting».
- Planificación clásica en IA: literatura sobre STRIPS y HTN (redes jerárquicas de tareas).

## Preguntas frecuentes

**P: ¿Debe vivir el plan en la ventana de contexto?**
R: No. Persístelo como estado duradero. El contexto es volátil, limitado en tamaño e ingobernable; un plan persistido es reanudable, inspeccionable y auditable.

**P: ¿Planificar y luego ejecutar, o entrelazar?**
R: Elige según la tarea. Los flujos deterministas favorecen planificar y luego ejecutar; las tareas abiertas o propensas a fallar favorecen la replanificación entrelazada. La planificación jerárquica mezcla ambas.

**P: ¿Cómo evito que un agente itere para siempre?**
R: Haz que los criterios de terminación formen parte del objetivo: presupuestos de pasos, tiempo y coste más un tope de replanificación, con escalado a un humano o supervisor al incumplirlos.
