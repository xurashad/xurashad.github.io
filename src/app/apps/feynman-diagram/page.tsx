import { Metadata } from "next";
import { FeynmanApp } from "./FeynmanApp";

export const metadata: Metadata = {
  title: "Feynman Diagram Visualizer | Rashad Hamidi",
  description: "Web-based Feynman diagram generator with SVG and LaTeX export.",
};

export default function FeynmanDiagramPage() {
  return <FeynmanApp />;
}
