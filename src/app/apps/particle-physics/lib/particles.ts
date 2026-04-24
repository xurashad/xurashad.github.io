/** All particle data types and constants for the Particle Physics Visualizer. */

export type ParticleFamily =
  | "Quark" | "Lepton" | "Gauge Boson" | "Scalar Boson"
  | "Squark" | "Slepton" | "Gaugino" | "Higgsino"
  | "Baryon" | "Meson";

export type Classification = "Fermion" | "Boson";

export type ViewTab = "standard_model" | "supersymmetry" | "hadrons";

export type SortKey =
  | "default" | "name-asc" | "name-desc"
  | "mass-asc" | "mass-desc" | "generation"
  | "charge-asc" | "charge-desc"
  | "spin-asc" | "spin-desc" | "family";

export interface Particle {
  name: string;
  symbol: string;
  family: ParticleFamily;
  classification: Classification;
  mass: string;
  charge: string;
  spin: string;
  description: string;
  generation?: number;
  composition?: string;
}

// ── Standard Model ──────────────────────────────────────────────────────────

export const standardModelParticles: Particle[] = [
  { name: "Up",             symbol: "u",   family: "Quark",       classification: "Fermion", mass: "2.2 MeV/c²",    charge: "+2/3", spin: "1/2", description: "The lightest of all quarks.", generation: 1 },
  { name: "Down",           symbol: "d",   family: "Quark",       classification: "Fermion", mass: "4.7 MeV/c²",    charge: "-1/3", spin: "1/2", description: "Combines with up quarks to form protons and neutrons.", generation: 1 },
  { name: "Charm",          symbol: "c",   family: "Quark",       classification: "Fermion", mass: "1.27 GeV/c²",   charge: "+2/3", spin: "1/2", description: "The third most massive of the six quarks.", generation: 2 },
  { name: "Strange",        symbol: "s",   family: "Quark",       classification: "Fermion", mass: "95 MeV/c²",     charge: "-1/3", spin: "1/2", description: "A third-lightest quark, found in particles like kaons.", generation: 2 },
  { name: "Top",            symbol: "t",   family: "Quark",       classification: "Fermion", mass: "173.1 GeV/c²",  charge: "+2/3", spin: "1/2", description: "The most massive elementary particle discovered.", generation: 3 },
  { name: "Bottom",         symbol: "b",   family: "Quark",       classification: "Fermion", mass: "4.18 GeV/c²",   charge: "-1/3", spin: "1/2", description: 'Also known as the "beauty" quark.', generation: 3 },
  { name: "Electron",       symbol: "e⁻",  family: "Lepton",      classification: "Fermion", mass: "0.511 MeV/c²",  charge: "-1",   spin: "1/2", description: "A fundamental particle that orbits the nucleus of an atom.", generation: 1 },
  { name: "Electron Neutrino", symbol: "νe",  family: "Lepton",   classification: "Fermion", mass: "< 1 eV/c²",     charge: "0",    spin: "1/2", description: "An elusive particle that rarely interacts with matter.", generation: 1 },
  { name: "Muon",           symbol: "μ⁻",  family: "Lepton",      classification: "Fermion", mass: "105.7 MeV/c²",  charge: "-1",   spin: "1/2", description: "Unstable lepton, ~200× more massive than the electron.", generation: 2 },
  { name: "Muon Neutrino",  symbol: "νμ",  family: "Lepton",      classification: "Fermion", mass: "< 0.17 MeV/c²", charge: "0",    spin: "1/2", description: "Produced in various particle decays.", generation: 2 },
  { name: "Tau",            symbol: "τ⁻",  family: "Lepton",      classification: "Fermion", mass: "1.777 GeV/c²",  charge: "-1",   spin: "1/2", description: "A heavier, unstable version of the electron.", generation: 3 },
  { name: "Tau Neutrino",   symbol: "ντ",  family: "Lepton",      classification: "Fermion", mass: "< 18.2 MeV/c²", charge: "0",    spin: "1/2", description: "The third type of neutrino.", generation: 3 },
  { name: "Photon",         symbol: "γ",   family: "Gauge Boson", classification: "Boson",   mass: "0",             charge: "0",    spin: "1",   description: "The quantum of the electromagnetic field; mediates light and electromagnetism." },
  { name: "Gluon",          symbol: "g",   family: "Gauge Boson", classification: "Boson",   mass: "0",             charge: "0",    spin: "1",   description: "The mediator of the strong force, binding quarks together." },
  { name: "W Boson",        symbol: "W±",  family: "Gauge Boson", classification: "Boson",   mass: "80.4 GeV/c²",   charge: "±1",   spin: "1",   description: "Mediates the weak force, involved in radioactive decay." },
  { name: "Z Boson",        symbol: "Z",   family: "Gauge Boson", classification: "Boson",   mass: "91.2 GeV/c²",   charge: "0",    spin: "1",   description: "Also mediates the weak force, but electrically neutral." },
  { name: "Higgs Boson",    symbol: "H",   family: "Scalar Boson", classification: "Boson",  mass: "125.1 GeV/c²",  charge: "0",    spin: "0",   description: "Associated with the Higgs field, which gives mass to other particles." },
];

// ── Supersymmetry ───────────────────────────────────────────────────────────

export const supersymmetryParticles: Particle[] = [
  { name: "Sup Quark",          symbol: "ũ",   family: "Squark",   classification: "Boson",   mass: "> 1 TeV/c²",    charge: "+2/3", spin: "0",   description: "Superpartner of the Up quark." },
  { name: "Sdown Quark",        symbol: "d̃",   family: "Squark",   classification: "Boson",   mass: "> 1 TeV/c²",    charge: "-1/3", spin: "0",   description: "Superpartner of the Down quark." },
  { name: "Scharm Quark",       symbol: "c̃",   family: "Squark",   classification: "Boson",   mass: "> 1 TeV/c²",    charge: "+2/3", spin: "0",   description: "Superpartner of the Charm quark." },
  { name: "Sstrange Quark",     symbol: "s̃",   family: "Squark",   classification: "Boson",   mass: "> 1 TeV/c²",    charge: "-1/3", spin: "0",   description: "Superpartner of the Strange quark." },
  { name: "Stop Quark",         symbol: "t̃",   family: "Squark",   classification: "Boson",   mass: "> 1 TeV/c²",    charge: "+2/3", spin: "0",   description: "Superpartner of the Top quark." },
  { name: "Sbottom Quark",      symbol: "b̃",   family: "Squark",   classification: "Boson",   mass: "> 1 TeV/c²",    charge: "-1/3", spin: "0",   description: "Superpartner of the Bottom quark." },
  { name: "Selectron",          symbol: "ẽ⁻",  family: "Slepton",  classification: "Boson",   mass: "> 500 GeV/c²",  charge: "-1",   spin: "0",   description: "Superpartner of the Electron." },
  { name: "Selectron Sneutrino",symbol: "ν̃e",  family: "Slepton",  classification: "Boson",   mass: "> 400 GeV/c²",  charge: "0",    spin: "0",   description: "Superpartner of the Electron Neutrino." },
  { name: "Smuon",              symbol: "μ̃⁻",  family: "Slepton",  classification: "Boson",   mass: "> 500 GeV/c²",  charge: "-1",   spin: "0",   description: "Superpartner of the Muon." },
  { name: "Smuon Sneutrino",    symbol: "ν̃μ",  family: "Slepton",  classification: "Boson",   mass: "> 400 GeV/c²",  charge: "0",    spin: "0",   description: "Superpartner of the Muon Neutrino." },
  { name: "Stau",               symbol: "τ̃⁻",  family: "Slepton",  classification: "Boson",   mass: "> 500 GeV/c²",  charge: "-1",   spin: "0",   description: "Superpartner of the Tau." },
  { name: "Stau Sneutrino",     symbol: "ν̃τ",  family: "Slepton",  classification: "Boson",   mass: "> 400 GeV/c²",  charge: "0",    spin: "0",   description: "Superpartner of the Tau Neutrino." },
  { name: "Photino",            symbol: "γ̃",   family: "Gaugino",  classification: "Fermion", mass: "Varies",        charge: "0",    spin: "1/2", description: "Superpartner of the Photon." },
  { name: "Gluino",             symbol: "g̃",   family: "Gaugino",  classification: "Fermion", mass: "> 2 TeV/c²",    charge: "0",    spin: "1/2", description: "Superpartner of the Gluon." },
  { name: "Wino",               symbol: "W̃±",  family: "Gaugino",  classification: "Fermion", mass: "Varies",        charge: "±1",   spin: "1/2", description: "Superpartner of the W Boson." },
  { name: "Zino",               symbol: "Z̃",   family: "Gaugino",  classification: "Fermion", mass: "Varies",        charge: "0",    spin: "1/2", description: "Superpartner of the Z Boson." },
  { name: "Higgsino",           symbol: "H̃",   family: "Higgsino", classification: "Fermion", mass: "Varies",        charge: "0/±1", spin: "1/2", description: "Superpartner of the Higgs Boson. Mixes to form Neutralinos and Charginos." },
  { name: "Gravitino",          symbol: "G̃",   family: "Gaugino",  classification: "Fermion", mass: "Varies",        charge: "0",    spin: "3/2", description: "Superpartner of the Graviton, predicted by supergravity." },
];

// ── Hadrons ─────────────────────────────────────────────────────────────────

export const hadrons: Particle[] = [
  { name: "Proton",   symbol: "p",    family: "Baryon", classification: "Fermion", mass: "938.3 MeV/c²",   charge: "+1", spin: "1/2", description: "A stable particle found in the nucleus of atoms.",          composition: "uud" },
  { name: "Neutron",  symbol: "n",    family: "Baryon", classification: "Fermion", mass: "939.6 MeV/c²",   charge: "0",  spin: "1/2", description: "A neutral particle also found in the atomic nucleus.",        composition: "udd" },
  { name: "Lambda",   symbol: "Λ",    family: "Baryon", classification: "Fermion", mass: "1115.7 MeV/c²",  charge: "0",  spin: "1/2", description: "An unstable baryon containing a strange quark.",             composition: "uds" },
  { name: "Sigma",    symbol: "Σ⁺",   family: "Baryon", classification: "Fermion", mass: "1189.4 MeV/c²",  charge: "+1", spin: "1/2", description: 'A "strange" baryon, part of an isospin triplet.',           composition: "uus" },
  { name: "Xi",       symbol: "Ξ⁰",   family: "Baryon", classification: "Fermion", mass: "1314.86 MeV/c²", charge: "0",  spin: "1/2", description: 'A "doubly strange" baryon, also known as the cascade particle.', composition: "uss" },
  { name: "Delta",    symbol: "Δ⁺⁺",  family: "Baryon", classification: "Fermion", mass: "1232 MeV/c²",    charge: "+2", spin: "3/2", description: "An excited state (resonance) of protons and neutrons.",      composition: "uuu" },
  { name: "Omega",    symbol: "Ω⁻",   family: "Baryon", classification: "Fermion", mass: "1672.45 MeV/c²", charge: "-1", spin: "3/2", description: 'A "triply strange" baryon whose discovery was a triumph for the quark model.', composition: "sss" },
  { name: "Pion",     symbol: "π⁺",   family: "Meson",  classification: "Boson",   mass: "139.6 MeV/c²",   charge: "+1", spin: "0",   description: "The lightest meson, mediates the nuclear force between nucleons.", composition: "ud̄" },
  { name: "Kaon",     symbol: "K⁺",   family: "Meson",  classification: "Boson",   mass: "493.7 MeV/c²",   charge: "+1", spin: "0",   description: "A meson containing a strange antiquark.",                    composition: "us̄" },
  { name: "Rho",      symbol: "ρ⁺",   family: "Meson",  classification: "Boson",   mass: "775.1 MeV/c²",   charge: "+1", spin: "1",   description: "A short-lived resonance, an excited state of the pion.",     composition: "ud̄" },
  { name: "Eta",      symbol: "η",    family: "Meson",  classification: "Boson",   mass: "547.86 MeV/c²",  charge: "0",  spin: "0",   description: "A neutral meson that is a mixture of quark–antiquark pairs.", composition: "Quark-antiquark mix" },
  { name: "D Meson",  symbol: "D⁰",   family: "Meson",  classification: "Boson",   mass: "1864.8 MeV/c²",  charge: "0",  spin: "0",   description: "The lightest meson containing a charm quark.",               composition: "cū" },
  { name: "B Meson",  symbol: "B⁺",   family: "Meson",  classification: "Boson",   mass: "5279.4 MeV/c²",  charge: "+1", spin: "0",   description: "A meson containing a bottom antiquark, studied in CP violation.", composition: "ub̄" },
  { name: "J/ψ",      symbol: "J/ψ",  family: "Meson",  classification: "Boson",   mass: "3096.9 MeV/c²",  charge: "0",  spin: "1",   description: 'A charmonium state; its discovery was the "November Revolution".', composition: "cc̄" },
];

// ── View data map ────────────────────────────────────────────────────────────

export const VIEW_DATA: Record<ViewTab, Particle[]> = {
  standard_model: standardModelParticles,
  supersymmetry: supersymmetryParticles,
  hadrons,
};

// ── Family colour tokens ─────────────────────────────────────────────────────

export type FamilyColour = {
  border: string;
  text: string;
  shadow: string;
  badge: string;
};

export const FAMILY_COLOURS: Partial<Record<ParticleFamily, FamilyColour>> = {
  "Quark":        { border: "border-cyan-400/60",    text: "text-cyan-300",    shadow: "shadow-cyan-500/15",   badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30" },
  "Lepton":       { border: "border-emerald-400/60", text: "text-emerald-300", shadow: "shadow-emerald-500/15",badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  "Gauge Boson":  { border: "border-red-400/60",     text: "text-red-300",     shadow: "shadow-red-500/15",    badge: "bg-red-500/15 text-red-300 border-red-400/30" },
  "Scalar Boson": { border: "border-yellow-400/60",  text: "text-yellow-300",  shadow: "shadow-yellow-500/15", badge: "bg-yellow-500/15 text-yellow-300 border-yellow-400/30" },
  "Baryon":       { border: "border-orange-400/60",  text: "text-orange-300",  shadow: "shadow-orange-500/15", badge: "bg-orange-500/15 text-orange-300 border-orange-400/30" },
  "Meson":        { border: "border-pink-400/60",    text: "text-pink-300",    shadow: "shadow-pink-500/15",   badge: "bg-pink-500/15 text-pink-300 border-pink-400/30" },
  "Squark":       { border: "border-violet-400/60",  text: "text-violet-300",  shadow: "shadow-violet-500/15", badge: "bg-violet-500/15 text-violet-300 border-violet-400/30" },
  "Slepton":      { border: "border-violet-400/60",  text: "text-violet-300",  shadow: "shadow-violet-500/15", badge: "bg-violet-500/15 text-violet-300 border-violet-400/30" },
  "Gaugino":      { border: "border-purple-400/60",  text: "text-purple-300",  shadow: "shadow-purple-500/15", badge: "bg-purple-500/15 text-purple-300 border-purple-400/30" },
  "Higgsino":     { border: "border-fuchsia-400/60", text: "text-fuchsia-300", shadow: "shadow-fuchsia-500/15",badge: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30" },
};

export const DEFAULT_COLOUR: FamilyColour = {
  border: "border-white/20", text: "text-foreground/50",
  shadow: "shadow-black/20", badge: "bg-white/8 text-foreground/50 border-white/15",
};

// ── Sorting helpers ──────────────────────────────────────────────────────────

function parseMass(s: string): number {
  if (s === "0") return 0;
  if (s === "Varies") return Infinity;
  const clean = s.replace(/[<>~²]/g, "").trim();
  const [valStr, unit = ""] = clean.split(" ");
  const val = parseFloat(valStr);
  if (isNaN(val)) return Infinity;
  const u = unit.toUpperCase();
  if (u.startsWith("TEV")) return val * 1e12;
  if (u.startsWith("GEV")) return val * 1e9;
  if (u.startsWith("MEV")) return val * 1e6;
  return val;
}

function parseCharge(s: string): number {
  if (s === "0/±1") return 0;
  if (s.includes("±")) return Math.abs(parseFloat(s.replace("±", "")) || 1);
  if (s.includes("/")) {
    const [a, b] = s.split("/").map(Number);
    return b ? a / b : 0;
  }
  return parseFloat(s) || 0;
}

function parseSpin(s: string): number {
  if (s.includes("/")) {
    const [a, b] = s.split("/").map(Number);
    return b ? a / b : 0;
  }
  return parseFloat(s) || 0;
}

export function sortParticles(particles: Particle[], key: SortKey): Particle[] {
  const p = [...particles];
  switch (key) {
    case "name-asc":     return p.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":    return p.sort((a, b) => b.name.localeCompare(a.name));
    case "mass-asc":     return p.sort((a, b) => parseMass(a.mass) - parseMass(b.mass));
    case "mass-desc":    return p.sort((a, b) => parseMass(b.mass) - parseMass(a.mass));
    case "generation":   return p.sort((a, b) => (a.generation ?? 4) - (b.generation ?? 4));
    case "charge-asc":   return p.sort((a, b) => parseCharge(a.charge) - parseCharge(b.charge));
    case "charge-desc":  return p.sort((a, b) => parseCharge(b.charge) - parseCharge(a.charge));
    case "spin-asc":     return p.sort((a, b) => parseSpin(a.spin) - parseSpin(b.spin));
    case "spin-desc":    return p.sort((a, b) => parseSpin(b.spin) - parseSpin(a.spin));
    case "family":       return p.sort((a, b) => a.family.localeCompare(b.family));
    default:             return p;
  }
}
