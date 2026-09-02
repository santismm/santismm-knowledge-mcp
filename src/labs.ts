import { norm, queryTerms } from './shape.ts';

/**
 * Federated SANTISMM Labs catalogue and deterministic calculators.
 *
 * Labs owns the formulas and executes them. The knowledge MCP deliberately
 * proxies the canonical API instead of copying arithmetic into this package:
 * one formula version serves the interactive UI, REST callers and MCP agents.
 */

export const LABS_API_URL =
  process.env.SANTISMM_LABS_API_URL ?? 'https://labs.santismm.com/api/labs';

const LABS_SERVICE_ORIGIN = new URL(LABS_API_URL).origin;
const LABS_CANONICAL_ORIGIN = 'https://labs.santismm.com';
const CACHE_TTL_MS = 5 * 60 * 1000;

export type LabKind = 'calculator' | 'converter' | 'experiment' | 'educational-game';
export type ExecutableLabSlug =
  | 'agent-economics'
  | 'evaluation-sample-size'
  | 'human-supervision-capacity';

export interface LabDefinition {
  slug: string;
  kind: LabKind;
  label: string;
  title: string;
  description: string;
  inputs: string[];
  outputs: string[];
  formulas?: string[];
  assumptions: string[];
  version: string;
  updated: string;
  canonical_url: string;
  api_url: string;
  calculation_url?: string;
  related_content?: Array<{ title: string; url: string; relationship: string }>;
}

interface LabCorpus {
  source: string;
  canonical_url: string;
  count: number;
  results: LabDefinition[];
}

let cache: { expiresAt: number; corpus: LabCorpus } | undefined;
let pending: Promise<LabCorpus> | undefined;

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function validLab(value: unknown): value is LabDefinition {
  const lab = value as Partial<LabDefinition> | null;
  return Boolean(
    lab &&
      typeof lab.slug === 'string' &&
      ['calculator', 'converter', 'experiment', 'educational-game'].includes(String(lab.kind)) &&
      typeof lab.label === 'string' &&
      typeof lab.title === 'string' &&
      typeof lab.description === 'string' &&
      strings(lab.inputs) &&
      strings(lab.outputs) &&
      (lab.formulas === undefined || strings(lab.formulas)) &&
      strings(lab.assumptions) &&
      typeof lab.version === 'string' &&
      typeof lab.updated === 'string' &&
      typeof lab.canonical_url === 'string' &&
      lab.canonical_url.startsWith(`${LABS_CANONICAL_ORIGIN}/`) &&
      typeof lab.api_url === 'string' &&
      lab.api_url.startsWith(`${LABS_CANONICAL_ORIGIN}/api/labs/`) &&
      (lab.calculation_url === undefined || lab.calculation_url.startsWith(`${LABS_CANONICAL_ORIGIN}/api/calculate/`)),
  );
}

async function fetchCorpus(): Promise<LabCorpus> {
  const response = await fetch(LABS_API_URL, {
    headers: { Accept: 'application/json', 'User-Agent': 'santismm-knowledge-mcp/0.4.1' },
    signal: AbortSignal.timeout(8_000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Labs API returned HTTP ${response.status}`);
  const raw = await response.json() as Partial<LabCorpus>;
  if (
    raw.source !== 'SANTISMM Labs' ||
    typeof raw.canonical_url !== 'string' ||
    !Array.isArray(raw.results) ||
    !raw.results.every(validLab) ||
    raw.count !== raw.results.length
  ) {
    throw new Error('Labs API returned an invalid catalogue contract');
  }
  return raw as LabCorpus;
}

export async function loadLabs(): Promise<LabDefinition[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.corpus.results;
  if (!pending) {
    pending = fetchCorpus()
      .then((corpus) => {
        cache = { expiresAt: Date.now() + CACHE_TTL_MS, corpus };
        return corpus;
      })
      .finally(() => {
        pending = undefined;
      });
  }
  return (await pending).results;
}

export interface LabSearchResult extends LabDefinition {
  score: number;
  matchedFields: string[];
  matchedTerms: string[];
}

export function searchLabCorpus(labs: LabDefinition[], query: string, limit: number): LabSearchResult[] {
  const terms = queryTerms(query);
  const phrase = norm(query).trim();
  if (terms.length === 0) return [];
  const fields: Array<[keyof LabDefinition, number]> = [
    ['title', 8], ['slug', 7], ['description', 6], ['inputs', 4], ['outputs', 4],
    ['formulas', 3], ['assumptions', 2], ['kind', 1],
  ];
  return labs
    .map((lab) => {
      const matchedFields = new Set<string>();
      const matchedTerms = new Set<string>();
      let score = 0;
      for (const [field, weight] of fields) {
        const raw = lab[field];
        const value = norm(Array.isArray(raw) ? raw.join(' ') : String(raw ?? ''));
        for (const term of terms) {
          if (!value.includes(term)) continue;
          score += weight;
          matchedFields.add(field);
          matchedTerms.add(term);
        }
        if (phrase.length > 2 && value.includes(phrase)) score += weight * 2;
      }
      const coverage = matchedTerms.size / terms.length;
      return {
        ...lab,
        score: Math.round(score * coverage * coverage * 100) / 100,
        matchedFields: [...matchedFields],
        matchedTerms: [...matchedTerms],
      };
    })
    .filter((lab) => lab.score > 0)
    .sort((a, b) => b.score - a.score || b.updated.localeCompare(a.updated) || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}

export async function executeLabCalculator(
  slug: ExecutableLabSlug,
  inputs: Record<string, number>,
  locale: 'en' | 'es' | 'pt' = 'en',
): Promise<Record<string, unknown>> {
  const response = await fetch(`${LABS_SERVICE_ORIGIN}/api/calculate/${slug}?locale=${locale}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'santismm-knowledge-mcp/0.4.1',
    },
    body: JSON.stringify(inputs),
    signal: AbortSignal.timeout(8_000),
    cache: 'no-store',
  });
  const raw = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof raw.error === 'string' ? raw.error : `HTTP ${response.status}`;
    throw new Error(`Labs calculator ${slug} failed: ${message}`);
  }
  if (
    raw.slug !== slug ||
    typeof raw.version !== 'string' ||
    typeof raw.canonical_url !== 'string' ||
    typeof raw.api_url !== 'string' ||
    typeof raw.inputs !== 'object' ||
    typeof raw.results !== 'object' ||
    !Array.isArray(raw.assumptions) ||
    !Array.isArray(raw.warnings)
  ) {
    throw new Error(`Labs calculator ${slug} returned an invalid result contract`);
  }
  return raw;
}
