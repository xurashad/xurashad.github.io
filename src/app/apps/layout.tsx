import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apps",
  description:
    "A showcase of software projects, tools, and applications built with physics-grade engineering — from quantum simulation to scientific data pipelines.",
};

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
