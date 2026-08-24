# santismm-knowledge-mcp

[![santismm-knowledge-mcp MCP server](https://glama.ai/mcp/servers/santismm/santismm-knowledge-mcp/badges/card.svg)](https://glama.ai/mcp/servers/santismm/santismm-knowledge-mcp)

> MCP server for the Santismm Knowledge Platform — harness engineering, agentic
> AI patterns, reference architectures, AI governance and the agent taxonomy.

**This repository is generated** from the platform at [santismm.com](https://santismm.com).
Do not edit it by hand; changes are overwritten on the next sync. Corrections go
through [the site](https://santismm.com/en/about).

## Use it without installing anything

The same server is hosted, so most people want the endpoint rather than this
repository:

```json
{ "mcpServers": { "santismm-knowledge": { "type": "http", "url": "https://santismm.com/mcp" } } }
```

Docs: https://santismm.com/en/mcp · Registry: `com.santismm/knowledge`

## Run it locally (stdio)

```bash
npm ci && npm run build && npm start
```

The corpus ships in `content/` and is read from disk, so this works offline.
Point it elsewhere with `SANTISMM_CONTENT_DIR`.

## Packaged installs (not published yet)

`npx santismm-knowledge-mcp` and `uvx santismm-knowledge-mcp` are **not
available yet** — the packages are built here but not published, so those
commands would fail. Until they are, use the hosted endpoint above, or clone
this repository and run it locally as described.

The sources are in place: the npm package is this repository, and the Python
package in [`python/`](python/) is a zero-dependency stdio proxy to the hosted
endpoint.


## Licences

Code is **MIT** ([LICENSE](LICENSE)); the knowledge corpus in `content/` is
**CC BY 4.0** ([content/LICENSE](content/LICENSE)) — two licences because CC BY
is not a software licence and MIT is not a content licence.

## What it exposes

19 read-only tools over knowledge, patterns, architectures, governance and the
Harness Engineering Handbook, each declaring an `outputSchema` and returning
validated `structuredContent`. Every tool is annotated `readOnlyHint: true`,
`destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false` —
literally true: it reads a static corpus and nothing else.

Content in three languages (en/es/pt).

## Licence

Code: MIT. Content: Content © Santiago Santa María Morales, licensed CC BY 4.0. Attribution required: credit the author and link the canonical URL. (CC-BY-4.0, https://creativecommons.org/licenses/by/4.0/).
