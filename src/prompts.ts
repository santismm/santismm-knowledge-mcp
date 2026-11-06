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
  "evaluate_physical_ai_opportunity",
  "compare_physical_ai_options",
  "design_physical_ai_pilot",
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
      { name: "locale", description: "en, es, pt, fr, de, ja or zh. Defaults to en.", required: false },
    ],
  },
  locate_handbook_chapter: {
    title: "Read a Harness Engineering Handbook chapter",
    description:
      "Hands over the real chapter identifiers and their titles, so a chapter is requested by an id that exists rather than one inferred by analogy.",
    surface: "core",
    arguments: [
      { name: "topic", description: "What you want the Handbook to cover. Optional: omit it to see every chapter.", required: false },
      { name: "locale", description: "en, es, pt, fr, de, ja or zh. Defaults to en.", required: false },
    ],
  },
  cite_with_provenance: {
    title: "Cite a unit with its provenance",
    description:
      "Produce a citation that carries the canonical URL, the Evidence-First block and — when the statement is load-bearing — the epistemic level and retraction condition of the claim behind it.",
    surface: "core",
    arguments: [
      { name: "identifier", description: "Slug or id of the unit you are about to cite.", required: true },
      { name: "locale", description: "en, es, pt, fr, de, ja or zh. Defaults to en.", required: false },
    ],
  },
  evaluate_physical_ai_opportunity: {
    title: "Evaluate a robotics automation opportunity",
    description:
      "Walk from an operational problem to an evidence-backed assessment: matching platforms and documented deployments, the readiness assessment, and the host's own ROI/TCO model — with every assumption and unknown stated. It assembles public, deterministic results; it is not a priced business case.",
    surface: "physical_ai",
    arguments: [
      { name: "task", description: "The operational task, e.g. 'night-time inspection of a chemical plant'.", required: true },
      { name: "environment", description: "Environment id, e.g. industrial, warehouse, offshore. Optional.", required: false },
      { name: "sector", description: "Sector id, e.g. inspection, logistics, security. Optional.", required: false },
      { name: "locale", description: "en, es, pt, fr, de, ja or zh. Defaults to en.", required: false },
    ],
  },
  compare_physical_ai_options: {
    title: "Compare robot platforms on published facts",
    description:
      "Shortlist platforms for a need and compare them as a table of published facts — with provenance, test conditions and the values nobody has published — instead of a generated opinion.",
    surface: "physical_ai",
    arguments: [
      { name: "need", description: "What the robot has to do, or the platforms to compare by name.", required: true },
      { name: "locale", description: "en, es, pt, fr, de, ja or zh. Defaults to en.", required: false },
    ],
  },
  design_physical_ai_pilot: {
    title: "Design a robotics pilot from the deployment guide",
    description:
      "Draft a pilot plan — scope, operational design domain, KPIs, success criteria and exit conditions — grounded in the deployment guide and in the lessons of documented deployments, with each borrowed point cited.",
    surface: "physical_ai",
    arguments: [
      { name: "task", description: "The task the pilot should test.", required: true },
      { name: "platform", description: "Platform slug, if one is already chosen. Optional.", required: false },
      { name: "locale", description: "en, es, pt, fr, de, ja or zh. Defaults to en.", required: false },
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

const LOCALES = ["en", "es", "pt", "fr", "de", "ja", "zh"] as const;
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

  // ── 4–6. Physical AI ──────────────────────────────────────────────────────
  // Prompts, not more tools: these are workflows a person chooses, and each one
  // only orders tools that already exist. None of them produces a priced
  // business case — that is a paid artefact under docs/commerce, not a public
  // tool or prompt. They assemble public, deterministic results and say what
  // is still unknown.
  const physicalAiRules =
    `Rules for every answer built from Physical AI:\n` +
    `- Cite \`canonical_url\` for every platform, case and guide you use, and the source ids behind each figure.\n` +
    `- A value with \`status: "unpublished"\` is unknown. Say it is unknown; never estimate it or fill it from memory.\n` +
    `- Keep manufacturer claims, press reports, independent evidence and editorial estimates apart — the \`provenance\` and \`evidence_level\` fields say which is which.\n` +
    `- Manufacturer maxima are not simultaneous: quote the \`conditions\` with the number.\n` +
    `- Calculations come from the tools, never from your own arithmetic, and carry their \`model_version\` and \`fields_to_validate\`.\n` +
    `- Do not recommend buying a specific product. Show the evidence and what remains to be validated.`;

  server.registerPrompt(
    "evaluate_physical_ai_opportunity",
    {
      title: MANIFIESTO.evaluate_physical_ai_opportunity.title,
      description: MANIFIESTO.evaluate_physical_ai_opportunity.description,
      argsSchema: z.object({
        task: z.string().min(1).max(512).describe("The operational task."),
        environment: z.string().max(40).optional().describe("Environment id, e.g. industrial."),
        sector: z.string().max(40).optional().describe("Sector id, e.g. inspection."),
        locale: localeSchema,
      }),
    },
    observar("evaluate_physical_ai_opportunity", (args) => {
      const tarea = texto(args.task);
      const entorno = texto(args.environment);
      const sector = texto(args.sector);
      const locale = localeDe(args.locale);
      const contexto = [entorno && `environment "${entorno}"`, sector && `sector "${sector}"`].filter(Boolean).join(", ");
      return {
        description: `Evaluate a robotics opportunity: ${tarea}.`,
        messages: mensaje(
          `Evaluate whether robotics fits this task: "${tarea}"${contexto ? ` (${contexto})` : ""}.\n\n` +
            `1. \`search_physical_ai\` with the task, locale "${locale}"${entorno ? `, environments ["${entorno}"]` : ""}` +
            `${sector ? `, sectors ["${sector}"]` : ""}, types ["platform", "case_study"]. Note the evidence level and limitations of each hit.\n` +
            `2. Read the two or three strongest documented deployments with \`get_physical_ai_item\` (type "case_study"). Their published KPIs and lessons are your precedent; an unpublished KPI is a gap, not a zero.\n` +
            `3. \`assess_physical_ai_fit\` with no answers${contexto ? ` and the same ${contexto}` : ""} to get the readiness questions. Ask the user the ones you cannot answer from what they told you, then call it again with the answers.\n` +
            `4. \`calculate_physical_ai_roi\` with the user's own figures; pick \`use_case\` only if one of the published presets matches. List every entry of \`fields_to_validate\` as an open assumption.\n` +
            `5. Present: readiness by area and blockers; matching platforms and precedents; ROI, TCO and payback with their sensitivity; and a final list of what is still unknown.\n\n` +
            `${physicalAiRules}`,
        ),
      };
    }),
  );

  server.registerPrompt(
    "compare_physical_ai_options",
    {
      title: MANIFIESTO.compare_physical_ai_options.title,
      description: MANIFIESTO.compare_physical_ai_options.description,
      argsSchema: z.object({
        need: z.string().min(1).max(512).describe("What the robot has to do, or the platforms to compare."),
        locale: localeSchema,
      }),
    },
    observar("compare_physical_ai_options", (args) => {
      const necesidad = texto(args.need);
      const locale = localeDe(args.locale);
      return {
        description: `Compare platforms for: ${necesidad}.`,
        messages: mensaje(
          `Compare robot platforms for: "${necesidad}".\n\n` +
            `1. \`search_physical_ai\` with that need, types ["platform"], locale "${locale}". Shortlist 2–5 platforms whose environments and sectors match; say why each made the list.\n` +
            `2. \`compare_physical_ai_platforms\` with the shortlisted slugs. Use the criteria that matter for the need, or omit criteria for all.\n` +
            `3. Render the result as a table. Mark each cell as published, unpublished or estimate, and add the test conditions where they exist.\n` +
            `4. After the table, list the decisive unknowns: the criteria where a value is unpublished for one or more candidates.\n` +
            `There is no winner in the data. If the user asks for one, explain which criteria would decide it and which of them are still unknown.\n\n` +
            `${physicalAiRules}`,
        ),
      };
    }),
  );

  server.registerPrompt(
    "design_physical_ai_pilot",
    {
      title: MANIFIESTO.design_physical_ai_pilot.title,
      description: MANIFIESTO.design_physical_ai_pilot.description,
      argsSchema: z.object({
        task: z.string().min(1).max(512).describe("The task the pilot should test."),
        platform: z.string().max(128).optional().describe("Platform slug, if chosen."),
        locale: localeSchema,
      }),
    },
    observar("design_physical_ai_pilot", (args) => {
      const tarea = texto(args.task);
      const plataforma = texto(args.platform);
      const locale = localeDe(args.locale);
      return {
        description: `Design a pilot for: ${tarea}.`,
        messages: mensaje(
          `Draft a pilot plan for: "${tarea}"${plataforma ? ` with platform "${plataforma}"` : ""}.\n\n` +
            `1. Read the deployment guide — \`get_physical_ai_item\` type "guide", slug "deployment-guide", locale "${locale}" ` +
            `(or the resource \`santismm://physical-ai/guides/deployment-guide?locale=${locale}\`). Its pilot-design, KPI and scaling sections are the template.\n` +
            (plataforma
              ? `2. Read the platform sheet (\`get_physical_ai_item\` type "platform", slug "${plataforma}"): its autonomy-by-task and access fields bound what the pilot can claim.\n`
              : `2. If no platform is chosen yet, run the compare_physical_ai_options workflow first, or keep the plan platform-neutral.\n`) +
            `3. \`search_physical_ai\` for documented deployments of similar tasks; reuse their integration, maintenance and scaling lessons, citing each.\n` +
            `4. Write the plan: scope and operational design domain, KPIs with baseline and target, success and exit criteria, duration, roles, and the risks the lessons point to.\n` +
            `5. Mark which targets come from a published precedent and which are the user's own assumptions.\n\n` +
            `${physicalAiRules}`,
        ),
      };
    }),
  );
}
