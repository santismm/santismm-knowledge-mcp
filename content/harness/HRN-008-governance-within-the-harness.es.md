---
title: "Gobernanza dentro del harness"
summary: "Traducir la política en controles aplicados: aprobaciones humanas, trazabilidad, identidad del agente y rendición de cuentas exigibles en un entorno regulado."
---

# Gobernanza dentro del harness

## Resumen ejecutivo

La gobernanza no es un documento que vive en un wiki: en un sistema agéntico fiable es una **capa de ejecución del harness**. Este capítulo sostiene que las obligaciones de IA empresarial (regulatorias, contractuales y basadas en riesgo) deben compilarse en controles ejecutables situados en el camino crítico entre la intención del modelo y la acción del sistema. La Ingeniería de Harness trata la gobernanza como código: puntos de decisión de política, puertas de aprobación y guardarraíles que observan, permiten, transforman o bloquean cada llamada a herramienta. Sin esa capa, la autonomía de un agente está sin gobernar por construcción; con ella, la autonomía se vuelve acotada, auditable y defendible.

## Conceptos clave

- **Punto de aplicación de política (PEP):** el componente del harness que intercepta una acción del agente y consulta una decisión.
- **Punto de decisión de política (PDP):** el motor que evalúa la política contra el contexto de la acción y devuelve permitir, denegar o transformar.
- **Guardarraíl:** una comprobación en ejecución sobre entradas o salidas (contenido, esquema, datos personales, jurisdicción) que restringe el comportamiento.
- **Puerta de aprobación:** un control que suspende la ejecución a la espera de una decisión humana o de una autoridad superior (véase PAT-001).
- **Política como código:** reglas de gobernanza expresadas en un formato declarativo, versionado y comprobable.
- **Rastro de auditoría:** el registro inmutable de qué se intentó, qué se decidió y por qué.

## Definición

> La **gobernanza dentro del harness** es la disciplina de incorporar la aplicación de políticas, los flujos de aprobación y los guardarraíles como una capa de ejecución de primera clase de un sistema agéntico, de modo que toda acción iniciada por el modelo esté mediada por una decisión explícita y auditable derivada de la política de la empresa.

## Explicación detallada

La capa de gobernanza se estructura en torno a la clásica **separación PEP/PDP** tomada de la arquitectura de autorización (XACML, OPA) y adaptada a agentes no deterministas. El punto de aplicación se teje en el camino de invocación de herramientas del harness, de modo que *ninguna* acción con efecto —enviar un correo, escribir en una base de datos, transferir fondos, llamar a una API externa— llega a un efector sin ser evaluada antes. El punto de decisión evalúa la acción contra un **paquete de políticas**: un conjunto de reglas versionado y comprobable que cubre en nombre de quién actúa el agente, qué clases de datos toca, qué jurisdicciones aplican y qué límites de gasto o de radio de impacto están en vigor.

Más allá del simple permitir/denegar importan tres resultados de aplicación. **Transformar** permite al harness autorizar una acción neutralizando su riesgo: redactar datos personales antes de una llamada saliente, reducir el alcance de una consulta o topar el importe de una transacción. **Escalar** encamina la acción hacia una puerta de aprobación (PAT-001), suspendiendo de forma duradera el plan del agente hasta que decida un humano o un agente supervisor. **Denegar con explicación** devuelve una justificación estructurada al contexto del agente para que el bucle de razonamiento replanifique en lugar de reintentar a ciegas.

Los guardarraíles operan en dos fronteras. Los *guardarraíles de entrada* filtran el contenido recuperado y las instrucciones del usuario en busca de inyección, patrones de jailbreak y peticiones fuera de alcance antes de que influyan en el plan. Los *guardarraíles de salida* validan el contenido generado y los argumentos estructurados de las herramientas contra esquema, política de contenido y reglas de fuga de datos antes de que crucen la frontera de confianza. Y algo esencial: los guardarraíles son **por capas, no únicos**. Un solo clasificador es un único punto de fallo, así que la defensa en profundidad combina comprobaciones deterministas (expresiones regulares, esquema, listas de permitidos), estadísticas (clasificadores) y basadas en modelo (LLM como juez), con valores por defecto conservadores de cierre ante fallo para las acciones de alto riesgo.

La gobernanza define además el **gradiente de autonomía**. El harness asigna a cada clase de acción un modo de control dentro de un espectro: totalmente autónomo, autónomo con registro, humano en el bucle (aprobación requerida) o humano sobre el bucle (el humano puede interrumpir). Ese mapeo es en sí mismo política: un reembolso por debajo de 50 € puede ser autónomo; un reembolso por encima de 5.000 €, o cualquier acción que toque datos regulados, exige una puerta de aprobación. La taxonomía de estos modos de control conecta directamente con la taxonomía del harness (HRN-003) y con el marco de gobernanza empresarial (GOV-001), que aporta las obligaciones que esta capa compila.

Por último, la gobernanza solo es creíble si es **observable y demostrable**. Cada decisión —la acción propuesta, la versión de política consultada, las entradas, el veredicto y la justificación— se escribe en un rastro de auditoría inmutable y consultable. Eso es lo que convierte «tenemos una política de IA» en «podemos demostrar, acción por acción, que la política se aplicó», que es el listón probatorio que reguladores y auditores aplican de verdad.

## Evidencia de producción

> **Escenario ilustrativo y representativo.** Nivel de evidencia: teórico · Confianza: media · Fuente: observación de industria, experiencia personal. Las cifras siguientes son rangos realistas extraídos de patrones observados, no mediciones de un despliegue verificado concreto.

- **Contexto:** un agente de back-office de servicios financieros que redacta y ejecuta remediaciones a clientes.
- **Escenario:** el agente debe resolver de forma autónoma disputas de importe bajo sin mover nunca fondos por encima de un umbral ni tocar datos de otro cliente.
- **Tecnología:** orquestador con un PEP en cada llamada a herramienta; paquete de políticas al estilo OPA; guardarraíles de clasificador, esquema y lista de permitidos; cola de aprobación duradera.
- **Carga:** decenas de miles de acciones al día, con un porcentaje de un solo dígito encaminado a puertas de aprobación.
- **Resultados (representativos):** en despliegues ilustrativos de esta forma, las capas de gobernanza suelen reducir en un orden de magnitud las violaciones de política de severidad alta frente a una línea base sin gobernar, a cambio de una latencia añadida por acción del orden de decenas bajas de milisegundos para las comprobaciones deterministas, y de una latencia extremo a extremo en las acciones escaladas acotada por el tiempo de respuesta humano.

### Lecciones aprendidas

Los valores por defecto de cierre ante fallo en las clases de acción de alto riesgo no son negociables; los fallos caros vienen de acciones que *nunca se evaluaron* porque se añadió una herramienta nueva sin la política correspondiente. La gobernanza debe por tanto controlar el **registro de herramientas**, no solo su invocación.

## Modos de fallo observados

| Modo de fallo | Disparador | Mitigación |
|---|---|---|
| Elusión de política | Herramienta nueva añadida sin gancho PEP | Controlar el registro de herramientas; denegar por defecto lo no mapeado |
| Evasión de guardarraíl | La inyección de prompt reescribe la intención y pasa un único clasificador | Guardarraíles por capas con cierre ante fallo; comprobaciones de entrada y de salida |
| Fatiga de aprobación | Puertas demasiado amplias inundan a los humanos, que sellan sin mirar | Puertas por nivel de riesgo; autoaprobar lo de bajo riesgo con registro |
| Política obsoleta | El paquete de políticas se desalinea de la regulación | Versionar y probar la política como código; revisión periódica de conformidad |
| Transformación silenciosa | La redacción corrompe una acción legítima | Registrar las transformaciones; devolver la justificación al contexto del agente |
| Huecos de auditoría | Las decisiones no se persisten antes de ejecutar la acción | Auditoría por escritura anticipada; denegar si el destino de auditoría no está disponible |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Cobertura de política (clases de acción mapeadas) | 100 % | Sin mapear → denegar por defecto |
| Tasa de violaciones de severidad alta | → 0 | Por cada 10.000 acciones |
| Precisión de la puerta de aprobación | Alta | Fracción de escalados que estaban justificados |
| Latencia de decisión (p95) | < 50 ms en lo determinista | Excluye la espera de aprobación humana |
| Completitud de auditoría | 100 % | Toda acción con efecto tiene registro de decisión |
| Tiempo medio de actualización de política | Bajo (horas) | CI/CD de política como código |

## Métricas de coste

- **Sobrecoste de gobernanza por acción:** las comprobaciones deterministas añaden cómputo despreciable; los guardarraíles basados en modelo añaden una o varias llamadas de inferencia auxiliares, que hay que presupuestar dentro del coste por tarea.
- **Coste de aprobación humana:** el coste variable dominante; se minimiza con una clasificación de riesgo precisa para que solo escale lo que lo merece.
- **Coste de ingeniería:** redacción de políticas y pruebas de conformidad; se amortiza reutilizando paquetes de políticas entre agentes.

## Características de escalado

La aplicación determinista escala horizontalmente y sin estado junto al orquestador. Los guardarraíles basados en modelo escalan con la capacidad de inferencia y son el cuello de botella de rendimiento con volúmenes altos de acciones: cachéalos y cortocircuítalos antes con comprobaciones deterministas baratas. Las puertas de aprobación escalan con capacidad humana, no con cómputo, así que el objetivo de diseño es mantener la fracción escalada pequeña y estable a medida que crece el volumen de acciones.

## Contenido relacionado

- HRN-003 — Taxonomía de capas del harness y modos de control.
- GOV-001 — Marco de gobernanza de IA empresarial (las obligaciones que esta capa aplica).
- PAT-001 — Patrón de aprobación humana (el mecanismo de la puerta de aprobación).

## Referencias

- NIST AI Risk Management Framework (AI RMF 1.0).
- ISO/IEC 42001:2023 — sistemas de gestión de IA.
- OASIS XACML y el modelo de autorización PEP/PDP.
- Open Policy Agent (OPA) — motor de política como código.

## Preguntas frecuentes

**P: ¿Por qué no resolver la gobernanza en el prompt?**
R: Las instrucciones del prompt son orientativas y derribables por inyección; la aplicación a nivel de harness es obligatoria y auditable. La gobernanza debe quedar fuera de la superficie persuadible del modelo.

**P: ¿No añade demasiada latencia controlar cada acción?**
R: Las comprobaciones deterministas cuestan entre unos pocos y unas decenas de milisegundos. Solo las acciones escaladas incurren en demora a escala humana, y son deliberadamente raras.

**P: ¿En qué se diferencia esto de GOV-001?**
R: GOV-001 define las obligaciones y el marco; HRN-008 es cómo esas obligaciones se compilan en controles de ejecución dentro del harness.
