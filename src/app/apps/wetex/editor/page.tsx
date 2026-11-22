import type { Metadata } from "next";
import { WeTeXClient } from "../WeTeXClient";

export const metadata: Metadata = {
  title: "WeTeX Studio — Focus Editor",
  description:
    "Distraction-free online LaTeX compiler and multi-file IDE with Real TeX Live 2026 PDF output, instant KaTeX & TikZ preview, BibTeX, SyncTeX navigation, and ZIP/PDF export.",
};

export default function WeTeXEditorPage() {
  return <WeTeXClient />;
}
