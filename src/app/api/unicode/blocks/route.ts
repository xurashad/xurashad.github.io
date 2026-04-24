import { NextResponse } from "next/server";

const UNICODE_BLOCKS_URL =
  "https://www.unicode.org/Public/UCD/latest/ucd/Blocks.txt";

export const revalidate = 86400;

export async function GET() {
  try {
    const res = await fetch(UNICODE_BLOCKS_URL, {
      cache: "force-cache",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `unicode.org responded with ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    const blocks: object[] = [];

    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const [range, name] = trimmed.split("; ");
      if (!range || !name) continue;

      const [startHex, endHex] = range.split("..");
      blocks.push({
        startCode: parseInt(startHex, 16),
        endCode: parseInt(endHex, 16),
        name: name.trim(),
      });
    }

    return NextResponse.json(blocks, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("Unicode blocks fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Unicode blocks from unicode.org" },
      { status: 500 }
    );
  }
}
