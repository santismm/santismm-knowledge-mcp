#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { registerTools, SERVER_INFO } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";
import { fsContent } from "./content.js";

/**
 * Santismm Knowledge Platform — MCP server (v1, §22 of the platform plan), stdio transport.
 *
 * Gives AI agents native, structured access to the same corpus that powers
 * santismm.com: knowledge units, Enterprise AI patterns, reference architectures
 * and AI-governance units. The tool registry (`registerTools`) is shared with
 * the HTTP endpoint at santismm.com/mcp, and the content is read from the same
 * `content/` source of truth — so the CLI and the web never drift.
 */

const server = new McpServer(SERVER_INFO);
registerTools(server, fsContent);
registerResources(server, fsContent);
registerPrompts(server, fsContent);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // eslint-disable-next-line no-console
  console.error("santismm-knowledge MCP server running on stdio");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error starting santismm-knowledge MCP server:", err);
  process.exit(1);
});
