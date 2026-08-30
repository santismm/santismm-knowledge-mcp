/**
 * A qué superficie pertenece cada herramienta — declarado una vez.
 *
 * `get_overview` ya enumeraba las superficies de extensión con sus
 * herramientas, y la analítica contaba por herramienta y nada más. Cruzar las
 * dos cosas exigía una tabla escrita a mano, que es la clase de cifra que
 * acaba estando mal: cada herramienta nueva la habría dejado incompleta en
 * silencio, y una superficie sin datos se lee como «nadie la usa».
 *
 * Aquí no sobra nada por descarte: el núcleo se declara igual que las
 * extensiones. `meta` son las dos transversales —`get_overview` y
 * `search_all`— y separarlas no es cosmético: la lectura de 90 días encontró
 * que ~16.400 de 39.499 peticiones eran saludo y catálogo, así que mezclarlas
 * con el consumo de contenido es justo lo que hace que el volumen parezca
 * tracción.
 *
 * `SURFACE_TOOLS` es la fuente; `get_overview` sirve las extensiones desde
 * ella y la analítica deriva su vocabulario de la misma constante. Una
 * herramienta que no aparezca aquí pone rojo `npm run validate`.
 */
export const SURFACE_TOOLS = {
  core: [
    "list_knowledge", "get_knowledge",
    "list_patterns", "get_pattern",
    "list_architectures", "get_architecture",
    "list_governance", "get_governance",
    "list_handbook", "get_handbook",
    "get_related", "search",
  ],
  meta: ["get_overview", "search_all"],
  articles: ["list_articles", "get_article", "search_articles"],
  homeric_atlas: [
    "list_homeric_places", "get_homeric_place",
    "list_homeric_episodes", "get_homeric_episode",
    "list_homeric_routes", "get_homeric_route",
  ],
  claims: ["list_claims", "get_claim"],
  labs: [
    "list_labs", "get_lab",
    "calculate_agent_economics",
    "calculate_evaluation_sample_size",
    "calculate_human_supervision_capacity",
  ],
} as const;

export type Surface = keyof typeof SURFACE_TOOLS;

/** Las superficies, en orden estable. */
export const SURFACES = Object.keys(SURFACE_TOOLS) as Surface[];

/**
 * Las tres primitivas del protocolo. Hoy todo se expresa con `tool`, y por eso
 * el eje se registra desde el principio: si Resources y Prompts (REG-19,
 * REG-20) llegaran a una analítica que solo cuenta herramientas, dos semanas
 * de datos dirían que nadie los usa cuando lo que pasa es que nadie los mide.
 */
export const PRIMITIVES = ["tool", "resource", "prompt"] as const;
export type Primitive = (typeof PRIMITIVES)[number];

const BY_TOOL: ReadonlyMap<string, Surface> = new Map(
  SURFACES.flatMap((s) => SURFACE_TOOLS[s].map((t) => [t, s] as const)),
);

/** La superficie de una herramienta, o `undefined` si no está declarada. */
export function surfaceOf(tool: string): Surface | undefined {
  return BY_TOOL.get(tool);
}
