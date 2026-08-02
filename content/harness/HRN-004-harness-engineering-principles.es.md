---
title: "Principios de Ingeniería de Harness"
summary: "Los principios de ingeniería que se sostienen en todos los componentes del harness: frontera de determinismo, autoridad acotada, degradación elegante y medición antes que optimización."
---

# Principios de Ingeniería de Harness

## Resumen ejecutivo
Los componentes responden a *qué* contiene un harness; los principios responden a *cómo* construir bien cada uno. Este capítulo enuncia los principios de ingeniería transversales de la Ingeniería de Harness: las reglas que valen tanto si diseñas memoria, como orquestación, como el contrato de una herramienta. Son deliberadamente opinables: un principio que se dobla ante cualquier situación no es un principio.

## Conceptos clave
- **Principio:** una regla de diseño duradera que guía decisiones en todos los componentes.
- **Frontera de determinismo:** la línea explícita entre lo que decide el modelo y lo que decide el código.
- **Evidencia primero:** ninguna afirmación de calidad sin medición.
- **Defensa en profundidad:** varias capas independientes para que ningún fallo aislado sea catastrófico.
- **Mínima autoridad:** cada componente recibe el permiso mínimo necesario.
- **Degradación elegante:** el sistema cae a un modo seguro y reducido en lugar de derrumbarse.

## Definición
Los **principios de Ingeniería de Harness** son un conjunto de reglas de diseño transversales que gobiernan cómo se construyen y componen los componentes de un harness para que el sistema agéntico resultante sea fiable, observable, gobernable y seguro. Son el equivalente en esta disciplina a los principios SOLID o a la aplicación de doce factores: no un marco de trabajo, sino una postura.

## Explicación detallada

### 1. Fiabilidad por encima de capacidad
El harness optimiza el *suelo* del comportamiento, no el techo. Un sistema brillante el 95 % del tiempo y catastrófico el 5 % restante es, en una empresa, un pasivo: ese 5 % es lo que sale en la prensa y en la auditoría. Prefiere un alcance más estrecho ejecutado con fiabilidad a uno amplio ejecutado de forma errática. La capacidad la aporta el modelo; la fiabilidad la aporta el harness, y es la que la empresa está pagando.

### 2. Fronteras de determinismo
Decide explícitamente qué puede decidir el modelo. Todo lo que *pueda* ser determinista *debe* serlo: validación de esquemas, enrutado, comprobación de permisos, reintentos y postcondiciones van en código, no en un prompt. El modelo se reserva para el razonamiento genuinamente abierto que solo él puede hacer. Trazar esta frontera con firmeza es la decisión de mayor apalancamiento en el diseño de un harness: encoge la superficie sobre la que el no determinismo puede hacer daño.

### 3. Observabilidad primero
Instrumenta antes de optimizar. No puedes depurar, evaluar ni confiar en un sistema no determinista de varios pasos que no puedes ver. Cada llamada al modelo, cada invocación de herramienta y cada decisión deben ser un span estructurado, trazable y reproducible *antes* de dar la funcionalidad por terminada (HRN-006). La observabilidad no es un añadido de segunda fase: es precondición de todos los demás principios, porque todos dependen de la medición.

### 4. Evidencia primero
Ninguna afirmación de calidad se despliega sin medición. «Parece mejor» no es una afirmación de ingeniería. Los cambios pasan por evaluación contra conjuntos dorados y suites de regresión (HRN-007), y toda afirmación con consecuencias lleva su procedencia (el modelo de evidencia que usa esta misma base de conocimiento). La evidencia primero es lo que convierte el desarrollo de agentes de artesanía en ingeniería.

### 5. Defensa en profundidad
Asume que cualquier capa aislada fallará —el modelo alucinará, una herramienta devolverá basura, un usuario inyectará un prompt malicioso— y garantiza que ningún fallo suelto sea catastrófico. Superpón controles independientes: validación de entrada *y* de salida *y* puertas de permiso *y* monitorización. El modelo es un componente no confiable: trata su salida como tratarías una entrada de usuario sin validar (HRN-011).

### 6. Mínima autoridad
Cada componente y cada herramienta recibe la autoridad mínima que su trabajo exige, y ni una más. Solo lectura por defecto; acceso de escritura acotado y con puerta; acciones destructivas tras aprobación humana (controles de la clase PAT-001). El radio de daño de un agente comprometido o confundido está acotado por la autoridad que le concediste: concede poca.

### 7. Degradación elegante
Cuando algo falla, falla *hacia* un modo seguro y reducido —escala a un humano, devuelve una respuesta conservadora o declina— en lugar de romperse o, peor, tomar con confianza una acción equivocada. El harness debe tener comportamiento bien definido para el bloqueo, el agotamiento de presupuesto, la caída de una herramienta y la baja confianza. Un sistema que no sabe rendirse con seguridad no está listo para producción.

### 8. Actuación idempotente y reversible
Como el bucle es estocástico y puede reintentar, las acciones sobre el mundo deben ser idempotentes cuando sea posible y reversibles cuando no. Una llamada reintentada no puede cobrar dos veces a un cliente; una escritura debe poder repetirse sin daño; las acciones de alto impacto deben ser preparadas, confirmables y revertibles. Este principio es lo que hace seguros los reintentos, que son imprescindibles para la fiabilidad.

### Tensiones entre principios
Los principios no siempre van alineados. La fiabilidad por encima de capacidad limita lo que el modelo puede intentar; la observabilidad primero añade latencia y coste; la mínima autoridad frena el desarrollo. La buena ingeniería de harness es el arte de resolver esas tensiones *deliberadamente* y documentar el compromiso, en lugar de dejar que un principio gane en silencio. El metaprincipio: **haz el compromiso explícito y medible.**

| Principio | Riesgo que mitiga | Coste que impone |
|-----------|-------------------|------------------|
| Fiabilidad sobre capacidad | Comportamiento catastrófico de cola | Alcance reducido |
| Fronteras de determinismo | No determinismo sin límites | Esfuerzo de diseño inicial |
| Observabilidad primero | Ejecuciones indepurables | Almacenamiento, latencia |
| Evidencia primero | Regresiones silenciosas | Infraestructura de evaluación |
| Defensa en profundidad | Catástrofe por punto único | Controles redundantes |
| Mínima autoridad | Radio de daño amplio | Iteración más lenta |
| Degradación elegante | Acciones erróneas con confianza | Caminos de reserva adicionales |
| Actuación idempotente | Reintentos dañinos | Complejidad al diseñar acciones |

## Modos de fallo observados
- **Teatro de principios:** citarlos en un documento de diseño sin exigirlos en el código ni en CI.
- **Persecución de capacidades:** dejar que una capacidad llamativa del modelo amplíe el alcance más allá de lo que el harness puede controlar con fiabilidad.
- **Optimizar lo invisible:** ajustar prompts y cadenas antes de que exista observabilidad, de modo que las «mejoras» no están medidas.
- **Fallo de todo o nada:** sin modo degradado, la caída de un solo componente tumba el sistema entero o produce un error dicho con seguridad.

## Métricas de coste
Los principios cambian coste marginal por petición (instrumentación, validación, comprobaciones redundantes) por reducciones grandes del coste del fallo (incidentes, retrabajo, hallazgos de auditoría, daño reputacional). El encuadre económicamente correcto es el *coste esperado incluyendo eventos de cola*, donde los principios se pagan solos de forma sistemática.

## Características de escalado
Los principios componen a escala. Las fronteras de determinismo y la mínima autoridad acotan la superficie de fallo a medida que crecen los pasos y la concurrencia; observabilidad y evidencia primero mantienen depurable y protegido de regresiones un sistema que crece. Los sistemas construidos sin los principios tienden a degradarse de forma superlineal al escalar, porque cada capacidad nueva añade superficie sin límites, sin medir y con exceso de privilegios.

## Contenido relacionado
- HRN-001 — Ingeniería de Harness: definición y panorama
- HRN-003 — La taxonomía del harness

## Referencias
- Analogía con principios de software establecidos (SOLID, doce factores, defensa en profundidad) adaptados a sistemas agénticos.
- Observación de industria sobre prácticas de fiabilidad en sistemas agénticos, 2023–2026.
- Santa María, S. — Notas de trabajo sobre principios de diseño de harness.

## Preguntas frecuentes
**P:** ¿Qué principio importa más?
**R:** La observabilidad primero es la puerta de entrada práctica, porque todos los demás dependen de la medición. Las fronteras de determinismo son la decisión de diseño con más apalancamiento. Se refuerzan mutuamente.

**P:** ¿No son simplemente principios generales de ingeniería del software?
**R:** Varios están adaptados de la ingeniería clásica, y es intencionado: los sistemas agénticos siguen siendo software. Pero la frontera de determinismo, medir con evidencia un sistema estocástico y tratar al modelo como entrada no confiable son específicos del harness.

**P:** ¿Cómo se exigen los principios, en vez de solo enunciarlos?
**R:** Codifícalos en CI y en tiempo de ejecución: validación de esquemas como código, puertas de evaluación al fusionar, comprobación de permisos en la frontera de la herramienta y trazado obligatorio. Un principio que no se exige es un deseo.
