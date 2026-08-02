---
title: "Orquestación"
summary: "El bucle que gobierna el sistema: quién llama al modelo, con qué contexto, qué ocurre con la salida, y cómo se coordinan varios agentes sin perder control ni trazabilidad."
---

# Orquestación

## Resumen ejecutivo

La orquestación es la sala de máquinas del harness: la capa que decide *quién actúa, en qué orden y qué pasa cuando un paso falla*. Abarca desde un único agente ejecutando un bucle hasta flotas de agentes especializados coordinados por un supervisor. Este capítulo enmarca la orquestación como el puente entre un plan representado (HRN-009) y una ejecución fiable, y sostiene que el problema central de ingeniería no es la inteligencia sino la **durabilidad**: flujos de larga duración, no deterministas y con fallos parciales deben sobrevivir a las caídas, reanudarse limpiamente y no perder ni duplicar efectos en silencio. El valor por defecto correcto es la topología más simple que cumpla el requisito: la complejidad en la orquestación es un coste, no una virtud.

## Conceptos clave

- **Topología:** la disposición de los agentes: único, tubería, supervisor/trabajador o red.
- **Agente supervisor u orquestador:** un agente que planifica y delega en trabajadores (véase PAT-002).
- **Agente trabajador:** un agente especializado que ejecuta una subtarea delegada (véase PAT-005).
- **Enrutado:** seleccionar el siguiente agente, herramienta o rama en función del estado.
- **Máquina de estados:** un grafo explícito de estados y transiciones que gobierna la ejecución.
- **Ejecución duradera:** semántica de flujo en la que el progreso se persiste en puntos de control y es reanudable.
- **Traspaso (handoff):** transferir control y contexto de un agente a otro.

## Definición

> La **orquestación** es la disciplina del harness que ejecuta un plan a través de uno o varios agentes y herramientas: selecciona la topología, encamina el control, coordina el estado y garantiza una ejecución duradera y con exactamente el número correcto de repeticiones ante el fallo.

## Explicación detallada

La **selección de topología** es la primera decisión y la de mayor consecuencia. Un *agente único* con herramientas es el valor por defecto correcto para la mayoría de las tareas: es el más barato, el más fácil de observar y el que tiene menos modos de fallo por coordinación. Recurre al multiagente solo cuando la tarea se beneficie de verdad: cuando las subtareas necesiten permisos de herramienta *distintos*, ventanas de contexto *distintas* o ejecución *paralela* e independiente. Las topologías habituales son: **tubería** (secuencia fija de etapas), **supervisor/trabajador** (PAT-002 + PAT-005: un planificador delega en especialistas y agrega) y **red o pares** (los agentes se traspasan el control libremente). El coste de coordinación sube bruscamente con la libertad de la topología; las redes de pares son potentes pero las más difíciles de hacer fiables, de gobernar y de depurar.

El **enrutado** es cómo se mueve el control por el sistema. Puede ser *dirigido por el modelo* (el supervisor elige el siguiente trabajador mediante llamada a herramienta), *dirigido por reglas* (transiciones deterministas en una máquina de estados) o *híbrido*. El enrutado determinista es preferible siempre que el camino se conozca, porque es gobernable y comprobable; el dirigido por el modelo se reserva para las ramificaciones genuinamente abiertas. Codificar el flujo como una **máquina de estados** explícita —estados, transiciones permitidas y guardas— es la técnica de fiabilidad de mayor palanca en orquestación: acota el espacio de comportamientos, hace el sistema inspeccionable y permite a la gobernanza (HRN-008) enganchar controles a las transiciones.

La **durabilidad** es la propiedad que separa una demo de un sistema de producción. Los flujos agénticos son de larga duración (de segundos a horas), llaman a herramientas externas inestables y pueden caerse a mitad de vuelo. Un motor de ejecución duradera persiste el progreso tras cada paso, de modo que ante un fallo el flujo *se reanuda* desde el último paso completado en lugar de reiniciarse. Eso exige cuidado con la semántica de efectos: las llamadas a herramientas con efectos secundarios deben ser **idempotentes** o estar protegidas con claves de deduplicación, para que una reanudación no cobre dos veces una tarjeta ni reenvíe un correo. Los casos duros son los *efectos externos no idempotentes*; el harness los maneja con el patrón saga: registrar la intención, ejecutar, confirmar y ofrecer acciones compensatorias ante un fallo parcial.

La **gestión de estado y contexto** entre agentes es donde los sistemas multiagente pierden fiabilidad. Cada traspaso (PAT-005) debe transferir *exactamente* el contexto que el trabajador necesita: de menos y falla; de más y sale caro y propenso a la distracción. El estado compartido pertenece a un almacén duradero con propiedad clara, no a una ventana de contexto compartida flotando libre. La agregación de las salidas de los trabajadores necesita un reductor explícito con resolución de conflictos, porque los trabajadores paralelos producirán resultados solapados o contradictorios.

Por último, la orquestación es dueña de la **concurrencia y el aislamiento de fallos**. Las ramas paralelas (expuestas por el plan en DAG de HRN-009) mejoran la latencia, pero exigen contrapresión, coordinación de límites de tasa entre herramientas compartidas y compartimentación para que un trabajador que falla no agote el presupuesto ni bloquee a sus hermanos. Los tiempos de espera, los cortacircuitos y los presupuestos por trabajador son asuntos de la orquestación, no de la aplicación.

## Evidencia de producción

> **Escenario ilustrativo y representativo.** Nivel de evidencia: teórico · Confianza: media · Fuente: observación de industria, experiencia personal. Las cifras siguientes son rangos representativos, no una medición de un despliegue verificado concreto.

- **Contexto:** un agente de investigación y síntesis que responde preguntas empresariales complejas.
- **Escenario:** un supervisor descompone una pregunta, despacha trabajadores de recuperación y análisis en paralelo, y agrega una respuesta con citas.
- **Tecnología:** motor de flujo duradero, topología supervisor/trabajador, enrutador determinista para las etapas conocidas, claves de deduplicación en las herramientas con efectos.
- **Carga:** ejecuciones concurrentes de varios trabajadores; cada ejecución dura minutos y hace varias llamadas a herramientas externas.
- **Resultados (representativos):** el abanico paralelo suele recortar la latencia de reloj en un múltiplo significativo frente a la ejecución secuencial, mientras que los puntos de control duraderos reducen la tasa de ejecuciones fallidas al eliminar los reinicios completos provocados por caídas. El coste es un mayor gasto en tokens (más agentes, más contexto) y una complejidad de coordinación añadida.

### Lecciones aprendidas

La mayoría de los equipos recurre al multiagente demasiado pronto. La progresión fiable es: hacer que funcione un agente único, codificarlo como máquina de estados, añadir durabilidad y *entonces* dividir en trabajadores solo allí donde el paralelismo o el aislamiento de permisos compense el coste de coordinación.

## Modos de fallo observados

| Modo de fallo | Disparador | Mitigación |
|---|---|---|
| Efectos secundarios duplicados | La reanudación reejecuta un paso no idempotente | Claves de idempotencia / compensación saga |
| Progreso perdido en una caída | Sin puntos de control | Motor de ejecución duradera |
| Pérdida de contexto en el traspaso | El trabajador recibe menos estado del necesario | Contratos de traspaso explícitos y tipados |
| Interbloqueo de coordinación | Los trabajadores se esperan mutuamente | Enrutado acíclico, tiempos de espera, arbitraje del supervisor |
| Explosión de coste | Delegación recursiva o entre pares sin límite | Presupuesto de agentes por ejecución + tope de profundidad de delegación |
| Agregación contradictoria | Los trabajadores paralelos discrepan | Reductor explícito con resolución de conflictos |
| Estrangulamiento de herramienta compartida | Los trabajadores martillean una API con límite de tasa | Límite de tasa centralizado + contrapresión |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Tasa de finalización de tarea | Alta | De extremo a extremo, verificada |
| Latencia p50/p95/p99 | Minimizada | El paralelismo mejora p50; las colas las dominan los trabajadores lentos |
| Tasa de éxito de reanudación | → 100 % | Flujos que se recuperan tras una caída |
| Tasa de efectos duplicados | → 0 | Corrección de la idempotencia |
| Coste por tarea | Acotado | Topes de agentes, profundidad y tokens |
| Rendimiento | Escala con la concurrencia | Limitado por los límites de tasa de las herramientas compartidas |

## Métricas de coste

- El **coste en tokens** crece con el número de agentes y el contexto por agente; el multiagente es materialmente más caro que el agente único para la misma tarea.
- **Sobrecoste de orquestación:** inferencia de planificación del supervisor más la de agregación por ejecución.
- **Sobrecoste de durabilidad:** las escrituras de punto de control (baratas) frente al gran ahorro de no reiniciar las ejecuciones fallidas.

## Características de escalado

El rendimiento del agente único escala horizontalmente y sin estado. El supervisor/trabajador escala las subtareas en paralelo hasta los límites de tasa de las herramientas compartidas, que se convierten en el techo real. Los motores de flujo duradero escalan con el número de flujos en vuelo; el almacenamiento de puntos de control y el despachador son los componentes que hay que dimensionar. Las topologías de red o pares son las que peor escalan: el sobrecoste de coordinación y la superficie de fallo crecen de forma superlineal con el número de agentes, y por eso las topologías de supervisor acotadas son el valor por defecto en la empresa.

## Contenido relacionado

- HRN-003 — El lugar de la orquestación en la taxonomía del harness.
- HRN-009 — El plan que la orquestación ejecuta.
- PAT-002 — Patrón de agente supervisor.
- PAT-005 — Patrón de delegación multiagente.

## Referencias

- Temporal y otros motores de flujo de ejecución duradera (patrón saga, durabilidad de flujos).
- Anthropic, «Building Effective Agents» (agente único primero, guía de topologías).
- LangGraph y la orquestación por máquina de estados para agentes.

## Preguntas frecuentes

**P: ¿Agente único o multiagente?**
R: Por defecto, agente único. Añade agentes solo por paralelismo o por aislamiento de permisos o contexto que compense el coste de coordinación.

**P: ¿Por qué una máquina de estados en lugar de bucles de agente libres?**
R: Las máquinas de estados acotan el comportamiento, son comprobables y permiten a la gobernanza enganchar controles a las transiciones. Los bucles libres son potentes, pero difíciles de hacer fiables o auditables.

**P: ¿Cómo evito cobrar dos veces a un cliente en un reintento?**
R: Haz idempotentes las llamadas a herramientas con efectos (claves de deduplicación) o envuélvelas en una saga con acciones compensatorias, y ejecútalas sobre un motor duradero que reanude en lugar de reiniciar.
