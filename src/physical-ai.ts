import type { Locale } from './content.ts';

/**
 * Federated Physical AI (physicalai.santismm.com).
 *
 * Physical AI owns its dataset and its engines — ROI/TCO, the readiness
 * assessment, the platform comparison and search — and serves them through a
 * canonical API (`docs/api.md` in santismm/physicalai). This module is an
 * adapter over that API and nothing more: no platform text is copied into this
 * repository, no HTML is scraped, and no formula is reimplemented. The page, the
 * REST call and the MCP tool therefore run the same code, and `model_version`
 * in a result says which version that was.
 *
 * Reads are cached briefly because the catalogue changes monthly; the engines
 * are never cached, because their answer depends on the caller's inputs.
 */

export const PHYSICAL_AI_API_URL = (
  process.env.SANTISMM_PHYSICAL_AI_API_URL ?? 'https://physicalai.santismm.com/api'
).replace(/\/$/, '');

/** Where the API is served from — overridable for local verification. */
const SERVICE_ORIGIN = new URL(PHYSICAL_AI_API_URL).origin;
/** Where its citations point — never overridable: a local run still cites production. */
export const PHYSICAL_AI_CANONICAL_ORIGIN = 'https://physicalai.santismm.com';
export const PHYSICAL_AI_OPENAPI_URL = `${PHYSICAL_AI_CANONICAL_ORIGIN}/openapi.json`;

const USER_AGENT = 'santismm-knowledge-mcp/0.6.0';
const READ_TTL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 8_000;
const MAX_CACHED = 200;

export const PHYSICAL_AI_TYPES = ['platform', 'case_study', 'guide', 'taxonomy', 'methodology'] as const;
export type PhysicalAiType = (typeof PHYSICAL_AI_TYPES)[number];

/** Item types `get_physical_ai_item` can read; `source` resolves a citation id. */
export const PHYSICAL_AI_ITEM_TYPES = [...PHYSICAL_AI_TYPES, 'source'] as const;
export type PhysicalAiItemType = (typeof PHYSICAL_AI_ITEM_TYPES)[number];

/**
 * The API answered, and the answer is a refusal (400 invalid input, 404 unknown
 * slug). Kept apart from "the API could not be reached": the first is the
 * caller's to fix and carries the field errors; the second is ours.
 */
export class PhysicalAiRejection extends Error {
  constructor(
    readonly status: number,
    readonly body: Record<string, unknown>,
  ) {
    super(`Physical AI API answered HTTP ${status}: ${String(body.error ?? 'error')}`);
  }
}

type Json = Record<string, unknown>;

const cache = new Map<string, { expiresAt: number; value: Json }>();
const pending = new Map<string, Promise<Json>>();

function envelopeOk(raw: unknown): raw is Json {
  const body = raw as Json | null;
  return Boolean(
    body &&
      typeof body === 'object' &&
      typeof body.api_version === 'string' &&
      typeof body.dataset_version === 'string',
  );
}

async function request(path: string, init?: { method: 'POST'; body: unknown }): Promise<Json> {
  const response = await fetch(`${SERVICE_ORIGIN}/api${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
      ...(init ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error(`Physical AI API returned non-JSON (HTTP ${response.status}) for ${path}`);
  }
  if (response.status === 400 || response.status === 404 || response.status === 413) {
    throw new PhysicalAiRejection(response.status, (raw ?? {}) as Json);
  }
  if (!response.ok) throw new Error(`Physical AI API returned HTTP ${response.status} for ${path}`);
  if (!envelopeOk(raw)) throw new Error(`Physical AI API returned an invalid envelope for ${path}`);
  return raw;
}

async function read(path: string): Promise<Json> {
  const hit = cache.get(path);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  let inFlight = pending.get(path);
  if (!inFlight) {
    inFlight = request(path)
      .then((value) => {
        if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value as string);
        cache.set(path, { expiresAt: Date.now() + READ_TTL_MS, value });
        return value;
      })
      .finally(() => pending.delete(path));
    pending.set(path, inFlight);
  }
  return inFlight;
}

function query(params: Record<string, string | number | readonly string[] | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

/** Rewrite any service-origin URL in a payload to the canonical origin (local verification only). */
function canonicalise<T>(value: T): T {
  if (SERVICE_ORIGIN === PHYSICAL_AI_CANONICAL_ORIGIN) return value;
  return JSON.parse(JSON.stringify(value).split(SERVICE_ORIGIN).join(PHYSICAL_AI_CANONICAL_ORIGIN)) as T;
}

// ── Search ──────────────────────────────────────────────────────────────────

export interface PhysicalAiSearchInput {
  q: string;
  types?: readonly PhysicalAiType[];
  families?: readonly string[];
  environments?: readonly string[];
  sectors?: readonly string[];
  locale?: Locale;
  limit?: number;
}

export interface PhysicalAiSearchHit extends Json {
  id: string;
  type: PhysicalAiType;
  slug: string;
  title: string;
  summary?: string;
  canonical_url: string;
  api_url: string;
  score: number;
}

function validHit(value: unknown): value is PhysicalAiSearchHit {
  const hit = value as Partial<PhysicalAiSearchHit> | null;
  return Boolean(
    hit &&
      typeof hit.id === 'string' &&
      (PHYSICAL_AI_TYPES as readonly string[]).includes(String(hit.type)) &&
      typeof hit.slug === 'string' &&
      typeof hit.title === 'string' &&
      typeof hit.canonical_url === 'string' &&
      typeof hit.api_url === 'string' &&
      typeof hit.score === 'number',
  );
}

export async function searchPhysicalAi(input: PhysicalAiSearchInput): Promise<Json & { results: PhysicalAiSearchHit[] }> {
  const body = await read(
    `/search${query({
      q: input.q,
      types: input.types,
      families: input.families,
      environments: input.environments,
      sectors: input.sectors,
      locale: input.locale ?? 'en',
      limit: input.limit ?? 10,
    })}`,
  );
  const results = body.results;
  if (!Array.isArray(results) || !results.every(validHit)) {
    throw new Error('Physical AI search returned an invalid result contract');
  }
  return canonicalise(body as Json & { results: PhysicalAiSearchHit[] });
}

// ── Items ───────────────────────────────────────────────────────────────────

const ITEM_PATHS: Record<PhysicalAiItemType, (slug: string) => string> = {
  platform: (slug) => `/platforms/${encodeURIComponent(slug)}`,
  case_study: (slug) => `/case-studies/${encodeURIComponent(slug)}`,
  guide: (slug) => `/guides/${encodeURIComponent(slug)}`,
  source: (slug) => `/sources/${encodeURIComponent(slug)}`,
  taxonomy: () => '/taxonomy',
  methodology: () => '/methodology',
};

/** The key under which each item endpoint returns its record. */
const ITEM_KEYS: Partial<Record<PhysicalAiItemType, string>> = {
  platform: 'platform',
  case_study: 'case_study',
  guide: 'guide',
  source: 'source',
};

export const PHYSICAL_AI_SINGLETONS = ['taxonomy', 'methodology'] as const satisfies readonly PhysicalAiItemType[];

export async function getPhysicalAiItem(type: PhysicalAiItemType, slug: string | undefined, locale: Locale): Promise<Json> {
  const singleton = (PHYSICAL_AI_SINGLETONS as readonly string[]).includes(type);
  if (!singleton && !slug) {
    throw new PhysicalAiRejection(400, {
      error: 'invalid_input',
      details: [{ field: 'slug', message: `required for type ${type}` }],
    });
  }
  const body = await read(`${ITEM_PATHS[type](slug ?? '')}${query({ locale })}`);
  const key = ITEM_KEYS[type];
  if (key && (typeof body[key] !== 'object' || body[key] === null)) {
    throw new Error(`Physical AI ${type} endpoint returned no "${key}" record`);
  }
  return canonicalise({ ...body, type, ...(slug && !singleton ? { slug } : {}) });
}

/** Every listable item, for not-found hints and resource completion. */
export async function listPhysicalAi(kind: 'platforms' | 'case-studies' | 'guides', locale: Locale = 'en'): Promise<Json[]> {
  const body = await read(`/${kind}${query({ locale })}`);
  if (!Array.isArray(body.items)) throw new Error(`Physical AI /${kind} returned no items array`);
  return canonicalise(body.items as Json[]);
}

// ── Engines (never cached) ──────────────────────────────────────────────────

export async function comparePhysicalAiPlatforms(platforms: string[], criteria: string[] | undefined, locale: Locale): Promise<Json> {
  return canonicalise(await request(`/compare${query({ locale })}`, { method: 'POST', body: { platforms, criteria } }));
}

export async function calculatePhysicalAiRoi(inputs: Json, locale: Locale): Promise<Json> {
  return canonicalise(await request(`/calculate/roi${query({ locale })}`, { method: 'POST', body: inputs }));
}

export async function assessPhysicalAiFit(inputs: Json, locale: Locale): Promise<Json> {
  return canonicalise(await request(`/assess-fit${query({ locale })}`, { method: 'POST', body: inputs }));
}

// ── Overview ────────────────────────────────────────────────────────────────

/**
 * Counts and version for `get_overview`, read from the host's own ai-index.json
 * — the same numbers its pages state — rather than counted again here.
 */
export async function physicalAiOverview(): Promise<Json> {
  const hit = cache.get('ai-index');
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const response = await fetch(`${SERVICE_ORIGIN}/ai-index.json`, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Physical AI ai-index.json returned HTTP ${response.status}`);
  const index = (await response.json()) as Json;
  const value = canonicalise({
    url: `${PHYSICAL_AI_CANONICAL_ORIGIN}/`,
    dataset_version: index.dataset_reviewed ?? index.dataset_version ?? null,
    counts: index.counts ?? null,
    languages: index.languages ?? null,
    api: index.api ?? null,
    openapi: PHYSICAL_AI_OPENAPI_URL,
  });
  cache.set('ai-index', { expiresAt: Date.now() + READ_TTL_MS, value });
  return value;
}
