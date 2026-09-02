import { z } from "zod";
import type { Domain, Locale } from "./content.js";
import { norm, queryTerms, type CorpusOverview } from "./shape.ts";
import {
  ARTICLES_API_URL,
  articleCard,
  articlesForLocale,
  loadArticles,
  searchArticleCorpus,
  type Article,
} from "./articles.ts";
import {
  LABS_API_URL,
  executeLabCalculator,
  loadLabs,
  searchLabCorpus,
  type LabDefinition,
} from "./labs.ts";
import {
  lookupRequestForTool,
  summarizeToolResult,
  type McpToolObservation,
  type McpToolResultEvent,
} from "./outcomes.ts";
import { SEARCH_SURFACES } from "./surfaces.ts";

/**
 * Single, framework-agnostic definition of the Santismm Knowledge MCP server:
 * its identity and the tool registry. Both transports — the stdio CLI
 * (`mcp/src/index.ts`) and the HTTP endpoint (`app/mcp/route.ts`) — call
 * `registerTools(server, content)`, so the exposed tools can never drift
 * between them. The local data source is injected as `content` (an
 * `McpContent` provider); both providers read the same canonical repository
 * data, while Article tools deliberately read the first-party Articles API.
 */

export const SERVER_INFO = { name: "santismm-knowledge", version: "0.4.1" } as const;

/**
 * The subset of the MCP SDK's `McpServer` that the registry uses (just
 * `registerTool`). Declared structurally instead of importing `McpServer`, so
 * `registerTools` is decoupled from any single physical copy of the SDK — it
 * type-checks whether it receives the web's server instance (root SDK) or the
 * CLI's (the standalone package's SDK), which are nominally distinct types.
 */
export interface McpToolServer {
  // `any` on the schema fields is deliberate. There is now one SDK copy, but the
  // registry is still declared structurally so a transport can be swapped
  // without this file knowing — and `registerTool`'s real signature is generic
  // over the inferred input/output types, which would force every tool's
  // handler to be re-annotated here for no gain.
  registerTool(
    name: string,
    config: {
      title?: string;
      description?: string;
      inputSchema?: any;
      outputSchema?: any;
      annotations?: any;
    },
    handler: (args: any) => any,
  ): unknown;
}

/** Content provider contract — implemented over the filesystem (CLI) and over the web's lib/ loaders (HTTP). */
export interface McpContent {
  overview(): CorpusOverview;
  listDomain(domain: Domain, locale?: Locale): unknown[];
  getEntry(domain: Domain, slug: string, locale?: Locale): unknown;
  search(query: string, domains?: Domain[], limit?: number, locale?: Locale): unknown[];
  related(domain: Domain, slug: string, locale?: Locale): unknown;
  /** Harness Engineering Handbook chapters (empty when no handbook loader is injected). */
  listHandbook(locale?: Locale): unknown[];
  getHandbookChapter(idOrSlug: string, locale?: Locale): unknown;
  /**
   * Homeric Atlas artifacts (empty when no atlas loader is injected).
   *
   * Kept outside `Domain` on purpose: the atlas does not carry Evidence-First
   * provenance, it carries an identification class and a 0–12 rubric. Flattening
   * one vocabulary into the other would tell an agent that a guidebook tradition
   * about Ogygia and an industry observation about agent memory are the same
   * kind of claim.
   */
  listHomeric(kind: HomericKind, locale?: Locale): unknown[];
  /**
   * Las 21 unidades que el sitio llama lab, con quién sirve cada una.
   * Diez las ejecuta el servicio federado y once son páginas del ápice; el
   * catálogo del ápice anunciaba las 21 y `list_labs` servía diez.
   */
  listSiteLabs(): Array<Record<string, unknown>>;
  getHomeric(kind: HomericKind, slug: string, locale?: Locale): unknown;
  listClaims(type?: string, locale?: Locale): unknown[];
  getClaim(id: string, locale?: Locale): unknown;
}

/** The three artifact kinds of the Homeric Atlas. */
export type HomericKind = "places" | "episodes" | "routes";

/**
 * Core tools read a static local corpus, so all four hints are literally true:
 * nothing mutates, the same arguments produce the same answer, and no core
 * tool reaches outside this corpus. Federated Article tools override only the
 * open-world hint because they read another first-party origin.
 *
 * Declaring them matters because a client deciding whether a call needs
 * confirmation, and an aggregator deciding how to present the server, both read
 * these and must otherwise assume the cautious default — that an undeclared
 * tool might destroy something.
 */
const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/** Article tools read another first-party origin, so clients must know they are open-world. */
const READ_ONLY_REMOTE = { ...READ_ONLY, openWorldHint: true } as const;

const localeSchema = z
  .enum(["en", "es", "pt"])
  .optional()
  .describe("Language of the returned body. Default: en.");

// ── Output schemas ──────────────────────────────────────────────────────────
// Declared so every tool advertises an `outputSchema` and returns validated
// `structuredContent`: callers get typed data instead of having to JSON.parse
// a text blob.
//
// Shapes that carry CONTENT (cards, units) are open: a plain `z.object`
// serializes to `additionalProperties: false`, which silently turned every
// field the corpus gained into a contract violation for clients that validate.
// Shapes that are pure ENVELOPE (`{count, results}`, the overview) stay closed
// — the code defines them exactly, so a field added there without being
// declared is a genuine mistake, and `npm run test:mcp` validates live
// responses against these schemas to catch it.

const evidenceSchema = z
  .object({
    evidenceLevel: z.string().optional(),
    confidenceLevel: z.string().optional(),
    sourceType: z.array(z.string()).optional(),
  })
  .optional()
  .describe("Evidence-First provenance: weight claims by this.");

/**
 * Compact card returned by list/search/graph tools. Open, for the same reason
 * `unitOutput` is: cards have gained fields before (`canonical_url`, `score`)
 * and will again, and a closed schema turns that into a client-side rejection.
 *
 * `.passthrough()` rather than `z.looseObject`: both exist in zod 4 and mean the
 * same thing here, and `.passthrough()` keeps the openness attached to the
 * schema it opens instead of to the constructor, which reads better next to the
 * closed schemas around it.
 *
 * (This file used to be compiled against two different zod copies — the site's
 * v4 and the CLI's v3 — which restricted it to API present in both. That is
 * over: `@modelcontextprotocol/server` v2 registers tools through Standard
 * Schema and needs `~standard.jsonSchema`, which zod 3 does not implement, so
 * the CLI moved to zod 4 with it. One zod, one SDK.)
 */
/**
 * Bounded free-text inputs.
 *
 * `slug` and `query` were unbounded strings, so a caller could send a megabyte
 * where a word belongs and the server would hash it, search it and log it
 * before deciding it matched nothing. The limits are set well above anything
 * the corpus can legitimately need — the longest slug is a fraction of this —
 * so they refuse abuse without ever refusing a real request.
 */
const slugSchema = z.string().min(1).max(128);
const querySchema = z.string().min(1).max(512);

const cardSchema = z.object({
  domain: z.string(),
  id: z.string().optional(),
  slug: z.string(),
  category: z.string().optional(),
  name: z.string(),
  summary: z.string().optional(),
  status: z.string().optional(),
  evidence: evidenceSchema,
  updated: z.string().optional(),
  locale: z.string().optional(),
  canonical_url: z.string().optional().describe("Cite this URL."),
  api_url: z.string().optional(),
}).passthrough();

const listOutput = {
  count: z.number(),
  results: z.array(cardSchema),
};

const searchOutput = {
  query: z.string(),
  count: z.number(),
  results: z.array(
    cardSchema.extend({
      score: z.number().describe("Relevance; higher is better."),
      matchedFields: z.array(z.string()).describe("Which fields the query hit."),
      matchedTerms: z.array(z.string()),
    }),
  ),
};

/**
 * A full unit.
 *
 * Open, and that is the whole point: a bare (non-passthrough)
 * `z.object` serializes to `additionalProperties: false`, so every field the
 * corpus actually returns but the schema never named — `locales`, `related`,
 * `patterns`, `knowledge`, `frameworks`, `technologies`, `featured`, and the
 * handbook's own `requested_locale`/`resolved_locale`/`fallback` — made the
 * payload INVALID against the contract the tool advertised. A client that
 * validates strictly, exactly as the MCP spec invites it to, would reject
 * perfectly good results.
 *
 * So: name every field that exists today, so clients get real typing, and stay
 * open, so adding a field to a content unit can never invalidate a response.
 */
const referenceSchema = z.object({ title: z.string().optional(), url: z.string().optional() });

const unitOutput = z.object({
  domain: z.string().optional(),
  id: z.string().optional(),
  slug: z.string().optional(),
  /** Legacy identifiers that resolve to this canonical unit. */
  aliases: z.array(z.string()).optional(),
  category: z.string().optional(),
  updated: z.string().optional(),
  version: z.string().optional(),
  locale: z.string().optional(),
  evidence: evidenceSchema,
  canonical_url: z.string().optional(),
  api_url: z.string().optional(),
  references: z.array(referenceSchema).optional(),
  featured: z.boolean().optional(),
  /** Cross-references, by slug (or HRN id inside the handbook). */
  related: z.array(z.string()).optional(),
  patterns: z.array(z.string()).optional(),
  knowledge: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  /** Every locale, when no `locale` argument narrowed the request. */
  locales: z.record(z.string(), z.unknown()).optional(),
  /** The single requested locale's body, when `locale` was given. */
  body: z.unknown().optional(),
  // Handbook only. Added in order to be honest about the English-only bodies,
  // then left undeclared — so honesty broke the contract.
  requested_locale: z.string().optional(),
  resolved_locale: z.string().optional(),
  fallback: z.boolean().optional(),
  status: z.string().optional(),
  name: z.string().optional(),
  summary: z.string().optional(),
}).passthrough();

/**
 * The four unit getters, tightened into an actual contract.
 *
 * `unitOutput` is a superset covering five domains, so every field is optional
 * and it ends in `.passthrough()` — the schema validated the response and
 * promised nothing. An audit put it plainly: structured, but not typed.
 *
 * The required set below is the INTERSECTION of what every unit in the corpus
 * actually returns, measured across all 55 of them rather than chosen by eye.
 * `featured`, `technologies`, `id` and the domain-specific cross-reference
 * arrays stay optional because they are genuinely absent on some units;
 * requiring them would be a contract the server breaks on its own data.
 *
 * `locales` is optional for the same reason, and it is worth recording why the
 * first version of this got it wrong: measuring only `get_knowledge({slug})`
 * showed `locales` on every unit, so it went into the required set — and
 * `get_knowledge({slug, locale})` returns `body` INSTEAD of `locales` and
 * started failing its own output validation. The intersection has to be taken
 * across every call SHAPE, not only across every unit.
 *
 * `.strict()` closes the object: an undeclared field becomes a failure instead
 * of a silent addition, which is what makes the schema worth reading. The
 * handbook keeps the permissive base — its shape really is different (a body,
 * a resolved locale, no `locales` map and no `version`).
 */
const UNIT_REQUIRED = {
  domain: true,
  slug: true,
  category: true,
  updated: true,
  version: true,
  evidence: true,
  canonical_url: true,
  api_url: true,
  references: true,
  related: true,
} as const;

const unitGetOutput = unitOutput.required(UNIT_REQUIRED).strict();

/**
 * Emit a result on both channels: `structuredContent` (validated against the
 * tool's outputSchema, for clients that support it) and the serialized JSON in
 * `content`, which the MCP spec recommends keeping for backward compatibility.
 */
function out(structured: Record<string, unknown>, text: unknown = structured) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(text, null, 2) }],
    structuredContent: structured,
  };
}

/** A list/search payload: the array stays the `content` shape callers already parse. */
function outList(results: unknown[], extra: Record<string, unknown> = {}) {
  return out({ count: results.length, results, ...extra }, results);
}

/**
 * Where each retrievable space lives and which tools reach it.
 *
 * Written out rather than derived by string surgery on the domain name: the
 * getters are not a regular transformation of it (`patterns` → `get_pattern`,
 * `knowledge` → `get_knowledge`), and a rule with exceptions would break
 * silently the next time a space is added. `npm run validate` checks every name
 * here against the `server.registerTool(` calls below, so the table cannot
 * drift from the server it describes.
 */
const ESPACIOS = [
  { domain: "knowledge", listTool: "list_knowledge", getTool: "get_knowledge" },
  { domain: "patterns", listTool: "list_patterns", getTool: "get_pattern" },
  { domain: "architectures", listTool: "list_architectures", getTool: "get_architecture" },
  { domain: "governance", listTool: "list_governance", getTool: "get_governance" },
  { domain: "handbook", listTool: "list_handbook", getTool: "get_handbook" },
  { domain: "homeric/places", listTool: "list_homeric_places", getTool: "get_homeric_place" },
  { domain: "homeric/episodes", listTool: "list_homeric_episodes", getTool: "get_homeric_episode" },
  { domain: "homeric/routes", listTool: "list_homeric_routes", getTool: "get_homeric_route" },
  { domain: "claims", listTool: "list_claims", getTool: "get_claim" },
  { domain: "articles", listTool: "list_articles", getTool: "get_article" },
  { domain: "labs", listTool: "list_labs", getTool: "get_lab" },
] as const;

type EspacioNombre = (typeof ESPACIOS)[number]["domain"];

/** Every identifier a card answers to: its id (handbook chapters) and its slug. */
function identificadores(cards: unknown[]): string[] {
  const vistos = new Set<string>();
  for (const card of cards) {
    const o = card as Record<string, unknown> | null;
    if (!o) continue;
    for (const campo of [o.id, o.slug]) {
      if (typeof campo === "string" && campo.length > 0) vistos.add(campo);
    }
  }
  return [...vistos];
}

/** The cards of one space, whichever loader serves it. */
function cardsDe(content: McpContent, domain: EspacioNombre, locale: Locale): unknown[] {
  // Federated Articles and Labs are asynchronous and have their own recovery
  // payloads; keep them out of the synchronous cross-space lookup for locals.
  if (domain === "articles" || domain === "labs") return [];
  if (domain === "handbook") return content.listHandbook(locale);
  if (domain === "claims") return content.listClaims(undefined, locale);
  if (domain.startsWith("homeric/")) {
    return content.listHomeric(domain.slice("homeric/".length) as HomericKind, locale);
  }
  return content.listDomain(domain as Domain, locale);
}

/**
 * Levenshtein distance, bounded by `tope`: it stops as soon as the whole row
 * exceeds the budget, so a long identifier costs nothing when it is obviously
 * unrelated. Only ever run over the few dozen short slugs of one space.
 */
function distancia(a: string, b: string, tope: number): number {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    let minima = i;
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(fila[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + coste);
      fila.push(v);
      if (v < minima) minima = v;
    }
    if (minima > tope) return tope + 1;
    anterior = fila;
  }
  return anterior[b.length];
}

/** Identifiers are compared case- and separator-insensitively: agents guess both. */
function normalizar(s: string): string {
  return s.toLowerCase().replace(/[\s_]+/g, "-");
}

function urlSlug(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return new URL(value).pathname.split("/").filter(Boolean).at(-1);
  } catch {
    return undefined;
  }
}

/**
 * Enrich a direct lookup miss without delaying the tool response itself.
 *
 * Local recovery payloads already carry `found_in`. Federated Articles and
 * Labs cannot be inspected synchronously by `noEncontrado`, so the hosted
 * analytics callback runs this after the response and checks their cached
 * canonical catalogues. A Portuguese Article slug sent to
 * `get_architecture`, for example, is a wrong-tool event, not a content gap.
 */
export async function observeToolResult(
  event: McpToolResultEvent,
  content: McpContent,
): Promise<McpToolObservation> {
  const observation = summarizeToolResult(event);
  if (observation.demandClass !== "invalid_identifier") return observation;
  const lookup = lookupRequestForTool(event.tool, event.args);
  if (!lookup) return observation;
  const wanted = normalizar(lookup.identifier);

  for (const space of ESPACIOS) {
    if (space.domain === lookup.domain || space.domain === "articles" || space.domain === "labs") continue;
    try {
      const exact = cardsDe(content, space.domain, "en").find((candidate) => {
        const item = candidate as Record<string, unknown> | null;
        return [item?.id, item?.slug].some(
          (identifier) => typeof identifier === "string" && normalizar(identifier) === wanted,
        );
      }) as Record<string, unknown> | undefined;
      const id = exact && (typeof exact.slug === "string" ? exact.slug : exact.id);
      if (typeof id === "string") {
        return {
          ...observation,
          demandClass: "wrong_tool",
          foundIn: { domain: space.domain, id, tool: space.getTool },
        };
      }
    } catch {
      // One optional recovery surface cannot hide the original observation.
    }
  }

  const [articleLoad, labLoad] = await Promise.allSettled([loadArticles(), loadLabs()]);
  if (lookup.domain !== "articles" && articleLoad.status === "fulfilled") {
    const article = articleLoad.value.find((candidate) =>
      [candidate.slug, urlSlug(candidate.canonical_url), urlSlug(candidate.api_url)].some(
        (identifier) => typeof identifier === "string" && normalizar(identifier) === wanted,
      ),
    );
    if (article) {
      return {
        ...observation,
        demandClass: "wrong_tool",
        foundIn: { domain: "articles", id: article.slug, tool: "get_article" },
      };
    }
  }
  if (lookup.domain !== "labs" && labLoad.status === "fulfilled") {
    const lab = labLoad.value.find((candidate) => normalizar(candidate.slug) === wanted);
    if (lab) {
      return {
        ...observation,
        demandClass: "wrong_tool",
        foundIn: { domain: "labs", id: lab.slug, tool: "get_lab" },
      };
    }
  }
  return observation;
}

/** Most identifiers a not-found payload will spell out before summarising. */
const MUESTRA_MAXIMA = 30;

/**
 * Tool-level failure that an agent can recover from.
 *
 * The bare `{error, domain, slug}` this used to return was a dead end: 90 days
 * of traffic show `get_handbook` answering 2 of 29 calls, the other 27 asking
 * for ids invented by analogy (`arch-001`, `hom-r-001`) against a handbook that
 * only has the `HRN-###` series — and eight more calls asking for
 * `customer-service-agent` in three domains that do not hold it while
 * `architectures` does. Nothing in the response said so, so the caller retried
 * the same invention. Now the error carries the valid identifiers, the tool
 * that lists them, the nearest match, and the space that does hold the slug.
 *
 * `isError` is required here: the SDK skips output validation for error
 * results, which is what lets a not-found response omit `structuredContent`
 * while the tool still declares an outputSchema.
 */
function noEncontrado(
  content: McpContent,
  domain: EspacioNombre,
  pedido: string,
  locale: Locale,
) {
  const espacio = ESPACIOS.find((e) => e.domain === domain);
  const cuerpo: Record<string, unknown> = { error: "not_found", domain, slug: pedido };
  const pistas: string[] = [];

  let validos: string[] = [];
  try {
    validos = identificadores(cardsDe(content, domain, locale));
  } catch {
    validos = [];
  }

  // Lo mismo, en otro sitio: el fallo más común no es que falte el contenido.
  const buscado = normalizar(pedido);
  for (const otro of ESPACIOS) {
    if (otro.domain === domain) continue;
    let suyos: string[] = [];
    try {
      suyos = identificadores(cardsDe(content, otro.domain, locale));
    } catch {
      continue;
    }
    const acierto = suyos.find((id) => normalizar(id) === buscado);
    if (acierto) {
      cuerpo.found_in = { domain: otro.domain, id: acierto, tool: otro.getTool };
      pistas.push(`"${acierto}" exists in ${otro.domain}: call ${otro.getTool}.`);
      break;
    }
  }

  if (validos.length > 0) {
    const tope = Math.max(2, Math.floor(buscado.length / 3));
    const cerca = validos
      .map((id) => ({ id, d: distancia(buscado, normalizar(id), tope) }))
      .filter((c) => c.d <= tope)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map((c) => c.id);
    if (cerca.length > 0) {
      cuerpo.did_you_mean = cerca;
      pistas.push(`Did you mean ${cerca.map((c) => `"${c}"`).join(", ")}?`);
    }

    const orden = [...validos].sort();
    cuerpo.available_count = orden.length;
    cuerpo.available = orden.slice(0, MUESTRA_MAXIMA);
    if (orden.length > MUESTRA_MAXIMA) {
      cuerpo.available_truncated = true;
      pistas.push(
        `${domain} has ${orden.length} identifiers; ${MUESTRA_MAXIMA} are listed here.`,
      );
    }
  }

  if (espacio) {
    cuerpo.list_tool = espacio.listTool;
    pistas.push(`${espacio.listTool} returns every identifier this tool accepts.`);
  }
  pistas.push("Identifiers are not interchangeable between spaces; do not invent one by analogy.");

  /**
   * The third reason a lookup fails, and the one this answer could not express.
   *
   * A published package carries the corpus frozen at publish time, so an agent
   * holding one gets `not_found` for a unit that exists — and everything above
   * tells it, truthfully but misleadingly, that the identifier is not in the
   * corpus. Stating the date of this copy turns that into something the caller
   * can check instead of a dead end wearing a helpful face.
   */
  try {
    const fecha = content.overview().corpus.newest_unit;
    if (fecha) {
      cuerpo.corpus_newest_unit = fecha;
      pistas.push(
        `This copy holds nothing newer than ${fecha}. If the unit was added after that, ` +
          "a package snapshot is the reason and the hosted endpoint has it.",
      );
    }
  } catch {
    // La recuperación nunca puede ser la que rompa la respuesta.
  }

  cuerpo.hint = pistas.join(" ");

  return {
    content: [{ type: "text" as const, text: JSON.stringify(cuerpo, null, 2) }],
    isError: true as const,
  };
}

/**
 * Atlas cards and units.
 *
 * They keep the two things an agent has to weigh before quoting the atlas — the
 * identification class and the rubric — at the top level, rather than buried
 * inside a locale body.
 */
const homericConfidence = z
  .object({
    textual: z.number(),
    archaeological: z.number(),
    scholarly: z.number(),
    geographic: z.number(),
    score: z.number(),
    band: z.string(),
  })
  .partial()
  .passthrough();

const homericCard = z
  .object({
    kind: z.string(),
    id: z.string().optional(),
    slug: z.string(),
    name: z.string(),
    summary: z.string().optional(),
    identification: z.string().optional(),
    region: z.string().optional(),
    work: z.string().optional(),
    citation: z.string().optional(),
    unlocated: z.boolean().optional(),
    hypotheses: z.number().optional(),
    confidence: homericConfidence.nullable().optional(),
    canonical_url: z.string().optional().describe("Cite this URL."),
    api_url: z.string().optional(),
  })
  .passthrough();

const homericListOutput = {
  count: z.number(),
  results: z.array(homericCard),
};

const homericUnitOutput = z.object({}).passthrough();

/**
 * Claims get their own shape for the same reason the atlas does: forcing them
 * into the corpus card would mean inventing an `evidence` block they do not
 * have. A claim is not a unit with provenance — it IS the provenance, and what
 * it carries instead is the rung of the ladder it sits on.
 */
const claimCard = z.object({
  type: z.literal("claim"),
  id: z.string(),
  slug: z.string(),
  claim_type: z.enum(["observed_fact", "industry_synthesis", "santismm_thesis", "strategic_hypothesis"]),
  confidence_level: z.string(),
  statement: z.string().optional(),
  supports: z.array(z.string()),
  reviewed: z.string(),
});

const claimListOutput = { count: z.number(), results: z.array(claimCard) };
const claimUnitOutput = z.object({}).passthrough();

const articleCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  language: z.string(),
  published: z.string(),
  modified: z.string(),
  topics: z.array(z.string()),
  translation_key: z.string().optional(),
  canonical_url: z.string().describe("Cite this URL."),
  api_url: z.string(),
});

const articleUnitOutput = articleCardSchema.extend({
  body: z.string().describe("Full Markdown-like article body."),
});

const articleListOutput = { count: z.number(), results: z.array(articleCardSchema) };
const articleSearchOutput = {
  query: z.string(),
  count: z.number(),
  results: z.array(articleCardSchema.extend({
    score: z.number(),
    matchedFields: z.array(z.string()),
    matchedTerms: z.array(z.string()),
  })),
};

const relatedContentSchema = z.object({
  title: z.string(),
  url: z.string(),
  relationship: z.string(),
});

/**
 * Un lab es una de dos cosas y el contrato lo dice en vez de difuminarlo.
 *
 * Las diez que ejecuta el servicio federado traen fórmulas, entradas, salidas
 * y supuestos: eso es lo que hace verificable un cálculo y no se afloja a
 * opcional para que quepan las otras. Las once del ápice son páginas que se
 * leen —el Atlas Homérico, el sandbox, la taxonomía, los benchmarks, los
 * atlas deportivos— y declararles `inputs: []` sería mentir con la forma.
 *
 * `executable` es el discriminante, y responde la única pregunta que un
 * agente necesita antes de decidir qué hacer con la unidad: ¿esto se calcula
 * o esto se lee?
 */
const executableLabSchema = z.object({
  executable: z.literal(true),
  owner_server: z.string().describe("Host that serves and versions this unit."),
  slug: z.string(),
  kind: z.enum(["calculator", "converter", "experiment", "educational-game"]),
  label: z.string(),
  title: z.string(),
  description: z.string(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  formulas: z.array(z.string()).optional(),
  assumptions: z.array(z.string()),
  version: z.string(),
  updated: z.string(),
  canonical_url: z.string().describe("Cite this URL."),
  api_url: z.string(),
  calculation_url: z.string().optional(),
  related_content: z.array(relatedContentSchema).optional(),
});

const pageLabSchema = z.object({
  executable: z.literal(false),
  owner_server: z.string().describe("Host that serves this unit."),
  slug: z.string(),
  category: z.string().describe("benchmarks, simulators, experiments, games…"),
  status: z.string(),
  title: z.string(),
  summary: z.string().optional(),
  canonical_url: z.string().describe("Cite this URL."),
});

const labCardSchema = z.discriminatedUnion("executable", [executableLabSchema, pageLabSchema]);

const labListOutput = { count: z.number(), results: z.array(labCardSchema) };

const calculationBaseSchema = z.object({
  schema_version: z.string(),
  source: z.string(),
  language: z.string(),
  slug: z.string(),
  version: z.string(),
  updated: z.string(),
  canonical_url: z.string().describe("Cite this URL."),
  api_url: z.string(),
  methodology_url: z.string(),
  inputs: z.record(z.string(), z.number()),
  units: z.record(z.string(), z.string()),
  interpretation: z.string(),
  assumptions: z.array(z.string()),
  formulas: z.array(z.string()),
  warnings: z.array(z.string()),
  license: z.object({ name: z.string(), spdx: z.string(), url: z.string() }),
});

const agentEconomicsOutput = calculationBaseSchema.extend({
  results: z.object({
    attempts: z.number(), executionCost: z.number(), reviewCost: z.number(), failedCases: z.number(),
    reworkCost: z.number(), operatingCost: z.number(), manualCost: z.number(), savings: z.number(),
    roi: z.number(), successfulOutcomes: z.number(), costPerSuccess: z.number(), costPerResolved: z.number(),
    breakEvenSuccess: z.number(),
    verdict: z.object({ tone: z.enum(["positive", "watch", "negative"]), title: z.string(), body: z.string() }),
  }),
});

const evaluationSampleOutput = calculationBaseSchema.extend({
  results: z.object({ detect: z.number(), estimate: z.number(), expected: z.number(), zero: z.number() }),
});

const humanSupervisionOutput = calculationBaseSchema.extend({
  results: z.object({
    routine: z.number(), escalations: z.number(), workload: z.number(), productivePerFte: z.number(),
    requiredFte: z.number(), headroom: z.number(), cost: z.number(), backlogDays: z.number(),
    sustainableVolume: z.number(),
  }),
});

const globalSearchCard = z.object({
  surface: z.enum(SEARCH_SURFACES),
  score: z.number(),
  source_score: z.number(),
  rank_within_surface: z.number(),
  id: z.string().optional(),
  slug: z.string(),
  domain: z.string().optional(),
  kind: z.string().optional(),
  title: z.string(),
  summary: z.string().optional(),
  canonical_url: z.string().optional(),
  api_url: z.string().optional(),
  calculation_url: z.string().optional(),
  suggested_tool: z.string(),
  matchedFields: z.array(z.string()),
  matchedTerms: z.array(z.string()),
}).passthrough();

const globalSearchOutput = {
  query: z.string(),
  count: z.number(),
  results: z.array(globalSearchCard),
  unavailable_surfaces: z.array(z.object({
    surface: z.enum(["articles", "labs"]),
    error: z.string(),
    retry_tool: z.string(),
  })),
};

function articleFailure(error: unknown) {
  const body = {
    error: "articles_unavailable",
    source: ARTICLES_API_URL,
    hint: "The first-party Articles API could not be read. Retry later or use its llms-full.txt corpus directly.",
    detail: error instanceof Error ? error.message : String(error),
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }],
    isError: true as const,
  };
}

function articleNotFound(articles: Article[], slug: string) {
  const available = articles.map((article) => article.slug).sort();
  const body = {
    error: "not_found",
    domain: "articles",
    slug,
    available_count: available.length,
    available,
    list_tool: "list_articles",
    hint: "Call list_articles for every valid slug; article slugs are not interchangeable with core corpus identifiers.",
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }],
    isError: true as const,
  };
}

function labsFailure(error: unknown) {
  const body = {
    error: "labs_unavailable",
    source: LABS_API_URL,
    hint: "The first-party Labs API could not be read. Retry later or bind directly to its OpenAPI document.",
    detail: error instanceof Error ? error.message : String(error),
  };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }], isError: true as const };
}

function globalSearchFailure(error: unknown) {
  const body = {
    error: "federated_search_unavailable",
    hint: "One federated source could not be read. Retry search_all with a restricted surfaces array, or use search for the local core corpus.",
    detail: error instanceof Error ? error.message : String(error),
  };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }], isError: true as const };
}

function labNotFound(labs: Array<{ slug: string }>, slug: string) {
  const available = labs.map((lab) => lab.slug).sort();
  const body = {
    error: "not_found",
    domain: "labs",
    slug,
    available_count: available.length,
    available,
    list_tool: "list_labs",
    hint: "Call list_labs for every valid slug. Only Labs with calculation_url can be executed.",
  };
  return { content: [{ type: "text" as const, text: JSON.stringify(body, null, 2) }], isError: true as const };
}

function termsFor(query: string): string[] {
  return queryTerms(query);
}

/**
 * Puntuación por campos con peso, compartida por las superficies que no
 * tienen scorer propio. Este corpus ya arrastra cuatro implementaciones del
 * ranking (núcleo, artículos, labs y claims) y la lección de REG-12 vale
 * igual aquí: dos implementaciones del scoring divergirían. La homérica no
 * añade una quinta — reutiliza ésta.
 */
function fieldScore(
  record: Record<string, unknown>,
  fields: Array<[string, number]>,
  terms: string[],
): { score: number; matchedFields: string[]; matchedTerms: string[] } {
  let score = 0;
  const matchedFields = new Set<string>();
  const matchedTerms = new Set<string>();
  for (const [field, weight] of fields) {
    const value = norm(String(record[field] ?? ""));
    for (const term of terms) {
      if (!value.includes(term)) continue;
      score += weight;
      matchedFields.add(field);
      matchedTerms.add(term);
    }
  }
  const coverage = terms.length > 0 ? matchedTerms.size / terms.length : 0;
  return {
    score: Math.round(score * coverage * coverage * 100) / 100,
    matchedFields: [...matchedFields],
    matchedTerms: [...matchedTerms],
  };
}

function claimSearch(content: McpContent, query: string, locale: Locale, limit: number) {
  const terms = termsFor(query);
  const fields: Array<[string, number]> = [["statement", 7], ["slug", 6], ["id", 5], ["claim_type", 4]];
  return (content.listClaims(undefined, locale) as Array<Record<string, unknown>>)
    .map((claim) => ({ claim, ...fieldScore(claim, fields, terms) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || String(a.claim.id).localeCompare(String(b.claim.id)))
    .slice(0, limit);
}

/**
 * El Atlas Homérico tiene seis herramientas propias desde hace semanas, así
 * que su contenido SÍ es alcanzable — pero `search_all` declaraba cuatro
 * superficies y ninguna era la suya. Quien preguntase por Ítaca en la
 * búsqueda global no encontraba nada y no tenía por qué saber que existe un
 * `list_homeric_places` al que llamar. Es el hueco que REG-17 nombra: no
 * falta contenido, falta que el catálogo represente la superficie entera.
 */
const HOMERIC_TOOL: Record<HomericKind, string> = {
  places: "get_homeric_place",
  episodes: "get_homeric_episode",
  routes: "get_homeric_route",
};

function homericSearch(content: McpContent, query: string, locale: Locale, limit: number) {
  const terms = termsFor(query);
  const fields: Array<[string, number]> = [
    ["name", 8], ["slug", 7], ["summary", 6], ["identification", 5],
    ["region", 4], ["work", 3], ["citation", 2], ["kind", 1],
  ];
  const hits: Array<Record<string, unknown> & { score: number; kind: HomericKind }> = [];
  for (const kind of ["places", "episodes", "routes"] as const)
    for (const raw of content.listHomeric(kind, locale) as Array<Record<string, unknown>>) {
      const scored = fieldScore(raw, fields, terms);
      // A natural question often adds generic qualifiers ("how strong is the
      // evidence?") after naming the entity. Those words may occur together
      // in another entry's prose; an exact slug/name still has to win because
      // it is the object the caller explicitly named.
      const identifiers = [raw.slug, raw.name, raw.id]
        .map((value) => norm(String(value ?? "")))
        .filter(Boolean);
      const exactIdentifier = identifiers.some((identifier) =>
        identifier.split(" ").every((part) => terms.includes(part)),
      );
      const score = scored.score + (exactIdentifier ? 12 : 0);
      if (score > 0) hits.push({ ...raw, ...scored, score, kind });
    }
  return hits
    .sort((a, b) => b.score - a.score || String(a.slug).localeCompare(String(b.slug)))
    .slice(0, limit);
}

const GET_TOOL_FOR_DOMAIN: Record<string, string> = {
  knowledge: "get_knowledge", patterns: "get_pattern", architectures: "get_architecture",
  governance: "get_governance", handbook: "get_handbook",
};

function intentBoost(query: string, surface: (typeof SEARCH_SURFACES)[number]): number {
  // Intent words such as "how many" are useful for routing even though they
  // are deliberately removed from lexical relevance scoring.
  const normal = norm(query);
  if (surface === "labs" && /\b(calcul\w*|how many|cuant\w*|sample|muestra|roi|cost\w*|coste\w*|supervis\w*|fte|capacity|capacidad|break even|token\w*|pages|paginas)\b/.test(normal)) return 30;
  if (surface === "claims" && /\b(claim|claims|evidence|fact|thesis|tesis|hypothesis|hipotesis|falsif|refut)\b/.test(normal)) return 25;
  if (surface === "homeric_atlas" && /\b(homer\w*|homér\w*|iliad\w*|ilíad\w*|odyssey|odisea|odisseia|ithaca|itaca|ítaca|troy|troya|ulysses|ulises|odysseus|odiseo)\b/.test(normal)) return 25;
  if (surface === "articles" && /\b(article|articles|essay|essays|articulo|artículo|ensayo|recent|latest|nuevo|reciente)\b/.test(normal)) return 20;
  return 0;
}

/**
 * Telemetría opcional del servidor alojado.
 *
 * El registro de herramientas es compartido con el CLI de stdio, que
 * deliberadamente no toca Upstash: la analítica es del endpoint alojado, no
 * de una copia que alguien se instaló. Por eso esto se inyecta en vez de
 * importarse — sin hook, el CLI se comporta exactamente igual que antes.
 */
export interface McpTelemetry {
  /** El resultado final que devolvió una herramienta, nunca un sub-buscador. */
  toolResult?(event: McpToolResultEvent): void;
}

/**
 * Wrap the registry once, rather than remembering telemetry in 30 handlers.
 *
 * The callback receives the handler's final value and runs only when a hosted
 * transport injects it. The stdio package passes no telemetry and remains a
 * local, analytics-free server. Telemetry is best-effort: observing a result
 * can never turn that result into an error for the caller.
 */
function withToolResultTelemetry(server: McpToolServer, telemetry?: McpTelemetry): McpToolServer {
  if (!telemetry?.toolResult) return server;
  return {
    registerTool(name, config, handler) {
      return server.registerTool(name, config, async (rawArgs: unknown) => {
        const args = rawArgs && typeof rawArgs === "object"
          ? (rawArgs as Record<string, unknown>)
          : {};
        try {
          const result = await handler(rawArgs);
          try {
            telemetry.toolResult?.({ tool: name, args, result });
          } catch {
            // Analytics can never break a tool response.
          }
          return result;
        } catch (error) {
          try {
            telemetry.toolResult?.({ tool: name, args, error });
          } catch {
            // Preserve the original tool error.
          }
          throw error;
        }
      });
    },
  };
}

export function registerTools(
  server: McpToolServer,
  content: McpContent,
  telemetry?: McpTelemetry,
): void {
  // Reassign the structural adapter so the existing registry remains the
  // single list every validator derives from. Every registerTool below now
  // gains the same final-result boundary without 30 hand-written callbacks.
  server = withToolResultTelemetry(server, telemetry);
  // ── Orientation ────────────────────────────────────────────────────────────
  server.registerTool(
    "get_overview",
    {
      title: "Corpus Overview — Start Here",
      annotations: READ_ONLY,
      description:
        "Get the complete MCP map — start here. Returns the five-domain core plus the separate Article, Labs, Homeric Atlas and claim-registry surfaces, with their tools, identifiers, citation rules, languages, licence and bulk-ingest URLs.",
      inputSchema: z.object({}),
      outputSchema: z.object({
        source: z.string(),
        site: z.string(),
        locales: z.array(z.string()),
        license: z.string(),
        license_spdx: z.string().describe("SPDX id — check this, not the prose."),
        license_url: z.string(),
        total: z.number(),
        domains: z.array(
          z.object({
            domain: z.string(),
            count: z.number(),
            description: z.string(),
            categories: z.array(z.string()),
            tools: z.object({ list: z.string(), get: z.string() }),
            lookup: z.string(),
            url: z.string(),
            api_url: z.string(),
          }),
        ),
        extensions: z.array(
          z.object({
            surface: z.string(),
            description: z.string(),
            tools: z.array(z.string()),
            source: z.string(),
            lookup: z.string(),
            citation: z.string(),
          }),
        ),
        corpus: z
          .object({
            newest_unit: z.string().nullable().describe("Newest unit date in THIS copy (YYYY-MM-DD)."),
            freshness: z.string(),
          })
          .describe(
            "Whether this copy is current. Compare against the hosted endpoint: a lower total or an older newest_unit means you are holding a snapshot, not that the corpus lacks what you asked for.",
          ),
        next: z.string(),
        bulk: z.record(z.string(), z.string()),
      }),
    },
    async () => out({ ...content.overview() }),
  );

  server.registerTool(
    "search_all",
    {
      title: "Search every SANTISMM knowledge surface",
      annotations: READ_ONLY_REMOTE,
      description:
        "Search the core corpus, first-party essays, executable Labs, epistemic claims and the Homeric Atlas in one call. Use this first when a natural-language question might require a calculation, a long-form essay or a claim audit rather than only a core knowledge unit. Results name the next tool to call; calculator-shaped questions are routed toward Labs.",
      inputSchema: z.object({
        query: querySchema.describe("Question or topic, in English, Spanish or Portuguese."),
        surfaces: z.array(z.enum(SEARCH_SURFACES)).min(1).optional()
          .describe("Restrict the search. Omit to search all five surfaces."),
        limit_per_surface: z.number().int().positive().max(10).optional().describe("Maximum hits from each surface. Default: 5."),
        locale: localeSchema,
      }),
      outputSchema: z.object(globalSearchOutput),
    },
    async ({ query, surfaces, limit_per_surface, locale }) => {
      try {
        const selected = new Set<string>(surfaces ?? SEARCH_SURFACES);
        const limit = limit_per_surface ?? 5;
        const lang = (locale ?? "en") as Locale;
        const [articleLoad, labLoad] = await Promise.allSettled([
          selected.has("articles") ? loadArticles() : Promise.resolve([]),
          selected.has("labs") ? loadLabs() : Promise.resolve([]),
        ]);
        const unavailableSurfaces: Array<{ surface: "articles" | "labs"; error: string; retry_tool: string }> = [];
        const articles = articleLoad.status === "fulfilled" ? articleLoad.value : [];
        const labs = labLoad.status === "fulfilled" ? labLoad.value : [];
        if (selected.has("articles") && articleLoad.status === "rejected") {
          unavailableSurfaces.push({
            surface: "articles",
            error: articleLoad.reason instanceof Error ? articleLoad.reason.message : String(articleLoad.reason),
            retry_tool: "search_articles",
          });
        }
        if (selected.has("labs") && labLoad.status === "rejected") {
          unavailableSurfaces.push({
            surface: "labs",
            error: labLoad.reason instanceof Error ? labLoad.reason.message : String(labLoad.reason),
            retry_tool: "list_labs",
          });
        }
        const hits: Array<Record<string, unknown>> = [];

        if (selected.has("core")) {
          const boost = intentBoost(query, "core");
          for (const [index, raw] of (content.search(query, undefined, limit, lang) as Array<Record<string, unknown>>).entries()) {
            const sourceScore = Number(raw.score ?? 0);
            hits.push({
              ...raw,
              surface: "core",
              score: sourceScore + boost,
              source_score: sourceScore,
              rank_within_surface: index + 1,
              title: String(raw.name ?? raw.slug ?? ""),
              suggested_tool: GET_TOOL_FOR_DOMAIN[String(raw.domain)] ?? "search",
              matchedFields: raw.matchedFields ?? [],
              matchedTerms: raw.matchedTerms ?? [],
            });
          }
        }

        if (selected.has("articles")) {
          const boost = intentBoost(query, "articles");
          for (const [index, raw] of searchArticleCorpus(articles, query, limit).entries()) {
            hits.push({
              surface: "articles", score: raw.score + boost, source_score: raw.score,
              rank_within_surface: index + 1, slug: raw.slug, title: raw.title, summary: raw.summary,
              canonical_url: raw.canonical_url, api_url: raw.api_url, suggested_tool: "get_article",
              matchedFields: raw.matchedFields, matchedTerms: raw.matchedTerms,
            });
          }
        }

        if (selected.has("labs")) {
          const boost = intentBoost(query, "labs");
          const calculatorTools: Record<string, string> = {
            "agent-economics": "calculate_agent_economics",
            "evaluation-sample-size": "calculate_evaluation_sample_size",
            "human-supervision-capacity": "calculate_human_supervision_capacity",
          };
          for (const [index, raw] of searchLabCorpus(labs, query, limit).entries()) {
            hits.push({
              surface: "labs", score: raw.score + boost, source_score: raw.score,
              rank_within_surface: index + 1, slug: raw.slug, kind: raw.kind, title: raw.title,
              summary: raw.description, canonical_url: raw.canonical_url, api_url: raw.api_url,
              calculation_url: raw.calculation_url,
              suggested_tool: calculatorTools[raw.slug] ?? "get_lab",
              matchedFields: raw.matchedFields, matchedTerms: raw.matchedTerms,
            });
          }
        }

        if (selected.has("claims")) {
          const boost = intentBoost(query, "claims");
          for (const [index, raw] of claimSearch(content, query, lang, limit).entries()) {
            const claim = raw.claim;
            hits.push({
              surface: "claims", score: raw.score + boost, source_score: raw.score,
              rank_within_surface: index + 1, id: claim.id, slug: claim.slug,
              kind: claim.claim_type, title: String(claim.statement ?? claim.slug),
              summary: `Epistemic type: ${String(claim.claim_type)}; confidence: ${String(claim.confidence_level)}.`,
              suggested_tool: "get_claim", matchedFields: raw.matchedFields, matchedTerms: raw.matchedTerms,
            });
          }
        }

        if (selected.has("homeric_atlas")) {
          const boost = intentBoost(query, "homeric_atlas");
          for (const [index, raw] of homericSearch(content, query, lang, limit).entries()) {
            hits.push({
              surface: "homeric_atlas", score: raw.score + boost, source_score: raw.score,
              rank_within_surface: index + 1, slug: raw.slug, kind: raw.kind,
              title: String(raw.name ?? raw.slug), summary: raw.summary,
              canonical_url: raw.canonical_url, api_url: raw.api_url,
              suggested_tool: HOMERIC_TOOL[raw.kind],
              matchedFields: raw.matchedFields, matchedTerms: raw.matchedTerms,
            });
          }
        }

        hits.sort((a, b) => Number(b.score) - Number(a.score) || Number(a.rank_within_surface) - Number(b.rank_within_surface));
        return out({ query, count: hits.length, results: hits, unavailable_surfaces: unavailableSurfaces }, hits);
      } catch (error) {
        return globalSearchFailure(error);
      }
    },
  );

  // ── Knowledge base ─────────────────────────────────────────────────────────
  server.registerTool(
    "list_knowledge",
    {
      title: "List Agentic AI Knowledge Units",
      annotations: READ_ONLY,
      description:
        "List all knowledge units (concepts on agentic & enterprise AI) with slug, category, title, summary and Evidence-First provenance. Use this to browse the domain; use `search` when you have a question rather than a slug.",
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: listOutput,
    },
    async ({ locale }) => outList(content.listDomain("knowledge", (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_knowledge",
    {
      title: "Get an Agentic AI Knowledge Unit",
      annotations: READ_ONLY,
      description:
        "Get one knowledge unit by slug. Returns the full entry, or a single-locale body if locale is given. Use this once `search` or `list_knowledge` has given you a slug.",
      inputSchema: z.object({ slug: slugSchema.describe("Knowledge unit slug, e.g. 'harness-engineering'."), locale: localeSchema }),
      outputSchema: unitGetOutput,
    },
    async ({ slug, locale }) => {
      const entry = content.getEntry("knowledge", slug, locale as Locale | undefined);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "knowledge", slug, (locale ?? "en") as Locale);
    },
  );

  // ── Patterns ───────────────────────────────────────────────────────────────
  server.registerTool(
    "list_patterns",
    {
      title: "List Enterprise AI Patterns",
      annotations: READ_ONLY,
      description:
        "List all Enterprise AI patterns (reusable agentic design patterns) with slug, category, name, summary and provenance. Use this to browse the catalogue; use `search` when you are looking for a pattern that solves a problem.",
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: listOutput,
    },
    async ({ locale }) => outList(content.listDomain("patterns", (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_pattern",
    {
      title: "Get an Enterprise AI Pattern",
      annotations: READ_ONLY,
      description:
        "Get one Enterprise AI pattern by slug (includes problem, solution, KPIs, failure modes, lessons). Use this once `search` or `list_patterns` has given you a slug.",
      inputSchema: z.object({ slug: slugSchema.describe("Pattern slug, e.g. 'human-approval-gate'."), locale: localeSchema }),
      outputSchema: unitGetOutput,
    },
    async ({ slug, locale }) => {
      const entry = content.getEntry("patterns", slug, locale as Locale | undefined);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "patterns", slug, (locale ?? "en") as Locale);
    },
  );

  // ── Reference architectures ────────────────────────────────────────────────
  server.registerTool(
    "list_architectures",
    {
      title: "List Agentic Reference Architectures",
      annotations: READ_ONLY,
      description:
        "List all reference architectures (end-to-end enterprise agentic blueprints) with id, slug, category, name, summary and provenance. Use this to browse the blueprints; use `search` when you have a use case rather than a name.",
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: listOutput,
    },
    async ({ locale }) => outList(content.listDomain("architectures", (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_architecture",
    {
      title: "Get an Agentic Reference Architecture",
      annotations: READ_ONLY,
      description:
        "Get one reference architecture by slug (includes the request flow, reference scenario, KPIs, cost & scaling, and the patterns/knowledge it composes). Use this once `search` or `list_architectures` has given you a slug.",
      inputSchema: z.object({ slug: slugSchema.describe("Architecture slug, e.g. 'customer-service-agent'."), locale: localeSchema }),
      outputSchema: unitGetOutput,
    },
    async ({ slug, locale }) => {
      const entry = content.getEntry("architectures", slug, locale as Locale | undefined);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "architectures", slug, (locale ?? "en") as Locale);
    },
  );

  // ── Governance ─────────────────────────────────────────────────────────────
  server.registerTool(
    "list_governance",
    {
      title: "List AI Governance Units",
      annotations: READ_ONLY,
      description:
        "List all AI governance units (regulations, standards, frameworks, playbooks — EU AI Act, ISO 42001, NIST AI RMF, agentic checklist) with id, slug, category, name and summary. Use this to browse the regulations and standards; use `search` for an obligation or control.",
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: listOutput,
    },
    async ({ locale }) => outList(content.listDomain("governance", (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_governance",
    {
      title: "Get an AI Governance Unit",
      annotations: READ_ONLY,
      description:
        "Get one AI governance unit by slug (includes scope, key requirements, implementable controls, a checklist and common pitfalls). Use this once `search` or `list_governance` has given you a slug.",
      inputSchema: z.object({ slug: slugSchema.describe("Governance unit slug, e.g. 'eu-ai-act'."), locale: localeSchema }),
      outputSchema: unitGetOutput,
    },
    async ({ slug, locale }) => {
      const entry = content.getEntry("governance", slug, locale as Locale | undefined);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "governance", slug, (locale ?? "en") as Locale);
    },
  );

  // ── Harness Engineering Handbook ───────────────────────────────────────────
  server.registerTool(
    "list_handbook",
    {
      title: "List Harness Engineering Handbook Chapters",
      annotations: READ_ONLY,
      description:
        "List the Harness Engineering Handbook chapters (HRN-001…): the canonical long-form corpus on harness engineering — definition, history, taxonomy, principles, memory, observability, evaluation, governance, planning, orchestration, security, case studies, glossary and bibliography. Use this to see the chapter map; use `search` when you have a topic rather than a chapter.",
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: listOutput,
    },
    async ({ locale }) => outList(content.listHandbook((locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_handbook",
    {
      title: "Get a Harness Engineering Handbook Chapter",
      annotations: READ_ONLY,
      description:
        "Get one Harness Engineering Handbook chapter, by id (e.g. 'HRN-001') or slug. Returns the full Markdown body plus its provenance and related ids. Use this once `search` or `list_handbook` has given you an id.",
      inputSchema: z.object({
        id: slugSchema.describe("Chapter id like 'HRN-001', or its slug."),
        locale: localeSchema,
      }),
      outputSchema: unitOutput.extend({
        body: z.string().optional().describe("Full Markdown body of the chapter."),
        requested_locale: z.string().optional().describe("The locale that was asked for."),
        resolved_locale: z
          .string()
          .optional()
          .describe("The locale actually returned. Chapters are authored in English and translated; where a translation exists this equals the requested locale, and `fallback` says when it does not."),
        fallback: z.boolean().optional().describe("True when the body is not in the requested locale."),
      }),
    },
    async ({ id, locale }) => {
      const entry = content.getHandbookChapter(id, (locale ?? "en") as Locale);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "handbook", id, (locale ?? "en") as Locale);
    },
  );

  // ── Search ─────────────────────────────────────────────────────────────────
  server.registerTool(
    "search",
    {
      title: "Search Harness Engineering & Agentic AI",
      annotations: READ_ONLY,
      description:
        "Ranked keyword search across the whole corpus (knowledge, patterns, architectures, governance and the handbook). Matches every language and ignores accents, so query in the user's own words. Each hit carries a relevance score and the fields it matched; follow up with the matching get_* tool for full detail. Use this before any `get_*` tool whenever you have a question rather than an identifier.",
      inputSchema: z.object({
        query: querySchema.describe("Keyword or phrase to search for, in any of en/es/pt."),
        domains: z
          .array(z.enum(["knowledge", "patterns", "architectures", "governance", "handbook"]))
          .optional()
          .describe("Restrict to these domains. Omit to search everything, including the handbook."),
        limit: z.number().int().positive().max(100).optional().describe("Max results (default 20)."),
        locale: localeSchema,
      }),
      outputSchema: searchOutput,
    },
    async ({ query, domains, limit, locale }) => {
      const results = content.search(
        query,
        domains as Domain[] | undefined,
        limit ?? 20,
        (locale ?? "en") as Locale,
      );
      return outList(results, { query });
    },
  );

  // ── First-party articles (federated) ─────────────────────────────────────
  server.registerTool(
    "list_articles",
    {
      title: "List first-party essays",
      annotations: READ_ONLY_REMOTE,
      description:
        "List every long-form essay published on articles.santismm.com, with language, dates, topics and citable canonical URLs. Use this to browse the essay catalogue; use `search_articles` when you have a topic rather than a slug.",
      inputSchema: z.object({
        locale: localeSchema.describe("Restrict to en, es or pt. Omit to return every language."),
      }),
      outputSchema: articleListOutput,
    },
    async ({ locale }) => {
      try {
        const articles = articlesForLocale(await loadArticles(), locale as Locale | undefined);
        return outList(articles.map(articleCard));
      } catch (error) {
        return articleFailure(error);
      }
    },
  );

  server.registerTool(
    "get_article",
    {
      title: "Get a first-party essay",
      annotations: READ_ONLY_REMOTE,
      description:
        "Get one complete essay by slug, including its clean Markdown-like body, metadata, licence context and canonical URL. Use this after `list_articles` or `search_articles` has returned the slug you need.",
      inputSchema: z.object({
        slug: slugSchema.describe("Article slug, e.g. 'the-stopwatch-and-the-exam'."),
      }),
      outputSchema: articleUnitOutput,
    },
    async ({ slug }) => {
      try {
        const articles = await loadArticles();
        const article = articles.find((candidate) => candidate.slug === slug);
        return article ? out(article as unknown as Record<string, unknown>) : articleNotFound(articles, slug);
      } catch (error) {
        return articleFailure(error);
      }
    },
  );

  server.registerTool(
    "search_articles",
    {
      title: "Search first-party essays",
      annotations: READ_ONLY_REMOTE,
      description:
        "Ranked, accent-insensitive full-text search over every first-party essay, including titles, summaries, topics and bodies. Use this when you need long-form analysis about a topic; follow with `get_article` for the complete essay.",
      inputSchema: z.object({
        query: querySchema.describe("Keyword or phrase to search for in any supported language."),
        locale: localeSchema.describe("Restrict to en, es or pt. Omit to search every language."),
        limit: z.number().int().positive().max(20).optional().describe("Maximum results (default 10)."),
      }),
      outputSchema: articleSearchOutput,
    },
    async ({ query, locale, limit }) => {
      try {
        const articles = articlesForLocale(await loadArticles(), locale as Locale | undefined);
        return outList(searchArticleCorpus(articles, query, limit ?? 10), { query });
      } catch (error) {
        return articleFailure(error);
      }
    },
  );

/**
 * Las 21 unidades que el sitio llama lab, en un solo listado.
 *
 * Eran dos catálogos con el mismo nombre: `labs.santismm.com/api/labs` sirve
 * las diez que ejecuta —con fórmulas, entradas, salidas y endpoint de cálculo—
 * y el ápice publica esas diez más once páginas propias: el Atlas Homérico, el
 * sandbox de control, la taxonomía, los benchmarks y los tres atlas
 * deportivos. `ai-index.json` anunciaba `count: 21` y `list_labs` devolvía 10,
 * así que un agente que leyera el índice y llamara a la herramienta no podía
 * alcanzar once de ellas por ninguna vía.
 *
 * La definición ejecutable gana cuando existe: trae todo lo que trae la
 * entrada del catálogo y además las fórmulas. `owner_server` dice quién sirve
 * cada unidad, que es lo que distingue «esto se calcula» de «esto se lee».
 *
 * Deliberadamente sin `resource_uri`: los Resources de MCP no existen todavía
 * (REG-19), y anunciar un identificador que no resuelve es el fallo que SEG-06
 * documentó — cuesta más que una función que falta.
 */
const LABS_HOST = new URL(LABS_API_URL).host;

async function mergedLabs(
  content: McpContent,
  kind?: string,
): Promise<Array<Record<string, unknown>>> {
  const ejecutables = await loadLabs();
  const porSlug = new Map<string, Record<string, unknown>>();
  for (const entrada of content.listSiteLabs())
    porSlug.set(String(entrada.slug), { ...entrada, executable: false });
  for (const lab of ejecutables) {
    // Sin heredar la entrada del catálogo: `category`/`status`/`summary`
    // dirían con otras palabras lo que `kind`/`description` ya dicen, y dos
    // vocabularios para un concepto es justo lo que SEG-07 limpió.
    porSlug.set(lab.slug, {
      ...(lab as unknown as Record<string, unknown>),
      owner_server: LABS_HOST,
      executable: true,
    });
  }
  const todos = [...porSlug.values()];
  return kind ? todos.filter((lab) => lab.kind === kind) : todos;
}

  // ── SANTISMM Labs (federated metadata + deterministic execution) ─────────
  server.registerTool(
    "list_labs",
    {
      title: "List calculators, converters, experiments and educational Labs",
      annotations: READ_ONLY_REMOTE,
      description:
        "List every SANTISMM Lab with its inputs, outputs, assumptions, formulas and citation URL. Use this to discover interactive and machine-readable tools; filter by kind when the user specifically asks for a calculator, converter, experiment or educational game.",
      inputSchema: z.object({
        kind: z.enum(["calculator", "converter", "experiment", "educational-game"]).optional(),
      }),
      outputSchema: z.object(labListOutput),
    },
    async ({ kind }) => {
      try {
        return outList(await mergedLabs(content, kind));
      } catch (error) {
        return labsFailure(error);
      }
    },
  );

  server.registerTool(
    "get_lab",
    {
      title: "Get one SANTISMM Lab definition",
      annotations: READ_ONLY_REMOTE,
      description:
        "Get one Lab by slug, including formulas, assumptions, related SANTISMM content and its executable endpoint when one exists. Use this after list_labs or search_all; use the named calculate_* tool rather than reimplementing a published formula.",
      inputSchema: z.object({ slug: slugSchema.describe("Lab slug, e.g. 'evaluation-sample-size'.") }),
      outputSchema: labCardSchema,
    },
    async ({ slug }) => {
      try {
        const labs = await mergedLabs(content);
        const lab = labs.find((candidate) => candidate.slug === slug);
        return lab
          ? out(lab as unknown as Record<string, unknown>)
          : labNotFound(labs as Array<{ slug: string }>, slug);
      } catch (error) {
        return labsFailure(error);
      }
    },
  );

  server.registerTool(
    "calculate_agent_economics",
    {
      title: "Calculate the operational economics of an AI agent",
      annotations: READ_ONLY_REMOTE,
      description:
        "Calculate monthly operating cost, cost per verified outcome, manual baseline, savings, ROI and break-even success rate from explicit assumptions. Use this for an agent business case or scenario comparison; keep every monetary input in the same currency and cite the returned canonical_url.",
      inputSchema: z.object({
        monthlyVolume: z.number().min(0).max(1_000_000_000).describe("Cases attempted per month."),
        manualMinutes: z.number().min(0).max(10_080).describe("Manual handling time per case."),
        hourlyCost: z.number().min(0).max(1_000_000).describe("Fully loaded human hourly cost, in the chosen currency."),
        inputTokens: z.number().min(0).max(100_000_000).describe("Input tokens per agent attempt."),
        outputTokens: z.number().min(0).max(100_000_000).describe("Output tokens per agent attempt."),
        inputPrice: z.number().min(0).max(1_000_000).describe("Model input price per million tokens, in the chosen currency."),
        outputPrice: z.number().min(0).max(1_000_000).describe("Model output price per million tokens, in the chosen currency."),
        toolCost: z.number().min(0).max(1_000_000).describe("External tool cost per attempt."),
        retryRate: z.number().min(0).max(500).describe("Extra attempts as a percentage of initial volume."),
        successRate: z.number().min(1).max(100).describe("Correctly verified outcomes as a percentage of cases."),
        reviewRate: z.number().min(0).max(100).describe("Share of cases reviewed by a person."),
        reviewMinutes: z.number().min(0).max(10_080).describe("Human review minutes per reviewed case."),
        reworkMinutes: z.number().min(0).max(10_080).describe("Human rework minutes per failed case."),
        locale: localeSchema.describe("Language for interpretations, assumptions, formulas and warnings (default en)."),
      }),
      outputSchema: agentEconomicsOutput,
    },
    async ({ locale, ...inputs }) => {
      try {
        return out(await executeLabCalculator("agent-economics", inputs, (locale ?? "en") as Locale));
      } catch (error) {
        return labsFailure(error);
      }
    },
  );

  server.registerTool(
    "calculate_evaluation_sample_size",
    {
      title: "Calculate an agent evaluation sample size",
      annotations: READ_ONLY_REMOTE,
      description:
        "Calculate two different samples: how many independent evaluations are needed to detect at least one failure, and how many are needed to estimate its rate at a chosen margin. Use this when a user asks how many tests are enough; do not interpret zero observed failures as proof of zero risk.",
      inputSchema: z.object({
        failureRate: z.number().min(0.0001).max(99.9999).describe("Failure rate to detect, in percent."),
        confidence: z.union([z.literal(90), z.literal(95), z.literal(99)]).describe("Confidence level, in percent."),
        margin: z.number().min(0.1).max(50).describe("Margin for estimating the failure rate, in percentage points."),
        population: z.number().min(1).max(1_000_000_000).describe("Number of distinct evaluable cases."),
        locale: localeSchema.describe("Language for interpretations, assumptions, formulas and warnings (default en)."),
      }),
      outputSchema: evaluationSampleOutput,
    },
    async ({ locale, ...inputs }) => {
      try {
        return out(await executeLabCalculator("evaluation-sample-size", inputs, (locale ?? "en") as Locale));
      } catch (error) {
        return labsFailure(error);
      }
    },
  );

  server.registerTool(
    "calculate_human_supervision_capacity",
    {
      title: "Calculate human supervision capacity for an AI agent",
      annotations: READ_ONLY_REMOTE,
      description:
        "Calculate review and escalation workload, required FTE, available headroom or backlog, monthly labour cost and sustainable case volume. Use this before production rollout to test whether the stated human-oversight model is operationally credible; the result uses averages and is not a queueing simulation.",
      inputSchema: z.object({
        volume: z.number().min(0).max(1_000_000_000).describe("Agent cases per month."),
        sample: z.number().min(0).max(100).describe("Share of all cases selected for routine review, in percent."),
        reviewMinutes: z.number().min(0).max(10_080).describe("Minutes per routine review."),
        escalationRate: z.number().min(0).max(100).describe("Share of cases escalated, in percent."),
        escalationMinutes: z.number().min(0).max(10_080).describe("Minutes per escalation."),
        workdays: z.number().min(1).max(31).describe("Working days per month."),
        hoursDay: z.number().min(0.1).max(24).describe("Paid hours per working day."),
        utilization: z.number().min(1).max(100).describe("Share of paid time available for review and escalation, in percent."),
        reviewers: z.number().min(0.1).max(1_000_000).describe("Available reviewer FTE."),
        hourlyCost: z.number().min(0).max(1_000_000).describe("Fully loaded reviewer hourly cost, in the chosen currency."),
        locale: localeSchema.describe("Language for interpretations, assumptions, formulas and warnings (default en)."),
      }),
      outputSchema: humanSupervisionOutput,
    },
    async ({ locale, ...inputs }) => {
      try {
        return out(await executeLabCalculator("human-supervision-capacity", inputs, (locale ?? "en") as Locale));
      } catch (error) {
        return labsFailure(error);
      }
    },
  );

  // ── Graph traversal ────────────────────────────────────────────────────────
  server.registerTool(
    "get_related",
    {
      title: "Traverse the Knowledge Graph",
      annotations: READ_ONLY,
      description:
        "Traverse the knowledge graph: given a unit, return its neighbours — the units it links to (outgoing) and the units that reference it (incoming), each with the relationship type. Use this after a `get_*` call to widen an answer with adjacent units.",
      inputSchema: z.object({
        domain: z.enum(["knowledge", "patterns", "architectures", "governance", "handbook"]),
        slug: z
          .string()
          .describe("Slug of the unit to start from (or an HRN id when domain is 'handbook')."),
        locale: localeSchema,
      }),
      outputSchema: z.object({
        unit: cardSchema,
        outgoing: z.array(cardSchema.extend({ type: z.string() })),
        incoming: z.array(cardSchema.extend({ type: z.string() })),
      }),
    },
    async ({ domain, slug, locale }) => {
      const result = content.related(domain as Domain, slug, (locale ?? "en") as Locale);
      return result ? out(result as Record<string, unknown>) : noEncontrado(content, domain as EspacioNombre, slug, (locale ?? "en") as Locale);
    },
  );

  // ── Homeric Atlas (Labs) ───────────────────────────────────────────────────
  const atlasNote =
    "Identification classes: accepted (an excavated site with consensus), plausible (a real place, contested), speculative (a minority reading or a later tradition), mythical (the poem places it outside the mappable world). Confidence is a published 0-12 rubric - textual, archaeological, scholarly and geographic, 0-3 each - and is an editorial judgement, not a probability.";

  server.registerTool(
    "list_homeric_places",
    {
      title: "List Homeric Atlas places",
      annotations: READ_ONLY,
      description:
        "List every place in the Homeric Atlas with its identification class, its confidence score and how many competing identifications it carries. Use this to browse the atlas; use `get_homeric_place` once you have a slug. " +
        atlasNote,
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: homericListOutput,
    },
    async ({ locale }) => outList(content.listHomeric("places", (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_homeric_place",
    {
      title: "Get a Homeric Atlas place",
      annotations: READ_ONLY,
      description:
        "Get one place by slug: every identification proposed for it, each with its own coordinates, class, 0-12 rubric and sources, plus the attested passages. Use this when you need to weigh the evidence for a location, or to cite it; a place the poem does not locate carries no coordinates at all.",
      inputSchema: z.object({
        slug: z.string().describe("Place slug, e.g. 'ithaca'."),
        locale: localeSchema,
      }),
      outputSchema: homericUnitOutput,
    },
    async ({ slug, locale }) => {
      const entry = content.getHomeric("places", slug, locale as Locale | undefined);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "homeric/places", slug, (locale ?? "en") as Locale);
    },
  );
  server.registerTool(
    "list_homeric_episodes",
    {
      title: "List Homeric Atlas episodes",
      annotations: READ_ONLY,
      description:
        "List every episode of the Iliad and the Odyssey held in the atlas, in reading order, with its passage, the places it involves and how firmly it can be located. Use this to find the episode you want; use `get_homeric_episode` for its theories and sources.",
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: homericListOutput,
    },
    async ({ locale }) => outList(content.listHomeric("episodes", (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_homeric_episode",
    {
      title: "Get a Homeric Atlas episode",
      annotations: READ_ONLY,
      description:
        "Get one episode by slug: the passage, the narrative, the competing theories about where it happened (each with its proponent and sources), the confidence rubric and the FAQs. Use this when the question is where an episode took place and who argued for it.",
      inputSchema: z.object({
        slug: z.string().describe("Episode slug, e.g. 'nekyia'."),
        locale: localeSchema,
      }),
      outputSchema: homericUnitOutput,
    },
    async ({ slug, locale }) => {
      const entry = content.getHomeric("episodes", slug, locale as Locale | undefined);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "homeric/episodes", slug, (locale ?? "en") as Locale);
    },
  );
  server.registerTool(
    "list_homeric_routes",
    {
      title: "List Homeric Atlas routes",
      annotations: READ_ONLY,
      description:
        "List the reconstructed itineraries (the nostos of Odysseus and the others), each with its rival reconstructions scored separately. Use this to see which voyages the atlas reconstructs before fetching one.",
      inputSchema: z.object({ locale: localeSchema }),
      outputSchema: homericListOutput,
    },
    async ({ locale }) => outList(content.listHomeric("routes", (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_homeric_route",
    {
      title: "Get a Homeric Atlas route",
      annotations: READ_ONLY,
      description:
        "Get one route by slug: each reconstruction variant with its ordered stops, the hypothesis chosen at each stop, its confidence rubric and its sources. Use this to compare rival reconstructions of a voyage: they are returned side by side rather than merged.",
      inputSchema: z.object({
        slug: z.string().describe("Route slug, e.g. 'odysseus-nostos'."),
        locale: localeSchema,
      }),
      outputSchema: homericUnitOutput,
    },
    async ({ slug, locale }) => {
      const entry = content.getHomeric("routes", slug, locale as Locale | undefined);
      return entry ? out(entry as Record<string, unknown>) : noEncontrado(content, "homeric/routes", slug, (locale ?? "en") as Locale);
    },
  );

  // ── Claims (ADR 0003) ────────────────────────────────────────────────────
  // Everything else in this server answers "what does the corpus say?". These
  // two answer "how strongly, and on what?" — which of the corpus's statements
  // are observed fact, which are a reading of the industry, which are our own
  // position and which are a bet. Without them an agent has to infer the
  // epistemic status from prose, and prose does not distinguish those.
  server.registerTool(
    "list_claims",
    {
      title: "List the corpus claims and their epistemic status",
      annotations: READ_ONLY,
      description:
        "List the load-bearing claims of the corpus, each tagged as observed_fact, industry_synthesis, santismm_thesis or strategic_hypothesis, with its confidence and the units it underpins. Use this before quoting the handbook to know whether a statement is evidence, a reading of the industry, or a position taken. Filter by `claim_type` to get only what is checkable.",
      inputSchema: z.object({
        claim_type: z
          .enum(["observed_fact", "industry_synthesis", "santismm_thesis", "strategic_hypothesis"])
          .optional()
          .describe("Restrict to one rung of the ladder. Omit for all."),
        locale: localeSchema,
      }),
      outputSchema: claimListOutput,
    },
    async ({ claim_type, locale }) => outList(content.listClaims(claim_type, (locale ?? "en") as Locale)),
  );
  server.registerTool(
    "get_claim",
    {
      title: "Get one claim with its limits and what would refute it",
      annotations: READ_ONLY,
      description:
        "Get one claim by id (HE-CLAIM-001) or slug: the statement, what it rests on, its structured sources, and — always present — what it does NOT establish and the observation that would retire it. Use this to cite the corpus honestly, or to check whether a result you have just measured confirms or falsifies a claim it makes.",
      inputSchema: z.object({
        id: z.string().describe("Claim id (e.g. 'HE-CLAIM-001') or slug."),
        locale: localeSchema,
      }),
      outputSchema: claimUnitOutput,
    },
    async ({ id, locale }) => {
      const c = content.getClaim(id, locale as Locale | undefined);
      return c ? out(c as Record<string, unknown>) : noEncontrado(content, "claims", id, (locale ?? "en") as Locale);
    },
  );
}

/**
 * The tools this server exposes, as advertised metadata (name + description).
 * Derived by running the same `registerTools` registry against a capturing
 * stub, so discovery surfaces (ai-index.json, llms.txt, the /mcp docs page) can
 * list the tools without hardcoding — the advertised set can never drift from
 * what the server actually registers. Handlers are never invoked here, so the
 * injected content provider is a no-op.
 */
export function toolManifest(): Array<{ name: string; description: string }> {
  const tools: Array<{ name: string; description: string }> = [];
  const capture: McpToolServer = {
    registerTool(name: string, config: { description?: string }) {
      tools.push({ name, description: config.description ?? "" });
      return undefined;
    },
  };
  const noopContent = new Proxy({}, { get: () => () => undefined }) as unknown as McpContent;
  registerTools(capture, noopContent);
  return tools;
}
