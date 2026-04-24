import { NextResponse } from "next/server";

const UNICODE_DATA_URL =
  "https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt";

export const revalidate = 86400;

export async function GET() {
  try {
    const res = await fetch(UNICODE_DATA_URL, {
      cache: "force-cache",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `unicode.org responded with ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    const characters: object[] = [];

    for (const line of text.split("\n")) {
      const fields = line.split(";");
      if (fields.length < 15) continue;

      const [
        codePoint,
        rawName,
        category,
        combiningClass,
        bidiClass,
        decomposition,
        , ,
        numericValue,
        bidiMirrored,
        , ,
        uppercase,
        lowercase,
        titlecase,
      ] = fields;

      if (!codePoint || !rawName) continue;

      // Skip range boundary markers  
      if (
        rawName.startsWith("<") &&
        (rawName.endsWith(", First>") || rawName.endsWith(", Last>"))
      ) {
        continue;
      }

      const name =
        rawName === "<control>"
          ? `Control Character (U+${codePoint})`
          : rawName;

      let character: string;
      try {
        character = String.fromCodePoint(parseInt(codePoint, 16));
      } catch {
        continue;
      }

      characters.push({
        codePoint,
        name,
        character,
        category,
        combiningClass,
        bidiClass,
        decomposition,
        numericValue,
        bidiMirrored,
        uppercase: uppercase ?? "",
        lowercase: lowercase ?? "",
        titlecase: (titlecase ?? "").trim(),
      });
    }

    return NextResponse.json(characters, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("Unicode data fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Unicode data from unicode.org" },
      { status: 500 }
    );
  }
}
