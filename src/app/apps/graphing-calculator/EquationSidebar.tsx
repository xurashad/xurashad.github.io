"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, Sigma } from "lucide-react";
import { type Equation, COLORS, parseEquation } from "./lib/types";

const PRESETS = [
  "sin(x)", "cos(x)", "tan(x)",
  "x^2", "x^3", "sqrt(x)",
  "1/x", "abs(x)", "exp(x)",
  "x^2 + y^2 = 25",
  "sin(x) * cos(y) = 0.5",
  "x^2/9 + y^2/4 = 1",
];

interface Props {
  equations: Equation[];
  nextId: number;
  onAdd: (text: string) => void;
  onRemove: (id: number) => void;
  onUpdateText: (id: number, text: string) => void;
  onUpdateColor: (id: number, color: string) => void;
  onSetNextId: (n: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function EquationSidebar({
  equations, nextId, onAdd, onRemove, onUpdateText, onUpdateColor,
  onSetNextId, isOpen, onToggle,
}: Props) {
  const [inputText, setInputText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const t = inputText.trim();
    if (!t) return;
    onAdd(t);
    setInputText("");
  };

  const handlePreset = (preset: string) => {
    const { fn, error, type } = parseEquation(preset);
    const newEq: Equation = {
      id: nextId,
      text: preset,
      color: COLORS[(nextId - 1) % COLORS.length],
      fn, error, type,
    };
    // Inline add without going through onAdd to avoid duplicating logic
    onAdd(preset);
    void newEq; // consumed via onAdd
    onSetNextId(nextId + 1);
  };

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 text-foreground/60 hover:text-foreground/90 hover:bg-black/60 hover:border-white/20 transition-all"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Sidebar panel */}
      <aside
        className={`absolute top-0 left-0 bottom-0 z-10 flex flex-col bg-black/70 backdrop-blur-xl border-r border-white/8 transition-all duration-300 ease-in-out ${
          isOpen ? "w-72 lg:w-80" : "w-0"
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full w-72 lg:w-80 min-w-0">
          {/* Header */}
          <div className="px-5 pt-14 pb-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Sigma size={16} className="text-quantum/70" />
              <h2 className="text-sm font-semibold text-foreground/70">Equations</h2>
            </div>
          </div>

          {/* Equation list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {equations.map((eq) => (
              <div
                key={eq.id}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  eq.error
                    ? "border-crimson/30 bg-crimson/5"
                    : "border-white/8 bg-white/4 hover:border-white/15"
                }`}
              >
                {/* Colour swatch / picker */}
                <label
                  className="relative flex-shrink-0 w-2 h-9 rounded-full cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: eq.color }}
                  title="Change colour"
                >
                  <input
                    type="color"
                    value={eq.color}
                    onChange={(e) => onUpdateColor(eq.id, e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label={`Pick colour for equation ${eq.id}`}
                  />
                </label>

                {/* Text input */}
                <input
                  type="text"
                  value={eq.text}
                  onChange={(e) => onUpdateText(eq.id, e.target.value)}
                  className={`flex-1 min-w-0 bg-transparent text-sm font-mono px-1 focus:outline-none rounded ${
                    eq.error ? "text-crimson/80" : "text-foreground/80"
                  }`}
                  aria-label={`Equation ${eq.id}`}
                  spellCheck={false}
                />

                {/* Remove */}
                <button
                  onClick={() => onRemove(eq.id)}
                  className="flex-shrink-0 p-1 text-foreground/25 hover:text-crimson/70 transition-colors"
                  aria-label={`Remove equation ${eq.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {equations.length === 0 && (
              <p className="text-xs text-foreground/25 text-center py-4">
                No equations yet. Add one below.
              </p>
            )}
          </div>

          {/* Add equation form */}
          <div className="border-t border-white/8 px-3 py-3 space-y-3">
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                id="eq-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. sin(x) * x"
                className="flex-1 min-w-0 px-3 py-2 text-sm font-mono rounded-xl bg-black/30 border border-white/10 text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-quantum/40 transition-all"
                aria-label="New equation"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 rounded-xl border border-quantum/30 bg-quantum/15 text-quantum hover:bg-quantum/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Add equation"
              >
                <Plus size={16} />
              </button>
            </form>

            {/* Presets */}
            <div>
              <p className="text-[10px] font-mono text-foreground/25 uppercase tracking-widest mb-2">Presets</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePreset(p)}
                    className="text-[10px] font-mono px-2 py-1 rounded-lg border border-white/8 bg-white/4 text-foreground/40 hover:border-quantum/25 hover:text-quantum/70 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
