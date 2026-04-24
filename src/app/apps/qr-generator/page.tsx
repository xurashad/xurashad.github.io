import type { Metadata } from "next";
import { QRGeneratorApp } from "./QRGeneratorApp";

export const metadata: Metadata = {
  title: "OmniQR – QR Code Generator",
  description:
    "Generate beautiful, fully customisable QR codes for URLs, plain text, WiFi, email, and contacts. Choose pixel styles, gradient colours, eye shapes, logo overlays, and frame styles. Export as SVG, PNG, or JPEG — all locally in your browser.",
  keywords: [
    "QR code generator", "custom QR code", "WiFi QR code",
    "vCard QR", "logo QR code", "SVG QR code", "OmniQR",
  ],
};

export default function QRGeneratorPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/4 blur-[120px]" />
      </div>

      <div className="section-container py-16 pb-32">
        <div className="mb-12">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">// Utilities</div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">OmniQR</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            Generate beautiful QR codes for URLs, WiFi, email, contacts, and plain text.
            Customise pixel styles, gradients, eye shapes, logo overlays, and decorative frames.
            Export to SVG, PNG, or JPEG — all locally in your browser.
          </p>
        </div>

        <QRGeneratorApp />
      </div>
    </div>
  );
}
