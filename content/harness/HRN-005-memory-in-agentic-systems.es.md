---
title: "Memoria en sistemas agénticos"
summary: "Qué ve el modelo y qué no: recuperación, compresión de contexto, memoria de trabajo y de largo plazo, y las decisiones de olvido que determinan coste y calidad."
---

# Memoria en sistemas agénticos

## Resumen ejecutivo
La memoria es el componente del harness que decide qué ve el modelo en cada llamada y qué persiste entre llamadas. Como el modelo no tiene estado y su ventana de contexto es un presupuesto duro y caro, la memoria no es una funcionalidad de base de datos añadida al final: es un sistema de curación activo y con criterio. Este capítulo cubre la jerarquía de memoria (de trabajo, de corto plazo, de largo plazo), la ventana de contexto como restricción determinante y las tres operaciones que hacen tratable la memoria a escala: recuperación, compresión y olvido.

## Conceptos clave
- **Memoria de trabajo:** el contexto inmediato sobre el que el modelo está razonando ahora mismo, es decir, el prompt ensamblado del paso actual.
- **Memoria de corto plazo:** el estado acumulado de la tarea o sesión en curso (conversación, resultados intermedios, cuaderno de notas).
- **Memoria de largo plazo:** conocimiento persistente entre sesiones: preferencias de usuario, resultados previos, hechos de la organización.
- **Ventana de contexto:** el presupuesto fijo de tokens de una única llamada al modelo; el recurso más escaso del bucle.
- **Recuperación:** seleccionar los elementos relevantes de un almacén mayor para ponerlos en el contexto.
- **Compresión:** reducir la huella en tokens de una información conservando su contenido útil (resumen, destilado).
- **Olvido:** descartar o restar peso deliberadamente a información para controlar coste, relevancia y obsolescencia.

## Definición
La **memoria en un sistema agéntico** es el subsistema del harness que gestiona el ciclo de vida de la información que el modelo utiliza —su adquisición, almacenamiento, selección hacia el contexto, compresión y eliminación— a lo largo de los horizontes temporales de un paso, de una tarea y de la vida entera del sistema. Su función es poner la información *correcta* en el contexto limitado del modelo en el momento *correcto*, y nada más.

## Explicación detallada

### La ventana de contexto es un presupuesto, no un contenedor
El hecho más importante sobre la memoria es que la ventana de contexto es *finita y cara*, y que la calidad se degrada a medida que se llena. Incluso con ventanas grandes, meterlo todo eleva coste y latencia y diluye la atención del modelo sobre lo que importa (el efecto «perdido en el medio»). La ingeniería de memoria es, por tanto, un problema de *presupuestación*: cada token gastado en historial o contexto recuperado es un token que no se gasta razonando. El harness debe decidir continuamente qué se gana su sitio en la ventana.

### La jerarquía de memoria
- La **memoria de trabajo** es lo que hay en la ventana de contexto para la llamada actual. Se ensambla de nuevo en cada paso a partir de los demás niveles.
- La **memoria de corto plazo** guarda el estado en evolución de la tarea en curso: la conversación hasta el momento, los resultados de herramientas y un cuaderno de razonamiento intermedio. Crece de forma monótona si no se gestiona, y por eso es el objetivo principal de la compresión y el olvido.
- La **memoria de largo plazo** persiste entre tareas y sesiones: almacenes semánticos (a menudo indexados vectorialmente para recuperación por similitud), perfiles y hechos estructurados (clave-valor o relacionales), y registros episódicos de resultados de tareas pasadas de los que el agente puede aprender. La memoria de largo plazo es lo que permite a un agente ser *consistente* entre sesiones y *mejorar* con el tiempo.

### Recuperación: elegir qué sacar a la superficie
La recuperación selecciona elementos relevantes de la memoria de largo plazo (y a veces de la de corto plazo) para inyectarlos en la memoria de trabajo. El enfoque dominante es la similitud semántica sobre embeddings, con frecuencia complementada con búsqueda léxica por palabras clave (recuperación híbrida) y reordenación. La calidad de la recuperación domina la calidad de la respuesta: un contexto irrelevante o ausente no se arregla con un prompt mejor. Entre los refinamientos habituales están la reescritura de consultas, el filtrado por metadatos y la ponderación por recencia o autoridad. Patrones como PAT-006 (recuperación de conocimiento) formalizan estas decisiones.

### Compresión: caber más dentro del presupuesto
Cuando la memoria de corto plazo desborda el presupuesto, el harness la comprime. Las técnicas van desde el truncado simple (descartar los turnos más antiguos) al resumen incremental (sustituir los turnos viejos por un resumen acumulado) y a la compresión jerárquica o semántica (resumir a varias granularidades y conservar punteros al detalle). La compresión es, por definición, con pérdida, así que la pregunta de ingeniería es *qué se puede perder sin riesgo*, y eso depende de la tarea. Un agente de programación debe conservar los identificadores exactos; un agente de soporte puede resumir la charla intrascendente con agresividad.

### Olvido: deliberado, no accidental
El olvido es un control activo, no un fallo. El harness debe descartar información obsoleta (un dato que ha cambiado), irrelevante (contexto fuera de tema) o fuera de presupuesto (desalojo bajo presión). Sin olvido explícito, la memoria de largo plazo acumula contradicciones y ruido, y la de corto plazo se desborda. Las buenas políticas de olvido restan peso por recencia y relevancia, caducan los hechos de volatilidad conocida y resuelven conflictos (gana el valor autorizado más reciente). El olvido es además una superficie de *gobernanza*: los requisitos de retención de datos y de derecho al olvido viven aquí.

### Escritura y consolidación de memoria
Para cerrar el bucle, el harness decide qué *escribir de vuelta* a memoria tras un paso o una tarea: extraer hechos duraderos, resumir el episodio, actualizar el perfil de usuario. Ese paso de consolidación —análogo a pasar la memoria de trabajo al almacenamiento de largo plazo— es lo que convierte un modelo sin estado en un sistema que acumula conocimiento. Hecho sin cuidado, es también la forma en que un agente envenena su propio contexto futuro con un «hecho» alucinado, y por eso las escrituras deben validarse como cualquier otra actuación.

### La memoria como superficie de ataque
Todo lo que se escribe en memoria y luego se lee hacia el contexto es un vector de inyección de prompts. Los documentos recuperados y los «hechos» almacenados pueden llevar instrucciones adversarias. La memoria interseca por tanto directamente con la seguridad (HRN-011): trata el contenido recuperado y recordado como entrada no confiable, no como prompt de sistema de confianza.

## Evidencia de producción
> **Nivel de evidencia:** teórico · **Confianza:** media · **Fuente:** observación de industria
>
> _Escenario ilustrativo y representativo, no un despliegue verificado concreto._

- **Contexto:** agentes asistentes empresariales de larga duración (soporte, investigación, programación) operando en sesiones de muchos turnos.
- **Escenario:** la acumulación ingenua del historial completo de conversación en la ventana de contexto dispara coste y latencia y hunde la calidad de respuesta a medida que la sesión se alarga; introducir resumen incremental más recuperación híbrida restaura la calidad a una fracción del coste en tokens.
- **Tecnología:** LLM frontera, almacén vectorial, recuperador híbrido con reordenación, modelo de resumen para la compresión.
- **Carga:** sesiones que van de unos pocos turnos a cientos, con almacenes de largo plazo de miles a millones de elementos.
- **Resultados:** la experiencia representativa es una reducción sustancial de tokens por turno y una mayor consistencia de la tarea en cuanto la memoria se gestiona activamente en lugar de acumularse de forma pasiva.

## Modos de fallo observados
- **Desbordamiento de contexto:** una memoria de corto plazo sin gestionar excede la ventana y trunca precisamente la información que importaba.
- **Perdido en el medio:** un contexto sobrecargado degrada la atención al contenido central del prompt; más contexto produce peores respuestas.
- **Fallo de recuperación:** el documento relevante nunca aflora y el modelo responde con seguridad desde un hueco.
- **Memoria obsoleta o contradictoria:** el almacén de largo plazo guarda hechos caducados o en conflicto y el agente actúa sobre el equivocado.
- **Envenenamiento de memoria:** un «hecho» alucinado o adversario se escribe de vuelta y contamina el razonamiento futuro.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Precisión / exhaustividad de recuperación | Dependiente del dominio, medida | Calidad de los elementos llevados al contexto |
| Utilización del contexto | Por debajo de la ventana, con margen | Tokens usados frente al presupuesto por llamada |
| Tokens por turno | Minimizados a calidad constante | Motor directo de coste |
| Anclaje de la respuesta | Alto | Proporción de afirmaciones sostenidas por el contexto recuperado |

## Métricas de coste
La memoria es una palanca de coste de primer orden. Los tokens colocados en contexto se pagan en cada llamada, de modo que la compresión y una recuperación precisa reducen directamente el gasto de inferencia. La memoria de largo plazo añade coste de almacenamiento e indexación por embeddings, y la compresión añade llamadas a un modelo de resumen. El balance es casi siempre favorable: la gestión activa de memoria cambia resumen e indexación baratos por lotes por tokens de contexto caros por llamada.

## Características de escalado
La memoria escala en dos ejes: longitud de sesión (que gobierna la memoria de corto plazo y la frecuencia de compresión) y tamaño del corpus (que gobierna el almacén de largo plazo y la latencia de recuperación). La latencia y la calidad de recuperación son los cuellos de botella habituales a medida que crece el almacén de largo plazo; el particionado, el filtrado y la reordenación se vuelven necesarios. Y lo esencial: una memoria bien gestionada mantiene *plano* el coste por llamada aunque la sesión se alargue, mientras que la acumulación ingenua lo hace crecer sin límite.

## Contenido relacionado
- HRN-003 — La taxonomía del harness
- PAT-004 — (patrón de memoria / contexto)
- PAT-006 — (patrón de recuperación de conocimiento)

## Referencias
- Investigación sobre los efectos de la longitud de contexto en los LLM («perdido en el medio»).
- Literatura de práctica sobre RAG, recuperación híbrida y reordenación.
- Santa María, S. — Notas de trabajo sobre arquitectura de memoria de agentes.

## Preguntas frecuentes
**P:** Con ventanas de contexto de un millón de tokens, ¿no queda obsoleta la ingeniería de memoria?
**R:** No. Las ventanas mayores elevan el presupuesto, pero no lo eliminan: el coste, la latencia y la dilución de atención siguen escalando con lo que metes. Las ventanas grandes hacen la ingeniería de memoria *más* valiosa, no menos, porque la tentación de sobrecargar es mayor.

**P:** ¿La memoria no es simplemente RAG?
**R:** La recuperación (RAG) es una operación dentro de la memoria. La memoria cubre además el estado de trabajo y de corto plazo, la compresión, el olvido y la consolidación por escritura. RAG sin todo eso está incompleto.

**P:** ¿Debe decidir el modelo qué recordar?
**R:** En parte. El modelo puede proponer qué consolidar, pero el harness debe validar y gobernar las escrituras: las autoescrituras sin validar son la forma en que los agentes envenenan su propia memoria.
