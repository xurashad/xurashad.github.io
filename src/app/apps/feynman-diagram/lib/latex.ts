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

/** Translates Unicode physics symbols to robust standard LaTeX math macros */
function formatLatexMath(raw: string): string {
  let s = raw;
  // Specific multi-char particles first
  s = s.replace(/ν̄ₑ/g, "\\bar{\\nu}_{e}");
  s = s.replace(/ν̄/g, "\\bar{\\nu}");
  s = s.replace(/νₑ/g, "\\nu_{e}");
  s = s.replace(/q̄/g, "\\bar{q}");
  s = s.replace(/π⁺/g, "\\pi^{+}");
  s = s.replace(/π⁻/g, "\\pi^{-}");
  s = s.replace(/π⁰/g, "\\pi^{0}");
  s = s.replace(/W⁺/g, "W^{+}");
  s = s.replace(/W⁻/g, "W^{-}");
  s = s.replace(/Z⁰/g, "Z^{0}");
  s = s.replace(/H⁰/g, "H^{0}");
  s = s.replace(/e⁺/g, "e^{+}");
  s = s.replace(/e⁻/g, "e^{-}");
  s = s.replace(/μ⁺/g, "\\mu^{+}");
  s = s.replace(/μ⁻/g, "\\mu^{-}");
  s = s.replace(/τ⁺/g, "\\tau^{+}");
  s = s.replace(/τ⁻/g, "\\tau^{-}");

  // Greek letters
  s = s.replace(/γ\*/g, "\\gamma^{*}");
  s = s.replace(/γ/g, "\\gamma");
  s = s.replace(/μ/g, "\\mu");
  s = s.replace(/ν/g, "\\nu");
  s = s.replace(/τ/g, "\\tau");
  s = s.replace(/π/g, "\\pi");
  s = s.replace(/φ/g, "\\phi");
  s = s.replace(/ψ/g, "\\psi");

  // Superscripts & Subscripts
  s = s.replace(/⁻/g, "^{-}");
  s = s.replace(/⁺/g, "^{+}");
  s = s.replace(/⁰/g, "^{0}");
  s = s.replace(/¹/g, "^{1}");
  s = s.replace(/²/g, "^{2}");
  s = s.replace(/³/g, "^{3}");
  s = s.replace(/⁴/g, "^{4}");
  s = s.replace(/ₑ/g, "_{e}");
  s = s.replace(/μ/g, "_{\\mu}");

  // Arrows
  s = s.replace(/→/g, "\\to ");

  return s;
}

export function generateLatex(state: DiagramState): string {
  const { vertices, particles, textLabels, ellipses, rectangles } = state;
  if (
    !vertices.length &&
    !particles.length &&
    !textLabels.length &&
    !ellipses.length &&
    !rectangles.length
  ) {
    return "% Empty diagram — add elements before exporting.";
  }

  const scale = 0.035;
  const allVertices = new Map<string, { x: number; y: number }>();

  vertices.forEach((v) => allVertices.set(String(v.id), { x: v.x, y: v.y }));

  const particleData = particles.map((p) => {
    let startId = p.startVertex != null ? String(p.startVertex) : null;
    let endId   = p.endVertex   != null ? String(p.endVertex)   : null;
    if (!startId) {
      startId = `p${p.id}_s`;
      allVertices.set(startId, { x: p.startX, y: p.startY });
    }
    if (!endId) {
      endId = `p${p.id}_e`;
      allVertices.set(endId, { x: p.endX, y: p.endY });
    }
    return { ...p, startId, endId };
  });

  const coords = (x: number, y: number) =>
    `(${(x * scale).toFixed(2)}, ${(-y * scale).toFixed(2)})`;

  const vertexDefs = Array.from(allVertices.entries())
    .map(([id, pos]) => `      \\vertex (${id}) at ${coords(pos.x, pos.y)};`)
    .join("\n");

  const vertexDots = vertices
    .map((v) => `      \\filldraw[black] (${v.id}) circle (2pt);`)
    .join("\n");

  const particleLines = particleData
    .map((p) => {
      const style = particleStyle(p);
      let bendStr = "";
      if (Math.abs(p.bend) > 1) {
        const deg = Math.round(p.bend * 0.5);
        bendStr = deg > 0 ? `, bend right=${deg}` : `, bend left=${-deg}`;
      }
      const cleanLabel = p.label
        ? `, edge label=\\(${formatLatexMath(p.label)}\\)`
        : "";
      return `      (${p.startId}) -- [${style}${bendStr}${cleanLabel}] (${p.endId});`;
    })
    .join("\n");

  const textLines = textLabels
    .map((l) => `      \\node at ${coords(l.x, l.y)} {\\(${formatLatexMath(l.text)}\\)};`)
    .join("\n");

  const shapeLines = [
    ...rectangles.map((r) => {
      const x1 = ((r.x - r.width  / 2) * scale).toFixed(2);
      const y1 = (-(r.y - r.height / 2) * scale).toFixed(2);
      const x2 = ((r.x + r.width  / 2) * scale).toFixed(2);
      const y2 = (-(r.y + r.height / 2) * scale).toFixed(2);
      return `    \\draw (${x1}, ${y1}) rectangle (${x2}, ${y2});`;
    }),
    ...ellipses.map((e) => {
      const cx = (e.x * scale).toFixed(2);
      const cy = (-e.y * scale).toFixed(2);
      const rx = (e.rx * scale).toFixed(2);
      if (e.rx === e.ry) return `    \\draw (${cx}, ${cy}) circle (${rx});`;
      const ry = (e.ry * scale).toFixed(2);
      return `    \\draw (${cx}, ${cy}) ellipse (${rx} and ${ry});`;
    }),
  ].join("\n");

  const preamble = [
    "\\documentclass[tikz, border=8pt]{standalone}",
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
  ]
    .filter(Boolean)
    .join("\n\n");
}
