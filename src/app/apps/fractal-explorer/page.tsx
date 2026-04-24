import type { Metadata } from "next";
import { FractalExplorer } from "./FractalExplorer";

export const metadata: Metadata = {
  title: "Fractal Explorer — Mandelbrot & Julia Sets",
  description:
    "Explore the Mandelbrot and Julia sets interactively. Multi-threaded Web Worker rendering, 12 colour palettes, full undo/redo history, infinite pan/zoom, shift-click Julia shortcut, and PNG export.",
  keywords: [
    "mandelbrot", "julia set", "fractal explorer", "fractal visualizer",
    "complex numbers", "mathematics", "web worker", "infinite zoom",
  ],
};

export default function FractalExplorerPage() {
  return <FractalExplorer />;
}
