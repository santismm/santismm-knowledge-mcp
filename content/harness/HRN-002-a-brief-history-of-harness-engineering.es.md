---
title: "Breve historia de la Ingeniería de Harness"
summary: "Cómo la industria pasó de la ingeniería de prompts a los sistemas agénticos, y por qué el andamiaje alrededor del modelo acabó siendo la disciplina que decide la fiabilidad."
---

# Breve historia de la Ingeniería de Harness

## Resumen ejecutivo
La Ingeniería de Harness no apareció ya formada. Emergió a lo largo de cuatro eras que se solapan: ingeniería de prompts, uso de herramientas, agentes y, por fin, harnesses. Cada era resolvió un problema y dejó al descubierto el siguiente. Este capítulo recorre ese arco, nombra los puntos de inflexión y explica por qué la acumulación de esas lecciones cristalizó en una disciplina cuya unidad de trabajo es el sistema entero, no el prompt.

## Conceptos clave
- **Ingeniería de prompts:** dar forma a una única interacción con el modelo mediante instrucciones, ejemplos y formato.
- **Uso de herramientas (function calling):** dotar al modelo de la capacidad de emitir llamadas estructuradas a funciones externas.
- **Agente:** un modelo que ejecuta un bucle de percibir, razonar y actuar hacia un objetivo, con memoria y herramientas.
- **Harness:** el andamiaje de ingeniería completo alrededor del modelo que hace fiable al sistema agéntico.
- **Punto de inflexión:** el momento en que una abstracción anterior deja de escalar y obliga a añadir una capa nueva.

## Definición
La **historia de la Ingeniería de Harness** es la progresión por la que el foco del esfuerzo de ingeniería se desplazó hacia fuera: del prompt a la interacción con el modelo, luego al bucle y finalmente al sistema entero que rodea al modelo, hasta reconocer que construir ese sistema es una disciplina por derecho propio.

## Explicación detallada

### Era 1 — Ingeniería de prompts (la interacción única)
La primera ola trató al modelo como un oráculo: redacta el prompt correcto y lee la respuesta. Las técnicas se acumularon deprisa: instrucciones, ejemplos few-shot, encuadre de rol, cadena de pensamiento y formatos de salida rígidos. La ingeniería de prompts era real y útil, pero optimizaba *una sola* llamada al modelo. Su techo llegaba en el momento en que una tarea exigía que el modelo *hiciera* algo en el mundo, o que recordara cualquier cosa más allá de la ventana de contexto. La lección: un prompt mejor no convierte a un oráculo sin estado en un sistema.

### Era 2 — Uso de herramientas (el modelo actúa y recupera)
La segunda ola le dio manos al modelo. El function calling permitió al modelo emitir peticiones estructuradas que el código circundante ejecutaba: búsqueda, calculadoras, consultas a bases de datos, llamadas a API. La generación aumentada por recuperación (RAG) atacó el problema del conocimiento trayendo el contexto relevante en tiempo de consulta en lugar de confiar en que estuviera memorizado. Fue un cambio arquitectónico genuino: ahora había *código alrededor del modelo* que importaba. Pero seguía siendo en gran medida un solo salto: llamar al modelo, ejecutar una herramienta, devolver el resultado. Los problemas de fiabilidad aparecieron de inmediato: las herramientas fallan, devuelven datos mal formados, expiran o se invocan con argumentos alucinados. La lección: en cuanto el modelo toca sistemas reales hacen falta contratos, validación y gestión de fallos —ingeniería, no prompting—.

### Era 3 — Agentes (el bucle)
La tercera ola cerró el bucle. En vez de un salto, el modelo iteraba: observar resultados, razonar, volver a actuar, hasta cumplir el objetivo. Aparecieron patrones como los bucles de razonar-y-actuar, los planificadores con herramientas y las descomposiciones multiagente, empaquetados en frameworks populares. Los agentes ya podían reservar un viaje, refactorizar código o triar un ticket a lo largo de muchos pasos. Y aquí afloraron a escala los modos de fallo *de verdad*: bucles que no terminan, errores que se componen cuando un paso malo envenena el resto, coste desbocado, ventanas de contexto desbordadas de historial acumulado, y la imposibilidad de depurar a posteriori una ejecución no determinista de varios pasos. Los frameworks de agentes hicieron el bucle fácil de *escribir* y casi imposible de *operar con fiabilidad*. La lección: un bucle sin disciplina de memoria, observabilidad, evaluación y autoridad acotada es un pasivo, no un producto.

### Era 4 — Harnesses (el sistema)
La cuarta ola —donde vive hoy la disciplina— es el reconocimiento de que todo lo que rodea al modelo *es el problema de ingeniería*. Los equipos que llevaban agentes a producción empresarial descubrieron que dedicaban casi todo su esfuerzo no al modelo, ni siquiera al bucle del agente, sino a:

- La **memoria** que decide qué ve el modelo y qué olvida (HRN-005);
- La **observabilidad** que convierte una ejecución opaca en trazas reproducibles (HRN-006);
- La **evaluación** que transforma «parece que va bien» en calidad medida y protegida frente a regresiones (HRN-007);
- La **gobernanza** que aplica política y aprobación humana como código;
- La **seguridad** que trata al modelo como un componente no confiable e inyectable por prompt;
- La **orquestación** que acota el bucle, enruta el trabajo y degrada con elegancia.

Ese conjunto es el harness. Ponerle nombre importó: reencuadró «he construido un agente» (una demo) como «he construido un harness» (un sistema que puedes poner delante de clientes y auditores). HRN-003 formaliza los componentes como taxonomía.

### Por qué cambiaron los nombres
Cada renombrado reflejó una ampliación de la unidad de responsabilidad. Prompt → la llamada. Uso de herramientas → la llamada más sus acciones. Agente → el bucle. Harness → el sistema, incluidas las partes que ninguna demo enseña: qué pasa a las tres de la madrugada bajo carga, bajo ataque, bajo auditoría. La historia es, en esencia, la constatación progresiva de que la parte difícil nunca fue el modelo.

## Evidencia de producción
> **Nivel de evidencia:** teórico · **Confianza:** media · **Fuente:** observación de industria
>
> _Relato ilustrativo y representativo, no un despliegue verificado concreto._

- **Contexto:** equipos empresariales que adoptan agentes LLM entre 2023 y 2026.
- **Escenario:** un equipo entrega una demo de agente impresionante y luego dedica los dos trimestres siguientes no a mejorar el modelo, sino a construir gestión de memoria, trazado, arneses de evaluación, puertas de aprobación y defensas contra inyección de prompts para que sea seguro en producción.
- **Tecnología:** LLM frontera, API de function calling, almacenes vectoriales, frameworks de agentes, backends de trazado.
- **Carga:** de un puñado de ejecuciones de demo a tráfico sostenido de producción con usuarios adversarios.
- **Resultados:** la experiencia representativa es que el harness, y no el modelo, consume la mayor parte del esfuerzo de ingeniería y es lo que en última instancia condiciona el lanzamiento a producción.

## Modos de fallo observados
- **Equivocarse de era:** tratar un problema de uso de herramientas como un problema de prompt, o un problema de agente como uno de herramientas: aplicar la abstracción de ayer al fallo de hoy.
- **El framework como estrategia:** dar por hecho que un framework de agentes *es* el harness; los frameworks aportan el bucle, no la observabilidad, la evaluación, la gobernanza ni la seguridad.
- **Saltar directamente a multiagente:** recurrir a enjambres de agentes elaborados antes de que el harness de un solo agente sea fiable, multiplicando la superficie de fallo.

## Características de escalado
Cada era empujó el cuello de botella de fiabilidad más hacia fuera. A medida que los sistemas escalaron en pasos y herramientas, la restricción determinante pasó de «¿es bueno el prompt?» a «¿termina el bucle, se mantiene en presupuesto y sigue siendo auditable?», que es precisamente el dominio del harness.

## Contenido relacionado
- HRN-001 — Ingeniería de Harness: definición y panorama
- HRN-003 — La taxonomía del harness

## Referencias
- Observación de industria sobre la evolución de los patrones de aplicación de LLM, 2020–2026.
- Literatura de práctica sobre RAG, function calling y bucles de agentes.
- Santa María, S. — Notas de trabajo sobre la aparición de la Ingeniería de Harness.

## Preguntas frecuentes
**P:** ¿Algún producto o artículo inventó la Ingeniería de Harness?
**R:** No. Surgió de la experiencia convergente de muchos equipos que chocaron con el mismo muro: los agentes son fáciles de demostrar y difíciles de operar. La disciplina es un nombre para las lecciones, no un artefacto concreto.

**P:** ¿Están obsoletas las eras anteriores?
**R:** No: quedan subsumidas. El prompting, el uso de herramientas y los bucles de agentes son componentes dentro de un harness moderno. El harness añade las capas que los hacen de fiar.

**P:** ¿Qué viene después de los harnesses?
**R:** Probablemente estandarización y madurez de utillaje —plataformas de harness compartidas, estándares interoperables de observabilidad y evaluación, y gobernanza integrada en los runtimes— más que un paradigma enteramente nuevo. La unidad de responsabilidad (el sistema) ya es estable.
