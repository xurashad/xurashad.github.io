import type { Metadata } from "next";
import ChatbotClient from "./ChatbotClient";

export const metadata: Metadata = {
  title: "AI Chatbot | Rashad Hamidi",
  description:
    "Multi-model AI chatbot supporting 25+ LLMs for reasoning, coding, and writing, plus vision models for image understanding and Pixazo AI for image generation. Free and open-source.",
  keywords: [
    "AI",
    "chatbot",
    "LLM",
    "multi-model",
    "OpenRouter",
    "Pixazo",
    "image generation",
    "GPT",
    "Llama",
    "Gemma",
    "vision",
  ],
};

export default function ChatbotPage() {
  return <ChatbotClient />;
}
