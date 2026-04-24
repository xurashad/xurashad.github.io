import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Palestine 🇵🇸",
  description:
    "A tribute to Palestinian culture, history, resilience, and the eternal right to freedom. From the river to the sea — with poetry, mathematics, and solidarity.",
};

export default function PalestineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
