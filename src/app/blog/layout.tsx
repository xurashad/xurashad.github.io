import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Long-form writing on theoretical physics, quantum mechanics, Palestinian culture, and the intersection of science with solidarity and human resilience.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
