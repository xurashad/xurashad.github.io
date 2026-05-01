"use client";

import dynamic from "next/dynamic";

const ImgenApp = dynamic(() => import("./ImgenApp"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a12",
        color: "#9898b8",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.9rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>🎨</div>
        <div>Loading ArtForge AI…</div>
      </div>
    </div>
  ),
});

export default function ImgenClient() {
  return <ImgenApp />;
}
