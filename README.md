# santismm-knowledge-mcp

[![santismm-knowledge-mcp MCP server](https://glama.ai/mcp/servers/santismm/santismm-knowledge-mcp/badges/card.svg)](https://glama.ai/mcp/servers/santismm/santismm-knowledge-mcp)

> MCP server for the Santismm Knowledge Platform — five core knowledge domains,
> first-party essays, Homeric Atlas datasets and epistemic claims.

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

## Where this server is listed

Derived from the same list the site renders on its own MCP page, so a registry
added there is linked from here too — and a directory that checks for a backlink
before ranking a server finds one without anybody remembering to add it.

- [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/v0/servers?search=com.santismm/knowledge)
- [npmjs.com](https://www.npmjs.com/package/santismm-knowledge-mcp)
- [pypi.org](https://pypi.org/project/santismm-knowledge-mcp/)
- [github.com](https://github.com/santismm/santismm-knowledge-mcp)
- [smithery.ai](https://smithery.ai/servers/santismm/knowledge)
- [glama.ai](https://glama.ai/mcp/servers/santismm/santismm-knowledge-mcp)
- [mcpservers.org](https://mcpservers.org/servers/santismm/santismm-knowledge-mcp)

## Run it locally (stdio)

```bash
npm ci && npm run build && npm start
```

The core corpus ships in `content/` and is read from disk, so its tools work
offline. The three federated Article tools read the canonical Articles API over
HTTPS. Point the core corpus elsewhere with `SANTISMM_CONTENT_DIR`.

## Install from npm

```bash
npx santismm-knowledge-mcp
```

Or in an MCP client config (stdio):

```json
{ "mcpServers": { "santismm-knowledge": { "command": "npx", "args": ["santismm-knowledge-mcp"] } } }
```

The npm package carries the corpus **frozen at publish time**; this repository
and the hosted endpoint update continuously. When freshness matters, prefer
the endpoint.

## Install from PyPI (Python)

```bash
uvx santismm-knowledge-mcp
```

The Python package (in [`python/`](python/)) is a **zero-dependency stdio
proxy to the hosted endpoint** — it ships no corpus, so it is always fresh.

```json
{ "mcpServers": { "santismm-knowledge": { "command": "uvx", "args": ["santismm-knowledge-mcp"] } } }
```


## Licences

Code is **MIT** ([LICENSE](LICENSE)); the knowledge corpus in `content/` is
**CC BY 4.0** ([content/LICENSE](content/LICENSE)) — two licences because CC BY
is not a software licence and MIT is not a content licence.

## What it exposes

30 read-only tools over knowledge, patterns, architectures, governance, the
Harness Engineering Handbook and first-party Articles, each declaring an
`outputSchema` and returning validated `structuredContent`. Every tool is
annotated `readOnlyHint: true`, `destructiveHint: false` and
`idempotentHint: true`. The three federated Article tools declare
`openWorldHint: true`; local-corpus tools remain `false`.

Content in seven languages (en/es/pt/fr/de/ja/zh).

## Licence

Code: MIT. Content: Content © Santiago Santa María Morales, licensed CC BY 4.0. Attribution required: credit the author and link the canonical URL. (CC-BY-4.0, https://creativecommons.org/licenses/by/4.0/).
