import type { MarkdownFile, MarkdownProject } from "./types";

export interface MarkdownTemplate {
  id: string;
  name: string;
  badge: string;
  category: "Showcase" | "Engineering" | "Academic" | "Writing" | "Presentation";
  description: string;
  mainFilePath: string;
  files: Array<{ path: string; content: string }>;
}

export const MARKDOWN_TEMPLATES: MarkdownTemplate[] = [
  {
    id: "welcome-showcase",
    name: "Markdown Studio Showcase",
    badge: "Flagship",
    category: "Showcase",
    description:
      "Full tour of Markdown Studio: YAML frontmatter, TOC, callouts, KaTeX physics math, Mermaid diagrams, charts, interactive tasks & footnotes.",
    mainFilePath: "README.md",
    files: [
      {
        path: "README.md",
        content: `---
title: "Markdown Studio — Crafting Ideas into Reality"
author: "Rashad Hamidi"
date: "2026-11-22"
description: "An illuminated browser-native Markdown IDE with live GFM, KaTeX, Mermaid diagrams, charts, interactive tasks, and slide decks."
tags: [markdown, gfm, katex, mermaid, studio]
draft: false
---

# Markdown Studio :sparkles:

![Status](https://img.shields.io/badge/Studio-Live_Preview-00c3f5) ![Math](https://img.shields.io/badge/KaTeX-Enabled-9333ea) ![Diagrams](https://img.shields.io/badge/Mermaid-Client_SVG-10b981)

Welcome to **Markdown Studio** — a distraction-free cosmic environment for technical docs, research notes, READMEs, and slide presentations.

[[TOC]]

## Quick Highlights

> [!TIP] Interactive Everything
> Click any **task checkbox** in the preview pane to toggle it directly in your Markdown source. Double-click any rendered paragraph or heading to jump the editor straight to that line!

- [x] Real-time GFM rendering with **13 Callout styles** & syntax-highlighted code
- [x] **KaTeX mathematical typesetting** with live formula bar at cursor
- [x] **Client-side Mermaid & Chart SVG** rendering with zero external dependencies
- [ ] Try switching to **Slides** mode in the top bar or editing \`notes/physics.md\` via [[notes/physics|Quantum Notes]]

---

## Mathematics & Physics (KaTeX)

The Euler–Lagrange equation and a Gaussian integral render instantaneously:

$$
\\frac{\\partial \\mathcal{L}}{\\partial \\phi} - \\partial_\\mu \\left( \\frac{\\partial \\mathcal{L}}{\\partial (\\partial_\\mu \\phi)} \\right) = 0, \\qquad \\int_{-\\infty}^{\\infty} e^{-\\alpha x^2}\\,\\mathrm{d}x = \\sqrt{\\frac{\\pi}{\\alpha}}
$$

Inline physics notation like $\\ket{\\psi} = \\alpha\\ket{0} + \\beta\\ket{1}$ works seamlessly inside prose[^1].

## Architecture Diagram (Mermaid)

\`\`\`mermaid
flowchart LR
  A([Markdown Source]) --> B[Frontmatter & AST]
  B --> C{Block Router}
  C -->|Math| D[KaTeX SVG/HTML]
  C -->|Diagrams| E[Mermaid & Chart SVG]
  C -->|Code| F[Syntax Highlighter]
  D --> G([Export PDF / HTML / ZIP])
  E --> G
  F --> G
\`\`\`

## Feature Matrix

| Capability | Trigger / Syntax | Output |
| :--- | :---: | :--- |
| Callouts | \`> [!NOTE]\` / \`> [!WARNING]\` | Styled alert banner |
| Line Highlights | \` \`\`\`ts {2,4-5} \` | Highlighted code lines |
| Highlight & Keys | \`==mark==\` & \`<kbd>Ctrl+B</kbd>\` | ==Highlighted== & <kbd>Ctrl+B</kbd> |
| Emoji & Footnotes | \`:rocket:\` & \`[^1]\` | :rocket: & anchored footnotes |

## Data Visualization (\`chart\` Block)

\`\`\`chart
type: bar
title: Weekly Writing Output (Words)
labels: [Mon, Tue, Wed, Thu, Fri]
values: [1200, 1850, 1420, 2340, 1980]
\`\`\`

## Code With Line Highlighting

\`\`\`typescript title="src/pipeline.ts" {2,4-5}
export function transformDocument(source: string): string {
  const cleaned = source.trim(); // highlighted line
  const words = cleaned.split(/\\s+/).length;
  console.info(\`Compiled \${words} words\`);
  return cleaned;
}
\`\`\`

<details>
<summary>Expandable Reference & Shortcuts</summary>

Press <kbd>Ctrl+Shift+P</kbd> for the Command Palette, type \`/\` on a new line for Slash Commands, or \`:\` for Emoji autocomplete!

</details>

[^1]: Footnotes automatically gather at the bottom of your rendered document with return anchors.
`,
      },
      {
        path: "notes/physics.md",
        content: `---
title: "Quantum & Integrable Notes"
author: "Rashad Hamidi"
tags: [physics, integrability]
---

# Quantum Notes :atom_symbol:

Linked via \`[[notes/physics|Quantum Notes]]\` from [[README|Home]].

> [!NOTE] Yang–Baxter Equation
> $$R_{12}(\\lambda - \\mu) R_{13}(\\lambda) R_{23}(\\mu) = R_{23}(\\mu) R_{13}(\\lambda) R_{12}(\\lambda - \\mu)$$

- [x] Verify trigonometric $R$-matrix limit
- [ ] Export compiled paper HTML
`,
      },
    ],
  },
  {
    id: "github-readme",
    name: "GitHub Open-Source README",
    badge: "GitHub",
    category: "Engineering",
    description:
      "Clean repository README with shields badges, quickstart installation, architecture diagram, CLI table, and contribution guide.",
    mainFilePath: "README.md",
    files: [
      {
        path: "README.md",
        content: `# AstraFlux :rocket:

![Build](https://img.shields.io/badge/build-passing-10b981) ![License](https://img.shields.io/badge/license-MIT-00c3f5) ![Version](https://img.shields.io/badge/version-2.4.0-9333ea)

> High-throughput streaming pipeline toolkit with zero-copy TypeScript bindings.

[[TOC]]

## Features

- :zap: **Sub-millisecond dispatch** across worker threads
- :shield: **Strict schema validation** with typed error diagnostics
- :package: **Zero runtime dependencies** in core bundle

## Installation

\`\`\`bash title="Terminal"
npm install astraflux
npx astraflux init
\`\`\`

## Pipeline Flow

\`\`\`mermaid
flowchart LR
  In([Input Stream]) --> Parse[Schema Parser]
  Parse --> Valid{Valid?}
  Valid -->|Yes| Sink[(Output Store)]
  Valid -->|No| DLQ[Dead Letter Queue]
\`\`\`

## CLI Reference

| Command | Flag | Description |
| :--- | :--- | :--- |
| \`astraflux dev\` | \`--watch\` | Start local hot-reload worker |
| \`astraflux build\` | \`--minify\` | Emit production bundle |
| \`astraflux check\` | \`--strict\` | Run schema & lint checks |

> [!IMPORTANT] Node Requirement
> Requires Node.js **20+** or any modern Web Streams runtime.

## Roadmap

- [x] Core streaming runtime
- [x] TypeScript SDK
- [ ] Distributed trace exporter
`,
      },
    ],
  },
  {
    id: "technical-rfc",
    name: "Technical RFC & Design Doc",
    badge: "RFC",
    category: "Engineering",
    description:
      "Structured engineering proposal with frontmatter status, sequence diagram, trade-off matrix, and rollout checklist.",
    mainFilePath: "RFC-014.md",
    files: [
      {
        path: "RFC-014.md",
        content: `---
title: "RFC-014: Edge Cache Invalidation Protocol"
author: "Engineering Architecture"
date: "2026-11-22"
status: "Proposed"
tags: [rfc, distributed-systems, caching]
---

# RFC-014: Edge Cache Invalidation

## 1. Context & Problem

Current TTL-based edge invalidation causes stale reads up to **120 seconds** after database mutations.

> [!WARNING] Consistency Impact
> High-churn user profile updates require deterministic invalidation under 500 ms.

## 2. Proposed Protocol

\`\`\`mermaid
sequenceDiagram
  participant App as Origin API
  participant Bus as Event Stream
  participant Edge as Edge POP
  App->>Bus: Publish PurgeKey(tag)
  Bus-->>Edge: Fan-out Invalidation
  Edge->>Edge: Evict surrogate keys
  Edge-->>App: Ack (p99 < 180ms)
\`\`\`

## 3. Trade-Off Comparison

| Strategy | Propagation | Complexity | Cost |
| :--- | :---: | :---: | :---: |
| Short TTL (5s) | 5s | Low | High Origin Load |
| Surrogate Tag Fan-Out | < 200ms | Medium | Low |
| Full Purge | < 1s | Low | Cache Stampede Risk |

## 4. Rollout Checklist

- [x] Instrument origin surrogate key headers
- [ ] Deploy fan-out consumer to staging POPs
- [ ] Verify p99 cache hit ratio remains above 94%
`,
      },
    ],
  },
  {
    id: "research-paper",
    name: "Scientific Notes & Derivations",
    badge: "Math",
    category: "Academic",
    description:
      "Academic research note template with numbered sections, theorem callouts, multi-line KaTeX derivations, and footnotes.",
    mainFilePath: "paper.md",
    files: [
      {
        path: "paper.md",
        content: `---
title: "Variational Principles in Field Theory"
author: "Rashad Hamidi"
date: "2026-11-22"
tags: [physics, lagrangian, katex]
---

# Variational Principles & Symmetries

## Action Functional

Consider a classical field $\\phi(x)$ defined on spacetime manifold $\\mathcal{M}$ with action:

$$
S[\\phi] = \\int_{\\mathcal{M}} \\mathrm{d}^4x\\, \\mathcal{L}(\\phi, \\partial_\\mu \\phi)
$$

> [!ABSTRACT] Noether's First Theorem
> Every differentiable symmetry of the action functional $S[\\phi]$ corresponds to a conserved current $J^\\mu$ satisfying $\\partial_\\mu J^\\mu = 0$ on-shell.

## Variation Derivation

Under an infinitesimal transformation $\\delta \\phi = \\epsilon \\Delta \\phi$, the variation becomes[^noether]:

$$
\\delta S = \\int_{\\mathcal{M}} \\mathrm{d}^4x \\left[ \\left( \\frac{\\partial \\mathcal{L}}{\\partial \\phi} - \\partial_\\mu \\frac{\\partial \\mathcal{L}}{\\partial(\\partial_\\mu \\phi)} \\right) \\delta \\phi + \\partial_\\mu \\left( \\frac{\\partial \\mathcal{L}}{\\partial(\\partial_\\mu \\phi)} \\delta \\phi \\right) \\right]
$$

## Summary Table

| Symmetry | Generator | Conserved Quantity |
| :--- | :---: | :--- |
| Time Translation | $H$ | Total Energy $E$ |
| Spatial Translation | $P_i$ | Linear Momentum $\\vec{P}$ |
| $U(1)$ Phase | $Q$ | Electric Charge |

[^noether]: Emmy Noether, *Invariante Variationsprobleme*, Nachr. d. König. Gesellsch. d. Wiss. zu Göttingen (1918).
`,
      },
    ],
  },
  {
    id: "slide-deck",
    name: "Presentation Slide Deck",
    badge: "Slides",
    category: "Presentation",
    description:
      "6-slide presentation separated by --- with speaker notes, Mermaid diagram, code, math, and tables ready for Slide Mode.",
    mainFilePath: "deck.md",
    files: [
      {
        path: "deck.md",
        content: `---
title: "Designing Resilient Systems"
author: "Markdown Studio"
date: "2026-11-22"
tags: [slides, architecture]
---

# Designing Resilient Systems :ringed_planet:

### From Local Notes to Interactive Presentations

Switch to **Slides** in the top bar (or press \`ArrowLeft\` / \`ArrowRight\`) to present!

<!-- note: Welcome the audience and mention that every slide here is pure Markdown separated by horizontal rules (---). -->

---

## Core Design Pillars

1. **Clarity first** — minimize accidental complexity
2. **Fast feedback loops** — milliseconds beat minutes
3. **Graceful degradation** — isolate failures cleanly

> [!TIP] Speaker Cue
> Keep each slide focused on one core takeaway.

<!-- note: Emphasize pillar #2: real-time preview and instant validation transform how teams write documentation. -->

---

## Request Lifecycle

\`\`\`mermaid
flowchart LR
  Client([Client]) --> Gateway[API Gateway]
  Gateway --> Cache{Cache Hit?}
  Cache -->|Yes| Fast([200 OK · 2ms])
  Cache -->|No| DB[(Primary DB)]
  DB --> Fast
\`\`\`

<!-- note: Walk through the cache fast-path and database fallback. -->

---

## Quantitative Latency Target

$$
P(\\text{SLO Met}) = 1 - \\prod_{i=1}^{k} p_{\\text{fail},i} \\ge 99.95\\%
$$

| Tier | Target p95 | Target p99 |
| :--- | :---: | :---: |
| Edge Cache | 12 ms | 28 ms |
| Origin Read | 45 ms | 110 ms |

---

## Code Walkthrough

\`\`\`typescript {2-3}
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try { return await fn(); } catch (err) { if (attempt === tries) throw err; }
  }
  throw new Error("Unreachable");
}
\`\`\`

---

## Thank You! :rocket:

- [x] Export slides to **Standalone HTML** or **Landscape PDF**
- [x] Share workspace directly via compressed URL

<!-- note: Open the floor for Q&A. -->
`,
      },
    ],
  },
  {
    id: "api-docs",
    name: "REST API Reference",
    badge: "API",
    category: "Engineering",
    description:
      "Developer API documentation with endpoint summaries, parameter tables, JSON payloads, cURL examples, and error callouts.",
    mainFilePath: "api-reference.md",
    files: [
      {
        path: "api-reference.md",
        content: `---
title: "Payments API v2 Reference"
author: "Platform Team"
date: "2026-11-22"
tags: [api, rest, reference]
---

# Payments API v2

Base URL: \`https://api.example.com/v2\`

## Authentication

> [!CAUTION] Secret Keys
> Never expose \`sk_live_*\` secret keys inside client-side bundles or public repositories.

## \`POST /v2/invoices\`

Creates a new draft or finalized customer invoice.

### Parameters

| Field | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| \`customer_id\` | \`string\` | Yes | Unique customer identifier |
| \`amount_cents\` | \`integer\` | Yes | Positive amount in minor currency units |
| \`currency\` | \`string\` | Yes | ISO-4217 code (e.g. \`USD\`, \`GBP\`) |
| \`auto_advance\` | \`boolean\` | No | Finalize automatically when true |

### Example Request

\`\`\`bash title="cURL"
curl -X POST https://api.example.com/v2/invoices \\
  -H "Authorization: Bearer sk_test_123" \\
  -H "Content-Type: application/json" \\
  -d '{"customer_id":"cus_981","amount_cents":4900,"currency":"USD"}'
\`\`\`

### Example Response

\`\`\`json title="201 Created"
{
  "id": "inv_01J9XK",
  "status": "open",
  "amount_cents": 4900,
  "currency": "USD"
}
\`\`\`
`,
      },
    ],
  },
  {
    id: "editorial-essay",
    name: "Long-Form Blog Essay",
    badge: "Essay",
    category: "Writing",
    description:
      "Clean editorial essay layout with frontmatter metadata, pull quotes, reading-time analytics, and cited footnotes.",
    mainFilePath: "essay.md",
    files: [
      {
        path: "essay.md",
        content: `---
title: "On Tools That Think With You"
author: "Rashad Hamidi"
date: "2026-11-22"
description: "Why plain text paired with live visual feedback remains the sharpest instrument for clear thinking."
tags: [writing, essays, craft]
---

# On Tools That Think With You

Plain text endures because it refuses to trap your ideas inside proprietary silos. Every heading, equation, and footnote remains legible decades from now—yet with live typesetting, it becomes an interactive studio.

> Writing is nature's way of letting you see how sloppy your thinking is—and clear structure is how we refine it[^1].

## The Geometry of Attention

When distraction disappears, three habits emerge:

1. **Draft rapidly** without worrying about margins or fonts.
2. **Inspect readability** and sentence flow in real time.
3. **Export everywhere**—PDF, standalone HTML, or clean Markdown.

## Closing Reflection

==Simplicity is not the absence of power==; it is power arranged so effortlessly that your attention stays entirely on the argument.

[^1]: Adapted from Dick Guindon's classic maxim on writing and clarity.
`,
      },
    ],
  },
  {
    id: "changelog",
    name: "Semantic Changelog",
    badge: "Release",
    category: "Engineering",
    description:
      "Keep-a-Changelog release log with version badges, Added/Changed/Fixed groups, and migration notes.",
    mainFilePath: "CHANGELOG.md",
    files: [
      {
        path: "CHANGELOG.md",
        content: `# Changelog

All notable changes to this project will be documented in this file.

## [2.4.0] — 2026-11-22

![Release](https://img.shields.io/badge/release-v2.4.0-00c3f5)

### Added
- Interactive GFM task checkboxes that sync straight back to Markdown source
- Client-side Mermaid flowchart, sequence, state, pie & Gantt renderer
- Readability analytics drawer with Flesch score and keyword density

### Changed
- Improved table auto-formatter alignment for escaped \`\\|\` cells

### Fixed
- Resolved KaTeX delimiter edge cases around inline currency signs

> [!NOTE] Upgrade Path
> No breaking schema changes in \`v2.4.0\`. Existing workspaces load automatically.
`,
      },
    ],
  },
  {
    id: "meeting-notes",
    name: "Meeting Minutes & Actions",
    badge: "Notes",
    category: "Writing",
    description:
      "Structured meeting agenda, decisions table, and interactive action-item checklist.",
    mainFilePath: "meeting-notes.md",
    files: [
      {
        path: "meeting-notes.md",
        content: `---
title: "Weekly Product & Engineering Sync"
date: "2026-11-22"
attendees: [Rashad, Maya, Tariq]
tags: [meeting, sync, actions]
---

# Weekly Product & Engineering Sync :memo:

## Agenda

1. Review Q4 milestone velocity
2. Finalize documentation portal migration
3. Assign release verification owners

## Key Decisions

| Topic | Decision | Owner |
| :--- | :--- | :--- |
| Docs Format | Standardize all guides on GFM + Mermaid | @maya |
| Math Rendering | Bundle KaTeX offline assets | @rashad |
| Exports | Support HTML, PDF & ZIP archives | @tariq |

## Action Items

- [x] Publish Markdown template starter pack
- [ ] Audit broken anchor links across handbook
- [ ] Schedule release dry-run on Friday
`,
      },
    ],
  },
  {
    id: "knowledge-wiki",
    name: "Multi-File Knowledge Wiki",
    badge: "Wiki",
    category: "Writing",
    description:
      "3-file interconnected workspace using [[Wiki Links]] across index.md, notes/systems.md, and notes/glossary.md.",
    mainFilePath: "index.md",
    files: [
      {
        path: "index.md",
        content: `---
title: "Engineering Knowledge Base"
tags: [wiki, index]
---

# Knowledge Base :books:

Welcome to your interconnected multi-file Markdown wiki. Click any \`[[Wiki Link]]\` in the preview to switch files immediately!

## Pages

- [[notes/systems|Distributed Systems Patterns]]
- [[notes/glossary|Core Terminology Glossary]]

> [!TIP] Creating New Pages
> Click the **New File** icon in the Files sidebar or create any path like \`guides/onboarding.md\`.
`,
      },
      {
        path: "notes/systems.md",
        content: `# Distributed Systems Patterns

Back to [[index|Home]] · See [[notes/glossary|Glossary]]

## Circuit Breaker States

\`\`\`mermaid
stateDiagram-v2
  [*] --> Closed
  Closed --> Open : Failure Threshold
  Open --> HalfOpen : Cooldown Elapsed
  HalfOpen --> Closed : Probe Succeeded
  HalfOpen --> Open : Probe Failed
\`\`\`
`,
      },
      {
        path: "notes/glossary.md",
        content: `# Core Terminology Glossary

Back to [[index|Home]] · See [[notes/systems|Systems Patterns]]

*[SLO]: Service Level Objective
*[SLA]: Service Level Agreement

Idempotency
: Property of operations that can be applied multiple times without changing the result beyond the initial application.

Backpressure
: Flow-control signal propagating upstream when a downstream consumer cannot keep pace.

Hover abbreviations like SLO and SLA in rendered prose!
`,
      },
    ],
  },
];

export function createProjectFromTemplate(templateId: string): MarkdownProject {
  const tpl =
    MARKDOWN_TEMPLATES.find((t) => t.id === templateId) ?? MARKDOWN_TEMPLATES[0];
  const now = Date.now();
  const files: MarkdownFile[] = tpl.files.map((f, idx) => ({
    id: `md-file-${now}-${idx}`,
    path: f.path,
    kind: "md",
    content: f.content,
    updatedAt: now,
  }));

  return {
    id: `md-proj-${now}-${Math.random().toString(36).slice(2, 6)}`,
    name: tpl.name,
    templateId: tpl.id,
    mainFilePath: tpl.mainFilePath,
    files,
    snapshots: [],
    createdAt: now,
    updatedAt: now,
    storageMode: "browser",
  };
}
