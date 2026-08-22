import { z } from "zod";
import type { Domain, Locale } from "./content.js";
import type { CorpusOverview } from "./shape.js";

/**
 * Single, framework-agnostic definition of the Santismm Knowledge MCP server:
 * its identity and the tool registry. Both transports — the stdio CLI
 * (`mcp/src/index.ts`) and the HTTP endpoint (`app/mcp/route.ts`) — call
 * `registerTools(server, content)`, so the exposed tools can never drift
 * between them. The data source is injected as `content` (an `McpContent`
 * provider); both providers read the same `content/{domain}/*.json` files.
 */

export const SERVER_INFO = { name: "santismm-knowledge", version: "0.2.1" } as const;

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
}

/**
 * Every tool here reads a static corpus and nothing else, so all four hints are
 * literally true rather than aspirational: nothing mutates, the same arguments
 * always produce the same answer, and no tool reaches outside this corpus.
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
 * Tool-level failure. `isError` is required here: the SDK skips output
 * validation for error results, which is what lets a not-found response omit
 * `structuredContent` while the tool still declares an outputSchema.
 */
function notFound(domain: string, slug: string) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ error: "not_found", domain, slug }, null, 2) },
    ],
    isError: true as const,
  };
}

export function registerTools(server: McpToolServer, content: McpContent): void {
  // ── Orientation ────────────────────────────────────────────────────────────
  server.registerTool(
    "get_overview",
    {
      title: "Corpus Overview — Start Here",
      annotations: READ_ONLY,
      description:
        "Get the corpus map — start here. Returns every domain (knowledge, patterns, architectures, governance and the Harness Engineering Handbook) with what it holds, the categories inside it, which tool retrieves a unit and what identifier that tool expects, plus the languages, licence and bulk-ingest URLs. One call is enough to know exactly where to go next.",
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
        next: z.string(),
        bulk: z.record(z.string(), z.string()),
      }),
    },
    async () => out({ ...content.overview() }),
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
      return entry ? out(entry as Record<string, unknown>) : notFound("knowledge", slug);
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
      return entry ? out(entry as Record<string, unknown>) : notFound("patterns", slug);
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
      return entry ? out(entry as Record<string, unknown>) : notFound("architectures", slug);
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
      return entry ? out(entry as Record<string, unknown>) : notFound("governance", slug);
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
      return entry ? out(entry as Record<string, unknown>) : notFound("handbook", id);
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
      return result ? out(result as Record<string, unknown>) : notFound(domain, slug);
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
