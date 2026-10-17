"use client";

import { useState, useRef } from "react";
import {
  Plus, Trash2, ChevronLeft, ChevronRight, EyeOff,
  Copy, Play, Pause, Sparkles, Check, X,
} from "lucide-react";
import {
  type Equation, COLORS, PRESET_CATEGORIES,
} from "./lib/types";

interface Props {
  equations: Equation[];
  activeEqId: number | null;
  onSetActiveEqId: (id: number | null) => void;
  onAdd: (text: string) => void;
  onRemove: (id: number) => void;
  onDuplicate: (id: number) => void;
  onUpdateText: (id: number, text: string) => void;
  onUpdateColor: (id: number, color: string) => void;
  onToggleVisible: (id: number) => void;
  onUpdateSlider: (id: number, val: number) => void;
  onToggleSliderPlay: (id: number) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
  onOpenKeypad: () => void;
}

export function EquationSidebar({
  equations,
  activeEqId,
  onSetActiveEqId,
  onAdd,
  onRemove,
  onDuplicate,
  onUpdateText,
  onUpdateColor,
  onToggleVisible,
  onUpdateSlider,
  onToggleSliderPlay,
  isOpen,
  onToggle,
  isMobile,
  onOpenKeypad,
}: Props) {
  const [inputText, setInputText] = useState("");
  const [colorPickerEqId, setColorPickerEqId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const addInputRef = useRef<HTMLInputElement>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = inputText.trim();
    if (!t) return;
    onAdd(t);
    setInputText("");
  };

  const handlePresetClick = (eqText: string) => {
    onAdd(eqText);
  };

  return (
    <>
      {/* Desktop collapse toggle button */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className={`absolute top-3 z-20 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-white/80 hover:text-white hover:bg-black/90 hover:border-white/30 transition-all shadow-lg ${
            isOpen ? "left-[324px]" : "left-3"
          }`}
          aria-label={isOpen ? "Collapse expressions panel" : "Expand expressions panel"}
          title={isOpen ? "Collapse (Hide panel)" : "Expand (Show panel)"}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      )}

      {/* Main Sidebar / Mobile Drawer */}
      <aside
        className={`flex flex-col bg-black/90 backdrop-blur-2xl border-white/10 transition-all duration-300 ease-in-out ${
          isMobile
            ? `absolute inset-0 z-30 ${
                isOpen
                  ? "translate-y-0 opacity-100 pointer-events-auto"
                  : "translate-y-full opacity-0 pointer-events-none"
              }`
            : `absolute top-0 left-0 bottom-0 z-20 border-r ${
                isOpen
                  ? "w-80 opacity-100 pointer-events-auto"
                  : "w-0 opacity-0 pointer-events-none overflow-hidden"
              }`
        }`}
      >
        <div className="flex flex-col h-full w-full min-w-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-quantum animate-pulse" />
              <h2 className="text-sm font-semibold text-white tracking-wide">
                Expressions
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {equations.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenKeypad}
                className="text-xs font-mono px-2.5 py-1 rounded-lg bg-quantum/15 text-quantum hover:bg-quantum/25 border border-quantum/30 transition-all"
                title="Open Math Keypad"
              >
                Keypad
              </button>

              {isMobile && (
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all"
                  aria-label="Close expressions"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Equation list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {equations.map((eq) => {
              const isActive = activeEqId === eq.id;
              const isSlider = eq.type === "slider" && eq.slider;

              return (
                <div
                  key={eq.id}
                  className={`group relative rounded-xl border transition-all ${
                    eq.error
                      ? "border-rose-500/40 bg-rose-500/5 shadow-sm"
                      : isActive
                      ? "border-quantum/50 bg-quantum/10 shadow-md ring-1 ring-quantum/30"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                  onClick={() => onSetActiveEqId(eq.id)}
                >
                  {/* Top row: Color circle, visibility, text, actions */}
                  <div className="flex items-center gap-2 p-2.5">
                    {/* Visibility toggle & color indicator */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisible(eq.id);
                        }}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-sm"
                        style={{
                          backgroundColor: eq.visible ? eq.color : "transparent",
                          border: `2px solid ${eq.color}`,
                        }}
                        title={eq.visible ? "Hide curve" : "Show curve"}
                        aria-label={`Toggle visibility for equation ${eq.id}`}
                      >
                        {eq.visible ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-black/70" />
                        ) : (
                          <EyeOff size={11} className="text-white/40" />
                        )}
                      </button>

                      {/* Quick color palette trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setColorPickerEqId(colorPickerEqId === eq.id ? null : eq.id);
                        }}
                        className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white/20 hover:bg-white/40 border border-black/80 flex items-center justify-center"
                        title="Change color"
                      >
                        <span className="w-1 h-1 rounded-full bg-white" />
                      </button>
                    </div>

                    {/* Equation Text Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={eq.text}
                        onFocus={() => onSetActiveEqId(eq.id)}
                        onChange={(e) => onUpdateText(eq.id, e.target.value)}
                        className={`w-full bg-transparent text-sm font-mono focus:outline-none ${
                          eq.error ? "text-rose-400" : "text-white"
                        }`}
                        placeholder="e.g. sin(x)"
                        aria-label={`Equation ${eq.id}`}
                        spellCheck={false}
                      />

                      {/* Badges / Type display */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-white/40 uppercase">
                          {eq.type === "inequality"
                            ? `Inequality (${eq.inequalityOp})`
                            : eq.type === "vertical"
                            ? "Vertical line"
                            : eq.type === "point"
                            ? "Point"
                            : eq.type === "slider"
                            ? "Variable Slider"
                            : eq.type === "implicit"
                            ? "Implicit Curve"
                            : "Function y = f(x)"}
                        </span>
                        {eq.error && (
                          <span className="text-[10px] font-mono text-rose-400 font-semibold truncate">
                            · {eq.error}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Duplicate, Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(eq.id);
                        }}
                        className="p-1 rounded text-white/30 hover:text-white/80 hover:bg-white/10 transition-colors"
                        title="Duplicate equation"
                        aria-label="Duplicate equation"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(eq.id);
                        }}
                        className="p-1 rounded text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete equation"
                        aria-label="Delete equation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Color Picker Popover */}
                  {colorPickerEqId === eq.id && (
                    <div
                      className="px-3 pb-2.5 pt-1 border-t border-white/10 flex flex-wrap gap-1.5 bg-black/40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            onUpdateColor(eq.id, c);
                            setColorPickerEqId(null);
                          }}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-125 border ${
                            eq.color === c ? "ring-2 ring-white scale-110" : "border-black/50"
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Interactive Slider if type == slider */}
                  {isSlider && (
                    <div
                      className="px-3 pb-3 pt-1 border-t border-white/8 bg-white/[0.02] flex flex-col gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-quantum font-semibold">
                          {eq.slider!.name} = {eq.slider!.value.toFixed(2)}
                        </span>
                        <button
                          onClick={() => onToggleSliderPlay(eq.id)}
                          className={`p-1 rounded-md border flex items-center gap-1 px-2 text-[11px] transition-all ${
                            eq.slider!.isPlaying
                              ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                              : "border-white/15 bg-white/5 text-white/60 hover:text-white"
                          }`}
                          title={eq.slider!.isPlaying ? "Pause animation" : "Play animation"}
                        >
                          {eq.slider!.isPlaying ? <Pause size={10} /> : <Play size={10} />}
                          <span>{eq.slider!.isPlaying ? "Stop" : "Animate"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/30">{eq.slider!.min}</span>
                        <input
                          type="range"
                          min={eq.slider!.min}
                          max={eq.slider!.max}
                          step={eq.slider!.step}
                          value={eq.slider!.value}
                          onChange={(e) => onUpdateSlider(eq.id, parseFloat(e.target.value))}
                          className="flex-1 accent-quantum cursor-pointer h-1.5 rounded-lg bg-white/20"
                        />
                        <span className="text-[10px] font-mono text-white/30">{eq.slider!.max}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {equations.length === 0 && (
              <div className="text-center py-8 text-white/30 text-xs font-mono">
                No equations active. Type an equation below or pick a preset.
              </div>
            )}
          </div>

          {/* Add Equation & Presets Footer */}
          <div className="border-t border-white/10 p-3 space-y-3 bg-black/40">
            {/* Quick add form */}
            <form onSubmit={handleAddSubmit} className="flex gap-2">
              <input
                ref={addInputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g. 2x + 1, x^2 + y^2 = 9, a = 2"
                className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm font-mono rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/25 focus:outline-none focus:border-quantum/50 transition-all"
                aria-label="New equation input"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-3 py-2 rounded-xl bg-quantum text-black font-semibold hover:bg-quantum/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-md text-xs sm:text-sm"
                aria-label="Add expression"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add</span>
              </button>
            </form>

            {/* Presets Gallery */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles size={11} className="text-quantum" />
                  Presets
                </span>
                <div className="flex gap-1">
                  {PRESET_CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.category}
                      onClick={() => setSelectedCategory(idx)}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-all ${
                        selectedCategory === idx
                          ? "bg-white/20 text-white font-medium"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {cat.category.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset chips */}
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                {PRESET_CATEGORIES[selectedCategory].items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => handlePresetClick(item.equation)}
                    className="text-[11px] font-mono px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-white/70 hover:border-quantum/40 hover:text-quantum hover:bg-quantum/10 transition-all text-left"
                    title={`Add ${item.equation}`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Done button */}
            {isMobile && (
              <button
                onClick={onToggle}
                className="w-full py-2.5 rounded-xl bg-quantum text-black font-semibold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Check size={16} />
                <span>Return to Graph</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
