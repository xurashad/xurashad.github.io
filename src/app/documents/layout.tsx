import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents",
  description:
    "A vault of research papers, whitepapers, lecture notes, and archived documents spanning theoretical physics and interdisciplinary studies.",
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
