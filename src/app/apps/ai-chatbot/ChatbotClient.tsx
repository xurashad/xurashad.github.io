"use client";

import dynamic from "next/dynamic";

const ChatbotApp = dynamic(() => import("./ChatbotApp"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1115",
        color: "#94a3b8",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.9rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🤖</div>
        <div>Loading AI Chatbot…</div>
      </div>
    </div>
  ),
});

export default function ChatbotClient() {
  return <ChatbotApp />;
}
