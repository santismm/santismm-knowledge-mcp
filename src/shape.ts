import type { HomericKind, McpContent } from "./tools.js";
import type { Domain, Entry, Locale } from "./content.js";

/**
 * Framework-agnostic shaping layer for the MCP corpus.
 *
 * It contains the SINGLE definition of how raw content entries are turned into
 * the cards, bodies, search hits and graph neighbours the MCP tools return.
 * It does not read anything itself: callers inject a `loadAll(domain)` function,
 * so the same shaping is reused by the stdio CLI (which loads from the
 * filesystem) and the HTTP endpoint (which loads via the website's `lib/`
 * loaders). One shaping, one behaviour — the CLI and the web cannot drift.
 */

export const DOMAINS: Domain[] = ["knowledge", "patterns", "architectures", "governance"];

/** Canonical origin for citable URLs returned with every card. */
export const SITE_URL = "https://santismm.com";

export const ALL_LOCALES: Locale[] = ["en", "es", "pt"];

/** The handbook is authored in English; a chapter without a translation falls back to it. */
export const HANDBOOK_BODY_LOCALE: Locale = "en";

/**
 * The single definition of the content licence, for every surface that has to
 * state it — the JSON APIs, `llms-full.txt`, the MCP tools, the skill.
 *
 * "Attribution required" said what was wanted but granted nothing: it is a
 * request, not a licence, so a company evaluating reuse had no permission to
 * point at and the safe reading was "no rights granted". CC BY 4.0 grants the
 * reuse — including commercial, including derivatives — on the one condition
 * that was already being asked for.
 *
 * The SPDX id is the field that matters for machines: it is what an automated
 * reuse check reads, where prose is unparseable.
 *
 * Scope: this covers the CONTENT — the corpus and everything generated from it
 * (pages, JSON APIs, `llms-full.txt`, MCP payloads). The repository's SOURCE
 * CODE is MIT, in `LICENSE`. Two licences because CC BY is not a software
 * licence and MIT is not a content licence; applying either to both would
 * create ambiguity exactly where an adopter looks first.
 */
export const LICENSE_INFO = {
  name: "CC BY 4.0",
  spdx: "CC-BY-4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
  holder: "Santiago Santa María Morales",
  attribution: "Santiago Santa María Morales — https://santismm.com",
  notice:
    "Content © Santiago Santa María Morales, licensed CC BY 4.0. Attribution required: credit the author and link the canonical URL.",
} as const;

/** Human-readable notice. Kept as a plain string: several surfaces embed it in prose. */
export const LICENSE = LICENSE_INFO.notice;

/**
 * What each domain actually holds, and how to reach into it.
 *
 * `get_overview` is the most-called tool by a wide margin — it is the first
 * thing an agent does — and it used to answer with five bare counts. Knowing
 * that `patterns` has 15 units says nothing about what a pattern *is* or which
 * tool retrieves one, so agents either fanned out across every `list_*` (heavy)
 * or guessed at `search`. The orientation an agent needs belongs in the answer
 * to the orienting question.
 *
 * Descriptions are the same sentences `llms.txt` publishes, so the prose and
 * machine surfaces describe the corpus identically.
 */
const DOMAIN_INFO: Record<string, { description: string; lookup: string }> = {
  knowledge: {
    description: "Self-contained, citable units on agentic and enterprise AI.",
    lookup: "slug",
  },
  patterns: {
    description: "Reusable design patterns for AI and agentic systems.",
    lookup: "slug",
  },
  architectures: {
    description:
      "End-to-end blueprints composing patterns and knowledge into working enterprise systems.",
    lookup: "slug",
  },
  governance: {
    description:
      "Practical reference units for governing enterprise AI — major regimes (EU AI Act, ISO/IEC 42001, NIST AI RMF) and an agentic-AI governance checklist.",
    lookup: "slug",
  },
  handbook: {
    description:
      "The Harness Engineering Handbook: the canonical long-form corpus (HRN-001…014) — definition, history, taxonomy, principles, memory, observability, evaluation, governance, planning, orchestration, security, case studies, glossary and bibliography.",
    lookup: "HRN id (e.g. HRN-001) or slug",
  },
};

/** One entry of the corpus map returned by `get_overview`. */
export interface DomainOverview {
  domain: Domain;
  count: number;
  description: string;
  /** Distinct categories present in the domain, derived from the content itself. */
  categories: string[];
  tools: { list: string; get: string };
  /** What the domain's `get` tool expects as its identifier. */
  lookup: string;
  url: string;
  api_url: string;
}

export interface CorpusOverview {
  source: string;
  site: string;
  locales: Locale[];
  license: string;
  license_spdx: string;
  license_url: string;
  total: number;
  domains: DomainOverview[];
  /**
   * How fresh the copy answering this call is.
   *
   * The same server code runs from the site, which is redeployed on every
   * content change, and from a published package, which carries the corpus
   * frozen at publish time. An agent holding the package could not tell the
   * difference: a `not_found` looked identical whether the slug was wrong or
   * the snapshot was old. These two numbers make that answerable — compare
   * them against the hosted endpoint and a difference means you have a
   * snapshot.
   */
  corpus: {
    /** Newest `updated` date across every unit this copy holds (YYYY-MM-DD). */
    newest_unit: string | null;
    /** How to find out whether this copy is behind. */
    freshness: string;
  };
  next: string;
  bulk: Record<string, string>;
}

/**
 * Newest `updated` across a set of units, or null if none carries one.
 *
 * Dates are ISO `YYYY-MM-DD`, so a string comparison is the date comparison.
 * Derived from the loaded content rather than stamped at build time, so it is
 * correct in every deployment without anyone remembering to update it.
 */
function newestUpdated(items: Array<{ updated?: string }>): string | null {
  let newest: string | null = null;
  for (const it of items) {
    const u = it.updated;
    if (typeof u === "string" && (newest === null || u > newest)) newest = u;
  }
  return newest;
}

/** Distinct, sorted category values — read off the content, never hand-listed. */
function categoriesOf(items: Array<{ category?: string }>): string[] {
  return [...new Set(items.map((e) => e.category).filter((c): c is string => Boolean(c)))].sort();
}

function domainOverview(domain: Domain, items: Array<{ category?: string }>): DomainOverview {
  const info = DOMAIN_INFO[domain] ?? { description: "", lookup: "slug" };
  // The tool names are derived, not written out, so a domain can never be
  // advertised with a tool that isn't registered.
  // `Domain` does not include the handbook (it has its own loader), so compare
  // as a string rather than narrowing a union it was never part of.
  const singular = String(domain) === "handbook" ? "handbook" : domain.replace(/s$/, "");
  return {
    domain,
    count: items.length,
    description: info.description,
    categories: categoriesOf(items),
    tools: { list: `list_${domain}`, get: `get_${singular}` },
    lookup: info.lookup,
    url: `${SITE_URL}/en/${domain}`,
    api_url: `${SITE_URL}/api/${domain}`,
  };
}

/** The display name + short text from a locale (knowledge uses title; others name). */
function localeText(entry: Entry, locale: Locale = "en") {
  const L = (entry.locales?.[locale] ?? entry.locales?.en ?? {}) as Record<string, unknown>;
  const name = (L.name ?? L.title ?? entry.slug) as string;
  const summary = (L.summary ?? L.definition ?? "") as string;
  return { name, summary };
}

/** Compact card used in list/search/graph results. */
export function summarize(domain: Domain, entry: Entry, locale: Locale = "en") {
  const { name, summary } = localeText(entry, locale);
  return {
    domain,
    id: entry.id,
    slug: entry.slug,
    category: entry.category,
    name,
    summary,
    evidence: entry.evidence,
    updated: entry.updated,
    locale,
    // Canonical, citable URL for this unit in the requested language.
    canonical_url: `${SITE_URL}/${locale}/${domain}/${entry.slug}`,
    api_url: `${SITE_URL}/api/${domain}/${entry.slug}`,
  };
}

/**
 * Diacritic- and case-insensitive normalisation. "Aprobación" → "aprobacion",
 * so Spanish and Portuguese queries match regardless of how the user types the
 * accents.
 */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Function words in the three corpus languages. They carry no topical signal
 * but do appear inside titles ("Framework FOR…", "Política DE…"), so leaving
 * them in lets an unrelated unit win on a stopword `name` match.
 */
const STOPWORDS = new Set([
  // en
  "the", "a", "an", "of", "for", "and", "or", "to", "in", "on", "with", "is",
  "are", "what", "how", "why", "when", "that", "this", "it", "as", "by", "from",
  "at", "be", "can", "do", "does",
  // es
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "y", "o",
  "para", "por", "con", "en", "que", "es", "son", "como", "cual", "cuando",
  "sobre", "al", "se", "su", "sus", "antes", "despues", "mas",
  // pt
  "o", "os", "as", "um", "uma", "e", "ou", "para", "por", "com", "em", "que",
  "sao", "como", "quando", "sobre", "ao", "dos", "das", "no", "na", "se", "seu",
]);

/**
 * Very light stemming: trims a common plural ending so a query term matches the
 * singular in the text (and across languages — "agents"/"agentes" → "agent").
 * Fields are matched with `includes`, so shortening a term only ever broadens
 * the match; it can never make a real hit disappear.
 */
function stem(token: string): string {
  if (token.length >= 6 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length >= 5 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

/** Relative importance of each field when scoring a search hit. */
/**
 * Cuánto puede sumar como mucho la centralidad. Por debajo del peso de un
 * acierto en título (6) a propósito: desempata y matiza dentro de un empate,
 * nunca adelanta a una unidad que acertó más términos de la consulta.
 */
const CENTRALITY_NUDGE = 1.5;

/** Satura: pasar de 0 a 4 enlaces importa; de 40 a 44, ya no. */
const centralityBonus = (inbound: number) =>
  CENTRALITY_NUDGE * (inbound / (inbound + 4));

const FIELD_WEIGHTS: Record<string, number> = {
  name: 6,
  slug: 5,
  id: 5,
  summary: 4,
  category: 3,
  keyConcepts: 3,
  tags: 2,
  frameworks: 2,
  body: 1,
};

/**
 * Build the searchable field map for an entry, across EVERY locale (not just
 * English — searching only `locales.en` was why Spanish/Portuguese queries
 * returned nothing). Values are normalised once, at index time.
 */
const fieldCache = new WeakMap<object, Record<string, string>>();

function searchFields(entry: Entry): Record<string, string> {
  const cached = fieldCache.get(entry as unknown as object);
  if (cached) return cached;
  const built = buildSearchFields(entry);
  fieldCache.set(entry as unknown as object, built);
  return built;
}

function buildSearchFields(entry: Entry): Record<string, string> {
  const raw = entry as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").join(" ") : "");

  const names: string[] = [];
  const summaries: string[] = [];
  const concepts: string[] = [];
  const bodies: string[] = [];

  for (const loc of ALL_LOCALES) {
    const L = entry.locales?.[loc] as Record<string, unknown> | undefined;
    if (!L) continue;
    names.push(str(L.name), str(L.title));
    summaries.push(str(L.summary), str(L.definition), str(L.problem), str(L.scope));
    concepts.push(arr(L.keyConcepts), arr(L.takeaways));
    // Whole localized body last: lowest weight, but makes deep terms findable.
    bodies.push(JSON.stringify(L));
  }

  return {
    name: norm(names.join(" ")),
    slug: norm(entry.slug ?? ""),
    id: norm(str(raw.id)),
    summary: norm(summaries.join(" ")),
    category: norm(entry.category ?? ""),
    keyConcepts: norm(concepts.join(" ")),
    tags: norm(arr(raw.tags)),
    frameworks: norm(arr(raw.frameworks)),
    body: norm(bodies.join(" ")),
  };
}

export interface ScoredHit {
  score: number;
  matchedFields: string[];
  matchedTerms: string[];
}

/**
 * Score an entry against the query tokens. Each token contributes the weight of
 * the strongest field it appears in; matching MORE of the query's tokens is
 * rewarded quadratically (coverage²), so a unit hitting every term outranks one
 * that happens to repeat a single common word like "agent".
 */
function scoreEntry(
  fields: Record<string, string>,
  tokens: string[],
  idf: (token: string) => number,
): ScoredHit | null {
  let raw = 0;
  let hits = 0;
  const matchedFields = new Set<string>();
  const matchedTerms: string[] = [];

  for (const token of tokens) {
    let best = 0;
    let bestField = "";
    for (const [field, value] of Object.entries(fields)) {
      if (!value || !value.includes(token)) continue;
      const w = FIELD_WEIGHTS[field] ?? 1;
      if (w > best) {
        best = w;
        bestField = field;
      }
    }
    if (best > 0) {
      // Weight by term specificity: "agent" appears in almost every unit of
      // this corpus, "guardrails" in a handful — so a title hit on the rare
      // term must outrank a title hit on the ubiquitous one.
      raw += best * idf(token);
      hits++;
      matchedFields.add(bestField);
      matchedTerms.push(token);
    }
  }

  if (hits === 0) return null;

  // Adjacency bonus: query terms occurring as a literal phrase are a far
  // stronger signal than the same terms scattered around. "aprobacion humana"
  // inside the title «Puerta de Aprobación Humana» should beat a unit that
  // merely mentions all three words somewhere in its body.
  let phraseBonus = 0;
  for (let n = tokens.length; n >= 2; n--) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const phrase = tokens.slice(i, i + n).join(" ");
      for (const [field, value] of Object.entries(fields)) {
        if (value && value.includes(phrase)) {
          const w = FIELD_WEIGHTS[field] ?? 1;
          phraseBonus = Math.max(phraseBonus, w * n);
          matchedFields.add(field);
        }
      }
    }
    if (phraseBonus > 0) break; // longest matching phrase wins
  }

  const coverage = hits / tokens.length;
  return {
    score: Math.round((raw * coverage * coverage + phraseBonus) * 100) / 100,
    matchedFields: [...matchedFields],
    matchedTerms,
  };
}

const REF_FIELDS: Record<Domain, { field: string; target: Domain; type: string }[]> = {
  knowledge: [{ field: "related", target: "knowledge", type: "related" }],
  patterns: [{ field: "related", target: "patterns", type: "related" }],
  architectures: [
    { field: "patterns", target: "patterns", type: "composes" },
    { field: "knowledge", target: "knowledge", type: "builds_on" },
    { field: "related", target: "architectures", type: "related" },
  ],
  governance: [
    { field: "patterns", target: "patterns", type: "operationalized_by" },
    { field: "knowledge", target: "knowledge", type: "relates_to" },
    { field: "related", target: "governance", type: "related" },
  ],
};

/** A Harness Engineering Handbook chapter (Markdown + frontmatter source). */
/** One language of a chapter. Absent locale = genuinely not translated. */
export interface HandbookLocaleBody {
  title: string;
  summary?: string;
  body?: string;
}

export interface HandbookEntry {
  id: string;
  slug: string;
  title: string;
  category?: string;
  status?: string;
  summary?: string;
  updated?: string;
  evidenceLevel?: string;
  confidenceLevel?: string;
  sourceType?: string[];
  related?: string[];
  tags?: string[];
  body?: string;
  /** Per-locale title/summary/body. `en` is always present (the source). */
  locales?: Partial<Record<Locale, HandbookLocaleBody>>;
}

/**
 * Resolve a chapter into one language and say which one came back.
 *
 * Chapters translate independently, so this is per chapter — the old constant
 * declared the WHOLE handbook English, which stopped being true the moment one
 * chapter was translated and would have made every card lie in the other
 * direction.
 */
export function resolveHandbookLocale(e: HandbookEntry, locale: Locale) {
  const wanted = e.locales?.[locale];
  const source = e.locales?.[HANDBOOK_BODY_LOCALE];
  // Translation is partial by design: a short title and summary can be
  // translated long before 1,300 words of prose are. Those fall back field by
  // field; the BODY decides `fallback`, because that is what a reader would
  // notice being in the wrong language.
  const bodyTranslated = Boolean(wanted?.body);
  return {
    title: wanted?.title || source?.title || e.title,
    summary: wanted?.summary || source?.summary || e.summary || "",
    body: (bodyTranslated ? wanted?.body : undefined) || e.body,
    resolved: bodyTranslated ? locale : HANDBOOK_BODY_LOCALE,
    fallback: !bodyTranslated,
  };
}

/**
 * Compact card for a handbook chapter, mirroring `summarize`.
 *
 * The handbook is authored in English and translated chapter by chapter.
 * Stamping `locale: "es"` on a card whose title and summary are English claims
 * a translation that does not exist — `get_handbook` was fixed to say so, but
 * the cards from `list_handbook` and `get_related` kept making the claim. They
 * now report the resolution, so no surface of the corpus overstates its
 * coverage — nor, now that every chapter is translated, understates it.
 */
export function summarizeHandbook(e: HandbookEntry, locale: Locale = "en") {
  const r = resolveHandbookLocale(e, locale);
  return {
    domain: "handbook" as const,
    id: e.id,
    slug: e.slug,
    category: e.category,
    name: r.title,
    summary: r.summary,
    status: e.status,
    evidence: {
      evidenceLevel: e.evidenceLevel,
      confidenceLevel: e.confidenceLevel,
      sourceType: e.sourceType,
    },
    updated: e.updated,
    locale,
    requested_locale: locale,
    resolved_locale: r.resolved,
    fallback: r.fallback,
    // Localized handbook routes exist and render, but the prose is English.
    canonical_url: `${SITE_URL}/${locale}/handbook/${e.slug}`,
    api_url: `${SITE_URL}/api/handbook/${e.id}`,
  };
}

/** Searchable fields for a handbook chapter (same weighting vocabulary). */
/**
 * Searchable fields for a chapter, across EVERY locale it has been translated
 * into — the same rule the structured domains already follow.
 *
 * Indexing only English is why a Spanish query for handbook terms returned
 * zero while the English equivalent returned ten: the text simply was not in
 * the index. A translated chapter becomes findable in its own language the
 * moment its file exists, with no other change.
 */
function handbookFields(e: HandbookEntry): Record<string, string> {
  const titles: string[] = [e.title ?? ""];
  const summaries: string[] = [e.summary ?? ""];
  const bodies: string[] = [e.body ?? ""];
  for (const loc of ALL_LOCALES) {
    const L = e.locales?.[loc];
    if (!L) continue;
    titles.push(L.title ?? "");
    summaries.push(L.summary ?? "");
    bodies.push(L.body ?? "");
  }
  return {
    name: norm(titles.join(" ")),
    slug: norm(e.slug ?? ""),
    id: norm(e.id ?? ""),
    summary: norm(summaries.join(" ")),
    category: norm(e.category ?? ""),
    tags: norm((e.tags ?? []).join(" ")),
    body: norm(bodies.join(" ")),
  };
}

/**
 * Build an `McpContent` provider from a single `loadAll(domain)` loader.
 * The loader is the only thing that differs between the CLI (fs) and the web
 * (lib/); both read exactly the same `content/{domain}/*.json` source of truth.
 *
 * `loadHandbook` is injected the same way for the Markdown handbook
 * (`content/harness/*.md`), so both transports expose the same chapters.
 */

/**
 * A Homeric Atlas artifact, kept loose on purpose.
 *
 * The atlas has its own schema (identification classes, a 0–12 rubric,
 * hypotheses carrying their own coordinates) which is validated in the site's
 * own CI. Re-declaring it here would mean two definitions of one contract, so
 * this module only names the fields it actually reads to build a card.
 */
export interface HomericArtifact {
  slug: string;
  id?: string;
  identification?: string;
  region?: string;
  unlocated?: boolean;
  work?: string;
  book?: number;
  lines?: string;
  hypotheses?: Array<{ identification?: string; confidence?: Record<string, unknown> }>;
  variants?: unknown[];
  confidence?: Record<string, unknown>;
  locales?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

const HOMERIC_CLASS_ORDER = ["accepted", "plausible", "speculative", "mythical"];

function homericBody(e: HomericArtifact, locale: Locale): Record<string, unknown> | undefined {
  return e.locales?.[locale] ?? e.locales?.en;
}

/**
 * The confidence a place leads with: the strongest identification class it
 * carries, then the highest score inside that class — the same rule the site
 * uses to choose which pin a place is represented by.
 */
function primaryHomericConfidence(e: HomericArtifact): Record<string, unknown> | null {
  if (e.confidence) return e.confidence;
  const ranked = [...(e.hypotheses ?? [])].sort(
    (a, b) =>
      HOMERIC_CLASS_ORDER.indexOf(String(a.identification)) -
        HOMERIC_CLASS_ORDER.indexOf(String(b.identification)) ||
      Number(b.confidence?.score ?? 0) - Number(a.confidence?.score ?? 0),
  );
  return (ranked[0]?.confidence as Record<string, unknown>) ?? null;
}

/** A list card for one atlas artifact. */
function summarizeHomeric(kind: HomericKind, e: HomericArtifact, locale: Locale) {
  const body = homericBody(e, locale) ?? {};
  const name = String(body.name ?? body.title ?? e.slug);
  const citation =
    e.work && e.book !== undefined && e.lines
      ? `${e.work === "iliad" ? "Iliad" : "Odyssey"} ${e.book}.${String(e.lines).replace("-", "–")}`
      : undefined;
  return {
    kind,
    id: e.id,
    slug: e.slug,
    name,
    summary: typeof body.summary === "string" ? body.summary : undefined,
    identification: e.identification,
    region: e.region,
    unlocated: e.unlocated,
    work: e.work,
    citation,
    hypotheses: e.hypotheses?.length,
    variants: e.variants?.length,
    confidence: primaryHomericConfidence(e),
    locale,
    canonical_url: `${SITE_URL}/en/labs/homeric-atlas/${kind}/${e.slug}`,
    api_url: `${SITE_URL}/api/homeric/${kind}/${e.slug}`,
  };
}

export function makeContent(
  loadAll: (domain: Domain) => Entry[],
  loadHandbook?: () => HandbookEntry[],
  loadHomeric?: (kind: HomericKind) => HomericArtifact[],
  loadClaims?: () => Record<string, unknown>[],
): McpContent {
  const getOne = (domain: Domain, slug: string) =>
    loadAll(domain).find((e) => e.slug === slug);

  /**
   * Enlaces entrantes por unidad — la única señal de centralidad que este
   * corpus ya tiene, y la que decide un empate de puntuación.
   *
   * Para una consulta de una palabra, toda unidad que la lleve en el título
   * saca exactamente la misma nota: "memory" empataba 4 unidades y "harness" 7,
   * y el orden lo resolvía `localeCompare`. Cuál es la canónica no está en el
   * texto — está en quién apunta a quién.
   *
   * Cuenta TODAS las aristas declaradas, incluidas las del manual, que
   * referencia por identificador (`HRN-003`, `GOV-001`, `ARCH-001`) y no por
   * slug: medirlo solo sobre los cuatro dominios JSON dejaba a los 14 capítulos
   * a cero por artefacto y habría hundido el manual entero fingiendo que era
   * una señal.
   */
  let inboundCache: Map<string, number> | null = null;
  const inboundLinks = (): Map<string, number> => {
    if (inboundCache) return inboundCache;
    const bySlug = new Map<string, string>(); // ARCH-001 / HRN-003 -> slug
    const entries: Record<string, unknown>[] = [];
    for (const domain of DOMAINS) {
      for (const e of loadAll(domain)) {
        entries.push(e as unknown as Record<string, unknown>);
        const id = (e as Record<string, unknown>).id;
        if (typeof id === "string") bySlug.set(id.toUpperCase(), e.slug);
      }
    }
    if (loadHandbook) {
      for (const c of loadHandbook()) {
        entries.push(c as unknown as Record<string, unknown>);
        if (c.id) bySlug.set(String(c.id).toUpperCase(), c.slug);
      }
    }
    const inb = new Map<string, number>();
    for (const e of entries) {
      for (const field of ["related", "patterns", "knowledge", "architectures", "governance"]) {
        const refs = e[field];
        if (!Array.isArray(refs)) continue;
        for (const r of refs) {
          if (typeof r !== "string") continue;
          // Una referencia que no resuelve acaba bajo una clave que ninguna
          // unidad tiene, así que no confiere centralidad a nadie. Quien avisa
          // de que existen es `npm run validate`, no esto.
          const slug = bySlug.get(r.toUpperCase()) ?? r;
          inb.set(slug, (inb.get(slug) ?? 0) + 1);
        }
      }
    }
    inboundCache = inb;
    return inb;
  };

  const card = (d: Domain, e: Entry, locale: Locale, type: string) => ({
    type,
    ...summarize(d, e, locale),
  });

  return {
    /**
     * The corpus map. This is the orienting call, so it answers the whole
     * orienting question: what each domain holds, which categories are in it,
     * which tool retrieves a unit and what identifier that tool wants — enough
     * for an agent to go straight to the right call instead of fanning out
     * across every `list_*` or guessing at `search`.
     */
    overview(): CorpusOverview {
      const domains = DOMAINS.map((domain) => domainOverview(domain, loadAll(domain)));
      // The handbook is part of the corpus, so it belongs in the map an agent
      // uses to decide where to look — omitting it hid 14 chapters.
      if (loadHandbook) domains.push(domainOverview("handbook" as Domain, loadHandbook()));

      return {
        source: "santismm.com",
        site: SITE_URL,
        locales: ALL_LOCALES,
        license: LICENSE,
        // The machine-actionable half: an SPDX id and the deed, so an agent can
        // decide whether it may reuse this without parsing the prose above.
        license_spdx: LICENSE_INFO.spdx,
        license_url: LICENSE_INFO.url,
        total: domains.reduce((n, d) => n + d.count, 0),
        domains,
        corpus: {
          newest_unit: newestUpdated([
            ...DOMAINS.flatMap((d) => loadAll(d)),
            ...(loadHandbook ? loadHandbook() : []),
          ]),
          freshness:
            `This describes the copy answering the call. ${SITE_URL}/mcp is redeployed on ` +
            "every content change; a published package carries the corpus frozen at publish " +
            "time. If total or newest_unit differ from that endpoint's, you are holding a snapshot.",
        },
        next:
          "search(query, locale) to answer a question across the whole corpus; " +
          "list_<domain> to browse one; get_<domain>(slug) for a full unit with its " +
          "Evidence-First provenance; get_related(domain, slug) to traverse the graph. " +
          "Every result carries canonical_url and api_url, so cite the canonical_url.",
        // For agents that would rather ingest the corpus than walk it.
        bulk: {
          llms_full_txt: `${SITE_URL}/llms-full.txt`,
          graph: `${SITE_URL}/api/graph.json`,
          homeric_atlas: `${SITE_URL}/api/homeric-atlas.json`,
        },
      };
    },

    listDomain(domain, locale = "en") {
      return loadAll(domain).map((e) => summarize(domain, e, locale));
    },

    getEntry(domain, slug, locale) {
      const entry = getOne(domain, slug);
      if (!entry) return undefined;
      // Full units are citable too: carry the same canonical/API URLs the
      // cards do, so an agent never has to reconstruct them.
      const links = {
        domain,
        canonical_url: `${SITE_URL}/${locale ?? "en"}/${domain}/${entry.slug}`,
        api_url: `${SITE_URL}/api/${domain}/${entry.slug}`,
      };
      if (!locale) return { ...entry, ...links };
      const { locales, ...meta } = entry;
      return { ...meta, ...links, locale, body: locales?.[locale] ?? locales?.en };
    },

    /**
     * Ranked, language-agnostic keyword search. Tokenises the query, matches
     * each token against every locale's fields (diacritic-insensitive) and
     * ranks by weighted score, so results are ordered by relevance and carry
     * the evidence of WHY they matched.
     */
    search(query, domains = [...DOMAINS, "handbook" as Domain], limit = 20, locale = "en") {
      // norm() has already stripped diacritics, so a plain alphanumeric split
      // is enough (and avoids needing Unicode property escapes).
      const all = norm(query).split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
      // Drop function words — unless that would leave nothing to search for.
      const meaningful = all.filter((t) => !STOPWORDS.has(t));
      const tokens = [...new Set((meaningful.length > 0 ? meaningful : all).map(stem))];
      if (tokens.length === 0) return [];

      // Collect the candidate documents first, so term specificity (IDF) can be
      // measured across the corpus actually being searched.
      const wantHandbook = domains.includes("handbook" as Domain);
      const structured = domains.filter((d) => d !== ("handbook" as Domain));

      const inb = inboundLinks();
      const docs: { fields: Record<string, string>; slug: string; card: () => Record<string, unknown> }[] = [];
      for (const domain of structured) {
        for (const entry of loadAll(domain)) {
          docs.push({
            fields: searchFields(entry),
            slug: entry.slug,
            card: () => summarize(domain, entry, locale) as unknown as Record<string, unknown>,
          });
        }
      }
      // The handbook is a first-class domain: searched by default, and
      // selectable (or excludable) like any other via `domains`.
      if (loadHandbook && wantHandbook) {
        for (const e of loadHandbook()) {
          docs.push({
            fields: handbookFields(e),
            slug: e.slug,
            card: () => summarizeHandbook(e, locale) as unknown as Record<string, unknown>,
          });
        }
      }

      const docFreq = new Map<string, number>();
      for (const token of tokens) {
        let n = 0;
        for (const d of docs) {
          if (Object.values(d.fields).some((v) => v && v.includes(token))) n++;
        }
        docFreq.set(token, n);
      }
      const total = docs.length || 1;
      const idf = (token: string) => Math.log(1 + total / ((docFreq.get(token) ?? 0) + 1));

      const scored: (Record<string, unknown> & ScoredHit & { name: string })[] = [];
      for (const d of docs) {
        const hit = scoreEntry(d.fields, tokens, idf);
        if (!hit) continue;
        // La centralidad se suma DESPUÉS de puntuar el texto: decide entre
        // unidades que ya empataron por relevancia, no compite con ella.
        const score = Math.round((hit.score + centralityBonus(inb.get(d.slug) ?? 0)) * 100) / 100;
        scored.push({ ...d.card(), ...hit, score } as typeof scored[number]);
      }

      scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      return scored.slice(0, limit);
    },

    /**
     * Claims (ADR 0003). The card carries the type and the confidence, because
     * that is the whole point: an agent must be able to tell an observed fact
     * from a bet without reading the prose and guessing.
     */
    listClaims(type, locale = "en") {
      if (!loadClaims) return [];
      return loadClaims()
        .filter((c) => !type || c.claimType === type)
        // Orden estable por id: el del directorio no lo es, y un listado que
        // cambia de orden entre llamadas es un listado en el que no se confía.
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
        .map((c) => {
          const L = ((c.locales as Record<string, Record<string, string>>) ?? {})[locale] ?? {};
          return {
            type: "claim",
            id: c.id,
            slug: c.slug,
            claim_type: c.claimType,
            confidence_level: c.confidenceLevel,
            statement: L.statement,
            supports: c.supports,
            reviewed: c.reviewed,
          };
        });
    },

    /** By `HE-CLAIM-nnn` or slug: an agent that saw either can come back. */
    getClaim(id, locale = "en") {
      if (!loadClaims) return undefined;
      const key = String(id).toUpperCase();
      const c = loadClaims().find((x) => String(x.id).toUpperCase() === key || x.slug === id);
      if (!c) return undefined;
      const L = ((c.locales as Record<string, Record<string, string>>) ?? {})[locale] ?? {};
      return { type: "claim", ...c, body: L };
    },

    listHomeric(kind, locale = "en") {
      if (!loadHomeric) return [];
      return loadHomeric(kind).map((e) => summarizeHomeric(kind, e, locale));
    },

    getHomeric(kind, slug, locale = "en") {
      if (!loadHomeric) return undefined;
      const entry = loadHomeric(kind).find((e) => e.slug === slug);
      if (!entry) return undefined;
      // The full artifact, plus the requested locale hoisted to `body`. Both:
      // an agent asking in Spanish should not have to know the shape of
      // `locales`, and one auditing the atlas should still see all three.
      return {
        ...summarizeHomeric(kind, entry, locale),
        ...entry,
        body: homericBody(entry, locale),
      };
    },

    listHandbook(locale = "en") {
      if (!loadHandbook) return [];
      return loadHandbook().map((e) => summarizeHandbook(e, locale));
    },

    getHandbookChapter(idOrSlug, locale = "en") {
      if (!loadHandbook) return undefined;
      const needle = norm(idOrSlug);
      const e = loadHandbook().find(
        (x) => norm(x.id) === needle || norm(x.slug) === needle,
      );
      if (!e) return undefined;
      // The locale resolution now travels with the card itself, so every
      // handbook surface states it identically.
      return {
        ...summarizeHandbook(e, locale),
        body: resolveHandbookLocale(e, locale).body,
        related: e.related,
        tags: e.tags,
      };
    },

    related(domain, slug, locale = "en") {
      // Handbook chapters cross-reference each other by HRN id; resolve those
      // in both directions so the graph is traversable from the handbook too.
      if (domain === ("handbook" as Domain)) {
        if (!loadHandbook) return undefined;
        const chapters = loadHandbook();
        const needle = norm(slug);
        const self = chapters.find((c) => norm(c.id) === needle || norm(c.slug) === needle);
        if (!self) return undefined;
        const byId = new Map(chapters.map((c) => [c.id, c]));
        const outgoing = (self.related ?? [])
          .map((ref) => byId.get(ref))
          .filter((c): c is HandbookEntry => Boolean(c))
          .map((c) => ({ type: "related", ...summarizeHandbook(c, locale) }));
        const incoming = chapters
          .filter((c) => c.id !== self.id && (c.related ?? []).includes(self.id))
          .map((c) => ({ type: "related", ...summarizeHandbook(c, locale) }));
        return { unit: summarizeHandbook(self, locale), outgoing, incoming };
      }

      const entry = getOne(domain, slug);
      if (!entry) return undefined;

      const outgoing: ReturnType<typeof card>[] = [];
      for (const { field, target, type } of REF_FIELDS[domain]) {
        const refs = (entry as Record<string, unknown>)[field];
        if (!Array.isArray(refs)) continue;
        for (const ref of refs as string[]) {
          const t = getOne(target, ref);
          if (t) outgoing.push(card(target, t, locale, type));
        }
      }

      const incoming: ReturnType<typeof card>[] = [];
      for (const d of DOMAINS) {
        for (const other of loadAll(d)) {
          if (d === domain && other.slug === slug) continue;
          for (const { field, target, type } of REF_FIELDS[d]) {
            if (target !== domain) continue;
            const refs = (other as Record<string, unknown>)[field];
            if (Array.isArray(refs) && (refs as string[]).includes(slug)) {
              incoming.push(card(d, other, locale, type));
            }
          }
        }
      }

      return { unit: summarize(domain, entry, locale), outgoing, incoming };
    },
  };
}
