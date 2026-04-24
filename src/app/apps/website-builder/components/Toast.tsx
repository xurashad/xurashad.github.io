"use client";

import { useEffect } from "react";
import type { ToastMessage } from "../lib/types";

interface Props {
  toasts: ToastMessage[];
}

export function Toast({ toasts }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="wb-toast-container">
      {toasts.map((t) => {
        const icons: Record<string, string> = {
          success: "✅",
          error: "❌",
          warning: "⚠️",
          info: "ℹ️",
        };
        return (
          <div key={t.id} className={`wb-toast ${t.type}`}>
            <span>{icons[t.type] || "ℹ️"}</span>
            <span>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}
