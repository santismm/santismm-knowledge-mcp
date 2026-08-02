---
title: "Evaluación de sistemas agénticos"
summary: "Cómo pasar de «parece que funciona» a calidad medida y protegida frente a regresiones: conjuntos de evaluación, jueces, métricas de tarea y evaluación continua en producción."
---

# Evaluación de sistemas agénticos

## Resumen ejecutivo
La evaluación es el componente del harness que convierte «parece que funciona» en una afirmación medida y defendible. Como los agentes no son deterministas y operan sobre tareas abiertas, no se llega a la confianza a base de aserciones: hay que medir distribuciones de comportamiento contra referencias conocidas y protegerse frente a regresiones. Este capítulo cubre la evaluación fuera de línea y en línea, los conjuntos de referencia, el LLM como juez, las suites de regresión y las métricas de finalización de tarea, y sostiene que la evaluación es la línea que separa el *oficio* de agentes de la *ingeniería* de agentes.

## Conceptos clave
- **Evaluación fuera de línea:** puntuar al agente contra un conjunto de datos fijo antes de desplegar.
- **Evaluación en línea:** puntuar tráfico de producción real (con señales de usuario o jueces en sombra).
- **Conjunto de referencia (golden set):** un conjunto curado de entradas con salidas esperadas conocidas o criterios de aceptación.
- **LLM como juez:** usar un modelo para puntuar salidas contra una rúbrica cuando la coincidencia exacta es imposible.
- **Suite de regresión:** un conjunto de casos que se ejecuta en cada cambio para cazar caídas de calidad.
- **Tasa de finalización de tarea:** la proporción de intentos que alcanzan el objetivo de principio a fin.
- **Evaluación de trayectoria:** puntuar el *camino* que tomó el agente, no solo su respuesta final.

## Definición
La **evaluación de un sistema agéntico** es el subsistema del harness que mide la calidad, la seguridad y la fiabilidad del comportamiento del agente contra criterios definidos —sobre conjuntos curados (fuera de línea) y sobre tráfico real (en línea)— y condiciona los cambios al resultado. Responde a dos preguntas: «¿es suficientemente bueno para salir?» y «¿este cambio lo ha mejorado o empeorado?».

## Explicación detallada

### Por qué evaluar agentes es difícil
Tres propiedades lo hacen más duro que probar software tradicional. Primera, el **no determinismo**: la misma entrada puede dar salidas distintas e incluso *caminos* distintos, así que una única aserción de pasa/falla no significa nada; se miden tasas sobre ejecuciones. Segunda, la **apertura**: existen muchas respuestas correctas, así que la puntuación por coincidencia exacta falla y hace falta juicio por rúbrica o semántico. Tercera, las **trayectorias de varios pasos**: un agente puede llegar a la respuesta correcta por un camino equivocado (inseguro, caro), así que evaluar solo la salida final es insuficiente. El diseño de evaluación es el arte de convertir esas propiedades en señales medibles.

### Evaluación fuera de línea y conjuntos de referencia
La evaluación fuera de línea ejecuta el agente sobre un **conjunto de referencia** —entradas curadas emparejadas con salidas esperadas o criterios de aceptación— antes de que nada salga a producción. El conjunto de referencia es el activo más valioso que produce la evaluación: codifica qué significa «bueno» en tu dominio y se acumula con el tiempo. Constrúyelo a partir de casos reales (anonimizados) de producción, casos de fallo conocidos y casos límite, y *hazlo crecer con cada incidente*: cuando el agente falla en producción, el arreglo no es solo un cambio de código sino un caso de referencia nuevo, para que ese fallo no pueda volver en silencio. Esa es la disciplina de regresión (conocimiento del tipo PAT-015, validación de conocimiento) que hace mejorable el sistema.

### Tipos de evaluador: cada método a su tarea
- **Evaluadores exactos o por reglas** para tareas con salida verificable (un resultado SQL correcto, un esquema JSON válido, un test unitario que pasa). Baratos, deterministas, de fiar: úsalos siempre que puedas.
- **LLM como juez** para salidas abiertas donde la coincidencia exacta falla (resúmenes, explicaciones, planes). Un modelo puntúa contra una rúbrica. Potente pero falible: los jueces tienen sesgos (posición, verbosidad, preferencia por sí mismos), así que calíbralos contra etiquetas humanas, usa rúbricas claras y prefiere la comparación por pares a la puntuación absoluta cuando sea posible. Trata al juez como *un instrumento que a su vez necesita evaluación*.
- **Revisión humana** para los casos de mayor riesgo o más ambiguos, y para calibrar los evaluadores automáticos. Es cara, así que resérvala para los casos que la necesitan y para mantener honestos a los evaluadores baratos.

### Métricas de finalización y de trayectoria
La métrica de cabecera de un agente suele ser la **tasa de finalización de tarea**: de principio a fin, ¿alcanzó el objetivo? Por debajo viven métricas de paso y de trayectoria: ¿eligió herramientas adecuadas, evitó pasos innecesarios, se mantuvo en presupuesto y evitó acciones inseguras por el camino? La evaluación de trayectoria caza a los agentes que aciertan «por las razones equivocadas», que es precisamente el tipo de fragilidad que se rompe ante un cambio de distribución. Empareja la tasa de finalización con el coste por tarea y la tasa de violaciones de seguridad para no optimizar una a costa de las otras.

### Evaluación en línea
La evaluación fuera de línea te habla de tu conjunto de datos; solo la **evaluación en línea** te habla de la realidad. La evaluación en línea puntúa tráfico vivo usando señales implícitas de usuario (aceptación, ediciones, escalados, reintentos), jueces LLM en sombra corriendo sobre trazas de producción (HRN-006) y auditorías humanas periódicas de ejecuciones muestreadas. La evaluación en línea es además la forma de descubrir casos de referencia nuevos: producción es la fuente más rica de los casos límite que le faltan a tu conjunto fuera de línea. El bucle es: observar (HRN-006) → juzgar en línea → cosechar los fallos hacia el conjunto de referencia → proteger con regresión fuera de línea.

### Puertas de regresión: la evaluación como puerta de CI
La disciplina se vuelve ingeniería cuando la evaluación *condiciona los cambios*. Cada edición de prompt, cambio de modelo o cambio de herramienta se ejecuta contra la suite de regresión, y una caída de calidad bloquea el merge, exactamente igual que un test unitario en rojo bloquea el código. Es la forma operativa del principio de evidencia primero (HRN-004): nada sale a producción por intuición. Como la evaluación de agentes se basa en tasas y en parte la juzga un LLM, las puertas usan umbrales y comparación estadística en lugar de un único booleano, pero el principio es idéntico.

## Evidencia de producción
> **Nivel de evidencia:** teórico · **Confianza:** media · **Fuente:** observación de industria
>
> _Escenario ilustrativo y representativo, no un despliegue verificado concreto._

- **Contexto:** equipos que iteran sobre un agente en producción cambiando prompts con frecuencia e intercambiando modelos.
- **Escenario:** sin puerta de evaluación, un cambio de prompt que mejoraba un caso empeoró en silencio varios otros y sacó a producción un agente peor en neto; introducir una suite de regresión sobre conjunto de referencia con LLM como juez más evaluadores por reglas cazó la regresión antes del despliegue.
- **Tecnología:** harness de conjunto de referencia, evaluadores por reglas y LLM como juez, puerta de CI, juez en línea sobre trazas de producción.
- **Carga:** cambios frecuentes contra un conjunto de referencia que va de decenas a miles de casos.
- **Resultados:** la experiencia representativa es que la calidad deja de derivar en cuanto los cambios pasan por la puerta, y que el conjunto de referencia —crecido continuamente a partir de fallos de producción— se convierte en el activo más valioso del equipo.

## Modos de fallo observados
- **Salir a producción por intuición:** cambios evaluados probando a ojo unos pocos prompts, de modo que las regresiones salen sin que nadie se entere.
- **Sobreajuste al conjunto de referencia:** afinar hasta que el conjunto fijo pasa mientras la calidad real se estanca; se mitiga haciendo crecer el conjunto con casos frescos de producción.
- **LLM como juez ingenuo:** confiar en un juez sin calibrar con sesgos conocidos; tratar sus puntuaciones como verdad de campo sin validación humana.
- **Puntuar solo la respuesta final:** se escapan los agentes que llegan a respuestas correctas por caminos inseguros o caros.
- **Sin evaluación en línea:** números fuera de línea excelentes que no sobreviven al contacto con tráfico real y cambiante.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Tasa de finalización de tarea | Dependiente del dominio, con tendencia | Métrica de calidad principal |
| Tasa de aprobación de la suite de regresión | 100 % antes de desplegar | Puerta en cada cambio |
| Concordancia juez–humano | Alta, calibrada | Valida el instrumento «LLM como juez» |
| Tasa de violaciones de seguridad | Cercana a cero | A nivel de trayectoria, no solo de respuesta final |
| Coste por tarea exitosa | Minimizado | Se empareja con la finalización para evitar sobreoptimizar |

## Métricas de coste
La evaluación añade coste en tres sitios: ejecutar el agente sobre el conjunto de referencia (inferencia), la puntuación con LLM como juez (más inferencia) y la revisión humana (trabajo). Se controlan por niveles: primero los evaluadores por reglas, baratos; el juez LLM para el subconjunto abierto; los humanos para calibrar y para los casos de mayor riesgo. El coste se devuelve evitando regresiones, que son mucho más caras una vez desplegadas. Reutilizar las trazas de observabilidad (HRN-006) para reproducción fuera de línea evita volver a ejecutar el modelo donde sea posible.

## Características de escalado
El coste de evaluación escala con tamaño del conjunto × coste del evaluador × frecuencia de cambio. A medida que el conjunto crece, el muestreo y la puntuación por niveles mantienen asequibles las ejecuciones de regresión; los casos más informativos pueden ponderarse o ejecutarse más a menudo. La evaluación en línea escala con el tráfico muestreado y no con todo él. El propio conjunto de referencia escala *hacia arriba* en valor a medida que crece —lo contrario que la mayoría de las curvas de coste— porque cada caso añadido es un modo de fallo protegido para siempre.

## Contenido relacionado
- HRN-006 — Observabilidad para sistemas agénticos
- PAT-009 — (patrón de evaluación / juicio)
- PAT-015 — Validación de conocimiento

## Referencias
- Literatura de práctica sobre evaluación de LLM, calibración del LLM como juez y conjuntos de referencia.
- Observación de industria sobre puertas de regresión para sistemas agénticos, 2023–2026.
- Santa María, S. — Notas de trabajo sobre la disciplina de evaluación de agentes.

## Preguntas frecuentes
**P:** ¿Puedo fiarme sin más de un LLM como juez?
**R:** Úsalo, pero trátalo como un instrumento que a su vez necesita evaluación. Calíbralo contra etiquetas humanas, dale rúbricas explícitas, prefiere la comparación por pares y vigila los sesgos conocidos (posición, verbosidad, preferencia por sí mismo).

**P:** ¿De dónde salen los casos de referencia?
**R:** De tráfico de producción real (anonimizado), de casos de fallo conocidos y de casos límite; y, sobre todo, cada incidente de producción debería añadir un caso de referencia nuevo para que ese fallo no pueda repetirse en silencio.

**P:** Evaluación fuera de línea o en línea, ¿cuál necesito?
**R:** Ambas. La de fuera de línea condiciona los cambios antes de desplegar contra un conjunto conocido; la de en línea te dice qué está pasando de verdad y realimenta casos nuevos hacia el conjunto fuera de línea. Forman un bucle con la observabilidad.
