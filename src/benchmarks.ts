import { norm, queryTerms } from './shape.ts';
import type { Locale } from './content.ts';

/**
 * Federated AI Agent Benchmarks (benchmarks.santismm.com).
 *
 * The benchmarks site owns the catalogue, the capability radar and the
 * "AI by profession" rankings, and publishes each as a JSON file. The ranking
 * in particular is computed once over there (`scripts/lib/professions-rank.mjs`
 * writes `professions-ranking.json`) and the page renders that same file, so
 * this module reads it and never recomputes a score: an agent and a visitor
 * must not be able to get different podiums for the same profession.
 *
 * Three files, read at call time and cached for five minutes like Labs:
 *   - professions-ranking.json  podiums, tables, direct/indirect evaluation
 *   - data.json                 the versioned benchmark catalogue
 *   - radar.json                capability axes and per-model launch scores
 */

export const BENCHMARKS_ORIGIN = (process.env.SANTISMM_BENCHMARKS_URL ?? 'https://benchmarks.santismm.com')
  .replace(/\/$/, '');
const CANONICAL_ORIGIN = 'https://benchmarks.santismm.com';
const CACHE_TTL_MS = 5 * 60 * 1000;

type L10n = { en: string; es: string };

export interface RankedModel {
  rank?: number;
  id: string;
  name: string;
  org: string;
  score: number;
  coverage?: number;
  partial?: boolean;
  price?: number | null;
  open_weights?: boolean;
}

export interface ProfessionRanking {
  id: string;
  name: L10n;
  group: string;
  url: string;
  evaluation: { type: 'direct' | 'indirect'; direct_share: number };
  tasks: Array<{ text: L10n; measured_by: string[] }>;
  unmeasured_tasks: L10n[];
  benchmarks: Array<{ benchmark: string; weight: number; direct: boolean; comparable: boolean }>;
  picks: {
    first: RankedModel | null;
    second: RankedModel | null;
    close_call: boolean;
    best_value: RankedModel | null;
    best_open_weights: RankedModel | null;
  };
  ranking: RankedModel[];
  not_ranked: Array<{ id: string; name: string; coverage: number }>;
  caveat: L10n;
  not_measured: L10n;
}

interface RankingFile {
  professions_version: string;
  radar_version: string;
  dataset_version: string;
  released: string;
  license: string;
  page: string;
  scoring: Record<string, unknown>;
  professions: ProfessionRanking[];
}

interface DataFile {
  version: string;
  as_of: string;
  canonical_url: string;
  methodology_url: string;
  license: string;
  benchmarks: Array<Record<string, unknown> & { name: string }>;
}

interface RadarFile {
  version: string;
  page: string;
  axes: Array<{ id: string; name: L10n }>;
  modules: Array<{ id: string; name: L10n }>;
  mapping: Array<{ benchmark: string; axis: string; relevance: number }>;
  models: Array<{ id: string; name: string; org: string }>;
  model_scores: Array<{ model: string; benchmark: string; score: number; unit: string; table?: string; evidence?: string }>;
  complementary: Array<Record<string, unknown> & { name: string }>;
}

const isL10n = (v: unknown): v is L10n =>
  !!v && typeof (v as L10n).en === 'string' && typeof (v as L10n).es === 'string';
const isModel = (v: unknown) =>
  v === null || (!!v && typeof (v as RankedModel).id === 'string' && typeof (v as RankedModel).score === 'number');

function validRanking(raw: Partial<RankingFile>): raw is RankingFile {
  return (
    typeof raw.professions_version === 'string' &&
    typeof raw.dataset_version === 'string' &&
    typeof raw.radar_version === 'string' &&
    typeof raw.page === 'string' &&
    raw.page.startsWith(`${CANONICAL_ORIGIN}/`) &&
    Array.isArray(raw.professions) &&
    raw.professions.length > 0 &&
    raw.professions.every(
      (p) =>
        typeof p.id === 'string' &&
        isL10n(p.name) &&
        (p.evaluation?.type === 'direct' || p.evaluation?.type === 'indirect') &&
        Array.isArray(p.tasks) &&
        p.tasks.every((t) => isL10n(t.text) && Array.isArray(t.measured_by)) &&
        Array.isArray(p.unmeasured_tasks) &&
        Array.isArray(p.ranking) &&
        p.ranking.every(isModel) &&
        !!p.picks &&
        isModel(p.picks.first) &&
        isL10n(p.caveat) &&
        isL10n(p.not_measured) &&
        typeof p.url === 'string' &&
        p.url.startsWith(`${CANONICAL_ORIGIN}/`),
    )
  );
}

function validData(raw: Partial<DataFile>): raw is DataFile {
  return (
    typeof raw.version === 'string' &&
    typeof raw.canonical_url === 'string' &&
    Array.isArray(raw.benchmarks) &&
    raw.benchmarks.length > 0 &&
    raw.benchmarks.every((b) => typeof b?.name === 'string')
  );
}

function validRadar(raw: Partial<RadarFile>): raw is RadarFile {
  return (
    typeof raw.version === 'string' &&
    Array.isArray(raw.axes) &&
    Array.isArray(raw.modules) &&
    Array.isArray(raw.mapping) &&
    Array.isArray(raw.models) &&
    raw.models.every((m) => typeof m.id === 'string' && typeof m.name === 'string') &&
    Array.isArray(raw.model_scores) &&
    Array.isArray(raw.complementary)
  );
}

const caches = new Map<string, { expiresAt: number; value: unknown }>();
const pendings = new Map<string, Promise<unknown>>();

async function cachedJson<T>(file: string, valid: (raw: Partial<T>) => raw is T): Promise<T> {
  const hit = caches.get(file);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  let pending = pendings.get(file);
  if (!pending) {
    pending = (async () => {
      const response = await fetch(`${BENCHMARKS_ORIGIN}/${file}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'santismm-knowledge-mcp/0.5.0' },
        signal: AbortSignal.timeout(8_000),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Benchmarks ${file} returned HTTP ${response.status}`);
      const raw = (await response.json()) as Partial<T>;
      if (!valid(raw)) throw new Error(`Benchmarks ${file} returned an invalid contract`);
      caches.set(file, { expiresAt: Date.now() + CACHE_TTL_MS, value: raw });
      return raw;
    })().finally(() => pendings.delete(file));
    pendings.set(file, pending);
  }
  return (await pending) as T;
}

export const loadRanking = () => cachedJson<RankingFile>('professions-ranking.json', validRanking);
const loadData = () => cachedJson<DataFile>('data.json', validData);
const loadRadar = () => cachedJson<RadarFile>('radar.json', validRadar);

/** The site publishes English and Spanish; every other locale falls back to English and says so. */
export function benchLocale(locale?: Locale): 'en' | 'es' {
  return locale === 'es' ? 'es' : 'en';
}

const pick = (v: L10n, l: 'en' | 'es') => v[l] ?? v.en;
const ident = (s: string) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();

/** URL-safe identifier for a benchmark name; the name itself is also accepted. */
export function benchmarkSlug(name: string): string {
  return ident(name).replace(/ /g, '-');
}

// ── Professions ─────────────────────────────────────────────────────────────

/**
 * How much of this profession the ranking actually measures — the arithmetic
 * stated, and the two limits told apart.
 *
 * `unmeasured_tasks: []` was read as "the ranking measures everything that
 * matters", which it never meant, and the record said nothing to stop that
 * reading: right beside the empty list, `not_measured` excluded teaching
 * quality from the student ranking. Both were true. They are different axes.
 *
 *   - TASKS — what this profession does. The file lists them and names the
 *     benchmarks behind each; the ones with none are `unmeasured_tasks`.
 *     Complete task coverage means every listed task has at least one
 *     benchmark, nothing more.
 *   - DIMENSIONS — what no benchmark in the catalogue evaluates at all
 *     (`not_measured`). Outside the ranking regardless of task coverage, so
 *     it still applies when `unmeasured_tasks` is empty.
 *
 * Derived from the file, never written out: `tasks_measured` is counted off
 * `measured_by`, so the numbers cannot disagree with the list above them.
 */
function taskCoverage(p: ProfessionRanking, l: 'en' | 'es') {
  const measured = p.tasks.filter((t) => t.measured_by.length > 0).length;
  const unmeasured = p.tasks.length - measured;
  const complete = unmeasured === 0;
  return {
    tasks_listed: p.tasks.length,
    tasks_measured: measured,
    tasks_unmeasured: unmeasured,
    dimensions_not_measured: pick(p.not_measured, l),
    how_to_present: complete
      ? `Task coverage is complete: all ${p.tasks.length} tasks listed here have at least one benchmark behind them. That is NOT the same as a complete measurement — \`dimensions_not_measured\` names what no benchmark evaluates at all, and it applies anyway. Do not present an empty \`unmeasured_tasks\` as "the ranking measures everything that matters".`
      : `Task coverage is partial: ${unmeasured} of the ${p.tasks.length} tasks listed here have no benchmark behind them (\`unmeasured_tasks\`). On top of that, \`dimensions_not_measured\` names what no benchmark evaluates at all. Both limits apply; name them separately.`,
  };
}


export function professionCard(p: ProfessionRanking, file: RankingFile, locale?: Locale) {
  const l = benchLocale(locale);
  return {
    id: p.id,
    name: pick(p.name, l),
    group: p.group,
    evaluation: p.evaluation.type,
    first: p.picks.first?.name ?? null,
    unmeasured_tasks: p.unmeasured_tasks.length,
    // Zero unmeasured tasks is not a clean bill of health, and the card was
    // read as one. The two limits are on different axes: `unmeasured_tasks`
    // counts this profession's own listed tasks that no benchmark covers,
    // while `not_measured` names qualities no benchmark in the catalogue
    // evaluates at all — which is why the student ranking can have nothing
    // unmeasured and still exclude teaching quality. The card carries the
    // second one too, in a word, so a list cannot show half the caveat.
    not_measured: pick(p.not_measured, l),
    canonical_url: p.url,
    dataset_version: file.dataset_version,
  };
}

/** One profession's ranking, localised, with the instruction an agent must follow when quoting it. */
export function professionRecord(p: ProfessionRanking, file: RankingFile, locale?: Locale, limit?: number) {
  const l = benchLocale(locale);
  const indirect = p.evaluation.type === 'indirect';
  return {
    id: p.id,
    name: pick(p.name, l),
    group: p.group,
    requested_locale: locale ?? 'en',
    resolved_locale: l,
    evaluation: {
      ...p.evaluation,
      how_to_present: indirect
        ? 'INDIRECT EVALUATION: no benchmark reproduces this profession\'s work yet; the ranking rests on general tests (documents, data, writing, factuality). Say so explicitly, present it as a guide rather than a measurement, and list the unmeasured tasks.'
        : 'Direct evaluation: benchmarks that reproduce this profession\'s own tasks carry at least the stated share of the measurable weight. Still a shortlist, not a verdict.',
    },
    tasks: p.tasks.map((t) => ({ task: pick(t.text, l), measured_by: t.measured_by })),
    unmeasured_tasks: p.unmeasured_tasks.map((t) => pick(t, l)),
    coverage: taskCoverage(p, l),
    picks: p.picks,
    ranking: limit ? p.ranking.slice(0, limit) : p.ranking,
    not_ranked: p.not_ranked,
    benchmarks: p.benchmarks,
    caveat: pick(p.caveat, l),
    not_measured: pick(p.not_measured, l),
    scoring: file.scoring,
    canonical_url: p.url,
    data_url: `${CANONICAL_ORIGIN}/professions-ranking.json`,
    dataset_version: file.dataset_version,
    radar_version: file.radar_version,
    professions_version: file.professions_version,
    license: file.license,
  };
}

/**
 * Professions whose names contain every word asked for, as word starts.
 *
 * Published names carry gender and alternatives ("Traductor/a / localización",
 * "Médico/a y sanitario/a"), so an agent asking for "traductor", "médico" or
 * "lawyers" would otherwise miss on an exact comparison.
 */
export function professionCandidates(file: RankingFile, wanted: string): ProfessionRanking[] {
  const terms = queryTerms(wanted);
  if (terms.length === 0) return [];
  return file.professions.filter((p) => {
    const words = ident(`${p.id.replace(/_/g, ' ')} ${p.name.en} ${p.name.es}`).split(' ');
    return terms.every((t) => words.some((w) => w.startsWith(t)));
  });
}

/**
 * By id, or by the profession's name in English or Spanish, ignoring case and
 * accents; failing that, by words that pick out exactly one profession.
 */
export function findProfession(file: RankingFile, wanted: string): ProfessionRanking | undefined {
  const w = ident(wanted);
  const exact = file.professions.find(
    (p) => ident(p.id) === w || ident(p.name.en) === w || ident(p.name.es) === w,
  );
  if (exact) return exact;
  const candidates = professionCandidates(file, wanted);
  return candidates.length === 1 ? candidates[0] : undefined;
}

// ── Benchmarks ──────────────────────────────────────────────────────────────

export interface BenchmarkCorpus {
  ranking: RankingFile;
  data: DataFile;
  radar: RadarFile;
}

export async function loadBenchmarkCorpus(): Promise<BenchmarkCorpus> {
  const [ranking, data, radar] = await Promise.all([loadRanking(), loadData(), loadRadar()]);
  return { ranking, data, radar };
}

/** Every benchmark a ranking can cite: the agentic catalogue plus the radar's complementary list. */
export function benchmarkRows(c: BenchmarkCorpus): Array<Record<string, unknown> & { name: string; list: string }> {
  return [
    ...c.data.benchmarks.map((b) => ({ ...b, list: 'catalog' })),
    ...c.radar.complementary.map((b) => ({ ...b, list: 'complementary' })),
  ];
}

export function benchmarkCard(b: Record<string, unknown> & { name: string; list: string }) {
  return {
    slug: benchmarkSlug(b.name),
    name: b.name,
    list: b.list,
    measures: typeof b.measures === 'string' ? b.measures : undefined,
    group: typeof b.group === 'string' ? b.group : undefined,
    saturation: typeof b.saturation === 'string' ? b.saturation : undefined,
    sota_normalized: typeof b.sotaNorm === 'number' ? b.sotaNorm : null,
  };
}

export function findBenchmark(c: BenchmarkCorpus, wanted: string) {
  const w = ident(wanted);
  return benchmarkRows(c).find((b) => ident(b.name) === w || benchmarkSlug(b.name) === wanted);
}

/** The catalogue row plus where the radar files it, who has scores on it and which professions weigh it. */
export function benchmarkRecord(c: BenchmarkCorpus, b: Record<string, unknown> & { name: string; list: string }) {
  const MODEL = new Map(c.radar.models.map((m) => [m.id, m]));
  const where = new Map([...c.radar.axes, ...c.radar.modules].map((a) => [a.id, a]));
  const scores = c.radar.model_scores
    .filter((s) => s.benchmark === b.name)
    .map((s) => ({ model: s.model, name: MODEL.get(s.model)?.name, org: MODEL.get(s.model)?.org, score: s.score, unit: s.unit, table: s.table, evidence: s.evidence }));
  const labs = new Set(scores.map((s) => s.org));
  return {
    ...b,
    slug: benchmarkSlug(b.name),
    radar: c.radar.mapping
      .filter((m) => m.benchmark === b.name)
      .map((m) => ({ id: m.axis, kind: c.radar.axes.some((a) => a.id === m.axis) ? 'axis' : 'module', name: where.get(m.axis)?.name, relevance: m.relevance })),
    model_scores: scores,
    comparable_across_labs: labs.size >= 2,
    used_by_professions: c.ranking.professions
      .filter((p) => p.benchmarks.some((w) => w.benchmark === b.name))
      .map((p) => p.id),
    canonical_url: c.data.canonical_url,
    methodology_url: c.data.methodology_url,
    dataset_version: c.data.version,
    radar_version: c.radar.version,
    citation: `AI Agent Benchmarks, dataset ${c.data.version} (${c.data.canonical_url}).`,
  };
}

/**
 * Raw launch and harness scores, side by side, for the models asked for.
 *
 * No new aggregate is invented here. With a profession, the rows come straight
 * from the published ranking; without one, the per-benchmark scores from
 * radar.json, each with its unit, the table it was read from and its evidence
 * grade.
 */
export function compareModels(c: BenchmarkCorpus, wanted: string[], profession?: ProfessionRanking) {
  const resolved: Array<{ id: string; name: string; org: string }> = [];
  const unknown: string[] = [];
  for (const w of wanted) {
    const m = c.radar.models.find((x) => ident(x.id) === ident(w) || ident(x.name) === ident(w));
    if (m) { if (!resolved.some((r) => r.id === m.id)) resolved.push(m); } else unknown.push(w);
  }
  const ids = new Set(resolved.map((m) => m.id));
  const orgOf = new Map(c.radar.models.map((m) => [m.id, m.org]));
  const orgs = (b: string) => new Set(c.radar.model_scores.filter((s) => s.benchmark === b).map((s) => orgOf.get(s.model)));
  const benchmarks = [...new Set(c.radar.model_scores.filter((s) => ids.has(s.model)).map((s) => s.benchmark))]
    .sort()
    .map((benchmark) => ({
      benchmark,
      comparable_across_labs: orgs(benchmark).size >= 2,
      scores: c.radar.model_scores
        .filter((s) => s.benchmark === benchmark && ids.has(s.model))
        .map((s) => ({ model: s.model, score: s.score, unit: s.unit, table: s.table, evidence: s.evidence })),
    }));
  return {
    models: resolved,
    unknown_models: unknown,
    available_models: c.radar.models.map((m) => m.id),
    profession: profession
      ? { id: profession.id, evaluation: profession.evaluation.type, rows: profession.ranking.filter((r) => ids.has(r.id)), not_ranked: profession.not_ranked.filter((r) => ids.has(r.id)) }
      : null,
    benchmarks,
    note: 'Scores are not comparable across benchmarks or units. A benchmark with comparable_across_labs=false has figures from one lab only and should not decide a choice.',
    dataset_version: c.data.version,
    radar_version: c.radar.version,
    canonical_url: `${CANONICAL_ORIGIN}/radar.html`,
  };
}

// ── Search (for search_all) ─────────────────────────────────────────────────

export interface BenchmarkSearchHit {
  kind: 'profession' | 'benchmark';
  slug: string;
  title: string;
  summary: string;
  /**
   * The languages the text above is actually in — a set, not one value,
   * because a hit can mix them.
   *
   * `benchLocale` says which locale was *selected*, which is not the same
   * thing: a benchmark row carries its own name and `measures` string, neither
   * localised at all, and a profession hit localises its title while its
   * summary is written in English right here in the code. Labelling either as
   * `es` because Spanish was asked for is how an English benchmark summary
   * came back tagged Spanish, and how a strict language filter kept it.
   */
  content_locales: string[];
  canonical_url: string;
  suggested_tool: string;
  score: number;
  matchedFields: string[];
  matchedTerms: string[];
}

/**
 * The words every model-choice question carries. They say which surface to
 * route to (search_all's intent boost reads the raw query for that), but they
 * name no profession, so scoring on them let "qué IA es mejor para abogados"
 * rank whichever profession's tasks happened to say "mejor".
 */
const CHOICE_WORDS = new Set(queryTerms(
  'ia ai modelo modelos model models llm llms mejor mejores best better which cual usar use using recomienda recommend',
));

export function searchBenchmarkCorpus(c: BenchmarkCorpus, query: string, limit: number, locale?: Locale): BenchmarkSearchHit[] {
  const all = queryTerms(query);
  const terms = all.filter((t) => !CHOICE_WORDS.has(t));
  if (terms.length === 0) return [];
  const l = benchLocale(locale);
  // Word starts, not substrings: "ia" is inside "industrial" and "técnica".
  const score = (fields: Array<[string, string, number]>) => {
    let s = 0;
    const mf = new Set<string>(), mt = new Set<string>();
    for (const [field, value, weight] of fields) {
      const words = norm(value).split(/[^\p{L}\p{N}]+/u);
      for (const t of terms) if (words.some((w) => w.startsWith(t))) { s += weight; mf.add(field); mt.add(t); }
    }
    const cov = mt.size / terms.length;
    return { score: Math.round(s * cov * cov * 100) / 100, matchedFields: [...mf], matchedTerms: [...mt] };
  };
  const hits: BenchmarkSearchHit[] = [];
  for (const p of c.ranking.professions) {
    const r = score([
      ['name', `${p.name.en} ${p.name.es}`, 8],
      ['id', p.id, 7],
      ['tasks', p.tasks.map((t) => `${t.text.en} ${t.text.es}`).join(' '), 4],
    ]);
    if (r.score > 0) hits.push({
      kind: 'profession', slug: p.id, title: pick(p.name, l),
      // This sentence is English wherever it is read from: it is built here,
      // not translated. So the hit is mixed whenever the title is not English.
      summary: `${p.evaluation.type === 'direct' ? 'Direct' : 'Indirect'} evaluation; first today: ${p.picks.first?.name ?? 'not enough data'}.`,
      content_locales: [...new Set([p.name[l] !== undefined ? l : 'en', 'en'])].sort(),
      canonical_url: p.url, suggested_tool: 'recommend_model_for_profession', ...r,
    });
  }
  for (const b of benchmarkRows(c)) {
    const r = score([
      ['name', b.name, 8],
      ['measures', String(b.measures ?? ''), 5],
      ['group', String(b.group ?? b.domain ?? ''), 3],
    ]);
    if (r.score > 0) hits.push({
      kind: 'benchmark', slug: benchmarkSlug(b.name), title: b.name, summary: String(b.measures ?? ''),
      // Neither field has a translation to choose from: the benchmark's name
      // and what it measures are published once, in English.
      content_locales: ['en'],
      canonical_url: c.data.canonical_url, suggested_tool: 'get_benchmark', ...r,
    });
  }
  return hits.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug)).slice(0, limit);
}
