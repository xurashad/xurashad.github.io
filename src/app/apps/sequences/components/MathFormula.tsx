"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Props {
  tex: string;
  displayMode?: boolean;
  className?: string;
}

export function MathFormula({ tex, displayMode = false, className = "" }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode,
        strict: false,
      });
    } catch {
      return tex;
    }
  }, [tex, displayMode]);

  return (
    <span
      className={`seq-katex inline-block max-w-full overflow-x-auto align-middle ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
