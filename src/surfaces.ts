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
 * Surfaces queried by the federated search, shared by its schemas, handler and
 * final-outcome observer. Keeping this beside the import-free surface registry
 * avoids a tools.ts <-> outcomes.ts cycle and makes a search-surface change
 * atomic for both execution and measurement.
 */
export const SEARCH_SURFACES = ["core", "articles", "labs", "claims", "homeric_atlas"] as const;

/**
 * Las tres primitivas del protocolo. Tools y Resources (REG-19) ya se sirven;
 * Prompts (REG-20) es el siguiente incremento. Declarar el eje aquí hace que
 * la ventana de medición compare primitivas en vez de confundir «no medido»
 * con «no usado».
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
