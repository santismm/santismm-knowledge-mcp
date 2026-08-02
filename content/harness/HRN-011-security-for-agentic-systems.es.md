---
title: "Seguridad para sistemas agénticos"
summary: "Tratar al modelo como componente no confiable y manipulable: inyección de prompts, exfiltración por herramientas, límites de autoridad y defensa en profundidad del harness."
---

# Seguridad para sistemas agénticos

## Resumen ejecutivo

Los sistemas agénticos amplían la superficie de ataque de una forma que las aplicaciones tradicionales no conocen: el agente lee datos no confiables, toma decisiones con consecuencias y posee privilegios para actuar, de modo que una sola entrada comprometida puede convertirse en una acción comprometida. La seguridad para sistemas agénticos es la capa del harness que asume que el modelo puede ser manipulado —y lo será— y construye el andamiaje circundante para que esa manipulación no pueda causar daño. El principio rector es **mínimo privilegio con radio de impacto acotado**: tratar al modelo como componente no confiable, situar los controles de seguridad *fuera* de su superficie persuadible y garantizar que incluso un agente completamente secuestrado solo pueda hacer un daño acotado y auditable.

## Conceptos clave

- **Inyección de prompt:** contenido no confiable que secuestra las instrucciones u objetivos del agente.
- **Inyección indirecta de prompt:** inyección entregada a través de datos que el agente recupera (documentos, páginas web, salidas de herramientas).
- **Aislamiento de herramientas (sandboxing):** aislar la ejecución de una herramienta para que no pueda exceder su autoridad prevista.
- **Mínimo privilegio:** conceder a cada agente los permisos mínimos que su tarea necesita.
- **Identidad del agente:** un principal distinto y atribuible para cada agente, con alcance limitado y revocable.
- **Exfiltración de datos:** salida no autorizada de datos sensibles a través de salidas de herramientas o contenido renderizado.
- **Trifecta letal:** la combinación peligrosa de acceso a datos privados, exposición a contenido no confiable y capacidad de comunicarse al exterior.

## Definición

> La **seguridad para sistemas agénticos** es la disciplina del harness que trata al modelo como un componente no confiable y manipulable, y construye controles de identidad, permisos, aislamiento y salida de datos para que el daño máximo que pueda causar cualquier agente comprometido esté acotado, sea atribuible y quede auditado.

## Explicación detallada

La amenaza fundacional es la **inyección de prompt**, y el error fundacional es intentar resolverla dentro del modelo. Ningún grado de endurecimiento del prompt de sistema detiene de forma fiable una instrucción suficientemente astuta incrustada en contenido recuperado, porque el modelo no tiene una frontera robusta y de principio entre «datos» e «instrucción». La inyección indirecta es la variante peligrosa: un agente que resume una página web o lee un ticket puede ser tomado por el texto que el atacante plantó allí. La respuesta del harness es **arquitectónica, no de prompting**: asumir que la inyección tendrá éxito a veces y garantizar que un agente secuestrado siga sin poder hacer nada que sus *permisos* prohíban. Los guardarraíles de entrada (detección de inyección y jailbreak) reducen la *frecuencia* de las inyecciones exitosas; los controles de permisos y de salida acotan la *consecuencia*. Hacen falta ambos; ninguno basta por sí solo.

El **mínimo privilegio y la identidad del agente** son la columna vertebral de la seguridad agéntica. Cada agente debería ejecutarse como un principal distinto y atribuible, con credenciales limitadas exactamente a los recursos que su tarea requiere: tokens de vida corta, ámbitos OAuth estrechos, solo lectura donde no haga falta escribir y aislamiento de datos por inquilino aplicado *por debajo* del agente (en la capa de datos), nunca pidiéndole con buenas maneras al modelo que no se salga de su carril. Cuando un agente actúa en nombre de un usuario, debe llevar la autorización de ese usuario y no una cuenta de servicio con poderes absolutos, para que el agente no pueda exceder nunca lo que el usuario podría hacer directamente. Las credenciales debe inyectarlas el harness en el momento de la llamada, jamás colocarse en la ventana de contexto, donde una inyección podría leerlas y exfiltrarlas.

El **aislamiento de herramientas** confina la ejecución. Las herramientas que ejecutan código lo hacen en cajas de arena efímeras, con red restringida y recursos topados. Los catálogos de herramientas están en **lista de permitidos** por agente, de modo que un agente secuestrado no puede alcanzar una herramienta que nunca se le concedió. Las herramientas de alta consecuencia quedan detrás de una aprobación humana (PAT-007 / PAT-001), para que incluso una llamada autorizada pero manipulada requiera que una persona la confirme. El principio es la *defensa en profundidad*: la autorización decide *si* la llamada está permitida, la caja de arena acota *qué puede tocar* y la puerta de aprobación añade un punto de control humano para las acciones irreversibles.

La **exfiltración de datos** es el riesgo agéntico más infravalorado. La «trifecta letal» —un agente con (1) acceso a datos privados, (2) exposición a contenido no confiable y (3) capacidad de comunicarse al exterior— es explotable: instrucciones inyectadas le dicen al agente que incruste secretos en una petición saliente, en la URL de una imagen renderizada o en el argumento de una herramienta. El harness rompe la trifecta eliminando al menos una de sus patas en los contextos sensibles: restringir los destinos de salida a una lista de permitidos, ejecutar comprobaciones de prevención de fuga de datos sobre cada carga saliente, eliminar o fijar el renderizado de contenido externo y prohibir que el agente construya URL salientes arbitrarias. Si un agente debe tocar datos privados, su capacidad de comunicarse al exterior tiene que estar fuertemente restringida, y viceversa.

Todo ello se apoya en la **observabilidad y la auditabilidad** (HRN-006): cada acción, la identidad que la realizó, la decisión de permiso y la comprobación de salida deben quedar registradas de forma inmutable. Una seguridad que no puedes demostrar es una seguridad que no tienes. Estos controles implementan las obligaciones definidas en el marco de gobernanza (GOV-001) y encajan en la taxonomía general del harness (HRN-003).

## Evidencia de producción

> **Escenario ilustrativo y representativo.** Nivel de evidencia: teórico · Confianza: media · Fuente: observación de industria, experiencia personal. Las descripciones siguientes son patrones representativos de ataque y mitigación, no mediciones de un despliegue verificado concreto.

- **Contexto:** un agente de soporte al cliente con acceso a una base de conocimiento y capacidad de enviar correos a clientes.
- **Escenario:** un atacante planta texto de inyección en un ticket de soporte intentando que el agente envíe por correo los datos de la cuenta de otro cliente a una dirección externa.
- **Tecnología:** credenciales con alcance por agente, lista de permitidos de salida, prevención de fuga de datos sobre el correo saliente, detección de inyección en el contenido recuperado, registro de auditoría.
- **Carga:** alto volumen de tickets, con una fracción pequeña pero no nula que porta intentos de inyección.
- **Resultados (representativos):** en despliegues de esta forma, los controles arquitectónicos (lista de permitidos de salida + prevención de fuga + mínimo privilegio) bloquean la *consecuencia* de la inyección incluso cuando la detección se pierde el *intento*, llevando la exfiltración exitosa hacia cero, mientras que la detección de inyección por sí sola deja riesgo residual.

### Lecciones aprendidas

Las estrategias basadas solo en detección acaban fallando; las defensas fiables son las arquitectónicas, las que acotan la consecuencia. Romper la trifecta letal —sobre todo restringiendo la salida— hace más por la seguridad que cualquier clasificador aislado.

## Modos de fallo observados

| Modo de fallo | Disparador | Mitigación |
|---|---|---|
| Inyección directa de prompt | Instrucción maliciosa del usuario | Guardarraíles de entrada + acotado de permisos |
| Inyección indirecta | Texto malicioso en los datos recuperados | Tratar todo contenido recuperado como no confiable; controles de salida |
| Exfiltración de datos | Trifecta letal explotada | Romper la trifecta: lista de permitidos de salida + prevención de fuga |
| Escalada de privilegios | Credenciales de servicio demasiado amplias | Credenciales con alcance por agente y vida corta; autorización delegada por el usuario |
| Fuga de credenciales | Secretos en la ventana de contexto | Inyectar las credenciales en el momento de la llamada, nunca en el contexto |
| Fuga de la caja de arena | Código o red sin restringir en las herramientas | Cajas de arena efímeras, aisladas de red y con recursos topados |
| Delegado confuso | El agente se usa como proxy para acciones prohibidas | Portar la identidad del llamante; autorizar en el efector |

## KPIs

| Métrica | Objetivo | Notas |
|---|---|---|
| Tasa de exfiltración exitosa | → 0 | La métrica que más importa |
| Exhaustividad de la detección de inyección | Alta | Reduce la frecuencia de intentos, no es la única defensa |
| Estrechez del alcance de permisos | Concesiones mínimas | Auditar permisos sin usar o demasiado amplios |
| Cobertura de la lista de permitidos de salida | 100 % | Sin destinos salientes arbitrarios |
| Tiempo medio hasta la revocación | Bajo | Revocación de la identidad de un agente comprometido |
| Completitud de auditoría | 100 % | Toda acción atribuible |

## Métricas de coste

- **Coste de inferencia de los guardarraíles:** los clasificadores de inyección y de fuga de datos añaden inferencia auxiliar por petición; hay que presupuestarla dentro del coste por tarea.
- **Sobrecoste de las cajas de arena:** el arranque de una caja efímera añade latencia a las herramientas de código; se amortiza con pools calientes.
- **Coste de ingeniería:** la identidad con alcance y la lista de permitidos de salida son trabajo de IAM por adelantado que se rentabiliza en todos los agentes.

## Características de escalado

Los controles de permisos e identidad escalan con la infraestructura de IAM y de secretos, sin estado por llamada. Los clasificadores de guardarraíl escalan con la capacidad de inferencia y son el coste de rendimiento; cortocircuítalos antes con comprobaciones deterministas baratas (listas de permitidos, expresiones regulares, esquema). Las cajas de arena escalan con un pool gestionado; los pools calientes cambian coste ocioso por latencia. Los controles de salida escalan de forma trivial y nunca deberían ser el cuello de botella: son el control de mayor valor por coste de toda la pila.

## Contenido relacionado

- HRN-003 — El lugar de la seguridad en la taxonomía del harness.
- GOV-001 — Obligaciones de gobernanza que estos controles de seguridad implementan.
- PAT-007 — Patrón de control de herramientas y permisos (aislamiento y uso de herramientas con puerta).

## Referencias

- OWASP Top 10 para aplicaciones LLM (LLM01 inyección de prompt, LLM06 divulgación de información sensible).
- Simon Willison, «The lethal trifecta for AI agents».
- NIST AI RMF y NIST SP 800-53 (mínimo privilegio, identidad).
- MITRE ATLAS — panorama de amenazas adversarias para sistemas de IA.

## Preguntas frecuentes

**P: ¿Se puede prevenir por completo la inyección de prompt?**
R: No. Diseña contando con ella: asume que a veces tendrá éxito y acota la consecuencia con mínimo privilegio, control de salida y aislamiento.

**P: ¿Cuál es el control de mayor valor?**
R: Romper la trifecta letal; de la forma más barata, restringiendo la salida a una lista de permitidos con prevención de fuga de datos, para que un agente secuestrado no pueda exfiltrar nada.

**P: ¿Deberían los agentes compartir una cuenta de servicio?**
R: No. Dale a cada agente una identidad distinta, con alcance limitado y vida corta, y haz que porte la autorización del usuario llamante para que no pueda exceder nunca los derechos de ese usuario.
