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
} as const;

const HOST_SURFACES: Readonly<Record<string, Surface>> = {
  overview: "meta",
  knowledge: "core",
  patterns: "core",
  architectures: "core",
  governance: "core",
  handbook: "core",
  articles: "articles",
  labs: "labs",
  homeric: "homeric_atlas",
  claims: "claims",
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
