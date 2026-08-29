/**
 * Federated first-party article corpus.
 *
 * Articles owns the authored HTML and generates a canonical JSON API from it.
 * The MCP consumes that API instead of copying essays into this repository or
 * scraping presentation markup at call time. A short in-process cache keeps a
 * list/search/get sequence to one upstream request while preserving freshness.
 */

export const ARTICLES_API_URL =
  process.env.SANTISMM_ARTICLES_API_URL ?? "https://articles.santismm.com/api/articles.json";

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface Article {
  slug: string;
  title: string;
  summary: string;
  language: string;
  published: string;
  modified: string;
  topics: string[];
  translation_key?: string;
  canonical_url: string;
  api_url: string;
  body: string;
}

export type ArticleCard = Omit<Article, "body">;

interface ArticleCorpus {
  schema_version: string;
  source: string;
  canonical_url: string;
  count: number;
  articles: Article[];
}

let cache: { expiresAt: number; corpus: ArticleCorpus } | undefined;
let pending: Promise<ArticleCorpus> | undefined;

function validArticle(value: unknown): value is Article {
  const article = value as Partial<Article> | null;
  return Boolean(
    article &&
      typeof article.slug === "string" &&
      typeof article.title === "string" &&
      typeof article.summary === "string" &&
      typeof article.language === "string" &&
      typeof article.published === "string" &&
      typeof article.modified === "string" &&
      Array.isArray(article.topics) &&
      article.topics.every((topic) => typeof topic === "string") &&
      (article.translation_key === undefined || typeof article.translation_key === "string") &&
      typeof article.canonical_url === "string" &&
      article.canonical_url.startsWith("https://articles.santismm.com/") &&
      typeof article.api_url === "string" &&
      article.api_url.startsWith("https://articles.santismm.com/api/articles/") &&
      typeof article.body === "string",
  );
}

async function fetchCorpus(): Promise<ArticleCorpus> {
  const response = await fetch(ARTICLES_API_URL, {
    headers: { Accept: "application/json", "User-Agent": "santismm-knowledge-mcp/0.4.0" },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Articles API returned HTTP ${response.status}`);

  const raw = (await response.json()) as Partial<ArticleCorpus>;
  if (
    raw.schema_version !== "1.0" ||
    typeof raw.source !== "string" ||
    typeof raw.canonical_url !== "string" ||
    !Array.isArray(raw.articles) ||
    !raw.articles.every(validArticle) ||
    raw.count !== raw.articles.length
  ) {
    throw new Error("Articles API returned an invalid corpus contract");
  }
  return raw as ArticleCorpus;
}

export async function loadArticles(): Promise<Article[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.corpus.articles;
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
  return (await pending).articles;
}

export function articleCard(article: Article): ArticleCard {
  const { body: _body, ...card } = article;
  return card;
}

export function articlesForLocale(articles: Article[], locale?: "en" | "es" | "pt"): Article[] {
  if (!locale) return articles;
  return articles.filter((article) => article.language.toLowerCase().split("-")[0] === locale);
}

function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export interface ArticleSearchResult extends ArticleCard {
  score: number;
  matchedFields: string[];
  matchedTerms: string[];
}

/** Ranked accent-insensitive full-text search over the canonical API payload. */
export function searchArticleCorpus(articles: Article[], query: string, limit: number): ArticleSearchResult[] {
  const terms = [...new Set(normalise(query).split(/[^a-z0-9]+/).filter((term) => term.length > 1))];
  const phrase = normalise(query).trim();
  if (terms.length === 0) return [];

  const weights: Array<[keyof Article, number]> = [
    ["title", 8],
    ["slug", 6],
    ["summary", 5],
    ["topics", 4],
    ["body", 1],
  ];

  return articles
    .map((article) => {
      const matchedFields = new Set<string>();
      const matchedTerms = new Set<string>();
      let score = 0;

      for (const [field, weight] of weights) {
        const value = normalise(Array.isArray(article[field]) ? article.topics.join(" ") : String(article[field]));
        for (const term of terms) {
          if (!value.includes(term)) continue;
          score += weight;
          matchedFields.add(field);
          matchedTerms.add(term);
        }
        if (phrase.length > 2 && value.includes(phrase)) score += weight * 2;
      }

      return {
        ...articleCard(article),
        score,
        matchedFields: [...matchedFields],
        matchedTerms: [...matchedTerms],
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || b.modified.localeCompare(a.modified) || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}
