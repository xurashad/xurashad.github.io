import type { Metadata } from "next";
import { MarkdownLauncher } from "./MarkdownLauncher";

export const metadata: Metadata = {
  title: "Markdown Studio — Illuminated Markdown IDE & Writing Suite",
  description:
    "Write, visualize, lint, and export rich multi-file Markdown workspaces directly in your browser. Features real-time GFM preview, 13 callouts, KaTeX math, client-side Mermaid & Chart SVGs, interactive task checklists, slide deck mode, visual builders, readability analytics, and PDF/HTML/ZIP export.",
  keywords: [
    "markdown editor",
    "markdown studio",
    "online markdown writer",
    "gfm preview",
    "mermaid markdown",
    "katex markdown",
    "markdown slides",
    "markdown linter",
    "html to markdown",
  ],
};

export default function MarkdownStudioPage() {
  return <MarkdownLauncher />;
}
