import AiImagesClient from "./AiImagesClient";

export const metadata = {
  title: "AI Image Generations",
  description:
    "Browse AI-generated artwork — filter by model, tags, and style. View full generation metadata, prompts, and multi-image posts.",
};

export default function AiImagesPage() {
  return <AiImagesClient />;
}
