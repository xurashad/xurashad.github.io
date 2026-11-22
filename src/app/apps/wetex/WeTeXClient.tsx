"use client";

import dynamic from "next/dynamic";

const WeTeXStudio = dynamic(
  () => import("./WeTeXStudio").then((m) => m.WeTeXStudio),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[100] w-screen h-dvh flex flex-col items-center justify-center gap-3 bg-[#060713] text-slate-200">
        <div className="w-10 h-10 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        <div className="text-xs font-mono tracking-widest uppercase text-cyan-300/80">
          Initializing WeTeX LaTeX Studio…
        </div>
      </div>
    ),
  },
);

export function WeTeXClient() {
  return <WeTeXStudio />;
}
