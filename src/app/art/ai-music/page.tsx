import AiMusicClient from "./AiMusicClient";

export const metadata = {
  title: "AI Music Generations",
  description:
    "Listen to AI-composed music tracks with full generation metadata, prompts, and parameters.",
};

export default function AiMusicPage() {
  return <AiMusicClient />;
}
