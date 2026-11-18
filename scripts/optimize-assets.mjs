import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatMB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizeBatch(label, files, transformFn) {
  let beforeTotal = 0;
  let afterTotal = 0;
  let updatedCount = 0;

  for (const filePath of files) {
    const inputBuf = await fs.readFile(filePath);
    beforeTotal += inputBuf.length;

    const outputBuf = await transformFn(inputBuf, filePath);
    if (outputBuf && outputBuf.length < inputBuf.length) {
      await fs.writeFile(filePath, outputBuf);
      afterTotal += outputBuf.length;
      updatedCount++;
    } else {
      afterTotal += inputBuf.length;
    }
  }

  const saved = beforeTotal - afterTotal;
  const pct = beforeTotal > 0 ? ((saved / beforeTotal) * 100).toFixed(1) : "0.0";
  console.log(
    `[${label}] ${files.length} files (${updatedCount} updated): ${formatMB(beforeTotal)} -> ${formatMB(afterTotal)} (-${pct}%)`
  );
  return { beforeTotal, afterTotal };
}

function decodeIcoToSharp(icoBuf) {
  const count = icoBuf.readUInt16LE(4);
  if (count < 1) throw new Error("ICO file has no entries");

  // Pick the largest entry
  let bestOffset = 0;
  let bestSize = 0;
  let bestArea = -1;
  for (let i = 0; i < count; i++) {
    const entryOff = 6 + i * 16;
    const w = icoBuf[entryOff] || 256;
    const h = icoBuf[entryOff + 1] || 256;
    const size = icoBuf.readUInt32LE(entryOff + 8);
    const offset = icoBuf.readUInt32LE(entryOff + 12);
    if (w * h > bestArea) {
      bestArea = w * h;
      bestSize = size;
      bestOffset = offset;
    }
  }

  const entryData = icoBuf.subarray(bestOffset, bestOffset + bestSize);

  // Check if entry is already PNG-backed
  if (
    entryData.length >= 8 &&
    entryData[0] === 0x89 &&
    entryData[1] === 0x50 &&
    entryData[2] === 0x4e &&
    entryData[3] === 0x47
  ) {
    return sharp(entryData);
  }

  // Otherwise decode 32-bit DIB (BMP inside ICO)
  const headerSize = entryData.readUInt32LE(0);
  const width = entryData.readInt32LE(4);
  const rawHeight = entryData.readInt32LE(8);
  const height = Math.abs(rawHeight) / 2; // ICO DIB doubles height for XOR + AND masks
  const bpp = entryData.readUInt16LE(14);
  const compression = entryData.readUInt32LE(16);

  if (bpp !== 32 || compression !== 0) {
    throw new Error(`Unsupported DIB format in favicon.ico (bpp=${bpp}, compression=${compression})`);
  }

  const pixelOffset = headerSize;
  const rgba = Buffer.alloc(width * height * 4);
  const isBottomUp = rawHeight > 0;

  for (let y = 0; y < height; y++) {
    const srcY = isBottomUp ? height - 1 - y : y;
    for (let x = 0; x < width; x++) {
      const srcIdx = pixelOffset + (srcY * width + x) * 4;
      const dstIdx = (y * width + x) * 4;
      rgba[dstIdx] = entryData[srcIdx + 2];     // R
      rgba[dstIdx + 1] = entryData[srcIdx + 1]; // G
      rgba[dstIdx + 2] = entryData[srcIdx];     // B
      rgba[dstIdx + 3] = entryData[srcIdx + 3]; // A
    }
  }

  return sharp(rgba, { raw: { width, height, channels: 4 } });
}

function buildPngIco(pngBuf, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 0);
  dirEntry.writeUInt8(size >= 256 ? 0 : size, 1);
  dirEntry.writeUInt8(0, 2); // color palette count
  dirEntry.writeUInt8(0, 3); // reserved
  dirEntry.writeUInt16LE(1, 4); // planes
  dirEntry.writeUInt16LE(32, 6); // bits per pixel
  dirEntry.writeUInt32LE(pngBuf.length, 8);
  dirEntry.writeUInt32LE(22, 12); // offset = 6 + 16

  return Buffer.concat([header, dirEntry, pngBuf]);
}

async function encodeCompactPng(sharpPipeline, maxBytes) {
  const full = await sharpPipeline.clone().png({ compressionLevel: 9, effort: 10 }).toBuffer();
  if (full.length <= maxBytes) return full;
  return sharpPipeline
    .clone()
    .png({ compressionLevel: 9, effort: 10, palette: true, quality: 90 })
    .toBuffer();
}

async function optimizeFaviconAndLogo() {
  const faviconPath = path.join(ROOT, "src", "app", "favicon.ico");
  const logoPath = path.join(ROOT, "public", "images", "logo.png");
  const icoBuf = await fs.readFile(faviconPath);
  const baseSharp = decodeIcoToSharp(icoBuf);

  await fs.mkdir(path.dirname(logoPath), { recursive: true });
  const logoBuf = await encodeCompactPng(baseSharp.clone().resize(72, 72), 7500);
  await fs.writeFile(logoPath, logoBuf);

  const favPngBuf = await baseSharp
    .clone()
    .resize(48, 48)
    .ensureAlpha()
    .png({ compressionLevel: 9, effort: 10, palette: false })
    .toBuffer();
  const newIcoBuf = buildPngIco(favPngBuf, 48);
  if (newIcoBuf.length < icoBuf.length) {
    await fs.writeFile(faviconPath, newIcoBuf);
  }

  const finalIcoStat = await fs.stat(faviconPath);
  console.log(
    `[Logo & Favicon] favicon.ico: ${formatKB(icoBuf.length)} -> ${formatKB(finalIcoStat.size)} | public/images/logo.png: ${formatKB(logoBuf.length)}`
  );
  return {
    beforeTotal: icoBuf.length,
    afterTotal: finalIcoStat.size + logoBuf.length,
  };
}

async function main() {
  let grandBefore = 0;
  let grandAfter = 0;

  // 1. App backgrounds & Dataset backgrounds (.jfif)
  const appsBgDir = path.join(ROOT, "public", "images", "apps_backgrounds");
  const datasetsBgDir = path.join(ROOT, "public", "images", "datasets_backgrounds");
  const jfifFiles = [
    ...(await walkFiles(appsBgDir)).filter((f) => f.toLowerCase().endsWith(".jfif")),
    ...(await walkFiles(datasetsBgDir)).filter((f) => f.toLowerCase().endsWith(".jfif")),
  ];
  const r1 = await optimizeBatch("Card Thumbnails (.jfif)", jfifFiles, (buf) =>
    sharp(buf)
      .resize({ width: 960, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
  );
  grandBefore += r1.beforeTotal;
  grandAfter += r1.afterTotal;

  // 2. Blog images (.jpg)
  const blogImgDir = path.join(ROOT, "public", "images", "blog");
  const blogJpgs = (await walkFiles(blogImgDir)).filter((f) =>
    /\.(jpe?g)$/i.test(f)
  );
  const r2 = await optimizeBatch("Blog Images (.jpg)", blogJpgs, (buf) =>
    sharp(buf)
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toBuffer()
  );
  grandBefore += r2.beforeTotal;
  grandAfter += r2.afterTotal;

  // 3. AI Music thumbnails (.png)
  const musicThumbDir = path.join(ROOT, "public", "art", "ai_music", "thumbnails");
  const musicThumbs = (await walkFiles(musicThumbDir)).filter((f) =>
    f.toLowerCase().endsWith(".png")
  );
  const r3 = await optimizeBatch("AI Music Thumbnails (.png)", musicThumbs, (buf) =>
    sharp(buf)
      .resize({ width: 320, height: 320, fit: "cover", withoutEnlargement: true })
      .png({ quality: 85, compressionLevel: 9, palette: true })
      .toBuffer()
  );
  grandBefore += r3.beforeTotal;
  grandAfter += r3.afterTotal;

  // 4. Large AI Art PNGs (> 1 MB)
  const aiImgDir = path.join(ROOT, "public", "art", "ai_img");
  const allAiPngs = (await walkFiles(aiImgDir)).filter((f) =>
    f.toLowerCase().endsWith(".png")
  );
  const largeAiPngs = [];
  for (const p of allAiPngs) {
    const st = await fs.stat(p);
    if (st.size > 1024 * 1024) largeAiPngs.push(p);
  }
  const r4 = await optimizeBatch("Large AI Art PNGs (>1MB)", largeAiPngs, (buf) =>
    sharp(buf)
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer()
  );
  grandBefore += r4.beforeTotal;
  grandAfter += r4.afterTotal;

  // 5. Logo & Favicon
  const r5 = await optimizeFaviconAndLogo();
  grandBefore += r5.beforeTotal;
  grandAfter += r5.afterTotal;

  console.log(
    `\nTotal Asset Footprint: ${formatMB(grandBefore)} -> ${formatMB(grandAfter)} (Saved ${formatMB(grandBefore - grandAfter)})`
  );
}

main().catch((err) => {
  console.error("Asset optimization failed:", err);
  process.exit(1);
});
