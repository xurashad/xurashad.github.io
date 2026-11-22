import katex from "katex";
import { escapeHtml, extractBalancedArg } from "./utils";

interface Point {
  x: number;
  y: number;
}

const TIKZ_COLORS: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  gray: "#64748b",
  grey: "#64748b",
  lightgray: "#cbd5e1",
  darkgray: "#334155",
  red: "#ef4444",
  crimson: "#dc143c",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  green: "#22c55e",
  olive: "#6b8f27",
  lime: "#84cc16",
  yellow: "#eab308",
  amber: "#f59e0b",
  orange: "#f97316",
  purple: "#9333ea",
  violet: "#8b5cf6",
  indigo: "#6366f1",
  magenta: "#d946ef",
  pink: "#ec4899",
  brown: "#92400e",
};

function resolveColor(opt: string): string | null {
  const clean = opt.trim().toLowerCase();
  if (TIKZ_COLORS[clean]) return TIKZ_COLORS[clean];
  if (clean.includes("!")) {
    const base = clean.split("!")[0];
    if (TIKZ_COLORS[base]) return TIKZ_COLORS[base];
  }
  if (/^#[0-9a-f]{3,8}$/i.test(clean)) return clean;
  return null;
}

interface ParsedStyle {
  stroke: string;
  fill: string;
  strokeWidth: number;
  dashArray?: string;
  opacity: number;
  arrowStart: boolean;
  arrowEnd: boolean;
  posTokens: string[];
}

function parseStyleOptions(optsRaw: string, defaultStroke = "#1e293b", defaultFill = "none"): ParsedStyle {
  const style: ParsedStyle = {
    stroke: defaultStroke,
    fill: defaultFill,
    strokeWidth: 1.5,
    opacity: 1,
    arrowStart: false,
    arrowEnd: false,
    posTokens: [],
  };
  if (!optsRaw) return style;

  const tokens = optsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  for (const tok of tokens) {
    if (tok === "->") {
      style.arrowEnd = true;
    } else if (tok === "<-") {
      style.arrowStart = true;
    } else if (tok === "<->") {
      style.arrowStart = true;
      style.arrowEnd = true;
    } else if (tok === "thick") {
      style.strokeWidth = 2.0;
    } else if (tok === "very thick") {
      style.strokeWidth = 2.8;
    } else if (tok === "ultra thick") {
      style.strokeWidth = 3.8;
    } else if (tok === "thin") {
      style.strokeWidth = 1.0;
    } else if (tok === "dashed" || tok === "densely dashed") {
      style.dashArray = "6 4";
    } else if (tok === "dotted" || tok === "densely dotted") {
      style.dashArray = "2 3";
    } else if (tok.startsWith("draw=")) {
      style.stroke = resolveColor(tok.slice(5)) ?? style.stroke;
    } else if (tok.startsWith("fill=")) {
      style.fill = resolveColor(tok.slice(5)) ?? style.fill;
    } else if (tok.startsWith("color=")) {
      const c = resolveColor(tok.slice(6));
      if (c) style.stroke = c;
    } else if (tok.startsWith("opacity=")) {
      const op = parseFloat(tok.slice(8));
      if (Number.isFinite(op)) style.opacity = op;
    } else if (tok.startsWith("line width=")) {
      const lw = parseFloat(tok.slice(11));
      if (Number.isFinite(lw)) style.strokeWidth = lw * 1.4;
    } else if (/^(above|below|left|right|above left|above right|below left|below right)$/.test(tok)) {
      style.posTokens.push(tok);
    } else {
      const c = resolveColor(tok);
      if (c) {
        if (defaultFill !== "none" && defaultStroke === "none") {
          style.fill = c;
        } else {
          style.stroke = c;
          if (defaultFill !== "none") style.fill = c;
        }
      }
    }
  }
  return style;
}

function parseLengthPt(raw: string, unitScale: number): number {
  const trimmed = raw.trim();
  const num = parseFloat(trimmed);
  if (!Number.isFinite(num)) return 4;
  if (trimmed.endsWith("pt")) return num * 1.25;
  if (trimmed.endsWith("mm")) return num * 3.5;
  if (trimmed.endsWith("cm")) return num * unitScale;
  return num * unitScale;
}

function renderNodeLabel(rawLabel: string, macros: Record<string, string>): string {
  const trimmed = rawLabel.trim();
  const parts = trimmed.split(/(\$[^$]+\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
        const tex = part.slice(1, -1);
        try {
          return katex.renderToString(tex, {
            displayMode: false,
            throwOnError: false,
            macros: { ...macros },
          });
        } catch {
          return escapeHtml(part);
        }
      }
      return escapeHtml(part);
    })
    .join("");
}

export function renderTikzToSvg(
  body: string,
  options = "",
  macros: Record<string, string> = {},
): string {
  const scaleMatch = options.match(/scale\s*=\s*([0-9.]+)/);
  const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
  const UNIT = 44 * (Number.isFinite(scale) && scale > 0 ? scale : 1);

  const coords: Record<string, Point> = {};
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const track = (x: number, y: number, pad = 6) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x - pad < minX) minX = x - pad;
    if (x + pad > maxX) maxX = x + pad;
    if (y - pad < minY) minY = y - pad;
    if (y + pad > maxY) maxY = y + pad;
  };

  const toSvg = (x: number, y: number): Point => ({ x: x * UNIT, y: -y * UNIT });

  const parseCoordToken = (
    raw: string,
    prev?: Point,
    relative = false,
  ): Point | null => {
    const inner = raw.trim();
    if (coords[inner]) return coords[inner];
    const polar = inner.match(/^(-?[0-9.]+)\s*:\s*(-?[0-9.]+)$/);
    if (polar) {
      const deg = parseFloat(polar[1]);
      const r = parseFloat(polar[2]);
      const rad = (deg * Math.PI) / 180;
      const p = toSvg(r * Math.cos(rad), r * Math.sin(rad));
      return prev && relative ? { x: prev.x + p.x, y: prev.y + p.y } : p;
    }
    const cart = inner.match(/^(-?[0-9.]+)\s*,\s*(-?[0-9.]+)$/);
    if (cart) {
      const p = toSvg(parseFloat(cart[1]), parseFloat(cart[2]));
      return prev && relative ? { x: prev.x + p.x, y: prev.y + p.y } : p;
    }
    return null;
  };

  // Strip comments and split into semicolon-terminated statements
  const cleaned = body
    .split("\n")
    .map((line) => line.replace(/(^|[^\\])%.*$/, "$1"))
    .join(" ");

  const statements: string[] = [];
  let braceDepth = 0;
  let stmtStart = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === "{") braceDepth++;
    else if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
    else if (ch === ";" && braceDepth === 0) {
      const s = cleaned.slice(stmtStart, i).trim();
      if (s) statements.push(s);
      stmtStart = i + 1;
    }
  }

  const shapes: string[] = [];
  const labelOverlays: Array<{ x: number; y: number; pos: string[]; html: string }> = [];
  const usedColors = new Set<string>();

  const markerIdFor = (color: string) => {
    usedColors.add(color);
    return `wt-arrow-${color.replace(/[^a-zA-Z0-9]/g, "")}`;
  };

  for (const stmt of statements) {
    // \coordinate (name) at (x,y)
    const coordMatch = stmt.match(/^\\coordinate\s*\(([^)]+)\)\s*at\s*\(([^)]+)\)/);
    if (coordMatch) {
      const pt = parseCoordToken(coordMatch[2]);
      if (pt) {
        coords[coordMatch[1].trim()] = pt;
        track(pt.x, pt.y);
      }
      continue;
    }

    // \node[opts] (name)? at (x,y) {label}
    if (stmt.startsWith("\\node")) {
      let idx = 5;
      let optsRaw = "";
      if (stmt[idx] === "[") {
        const res = extractBalancedArg(stmt, idx, "[", "]");
        if (res) {
          optsRaw = res.content;
          idx = res.endIdx;
        }
      }
      const rest = stmt.slice(idx);
      const nameAndAt = rest.match(/^(?:\(([^)]+)\)\s*)?at\s*\(([^)]+)\)\s*/);
      if (nameAndAt) {
        const pt = parseCoordToken(nameAndAt[2]);
        const labelArg = extractBalancedArg(rest, nameAndAt[0].length, "{", "}");
        if (pt && labelArg) {
          if (nameAndAt[1]) coords[nameAndAt[1].trim()] = pt;
          const style = parseStyleOptions(optsRaw);
          track(pt.x, pt.y, 26);
          labelOverlays.push({
            x: pt.x,
            y: pt.y,
            pos: style.posTokens,
            html: renderNodeLabel(labelArg.content, macros),
          });
        }
      }
      continue;
    }

    // Drawing commands: \draw, \fill, \filldraw, \path, \shade
    const cmdMatch = stmt.match(/^\\(draw|filldraw|fill|shade|path)\b/);
    if (!cmdMatch) continue;
    const cmd = cmdMatch[1];
    let idx = cmdMatch[0].length;
    while (idx < stmt.length && /\s/.test(stmt[idx])) idx++;
    let optsRaw = "";
    if (stmt[idx] === "[") {
      const res = extractBalancedArg(stmt, idx, "[", "]");
      if (res) {
        optsRaw = res.content;
        idx = res.endIdx;
      }
    }

    const defaultStroke = cmd === "fill" || cmd === "shade" ? "none" : "#1e293b";
    const defaultFill = cmd === "fill" || cmd === "filldraw" || cmd === "shade" ? "#6366f1" : "none";
    const style = parseStyleOptions(optsRaw, defaultStroke, defaultFill);

    const pathExpr = stmt.slice(idx).trim();
    let p = 0;
    let lastPt: Point | undefined;
    let dParts: string[] = [];

    const readParen = (): { content: string; relative: boolean } | null => {
      while (p < pathExpr.length && /\s/.test(pathExpr[p])) p++;
      let relative = false;
      if (pathExpr[p] === "+" && pathExpr[p + 1] === "+" && pathExpr[p + 2] === "(") {
        p += 2;
        relative = true;
      } else if (pathExpr[p] === "+" && pathExpr[p + 1] === "(") {
        p += 1;
        relative = true;
      }
      if (pathExpr[p] !== "(") return null;
      const close = pathExpr.indexOf(")", p + 1);
      if (close === -1) return null;
      const content = pathExpr.slice(p + 1, close);
      p = close + 1;
      return { content, relative };
    };

    const markerStart =
      style.arrowStart && style.stroke !== "none"
        ? ` marker-start="url(#${markerIdFor(style.stroke)})"`
        : "";
    const markerEnd =
      style.arrowEnd && style.stroke !== "none"
        ? ` marker-end="url(#${markerIdFor(style.stroke)})"`
        : "";

    const flushPath = () => {
      if (dParts.length === 0) return;
      const attrs = [
        `d="${dParts.join(" ")}"`,
        `stroke="${escapeHtml(style.stroke)}"`,
        `fill="${escapeHtml(style.fill)}"`,
        `stroke-width="${style.strokeWidth}"`,
        `stroke-linecap="round"`,
        `stroke-linejoin="round"`,
        style.dashArray ? `stroke-dasharray="${style.dashArray}"` : "",
        style.opacity < 1 ? `opacity="${style.opacity}"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      shapes.push(`<path ${attrs}${markerStart}${markerEnd} />`);
      dParts = [];
    };

    const startRaw = readParen();
    if (!startRaw) continue;
    const startPt = parseCoordToken(startRaw.content);
    if (!startPt) continue;
    lastPt = startPt;
    track(startPt.x, startPt.y);
    dParts.push(`M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)}`);

    while (p < pathExpr.length) {
      while (p < pathExpr.length && /\s/.test(pathExpr[p])) p++;
      if (p >= pathExpr.length) break;

      if (pathExpr.startsWith("--", p)) {
        p += 2;
        while (p < pathExpr.length && /\s/.test(pathExpr[p])) p++;
        if (pathExpr.startsWith("cycle", p)) {
          p += 5;
          dParts.push("Z");
          continue;
        }
        const nextRaw = readParen();
        if (nextRaw) {
          const nextPt = parseCoordToken(nextRaw.content, lastPt, nextRaw.relative);
          if (nextPt) {
            track(nextPt.x, nextPt.y);
            dParts.push(`L ${nextPt.x.toFixed(1)} ${nextPt.y.toFixed(1)}`);
            lastPt = nextPt;
            continue;
          }
        }
      } else if (pathExpr.startsWith(".. controls", p)) {
        p += 11;
        const c1Raw = readParen();
        while (p < pathExpr.length && /\s/.test(pathExpr[p])) p++;
        let c2Raw: { content: string; relative: boolean } | null = null;
        if (pathExpr.startsWith("and", p)) {
          p += 3;
          c2Raw = readParen();
        }
        while (p < pathExpr.length && /\s/.test(pathExpr[p])) p++;
        if (pathExpr.startsWith("..", p)) p += 2;
        const endRaw = readParen();
        if (c1Raw && endRaw) {
          const c1 = parseCoordToken(c1Raw.content, lastPt, c1Raw.relative);
          const c2 = c2Raw ? parseCoordToken(c2Raw.content, lastPt, c2Raw.relative) : c1;
          const end = parseCoordToken(endRaw.content, lastPt, endRaw.relative);
          if (c1 && c2 && end) {
            track(c1.x, c1.y);
            track(c2.x, c2.y);
            track(end.x, end.y);
            dParts.push(
              `C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
            );
            lastPt = end;
            continue;
          }
        }
      } else if (pathExpr.startsWith("to", p)) {
        p += 2;
        while (p < pathExpr.length && /\s/.test(pathExpr[p])) p++;
        let bendDeg = 0;
        if (pathExpr[p] === "[") {
          const toOpts = extractBalancedArg(pathExpr, p, "[", "]");
          if (toOpts) {
            const bl = toOpts.content.match(/bend left(?:=([0-9.]+))?/);
            const br = toOpts.content.match(/bend right(?:=([0-9.]+))?/);
            if (bl) bendDeg = -(parseFloat(bl[1] || "28") || 28);
            else if (br) bendDeg = parseFloat(br[1] || "28") || 28;
            p = toOpts.endIdx;
          }
        }
        const nextRaw = readParen();
        if (nextRaw && lastPt) {
          const nextPt = parseCoordToken(nextRaw.content, lastPt, nextRaw.relative);
          if (nextPt) {
            track(nextPt.x, nextPt.y);
            if (bendDeg !== 0) {
              const mx = (lastPt.x + nextPt.x) / 2;
              const my = (lastPt.y + nextPt.y) / 2;
              const dx = nextPt.x - lastPt.x;
              const dy = nextPt.y - lastPt.y;
              const factor = Math.tan(((bendDeg * Math.PI) / 180) * 0.5);
              const cx = mx - dy * factor;
              const cy = my + dx * factor;
              track(cx, cy);
              dParts.push(`Q ${cx.toFixed(1)} ${cy.toFixed(1)}, ${nextPt.x.toFixed(1)} ${nextPt.y.toFixed(1)}`);
            } else {
              dParts.push(`L ${nextPt.x.toFixed(1)} ${nextPt.y.toFixed(1)}`);
            }
            lastPt = nextPt;
            continue;
          }
        }
      } else if (pathExpr.startsWith("arc", p)) {
        p += 3;
        const arcRaw = readParen();
        if (arcRaw && lastPt) {
          const parts = arcRaw.content.split(":").map((s) => parseFloat(s.trim()));
          if (parts.length >= 3 && parts.every(Number.isFinite)) {
            const [a1, a2, radUnits] = parts;
            const rPx = radUnits * UNIT;
            const r1 = (a1 * Math.PI) / 180;
            const r2 = (a2 * Math.PI) / 180;
            const cx: number = lastPt.x - rPx * Math.cos(r1);
            const cy: number = lastPt.y + rPx * Math.sin(r1);
            const ex: number = cx + rPx * Math.cos(r2);
            const ey: number = cy - rPx * Math.sin(r2);
            const largeArc = Math.abs(a2 - a1) > 180 ? 1 : 0;
            const sweep = a2 > a1 ? 0 : 1;
            track(ex, ey);
            dParts.push(`A ${rPx.toFixed(1)} ${rPx.toFixed(1)} 0 ${largeArc} ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
            lastPt = { x: ex, y: ey };
          }
        }
        continue;
      } else if (pathExpr.startsWith("circle", p)) {
        p += 6;
        dParts = [];
        let rVal = 4;
        const radBracket = pathExpr.slice(p).match(/^\s*\[[^\]]*radius\s*=\s*([^\],\]]+)/);
        if (radBracket) {
          rVal = parseLengthPt(radBracket[1], UNIT);
          p += radBracket[0].length + 1;
        } else {
          const radParen = readParen();
          if (radParen) rVal = parseLengthPt(radParen.content, UNIT);
        }
        if (lastPt) {
          track(lastPt.x - rVal, lastPt.y - rVal);
          track(lastPt.x + rVal, lastPt.y + rVal);
          shapes.push(
            `<circle cx="${lastPt.x.toFixed(1)}" cy="${lastPt.y.toFixed(1)}" r="${rVal.toFixed(1)}" stroke="${escapeHtml(style.stroke)}" fill="${escapeHtml(style.fill)}" stroke-width="${style.strokeWidth}" ${style.dashArray ? `stroke-dasharray="${style.dashArray}"` : ""} />`,
          );
        }
        continue;
      } else if (pathExpr.startsWith("ellipse", p)) {
        p += 7;
        dParts = [];
        const eRaw = readParen();
        if (eRaw && lastPt) {
          const parts = eRaw.content.split(/\band\b|,/);
          const rx = parseLengthPt(parts[0] || "1", UNIT);
          const ry = parseLengthPt(parts[1] || parts[0] || "1", UNIT);
          track(lastPt.x - rx, lastPt.y - ry);
          track(lastPt.x + rx, lastPt.y + ry);
          shapes.push(
            `<ellipse cx="${lastPt.x.toFixed(1)}" cy="${lastPt.y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" stroke="${escapeHtml(style.stroke)}" fill="${escapeHtml(style.fill)}" stroke-width="${style.strokeWidth}" />`,
          );
        }
        continue;
      } else if (pathExpr.startsWith("rectangle", p)) {
        p += 9;
        dParts = [];
        const endRaw = readParen();
        if (endRaw && lastPt) {
          const endPt = parseCoordToken(endRaw.content, lastPt, endRaw.relative);
          if (endPt) {
            track(endPt.x, endPt.y);
            const rx = Math.min(lastPt.x, endPt.x);
            const ry = Math.min(lastPt.y, endPt.y);
            const rw = Math.abs(endPt.x - lastPt.x);
            const rh = Math.abs(endPt.y - lastPt.y);
            shapes.push(
              `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" stroke="${escapeHtml(style.stroke)}" fill="${escapeHtml(style.fill)}" stroke-width="${style.strokeWidth}" />`,
            );
            lastPt = endPt;
          }
        }
        continue;
      } else if (pathExpr.startsWith("grid", p)) {
        p += 4;
        dParts = [];
        const endRaw = readParen();
        if (endRaw && lastPt) {
          const endPt = parseCoordToken(endRaw.content, lastPt, endRaw.relative);
          if (endPt) {
            track(endPt.x, endPt.y);
            const x0 = Math.min(lastPt.x, endPt.x);
            const x1 = Math.max(lastPt.x, endPt.x);
            const y0 = Math.min(lastPt.y, endPt.y);
            const y1 = Math.max(lastPt.y, endPt.y);
            for (let gx = x0; gx <= x1 + 0.5; gx += UNIT) {
              shapes.push(`<line x1="${gx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${gx.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#cbd5e1" stroke-width="0.7" />`);
            }
            for (let gy = y0; gy <= y1 + 0.5; gy += UNIT) {
              shapes.push(`<line x1="${x0.toFixed(1)}" y1="${gy.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${gy.toFixed(1)}" stroke="#cbd5e1" stroke-width="0.7" />`);
            }
          }
        }
        continue;
      } else if (pathExpr.startsWith("node", p)) {
        p += 4;
        while (p < pathExpr.length && /\s/.test(pathExpr[p])) p++;
        let nOpts = "";
        if (pathExpr[p] === "[") {
          const res = extractBalancedArg(pathExpr, p, "[", "]");
          if (res) {
            nOpts = res.content;
            p = res.endIdx;
          }
        }
        const labelArg = extractBalancedArg(pathExpr, p, "{", "}");
        if (labelArg && lastPt) {
          p = labelArg.endIdx;
          const nStyle = parseStyleOptions(nOpts);
          track(lastPt.x, lastPt.y, 26);
          labelOverlays.push({
            x: lastPt.x,
            y: lastPt.y,
            pos: nStyle.posTokens,
            html: renderNodeLabel(labelArg.content, macros),
          });
          continue;
        }
      }
      // Advance safely if unrecognized token appears
      p++;
    }

    flushPath();
  }

  if (!Number.isFinite(minX)) {
    minX = -80;
    maxX = 80;
    minY = -60;
    maxY = 60;
  }

  const pad = 26;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = Math.max(120, maxX - minX + pad * 2);
  const vbH = Math.max(80, maxY - minY + pad * 2);

  const defs = Array.from(usedColors)
    .map((color) => {
      const id = `wt-arrow-${color.replace(/[^a-zA-Z0-9]/g, "")}`;
      return `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="${escapeHtml(color)}" />
      </marker>`;
    })
    .join("");

  const foreignLabels = labelOverlays
    .map((lbl) => {
      let dx = 0;
      let dy = 0;
      const joined = lbl.pos.join(" ");
      if (joined.includes("above")) dy -= 14;
      if (joined.includes("below")) dy += 14;
      if (joined.includes("left")) dx -= 14;
      if (joined.includes("right")) dx += 14;
      const lx = lbl.x + dx;
      const ly = lbl.y + dy;
      return `<foreignObject x="${(lx - 75).toFixed(1)}" y="${(ly - 16).toFixed(1)}" width="150" height="32" style="overflow:visible;pointer-events:none;">
        <div xmlns="http://www.w3.org/1999/xhtml" class="wt-tikz-node-label">${lbl.html}</div>
      </foreignObject>`;
    })
    .join("\n");

  return `<div class="wt-tikz-wrap">
    <svg class="wt-tikz-svg" viewBox="${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}" width="${Math.min(540, Math.round(vbW))}" xmlns="http://www.w3.org/2000/svg">
      ${defs ? `<defs>${defs}</defs>` : ""}
      ${shapes.join("\n")}
      ${foreignLabels}
    </svg>
  </div>`;
}
