---
title: "La taxonomía del harness"
summary: "Descomposición precisa de los componentes del harness —memoria, herramientas, planificación, orquestación, observabilidad, evaluación, gobernanza y seguridad— y de cómo encajan entre sí."
---

# La taxonomía del harness

## Resumen ejecutivo
El harness no es un monolito: es un conjunto de componentes distintos, cada uno con una responsabilidad clara e interfaces claras con los demás. Este capítulo ofrece la taxonomía canónica: ocho componentes —memoria, herramientas, planificación, orquestación, observabilidad, evaluación, gobernanza y seguridad— organizados en tres capas (el bucle de ejecución, las preocupaciones transversales y los controles). La taxonomía es el mapa que el resto del manual rellena.

## Conceptos clave
- **Componente:** una parte acotada del harness con una única responsabilidad principal.
- **Capa de ejecución:** los componentes que mueven el bucle percibir–razonar–actuar (planificación, orquestación, memoria, herramientas).
- **Capa transversal:** preocupaciones que instrumentan o miden el bucle sin estar dentro de él (observabilidad, evaluación).
- **Capa de control:** preocupaciones que limitan lo que el bucle puede hacer (gobernanza, seguridad).
- **Interfaz:** el contrato por el que dos componentes intercambian información o autoridad.

## Definición
La **taxonomía del harness** es la descomposición canónica del andamiaje de ingeniería de un sistema agéntico en componentes y capas con nombre, definiendo la responsabilidad de cada componente y sus relaciones con los demás. Sirve como vocabulario compartido y como lista de verificación: un harness de calidad productiva debe abordar conscientemente cada componente, aunque elija una implementación mínima.

## Explicación detallada

La taxonomía organiza ocho componentes en tres capas. La estratificación importa: te dice qué componentes *hacen el trabajo*, cuáles *observan el trabajo* y cuáles *acotan el trabajo*.

### Capa de ejecución — mueve el bucle
Los componentes que producen realmente el comportamiento del agente.

- **Planificación y gestión de objetivos (HRN-009):** descompone un objetivo en subobjetivos, decide la siguiente acción, gestiona la replanificación cuando un paso falla y detecta la finalización o el bloqueo. Responde a «¿qué debería pasar ahora?».
- **Orquestación (HRN-010):** el runtime que ejecuta el bucle: ensambla el contexto, llama al modelo, despacha llamadas a herramientas, gestiona reintentos y tiempos de espera, enruta entre modelos o subagentes y aplica presupuestos. Responde a «quién se ejecuta, con qué, y qué ocurre con la salida».
- **Memoria (HRN-005):** gobierna qué entra en el contexto del modelo: memoria de trabajo a corto plazo, almacenes de largo plazo, recuperación, compresión y olvido. Responde a «qué ve y qué recuerda el modelo».
- **Herramientas / actuación:** los contratos tipados con los que el agente lee y escribe en los sistemas de la empresa, con validación explícita de entradas, esquemas de salida, idempotencia y semántica de fallo. Responde a «cómo afecta el agente al mundo».

El modelo se sitúa *dentro* de esta capa como componente invocado, no como el sistema. Es el replanteamiento central de HRN-001.

### Capa transversal — mide el bucle
No producen comportamiento; hacen que el comportamiento sea visible y cuantificable.

- **Observabilidad (HRN-006):** trazado, spans, registro estructurado, contabilidad de tokens y coste, y reproducción. Convierte una ejecución opaca y no determinista en un artefacto inspeccionable. Responde a «qué ocurrió, exactamente».
- **Evaluación (HRN-007):** medición offline y online de la calidad: conjuntos dorados, LLM como juez, suites de regresión, métricas de finalización de tarea. Responde a «¿es realmente bueno, y va a mejor o a peor?».

Observabilidad y evaluación son codependientes: la evaluación necesita las trazas que produce la observabilidad, y la observabilidad rinde más cuando sus datos alimentan la evaluación.

### Capa de control — acota el bucle
Limitan la autoridad y defienden el sistema.

- **Gobernanza (HRN-008):** codifica política, flujos de aprobación, rendición de cuentas y auditabilidad como controles aplicados: puertas con humano en el bucle, políticas de acciones permitidas y registros de quién o qué autorizó cada acción. Responde a «¿está permitido, y quién responde?».
- **Seguridad (HRN-011):** trata al modelo y a sus entradas como no confiables: defensa frente a inyección de prompts, aislamiento de herramientas, credenciales de mínimo privilegio, validación de salidas y controles de exfiltración de datos. Responde a «¿puede un adversario hacer que este sistema haga algo que no debe?».

### Cómo componen los componentes
Una petición entra por **planificación**, que entrega un plan a **orquestación**. La orquestación ensambla el contexto desde **memoria**, llama al **modelo** y enruta las acciones elegidas hacia **herramientas**. Durante todo el proceso, **observabilidad** registra cada span y **evaluación** puntúa resultados; **gobernanza** cierra el paso a las acciones de riesgo y **seguridad** vigila las fronteras. Las interfaces entre componentes son donde se gana o se pierde la fiabilidad: un contrato descuidado entre memoria y orquestación, o una llamada del modelo a una herramienta sin validar, son una fuente clásica de fallo en producción.

### Cómo usar la taxonomía
La taxonomía es también una **lista de madurez**. Para cada componente, pregunta: ¿lo tenemos, es explícito, está probado? Muchos proyectos de «agentes» implementan solo la capa de ejecución y salen a producción sin observabilidad, evaluación, gobernanza ni seguridad: los cuatro componentes que distinguen un sistema de una demo. Un harness equilibrado invierte en las tres capas.

| Capa | Componente | Responsabilidad principal | Capítulo |
|------|------------|---------------------------|----------|
| Ejecución | Planificación y objetivos | Decidir la siguiente acción; replanificar | HRN-009 |
| Ejecución | Orquestación | Ejecutar el bucle; enrutar; presupuestar | HRN-010 |
| Ejecución | Memoria | Controlar el contexto; recuperar; olvidar | HRN-005 |
| Ejecución | Herramientas / actuación | Actuar sobre el mundo mediante contratos | HRN-003 |
| Transversal | Observabilidad | Trazar, registrar, contabilizar, reproducir | HRN-006 |
| Transversal | Evaluación | Medir calidad; frenar regresiones | HRN-007 |
| Control | Gobernanza | Aplicar política; aprobaciones; auditoría | HRN-008 |
| Control | Seguridad | Defender frente a adversarios | HRN-011 |

## Modos de fallo observados
- **Capas ausentes:** implementar solo la capa de ejecución (un bucle que funciona) y omitir observabilidad, evaluación, gobernanza y seguridad: el precipicio de la demo a producción.
- **Acoplamiento de componentes:** difuminar responsabilidades (por ejemplo, que la orquestación comprima memoria en silencio) de modo que los fallos no puedan aislarse ni probarse.
- **Interfaces débiles:** contratos sin validar ni tipar entre componentes, en especial modelo→herramienta y recuperación→contexto, que propagan datos malos por todo el bucle.
- **Exceso de orquestación:** construir topologías multiagente elaboradas antes de que los componentes de un solo agente sean fiables por separado.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Cobertura de componentes | 8/8 abordados | Cada componente implementado conscientemente o dejado en mínimo de forma deliberada |
| Tasa de validación de interfaces | 100 % de las llamadas modelo→herramienta | Evita propagar argumentos malformados o alucinados |
| Tasa de finalización de tarea | Depende del dominio | Medida por evaluación (HRN-007) |

## Métricas de coste
El coste se concentra en la capa de ejecución (inferencia y llamadas a herramientas) y en el almacenamiento de observabilidad (el volumen de trazas escala con los pasos). La evaluación añade coste periódico por lotes. Gobernanza y seguridad son sobre todo coste fijo de ingeniería. Una heurística útil de presupuesto es atribuir el coste *por componente*, para que la optimización apunte al motor real del gasto y no al más visible.

## Características de escalado
Cada componente escala por un eje distinto: la orquestación con la concurrencia, la memoria con el estado retenido y el tamaño del corpus, la observabilidad con los pasos por ejecución, y la evaluación con el tamaño del corpus y las llamadas al juez. Como escalan de forma independiente, la taxonomía es también una herramienta de planificación de capacidad: los cuellos de botella aparecen en componentes concretos, no en «el agente» en abstracto.

## Contenido relacionado
- HRN-001 — Ingeniería de Harness: definición y panorama
- HRN-005 — Memoria en sistemas agénticos
- HRN-006 — Observabilidad para sistemas agénticos
- HRN-009 — Planificación y gestión de objetivos
- HRN-010 — Orquestación

## Referencias
- Literatura de práctica sobre arquitecturas de agentes y descomposición en componentes.
- Observación de industria sobre la estructura de sistemas agénticos en producción, 2023–2026.
- Santa María, S. — Notas de trabajo sobre la taxonomía del harness.

## Preguntas frecuentes
**P:** ¿Por qué ocho componentes y no más o menos?
**R:** Ocho es el conjunto mínimo que cubre ejecutar el bucle, medirlo y acotarlo sin solaparse. Puedes subdividir (por ejemplo, separar herramientas de actuación), pero las responsabilidades siguen siendo las mismas.

**P:** ¿El modelo es un componente del harness?
**R:** El modelo es *invocado por* el harness y se sitúa dentro de la capa de ejecución, pero no forma parte del harness: el harness es precisamente todo lo que lo rodea.

**P:** ¿Puede un sistema pequeño saltarse la capa de control?
**R:** Para un juguete, sí; para un sistema empresarial, no. Gobernanza y seguridad son lo que hace seguro poner el sistema delante de clientes, reguladores y adversarios. Pueden ser mínimas, pero deben ser conscientes.
