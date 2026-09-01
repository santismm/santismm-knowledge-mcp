/**
 * MCP result semantics, independent of the analytics backend.
 *
 * A transport can observe a handler result without importing Redis, and the
 * stdio server can keep using the same registry without recording anything.
 * The important boundary is the handler's FINAL result: a federated
 * `search_all` is successful when any selected surface returned a hit, even
 * when the local core sub-search was empty.
 */

import { SEARCH_SURFACES } from "./surfaces.ts";

export const MCP_OUTCOMES = ["ok", "partial", "empty", "not_found", "error"] as const;
export type McpOutcome = (typeof MCP_OUTCOMES)[number];

export const MCP_DEMAND_CLASSES = [
  "answered",
  "partial_answer",
  "content_gap",
  "wrong_tool",
  "invalid_identifier",
  "surface_unavailable",
  "catalogue_empty",
  "execution_error",
] as const;
export type McpDemandClass = (typeof MCP_DEMAND_CLASSES)[number];

export interface McpToolResultEvent {
  tool: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: unknown;
}

export interface GlobalSearchResultDetail {
  queried: string[];
  topSurface?: string;
  suggestedTool?: string;
  unavailable: string[];
}

export interface McpToolObservation {
  tool: string;
  outcome: McpOutcome;
  demandClass: McpDemandClass;
  detail?: string;
  foundIn?: { domain: string; id: string; tool: string };
  globalSearch?: GlobalSearchResultDetail;
}

type ToolResult = {
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
  content?: Array<{ type?: string; text?: string }>;
};

const GET_DETAIL: Record<string, { domain: string; argument: "slug" | "id" }> = {
  get_knowledge: { domain: "knowledge", argument: "slug" },
  get_pattern: { domain: "patterns", argument: "slug" },
  get_architecture: { domain: "architectures", argument: "slug" },
  get_governance: { domain: "governance", argument: "slug" },
  get_handbook: { domain: "handbook", argument: "id" },
  get_article: { domain: "articles", argument: "slug" },
  get_lab: { domain: "labs", argument: "slug" },
  get_homeric_place: { domain: "homeric/places", argument: "slug" },
  get_homeric_episode: { domain: "homeric/episodes", argument: "slug" },
  get_homeric_route: { domain: "homeric/routes", argument: "slug" },
  get_claim: { domain: "claims", argument: "id" },
};

export function lookupRequestForTool(
  tool: string,
  args: Record<string, unknown>,
): { domain: string; identifier: string } | undefined {
  if (tool === "get_related") {
    const domain = boundedText(args.domain);
    const identifier = boundedText(args.slug);
    return domain && identifier ? { domain, identifier } : undefined;
  }
  const descriptor = GET_DETAIL[tool];
  if (!descriptor) return undefined;
  const identifier = boundedText(args[descriptor.argument]);
  return identifier ? { domain: descriptor.domain, identifier } : undefined;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function errorBody(result: ToolResult): Record<string, unknown> | undefined {
  const first = result.content?.find((part) => part.type === "text" && typeof part.text === "string");
  if (!first?.text) return undefined;
  try {
    return record(JSON.parse(first.text));
  } catch {
    return undefined;
  }
}

function boundedText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean ? clean.slice(0, 100) : undefined;
}

/** The privacy-bounded label stored for consumption and unresolved rankings. */
export function detailForTool(tool: string, args: Record<string, unknown>): string | undefined {
  if (tool.startsWith("search")) {
    const query = boundedText(args.query);
    return query ? `search: ${query}` : undefined;
  }
  const lookup = lookupRequestForTool(tool, args);
  return lookup ? `${lookup.domain}/${lookup.identifier}` : undefined;
}

function globalSearchDetail(args: Record<string, unknown>, structured?: Record<string, unknown>): GlobalSearchResultDetail {
  const selected = Array.isArray(args.surfaces)
    ? args.surfaces.filter((surface): surface is string => typeof surface === "string")
    : [...SEARCH_SURFACES];
  const results = Array.isArray(structured?.results) ? structured.results : [];
  const top = record(results[0]);
  const unavailableRows = Array.isArray(structured?.unavailable_surfaces)
    ? structured.unavailable_surfaces
    : [];
  return {
    queried: selected,
    topSurface: typeof top?.surface === "string" ? top.surface : undefined,
    suggestedTool: typeof top?.suggested_tool === "string" ? top.suggested_tool : undefined,
    unavailable: unavailableRows
      .map((row) => record(row)?.surface)
      .filter((surface): surface is string => typeof surface === "string"),
  };
}

/**
 * Classify the response the caller received. No sub-search, loader or counter
 * is consulted here; the final handler payload is the source of truth.
 */
export function summarizeToolResult(event: McpToolResultEvent): McpToolObservation {
  const detail = detailForTool(event.tool, event.args);
  if (event.error !== undefined) {
    return { tool: event.tool, outcome: "error", demandClass: "execution_error", detail };
  }

  const result = record(event.result) as ToolResult | undefined;
  if (!result) {
    return { tool: event.tool, outcome: "error", demandClass: "execution_error", detail };
  }
  const structured = record(result.structuredContent);
  const globalSearch = event.tool === "search_all" ? globalSearchDetail(event.args, structured) : undefined;

  if (result.isError) {
    const body = errorBody(result);
    const code = typeof body?.error === "string" ? body.error : "error";
    const foundIn = record(body?.found_in);
    if (code === "not_found") {
      const exact =
        typeof foundIn?.domain === "string" &&
        typeof foundIn?.id === "string" &&
        typeof foundIn?.tool === "string"
          ? { domain: foundIn.domain, id: foundIn.id, tool: foundIn.tool }
          : undefined;
      return {
        tool: event.tool,
        outcome: "not_found",
        demandClass: exact ? "wrong_tool" : "invalid_identifier",
        detail,
        foundIn: exact,
        globalSearch,
      };
    }
    if (code.includes("unavailable") || code.includes("failed")) {
      return { tool: event.tool, outcome: "error", demandClass: "surface_unavailable", detail, globalSearch };
    }
    return { tool: event.tool, outcome: "error", demandClass: "execution_error", detail, globalSearch };
  }

  const count = typeof structured?.count === "number" ? structured.count : undefined;
  const unavailable = globalSearch?.unavailable.length ?? 0;
  if (event.tool === "search_all" && unavailable > 0) {
    if (!count || count === 0) {
      return {
        tool: event.tool,
        outcome: "error",
        demandClass: "surface_unavailable",
        detail,
        globalSearch,
      };
    }
    return {
      tool: event.tool,
      outcome: "partial",
      demandClass: "partial_answer",
      detail,
      globalSearch,
    };
  }
  if (count === 0) {
    return {
      tool: event.tool,
      outcome: "empty",
      demandClass: event.tool.startsWith("search") ? "content_gap" : "catalogue_empty",
      detail,
      globalSearch,
    };
  }
  return { tool: event.tool, outcome: "ok", demandClass: "answered", detail, globalSearch };
}
