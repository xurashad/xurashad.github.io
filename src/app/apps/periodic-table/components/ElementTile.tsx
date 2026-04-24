"use client";

import { memo } from "react";
import type { Element } from "../lib/types";
import { getCategoryInfo } from "../lib/types";

interface Props {
  element: Element;
  onClick: (el: Element) => void;
  highlight: boolean;
}

export const ElementTile = memo(function ElementTile({ element, onClick, highlight }: Props) {
  const cat = getCategoryInfo(element.category);

  return (
    <button
      onClick={() => onClick(element)}
      className={`
        relative flex flex-col items-center justify-center
        rounded-md p-0.5 md:p-1 text-center
        transition-all duration-200 ease-out
        hover:scale-[1.15] hover:z-20 hover:shadow-xl
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300
        ${cat.bg} ${cat.text}
        ${highlight ? "ring-2 ring-white/80 shadow-lg scale-105 z-10" : ""}
      `}
      style={{
        gridColumnStart: element.xpos,
        gridRowStart: element.ypos,
      }}
      aria-label={`${element.name} (${element.symbol}), atomic number ${element.number}`}
    >
      <span className="text-[0.5rem] sm:text-[0.6rem] font-semibold opacity-80 leading-none">
        {element.number}
      </span>
      <span className="text-sm sm:text-base md:text-lg font-bold leading-tight">
        {element.symbol}
      </span>
      <span className="text-[0.4rem] sm:text-[0.55rem] truncate w-full opacity-75 leading-none hidden sm:block">
        {element.name}
      </span>
    </button>
  );
});
