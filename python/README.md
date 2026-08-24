# santismm-knowledge-mcp (Python)

MCP access to the [Santismm Knowledge Platform](https://santismm.com/en/mcp) —
harness engineering, agentic AI patterns, reference architectures, AI
governance and the Harness Engineering Handbook. 19 read-only tools, content
CC BY 4.0, in three languages (en/es/pt).

This package is a **zero-dependency stdio proxy** to the hosted endpoint at
`https://santismm.com/mcp`. It ships no corpus and no tool logic — your agent
always queries the live, current knowledge base. If your MCP client supports
remote servers natively, you can skip this package entirely and point it at
the endpoint.

## Usage

```bash
uvx santismm-knowledge-mcp        # or: pipx run santismm-knowledge-mcp
```

MCP client config (stdio):

```json
{
  "mcpServers": {
    "santismm-knowledge": {
      "command": "uvx",
      "args": ["santismm-knowledge-mcp"]
    }
  }
}
```

Remote-capable clients can use the endpoint directly instead:

```json
{ "mcpServers": { "santismm-knowledge": { "type": "http", "url": "https://santismm.com/mcp" } } }
```

## Environment

- `SANTISMM_MCP_URL` — override the endpoint URL (e.g. for a mirror or test).

Docs: https://santismm.com/en/mcp · Registry: `com.santismm/knowledge` ·
Code MIT, content CC BY 4.0.
