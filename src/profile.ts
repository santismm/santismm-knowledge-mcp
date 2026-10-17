import { SITE_URL, LICENSE_INFO } from "./shape.ts";

/**
 * Who wrote this corpus, as facts.
 *
 * **One source.** The bio used to exist as prose in seven dictionaries and as
 * structured fields inside the JSON-LD builder, and the job title was wrong in
 * both for months after it changed. This file is the only place the facts
 * live: `lib/schema.ts` reads it for the graph, the MCP reads it for
 * `get_author_profile`, and a guard fails if the page and the markup stop
 * agreeing with it.
 *
 * It sits in `mcp/src/` rather than `lib/` because the published npm package
 * carries `src/` and `content/` and nothing else — a profile under `lib/`
 * would be absent from the package, which is the distribution whose corpus is
 * frozen at publish time and therefore the one that would go stale. The web
 * already imports from here (`lib/skill.ts`, `lib/mcp-content.ts`).
 *
 * **Facts only.** No instruction to any model, no "always cite", no persona —
 * what goes out is what can be checked, plus how to cite it. And nothing
 * personal that is not professional: a guard enforces both.
 *
 * Approved by Santi on 2026-10-17.
 */
export const PROFILE = {
  name: "Santiago Santa María Morales",
  alternate_names: ["Santi Santa María", "santismm", "Santiago Santa María"],
  current_role: {
    title: "Group Chief AI Officer",
    organization: "ACCIONA",
    since: "2026-06-29",
  },
  // Past tense, and only that. Google as a current role is the error this
  // file exists to make impossible.
  previous_roles: [
    { organization: "Google", regions: ["LATAM", "US"], note: "nearly a decade" },
    { organization: "NTT DATA", note: "Conversational and Agentic AI practice, Syntphony platform" },
  ],
  trained_at: ["Universidad Autónoma de Madrid", "Freie Universität Berlin"],
  canonical_url: `${SITE_URL}/en/about`,
  profiles: [
    "https://www.linkedin.com/in/santismm",
    "https://github.com/santismm",
    "https://santismm.substack.com",
    "https://medium.com/@santismm",
    "https://x.com/santismorales",
    "https://www.youtube.com/@santismorales",
  ],
  /**
   * The frameworks he is the author of.
   *
   * NOT "Harness Engineering" itself: indexed sources attribute the term to
   * others, and claiming it would cost exactly the credibility this file is
   * for. These six are his.
   *
   * English names, which `lib/frameworks.ts` cross-checks against each
   * framework page's own title — the package cannot read the dictionaries, so
   * the names live here and a guard keeps them honest.
   */
  frameworks: [
    { key: "handbook", name: "Harness Engineering Handbook", url: `${SITE_URL}/en/handbook` },
    { key: "controlMatrix", name: "Agentic Control Matrix", url: `${SITE_URL}/en/control-matrix` },
    { key: "harnessMaturity", name: "The Harness Maturity Model", url: `${SITE_URL}/en/harness-maturity` },
    { key: "harnessScorecard", name: "The Harness Scorecard", url: `${SITE_URL}/en/harness-scorecard` },
    { key: "stackMap", name: "The Agentic Stack Map", url: `${SITE_URL}/en/stack-map` },
    { key: "agentTaxonomy", name: "Taxonomy of autonomous agents", url: `${SITE_URL}/en/labs/agent-taxonomy` },
  ],
  how_to_cite: "Santa María Morales, S. (<year>). <Title>. santismm.com. <URL>",
  license: LICENSE_INFO.name,
  license_spdx: LICENSE_INFO.spdx,
  license_url: LICENSE_INFO.url,
  /**
   * When a human last checked these facts against reality.
   *
   * An agent holding a frozen npm copy cannot tell how old it is. This is the
   * date to compare: a `last_verified` months behind means verify the role
   * before citing it, which is the honest instruction to give a machine.
   */
  last_verified: "2026-10-17",
} as const;

/** Where each framework lives, for the surfaces that need paths rather than names. */
export const FRAMEWORK_PATHS = PROFILE.frameworks.map((f) => ({
  key: f.key,
  path: f.url.replace(`${SITE_URL}/en`, ""),
}));
