import { escapeHtml } from "./utils";

export interface DiagramResult {
  svg: string;
  error?: string;
}

const PALETTE = [
  "#00c3f5",
  "#9333ea",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#38bdf8",
  "#a855f7",
];

type NodeShape = "rect" | "round" | "diamond" | "stadium" | "circle" | "cylinder";

interface FlowNode {
  id: string;
  label: string;
  shape: NodeShape;
  layer: number;
  order: number;
}

interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  dashed: boolean;
  thick: boolean;
  arrow: boolean;
}

function parseNodeToken(raw: string): { id: string; label: string; shape: NodeShape } | null {
  const s = raw.trim();
  if (!s) return null;

  const patterns: Array<{ re: RegExp; shape: NodeShape }> = [
    { re: /^([A-Za-z0-9_.-]+)\(\((.+)\)\)$/, shape: "circle" },
    { re: /^([A-Za-z0-9_.-]+)\(\[(.+)\]\)$/, shape: "stadium" },
    { re: /^([A-Za-z0-9_.-]+)\[\((.+)\)\]$/, shape: "cylinder" },
    { re: /^([A-Za-z0-9_.-]+)\{(.+)\}$/, shape: "diamond" },
    { re: /^([A-Za-z0-9_.-]+)\((.+)\)$/, shape: "round" },
    { re: /^([A-Za-z0-9_.-]+)\[(.+)\]$/, shape: "rect" },
    { re: /^([A-Za-z0-9_.-]+)$/, shape: "rect" },
  ];

  for (const { re, shape } of patterns) {
    const m = s.match(re);
    if (m) {
      const id = m[1];
      const rawLabel = m[2] ?? id;
      const label = rawLabel.replace(/^["']|["']$/g, "").trim() || id;
      return { id, label, shape };
    }
  }
  return null;
}

function renderFlowchart(lines: string[]): DiagramResult {
  const header = lines[0]?.trim() ?? "flowchart TD";
  const dirMatch = header.match(/\b(TD|TB|BT|LR|RL)\b/i);
  const dir = (dirMatch?.[1] ?? "TD").toUpperCase();
  const isHorizontal = dir === "LR" || dir === "RL";
  const isReversed = dir === "BT" || dir === "RL";

  const nodesMap = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];

  const ensureNode = (token: string) => {
    const parsed = parseNodeToken(token);
    if (!parsed) return null;
    const existing = nodesMap.get(parsed.id);
    if (!existing) {
      nodesMap.set(parsed.id, { ...parsed, layer: 0, order: nodesMap.size });
    } else if (parsed.label !== parsed.id || parsed.shape !== "rect") {
      existing.label = parsed.label;
      existing.shape = parsed.shape;
    }
    return parsed.id;
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      !line ||
      line.startsWith("%%") ||
      line.startsWith("style ") ||
      line.startsWith("classDef ") ||
      line.startsWith("class ") ||
      line.startsWith("subgraph ") ||
      line === "end"
    ) {
      continue;
    }

    const cleanLine = line.replace(/;$/, "");
    // Split chained edges e.g. A --> B --> C
    const edgeRe =
      /(.+?)\s*(--\|([^|]+)\|->|-\.->|-\.-|==>|--\s+([^->]+?)\s+-->|-->|---)\s*(.+)/;
    const m = cleanLine.match(edgeRe);
    if (m) {
      const leftStr = m[1].trim();
      const op = m[2].trim();
      const inlineLabel = (m[3] || m[4] || "").trim();
      let rightStr = m[5].trim();
      let pipeLabel = inlineLabel;

      // Also check |label| right after operator e.g. A -->|Yes| B
      if (rightStr.startsWith("|")) {
        const endPipe = rightStr.indexOf("|", 1);
        if (endPipe !== -1) {
          pipeLabel = rightStr.slice(1, endPipe).trim();
          rightStr = rightStr.slice(endPipe + 1).trim();
        }
      }

      const fromId = ensureNode(leftStr);
      const toId = ensureNode(rightStr);
      if (fromId && toId) {
        edges.push({
          from: fromId,
          to: toId,
          label: pipeLabel || undefined,
          dashed: op.includes("."),
          thick: op.includes("="),
          arrow: op.includes(">"),
        });
      }
    } else {
      ensureNode(cleanLine);
    }
  }

  const nodes = Array.from(nodesMap.values());
  if (nodes.length === 0) {
    return { svg: "", error: "No flowchart nodes detected." };
  }

  // Assign topological layers with cycle cap
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }
  for (const e of edges) {
    adj.get(e.from)?.push(e.to);
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const node of nodes) {
    if ((inDegree.get(node.id) ?? 0) === 0) queue.push(node.id);
  }
  if (queue.length === 0) queue.push(nodes[0].id);

  const visited = new Set<string>();
  let guard = 0;
  while (queue.length > 0 && guard < 2000) {
    guard++;
    const curr = queue.shift()!;
    visited.add(curr);
    const currNode = nodesMap.get(curr)!;
    for (const nxt of adj.get(curr) ?? []) {
      const nxtNode = nodesMap.get(nxt);
      if (!nxtNode) continue;
      if (nxtNode.layer <= currNode.layer && nxt !== curr) {
        nxtNode.layer = Math.min(nodes.length + 2, currNode.layer + 1);
      }
      if (!visited.has(nxt)) {
        queue.push(nxt);
      }
    }
  }

  const maxLayer = Math.max(0, ...nodes.map((n) => n.layer));
  if (isReversed) {
    for (const node of nodes) {
      node.layer = maxLayer - node.layer;
    }
  }

  // Group by layer
  const layers = new Map<number, FlowNode[]>();
  for (const node of nodes) {
    const arr = layers.get(node.layer) ?? [];
    arr.push(node);
    layers.set(node.layer, arr);
  }

  const layerNums = Array.from(layers.keys()).sort((a, b) => a - b);
  const maxPerLayer = Math.max(1, ...Array.from(layers.values()).map((a) => a.length));

  const nodeW = 152;
  const nodeH = 46;
  const gapX = isHorizontal ? 76 : 44;
  const gapY = isHorizontal ? 34 : 64;
  const pad = 30;

  const coords = new Map<string, { x: number; y: number; w: number; h: number }>();

  const totalSpan = maxPerLayer * (isHorizontal ? nodeH + gapY : nodeW + gapX) - (isHorizontal ? gapY : gapX);
  for (const lIdx of layerNums) {
    const row = layers.get(lIdx) ?? [];
    const rowSpan = row.length * (isHorizontal ? nodeH + gapY : nodeW + gapX) - (isHorizontal ? gapY : gapX);
    const offset = (totalSpan - rowSpan) / 2;

    row.forEach((node, idx) => {
      const w = Math.max(nodeW, Math.min(230, node.label.length * 8.2 + 34));
      const h = node.shape === "diamond" ? 64 : nodeH;
      if (isHorizontal) {
        const x = pad + lIdx * (nodeW + gapX);
        const y = pad + offset + idx * (nodeH + gapY);
        coords.set(node.id, { x, y, w, h });
      } else {
        const x = pad + offset + idx * (nodeW + gapX) - (w - nodeW) / 2;
        const y = pad + lIdx * (nodeH + gapY);
        coords.set(node.id, { x, y, w, h });
      }
    });
  }

  let maxX = 320;
  let maxY = 180;
  for (const c of coords.values()) {
    maxX = Math.max(maxX, c.x + c.w + pad);
    maxY = Math.max(maxY, c.y + c.h + pad);
  }

  const edgeSvg: string[] = [];
  for (const e of edges) {
    const a = coords.get(e.from);
    const b = coords.get(e.to);
    if (!a || !b) continue;

    let x1: number;
    let y1: number;
    let x2: number;
    let y2: number;

    if (isHorizontal) {
      const forward = b.x >= a.x;
      x1 = forward ? a.x + a.w : a.x;
      y1 = a.y + a.h / 2;
      x2 = forward ? b.x : b.x + b.w;
      y2 = b.y + b.h / 2;
    } else {
      const forward = b.y >= a.y;
      x1 = a.x + a.w / 2;
      y1 = forward ? a.y + a.h : a.y;
      x2 = b.x + b.w / 2;
      y2 = forward ? b.y : b.y + b.h;
    }

    const cx1 = isHorizontal ? (x1 + x2) / 2 : x1;
    const cy1 = isHorizontal ? y1 : (y1 + y2) / 2;
    const cx2 = isHorizontal ? (x1 + x2) / 2 : x2;
    const cy2 = isHorizontal ? y2 : (y1 + y2) / 2;

    const dashAttr = e.dashed ? `stroke-dasharray="5 4"` : "";
    const strokeW = e.thick ? "2.8" : "1.8";
    const marker = e.arrow ? `marker-end="url(#md-mmd-arrow)"` : "";

    edgeSvg.push(
      `<path d="M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}" fill="none" stroke="var(--md-mmd-edge, #6366f1)" stroke-width="${strokeW}" ${dashAttr} ${marker} />`,
    );

    if (e.label) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const lw = Math.max(38, e.label.length * 7.2 + 16);
      edgeSvg.push(
        `<rect x="${mx - lw / 2}" y="${my - 11}" width="${lw}" height="22" rx="6" fill="var(--md-mmd-label-bg, #0f172a)" stroke="var(--md-mmd-edge, #6366f1)" stroke-width="1" />`,
      );
      edgeSvg.push(
        `<text x="${mx}" y="${my + 4}" text-anchor="middle" font-size="11.5" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #e2e8f0)">${escapeHtml(e.label)}</text>`,
      );
    }
  }

  const nodeSvg: string[] = [];
  for (const node of nodes) {
    const c = coords.get(node.id);
    if (!c) continue;
    const { x, y, w, h } = c;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const fill = "var(--md-mmd-node-bg, rgba(30, 41, 59, 0.92))";
    const stroke = "var(--md-mmd-node-border, #38bdf8)";

    if (node.shape === "diamond") {
      nodeSvg.push(
        `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="1.8" />`,
      );
    } else if (node.shape === "circle") {
      const r = Math.max(24, Math.min(w, h) / 2 + 4);
      nodeSvg.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.8" />`,
      );
    } else if (node.shape === "cylinder") {
      nodeSvg.push(
        `<rect x="${x}" y="${y + 6}" width="${w}" height="${h - 8}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.8" />` +
          `<ellipse cx="${cx}" cy="${y + 8}" rx="${w / 2}" ry="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`,
      );
    } else {
      const rx = node.shape === "stadium" ? h / 2 : node.shape === "round" ? 14 : 6;
      nodeSvg.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.8" />`,
      );
    }

    nodeSvg.push(
      `<text x="${cx}" y="${cy + 4.5}" text-anchor="middle" font-size="13" font-weight="600" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #f8fafc)">${escapeHtml(node.label)}</text>`,
    );
  }

  const svg = `<svg viewBox="0 0 ${Math.ceil(maxX)} ${Math.ceil(maxY)}" width="100%" style="max-width:${Math.ceil(maxX)}px;height:auto;" role="img" aria-label="Flowchart diagram" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="md-mmd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--md-mmd-edge, #6366f1)" />
      </marker>
    </defs>
    ${edgeSvg.join("\n")}
    ${nodeSvg.join("\n")}
  </svg>`;

  return { svg };
}

function renderSequenceDiagram(lines: string[]): DiagramResult {
  const actors: string[] = [];
  const messages: Array<{ from: string; to: string; text: string; dashed: boolean }> = [];
  const notes: Array<{ actor: string; text: string }> = [];

  const addActor = (name: string) => {
    const clean = name.trim();
    if (clean && !actors.includes(clean)) actors.push(clean);
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("%%")) continue;

    const partM = line.match(/^(?:participant|actor)\s+(.+?)(?:\s+as\s+(.+))?$/i);
    if (partM) {
      addActor(partM[2] || partM[1]);
      continue;
    }

    const noteM = line.match(/^Note\s+(?:over|right of|left of)\s+([^:]+):\s*(.+)$/i);
    if (noteM) {
      const target = noteM[1].split(",")[0].trim();
      addActor(target);
      notes.push({ actor: target, text: noteM[2].trim() });
      continue;
    }

    const msgM = line.match(/^(.+?)\s*(-->>|->>|-->|->)\s*([^:]+):\s*(.*)$/);
    if (msgM) {
      const from = msgM[1].trim();
      const arrow = msgM[2];
      const to = msgM[3].trim();
      const text = msgM[4].trim();
      addActor(from);
      addActor(to);
      messages.push({ from, to, text, dashed: arrow.startsWith("--") });
    }
  }

  if (actors.length === 0) {
    return { svg: "", error: "No sequence participants or messages found." };
  }

  const colW = 165;
  const padX = 48;
  const topY = 26;
  const boxH = 38;
  const rowStep = 50;
  const rowsCount = Math.max(1, messages.length + notes.length);
  const width = Math.max(380, padX * 2 + (actors.length - 1) * colW + 130);
  const lifelineStart = topY + boxH;
  const lifelineEnd = lifelineStart + rowsCount * rowStep + 26;
  const height = lifelineEnd + 58;

  const actorX = new Map<string, number>();
  actors.forEach((a, idx) => {
    actorX.set(a, padX + 65 + idx * colW);
  });

  const parts: string[] = [];

  for (const a of actors) {
    const cx = actorX.get(a)!;
    const bw = Math.max(96, Math.min(148, a.length * 8 + 26));
    parts.push(
      `<rect x="${cx - bw / 2}" y="${topY}" width="${bw}" height="${boxH}" rx="8" fill="var(--md-mmd-node-bg, rgba(30,41,59,0.92))" stroke="var(--md-mmd-node-border, #38bdf8)" stroke-width="1.6" />`,
      `<text x="${cx}" y="${topY + 23}" text-anchor="middle" font-size="13" font-weight="600" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #f8fafc)">${escapeHtml(a)}</text>`,
      `<line x1="${cx}" y1="${lifelineStart}" x2="${cx}" y2="${lifelineEnd}" stroke="var(--md-mmd-edge, #6366f1)" stroke-width="1.4" stroke-dasharray="5 5" opacity="0.7" />`,
      `<rect x="${cx - bw / 2}" y="${lifelineEnd}" width="${bw}" height="${boxH}" rx="8" fill="var(--md-mmd-node-bg, rgba(30,41,59,0.92))" stroke="var(--md-mmd-node-border, #38bdf8)" stroke-width="1.6" />`,
      `<text x="${cx}" y="${lifelineEnd + 23}" text-anchor="middle" font-size="13" font-weight="600" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #f8fafc)">${escapeHtml(a)}</text>`,
    );
  }

  let rowIdx = 0;
  for (const m of messages) {
    rowIdx++;
    const y = lifelineStart + rowIdx * rowStep - 12;
    const x1 = actorX.get(m.from)!;
    const x2 = actorX.get(m.to)!;
    const dash = m.dashed ? `stroke-dasharray="5 4"` : "";

    if (m.from === m.to) {
      parts.push(
        `<path d="M ${x1} ${y - 10} C ${x1 + 52} ${y - 10}, ${x1 + 52} ${y + 12}, ${x1 + 4} ${y + 12}" fill="none" stroke="var(--md-mmd-node-border, #38bdf8)" stroke-width="1.8" ${dash} marker-end="url(#md-seq-arrow)" />`,
        `<text x="${x1 + 58}" y="${y + 4}" font-size="12" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #e2e8f0)">${escapeHtml(m.text)}</text>`,
      );
    } else {
      const mx = (x1 + x2) / 2;
      parts.push(
        `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="var(--md-mmd-node-border, #38bdf8)" stroke-width="1.8" ${dash} marker-end="url(#md-seq-arrow)" />`,
        `<text x="${mx}" y="${y - 8}" text-anchor="middle" font-size="12" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #e2e8f0)">${escapeHtml(m.text)}</text>`,
      );
    }
  }

  for (const note of notes) {
    rowIdx++;
    const y = lifelineStart + rowIdx * rowStep - 24;
    const cx = actorX.get(note.actor) ?? 120;
    const nw = Math.max(120, note.text.length * 7.2 + 24);
    parts.push(
      `<rect x="${cx - nw / 2}" y="${y}" width="${nw}" height="28" rx="6" fill="rgba(245, 158, 11, 0.18)" stroke="#f59e0b" stroke-width="1.3" />`,
      `<text x="${cx}" y="${y + 18}" text-anchor="middle" font-size="11.5" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #fef3c7)">${escapeHtml(note.text)}</text>`,
    );
  }

  return {
    svg: `<svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;height:auto;" role="img" aria-label="Sequence diagram" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="md-seq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--md-mmd-node-border, #38bdf8)" />
        </marker>
      </defs>
      ${parts.join("\n")}
    </svg>`,
  };
}

function renderPieSvg(title: string, slices: Array<{ label: string; value: number }>): DiagramResult {
  const valid = slices.filter((s) => Number.isFinite(s.value) && s.value > 0);
  if (valid.length === 0) {
    return { svg: "", error: "Pie chart requires positive numeric entries." };
  }
  const total = valid.reduce((acc, s) => acc + s.value, 0);
  const cx = 135;
  const cy = title ? 155 : 135;
  const r = 96;
  const innerR = 46;
  let angle = -Math.PI / 2;

  const paths: string[] = [];
  const legend: string[] = [];

  valid.forEach((slice, idx) => {
    const color = PALETTE[idx % PALETTE.length];
    const frac = slice.value / total;
    const sweep = frac * Math.PI * 2;
    const nextAngle = angle + sweep;

    if (valid.length === 1) {
      paths.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="var(--md-mmd-label-bg, #0b0f1e)" stroke-width="2" />`,
      );
    } else {
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(nextAngle);
      const y2 = cy + r * Math.sin(nextAngle);
      const ix1 = cx + innerR * Math.cos(nextAngle);
      const iy1 = cy + innerR * Math.sin(nextAngle);
      const ix2 = cx + innerR * Math.cos(angle);
      const iy2 = cy + innerR * Math.sin(angle);
      const largeArc = sweep > Math.PI ? 1 : 0;

      paths.push(
        `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${ix1.toFixed(2)} ${iy1.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2.toFixed(2)} ${iy2.toFixed(2)} Z" fill="${color}" stroke="var(--md-mmd-label-bg, #0b0f1e)" stroke-width="2" />`,
      );
    }

    const ly = (title ? 72 : 48) + idx * 26;
    const pct = (frac * 100).toFixed(1);
    legend.push(
      `<rect x="268" y="${ly - 10}" width="12" height="12" rx="3" fill="${color}" />`,
      `<text x="288" y="${ly}" font-size="12.5" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #e2e8f0)">${escapeHtml(slice.label)} (${pct}%)</text>`,
    );

    angle = nextAngle;
  });

  const titleEl = title
    ? `<text x="260" y="28" text-anchor="middle" font-size="15" font-weight="700" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #f8fafc)">${escapeHtml(title)}</text>`
    : "";
  const height = Math.max(cy + r + 32, (title ? 72 : 48) + valid.length * 26 + 20);

  return {
    svg: `<svg viewBox="0 0 540 ${height}" width="100%" style="max-width:540px;height:auto;" role="img" aria-label="Pie chart" xmlns="http://www.w3.org/2000/svg">
      ${titleEl}
      ${paths.join("\n")}
      <circle cx="${cx}" cy="${cy}" r="${innerR - 4}" fill="var(--md-mmd-label-bg, transparent)" />
      <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12" font-weight="700" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #e2e8f0)">${total}</text>
      ${legend.join("\n")}
    </svg>`,
  };
}

function renderGantt(lines: string[]): DiagramResult {
  let title = "";
  let section = "General";
  const tasks: Array<{ name: string; section: string; dur: number; offset: number }> = [];
  let cursor = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("%%") || line.startsWith("dateFormat") || line.startsWith("axisFormat")) {
      continue;
    }
    if (line.toLowerCase().startsWith("title ")) {
      title = line.slice(6).trim();
      continue;
    }
    if (line.toLowerCase().startsWith("section ")) {
      section = line.slice(8).trim();
      continue;
    }
    const colon = line.indexOf(":");
    if (colon !== -1) {
      const name = line.slice(0, colon).trim();
      const rest = line.slice(colon + 1).trim();
      const durM = rest.match(/(\d+)\s*([dwmh])?/i);
      const dur = durM ? Math.max(1, Number.parseInt(durM[1], 10)) : 3;
      tasks.push({ name, section, dur, offset: cursor });
      cursor += Math.max(1, Math.round(dur * 0.7));
    }
  }

  if (tasks.length === 0) {
    return { svg: "", error: "No Gantt tasks found." };
  }

  const maxEnd = Math.max(10, ...tasks.map((t) => t.offset + t.dur));
  const labelW = 165;
  const chartW = 360;
  const topPad = title ? 48 : 22;
  const rowH = 30;
  const width = labelW + chartW + 30;
  const height = topPad + tasks.length * rowH + 24;

  const parts: string[] = [];
  if (title) {
    parts.push(
      `<text x="${width / 2}" y="26" text-anchor="middle" font-size="15" font-weight="700" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #f8fafc)">${escapeHtml(title)}</text>`,
    );
  }

  tasks.forEach((task, idx) => {
    const y = topPad + idx * rowH;
    const x = labelW + (task.offset / maxEnd) * chartW;
    const w = Math.max(16, (task.dur / maxEnd) * chartW);
    const color = PALETTE[idx % PALETTE.length];

    parts.push(
      `<line x1="${labelW}" y1="${y + 22}" x2="${labelW + chartW}" y2="${y + 22}" stroke="rgba(148,163,184,0.16)" stroke-width="1" />`,
      `<text x="${labelW - 10}" y="${y + 16}" text-anchor="end" font-size="12" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #e2e8f0)">${escapeHtml(task.name)}</text>`,
      `<rect x="${x.toFixed(1)}" y="${y + 3}" width="${w.toFixed(1)}" height="18" rx="5" fill="${color}" opacity="0.88" />`,
    );
  });

  return {
    svg: `<svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;height:auto;" role="img" aria-label="Gantt chart" xmlns="http://www.w3.org/2000/svg">${parts.join("\n")}</svg>`,
  };
}

export function renderMermaidToSvg(source: string): DiagramResult {
  try {
    const lines = source
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      return { svg: "", error: "Empty Mermaid block." };
    }

    const first = lines[0].trim().toLowerCase();

    if (first.startsWith("flowchart") || first.startsWith("graph")) {
      return renderFlowchart(lines);
    }

    if (first.startsWith("statediagram")) {
      const converted = [
        "flowchart LR",
        ...lines.slice(1).map((l) =>
          l
            .replace(/\[\*\]/g, "StartEnd((●))")
            .replace(/^state\s+"([^"]+)"\s+as\s+([A-Za-z0-9_]+)/i, "$2[$1]")
            .replace(/\s*:\s*(.+)$/, " -->|$1| "),
        ),
      ];
      // Clean simple StateA --> StateB : label syntax cleanly
      const stateLines = ["flowchart LR"];
      for (let i = 1; i < lines.length; i++) {
        const s = lines[i].trim();
        if (!s || s.startsWith("%%")) continue;
        const m = s.match(/^(.+?)\s*-->\s*([^:]+)(?::\s*(.+))?$/);
        if (m) {
          const from = m[1].trim() === "[*]" ? "Start((●))" : m[1].trim();
          const to = m[2].trim() === "[*]" ? "End((◎))" : m[2].trim();
          const lbl = m[3] ? `|${m[3].trim()}|` : "";
          stateLines.push(`${from} -->${lbl} ${to}`);
        }
      }
      return renderFlowchart(stateLines.length > 1 ? stateLines : converted);
    }

    if (first.startsWith("sequencediagram")) {
      return renderSequenceDiagram(lines);
    }

    if (first.startsWith("pie")) {
      let title = "";
      const titleInline = lines[0].match(/title\s+(.+)$/i);
      if (titleInline) title = titleInline[1].trim();
      const slices: Array<{ label: string; value: number }> = [];
      for (let i = 1; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l.toLowerCase().startsWith("title ")) {
          title = l.slice(6).trim();
          continue;
        }
        const m = l.match(/^"([^"]+)"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
        if (m) {
          slices.push({ label: m[1], value: Number.parseFloat(m[2]) });
        }
      }
      return renderPieSvg(title, slices);
    }

    if (first.startsWith("gantt")) {
      return renderGantt(lines);
    }

    return {
      svg: "",
      error: `Unsupported diagram header "${lines[0].trim()}". Supported: flowchart, graph, sequenceDiagram, stateDiagram, pie, gantt.`,
    };
  } catch (err) {
    return {
      svg: "",
      error: err instanceof Error ? err.message : "Failed to render Mermaid diagram.",
    };
  }
}

export function renderChartBlockToSvg(source: string): DiagramResult {
  try {
    let type: "bar" | "line" | "pie" = "bar";
    let title = "";
    let labels: string[] = [];
    let values: number[] = [];

    const trimmed = source.trim();
    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed) as {
        type?: string;
        title?: string;
        labels?: string[];
        values?: number[];
      };
      if (parsed.type === "line" || parsed.type === "pie" || parsed.type === "bar") {
        type = parsed.type;
      }
      title = parsed.title ?? "";
      labels = Array.isArray(parsed.labels) ? parsed.labels.map(String) : [];
      values = Array.isArray(parsed.values) ? parsed.values.map(Number) : [];
    } else {
      for (const line of trimmed.split("\n")) {
        const colon = line.indexOf(":");
        if (colon === -1) continue;
        const key = line.slice(0, colon).trim().toLowerCase();
        const val = line.slice(colon + 1).trim();
        if (key === "type" && (val === "bar" || val === "line" || val === "pie")) {
          type = val;
        } else if (key === "title") {
          title = val.replace(/^["']|["']$/g, "");
        } else if (key === "labels") {
          labels = val
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((s) => s.trim().replace(/^["']|["']$/g, ""))
            .filter(Boolean);
        } else if (key === "values") {
          values = val
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((s) => Number.parseFloat(s.trim()))
            .filter((n) => Number.isFinite(n));
        }
      }
    }

    if (values.length === 0) {
      return { svg: "", error: "Chart block requires numeric values." };
    }
    if (labels.length < values.length) {
      for (let i = labels.length; i < values.length; i++) {
        labels.push(`Item ${i + 1}`);
      }
    }

    if (type === "pie") {
      return renderPieSvg(
        title,
        values.map((v, i) => ({ label: labels[i], value: v })),
      );
    }

    const width = 560;
    const height = 270;
    const padL = 52;
    const padR = 24;
    const padT = title ? 46 : 24;
    const padB = 42;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    const maxVal = Math.max(1, ...values.map((v) => Math.abs(v)));

    const parts: string[] = [];
    if (title) {
      parts.push(
        `<text x="${width / 2}" y="24" text-anchor="middle" font-size="14.5" font-weight="700" font-family="system-ui, sans-serif" fill="var(--md-mmd-text, #f8fafc)">${escapeHtml(title)}</text>`,
      );
    }

    // Horizontal grid lines
    for (let g = 0; g <= 4; g++) {
      const gy = padT + (g / 4) * plotH;
      const tick = (maxVal * (1 - g / 4)).toFixed(maxVal >= 10 ? 0 : 1);
      parts.push(
        `<line x1="${padL}" y1="${gy}" x2="${padL + plotW}" y2="${gy}" stroke="rgba(148,163,184,0.18)" stroke-width="1" />`,
        `<text x="${padL - 8}" y="${gy + 4}" text-anchor="end" font-size="10.5" font-family="monospace" fill="var(--md-mmd-muted, #94a3b8)">${tick}</text>`,
      );
    }

    if (type === "bar") {
      const slot = plotW / values.length;
      const barW = Math.min(48, slot * 0.62);
      values.forEach((v, i) => {
        const bh = (Math.max(0, v) / maxVal) * plotH;
        const bx = padL + i * slot + (slot - barW) / 2;
        const by = padT + plotH - bh;
        const color = PALETTE[i % PALETTE.length];
        parts.push(
          `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" rx="5" fill="${color}" opacity="0.9" />`,
          `<text x="${(bx + barW / 2).toFixed(1)}" y="${(by - 6).toFixed(1)}" text-anchor="middle" font-size="10.5" font-family="monospace" fill="var(--md-mmd-text, #e2e8f0)">${v}</text>`,
          `<text x="${(bx + barW / 2).toFixed(1)}" y="${padT + plotH + 18}" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif" fill="var(--md-mmd-muted, #94a3b8)">${escapeHtml(labels[i])}</text>`,
        );
      });
    } else {
      const pts: Array<{ x: number; y: number; v: number; label: string }> = values.map((v, i) => ({
        x: values.length === 1 ? padL + plotW / 2 : padL + (i / (values.length - 1)) * plotW,
        y: padT + plotH - (Math.max(0, v) / maxVal) * plotH,
        v,
        label: labels[i],
      }));
      const polyPts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      const areaD = `M ${pts[0].x.toFixed(1)} ${padT + plotH} L ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} L ${pts[pts.length - 1].x.toFixed(1)} ${padT + plotH} Z`;
      parts.push(
        `<path d="${areaD}" fill="rgba(0, 195, 245, 0.14)" />`,
        `<polyline points="${polyPts}" fill="none" stroke="#00c3f5" stroke-width="2.5" stroke-linejoin="round" />`,
      );
      pts.forEach((p) => {
        parts.push(
          `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#9333ea" stroke="#00c3f5" stroke-width="2" />`,
          `<text x="${p.x.toFixed(1)}" y="${(p.y - 9).toFixed(1)}" text-anchor="middle" font-size="10.5" font-family="monospace" fill="var(--md-mmd-text, #e2e8f0)">${p.v}</text>`,
          `<text x="${p.x.toFixed(1)}" y="${padT + plotH + 18}" text-anchor="middle" font-size="11" font-family="system-ui, sans-serif" fill="var(--md-mmd-muted, #94a3b8)">${escapeHtml(p.label)}</text>`,
        );
      });
    }

    return {
      svg: `<svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;height:auto;" role="img" aria-label="Chart" xmlns="http://www.w3.org/2000/svg">${parts.join("\n")}</svg>`,
    };
  } catch (err) {
    return {
      svg: "",
      error: err instanceof Error ? err.message : "Failed to parse chart block.",
    };
  }
}
