import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Open research datasets covering quantum physics simulations, astronomical data, and Palestinian demographic studies — all freely available for scientific exploration.",
};

export default function DatasetsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
