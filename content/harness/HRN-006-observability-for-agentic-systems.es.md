---
title: "Observabilidad para sistemas agénticos"
summary: "Convertir cada paso del agente en una traza reproducible: spans, atribución de coste, depuración de bucles no deterministas y las señales que hacen medible la fiabilidad."
---

# Observabilidad para sistemas agénticos

## Resumen ejecutivo
La observabilidad es el componente del harness que convierte una ejecución de agente opaca y no determinista en un artefacto inspeccionable y reproducible. No se puede depurar, evaluar, gobernar ni confiar en un sistema estocástico de varios pasos que no se ve, y por eso la observabilidad es una precondición de casi cualquier otra capacidad del harness, no un añadido de segunda fase. Este capítulo cubre trazas y spans adaptados a agentes, la contabilidad de tokens y coste como telemetría de primera clase, los ganchos de evaluación y la reproducción determinista.

## Conceptos clave
- **Traza:** el registro completo de una única ejecución del agente, de principio a fin, del objetivo al resultado.
- **Span:** una unidad de trabajo dentro de una traza (una llamada al modelo, una invocación de herramienta, una recuperación, una decisión) con entradas, salidas, tiempos y metadatos.
- **Contabilidad de tokens y coste:** seguimiento por span y por traza de los tokens de entrada y salida y del coste resultante.
- **Gancho de evaluación:** un punto de instrumentación donde la lógica de evaluación puede puntuar un span o una traza, en línea o fuera de línea.
- **Reproducción (replay):** volver a ejecutar de forma determinista una traza grabada para reproducir y depurar el comportamiento.
- **Cardinalidad:** la dimensionalidad de las etiquetas de telemetría; una cardinalidad alta ayuda al análisis pero eleva el coste de almacenamiento.

## Definición
La **observabilidad para sistemas agénticos** es el subsistema del harness que captura, estructura y almacena un registro completo y consultable de cada ejecución del agente —sus spans, entradas, salidas, llamadas al modelo, llamadas a herramientas, costes y decisiones— de modo que cualquier ejecución pueda entenderse a posteriori, compararse entre versiones, puntuarse mediante evaluación y reproducirse de forma determinista. Responde a la pregunta «¿qué pasó exactamente, y por qué?».

## Explicación detallada

### Por qué la observabilidad clásica no basta
El APM tradicional asume servicios deterministas: una petición, unas cuantas llamadas síncronas, una respuesta. Los sistemas agénticos rompen esas premisas. Una misma ejecución puede tomar *un camino distinto cada vez*, abrirse en abanico sobre muchas llamadas a modelo y a herramientas, iterar un número desconocido de veces y producir entradas y salidas *en lenguaje natural* que las métricas ordinarias no saben resumir. La observabilidad para agentes debe capturar por tanto no solo latencia y errores, sino el *contenido semántico* de cada paso: el prompt enviado, la respuesta devuelta, los argumentos elegidos para la herramienta, el razonamiento. Sin ese contenido, una traza te dice *que* el agente falló pero nunca *por qué*.

### Trazas y spans, adaptados a agentes
El modelo de traza y span del trazado distribuido es la columna vertebral correcta, con tipos de span específicos de agentes:
- Los **spans de llamada al modelo** registran el prompt ensamblado (o una referencia a él), la respuesta, el modelo y sus parámetros, los recuentos de tokens y la latencia.
- Los **spans de llamada a herramienta** registran la herramienta, los argumentos (ya validados), el resultado o el error, y los reintentos.
- Los **spans de recuperación** registran la consulta, los elementos devueltos y sus puntuaciones: imprescindible para diagnosticar fallos de memoria.
- Los **spans de decisión o plan** registran la elección de la siguiente acción por parte del agente y, cuando existe, su justificación.

Los spans se anidan hasta formar el árbol causal completo de una ejecución. Cuanto más rico sea el contenido capturado, más depurable es el sistema, a costa de almacenamiento y de exposición de datos, que deben gestionarse (redacción, muestreo, retención).

### La contabilidad de tokens y coste como telemetría de primera clase
En los sistemas agénticos el *coste es un comportamiento*, no solo una factura. Una regresión que provoca un bucle de razonamiento de más o un contexto inflado se manifiesta primero como un pico de tokens. La observabilidad debe tratar por tanto los recuentos de tokens y el coste derivado como métricas de primera clase, atribuidos por span, por traza, por usuario y por versión del agente. Eso hace detectables las regresiones de coste, alertables los bucles desbocados y medible la economía por tarea, cerrando el círculo con la disciplina de métricas de coste que recorre todo el manual.

### Ganchos de evaluación
Observabilidad y evaluación (HRN-007) son codependientes. La evaluación necesita las trazas; la observabilidad rinde más cuando sus datos alimentan la puntuación. El harness debe exponer *ganchos de evaluación*: puntos de instrumentación donde un evaluador (una regla, un clasificador o un LLM como juez) puede engancharse a un span o a una traza, ya sea *en línea* (puntuando tráfico vivo para monitorización) o *fuera de línea* (reproduciendo trazas almacenadas contra un modelo o un prompt nuevos). Diseñar esos ganchos dentro del formato de traza desde el primer día es lo que abarata la evaluación continua más adelante.

### Reproducción determinista
La capacidad más potente y específica de los agentes es la reproducción: volver a ejecutar una traza grabada para reproducir su comportamiento. Como el modelo no es determinista, una reproducción de verdad exige capturar lo suficiente para *fijar* la ejecución: salidas del modelo grabadas (para reproducir sin volver a llamarlo), resultados de herramientas, contexto recuperado y semillas aleatorias cuando aplique. La reproducción habilita tres cosas de otro modo casi imposibles: reproducir localmente un fallo de producción, someter a prueba de regresión un cambio de prompt o de modelo contra tráfico histórico real, y comparar en A/B dos versiones del harness sobre entradas idénticas. Un harness sin reproducción depura a base de conjeturas.

### Privacidad, redacción y retención
Capturar prompts y respuestas completas significa capturar datos potencialmente sensibles. La observabilidad debe integrar redacción (limpieza de datos personales), controles de acceso sobre el almacén de trazas y políticas de retención: son preocupaciones de gobernanza (HRN-008) y de seguridad (HRN-011) que la capa de observabilidad aplica en la práctica.

## Evidencia de producción
> **Nivel de evidencia:** teórico · **Confianza:** media · **Fuente:** observación de industria
>
> _Escenario ilustrativo y representativo, no un despliegue verificado concreto._

- **Contexto:** equipos que operan agentes de varios pasos en producción y que salieron a producción con poco más que logging básico.
- **Escenario:** un fallo intermitente (el agente toma de vez en cuando una acción equivocada) resulta indiagnosticable desde los logs; tras añadir captura completa de trazas y spans con reproducción, la ejecución fallida se reproduce en local y se rastrea hasta un fallo de recuperación que había alimentado al modelo con un documento engañoso.
- **Tecnología:** backend de trazado con tipos de span conscientes del agente, almacén de trazas, utillaje de reproducción, telemetría de tokens y coste.
- **Carga:** tráfico de producción con fallos de cola larga, difíciles de reproducir.
- **Resultados:** la experiencia representativa es que el tiempo medio hasta el diagnóstico cae drásticamente en cuanto las ejecuciones están trazadas por completo y son reproducibles, y que las regresiones de coste se vuelven visibles en el mismo momento en que ocurren.

## Modos de fallo observados
- **Logs sin estructura:** texto libre que registra *que* algo pasó pero no el árbol de spans, las entradas y las salidas necesarias para entenderlo.
- **Sin captura de contenido:** capturar latencia y errores pero no prompts ni respuestas, dejando los fallos indiagnosticables.
- **Cardinalidad y almacenamiento sin límite:** capturarlo todo a máxima fidelidad en cada ejecución, disparando el coste de almacenamiento; hacen falta muestreo y política de retención.
- **Sin reproducción:** incapacidad de reproducir fallos no deterministas, lo que fuerza a depurar por conjeturas.
- **Fuga de privacidad:** capturar contenido sensible de prompts sin redacción ni control de acceso.

## KPIs
| Métrica | Objetivo | Notas |
|---------|----------|-------|
| Cobertura de trazado | ~100 % de las ejecuciones | Cada ejecución de producción produce una traza |
| Tiempo medio hasta el diagnóstico | Minimizado | Del aviso de fallo a la causa raíz vía trazas y reproducción |
| Cobertura de atribución de coste | Por span / traza / versión | Permite detectar regresiones de coste |
| Fidelidad de reproducción | Alta | Proporción de trazas grabadas que se reproducen de forma determinista |

## Métricas de coste
La observabilidad añade coste de almacenamiento (proporcional a trazas × spans × contenido capturado) y una pequeña sobrecarga de ejecución por span. El muestreo, la redacción, la retención por niveles y el guardar referencias en lugar de cargas grandes lo mantienen a raya. El coste se devuelve con creces por la resolución más rápida de incidentes y por *hacer observable el propio token y su coste*, lo que suele sacar a la luz ahorros de inferencia que empequeñecen el gasto en observabilidad.

## Características de escalado
El volumen de trazas escala con tráfico × pasos por ejecución, así que los flujos agénticos profundos generan desproporcionadamente más telemetría que los servicios planos. El almacenamiento y el coste de consulta son los cuellos de botella; el muestreo por cabecera y por cola, la agregación y los niveles de retención lo mantienen acotado. El almacenamiento para reproducción escala con la fidelidad capturada, cambiando almacenamiento por reproducibilidad.

## Contenido relacionado
- HRN-003 — La taxonomía del harness
- HRN-007 — Evaluación de sistemas agénticos

## Referencias
- Conceptos de trazado distribuido (spans, trazas) adaptados a cargas agénticas.
- Literatura de práctica sobre observabilidad y utillaje de trazado para LLM.
- Santa María, S. — Notas de trabajo sobre observabilidad y reproducción de agentes.

## Preguntas frecuentes
**P:** ¿No basta con los logs?
**R:** No. Los logs sin estructura no permiten reconstruir el árbol causal de spans de una ejecución ramificada de varios pasos, y rara vez capturan el contenido semántico (prompts, respuestas, contexto recuperado) que hace falta para explicar un fallo. Se necesitan trazas estructuradas con reproducción.

**P:** ¿Por qué medir el coste en la capa de observabilidad?
**R:** Porque en los sistemas agénticos el coste es un *comportamiento*: los bucles de más y el contexto inflado aparecen como picos de tokens antes que en ningún otro sitio. La telemetría de coste es como se cazan esas regresiones.

**P:** ¿Cuál es la capacidad más valiosa de todas?
**R:** La reproducción determinista. Convierte «no somos capaces de reproducirlo» en una sesión de depuración local rutinaria y permite someter los cambios a prueba de regresión contra tráfico histórico real.
