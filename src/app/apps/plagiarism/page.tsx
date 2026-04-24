import type { Metadata } from "next";
import Script from "next/script";
import { PlagiarismApp } from "./PlagiarismApp";
import { Search, Globe, BookOpen, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Plagiarism Checker",
  description:
    "Multi-engine plagiarism checker that queries Wikipedia, OpenAlex academic journals, and the global web via SearXNG. All processing happens locally in your browser — no text is uploaded.",
  keywords: [
    "plagiarism checker",
    "plagiarism detector",
    "academic integrity",
    "text similarity",
    "Wikipedia search",
    "OpenAlex",
  ],
};

const FEATURES = [
  {
    icon: Globe,
    label: "Multi-engine search",
    desc: "Queries Wikipedia, OpenAlex, SearXNG, DDG, and Yahoo.",
  },
  {
    icon: BookOpen,
    label: "Academic journals",
    desc: "Checks against OpenAlex — 200M+ academic works.",
  },
  {
    icon: Zap,
    label: "Deep URL fetching",
    desc: "Fetches the full text of top results, not just snippets.",
  },
  {
    icon: ShieldCheck,
    label: "100 % private",
    desc: "No text is ever uploaded. All checks run in your browser.",
  },
];

export default function PlagiarismPage() {
  return (
    <>
      {/* Load PDF.js worker before page becomes interactive */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        strategy="beforeInteractive"
      />
      <Script
        id="pdfjs-worker-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof pdfjsLib !== 'undefined') {
              pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
          `,
        }}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
        strategy="beforeInteractive"
      />

      <div className="min-h-screen keffiyeh-bg">
        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-crimson/4 blur-[100px]" />
        </div>

        <div className="section-container py-16 pb-32">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="mb-12">
            <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
              // Utilities
            </div>
            <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
              <span className="gradient-text-quantum">Plagiarism Checker</span>
            </h1>
            <p className="text-foreground/50 max-w-xl leading-relaxed">
              Multi-engine internet &amp; academic scanner. Paste or upload your
              document and the checker will query Wikipedia, academic journals,
              and the global web to flag copied or paraphrased content.
            </p>

            {/* Feature chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="glass-card p-3 flex flex-col gap-1.5 hover:border-quantum/25 transition-colors duration-300"
                >
                  <div className="flex items-center gap-2 text-quantum">
                    <Icon size={14} />
                    <span className="text-xs font-semibold text-foreground/70">{label}</span>
                  </div>
                  <p className="text-[11px] text-foreground/35 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── App ──────────────────────────────────────────────────────── */}
          <PlagiarismApp />

          {/* ── Footer note ──────────────────────────────────────────────── */}
          <p className="mt-12 text-center text-xs font-mono text-foreground/20">
            <Search size={10} className="inline mr-1" />
            All scans run locally in your browser — nothing is sent to any server.
          </p>
        </div>
      </div>
    </>
  );
}
