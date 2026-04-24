/**
 * File text extraction module.
 * PDF.js and Mammoth are accessed via the global window (loaded via next/script).
 * This module must only be called inside a browser context.
 */

type SupportedExtension = "txt" | "md" | "html" | "csv" | "docx" | "doc" | "pdf";

const TEXT_EXTENSIONS: SupportedExtension[] = ["txt", "md", "html", "csv"];
const DOCX_EXTENSIONS: SupportedExtension[] = ["docx", "doc"];

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function readDocx(file: File): Promise<string> {
  // mammoth is injected as a global by next/script
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = (window as any).mammoth;
  if (!mammoth) throw new Error("Mammoth.js is not loaded yet.");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value as string;
}

async function readPdf(file: File): Promise<string> {
  // pdfjsLib is injected as a global by next/script
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js is not loaded yet.");
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fullText += content.items.map((item: any) => item.str).join(" ") + "\n\n";
  }
  return fullText;
}

/** Routes a File to the correct parser based on extension. */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() as SupportedExtension | undefined;

  try {
    if (ext && TEXT_EXTENSIONS.includes(ext)) {
      return await readAsText(file);
    } else if (ext && DOCX_EXTENSIONS.includes(ext)) {
      return await readDocx(file);
    } else if (ext === "pdf") {
      return await readPdf(file);
    } else {
      throw new Error(`Unsupported file type: .${ext ?? "unknown"}`);
    }
  } catch (error) {
    console.error("Error reading file:", error);
    throw new Error(
      "Could not extract text from this document. It may be corrupted or encrypted."
    );
  }
}
