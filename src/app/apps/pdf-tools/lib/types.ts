/**
 * Shared types for the PDF & Image Toolkit.
 */

export type AppMode = "select" | "extract" | "images-to-pdf" | "pdf-to-images" | "merge";
export type StatusPhase = "idle" | "loading" | "loaded" | "processing" | "error";
export type ImageFormat = "jpeg" | "png" | "webp";
export type PageSize = "fit" | "a4" | "letter";
export type Orientation = "portrait" | "landscape";
export type MarginSize = "none" | "small" | "big";

export interface PdfPage {
  id: number;          // 0-indexed
  imageUrl: string;    // data: URL of the rendered thumbnail
}

export interface ImageFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

export interface MergePdfItem {
  id: string;
  file: File;
}
