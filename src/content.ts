import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeContent, type HandbookEntry } from "./shape.js";

/**
 * Filesystem content provider for the standalone stdio CLI.
 *
 * Reads the same JSON source of truth that powers the website
 * (content/{knowledge,patterns,architectures,governance}) so agents query
 * exactly what humans see — no separate copy to drift. The shaping of those
 * entries lives in `shape.ts`, shared with the HTTP endpoint, so the CLI and
 * the web expose identical tool behaviour.
 *
 * The content directory is resolved relative to this module (works under both
 * `src/` via tsx and `dist/` compiled), and can be overridden with the
 * SANTISMM_CONTENT_DIR environment variable.
 */

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Two layouts have to work, and a single relative path cannot serve both.
 *
 *   monorepo   <root>/mcp/{src,dist}/  →  <root>/content        (../../content)
 *   standalone <root>/{src,dist}/      →  <root>/content        (../content)
 *
 * The standalone layout is the published package: this server is mirrored to
 * its own public repository with the corpus alongside it, so it can be cloned,
 * built and run without the site. Hardcoding `../../content` there resolves
 * ABOVE the repository root and the server starts with an empty corpus —
 * silently, because a missing directory reads as "no units" rather than as an
 * error.
 *
 * So: try each candidate and take the first that actually holds the corpus.
 * `knowledge/` is the probe because every layout has it and an empty directory
 * would otherwise pass for a valid root.
 */
function resolveContentRoot(): string {
  const override = process.env.SANTISMM_CONTENT_DIR;
  if (override) return override;
  const candidates = [
    path.resolve(moduleDir, "..", "..", "content"),
    path.resolve(moduleDir, "..", "content"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "knowledge"))) return c;
  }
  // Nothing found: return the monorepo path so the error names a real
  // expectation instead of an empty corpus that looks like a content bug.
  return candidates[0];
}

export const CONTENT_ROOT = resolveContentRoot();

export type Domain = "knowledge" | "patterns" | "architectures" | "governance";
export type Locale = "en" | "es" | "pt";

export interface Entry {
  id?: string;
  slug: string;
  category?: string;
  updated?: string;
  version?: string;
  evidence?: { evidenceLevel: string; confidenceLevel: string; sourceType: string[] };
  locales?: Record<string, Record<string, unknown>>;
  [k: string]: unknown;
}

export function loadAll(domain: Domain): Entry[] {
  const dir = path.join(CONTENT_ROOT, domain);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Entry)
    .sort((a, b) => (a.id ?? a.slug).localeCompare(b.id ?? b.slug));
}

/**
 * Minimal YAML-frontmatter reader for the handbook chapters. The frontmatter
 * shape is constrained and enforced by `scripts/validate-content.mjs` (scalars,
 * inline `[a, b]` arrays and `- item` block sequences), so a focused parser is
 * enough and keeps the CLI dependency-free.
 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, unknown> = {};
  const unquote = (v: string) => v.replace(/^["']([\s\S]*)["']$/, "$1").trim();

  let key: string | null = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && key) {
      (data[key] as string[]).push(unquote(item[1]));
      continue;
    }
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, k, rest] = kv;
    key = k;
    const value = rest.trim();
    if (value === "") {
      data[k] = []; // a block sequence follows
    } else if (value.startsWith("[")) {
      data[k] = value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map(unquote)
        .filter(Boolean);
    } else {
      data[k] = unquote(value);
      key = null;
    }
  }
  return { data, body: m[2] };
}

/** Load the Harness Engineering Handbook chapters from content/harness/*.md. */
export function loadHandbook(): HandbookEntry[] {
  const dir = path.join(CONTENT_ROOT, "harness");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    // `.es.md` / `.pt.md` are translations of a chapter, not chapters.
    .filter((f) => f.endsWith(".md") && !/\.(es|pt)\.md$/.test(f))
    .map((f) => {
      const { data, body } = parseFrontmatter(fs.readFileSync(path.join(dir, f), "utf8"));
      const str = (v: unknown) => (typeof v === "string" ? v : undefined);
      const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
      // Translations sit beside the canonical file and carry title, summary and
      // body only; a locale with no file is a real absence, reported as such.
      const locales: HandbookEntry["locales"] = {
        en: { title: str(data.title) ?? f, summary: str(data.summary), body },
      };
      for (const loc of ["es", "pt"] as const) {
        const tf = path.join(dir, f.replace(/\.md$/, `.${loc}.md`));
        if (!fs.existsSync(tf)) continue;
        const t = parseFrontmatter(fs.readFileSync(tf, "utf8"));
        const tTitle = typeof t.data.title === "string" ? t.data.title : undefined;
        const tBody = t.body.trim();
        // Partial translations count: a translated title and summary are short,
        // carry the most search weight and land long before 1,300 words of
        // prose do. `fallback` keys on the body, so this never overstates.
        if (!tTitle && !tBody) continue;
        locales[loc] = {
          title: tTitle ?? str(data.title) ?? f,
          summary: typeof t.data.summary === "string" ? t.data.summary : undefined,
          body: tBody || undefined,
        };
      }
      return {
        locales,
        id: str(data.id) ?? f.replace(/\.md$/, ""),
        // Slug mirrors the site: filename without the `HRN-###-` prefix and extension.
        slug: f.replace(/^HRN-\d+-/, "").replace(/\.md$/, ""),
        title: str(data.title) ?? f,
        category: str(data.category),
        status: str(data.status),
        summary: str(data.summary),
        updated: str(data.updated),
        evidenceLevel: str(data.evidence_level),
        confidenceLevel: str(data.confidence_level),
        sourceType: list(data.source_type),
        related: list(data.related),
        tags: list(data.tags),
        body,
      } satisfies HandbookEntry;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Content provider backed by the local filesystem (used by the stdio CLI). */
export const fsContent = makeContent(loadAll, loadHandbook);
