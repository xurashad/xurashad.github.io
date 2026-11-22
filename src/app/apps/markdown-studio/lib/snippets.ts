import type { SlashCommandItem } from "./types";

export interface MarkdownBlockSnippet {
  id: string;
  category:
    | "Structure"
    | "Callouts"
    | "Code & Math"
    | "Diagrams"
    | "Tables & Lists"
    | "Interactive";
  title: string;
  desc: string;
  snippet: string;
  cursorOffset?: number;
}

export const MARKDOWN_SNIPPETS: MarkdownBlockSnippet[] = [
  {
    id: "toc",
    category: "Structure",
    title: "Table of Contents",
    desc: "Auto-generated nested heading links",
    snippet: "[[TOC]]\n\n",
  },
  {
    id: "frontmatter",
    category: "Structure",
    title: "YAML Frontmatter",
    desc: "Document title, author, date & tags",
    snippet: `---
title: "Document Title"
author: "Author Name"
date: "${new Date().toISOString().slice(0, 10)}"
tags: [notes, markdown]
draft: false
---

`,
  },
  {
    id: "slide-break",
    category: "Structure",
    title: "Slide Break + Speaker Note",
    desc: "Starts a new slide in Slides mode",
    snippet: `\n---\n\n## Slide Title\n\n- Key takeaway\n\n<!-- note: Speaker note visible in presenter drawer. -->\n`,
  },
  {
    id: "callout-note",
    category: "Callouts",
    title: "Note Callout",
    desc: "Informational [!NOTE] alert banner",
    snippet: `> [!NOTE] Context\n> Helpful background context for readers.\n\n`,
  },
  {
    id: "callout-tip",
    category: "Callouts",
    title: "Tip Callout",
    desc: "Emerald [!TIP] advice banner",
    snippet: `> [!TIP] Pro Tip\n> Highlight a shortcut, optimization, or best practice.\n\n`,
  },
  {
    id: "callout-warning",
    category: "Callouts",
    title: "Warning Callout",
    desc: "Amber [!WARNING] cautionary block",
    snippet: `> [!WARNING] Attention\n> Explain an important caveat or side effect.\n\n`,
  },
  {
    id: "callout-caution",
    category: "Callouts",
    title: "Caution / Danger Callout",
    desc: "Crimson [!CAUTION] critical alert",
    snippet: `> [!CAUTION] Breaking Change\n> Describe destructive actions or irreversible steps.\n\n`,
  },
  {
    id: "callout-fold",
    category: "Callouts",
    title: "Collapsible Abstract Callout",
    desc: "Foldable > [!ABSTRACT]+ callout",
    snippet: `> [!ABSTRACT]+ Executive Summary\n> Click the header to collapse or expand this summary.\n\n`,
  },
  {
    id: "code-ts",
    category: "Code & Math",
    title: "Code Block (Highlighted Lines)",
    desc: "Fenced code with title and {2-3} focus",
    snippet: `\`\`\`typescript title="example.ts" {2-3}
export function greet(name: string): string {
  const message = \`Hello, \${name}!\`;
  return message;
}
\`\`\`\n\n`,
  },
  {
    id: "math-display",
    category: "Code & Math",
    title: "KaTeX Display Equation",
    desc: "Centered $$...$$ LaTeX math block",
    snippet: `$$\n\\int_{-\\infty}^{\\infty} e^{-x^2}\\,\\mathrm{d}x = \\sqrt{\\pi}\n$$\n\n`,
  },
  {
    id: "math-aligned",
    category: "Code & Math",
    title: "Aligned Multi-Line Equations",
    desc: "KaTeX aligned derivation block",
    snippet: `$$\n\\begin{aligned}\nE^2 &= (pc)^2 + (m c^2)^2 \\\\\n\\mathcal{L} &= T - V\n\\end{aligned}\n$$\n\n`,
  },
  {
    id: "mermaid-flow",
    category: "Diagrams",
    title: "Mermaid Flowchart",
    desc: "Left-to-right node & decision graph",
    snippet: `\`\`\`mermaid
flowchart LR
  Start([Start]) --> Check{Valid?}
  Check -->|Yes| Ship([Deploy])
  Check -->|No| Fix[Patch & Retest]
  Fix --> Check
\`\`\`\n\n`,
  },
  {
    id: "mermaid-seq",
    category: "Diagrams",
    title: "Mermaid Sequence Diagram",
    desc: "Service interaction timeline",
    snippet: `\`\`\`mermaid
sequenceDiagram
  participant Client
  participant API
  participant DB
  Client->>API: POST /query
  API->>DB: SELECT * FROM docs
  DB-->>API: Rows
  API-->>Client: 200 OK
\`\`\`\n\n`,
  },
  {
    id: "mermaid-pie",
    category: "Diagrams",
    title: "Mermaid Pie Chart",
    desc: "Proportional breakdown donut chart",
    snippet: `\`\`\`mermaid
pie title Time Allocation
  "Writing" : 45
  "Research" : 30
  "Editing" : 25
\`\`\`\n\n`,
  },
  {
    id: "chart-bar",
    category: "Diagrams",
    title: "Bar / Line Chart Block",
    desc: "Built-in SVG data visualization",
    snippet: `\`\`\`chart
type: bar
title: Monthly Progress
labels: [Jan, Feb, Mar, Apr]
values: [24, 38, 52, 69]
\`\`\`\n\n`,
  },
  {
    id: "table-aligned",
    category: "Tables & Lists",
    title: "Aligned GFM Table",
    desc: "3-column Markdown table with alignments",
    snippet: `| Feature | Status | Notes |
| :--- | :---: | ---: |
| Live Preview | Ready | < 5ms |
| KaTeX Math | Ready | Offline |
| Mermaid SVG | Ready | Client |
\n`,
  },
  {
    id: "task-list",
    category: "Tables & Lists",
    title: "Interactive Task Checklist",
    desc: "Clickable preview task items",
    snippet: `- [x] Draft core outline\n- [ ] Add diagrams and examples\n- [ ] Export final PDF\n\n`,
  },
  {
    id: "def-list",
    category: "Tables & Lists",
    title: "Definition List",
    desc: "Term and indented : definition",
    snippet: `Markdown Studio\n: A multi-file browser IDE with live GFM, KaTeX, Mermaid, and Slide Decks.\n\n`,
  },
  {
    id: "details-fold",
    category: "Interactive",
    title: "Collapsible Details Section",
    desc: "Native expandable <details> block",
    snippet: `<details>\n<summary>Click to expand details</summary>\n\nHidden **Markdown** content goes here.\n\n</details>\n\n`,
  },
  {
    id: "footnote-pair",
    category: "Interactive",
    title: "Footnote Reference",
    desc: "Inline [^1] marker + bottom note",
    snippet: `Statement needing citation[^1].\n\n[^1]: Full reference or explanatory note.\n`,
  },
  {
    id: "shields-badge",
    category: "Interactive",
    title: "Status Badge",
    desc: "Shields.io style status pill",
    snippet: `![Status](https://img.shields.io/badge/Build-Passing-10b981) `,
  },
];

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: "slash-h1",
    trigger: "/h1",
    label: "Heading 1",
    description: "Large document title heading",
    snippet: "# ",
  },
  {
    id: "slash-h2",
    trigger: "/h2",
    label: "Heading 2",
    description: "Major section heading",
    snippet: "## ",
  },
  {
    id: "slash-h3",
    trigger: "/h3",
    label: "Heading 3",
    description: "Subsection heading",
    snippet: "### ",
  },
  {
    id: "slash-table",
    trigger: "/table",
    label: "Table Builder (Visual)",
    description: "Open interactive GFM table creator",
    snippet: "",
    modalAction: "table",
  },
  {
    id: "slash-callout",
    trigger: "/callout",
    label: "Callout / Alert Block",
    description: "Insert [!NOTE], [!TIP], [!WARNING] banner",
    snippet: `> [!TIP] Title\n> Helpful callout body.\n`,
  },
  {
    id: "slash-code",
    trigger: "/code",
    label: "Fenced Code Block",
    description: "Syntax-highlighted code block",
    snippet: "```typescript\n\n```",
    cursorOffset: -4,
  },
  {
    id: "slash-math",
    trigger: "/math",
    label: "KaTeX Display Equation",
    description: "Centered $$...$$ math formula",
    snippet: "$$\n\n$$",
    cursorOffset: -3,
  },
  {
    id: "slash-mermaid",
    trigger: "/mermaid",
    label: "Mermaid Diagram Studio",
    description: "Open live Mermaid / Chart visual builder",
    snippet: "",
    modalAction: "mermaid",
  },
  {
    id: "slash-chart",
    trigger: "/chart",
    label: "Bar / Line Chart",
    description: "Insert client-side SVG data chart",
    snippet: `\`\`\`chart\ntype: bar\ntitle: Dataset\nlabels: [A, B, C]\nvalues: [12, 25, 19]\n\`\`\`\n`,
  },
  {
    id: "slash-toc",
    trigger: "/toc",
    label: "Table of Contents",
    description: "Auto-generated heading navigation [[TOC]]",
    snippet: "[[TOC]]\n",
  },
  {
    id: "slash-task",
    trigger: "/task",
    label: "Task Checklist",
    description: "Interactive - [ ] task items",
    snippet: "- [ ] First task\n- [ ] Second task\n",
  },
  {
    id: "slash-details",
    trigger: "/details",
    label: "Collapsible Section",
    description: "Expandable <details> toggle",
    snippet: "<details>\n<summary>More Info</summary>\n\nContent here.\n\n</details>\n",
  },
  {
    id: "slash-footnote",
    trigger: "/footnote",
    label: "Footnote Reference",
    description: "Insert [^1] citation & definition",
    snippet: "[^1]\n\n[^1]: Footnote explanation.",
  },
  {
    id: "slash-frontmatter",
    trigger: "/frontmatter",
    label: "Frontmatter Metadata",
    description: "Open YAML / TOML frontmatter editor",
    snippet: "",
    modalAction: "frontmatter",
  },
  {
    id: "slash-badge",
    trigger: "/badge",
    label: "Badge Builder",
    description: "Open visual status badge & callout studio",
    snippet: "",
    modalAction: "callout",
  },
  {
    id: "slash-date",
    trigger: "/date",
    label: "Current Date",
    description: "Insert today's ISO date",
    snippet: new Date().toISOString().slice(0, 10),
  },
  {
    id: "slash-hr",
    trigger: "/hr",
    label: "Horizontal Rule / Slide Break",
    description: "Insert --- divider",
    snippet: "\n---\n\n",
  },
];
