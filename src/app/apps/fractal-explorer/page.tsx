import type { Metadata } from "next";
import { FractalExplorerClient } from "./FractalExplorerClient";

export const metadata: Metadata = {
  title: "Fractal Explorer — WebGL2 GPU & Mathematical Observatory",
  description:
    "Explore 10 complex fractal families including Mandelbrot, Burning Ship, Tricorn, Celtic, Buffalo, Phoenix, Newton Basins, Nova, Magnet I, and Complex Logistic maps. Features WebGL2 F32 + DS64 deep zoom, multi-core Float64 workers, 3D Blinn-Phong lighting, Orbit Probe with Lyapunov analysis, 50/50 split Julia coupling, WebM recording, and 4K PNG/WebP export.",
  keywords: [
    "fractal explorer",
    "mandelbrot",
    "julia set",
    "burning ship",
    "newton fractal",
    "webgl2 fractal",
    "deep zoom",
    "lyapunov exponent",
    "complex dynamics",
    "mathematical visualizer",
  ],
};

export default function FractalExplorerPage() {
  return <FractalExplorerClient />;
}
