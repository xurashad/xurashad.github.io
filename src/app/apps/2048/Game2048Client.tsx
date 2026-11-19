"use client";

import dynamic from "next/dynamic";

const Game2048 = dynamic(
  () => import("./Game2048").then((m) => m.Game2048),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-[920px] flex flex-col gap-5">
        <div className="h-14 rounded-2xl glass border border-[var(--surface-border)] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,490px)_minmax(300px,360px)] gap-6 justify-center">
          <div className="flex flex-col gap-3.5 max-w-[490px] w-full mx-auto">
            <div className="h-16 rounded-2xl glass border border-[var(--surface-border)] animate-pulse" />
            <div className="w-full aspect-square rounded-2xl glass border border-[var(--surface-border)] flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full border-2 border-quantum border-t-transparent animate-spin" />
              <span className="text-xs font-mono text-foreground/60">
                Initializing 2048 Studio…
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-36 rounded-2xl glass border border-[var(--surface-border)] animate-pulse" />
            <div className="h-44 rounded-2xl glass border border-[var(--surface-border)] animate-pulse" />
            <div className="h-56 rounded-2xl glass border border-[var(--surface-border)] animate-pulse" />
          </div>
        </div>
      </div>
    ),
  }
);

export function Game2048Client() {
  return <Game2048 />;
}
