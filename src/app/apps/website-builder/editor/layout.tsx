// ============================================================
// Website Builder Pro — Editor Layout (hides parent site chrome)
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WebBuilder Pro — Editor",
  description:
    "Professional drag-and-drop website builder editor.",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
