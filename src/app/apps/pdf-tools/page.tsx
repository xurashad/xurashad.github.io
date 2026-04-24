import type { Metadata } from "next";
import Script from "next/script";
import { PdfToolsApp } from "./PdfToolsApp";
import { FileText, Images, FileDown, Combine, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "PDF & Image Toolkit",
  description:
    "All-in-one browser-based PDF toolkit. Extract pages, convert images to PDF, export PDF pages as images, and merge multiple PDFs — all processed locally on your device.",
  keywords: [
    "PDF tools",
    "extract PDF pages",
    "images to PDF",
    "PDF to images",
    "merge PDF",
    "PDF converter",
  ],
};

const FEATURES = [
  { icon: FileText,   label: "Extract pages",     desc: "Pull specific pages into a new PDF." },
  { icon: Images,     label: "Images → PDF",       desc: "JPG, PNG, WEBP to a single document." },
  { icon: FileDown,   label: "PDF → Images (ZIP)", desc: "Export pages as high-quality images." },
  { icon: Combine,    label: "Merge PDFs",          desc: "Combine any number of files in order." },
  { icon: ShieldCheck, label: "100 % private",      desc: "All processing happens in your browser." },
];

export default function PdfToolsPage() {
  return (
    <>
      {/* PDF.js worker */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        strategy="beforeInteractive"
      />
      <Script
        id="pdfjs-worker-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `if(typeof pdfjsLib!=='undefined'){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';}`,
        }}
      />
      {/* JSZip for ZIP downloads */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
        strategy="beforeInteractive"
      />

      <div className="min-h-screen keffiyeh-bg">
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
          <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/4 blur-[100px]" />
        </div>

        <div className="section-container py-16 pb-32">

          {/* ── Header ── */}
          <div className="mb-12">
            <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
              // Utilities
            </div>
            <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
              <span className="gradient-text-quantum">PDF &amp; Image Toolkit</span>
            </h1>
            <p className="text-foreground/50 max-w-xl leading-relaxed">
              All-in-one, browser-based PDF and image tools. Extract pages, convert between
              images and PDF, or merge multiple documents — everything stays on your device.
            </p>

            {/* Feature chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-8">
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

          {/* ── App ── */}
          <PdfToolsApp />

          <p className="mt-12 text-center text-xs font-mono text-foreground/20">
            Powered by pdf-lib · PDF.js · JSZip — all processing is local, nothing is uploaded.
          </p>
        </div>
      </div>
    </>
  );
}
