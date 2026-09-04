import { norm, queryTerms } from './shape.ts';
import type { Locale } from './content.ts';

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

type LabLocale = 'en' | 'es' | 'pt';
type LabCopy = Pick<LabDefinition, 'title' | 'description'>;

/**
 * The Labs catalogue is currently served in Spanish. Search still accepts a
 * locale, so returning that Spanish display copy for English and Portuguese
 * requests made the contract formally valid but semantically false. Keep the
 * executable definition and formula ownership in Labs; this small projection
 * only localizes the two fields search_all displays and ranks.
 */
const LAB_SEARCH_COPY: Record<string, Record<'en' | 'pt', LabCopy>> = {
  'agent-economics': {
    en: { title: 'The real economics of an AI agent', description: 'Compare an agent\'s cost, capacity and return with the manual process.' },
    pt: { title: 'A economia real de um agente', description: 'Compare custo, capacidade e retorno de um agente com o processo manual.' },
  },
  'evaluation-sample-size': {
    en: { title: 'Evaluation sample size', description: 'Calculate how many evaluations are needed to detect and estimate failures.' },
    pt: { title: 'Tamanho da amostra de avaliacao', description: 'Calcule quantas avaliacoes sao necessarias para detectar e estimar falhas.' },
  },
  'human-supervision-capacity': {
    en: { title: 'Human supervision capacity', description: 'Size hours, FTE, cost, sustainable volume and the operational queue.' },
    pt: { title: 'Capacidade de supervisao humana', description: 'Dimensione horas, FTE, custo, volume sustentavel e a fila operacional.' },
  },
  'llm-context-converter': {
    en: { title: 'LLM context converter', description: 'Convert tokens into words, pages, messages, cost and reading time.' },
    pt: { title: 'Conversor de contexto de LLM', description: 'Converta tokens em palavras, paginas, mensagens, custo e tempo de leitura.' },
  },
  'control-framework-translator': {
    en: { title: 'Control framework translator', description: 'Map operational controls across AI governance frameworks.' },
    pt: { title: 'Tradutor de controles', description: 'Relacione controles operacionais entre estruturas de governanca de IA.' },
  },
  'agent-vector': {
    en: { title: 'Agent vector', description: 'Describe and compare agents through their operational dimensions.' },
    pt: { title: 'Vetor de um agente', description: 'Descreva e compare agentes por meio de suas dimensoes operacionais.' },
  },
  'benchmark-detective': {
    en: { title: 'Benchmark detective', description: 'Learn to identify misleading metrics and weak claims.' },
    pt: { title: 'Detetive de benchmarks', description: 'Aprenda a identificar metricas enganosas e alegacoes fracas.' },
  },
  'model-agent-harness': {
    en: { title: 'Model, agent or harness', description: 'Classify the layers of an AI system and understand their responsibilities.' },
    pt: { title: 'Modelo, agente ou harness', description: 'Classifique as camadas de um sistema de IA e entenda suas responsabilidades.' },
  },
  'world-exam-challenge': {
    en: { title: 'World exam challenge', description: 'Compare education systems by coverage, rigor and cognitive demand.' },
    pt: { title: 'Desafio mundial de exames', description: 'Compare sistemas educacionais por cobertura, rigor e exigencia cognitiva.' },
  },
  'close-the-gap': {
    en: { title: 'Close the gap', description: 'Choose controls that close operational gaps in agentic systems.' },
    pt: { title: 'Feche a lacuna', description: 'Escolha controles que fechem lacunas operacionais em sistemas agenticos.' },
  },
};

function localizedLab(lab: LabDefinition, locale: Locale): LabDefinition {
  const resolved: LabLocale = locale === 'es' || locale === 'pt' ? locale : 'en';
  if (resolved === 'es') return lab;
  const copy = LAB_SEARCH_COPY[lab.slug]?.[resolved];
  return copy ? { ...lab, ...copy } : lab;
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
    headers: { Accept: 'application/json', 'User-Agent': 'santismm-knowledge-mcp/0.5.0' },
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

export function searchLabCorpus(
  labs: LabDefinition[],
  query: string,
  limit: number,
  locale: Locale = 'en',
): LabSearchResult[] {
  const terms = queryTerms(query);
  const phrase = norm(query).trim();
  if (terms.length === 0) return [];
  const fields: Array<[keyof LabDefinition, number]> = [
    ['title', 8], ['slug', 7], ['description', 6], ['inputs', 4], ['outputs', 4],
    ['formulas', 3], ['assumptions', 2], ['kind', 1],
  ];
  return labs
    .map((lab) => localizedLab(lab, locale))
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
  locale: Locale = 'en',
): Promise<Record<string, unknown>> {
  // The separately deployed Labs execution service currently publishes these
  // three locales. Core corpus reads support all seven; calculator prose falls
  // back explicitly until that owner service expands its own contract.
  const resolvedLocale = (['en', 'es', 'pt'] as const).includes(locale as 'en' | 'es' | 'pt')
    ? (locale as 'en' | 'es' | 'pt')
    : 'en';
  const response = await fetch(`${LABS_SERVICE_ORIGIN}/api/calculate/${slug}?locale=${resolvedLocale}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'santismm-knowledge-mcp/0.5.0',
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
  return {
    ...raw,
    requested_locale: locale,
    resolved_locale: resolvedLocale,
    fallback: locale !== resolvedLocale,
  };
}
