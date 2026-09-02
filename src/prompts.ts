/**
 * MCP Prompts — la tercera primitiva (REG-20).
 *
 * `prompts/list` respondía `-32601 Method not found`. No una lista vacía: «ese
 * método no existe aquí». El 1 de septiembre se fueron así 24 llamadas, más de
 * las que hubo de ejecución real de herramientas ese día.
 *
 * Lo que va dentro no se ha elegido por lo que suena útil. Los tres primeros
 * salen de fallos que la analítica ya midió, y el tercero de la razón por la
 * que existe la plataforma:
 *
 * - 27 de 29 `get_handbook` pedían ids inventados por analogía (`arch-001`,
 *   `hom-r-001`). `locate_handbook_chapter` no da consejo: **entrega la lista
 *   real**, que es lo que hace innecesario inventar.
 * - 8 `customer-service-agent` se dispararon contra tres dominios que no lo
 *   tienen, y 43 `search:empty` (`ithaca`, `odisea`) salieron del buscador del
 *   núcleo mientras `search_all` sí respondía. `locate_in_corpus` pone la
 *   búsqueda federada delante del `get_*`.
 * - `cite_with_provenance` no corrige una demanda medida, y conviene decirlo:
 *   lo justifica la citabilidad, que es una de las tres preguntas de la regla 4
 *   de AGENTS.md y el motivo por el que el corpus lleva `canonical_url` y
 *   bloque de evidencia.
 *
 * **Lo que deliberadamente NO hay aquí es un prompt que empuje a las
 * calculadoras.** Son las tres ejecuciones que ADR 0005 §6 cuenta para la
 * puerta de «uso instrumental», y hoy nadie las ejecuta. Un prompt cuyo efecto
 * sea mover justo la métrica que decide la puerta no es una mejora del
 * producto: es contaminar la medición que ADR 0005 §3 existe para proteger.
 *
 * El texto se deriva del contenido —los dominios, sus cuentas, sus
 * herramientas y los capítulos salen del proveedor— para que no envejezca
 * aparte del corpus. Un prompt con prosa escrita a mano es una segunda fuente
 * de verdad que nadie recuerda actualizar.
 */
import { z } from "zod";
import type { Locale } from "./content.js";
import { SEARCH_SURFACES, type Surface } from "./surfaces.ts";
import { resourceUri } from "./resource-uris.ts";
import type { McpContent } from "./tools.ts";

/** Los identificadores que este servidor publica como prompts. */
export const PROMPT_NAMES = [
  "locate_in_corpus",
  "locate_handbook_chapter",
  "cite_with_provenance",
] as const;
export type PromptName = (typeof PROMPT_NAMES)[number];

export interface PromptManifestEntry {
  name: PromptName;
  title: string;
  description: string;
  /** La superficie de corpus a la que se atribuye su uso en la analítica. */
  surface: Surface;
  arguments: Array<{ name: string; description: string; required: boolean }>;
}

/**
 * El manifiesto, tipado por nombre para que un prompt nuevo sin entrada **no
 * compile**. Es la misma disciplina que `DESCRIPCIONES` en Resources: la
 * diferencia entre una comprobación que alguien tiene que acordarse de correr
 * y una que no se puede saltar.
 */
const MANIFIESTO: Record<PromptName, Omit<PromptManifestEntry, "name">> = {
  locate_in_corpus: {
    title: "Locate a concept in the corpus",
    description:
      "Find which surface holds a concept before fetching it. Searches every surface first, so a slug that lives in one domain is not requested from another.",
    surface: "meta",
    arguments: [
      { name: "concept", description: "The term, question or slug you are looking for.", required: true },
      { name: "locale", description: "en, es or pt. Defaults to en.", required: false },
    ],
  },
  locate_handbook_chapter: {
    title: "Read a Harness Engineering Handbook chapter",
    description:
      "Hands over the real chapter identifiers and their titles, so a chapter is requested by an id that exists rather than one inferred by analogy.",
    surface: "core",
    arguments: [
      { name: "topic", description: "What you want the Handbook to cover. Optional: omit it to see every chapter.", required: false },
      { name: "locale", description: "en, es or pt. Defaults to en.", required: false },
    ],
  },
  cite_with_provenance: {
    title: "Cite a unit with its provenance",
    description:
      "Produce a citation that carries the canonical URL, the Evidence-First block and — when the statement is load-bearing — the epistemic level and retraction condition of the claim behind it.",
    surface: "core",
    arguments: [
      { name: "identifier", description: "Slug or id of the unit you are about to cite.", required: true },
      { name: "locale", description: "en, es or pt. Defaults to en.", required: false },
    ],
  },
};

export function promptManifest(): PromptManifestEntry[] {
  return PROMPT_NAMES.map((name) => ({ name, ...MANIFIESTO[name] }));
}

/** La superficie de un prompt, para atribuir su uso sin escribirla dos veces. */
export function surfaceOfPrompt(name: PromptName): Surface {
  return MANIFIESTO[name].surface;
}

/**
 * El subconjunto del `McpServer` que hace falta aquí, declarado
 * estructuralmente por el mismo motivo que `McpToolServer` y
 * `McpResourceServer`: el registro no tiene por qué conocer su transporte.
 */
export interface McpPromptServer {
  registerPrompt(
    name: string,
    config: { title?: string; description?: string; argsSchema?: unknown },
    callback: (args: Record<string, unknown>) => PromptResult | Promise<PromptResult>,
  ): unknown;
}

export type PromptResult = {
  description?: string;
  messages: Array<{ role: "user"; content: { type: "text"; text: string } }>;
};

export type McpPromptOutcome = "ok" | "error";

export interface McpPromptResultEvent {
  prompt: PromptName;
  surface: Surface;
  outcome: McpPromptOutcome;
}

export interface McpPromptTelemetry {
  promptResult?(event: McpPromptResultEvent): void;
}

const LOCALES = ["en", "es", "pt"] as const;
const localeSchema = z
  .enum(LOCALES)
  .optional()
  .describe("Content language. Defaults to en.");

function localeDe(valor: unknown): Locale {
  return (LOCALES as readonly string[]).includes(String(valor))
    ? (String(valor) as Locale)
    : ("en" as Locale);
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

/** Un mensaje de usuario, que es la única forma que este servidor emite. */
function mensaje(cuerpo: string): PromptResult["messages"] {
  return [{ role: "user", content: { type: "text", text: cuerpo } }];
}

/**
 * El mapa de dominios tal y como lo sirve `get_overview`.
 *
 * Deriva de la misma llamada, así que un dominio nuevo aparece en el prompt el
 * día que aparece en el corpus, sin que nadie lo copie aquí.
 */
function mapaDeDominios(content: McpContent): string {
  return content
    .overview()
    .domains.map(
      (d) => `- ${d.domain} (${d.count}) — ${d.tools.list} / ${d.tools.get}; identifier: ${d.lookup}`,
    )
    .join("\n");
}

/**
 * Registra los prompts. La telemetría es opcional igual que en tools y
 * resources: sin hook, el CLI no mide nada.
 */
export function registerPrompts(
  server: McpPromptServer,
  content: McpContent,
  telemetry?: McpPromptTelemetry,
): void {
  const observar = (
    name: PromptName,
    construir: (args: Record<string, unknown>) => PromptResult,
  ) => (args: Record<string, unknown>): PromptResult => {
    const surface = surfaceOfPrompt(name);
    try {
      const salida = construir(args);
      try {
        telemetry?.promptResult?.({ prompt: name, surface, outcome: "ok" });
      } catch {
        // La observación nunca rompe una respuesta.
      }
      return salida;
    } catch (error) {
      try {
        telemetry?.promptResult?.({ prompt: name, surface, outcome: "error" });
      } catch {
        // Se preserva el error del prompt.
      }
      throw error;
    }
  };

  // ── 1. ¿Dónde vive esto? ──────────────────────────────────────────────────
  // Los 8 fallos de `customer-service-agent` no fueron contenido que faltara:
  // era contenido existente pedido al getter equivocado. Y 43 `search:empty`
  // salieron del buscador del núcleo mientras la búsqueda federada respondía.
  server.registerPrompt(
    "locate_in_corpus",
    {
      title: MANIFIESTO.locate_in_corpus.title,
      description: MANIFIESTO.locate_in_corpus.description,
      argsSchema: z.object({
        concept: z.string().min(1).max(512).describe("The term, question or slug you are looking for."),
        locale: localeSchema,
      }),
    },
    observar("locate_in_corpus", (args) => {
      const concepto = texto(args.concept);
      const locale = localeDe(args.locale);
      return {
        description: `Locate "${concepto}" across every surface before fetching it.`,
        messages: mensaje(
          `Find where "${concepto}" lives in the SANTISMM corpus, then read it.\n\n` +
            `Do it in this order:\n\n` +
            `1. Call \`search_all\` with query "${concepto}" and locale "${locale}". It queries all ` +
            `${SEARCH_SURFACES.length} searchable surfaces at once: ${SEARCH_SURFACES.join(", ")}.\n` +
            `2. Read the surface of each hit. That is what tells you which getter to use.\n` +
            `3. Only then call that surface's \`get_*\` tool with the identifier the search returned ` +
            `verbatim — or read it without a tool call at \`santismm://{domain}/${locale}/{slug}\`.\n\n` +
            `Do not start with a domain-specific \`get_*\` or with the core \`search\`. A slug that ` +
            `exists in one domain returns not_found in another, and the core search does not see ` +
            `Articles, Labs, claims or the Homeric Atlas — a query answered there looks like an ` +
            `empty corpus from inside \`search\`.\n\n` +
            `The core domains and their tools:\n\n${mapaDeDominios(content)}\n\n` +
            `If \`search_all\` returns nothing on every surface, say so plainly and name the query ` +
            `you ran. That is a real content gap and it is worth reporting as one; guessing a ` +
            `neighbouring slug turns it into a miss nobody can act on.`,
        ),
      };
    }),
  );

  // ── 2. El handbook, con sus identificadores de verdad ──────────────────────
  // 27 de 29 llamadas a `get_handbook` pidieron ids inventados por analogía.
  // Un prompt que sólo dijera «no los inventes» pediría lo mismo que el
  // mensaje de error ya pide. Éste entrega la lista.
  server.registerPrompt(
    "locate_handbook_chapter",
    {
      title: MANIFIESTO.locate_handbook_chapter.title,
      description: MANIFIESTO.locate_handbook_chapter.description,
      argsSchema: z.object({
        topic: z.string().max(512).optional().describe("What you want the Handbook to cover. Omit to see every chapter."),
        locale: localeSchema,
      }),
    },
    observar("locate_handbook_chapter", (args) => {
      const tema = texto(args.topic);
      const locale = localeDe(args.locale);
      const capitulos = (content.listHandbook(locale) as Array<Record<string, unknown>>).map((c) => {
        const id = texto(c.id) || texto(c.slug);
        const slug = texto(c.slug);
        // `name`, no `title`: es el campo que llevan las fichas del handbook.
        // La primera versión de esto pedía `title` y publicaba catorce líneas
        // que decían «HRN-001 — HRN-001», que es justamente el prompt
        // prometiendo un título y entregando el id que el agente ya tenía.
        const titulo = texto(c.name) || texto(c.title) || id;
        const categoria = texto(c.category);
        return `- ${id}${slug && slug !== id ? ` (slug: ${slug})` : ""} — ${titulo}` +
          (categoria ? ` [${categoria}]` : "");
      });
      return {
        description: tema
          ? `Find the Handbook chapter covering "${tema}".`
          : "Every Harness Engineering Handbook chapter, by identifier.",
        messages: mensaje(
          (tema
            ? `Find the Harness Engineering Handbook chapter that covers "${tema}", then read it.\n\n`
            : `Read the Harness Engineering Handbook.\n\n`) +
            `These are the ${capitulos.length} chapters that exist in "${locale}". ` +
            `\`get_handbook\` accepts either form of each identifier:\n\n` +
            `${capitulos.join("\n")}\n\n` +
            `Pick one from this list and call \`get_handbook\` with it, or read it without a tool ` +
            `call at \`santismm://handbook/${locale}/{id}\`.\n\n` +
            `Do not infer an identifier by analogy with another surface. The series above is the ` +
            `whole Handbook: if no chapter covers ${tema ? `"${tema}"` : "what you need"}, say so ` +
            `instead of requesting a plausible-looking id — the Handbook does not answer to the ` +
            `identifier shapes used by the Atlas or the pattern canon.`,
        ),
      };
    }),
  );

  // ── 3. Citar como se debe citar ───────────────────────────────────────────
  // Éste no corrige una demanda medida. Lo justifica la citabilidad, y ahora
  // es comprobable: la URI del recurso y la URL canónica nombran la misma
  // unidad, y eso lo sostiene una guarda sobre las 402 fichas que la publican.
  server.registerPrompt(
    "cite_with_provenance",
    {
      title: MANIFIESTO.cite_with_provenance.title,
      description: MANIFIESTO.cite_with_provenance.description,
      argsSchema: z.object({
        identifier: z.string().min(1).max(128).describe("Slug or id of the unit you are about to cite."),
        locale: localeSchema,
      }),
    },
    observar("cite_with_provenance", (args) => {
      const id = texto(args.identifier);
      const locale = localeDe(args.locale);
      return {
        description: `Cite "${id}" with its provenance intact.`,
        messages: mensaje(
          `Produce a citation for "${id}" that a reader can check.\n\n` +
            `1. Fetch the unit. If you do not know which surface holds it, run \`search_all\` first ` +
            `— a slug from one domain returns not_found in another.\n` +
            `2. Quote \`canonical_url\` verbatim as the citation target. Do not construct a URL ` +
            `from the slug: the field is the address, and the resource URI ` +
            `\`santismm://{domain}/${locale}/{slug}\` names that same unit, so the two agree by ` +
            `construction.\n` +
            `3. Report the \`evidence\` block as it stands — its level and its sources. Evidence-First ` +
            `means the level is part of the claim, not a footnote: a unit marked as an observation ` +
            `does not become a production result because it is being cited.\n` +
            `4. If the statement you are supporting is load-bearing, check \`list_claims\` and ` +
            `\`get_claim\`. A claim carries its epistemic level and the condition under which it ` +
            `would be withdrawn, and both belong in the citation.\n\n` +
            `The corpus map, its licence and its bulk-ingest URLs are at ` +
            `\`${resourceUri.overview()}\` — read it rather than assuming a licence.\n\n` +
            `If the unit does not exist, say so and name the identifier you tried. A citation to a ` +
            `unit nobody can open is worse than no citation.`,
        ),
      };
    }),
  );
}
