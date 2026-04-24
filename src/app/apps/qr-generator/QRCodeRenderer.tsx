"use client";

import { useMemo, useId } from "react";
import QRCode from "qrcode";
import type { QRConfig } from "./lib/types";

function buildQRValue(config: QRConfig): string {
  switch (config.type) {
    case "URL":  return config.url || "";
    case "TEXT": return config.text || "";
    case "WIFI": {
      const { ssid, password, encryption, hidden } = config.wifi;
      const p = password ? `P:${password};` : "";
      const e = encryption ? `T:${encryption};` : "";
      const h = hidden ? `H:true;` : "";
      return `WIFI:S:${ssid};${e}${p}${h};`;
    }
    case "EMAIL": {
      const { address, subject, body } = config.email;
      const s = subject ? `?subject=${encodeURIComponent(subject)}` : "";
      const b = body ? `${s ? "&" : "?"}body=${encodeURIComponent(body)}` : "";
      return `mailto:${address}${s}${b}`;
    }
    case "VCARD": {
      const { firstName, lastName, organization, phone, email, url } = config.vCard;
      return `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName};;;\nFN:${firstName} ${lastName}\nORG:${organization || ""}\nTEL:${phone || ""}\nEMAIL:${email || ""}\nURL:${url || ""}\nEND:VCARD`;
    }
    default: return "";
  }
}

// ── Pixel path builders ────────────────────────────────────────────────────
function getPixelPath(r: number, c: number, type: string): string {
  if (type === "dot") {
    const cx = c + 0.5, cy = r + 0.5, r0 = 0.38;
    return `M ${cx},${cy} m -${r0},0 a ${r0},${r0} 0 1,0 ${r0*2},0 a ${r0},${r0} 0 1,0 -${r0*2},0`;
  }
  if (type === "rounded") return `M${c+0.2},${r} h0.6 a0.2,0.2 0 0 1 0.2,0.2 v0.6 a0.2,0.2 0 0 1 -0.2,0.2 h-0.6 a0.2,0.2 0 0 1 -0.2,-0.2 v-0.6 a0.2,0.2 0 0 1 0.2,-0.2 z`;
  if (type === "diamond") return `M${c+0.5},${r} L${c+1},${r+0.5} L${c+0.5},${r+1} L${c},${r+0.5} Z`;
  if (type === "star") return `M${c+0.5},${r} L${c+0.65},${r+0.35} L${c+1},${r+0.5} L${c+0.65},${r+0.65} L${c+0.5},${r+1} L${c+0.35},${r+0.65} L${c},${r+0.5} L${c+0.35},${r+0.35} Z`;
  if (type === "classy") return `M${c},${r} h0.8 a0.2,0.2 0 0 1 0.2,0.2 v0.8 h-0.8 a0.2,0.2 0 0 1 -0.2,-0.2 v-0.8 z`;
  if (type === "heart") return `M${c+0.5},${r+0.95} C${c+0.5},${r+0.95} ${c+0.1},${r+0.6} ${c+0.1},${r+0.35} C${c+0.1},${r+0.15} ${c+0.35},${r+0.15} ${c+0.5},${r+0.3} C${c+0.65},${r+0.15} ${c+0.9},${r+0.15} ${c+0.9},${r+0.35} C${c+0.9},${r+0.6} ${c+0.5},${r+0.95} ${c+0.5},${r+0.95} Z`;
  // square (default)
  return `M${c},${r}h1v1h-1z`;
}

function buildEyePaths(
  x: number, y: number,
  outerStyle: string,
  innerStyle: string,
  moduleCount: number
): { outer: string; inner: string } {
  let outer = "";
  if (outerStyle === "square")       outer = `M${x},${y} h7 v7 h-7 z M${x+1},${y+1} v5 h5 v-5 h-5 z`;
  else if (outerStyle === "circle")  outer = `M ${x+3.5},${y+3.5} m -3.5,0 a 3.5,3.5 0 1,0 7,0 a 3.5,3.5 0 1,0 -7,0 M ${x+3.5},${y+3.5} m -2.5,0 a 2.5,2.5 0 1,1 5,0 a 2.5,2.5 0 1,1 -5,0`;
  else if (outerStyle === "rounded") outer = `M${x+2},${y} h3 a2,2 0 0 1 2,2 v3 a2,2 0 0 1 -2,2 h-3 a2,2 0 0 1 -2,-2 v-3 a2,2 0 0 1 2,-2 z M${x+2},${y+1} h3 a1,1 0 0 1 1,1 v3 a1,1 0 0 1 -1,1 h-3 a1,1 0 0 1 -1,-1 v-3 a1,1 0 0 1 1,-1 z`;
  else /* extra-rounded */           outer = `M${x+3.5},${y} a3.5,3.5 0 0 1 3.5,3.5 a3.5,3.5 0 0 1 -3.5,3.5 a3.5,3.5 0 0 1 -3.5,-3.5 a3.5,3.5 0 0 1 3.5,-3.5 z M${x+3.5},${y+1} a2.5,2.5 0 0 1 2.5,2.5 a2.5,2.5 0 0 1 -2.5,2.5 a2.5,2.5 0 0 1 -2.5,-2.5 a2.5,2.5 0 0 1 2.5,-2.5 z`;

  const cx = x + 2;
  const cy = y + 2;
  let inner = "";
  if (innerStyle === "square")      inner = `M${cx},${cy} h3 v3 h-3 z`;
  else if (innerStyle === "circle") inner = `M ${x+3.5},${y+3.5} m -1.5,0 a 1.5,1.5 0 1,0 3,0 a 1.5,1.5 0 1,0 -3,0`;
  else if (innerStyle === "rounded") inner = `M${cx+0.5},${cy} h2 a0.5,0.5 0 0 1 0.5,0.5 v2 a0.5,0.5 0 0 1 -0.5,0.5 h-2 a0.5,0.5 0 0 1 -0.5,-0.5 v-2 a0.5,0.5 0 0 1 0.5,-0.5 z`;
  else if (innerStyle === "diamond") inner = `M${x+3.5},${y+2} L${x+5},${y+3.5} L${x+3.5},${y+5} L${x+2},${y+3.5} Z`;
  else if (innerStyle === "star") {
    const mx = x+3.5, my = y+3.5, ro = 1.5, ri = 0.6;
    inner = `M${mx},${my-ro} L${mx+ri},${my-ri} L${mx+ro},${my} L${mx+ri},${my+ri} L${mx},${my+ro} L${mx-ri},${my+ri} L${mx-ro},${my} L${mx-ri},${my-ri} Z`;
  }
  else if (innerStyle === "heart")  inner = `M${cx+1.5},${cy+2.85} C${cx+1.5},${cy+2.85} ${cx+0.3},${cy+1.8} ${cx+0.3},${cy+1.05} C${cx+0.3},${cy+0.45} ${cx+1.05},${cy+0.45} ${cx+1.5},${cy+0.9} C${cx+1.95},${cy+0.45} ${cx+2.7},${cy+0.45} ${cx+2.7},${cy+1.05} C${cx+2.7},${cy+1.8} ${cx+1.5},${cy+2.85} ${cx+1.5},${cy+2.85} Z`;

  void moduleCount; // unused but kept for symmetry
  return { outer, inner };
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  config: QRConfig;
  size?: number;
}

export function QRCodeRenderer({ config, size = 280 }: Props) {
  const uid = useId().replace(/:/g, "");
  const gradientId = `qrg-${uid}`;

  const value = useMemo(() => buildQRValue(config), [config]);

  const qrData = useMemo(() => {
    if (!value) return null;
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: config.ecLevel });
      return { modules: qr.modules, moduleCount: qr.modules.size };
    } catch {
      return null;
    }
  }, [value, config.ecLevel]);

  if (!qrData) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-black/30 border border-white/8 text-foreground/30 text-sm"
        style={{ width: size, height: size }}
      >
        {value ? "Invalid data" : "Enter content above"}
      </div>
    );
  }

  const { modules, moduleCount } = qrData;

  const isEyeZone = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= moduleCount - 7) || (r >= moduleCount - 7 && c < 7);

  // Logo clear zone
  const logoModules = new Set<string>();
  let logoX = 0, logoY = 0, logoW = 0, logoH = 0;
  if (config.logo) {
    const scale = config.logoSize || 0.2;
    logoW = moduleCount * scale;
    logoH = moduleCount * scale;
    const clearPad = config.logoPadding || 0;
    const cx = moduleCount / 2;
    logoX = cx - logoW / 2;
    logoY = cx - logoH / 2;
    const clX = logoX - clearPad, clY = logoY - clearPad;
    const clW = logoW + clearPad * 2, clH = logoH + clearPad * 2;
    for (let r = Math.floor(clY); r < Math.ceil(clY + clH); r++) {
      for (let c = Math.floor(clX); c < Math.ceil(clX + clW); c++) {
        const ix = Math.max(0, Math.min(c+1, clX+clW) - Math.max(c, clX));
        const iy = Math.max(0, Math.min(r+1, clY+clH) - Math.max(r, clY));
        if (ix > 0.05 && iy > 0.05) logoModules.add(`${r},${c}`);
      }
    }
  }

  const bodyParts: string[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules.get(r, c) && !isEyeZone(r, c) && !logoModules.has(`${r},${c}`)) {
        bodyParts.push(getPixelPath(r, c, config.pixelStyle));
      }
    }
  }

  const eyePositions: [number, number][] = [
    [0, 0],
    [moduleCount - 7, 0],
    [0, moduleCount - 7],
  ];

  const M = config.margin;
  let totalW = moduleCount + M * 2;
  let totalH = moduleCount + M * 2;
  let qrX = M, qrY = M;
  let textH = 0;
  if (config.frameStyle === "banner-top")    { textH = 5; totalH += textH; qrY += textH; }
  else if (config.frameStyle === "banner-bottom") { textH = 5; totalH += textH; }
  else if (config.frameStyle === "polaroid") { textH = 6; totalH += textH; }

  const gradient = `url(#${gradientId})`;
  const solid = config.fgColor;
  const bodyFill = config.useGradient ? gradient : solid;

  const getEyeColor = (specific?: string) => {
    if (specific) return specific;
    return config.useGradient ? gradient : solid;
  };
  const outerFill = getEyeColor(config.markerBorderColor);
  const innerFill = getEyeColor(config.markerCenterColor);

  return (
    <svg
      id="omniqr-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalW} ${totalH}`}
      width={size}
      height={size * (totalH / totalW)}
      style={{ display: "block" }}
    >
      <defs>
        {config.useGradient && (
          <linearGradient
            id={gradientId}
            x1="0%" y1="0%"
            x2={config.gradientDirection === "vertical" ? "0%" : "100%"}
            y2={config.gradientDirection === "horizontal" ? "0%" : "100%"}
          >
            <stop offset="0%" stopColor={config.gradientStart} />
            <stop offset="100%" stopColor={config.gradientEnd} />
          </linearGradient>
        )}
      </defs>

      {/* Background */}
      {!config.transparentBg && (
        <rect x="0" y="0" width="100%" height="100%" fill={config.bgColor}
          rx={config.frameStyle === "rounded" ? 3 : 0} />
      )}

      {/* Frames */}
      {config.frameStyle === "simple" && (
        <rect x={0.5} y={0.5} width={totalW-1} height={totalH-1} fill="none" stroke={config.frameColor} strokeWidth="1" rx="2" />
      )}
      {config.frameStyle === "rounded" && (
        <rect x={0.5} y={0.5} width={totalW-1} height={totalH-1} fill="none" stroke={config.frameColor} strokeWidth="1" rx="3" />
      )}
      {config.frameStyle === "bracket" && (
        <g stroke={config.frameColor} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d={`M${totalW*.2},1 L1,1 L1,${totalW*.2}`} />
          <path d={`M${totalW-(totalW*.2)},1 L${totalW-1},1 L${totalW-1},${totalW*.2}`} />
          <path d={`M1,${totalH-(totalW*.2)} L1,${totalH-1} L${totalW*.2},${totalH-1}`} />
          <path d={`M${totalW-1},${totalH-(totalW*.2)} L${totalW-1},${totalH-1} L${totalW-(totalW*.2)},${totalH-1}`} />
        </g>
      )}
      {config.frameStyle === "polaroid" && (
        <g>
          <rect x={0} y={0} width={totalW} height={totalH} fill={config.frameColor} />
          <text x={totalW/2} y={totalH-(textH/2)+0.5} textAnchor="middle" dominantBaseline="middle" fill={config.frameTextColor} fontSize="3.5" fontFamily="sans-serif" fontWeight="bold">
            {config.frameText}
          </text>
        </g>
      )}
      {config.frameStyle === "banner-bottom" && (
        <g>
          <rect x={totalW*.1} y={totalH-textH} width={totalW*.8} height={textH-1} fill={config.frameColor} rx="1" />
          <text x={totalW/2} y={totalH-(textH/2)+0.5} textAnchor="middle" dominantBaseline="middle" fill={config.frameTextColor} fontSize="3" fontFamily="sans-serif" fontWeight="bold">
            {config.frameText}
          </text>
        </g>
      )}
      {config.frameStyle === "banner-top" && (
        <g>
          <rect x={totalW*.1} y={1} width={totalW*.8} height={textH-1} fill={config.frameColor} rx="1" />
          <text x={totalW/2} y={1+(textH/2)+0.5} textAnchor="middle" dominantBaseline="middle" fill={config.frameTextColor} fontSize="3" fontFamily="sans-serif" fontWeight="bold">
            {config.frameText}
          </text>
        </g>
      )}

      {/* QR body */}
      <g transform={`translate(${qrX},${qrY})`}>
        <path d={bodyParts.join(" ")} fill={bodyFill} />
        {eyePositions.map(([ex, ey], i) => {
          const { outer, inner } = buildEyePaths(ey, ex, config.markerStyle, config.markerInnerShape, moduleCount);
          return (
            <g key={i}>
              <path d={outer} fill={outerFill} />
              <path d={inner} fill={innerFill} />
            </g>
          );
        })}
        {config.logo && (
          <g>
            {config.logoBackgroundColor && (
              <rect
                x={logoX - (config.logoPadding || 0)}
                y={logoY - (config.logoPadding || 0)}
                width={logoW + (config.logoPadding || 0) * 2}
                height={logoH + (config.logoPadding || 0) * 2}
                fill={config.logoBackgroundColor}
                rx={logoW * 0.1}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
            <image href={config.logo} x={logoX} y={logoY} width={logoW} height={logoH} />
          </g>
        )}
      </g>
    </svg>
  );
}
