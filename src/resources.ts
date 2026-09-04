import {
  ResourceNotFoundError,
  ResourceTemplate,
} from "@modelcontextprotocol/server";
import { loadArticles } from "./articles.ts";
import type { Domain, Locale } from "./content.ts";
import { resourceSurfaceOf, resourceUri } from "./resource-uris.ts";
import type { Surface } from "./surfaces.ts";
import { mergedLabs, type HomericKind, type McpContent } from "./tools.ts";

const LOCALES = ["en", "es", "pt", "fr", "de", "ja", "zh"] as const satisfies readonly Locale[];
const LOCAL_CACHE = { ttlMs: 60 * 60 * 1000, cacheScope: "public" } as const;
const FEDERATED_CACHE = { ttlMs: 5 * 60 * 1000, cacheScope: "public" } as const;

type ResourceResult = {
  contents: Array<{ uri: string; mimeType: string; text: string }>;
};

type TemplateVariables = Record<string, string | string[]>;
type ResourceListEntry = {
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
};

export interface McpResourceServer {
  registerResource(
    name: string,
    uri: string,
    config: Record<string, unknown>,
    callback: (uri: URL, context: unknown) => ResourceResult | Promise<ResourceResult>,
  ): unknown;
  registerResource(
    name: string,
    template: ResourceTemplate,
    config: Record<string, unknown>,
    callback: (
      uri: URL,
      variables: TemplateVariables,
      context: unknown,
    ) => ResourceResult | Promise<ResourceResult>,
  ): unknown;
}

export type McpResourceOutcome = "ok" | "not_found" | "error";

export interface McpResourceResultEvent {
  resource: string;
  uri: string;
  surface: Surface;
  outcome: McpResourceOutcome;
}

export interface McpResourceTelemetry {
  resourceResult?(event: McpResourceResultEvent): void;
}

export interface ResourceManifestEntry {
  name: string;
  title: string;
  description: string;
  uri_template: string;
  surface: Surface;
  federated: boolean;
}

const RESOURCE_MANIFEST: readonly ResourceManifestEntry[] = [
  {
    name: "corpus-overview",
    title: "SANTISMM corpus overview",
    description: "Read the corpus map, licences, languages, extensions and bulk-ingest URLs.",
    uri_template: resourceUri.overview(),
    surface: "meta",
    federated: false,
  },
  ...(["knowledge", "patterns", "architectures", "governance"] as const).map((domain) => ({
    name: `${domain}-unit`,
    title: `${domain[0].toUpperCase()}${domain.slice(1)} unit`,
    description: `Read one complete ${domain} unit, localised and carrying provenance plus canonical citation URLs.`,
    uri_template: `santismm://${domain}/{locale}/{slug}`,
    surface: "core" as const,
    federated: false,
  })),
  {
    name: "handbook-chapter",
    title: "Harness Engineering Handbook chapter",
    description: "Read one complete Handbook chapter by stable id or slug and locale.",
    uri_template: "santismm://handbook/{locale}/{id}",
    surface: "core",
    federated: false,
  },
  {
    name: "first-party-article",
    title: "First-party essay",
    description: "Read one complete first-party essay from the canonical Articles API.",
    uri_template: "santismm://articles/{slug}",
    surface: "articles",
    federated: true,
  },
  {
    name: "lab-definition",
    title: "SANTISMM Lab definition",
    description: "Read one calculator, converter, experiment or educational-game definition without executing it.",
    uri_template: "santismm://labs/{slug}",
    surface: "labs",
    federated: true,
  },
  {
    name: "homeric-atlas-artifact",
    title: "Homeric Atlas artifact",
    description: "Read one place, episode or route with competing identifications and rubric evidence.",
    uri_template: "santismm://homeric/{kind}/{locale}/{slug}",
    surface: "homeric_atlas",
    federated: false,
  },
  {
    name: "epistemic-claim",
    title: "Epistemic claim record",
    description: "Read one load-bearing claim, including limits and falsification criteria.",
    uri_template: "santismm://claims/{locale}/{id}",
    surface: "claims",
    federated: false,
  },
] as const;

export function resourceManifest(): ResourceManifestEntry[] {
  return RESOURCE_MANIFEST.map((entry) => ({ ...entry }));
}

function stringVariable(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return typeof value === "string" ? value : "";
}

function localeVariable(value: unknown, uri: URL): Locale {
  const locale = stringVariable(value);
  if ((LOCALES as readonly string[]).includes(locale)) return locale as Locale;
  throw new ResourceNotFoundError(uri.href, `Unsupported locale in ${uri.href}`);
}

function jsonResource(uri: URL, value: unknown): ResourceResult {
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function cardText(value: Record<string, unknown>): string | undefined {
  for (const key of ["summary", "description", "statement"]) {
    const text = value[key];
    if (typeof text === "string" && text.trim()) return text.trim().slice(0, 280);
  }
  return undefined;
}

function listEntry(
  uri: string,
  fallbackName: string,
  value: Record<string, unknown>,
): ResourceListEntry {
  return {
    uri,
    name: fallbackName,
    title: String(value.name ?? value.title ?? value.label ?? value.statement ?? fallbackName),
    description: cardText(value),
    mimeType: "application/json",
  };
}

function completeFrom(values: () => string[]) {
  return (prefix: string) =>
    values()
      .filter((value) => value.toLowerCase().startsWith(prefix.toLowerCase()))
      .slice(0, 50);
}

function observeRead(
  name: string,
  surface: Surface,
  telemetry: McpResourceTelemetry | undefined,
  callback: (uri: URL, variables: TemplateVariables) => ResourceResult | Promise<ResourceResult>,
) {
  return async (uri: URL, variables: TemplateVariables): Promise<ResourceResult> => {
    try {
      const result = await callback(uri, variables);
      try {
        telemetry?.resourceResult?.({ resource: name, uri: uri.href, surface, outcome: "ok" });
      } catch {
        // Observation can never break a resource response.
      }
      return result;
    } catch (error) {
      try {
        telemetry?.resourceResult?.({
          resource: name,
          uri: uri.href,
          surface,
          outcome: error instanceof ResourceNotFoundError ? "not_found" : "error",
        });
      } catch {
        // Preserve the resource error.
      }
      throw error;
    }
  };
}

function localTemplate(
  pattern: string,
  list: () => ResourceListEntry[],
  complete: Record<string, (prefix: string) => string[]>,
): ResourceTemplate {
  return new ResourceTemplate(pattern, {
    list: () => ({ resources: list() }),
    complete,
  });
}

function templateConfig(entry: ResourceManifestEntry, cacheHint = LOCAL_CACHE) {
  return {
    title: entry.title,
    description: entry.description,
    mimeType: "application/json",
    cacheHint,
  };
}

/** Register the read-only content surface once for both stdio and HTTP. */
export function registerResources(
  server: McpResourceServer,
  content: McpContent,
  telemetry?: McpResourceTelemetry,
): void {
  const overview = RESOURCE_MANIFEST[0];
  server.registerResource(
    overview.name,
    overview.uri_template,
    templateConfig(overview),
    observeRead(overview.name, overview.surface, telemetry, (uri) =>
      jsonResource(uri, { ...content.overview(), resource_uri: resourceUri.overview() }),
    ) as unknown as (uri: URL, context: unknown) => Promise<ResourceResult>,
  );

  const core = RESOURCE_MANIFEST.slice(1, 5);
  for (const entry of core) {
    const domain = entry.name.replace(/-unit$/, "") as Domain;
    const slugs = () =>
      (content.listDomain(domain, "en") as Array<Record<string, unknown>>)
        .map((item) => String(item.slug ?? ""))
        .filter(Boolean);
    const template = localTemplate(
      entry.uri_template,
      () => LOCALES.flatMap((locale) =>
        (content.listDomain(domain, locale) as Array<Record<string, unknown>>).map((item) => {
          const slug = String(item.slug ?? "");
          return listEntry(resourceUri.core(domain, slug, locale), `${domain}/${slug}@${locale}`, item);
        }),
      ),
      { locale: completeFrom(() => [...LOCALES]), slug: completeFrom(slugs) },
    );
    server.registerResource(
      entry.name,
      template,
      templateConfig(entry),
      observeRead(entry.name, entry.surface, telemetry, (uri, variables) => {
        const locale = localeVariable(variables.locale, uri);
        const slug = stringVariable(variables.slug);
        const value = content.getEntry(domain, slug, locale);
        if (!value) throw new ResourceNotFoundError(uri.href);
        return jsonResource(uri, value);
      }),
    );
  }

  const handbook = RESOURCE_MANIFEST[5];
  const handbookIds = () =>
    (content.listHandbook("en") as Array<Record<string, unknown>>)
      .flatMap((item) => [String(item.id ?? ""), String(item.slug ?? "")])
      .filter(Boolean);
  server.registerResource(
    handbook.name,
    localTemplate(
      handbook.uri_template,
      () => LOCALES.flatMap((locale) =>
        (content.listHandbook(locale) as Array<Record<string, unknown>>).map((item) => {
          const id = String(item.id ?? item.slug ?? "");
          return listEntry(resourceUri.handbook(id, locale), `handbook/${id}@${locale}`, item);
        }),
      ),
      { locale: completeFrom(() => [...LOCALES]), id: completeFrom(handbookIds) },
    ),
    templateConfig(handbook),
    observeRead(handbook.name, handbook.surface, telemetry, (uri, variables) => {
      const locale = localeVariable(variables.locale, uri);
      const id = stringVariable(variables.id);
      const value = content.getHandbookChapter(id, locale);
      if (!value) throw new ResourceNotFoundError(uri.href);
      return jsonResource(uri, value);
    }),
  );

  const articles = RESOURCE_MANIFEST[6];
  server.registerResource(
    articles.name,
    new ResourceTemplate(articles.uri_template, { list: undefined }),
    templateConfig(articles, FEDERATED_CACHE),
    observeRead(articles.name, articles.surface, telemetry, async (uri, variables) => {
      const slug = stringVariable(variables.slug);
      const value = (await loadArticles()).find((article) => article.slug === slug);
      if (!value) throw new ResourceNotFoundError(uri.href);
      return jsonResource(uri, { ...value, resource_uri: resourceUri.article(value.slug) });
    }),
  );

  const labs = RESOURCE_MANIFEST[7];
  server.registerResource(
    labs.name,
    new ResourceTemplate(labs.uri_template, { list: undefined }),
    templateConfig(labs, FEDERATED_CACHE),
    observeRead(labs.name, labs.surface, telemetry, async (uri, variables) => {
      const slug = stringVariable(variables.slug);
      const value = (await mergedLabs(content)).find((lab) => lab.slug === slug);
      if (!value) throw new ResourceNotFoundError(uri.href);
      return jsonResource(uri, value);
    }),
  );

  const homeric = RESOURCE_MANIFEST[8];
  const kinds = ["places", "episodes", "routes"] as const satisfies readonly HomericKind[];
  const homericSlugs = () =>
    kinds.flatMap((kind) =>
      (content.listHomeric(kind, "en") as Array<Record<string, unknown>>)
        .map((item) => String(item.slug ?? ""))
        .filter(Boolean),
    );
  server.registerResource(
    homeric.name,
    localTemplate(
      homeric.uri_template,
      () => kinds.flatMap((kind) => LOCALES.flatMap((locale) =>
        (content.listHomeric(kind, locale) as Array<Record<string, unknown>>).map((item) => {
          const slug = String(item.slug ?? "");
          return listEntry(resourceUri.homeric(kind, slug, locale), `homeric/${kind}/${slug}@${locale}`, item);
        }),
      )),
      {
        kind: completeFrom(() => [...kinds]),
        locale: completeFrom(() => [...LOCALES]),
        slug: completeFrom(homericSlugs),
      },
    ),
    templateConfig(homeric),
    observeRead(homeric.name, homeric.surface, telemetry, (uri, variables) => {
      const kind = stringVariable(variables.kind) as HomericKind;
      const locale = localeVariable(variables.locale, uri);
      const slug = stringVariable(variables.slug);
      if (!(kinds as readonly string[]).includes(kind)) throw new ResourceNotFoundError(uri.href);
      const value = content.getHomeric(kind, slug, locale);
      if (!value) throw new ResourceNotFoundError(uri.href);
      return jsonResource(uri, value);
    }),
  );

  const claims = RESOURCE_MANIFEST[9];
  const claimIds = () =>
    (content.listClaims(undefined, "en") as Array<Record<string, unknown>>)
      .flatMap((item) => [String(item.id ?? ""), String(item.slug ?? "")])
      .filter(Boolean);
  server.registerResource(
    claims.name,
    localTemplate(
      claims.uri_template,
      () => LOCALES.flatMap((locale) =>
        (content.listClaims(undefined, locale) as Array<Record<string, unknown>>).map((item) => {
          const id = String(item.id ?? item.slug ?? "");
          return listEntry(resourceUri.claim(id, locale), `claims/${id}@${locale}`, item);
        }),
      ),
      { locale: completeFrom(() => [...LOCALES]), id: completeFrom(claimIds) },
    ),
    templateConfig(claims),
    observeRead(claims.name, claims.surface, telemetry, (uri, variables) => {
      const locale = localeVariable(variables.locale, uri);
      const id = stringVariable(variables.id);
      const value = content.getClaim(id, locale);
      if (!value) throw new ResourceNotFoundError(uri.href);
      return jsonResource(uri, value);
    }),
  );
}

export { resourceSurfaceOf };
