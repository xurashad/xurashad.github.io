/**
 * Unicode data service — fetches from Next.js API routes (server-side proxied,
 * no CORS issues). The API routes cache responses for 24 hours server-side.
 */

export interface UnicodeChar {
  codePoint: string;
  name: string;
  character: string;
  category: string;
  combiningClass: string;
  bidiClass: string;
  decomposition: string;
  numericValue: string;
  bidiMirrored: string;
  uppercase: string;
  lowercase: string;
  titlecase: string;
}

export interface UnicodeBlock {
  startCode: number;
  endCode: number;
  name: string;
}

export async function fetchUnicodeData(): Promise<UnicodeChar[]> {
  const res = await fetch("/api/unicode/data", {
    // Cache in the browser for 1 hour; server caches for 24 h
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ??
        `API responded with ${res.status}`
    );
  }

  return res.json() as Promise<UnicodeChar[]>;
}

export async function fetchUnicodeBlocks(): Promise<UnicodeBlock[]> {
  const res = await fetch("/api/unicode/blocks", {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ??
        `API responded with ${res.status}`
    );
  }

  return res.json() as Promise<UnicodeBlock[]>;
}
