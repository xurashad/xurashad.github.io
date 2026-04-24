"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, Atom } from "lucide-react";
import {
  VIEW_DATA, sortParticles,
  type ViewTab, type SortKey, type ParticleFamily, type Classification,
} from "./lib/particles";
import { ParticleCard } from "./ParticleCard";

// ── Tab config ──────────────────────────────────────────────────────────────

const TABS: { id: ViewTab; label: string; count: number }[] = [
  { id: "standard_model", label: "Standard Model", count: VIEW_DATA.standard_model.length },
  { id: "supersymmetry",  label: "Supersymmetry",  count: VIEW_DATA.supersymmetry.length  },
  { id: "hadrons",        label: "Hadrons",         count: VIEW_DATA.hadrons.length        },
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
    { family: "Quark",        colour: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30" },
    { family: "Lepton",       colour: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30" },
    { family: "Gauge Boson",  colour: "bg-red-400/20 text-red-300 border-red-400/30" },
    { family: "Scalar Boson", colour: "bg-yellow-400/20 text-yellow-300 border-yellow-400/30" },
  ],
  supersymmetry: [
    { family: "Squark",   colour: "bg-violet-400/20 text-violet-300 border-violet-400/30" },
    { family: "Slepton",  colour: "bg-violet-400/20 text-violet-300 border-violet-400/30" },
    { family: "Gaugino",  colour: "bg-purple-400/20 text-purple-300 border-purple-400/30" },
    { family: "Higgsino", colour: "bg-fuchsia-400/20 text-fuchsia-300 border-fuchsia-400/30" },
  ],
  hadrons: [
    { family: "Baryon", colour: "bg-orange-400/20 text-orange-300 border-orange-400/30" },
    { family: "Meson",  colour: "bg-pink-400/20 text-pink-300 border-pink-400/30" },
  ],
};

// ── Main visualizer ─────────────────────────────────────────────────────────

export function ParticleVisualizer() {
  const [activeTab, setActiveTab]     = useState<ViewTab>("standard_model");
  const [sort, setSort]               = useState<SortKey>("default");
  const [search, setSearch]           = useState("");
  const [filterFamily, setFilterFamily] = useState<string>("");
  const [filterClass, setFilterClass]   = useState<string>("");

  const particles = useMemo(() => {
    let list = VIEW_DATA[activeTab];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.symbol.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
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
  }, [activeTab, sort, search, filterFamily, filterClass]);

  // Unique families in current tab for filter dropdown
  const families = useMemo(() => {
    const set = new Set(VIEW_DATA[activeTab].map((p) => p.family));
    return Array.from(set).sort();
  }, [activeTab]);

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    setSort("default");
    setSearch("");
    setFilterFamily("");
    setFilterClass("");
  };

  return (
    <div className="space-y-8">

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 glass rounded-2xl border border-white/8 w-fit">
        {TABS.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            aria-pressed={activeTab === id}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id
                ? "bg-quantum/20 text-quantum border border-quantum/30 shadow-[0_0_16px_rgba(0,195,245,0.1)]"
                : "text-foreground/40 hover:text-foreground/70"
            }`}
          >
            {label}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                activeTab === id ? "border-quantum/30 bg-quantum/10" : "border-white/10 bg-white/5"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {FAMILY_GROUPS[activeTab].map(({ family, colour }) => (
          <span key={family} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${colour}`}>
            {family}
          </span>
        ))}
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border bg-blue-500/15 text-blue-300 border-blue-400/30">Fermion</span>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full border bg-rose-500/15 text-rose-300 border-rose-400/30">Boson</span>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/25 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search particles…"
            className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl bg-black/30 border border-white/10 text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-quantum/40 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-foreground/30" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-sm rounded-xl bg-black/30 border border-white/10 text-foreground/60 px-3 py-2.5 focus:outline-none focus:border-quantum/40 transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Family filter */}
        <select
          value={filterFamily}
          onChange={(e) => setFilterFamily(e.target.value)}
          className="text-sm rounded-xl bg-black/30 border border-white/10 text-foreground/60 px-3 py-2.5 focus:outline-none focus:border-quantum/40 transition-all"
        >
          <option value="">All families</option>
          {families.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Classification filter */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="text-sm rounded-xl bg-black/30 border border-white/10 text-foreground/60 px-3 py-2.5 focus:outline-none focus:border-quantum/40 transition-all"
        >
          <option value="">Fermions + Bosons</option>
          <option value="Fermion">Fermions only</option>
          <option value="Boson">Bosons only</option>
        </select>

        {/* Result count */}
        <span className="text-xs font-mono text-foreground/30 ml-auto whitespace-nowrap">
          {particles.length} particle{particles.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {particles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {particles.map((p) => (
            <ParticleCard key={`${p.name}-${p.family}`} particle={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-foreground/30">
          <Atom size={40} strokeWidth={1} />
          <p className="text-sm">No particles match your filters.</p>
          <button
            onClick={() => { setSearch(""); setFilterFamily(""); setFilterClass(""); }}
            className="text-xs text-quantum/60 hover:text-quantum underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
