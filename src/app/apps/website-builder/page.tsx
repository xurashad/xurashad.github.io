'use client';
// ============================================================
// Website Builder Pro — Launcher Page
// Opens the builder in a new window to keep it separate from
// the main site.
// ============================================================

import { useEffect, useState } from 'react';

export default function WebBuilderLauncher() {
  const [launched, setLaunched] = useState(false);

  const openBuilder = () => {
    const w = window.open(
      '/apps/website-builder/editor',
      'WebBuilderPro',
      'noopener'
    );
    if (w) setLaunched(true);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Icon */}
        <div style={styles.iconWrap}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>

        <h1 style={styles.title}>WebBuilder Pro</h1>
        <p style={styles.subtitle}>
          Professional drag-and-drop website builder.
          <br />
          Create stunning, responsive websites and export clean HTML/CSS.
        </p>

        <button onClick={openBuilder} style={styles.button}>
          {launched ? '↗ Open Again' : '🚀 Launch Builder'}
        </button>

        {launched && (
          <p style={styles.hint}>
            The builder opened in a new window.
            <br />
            If it was blocked, please allow pop-ups for this site.
          </p>
        )}

        <div style={styles.features}>
          <Feature icon="🎨" text="15+ section templates" />
          <Feature icon="📱" text="Responsive preview" />
          <Feature icon="⬇️" text="Export HTML/CSS ZIP" />
          <Feature icon="🌙" text="Light & dark themes" />
          <Feature icon="💾" text="Auto-save projects" />
          <Feature icon="⌨️" text="Keyboard shortcuts" />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={styles.feature}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.85rem', color: '#9090a8' }}>{text}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  card: {
    textAlign: 'center',
    maxWidth: 480,
    width: '100%',
  },
  iconWrap: {
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: '0 0 0.75rem',
  },
  subtitle: {
    fontSize: '1rem',
    lineHeight: 1.6,
    opacity: 0.65,
    margin: '0 0 2rem',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '14px 36px',
    fontSize: '1.05rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
  },
  hint: {
    marginTop: '1rem',
    fontSize: '0.8rem',
    color: '#6b6b80',
    lineHeight: 1.5,
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginTop: '2.5rem',
    paddingTop: '2rem',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  feature: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
  },
};
