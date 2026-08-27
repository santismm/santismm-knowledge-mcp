---
title: "Glosario"
summary: "Definiciones canónicas de los términos de Ingeniería de Harness usados en todo el manual, para que el vocabulario no derive entre capítulos."
---

# Glosario

## Resumen ejecutivo

Este glosario es la referencia canónica de los términos usados en todo el manual de Ingeniería de Harness y en el resto de la Santismm Knowledge Platform. Las definiciones son concisas, extraíbles por máquina y están pensadas para citarse directamente. Cuando un término tiene capítulo propio, la entrada remite a él.

## Definición

Lo que sigue son las definiciones canónicas de los términos usados a lo largo de este corpus. Los términos se agrupan por legibilidad; dentro de cada grupo van aproximadamente de lo fundacional a lo especializado.

Los nombres ingleses de uso establecido en la industria (*harness*, *tool*, *span*, *prompt*, *guardrail*…) se conservan y se acompañan de su equivalente en castellano donde existe uno asentado. No se traduce **harness**: es el término propio de la disciplina.

### Conceptos fundamentales

- **Agente:** un sistema que usa un modelo de lenguaje dentro de un bucle para perseguir un objetivo, decidiendo qué acciones (llamadas a herramientas) tomar a partir de las observaciones hasta que se cumple una condición de parada.
- **Sistema agéntico:** un sistema de software cuyo comportamiento lo dirigen uno o varios agentes, incluyendo todo el andamiaje circundante necesario para hacerlos fiables.
- **Harness:** el andamiaje de ingeniería alrededor de un modelo —memoria, herramientas, planificación, orquestación, observabilidad, evaluación, gobernanza y seguridad— que convierte un modelo en bruto en un sistema agéntico fiable.
- **Ingeniería de Harness:** la disciplina emergente responsable de construir sistemas agénticos fiables para entornos empresariales, diseñando y operando el harness.
- **Modelo / LLM:** el gran modelo de lenguaje subyacente que razona y genera; dentro del harness se trata como un componente potente pero no determinista y manipulable.
- **Gradiente de autonomía:** el espectro de modos de control, de totalmente autónomo a humano en el bucle, asignado por política a cada clase de acción.
- **Radio de impacto (*blast radius*):** el daño máximo que puede causar una acción, o un agente comprometido; una magnitud clave que hay que acotar.

### Herramientas y acciones

- **Herramienta (*tool*):** una función o capacidad que el agente puede invocar para observar o afectar al mundo (búsqueda, ejecución de código, llamada a una API, consulta a una base de datos).
- **Llamada a herramienta (*function calling*):** una petición estructurada del modelo para invocar una herramienta con argumentos.
- **Efector:** una herramienta que produce un efecto secundario en un sistema externo (envía, escribe, transfiere).
- **Idempotencia:** la propiedad por la que ejecutar una operación varias veces tiene el mismo efecto que ejecutarla una vez; imprescindible para reintentos y reanudaciones seguras.
- **Efecto secundario:** un cambio visible desde fuera producido por una llamada a herramienta.
- **Lista de permitidos (*allowlist*):** un conjunto explícito de elementos autorizados (herramientas, destinos de salida); el valor por defecto seguro en las decisiones sensibles a la seguridad.

### Memoria y contexto

- **Ventana de contexto:** el tramo acotado de tokens al que el modelo puede atender en una única inferencia.
- **Memoria:** la capa del harness que persiste y recupera información entre pasos y sesiones (de corto plazo, de largo plazo, episódica, semántica).
- **RAG (generación aumentada por recuperación):** proporcionar al modelo contenido relevante recuperado en tiempo de inferencia, de modo que su salida se ancle en un corpus y no solo en la memoria paramétrica.
- **Embedding (representación vectorial):** una representación en vector de un texto, usada para la búsqueda por similitud semántica en la recuperación.
- **Almacén vectorial:** una base de datos optimizada para la búsqueda de vecinos más próximos sobre embeddings.
- **Anclaje (*grounding*):** sostener las afirmaciones generadas en evidencia recuperada y citable.
- **Ingeniería de contexto:** la práctica de decidir con precisión qué información entra en la ventana de contexto en cada paso.

### Planificación

- **Objetivo:** el estado final deseado, con criterios de éxito explícitos.
- **Plan:** un conjunto ordenado o parcialmente ordenado de tareas que se espera que alcancen un objetivo.
- **Descomposición:** partir un objetivo en subtareas (véanse PAT-010 y HRN-009).
- **DAG (grafo acíclico dirigido):** una representación de plan que captura las dependencias entre tareas y expone el paralelismo.
- **Replanificación:** revisar un plan en respuesta a un fallo, a información nueva o a un cambio de restricciones.
- **Criterios de terminación:** los presupuestos y condiciones (pasos, tiempo, coste) que detienen a un agente de forma segura.

### Orquestación

- **Orquestación:** la capa del harness que conduce la ejecución a través de agentes y herramientas (véase HRN-010).
- **Topología:** la disposición de los agentes: único, tubería, supervisor/trabajador o red.
- **Agente supervisor (orquestador):** un agente que planifica y delega en agentes trabajadores (véase PAT-002).
- **Agente trabajador:** un agente especializado que ejecuta una subtarea delegada (véase PAT-005).
- **Enrutado:** seleccionar el siguiente agente, herramienta o rama en función del estado.
- **Traspaso (*handoff*):** transferencia de control y contexto de un agente a otro.
- **Máquina de estados:** un grafo explícito de estados y transiciones gobernadas que controla la ejecución.
- **Ejecución duradera:** semántica de flujo en la que el progreso se persiste en puntos de control y es reanudable ante los fallos.
- **Saga:** una secuencia de operaciones con acciones compensatorias que deshacen el trabajo parcial ante un fallo.

### Gobernanza y seguridad

- **Gobernanza:** la capa de ejecución del harness que aplica política, aprobaciones y guardarraíles (véase HRN-008).
- **Política como código:** reglas de gobernanza expresadas en un formato declarativo, versionado y comprobable.
- **PEP / PDP:** punto de aplicación de política (intercepta las acciones) y punto de decisión de política (evalúa la política).
- **Guardarraíl (*guardrail*):** una comprobación en ejecución sobre entradas o salidas que restringe el comportamiento del agente.
- **Puerta de aprobación:** un control que suspende la ejecución a la espera de una decisión humana o de una autoridad superior (véase PAT-001).
- **Mínimo privilegio:** conceder a cada agente los permisos mínimos que su tarea requiere.
- **Identidad del agente:** un principal distinto, atribuible, con alcance limitado y revocable para cada agente.
- **Inyección de prompt:** contenido no confiable que secuestra las instrucciones u objetivos de un agente.
- **Inyección indirecta de prompt:** inyección entregada a través de datos que el agente recupera.
- **Exfiltración de datos:** salida no autorizada de datos sensibles a través de las salidas del agente o de los argumentos de las herramientas.
- **Trifecta letal:** la combinación peligrosa de acceso a datos privados, exposición a contenido no confiable y capacidad de comunicación externa.
- **Caja de arena (*sandbox*):** un entorno aislado, con recursos y red restringidos, para ejecutar herramientas o código no confiables.
- **DLP (prevención de fuga de datos):** controles que detectan y bloquean datos sensibles en las cargas salientes.

### Observabilidad y evaluación

- **Observabilidad:** la capa del harness que hace inspeccionable el comportamiento del agente mediante trazas, registros y métricas (véase HRN-006).
- **Traza:** el registro de extremo a extremo de una única ejecución del agente.
- **Span:** una unidad de trabajo temporizada dentro de una traza (una llamada a herramienta, una llamada al modelo); el ladrillo básico del trazado distribuido.
- **Evaluación (*eval*):** la medición sistemática de la calidad, la seguridad y la fiabilidad del agente (véase HRN-007).
- **LLM como juez:** usar un modelo para puntuar las salidas de otro modelo contra una rúbrica.
- **Anclaje (*groundedness*):** el grado en que las afirmaciones generadas están sostenidas por la evidencia aportada.
- **Suite de regresión:** un conjunto fijo de casos de evaluación que se ejecuta en cada cambio para cazar caídas de calidad.
- **Desarrollo guiado por evaluación:** construir y modificar agentes contra un harness de evaluación medible.

### Protocolos y estándares

- **MCP (Model Context Protocol):** un protocolo abierto para conectar modelos y agentes con herramientas y fuentes de datos a través de una interfaz estandarizada.
- **Esquema de herramienta:** la declaración tipada del nombre, los argumentos y la descripción de una herramienta, que el modelo usa para invocarla.
- **llms.txt:** una convención propuesta para un fichero Markdown a nivel de sitio que expone un índice de contenido curado y apto para agentes.
- **JSON-LD:** formato de datos estructurados usado para hacer los documentos legibles por máquina en la capa de descubrimiento.
- **NIST AI RMF / ISO 42001 / Reglamento Europeo de IA:** los principales marcos de riesgo, de sistema de gestión y regulatorio que un harness empresarial debe satisfacer (véanse HRN-014 y GOV-001).

## Preguntas frecuentes

**P: ¿De dónde cito una definición?**
R: Cita el término por su nombre junto a `HRN-013`. Cuando el término tenga capítulo propio, es preferible citar ese capítulo para más profundidad.

**P: Falta un término que necesito, ¿qué hago?**
R: Añádelo aquí, en el grupo que corresponda, con una definición nítida de una frase, y enlaza el capítulo dedicado si existe.
