import { ParticleType, type DiagramState, type Particle } from "./types";

const TikzStyle: Record<ParticleType, string> = {
  [ParticleType.Fermion]: "fermion",
  [ParticleType.Photon]:  "photon",
  [ParticleType.Gluon]:   "gluon",
  [ParticleType.Higgs]:   "scalar",
  [ParticleType.Ghost]:   "ghost",
  [ParticleType.Scalar]:  "plain",
  [ParticleType.WBoson]:  "boson",
  [ParticleType.ZBoson]:  "boson",
};

function particleStyle(p: Particle): string {
  const base = TikzStyle[p.type] ?? "plain";
  const reversed = p.reversed ? ", reversed=true" : "";
  return base + reversed;
}

export function generateLatex(state: DiagramState): string {
  const { vertices, particles, textLabels, ellipses, rectangles } = state;
  if (!vertices.length && !particles.length && !textLabels.length && !ellipses.length && !rectangles.length)
    return "% Empty diagram — add elements before exporting.";

  const scale = 0.04;
  const allVertices = new Map<string, { x: number; y: number }>();

  vertices.forEach(v => allVertices.set(String(v.id), { x: v.x, y: v.y }));

  const particleData = particles.map(p => {
    let startId = p.startVertex != null ? String(p.startVertex) : null;
    let endId   = p.endVertex   != null ? String(p.endVertex)   : null;
    if (!startId) { startId = `p${p.id}_s`; allVertices.set(startId, { x: p.startX, y: p.startY }); }
    if (!endId)   { endId   = `p${p.id}_e`; allVertices.set(endId,   { x: p.endX,   y: p.endY   }); }
    return { ...p, startId, endId };
  });

  const coords = (x: number, y: number) =>
    `(${(x * scale).toFixed(2)}, ${(-y * scale).toFixed(2)})`;

  const vertexDefs = Array.from(allVertices.entries())
    .map(([id, pos]) => `      \\vertex (${id}) at ${coords(pos.x, pos.y)};`)
    .join("\n");

  const vertexDots = vertices
    .map(v => `      \\filldraw[black] (${v.id}) circle (2pt);`)
    .join("\n");

  const particleLines = particleData.map(p => {
    const style = particleStyle(p);
    let bendStr = "";
    if (Math.abs(p.bend) > 1) {
      const deg = Math.round(p.bend * 0.5);
      bendStr = deg > 0 ? `, bend right=${deg}` : `, bend left=${-deg}`;
    }
    let labelStr = p.label ? `, edge label=${p.label}` : "";
    return `      (${p.startId}) -- [${style}${bendStr}${labelStr}] (${p.endId});`;
  }).join("\n");

  const textLines = textLabels
    .map(l => `      \\node at ${coords(l.x, l.y)} {${l.text}};`)
    .join("\n");

  const shapeLines = [
    ...rectangles.map(r => {
      const x1 = ((r.x - r.width  / 2) * scale).toFixed(2);
      const y1 = (-(r.y - r.height / 2) * scale).toFixed(2);
      const x2 = ((r.x + r.width  / 2) * scale).toFixed(2);
      const y2 = (-(r.y + r.height / 2) * scale).toFixed(2);
      return `    \\draw (${x1}, ${y1}) rectangle (${x2}, ${y2});`;
    }),
    ...ellipses.map(e => {
      const cx = (e.x  * scale).toFixed(2);
      const cy = (-e.y * scale).toFixed(2);
      const rx = (e.rx * scale).toFixed(2);
      if (e.rx === e.ry) return `    \\draw (${cx}, ${cy}) circle (${rx});`;
      const ry = (e.ry * scale).toFixed(2);
      return `    \\draw (${cx}, ${cy}) ellipse (${rx} and ${ry});`;
    }),
  ].join("\n");

  const preamble = [
    "\\documentclass[tikz, border=2pt]{standalone}",
    "\\usepackage{tikz-feynman}",
    "\\begin{document}",
    "\\begin{tikzpicture}",
    "  \\begin{feynman}",
  ].join("\n");

  const postamble = [
    "  \\end{feynman}",
    "\\end{tikzpicture}",
    "\\end{document}",
  ].join("\n");

  return [
    preamble,
    vertexDefs,
    textLines,
    shapeLines,
    `    \\diagram* {\n${particleLines}\n      };`,
    vertexDots,
    postamble,
  ].filter(Boolean).join("\n\n");
}

/** Serialise to minimal SVG string (for direct download) */
export function generateSVG(state: DiagramState, w = 800, h = 600): string {
  // We'll delegate SVG rendering to the live SVG on the page — this is a placeholder
  return `<!-- SVG export: use the "Copy SVG" button in the app -->`;
}
