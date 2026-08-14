"""stdio -> HTTPS proxy for the Santismm Knowledge MCP server.

This package deliberately contains NO corpus and NO tool logic. The search
scoring and tool behaviour live in one TypeScript implementation, pinned by
its own conformance suite; a Python port would be a second implementation
whose drift nobody would notice until an agent did. Instead, this is a plain
pass-through: newline-delimited JSON-RPC on stdio (what local MCP clients
speak) forwarded verbatim to the hosted endpoint (always-fresh corpus), and
the response relayed back.

Zero dependencies on purpose — urllib is enough, and a proxy this small
should never need a lockfile.

Environment:
    SANTISMM_MCP_URL   override the endpoint (default: production, tagged
                       ?via=pypi so this distribution channel is visible in
                       the platform's analytics).
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

__version__ = "0.2.1"

ENDPOINT = os.environ.get("SANTISMM_MCP_URL", "https://santismm.com/mcp?via=pypi")
USER_AGENT = f"santismm-knowledge-mcp-python/{__version__}"
TIMEOUT_SECONDS = 60


def _parse_body(text: str, content_type: str):
    """The endpoint answers JSON or SSE frames; accept either."""
    if "text/event-stream" in content_type or text.lstrip().startswith("event:"):
        for line in reversed(text.splitlines()):
            if line.startswith("data:"):
                try:
                    return json.loads(line[5:].strip())
                except json.JSONDecodeError:
                    continue
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def _forward(raw: str):
    """POST one JSON-RPC message; return the parsed response body (or None)."""
    request = urllib.request.Request(
        ENDPOINT,
        data=raw.encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return _parse_body(
                response.read().decode("utf-8", "replace"),
                response.headers.get("content-type", ""),
            )
    except urllib.error.HTTPError as err:
        # 4xx/5xx bodies are JSON-RPC error objects on this endpoint; relay them.
        body = err.read().decode("utf-8", "replace")
        return _parse_body(body, err.headers.get("content-type", "") if err.headers else "")


def _error_response(msg_id, message: str):
    return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32000, "message": message}}


def main() -> None:
    for line in sys.stdin:
        raw = line.strip()
        if not raw:
            continue

        # The id decides whether the caller expects an answer at all
        # (notifications have none and must stay answerless).
        msg_id = None
        expects_response = False
        try:
            msg = json.loads(raw)
            if isinstance(msg, dict):
                expects_response = "id" in msg
                msg_id = msg.get("id")
            elif isinstance(msg, list):
                expects_response = any(isinstance(m, dict) and "id" in m for m in msg)
        except json.JSONDecodeError:
            expects_response = True  # let the endpoint produce the parse error

        try:
            response = _forward(raw)
        except Exception as exc:  # transport failure — the one error we synthesise
            response = _error_response(msg_id, f"proxy transport error: {exc}") if expects_response else None

        if expects_response:
            if response is None:
                response = _error_response(msg_id, "empty response from endpoint")
            sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
            sys.stdout.flush()


if __name__ == "__main__":
    main()
