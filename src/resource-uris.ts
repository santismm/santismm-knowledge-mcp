import type { Domain, Locale } from "./content.ts";
import type { Surface } from "./surfaces.ts";

export type HomericResourceKind = "places" | "episodes" | "routes";

/**
 * Stable MCP-native identifiers for content that can be read without running
 * a tool. The HTTPS URL remains the citation target inside every payload; the
 * `santismm://` URI is the protocol address used by `resources/read`.
 */
export const resourceUri = {
  overview: () => "santismm://overview",
  authorProfile: () => "santismm://author",
  core: (domain: Domain, slug: string, locale: Locale = "en") =>
    `santismm://${domain}/${locale}/${encodeURIComponent(slug)}`,
  handbook: (id: string, locale: Locale = "en") =>
    `santismm://handbook/${locale}/${encodeURIComponent(id)}`,
  article: (slug: string) => `santismm://articles/${encodeURIComponent(slug)}`,
  lab: (slug: string) => `santismm://labs/${encodeURIComponent(slug)}`,
  homeric: (kind: HomericResourceKind, slug: string, locale: Locale = "en") =>
    `santismm://homeric/${kind}/${locale}/${encodeURIComponent(slug)}`,
  claim: (id: string, locale: Locale = "en") =>
    `santismm://claims/${locale}/${encodeURIComponent(id)}`,
  profession: (id: string) => `santismm://professions/${encodeURIComponent(id)}`,
  benchmark: (slug: string) => `santismm://benchmarks/${encodeURIComponent(slug)}`,
  /**
   * Physical AI keeps the user's design: `santismm://physical-ai/{collection}/{slug}`
   * plus two singletons. The locale is a query parameter because the item is one
   * record served in seven languages, not seven records — and it is always
   * written, `en` included: an RFC 6570 `{?locale}` template does not match a
   * URI without the query, so an omitted default would make the English URI
   * the one that cannot be read.
   */
  physicalAi: (type: string, slug: string, locale: Locale = "en") => {
    const collection: Record<string, string> = {
      platform: "platforms",
      case_study: "case-studies",
      guide: "guides",
      source: "sources",
    };
    const suffix = `?locale=${locale}`;
    return collection[type]
      ? `santismm://physical-ai/${collection[type]}/${encodeURIComponent(slug)}${suffix}`
      : `santismm://physical-ai/${type}${suffix}`;
  },
} as const;

const HOST_SURFACES: Readonly<Record<string, Surface>> = {
  overview: "meta",
  author: "meta",
  knowledge: "core",
  patterns: "core",
  architectures: "core",
  governance: "core",
  handbook: "core",
  articles: "articles",
  labs: "labs",
  homeric: "homeric_atlas",
  claims: "claims",
  professions: "benchmarks",
  benchmarks: "benchmarks",
  "physical-ai": "physical_ai",
};

/** Derive analytics attribution from the URI the resource registry serves. */
export function resourceSurfaceOf(uri: string | URL): Surface | undefined {
  try {
    const parsed = uri instanceof URL ? uri : new URL(uri);
    if (parsed.protocol !== "santismm:") return undefined;
    return HOST_SURFACES[parsed.hostname];
  } catch {
    return undefined;
  }
}
