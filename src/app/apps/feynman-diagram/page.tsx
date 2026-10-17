import type { Metadata } from "next";
import { FeynmanApp } from "./FeynmanApp";

export const metadata: Metadata = {
  title: "Feynman Diagram Visualizer & LaTeX Studio | Rashad Hamidi",
  description:
    "Interactive Feynman diagram visualizer and editor. Design QED, QCD, and Electroweak diagrams with standard model presets, interactive bend controls, and instant TikZ-Feynman LaTeX, SVG, and PNG export.",
  keywords: [
    "Feynman diagram",
    "Feynman diagram generator",
    "tikz-feynman",
    "quantum electrodynamics",
    "particle physics",
    "standard model",
    "LaTeX Feynman diagram",
    "physics diagram editor",
  ],
};

export default function FeynmanDiagramPage() {
  return <FeynmanApp />;
}
