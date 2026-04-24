/**
 * PDF rendering utilities using pdfjs-dist (loaded via next/script CDN global).
 * All functions must run in a browser context.
 */

import type { PdfPage } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPdfjsLib(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lib = (window as any).pdfjsLib;
  if (!lib) throw new Error("PDF.js is not loaded yet.");
  return lib;
}

/** Renders all pages of a PDF to thumbnail data-URLs (scale = 0.5). */
export async function renderPdfThumbnails(file: File): Promise<PdfPage[]> {
  const pdfjsLib = getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: PdfPage[] = [];

  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push({ id: i, imageUrl: canvas.toDataURL("image/jpeg", 0.8) });
  }
  return pages;
}

export type ProgressCallback = (pct: number) => void;

/**
 * Converts specified pages of a PDF to images and zips them.
 * Returns a Blob of the ZIP archive.
 */
export async function exportPagesToZip(
  file: File,
  pageIndices: number[],
  format: string,
  onProgress: ProgressCallback
): Promise<Blob> {
  const pdfjsLib = getPdfjsLib();
  // JSZip is loaded via next/script CDN global
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const JSZip = (window as any).JSZip;
  if (!JSZip) throw new Error("JSZip is not loaded yet.");

  const zip = new JSZip();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const mimeType = `image/${format}`;
  const ext = format === "jpeg" ? "jpg" : format;

  for (let i = 0; i < pageIndices.length; i++) {
    const pageIndex = pageIndices[i];
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const imageUrl = canvas.toDataURL(mimeType, 0.95);
    const blob = await (await fetch(imageUrl)).blob();
    zip.file(`page_${pageIndex + 1}.${ext}`, blob);
    onProgress(Math.round(((i + 1) / pageIndices.length) * 100));
    await new Promise((r) => setTimeout(r, 0));
  }

  return zip.generateAsync({ type: "blob" });
}
