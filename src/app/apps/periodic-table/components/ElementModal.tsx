"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import type { Element } from "../lib/types";
import { getCategoryInfo } from "../lib/types";

interface Props {
  element: Element;
  onClose: () => void;
}

function fmt(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined) return "N/A";
  return `${v}${unit}`;
}

export function ElementModal({ element: el, onClose }: Props) {
  const cat = getCategoryInfo(el.category);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-4xl bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-white/6" style={{ background: `linear-gradient(135deg, ${cat.hex}18, transparent 70%)` }}>
          <div className={`w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex flex-col items-center justify-center rounded-xl ${cat.bg} ${cat.text} shadow-lg`}>
            <span className="text-xs font-semibold opacity-80">{el.number}</span>
            <span className="text-3xl sm:text-4xl font-bold leading-tight">{el.symbol}</span>
            <span className="text-[0.6rem] font-semibold opacity-75">{el.name}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{el.name}</h2>
            <p className="text-sm font-medium mt-0.5" style={{ color: cat.hex }}>{el.category}</p>
            <p className="text-xs text-foreground/50 mt-1 font-mono">
              Period {el.period} · Group {el.group} · {el.phase}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-foreground/50 hover:text-foreground flex-shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] scrollbar-thin scrollbar-thumb-white/10">
          {/* Summary + Bohr Model */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 flex items-center justify-center">
              {el.bohr_model_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={el.bohr_model_image}
                  alt={`Bohr model of ${el.name}`}
                  className="w-full max-w-[200px] h-auto object-contain bg-black/40 rounded-xl p-3 border border-white/5"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-48 bg-black/40 rounded-xl flex items-center justify-center text-foreground/30 text-sm border border-white/5">
                  No model available
                </div>
              )}
            </div>
            <div className="lg:col-span-2">
              <p className="text-foreground/70 leading-relaxed text-sm">{el.summary}</p>
            </div>
          </div>

          {/* Data cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Properties */}
            <Card title="Properties" hex={cat.hex}>
              <Row label="Atomic Mass" value={fmt(el.atomic_mass, " u")} />
              <Row label="Density" value={fmt(el.density, " g/L")} />
              <Row label="Phase" value={el.phase} />
              <Row label="Discovered By" value={el.discovered_by} />
            </Card>

            {/* Thermal */}
            <Card title="Thermal" hex={cat.hex}>
              <Row label="Melting Point" value={fmt(el.melt, " K")} />
              <Row label="Boiling Point" value={fmt(el.boil, " K")} />
            </Card>

            {/* Atomic Data */}
            <Card title="Atomic Data" hex={cat.hex}>
              <Row label="Electron Config" value={el.electron_configuration_semantic} />
              <Row label="Shells" value={el.shells.join(", ")} />
              <Row label="Electronegativity" value={fmt(el.electronegativity_pauling)} />
              <Row label="Electron Affinity" value={fmt(el.electron_affinity)} />
            </Card>
          </div>

          {/* Ionization Energies */}
          {el.ionization_energies.length > 0 && (
            <div className="mt-4 p-4 bg-white/[0.03] border border-white/6 rounded-xl">
              <h3 className="text-sm font-semibold mb-2" style={{ color: cat.hex }}>
                Ionization Energies (kJ/mol)
              </h3>
              <p className="text-xs text-foreground/60 break-words font-mono">
                {el.ionization_energies.join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, hex, children }: { title: string; hex: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-white/[0.03] border border-white/6 rounded-xl space-y-1.5">
      <h3 className="text-sm font-semibold border-b border-white/6 pb-1.5 mb-2" style={{ color: hex }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs gap-2">
      <span className="text-foreground/40 flex-shrink-0">{label}</span>
      <span className="text-foreground/80 text-right break-all">{value}</span>
    </div>
  );
}
