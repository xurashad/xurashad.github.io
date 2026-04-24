import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach out for research collaborations, postdoctoral opportunities, public lectures, or Palestine initiative inquiries. Quantum entanglement across any distance.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
