"use client";

import { useState, useMemo, useRef } from "react";
import {
  Search,
  SlidersHorizontal,
  Atom,
  LayoutGrid,
  Grid2x2,
  BarChart3,
} from "lucide-react";
import {
  VIEW_DATA,
  getParticleById,
  sortParticles,
  type ViewTab,
  type SortKey,
  type Classification,
  type Particle,
} from "./lib/particles";
import { ParticleCard } from "./ParticleCard";
import { ParticleShowcase } from "./components/ParticleShowcase";
import { StandardModelMatrix } from "./components/StandardModelMatrix";
import { MassSpectrumChart } from "./components/MassSpectrumChart";

type ViewMode = "matrix" | "cards" | "spectrum";

// ── Tab config ──────────────────────────────────────────────────────────────

const TABS: { id: ViewTab; label: string; count: number; defaultId: string }[] = [
  { id: "standard_model", label: "Standard Model", count: VIEW_DATA.standard_model.length, defaultId: "higgs" },
  { id: "supersymmetry",  label: "Supersymmetry",  count: VIEW_DATA.supersymmetry.length,  defaultId: "stop"  },
  { id: "hadrons",        label: "Hadrons",         count: VIEW_DATA.hadrons.length,        defaultId: "proton"},
];

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "matrix",   label: "Matrix Table",  icon: <Grid2x2 size={13} /> },
  { id: "cards",    label: "Visual Cards",  icon: <LayoutGrid size={13} /> },
  { id: "spectrum", label: "Mass Spectrum", icon: <BarChart3 size={13} /> },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",      label: "Default order"       },
  { value: "name-asc",     label: "Name (A → Z)"        },
  { value: "name-desc",    label: "Name (Z → A)"        },
  { value: "mass-asc",     label: "Mass (light first)"  },
  { value: "mass-desc",    label: "Mass (heavy first)"  },
  { value: "generation",   label: "Generation"          },
  { value: "charge-asc",   label: "Charge (↑)"          },
  { value: "charge-desc",  label: "Charge (↓)"          },
  { value: "spin-asc",     label: "Spin (↑)"            },
  { value: "spin-desc",    label: "Spin (↓)"            },
  { value: "family",       label: "Family (A → Z)"      },
];

// ── Legend pill ─────────────────────────────────────────────────────────────

const FAMILY_GROUPS: Record<ViewTab, { family: string; colour: string }[]> = {
  standard_model: [
    { family: "Quark",        colour: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35 dark:border-cyan-400/30" },
    { family: "Lepton",       colour: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 dark:border-emerald-400/30" },
    { family: "Gauge Boson",  colour: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35 dark:border-red-400/30" },
    { family: "Scalar Boson", colour: "bg-yellow-500/15 text-amber-700 dark:text-yellow-300 border-amber-500/35 dark:border-yellow-400/30" },
  ],
  supersymmetry: [
    { family: "Squark",   colour: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/35 dark:border-violet-400/30" },
    { family: "Slepton",  colour: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/35 dark:border-violet-400/30" },
    { family: "Gaugino",  colour: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/35 dark:border-purple-400/30" },
    { family: "Higgsino", colour: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/35 dark:border-fuchsia-400/30" },
  ],
  hadrons: [
    { family: "Baryon", colour: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/35 dark:border-orange-400/30" },
    { family: "Meson",  colour: "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/35 dark:border-pink-400/30" },
  ],
};

// ── Main visualizer ─────────────────────────────────────────────────────────

export function ParticleVisualizer() {
  const [activeTab, setActiveTab]       = useState<ViewTab>("standard_model");
  const [viewMode, setViewMode]         = useState<ViewMode>("matrix");
  const [selectedId, setSelectedId]     = useState<string>("higgs");
  const [antimatter, setAntimatter]     = useState<boolean>(false);
  const [sort, setSort]                 = useState<SortKey>("default");
  const [search, setSearch]             = useState("");
  const [filterFamily, setFilterFamily] = useState<string>("");
  const [filterClass, setFilterClass]   = useState<string>("");
  const showcaseRef = useRef<HTMLDivElement>(null);

  const tabParticles = VIEW_DATA[activeTab];

  const particles = useMemo(() => {
    let list = tabParticles;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.symbol.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.composition && p.composition.toLowerCase().includes(q)),
      );
    }

    // Family filter
    if (filterFamily) {
      list = list.filter((p) => p.family === filterFamily);
    }

    // Classification filter
    if (filterClass) {
      list = list.filter((p) => p.classification === (filterClass as Classification));
    }

    return sortParticles(list, sort);
  }, [tabParticles, sort, search, filterFamily, filterClass]);

  const hasActiveFilter = Boolean(search.trim() || filterFamily || filterClass);

  const matchingIds = useMemo(() => {
    if (!hasActiveFilter) return null;
    return new Set(particles.map((p) => p.id));
  }, [hasActiveFilter, particles]);

  const selectedParticle = useMemo(() => {
    return (
      tabParticles.find((p) => p.id === selectedId) ??
      tabParticles[0]
    );
  }, [tabParticles, selectedId]);

  // Unique families in current tab for filter dropdown
  const families = useMemo(() => {
    const set = new Set(tabParticles.map((p) => p.family));
    return Array.from(set).sort();
  }, [tabParticles]);

  const handleTabChange = (tab: ViewTab) => {
    const tabMeta = TABS.find((t) => t.id === tab);
    const nextId = tabMeta?.defaultId ?? VIEW_DATA[tab][0].id;
    const nextParticle = getParticleById(nextId);
    setActiveTab(tab);
    setSelectedId(nextId);
    if (nextParticle?.selfConjugate) {
      setAntimatter(false);
    }
    setSort("default");
    setSearch("");
    setFilterFamily("");
    setFilterClass("");
  };

  const clearAllFilters = () => {
    setSearch("");
    setFilterFamily("");
    setFilterClass("");
  };

  const handleSelectParticle = (p: Particle) => {
    setSelectedId(p.id);
    if (p.selfConjugate) {
      setAntimatter(false);
    }
  };

  const handleJumpToParticleId = (id: string) => {
    const target = getParticleById(id);
    if (!target) return;
    if (target.tab !== activeTab) {
      setActiveTab(target.tab);
      setSort("default");
      setSearch("");
      setFilterFamily("");
      setFilterClass("");
    }
    setSelectedId(target.id);
    if (target.selfConjugate) {
      setAntimatter(false);
    }
    showcaseRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleSortChange = (nextSort: SortKey) => {
    setSort(nextSort);
    if (nextSort !== "default" && viewMode === "matrix") {
      setViewMode("cards");
    }
  };

  return (
    <div className="space-y-7">
      {/* Top Bar: Tabs + View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Sector Tabs */}
        <div className="flex flex-wrap gap-1 p-1 glass rounded-2xl border border-black/10 dark:border-white/8 w-fit">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              aria-pressed={activeTab === id}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? "bg-quantum/20 text-quantum-700 dark:text-quantum border border-quantum/35 shadow-[0_0_16px_rgba(0,195,245,0.1)]"
                  : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {label}
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                  activeTab === id ? "border-quantum/30 bg-quantum/10" : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap gap-1 p-1 glass rounded-2xl border border-black/10 dark:border-white/8 w-fit">
          {VIEW_MODES.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              aria-pressed={viewMode === id}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === id
                  ? "bg-black/10 dark:bg-white/12 text-foreground border border-black/15 dark:border-white/20 shadow-sm"
                  : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Interactive 3D Quantum Chamber & Telemetry Inspector */}
      <div ref={showcaseRef}>
        <ParticleShowcase
          particle={selectedParticle}
          particlesInTab={particles.length > 0 ? particles : tabParticles}
          antimatter={antimatter}
          onToggleAntimatter={() => setAntimatter((v) => !v)}
          onSelectParticle={handleSelectParticle}
          onJumpToParticleId={handleJumpToParticleId}
        />
      </div>

      {/* Interactive Filterable Legend */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/35 mr-1">
          Filter:
        </span>
        {FAMILY_GROUPS[activeTab].map(({ family, colour }) => {
          const active = filterFamily === family;
          return (
            <button
              key={family}
              type="button"
              onClick={() => setFilterFamily(active ? "" : family)}
              aria-pressed={active}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${colour} ${
                active ? "ring-2 ring-black/30 dark:ring-white/50 scale-105" : "opacity-85 hover:opacity-100"
              }`}
            >
              {family}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setFilterClass(filterClass === "Fermion" ? "" : "Fermion")}
          aria-pressed={filterClass === "Fermion"}
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/35 dark:border-blue-400/30 ${
            filterClass === "Fermion" ? "ring-2 ring-blue-500/60 dark:ring-blue-300/60 scale-105" : "opacity-85 hover:opacity-100"
          }`}
        >
          Fermion
        </button>

        <button
          type="button"
          onClick={() => setFilterClass(filterClass === "Boson" ? "" : "Boson")}
          aria-pressed={filterClass === "Boson"}
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 dark:border-rose-400/30 ${
            filterClass === "Boson" ? "ring-2 ring-rose-500/60 dark:ring-rose-300/60 scale-105" : "opacity-85 hover:opacity-100"
          }`}
        >
          Boson
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[10px] font-mono text-quantum-700 dark:text-quantum/70 hover:text-quantum underline ml-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search particles, symbols, or quarks…"
            className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-white/85 dark:bg-black/30 border border-black/10 dark:border-white/10 text-foreground/80 placeholder:text-foreground/35 focus:outline-none focus:border-quantum/45 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-foreground/40" />
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortKey)}
            aria-label="Sort particles"
            className="text-sm rounded-xl bg-white/85 dark:bg-black/30 border border-black/10 dark:border-white/10 text-foreground/80 px-3 py-2.5 focus:outline-none focus:border-quantum/45 transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-white dark:bg-[#0a0e1f] text-foreground">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Family filter */}
        <select
          value={filterFamily}
          onChange={(e) => setFilterFamily(e.target.value)}
          aria-label="Filter by family"
          className="text-sm rounded-xl bg-white/85 dark:bg-black/30 border border-black/10 dark:border-white/10 text-foreground/80 px-3 py-2.5 focus:outline-none focus:border-quantum/45 transition-all"
        >
          <option value="" className="bg-white dark:bg-[#0a0e1f] text-foreground">All families</option>
          {families.map((f) => (
            <option key={f} value={f} className="bg-white dark:bg-[#0a0e1f] text-foreground">
              {f}
            </option>
          ))}
        </select>

        {/* Classification filter */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          aria-label="Filter by classification"
          className="text-sm rounded-xl bg-white/85 dark:bg-black/30 border border-black/10 dark:border-white/10 text-foreground/80 px-3 py-2.5 focus:outline-none focus:border-quantum/45 transition-all"
        >
          <option value="" className="bg-white dark:bg-[#0a0e1f] text-foreground">Fermions + Bosons</option>
          <option value="Fermion" className="bg-white dark:bg-[#0a0e1f] text-foreground">Fermions only</option>
          <option value="Boson" className="bg-white dark:bg-[#0a0e1f] text-foreground">Bosons only</option>
        </select>

        {/* Result count */}
        <span className="text-xs font-mono text-foreground/45 ml-auto whitespace-nowrap">
          {particles.length} particle{particles.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Active Visualization View */}
      {viewMode === "matrix" ? (
        <StandardModelMatrix
          tab={activeTab}
          matchingIds={matchingIds}
          selectedId={selectedParticle.id}
          antimatter={antimatter}
          onSelect={handleSelectParticle}
          onClearFilters={clearAllFilters}
        />
      ) : particles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-foreground/45">
          <Atom size={40} strokeWidth={1} />
          <p className="text-sm">No particles match your filters.</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-quantum-700 dark:text-quantum/70 hover:text-quantum underline"
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === "spectrum" ? (
        <MassSpectrumChart
          tab={activeTab}
          particles={particles}
          selectedId={selectedParticle.id}
          antimatter={antimatter}
          onSelect={handleSelectParticle}
          onJumpToParticleId={handleJumpToParticleId}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {particles.map((p) => (
            <ParticleCard
              key={p.id}
              particle={p}
              selected={selectedParticle.id === p.id}
              antimatter={antimatter}
              onSelect={handleSelectParticle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
