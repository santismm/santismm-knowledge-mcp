---
title: "Casos de estudio en Ingeniería de Harness"
summary: "Tres casos compuestos y anonimizados analizados por su harness: qué falló, qué control lo habría evitado y qué se aprendió al llevarlos a producción."
---

# Casos de estudio en Ingeniería de Harness

## Resumen ejecutivo

Este capítulo aterriza las capas abstractas del harness en tres historias de extremo a extremo. Cada una es un **caso compuesto, representativo y anonimizado**, sintetizado a partir de patrones habituales en la industria: no es el relato de un despliegue concreto con nombre y apellidos ni una fuente de métricas verificadas. Lo que interesa es mostrar cómo interactúan las capas bajo carga, cómo la memoria, la planificación, la orquestación, la gobernanza, la seguridad y la observabilidad dejan de ser capítulos separados y se convierten en un solo sistema. Leídos en conjunto, los casos refuerzan la tesis de que la fiabilidad en los agentes empresariales es una propiedad de ingeniería del harness, no una propiedad emergente del modelo.

## Conceptos clave

- **Caso de estudio compuesto:** un escenario ilustrativo ensamblado a partir de patrones recurrentes del mundo real, explícitamente no un despliegue verificado concreto.
- **De extremo a extremo:** desde la ingesta de la intención hasta la acción verificada, gobernada y observada.
- **Interacción de capas del harness:** cómo se componen memoria, planificación, orquestación, gobernanza, seguridad y observabilidad.

## Definición

> Un **caso de estudio de Ingeniería de Harness** es una narrativa estructurada que sigue un objetivo a través de todas las capas de un sistema agéntico para dejar a la vista las decisiones de diseño, los modos de fallo y las concesiones que determinan la fiabilidad.

## Explicación detallada

### Caso 1 — Operaciones financieras: el agente de conciliación

> Caso compuesto representativo. Sin métricas verificadas; los rangos son ilustrativos.

**Objetivo.** Conciliar de forma autónoma las transacciones diarias entre dos libros contables y remediar las discrepancias bajo una autoridad de gasto estricta.

**Diseño del harness.** La planificación (HRN-009) descompone el objetivo en un DAG: extraer, casar, clasificar discrepancias, remediar, informar. La orquestación (HRN-010) lo ejecuta sobre un **motor de flujo duradero**, de modo que una caída nocturna se reanuda desde el último punto de control en lugar de reiniciarse, algo crítico porque algunos pasos de remediación mueven dinero y no deben ejecutarse dos veces jamás (claves de idempotencia y compensación saga). La gobernanza (HRN-008) coloca una **puerta de aprobación** en cualquier remediación por encima de un umbral; por debajo, el agente actúa de forma autónoma con registro de auditoría completo. La memoria (HRN-005) guarda las reglas de conciliación y los precedentes de resolución. La observabilidad (HRN-006) traza cada decisión de emparejamiento.

**Resultado (ilustrativo).** El agente liquida de forma autónoma la cola larga de discrepancias triviales y escala las de consecuencia, desplazando el esfuerzo humano de *hacer* la conciliación a *aprobar* excepciones. **Lección:** la durabilidad y la idempotencia fueron las decisiones portantes; la «inteligencia» fue la parte fácil.

### Caso 2 — Atención al cliente: el agente de resolución

> Caso compuesto representativo. Sin métricas verificadas; los rangos son ilustrativos.

**Objetivo.** Resolver tickets de soporte de extremo a extremo —responder preguntas, actualizar cuentas, emitir créditos pequeños— sin filtrar nunca los datos de un cliente a otro y sin ser secuestrado por el contenido del ticket.

**Diseño del harness.** Este es un harness **con la seguridad primero** (HRN-011). Cada instancia de agente porta la autorización *del cliente solicitante*, de modo que el aislamiento de datos se aplica por debajo del modelo y no mediante prompting. El contenido recuperado de la base de conocimiento y del ticket se trata como no confiable; la **salida está en lista de permitidos** y los mensajes salientes pasan por prevención de fuga de datos, rompiendo la trifecta letal incluso cuando la detección de inyección se pierde un intento. Una topología de agente único (HRN-010) lo mantiene simple; un paso de reflexión (autocomprobación al estilo PAT-003) revisa la respuesta redactada antes de enviarla. La gobernanza envía a un humano los créditos por encima de un umbral pequeño.

**Resultado (ilustrativo).** La mayoría de los tickets se resuelve sin intervención humana; los intentos de inyección en los tickets no llegan a causar daño porque la *consecuencia* está acotada por los permisos y el control de salida, no solo por la detección. **Lección:** la seguridad arquitectónica ganó a la seguridad por clasificador; la victoria vino de restringir lo que un agente secuestrado *podía* hacer.

### Caso 3 — Trabajo del conocimiento: el agente de investigación y síntesis

> Caso compuesto representativo. Sin métricas verificadas; los rangos son ilustrativos.

**Objetivo.** Responder preguntas internas complejas con una síntesis citada y de fiar sobre un corpus grande.

**Diseño del harness.** Una topología **supervisor/trabajador** (HRN-010, PAT-002 + PAT-005): el supervisor descompone la pregunta y despacha en paralelo trabajadores de recuperación y análisis, y después un agregador reconcilia sus hallazgos en una respuesta con citas. La memoria (HRN-005) aporta el contexto de recuperación; la planificación (HRN-009) es entrelazada, porque el camino depende de lo que aflore la recuperación temprana. La evaluación (HRN-007) ejecuta una comprobación de anclaje con LLM como juez que *rechaza la respuesta si las afirmaciones no están citadas*, realimentando una replanificación. La observabilidad traza el abanico para que el coste y la latencia por trabajador sean visibles.

**Resultado (ilustrativo).** El abanico paralelo mejora la latencia frente a la investigación secuencial a cambio de un mayor gasto en tokens; la puerta de anclaje es lo que hace la salida suficientemente fiable como para publicarla. **Lección:** aquí el multiagente se ganó su complejidad precisamente por el *paralelismo* y por la necesidad de verificar antes de responder, no porque el multiagente sea inherentemente mejor.

### Observaciones transversales

En los tres se repiten las mismas verdades: (1) gana la topología más simple que cumple el requisito; (2) la durabilidad y la idempotencia, no la astucia, deciden si un agente de larga duración es apto para producción; (3) la gobernanza y la seguridad son capas *de ejecución*, no documentos; (4) la verificación (evaluación) antes de actuar es lo que convierte una salida plausible en una salida de fiar. Todo ello enlaza con las arquitecturas de referencia (ARCH-001, ARCH-002) y reformula la tesis central de HRN-001: la fiabilidad se construye dentro del harness.

## Evidencia de producción

> **Escenarios ilustrativos y representativos.** Nivel de evidencia: teórico · Confianza: media · Fuente: observación de industria, experiencia personal. Los tres casos son compuestos anonimizados ensamblados a partir de patrones recurrentes. No contienen mediciones de ningún despliegue de producción verificado, y toda cantidad es un rango ilustrativo.

- **Contexto:** operaciones financieras, atención al cliente y trabajo del conocimiento empresarial.
- **Escenario:** automatización agéntica de extremo a extremo bajo restricciones empresariales reales (autoridad de gasto, aislamiento de datos, confianza en las citas).
- **Tecnología:** motores de flujo duradero, identidad de agente con alcance, listas de permitidos de salida, orquestación supervisor/trabajador, evaluación con LLM como juez.
- **Resultados:** direccionales y cualitativos; se presentan para ilustrar concesiones de diseño, no para afirmar resultados medidos.

### Lecciones aprendidas

La lección recurrente es la contención: los equipos que tuvieron éxito añadieron complejidad (multiagente, autonomía) *solo* allí donde un requisito concreto lo justificaba, e invirtieron pronto en las capas poco vistosas —durabilidad, identidad, auditoría— que deciden si algo funciona en producción.

## Modos de fallo observados

| Caso | Modo de fallo dominante | Mitigación decisiva |
|---|---|---|
| Conciliación | Ejecutar dos veces un paso que mueve dinero al reanudar | Claves de idempotencia + compensación saga |
| Soporte | Exfiltración de datos vía contenido inyectado en el ticket | Autorización delegada por el usuario + lista de permitidos de salida + prevención de fuga |
| Investigación | Afirmaciones sin respaldo presentadas como hechos | Puerta de evaluación de anclaje antes de responder |

## KPIs

| Métrica | Conciliación | Soporte | Investigación |
|---|---|---|---|
| Tasa de finalización de tarea | Alta (con escalado) | Alta | Alta |
| Tasa de intervención humana | Baja (solo excepciones) | Baja | Moderada (revisión) |
| Tasa de incidentes de seguridad | → 0 (gasto con puerta) | → 0 (radio de impacto acotado) | → 0 (solo con citas) |
| Latencia | Tolerante a lotes | Interactiva | Mejorada por el abanico |
| Coste por tarea | Bajo | Bajo | Mayor (multiagente) |

## Métricas de coste

- **Conciliación:** barata por tarea (agente único, determinista); el coste dominante es la aprobación humana de excepciones.
- **Soporte:** barata por tarea; la inferencia de guardarraíles y prevención de fuga es el añadido marginal.
- **Investigación:** la más cara por tarea, por el gasto en tokens del multiagente; se justifica por la latencia en paralelo y la calidad verificada.

## Características de escalado

Los casos de agente único (conciliación, soporte) escalan horizontalmente y barato, acotados por los límites de tasa de las herramientas externas y por la capacidad de aprobación humana. El caso multiagente de investigación escala las subtareas en paralelo hasta los límites de tasa de la recuperación compartida, con el coste en tokens creciendo por cada trabajador añadido: el clásico intercambio latencia-coste que define cuándo merece la pena el multiagente.

## Contenido relacionado

- ARCH-001 — Arquitectura de referencia que ejemplifica flujos duraderos de agente único.
- ARCH-002 — Arquitectura de referencia que ejemplifica la orquestación supervisor/trabajador.
- HRN-001 — Definición y panorama (la tesis que estos casos refuerzan).

## Referencias

- Anthropic, «Building Effective Agents» y publicaciones sobre sistemas de investigación multiagente.
- Post-mortems y escritos de arquitectura del sector sobre flujos agénticos duraderos.
- Los capítulos HRN-005 a HRN-011, que estos casos componen.

## Preguntas frecuentes

**P: ¿Son despliegues reales?**
R: No. Son compuestos anonimizados ensamblados a partir de patrones recurrentes de la industria, presentados para ilustrar concesiones de diseño. No contienen métricas de producción verificadas.

**P: ¿Cuál es la lección más transferible?**
R: Añade complejidad solo donde un requisito la exija, e invierte primero en durabilidad, identidad y auditoría: las capas que deciden si un agente sobrevive a producción.

**P: ¿Por qué el multiagente aparece solo en el caso 3?**
R: Porque es el único caso donde el paralelismo y la verificación justificaban el coste de coordinación. Los otros son deliberadamente de agente único.
