"use client";

import dynamic from "next/dynamic";

const WebBuilderApp = dynamic(() => import("./WebBuilderApp"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0c0f1a",
        color: "#6b7280",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.9rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🌐</div>
        <div>Loading Website Builder Pro…</div>
      </div>
    </div>
  ),
});

export default function BuilderClient() {
  return <WebBuilderApp />;
}
