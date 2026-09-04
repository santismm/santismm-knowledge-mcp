# Content conventions — the single source of truth

`/content` is the **only** place knowledge is authored. Everything else (pages,
`/api/*`, `llms.txt`, `llms-full.txt`, `ai-index.json`, JSON-LD, the sitemap,
the graph and the MCP server) is **generated** from it. Nobody edits generated
output by hand. This file is the internal producer→consumer contract (v6.0 §C2).

## Two representations, one rule

The platform consolidated into a single repo (v6.0 Option A). Content comes in
two shapes, by their nature:

| Shape | Domains | Why | Source |
| --- | --- | --- | --- |
| **Structured JSON** | `knowledge`, `patterns`, `architectures`, `governance` | discrete, field-addressable, seven-locale artifacts that render identically across many output formats | `content/{domain}/{slug}.json` (all locales inside) |
| **Markdown + frontmatter** | `harness` (the Handbook) | long-form prose where the document *is* the unit | `content/harness/HRN-###-*.md` |

Both are validated and both feed the same generated outputs. See
[`../docs/metadata-schema.md`](../docs/metadata-schema.md) for the JSON schema
and [`../docs/contributing-content.md`](../docs/contributing-content.md) to add
an artifact. The machine-readable contract is
[`../schema/ontology.json`](../schema/ontology.json).

## Handbook frontmatter (Markdown units)

```yaml
---
id: HRN-001                 # stable canonical id
title: "…"
domain: Harness
category: Foundations       # chapter grouping
status: Draft               # Draft | Review | Stable | Production
author: Santiago Santa María
created: 2026-06-21
updated: 2026-06-21
summary: "≤ ~320 chars, answer-first."
evidence_level: theoretical # production | simulation | benchmark | industry_observation | theoretical
confidence_level: medium    # high | medium | low
source_type:                # personal_experience | production_system | benchmark | paper | industry_observation
  - industry_observation
related: [HRN-002, PAT-003]  # ids across any domain
tags: [harness-engineering]
---
```

Body sections (the artifact contract): Executive Summary · Key Concepts ·
Definition · Architecture Diagram (Mermaid) · Detailed Explanation · Observed
Failure Modes · **Lessons Learned** · Cost Metrics · Scaling Characteristics ·
Related Content · References · FAQs.

**Lessons Learned** is recommended in every chapter (and expected once a chapter
leaves `Draft`). `scripts/validate-content.mjs` reports coverage and emits a
non-blocking **warning** when a non-`Draft` chapter omits the section — phase 1,
it never fails the build.

## Internationalization

The structured JSON artifacts carry all seven locales (`en`/`es`/`pt`/`fr`/
`de`/`ja`/`zh`) inside each file. The Handbook keeps canonical English files
plus complete per-locale Markdown siblings such as `HRN-001.ja.md`. The English
file remains the editorial source of record. See
[`../docs/localization.md`](../docs/localization.md).

## Evidence, honestly

Never label an illustrative example as verified production. If something is not
disclosable as `production_system`, it stays `industry_observation` — never the
reverse. Production Evidence blocks state results as reference targets to
measure, not invented numbers.

## Definition of Done (per unit) — v6.0 §C3

1. Passes `npm run validate` (contract OK).
2. Carries `id`/`status`/`evidence`/`source_type`/`related`/`references`.
3. Is emitted into `index.json` + the graph, with JSON-LD.
4. Renders in all seven locales with no silent fallback in the core corpus.
5. Appears in `llms.txt` / `llms-full.txt`.
