"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Encoder } from "./Encoder";
import { Decoder } from "./Decoder";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

type Tab = "encode" | "decode";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "encode", label: "Encode", icon: ArrowUpCircle },
  { id: "decode", label: "Decode", icon: ArrowDownCircle },
];

export function Base64App() {
  const [activeTab, setActiveTab] = useState<Tab>("encode");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tab bar */}
      <div className="flex justify-center mb-8 border-b border-white/8">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm outline-none transition-all duration-300 relative ${
                isActive
                  ? "text-quantum"
                  : "text-foreground/40 hover:text-foreground/65"
              }`}
            >
              <Icon size={16} />
              {label}
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-quantum to-quantum/50 rounded-t-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="glass-card p-6 sm:p-8"
        >
          {activeTab === "encode" ? <Encoder /> : <Decoder />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
