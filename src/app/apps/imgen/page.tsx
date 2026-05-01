import type { Metadata } from "next";
import ImgenClient from "./ImgenClient";

export const metadata: Metadata = {
  title: "ArtForge AI — Image Generator | Rashad Hamidi",
  description:
    "Generate stunning AI images with advanced controls. Anime, realistic, fantasy and more styles powered by cutting-edge AI models via Pollinations.ai — 100% free, no sign-up.",
  keywords: [
    "AI",
    "image generator",
    "art",
    "anime",
    "Pollinations",
    "Flux",
    "text to image",
    "free",
  ],
};

export default function ImgenPage() {
  return <ImgenClient />;
}
