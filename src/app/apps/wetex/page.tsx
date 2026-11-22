import type { Metadata } from "next";
import { WeTeXLauncher } from "./WeTeXLauncher";

export const metadata: Metadata = {
  title: "WeTeX — Online LaTeX Studio & Compiler",
  description:
    "Write, edit, and compile multi-file LaTeX documents live in your browser. Features Real TeX Live 2026 PDF compilation, instant KaTeX mathematical typesetting, BibTeX & DOI citations, TikZ vector diagrams, SyncTeX navigation, 9 templates, visual table & equation builders, version history, and PDF/ZIP/TeXLive.net export.",
  keywords: [
    "WeTeX",
    "online latex compiler",
    "latex editor",
    "bibtex",
    "tikz",
    "katex",
    "synctex",
    "academic writing",
    "pdf export",
  ],
};

export default function WeTeXPage() {
  return <WeTeXLauncher />;
}
