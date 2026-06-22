import type { Metadata } from "next";
import { ImageEditorApp } from "./ImageEditorApp";

export const metadata: Metadata = {
  title: "Image Editor — Professional Browser-Based Editing",
  description:
    "A powerful, fully client-side image editor with crop, resize, rotate, flip, 12 professional filters, 10 adjustment sliders, drawing tools, text overlays, and multi-format export. All processing happens locally in your browser.",
  keywords: [
    "image editor",
    "photo editor",
    "crop image",
    "resize image",
    "photo filters",
    "image adjustments",
    "browser image editor",
    "online photo editor",
  ],
};

export default function ImageEditorPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-nebula/4 blur-[120px]" />
        <div className="absolute top-2/3 left-1/3 w-72 h-72 rounded-full bg-olive/3 blur-[100px]" />
      </div>

      <div className="section-container py-8 pb-16">
        <div className="mb-6">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-2">// Creative Tools</div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3">
            <span className="gradient-text-quantum">Image Editor</span>
          </h1>
          <p className="text-foreground/45 max-w-2xl leading-relaxed text-sm">
            Professional-grade image editing right in your browser. Crop, resize, apply filters,
            adjust colours, draw, add text — then export in PNG, JPEG, or WebP. Everything runs
            locally — your images never leave your device.
          </p>
        </div>

        <ImageEditorApp />
      </div>
    </div>
  );
}
