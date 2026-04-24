/**
 * PDF manipulation operations using pdf-lib (npm package).
 */

import { PDFDocument, PageSizes } from "pdf-lib";
import type { ImageFileItem, PageSize, Orientation, MarginSize } from "./types";

/** Extracts a subset of pages from a PDF, returns a downloadable Blob. */
export async function extractPages(file: File, pageIndices: number[]): Promise<Blob> {
  const sorted = [...pageIndices].sort((a, b) => a - b);
  const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(pdfDoc, sorted);
  copiedPages.forEach((p) => newDoc.addPage(p));
  const bytes = await newDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Merges multiple PDFs in order, returns a downloadable Blob. */
export async function mergePdfs(
  files: File[],
  onProgress: (pct: number) => void
): Promise<Blob> {
  const merged = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    const bytes = await files[i].arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const copied = await merged.copyPages(doc, doc.getPageIndices());
    copied.forEach((p) => merged.addPage(p));
    onProgress(Math.round(((i + 1) / files.length) * 100));
    await new Promise((r) => setTimeout(r, 0));
  }
  const bytes = await merged.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

const MARGIN_MAP: Record<MarginSize, number> = {
  none: 0,
  small: 36,
  big: 72,
};

/** Converts an array of image files into a single PDF Blob. */
export async function imagesToPdf(
  imageItems: ImageFileItem[],
  pageSize: PageSize,
  orientation: Orientation,
  margin: MarginSize,
  onProgress: (pct: number) => void
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const selectedMargin = pageSize === "fit" ? 0 : MARGIN_MAP[margin];

  let paperDims: [number, number] | undefined;
  if (pageSize === "a4") paperDims = PageSizes.A4;
  if (pageSize === "letter") paperDims = PageSizes.Letter;

  for (let i = 0; i < imageItems.length; i++) {
    const { file, previewUrl } = imageItems[i];

    try {
      let imageEmbed;
      if (file.type === "image/jpeg") {
        imageEmbed = await pdfDoc.embedJpg(await file.arrayBuffer());
      } else if (file.type === "image/png") {
        imageEmbed = await pdfDoc.embedPng(await file.arrayBuffer());
      } else {
        // Convert any other format (webp, avif…) to PNG via canvas
        const pngBuffer = await convertToPng(previewUrl);
        imageEmbed = await pdfDoc.embedPng(pngBuffer);
      }

      if (pageSize === "fit") {
        const page = pdfDoc.addPage([imageEmbed.width, imageEmbed.height]);
        page.drawImage(imageEmbed, { x: 0, y: 0, width: imageEmbed.width, height: imageEmbed.height });
      } else if (paperDims) {
        const dims: [number, number] =
          orientation === "landscape" ? [paperDims[1], paperDims[0]] : [...paperDims];
        const page = pdfDoc.addPage(dims);
        const { width: pw, height: ph } = page.getSize();
        const drawW = pw - 2 * selectedMargin;
        const drawH = ph - 2 * selectedMargin;
        const scaled = imageEmbed.scaleToFit(drawW, drawH);
        page.drawImage(imageEmbed, {
          x: selectedMargin + (drawW - scaled.width) / 2,
          y: selectedMargin + (drawH - scaled.height) / 2,
          width: scaled.width,
          height: scaled.height,
        });
      }
    } catch (err) {
      console.warn(`Skipping ${file.name}:`, err);
    }

    onProgress(Math.round(((i + 1) / imageItems.length) * 100));
    await new Promise((r) => setTimeout(r, 0));
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

/** Triggers a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function convertToPng(src: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(
        async (blob) => {
          if (blob) resolve(await blob.arrayBuffer());
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/png"
      );
    };
    img.onerror = reject;
    img.src = src;
  });
}
