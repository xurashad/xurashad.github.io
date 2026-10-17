"use client";

import { Delete, ChevronDown } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  isMobile: boolean;
  isSidebarOpen: boolean;
}

export function MathKeypad({
  isOpen,
  onClose,
  onInsert,
  onBackspace,
  onClear,
  isMobile,
  isSidebarOpen,
}: Props) {
  if (!isOpen) return null;

  const keyGroups = [
    // Row 1: Common variables, exponents, roots, constants
    [
      { label: "x", value: "x", type: "var" },
      { label: "y", value: "y", type: "var" },
      { label: "a", value: "a", type: "var" },
      { label: "b", value: "b", type: "var" },
      { label: "x²", value: "^2", type: "op" },
      { label: "aᵇ", value: "^", type: "op" },
      { label: "√x", value: "sqrt(", type: "fn" },
      { label: "π", value: "pi", type: "const" },
      { label: "e", value: "e", type: "const" },
      { label: "|x|", value: "abs(", type: "fn" },
    ],
    // Row 2: Trig, Logs, Parens, Arithmetic
    [
      { label: "sin", value: "sin(", type: "fn" },
      { label: "cos", value: "cos(", type: "fn" },
      { label: "tan", value: "tan(", type: "fn" },
      { label: "ln", value: "ln(", type: "fn" },
      { label: "log", value: "log(", type: "fn" },
      { label: "(", value: "(", type: "op" },
      { label: ")", value: ")", type: "op" },
      { label: "÷", value: "/", type: "op" },
      { label: "×", value: "*", type: "op" },
      { label: "⌫", action: "backspace", type: "action" },
    ],
    // Row 3: Numbers 7-9, relations, operators
    [
      { label: "7", value: "7", type: "num" },
      { label: "8", value: "8", type: "num" },
      { label: "9", value: "9", type: "num" },
      { label: "−", value: "-", type: "op" },
      { label: "<", value: "<", type: "op" },
      { label: ">", value: ">", type: "op" },
      { label: "≤", value: "<=", type: "op" },
      { label: "≥", value: ">=", type: "op" },
      { label: "=", value: "=", type: "op" },
      { label: "AC", action: "clear", type: "action" },
    ],
    // Row 4: Numbers 4-6, 1-3, 0, dot, etc.
    [
      { label: "4", value: "4", type: "num" },
      { label: "5", value: "5", type: "num" },
      { label: "6", value: "6", type: "num" },
      { label: "+", value: "+", type: "op" },
      { label: "1", value: "1", type: "num" },
      { label: "2", value: "2", type: "num" },
      { label: "3", value: "3", type: "num" },
      { label: "0", value: "0", type: "num" },
      { label: ".", value: ".", type: "num" },
      { label: "Hide", action: "close", type: "action" },
    ],
  ];

  const handleKeyClick = (
    key: { label: string; value?: string; action?: string; type: string },
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    if (key.action === "backspace") {
      onBackspace();
    } else if (key.action === "clear") {
      onClear();
    } else if (key.action === "close") {
      onClose();
    } else if (key.value) {
      onInsert(key.value);
    }
  };

  return (
    <div
      data-testid="math-keypad"
      className="absolute bottom-0 right-0 z-40 bg-black/92 backdrop-blur-2xl border-t border-white/15 px-2 sm:px-4 py-2 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
      style={{
        left: !isMobile && isSidebarOpen ? 320 : 0,
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
        {/* Header bar with title & hide button */}
        <div className="flex items-center justify-between px-1 pb-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
            Desmos Math Keypad
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] font-mono text-white/60 hover:text-white transition-colors px-2 py-0.5 rounded bg-white/5 hover:bg-white/10"
            aria-label="Hide keypad"
          >
            <span>Close</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="flex flex-col gap-1">
          {keyGroups.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-10 gap-1">
              {row.map((k, cIdx) => {
                let colorClass = "bg-white/5 text-foreground/80 hover:bg-white/12 active:bg-white/20";

                if (k.type === "num") {
                  colorClass = "bg-white/10 text-white font-semibold hover:bg-white/20 active:bg-white/30";
                } else if (k.type === "var") {
                  colorClass = "bg-quantum/15 text-quantum font-mono italic hover:bg-quantum/25 active:bg-quantum/35";
                } else if (k.type === "fn") {
                  colorClass = "bg-purple-500/15 text-purple-300 font-mono hover:bg-purple-500/25 active:bg-purple-500/35";
                } else if (k.type === "op") {
                  colorClass = "bg-amber-500/15 text-amber-300 font-semibold hover:bg-amber-500/25 active:bg-amber-500/35";
                } else if (k.type === "const") {
                  colorClass = "bg-emerald-500/15 text-emerald-300 font-serif hover:bg-emerald-500/25 active:bg-emerald-500/35";
                } else if (k.action === "backspace" || k.action === "clear") {
                  colorClass = "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 active:bg-rose-500/40";
                } else if (k.action === "close") {
                  colorClass = "bg-white/8 text-white/50 hover:bg-white/15 active:bg-white/20";
                }

                return (
                  <button
                    key={cIdx}
                    onMouseDown={(e) => handleKeyClick(k, e)}
                    className={`h-8 sm:h-9 text-xs sm:text-sm rounded-lg flex items-center justify-center transition-all select-none border border-white/5 shadow-sm active:scale-95 ${colorClass}`}
                    aria-label={k.label}
                  >
                    {k.action === "backspace" ? <Delete size={14} /> : k.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
