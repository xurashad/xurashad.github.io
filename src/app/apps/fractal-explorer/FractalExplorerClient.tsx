"use client";

import dynamic from "next/dynamic";

const FractalExplorer = dynamic(
  () => import("./FractalExplorer").then(m => m.FractalExplorer),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full flex flex-col items-center justify-center gap-3 bg-[#050510] text-slate-200"
        style={{ height: "calc(100dvh - 5rem)", minHeight: "520px" }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <div className="text-xs font-mono tracking-widest uppercase text-cyan-300/80">
          Initializing WebGL2 Fractal Observatory…
        </div>
      </div>
    ),
  },
);

export function FractalExplorerClient() {
  return <FractalExplorer />;
}
