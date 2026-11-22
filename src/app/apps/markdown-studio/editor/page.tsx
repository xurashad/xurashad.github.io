import type { Metadata } from "next";
import { MarkdownClient } from "../MarkdownClient";

export const metadata: Metadata = {
  title: "Markdown Studio — Focus Editor",
  description:
    "Distraction-free cosmic Markdown IDE with live GFM preview, KaTeX math, Mermaid & chart diagrams, slide deck presentation mode, visual wizards, and HTML/PDF/ZIP export.",
};

export default function MarkdownStudioEditorPage() {
  return <MarkdownClient />;
}
