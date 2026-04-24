import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV — Rashad Hamidi",
  description:
    "Curriculum Vitae of Rashad Hamidi — PhD researcher in Mathematical and Theoretical Physics at Durham University, specialising in integrable sigma models, string theory, and supersymmetry.",
};

export default function CVLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
