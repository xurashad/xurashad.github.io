// ============================================================
// Website Builder Pro — CSS & Media Engine
// ============================================================

import type {
  ElementStyles, SiteTheme, ElementNode, SectionNode,
  ResponsiveStyles, ViewportMode, ShapeDividerType,
  BuilderProject, PageData,
} from './types';
import { FONT_LIST } from './defaults';

/* ========== Style Object ↔ CSS ========== */

export function camelToKebab(str: string): string {
  if (str.startsWith('Webkit')) {
    return `-webkit-${str.slice(6).replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
  }
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/** Convert ElementStyles to inline CSS string */
export function stylesToCSS(styles: ElementStyles, important = false): string {
  const normalized: Record<string, string | undefined> = { ...(styles as Record<string, string | undefined>) };
  if (normalized.backgroundClip === 'text') {
    normalized.WebkitBackgroundClip = normalized.WebkitBackgroundClip || 'text';
    if (normalized.color === 'transparent') {
      normalized.WebkitTextFillColor = normalized.WebkitTextFillColor || 'transparent';
    }
  }
  return Object.entries(normalized)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => {
      const val = String(v);
      const suffix = important && !val.trim().endsWith('!important') ? ' !important' : '';
      return `${camelToKebab(k)}: ${val}${suffix}`;
    })
    .join('; ');
}

/** Convert ElementStyles to React CSSProperties */
export function stylesToReact(styles: ElementStyles): React.CSSProperties {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(styles)) {
    if (v !== undefined && v !== '') {
      result[k] = v;
    }
  }
  if (result.backgroundClip === 'text') {
    result.WebkitBackgroundClip = result.WebkitBackgroundClip || 'text';
    if (result.color === 'transparent') {
      result.WebkitTextFillColor = result.WebkitTextFillColor || 'transparent';
    }
  }
  return result as React.CSSProperties;
}

/** Merge base desktop styles with responsive breakpoint overrides */
export function mergeResponsiveStyles(
  base: ElementStyles,
  responsive: ResponsiveStyles | undefined,
  viewport: ViewportMode,
): ElementStyles {
  if (viewport === 'desktop' || !responsive) return base;
  if (viewport === 'tablet') {
    return { ...base, ...(responsive.tablet ?? {}) };
  }
  return {
    ...base,
    ...(responsive.tablet ?? {}),
    ...(responsive.mobile ?? {}),
  };
}

/* ========== Shape Dividers ========== */

export function getShapeDividerSVG(type: ShapeDividerType | undefined, flip = false): string {
  if (!type || type === 'none') return '';
  const transform = flip ? ' style="transform: rotate(180deg);"' : '';
  switch (type) {
    case 'wave':
      return `<svg viewBox="0 0 1200 120" preserveAspectRatio="none"${transform}><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="currentColor"></path></svg>`;
    case 'curve':
      return `<svg viewBox="0 0 1200 120" preserveAspectRatio="none"${transform}><path d="M0,0V120H1200V0C980,95,220,95,0,0Z" fill="currentColor"></path></svg>`;
    case 'slant':
      return `<svg viewBox="0 0 1200 120" preserveAspectRatio="none"${transform}><path d="M1200 120L0 0 0 120 1200 120z" fill="currentColor"></path></svg>`;
    case 'triangle':
      return `<svg viewBox="0 0 1200 120" preserveAspectRatio="none"${transform}><path d="M600,112.77,0,0V120H1200V0Z" fill="currentColor"></path></svg>`;
    default:
      return '';
  }
}

/* ========== Video & Map URL Helpers ========== */

export function normalizeVideoEmbedUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return '';
  try {
    // YouTube watch?v= or youtu.be/
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{6,})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && !url.includes('player.vimeo.com')) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }
  } catch {
    // fallback to original URL
  }
  return url;
}

export function buildGoogleMapsEmbedUrl(query: string, zoom = 13): string {
  const clean = encodeURIComponent(query.trim() || 'New York');
  return `https://maps.google.com/maps?q=${clean}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
}

/* ========== Fonts & Theme CSS Variables ========== */

function getFontFamily(name: string): string {
  const found = FONT_LIST.find(f => f.name === name);
  return found ? found.family : `'${name}', sans-serif`;
}

export function collectUsedFonts(project: BuilderProject): string[] {
  const names = new Set<string>();
  if (project.theme.fonts.heading) names.add(project.theme.fonts.heading);
  if (project.theme.fonts.body) names.add(project.theme.fonts.body);

  const matchFont = (fam?: string) => {
    if (!fam) return;
    for (const def of FONT_LIST) {
      if (fam.includes(def.name)) names.add(def.name);
    }
  };

  const walkElements = (els: ElementNode[]) => {
    for (const el of els) {
      matchFont(el.styles.fontFamily);
      matchFont(el.responsiveStyles?.tablet?.fontFamily);
      matchFont(el.responsiveStyles?.mobile?.fontFamily);
      if (el.children.length > 0) walkElements(el.children);
    }
  };

  const walkSection = (sec: SectionNode) => {
    matchFont(sec.styles.fontFamily);
    for (const r of sec.rows) {
      for (const c of r.columns) {
        walkElements(c.elements);
      }
    }
  };

  walkSection(project.header);
  walkSection(project.footer);
  for (const page of Object.values(project.pages)) {
    for (const sec of page.sections) {
      walkSection(sec);
    }
  }
  return [...names];
}

export function getGoogleFontsUrl(theme: SiteTheme, extraFonts: string[] = []): string {
  const params = new Set<string>();
  const addFont = (name: string) => {
    const def = FONT_LIST.find(f => f.name === name);
    if (def?.googleUrl) params.add(def.googleUrl);
  };
  addFont(theme.fonts.heading);
  addFont(theme.fonts.body);
  extraFonts.forEach(addFont);
  if (params.size === 0) return '';
  return `https://fonts.googleapis.com/css2?${[...params].map(f => `family=${f}`).join('&')}&display=swap`;
}

export function generateThemeCSS(theme: SiteTheme): string {
  const accentSec = theme.accentSecondary || '#a855f7';
  const maxWidth = theme.containerMaxWidth || '1200px';
  return `
:root {
  --site-accent: ${theme.accent};
  --site-accent-2: ${accentSec};
  --site-container: ${maxWidth};
  --font-heading: ${getFontFamily(theme.fonts.heading)};
  --font-body: ${getFontFamily(theme.fonts.body)};
  --radius: ${theme.borderRadius};
}

/* Light theme */
[data-theme="light"] {
  --site-bg: ${theme.light.bg};
  --site-text: ${theme.light.text};
  --site-surface: ${theme.light.surface};
  --site-border: ${theme.light.border};
  --site-accent: ${theme.accent};
  --site-accent-2: ${accentSec};
  color-scheme: light;
}

/* Dark theme */
[data-theme="dark"] {
  --site-bg: ${theme.dark.bg};
  --site-text: ${theme.dark.text};
  --site-surface: ${theme.dark.surface};
  --site-border: ${theme.dark.border};
  --site-accent: ${theme.accent};
  --site-accent-2: ${accentSec};
  color-scheme: dark;
}
`;
}

/* ========== Hover & Responsive Export CSS ========== */

export function generateElementHoverCSS(elementId: string, hoverStyles: ElementStyles): string {
  const css = stylesToCSS(hoverStyles, true);
  if (!css) return '';
  return `[data-id="${elementId}"]:hover { ${css}; }`;
}

export function collectHoverCSS(sections: SectionNode[]): string {
  const rules: string[] = [];
  const walk = (elements: ElementNode[]) => {
    for (const el of elements) {
      const hover = generateElementHoverCSS(el.id, el.hoverStyles);
      if (hover) rules.push(hover);
      if (el.children.length > 0) walk(el.children);
    }
  };
  for (const sec of sections) {
    for (const row of sec.rows) {
      for (const col of row.columns) {
        walk(col.elements);
      }
    }
  }
  return rules.join('\n');
}

export function generateResponsiveCSS(sections: SectionNode[]): string {
  const tabletRules: string[] = [];
  const mobileRules: string[] = [];

  const addOverrides = (selector: string, resp?: ResponsiveStyles) => {
    if (!resp) return;
    if (resp.tablet) {
      const css = stylesToCSS(resp.tablet, true);
      if (css) tabletRules.push(`  ${selector} { ${css}; }`);
    }
    if (resp.mobile) {
      const css = stylesToCSS(resp.mobile, true);
      if (css) mobileRules.push(`  ${selector} { ${css}; }`);
    }
  };

  const walkElements = (elements: ElementNode[]) => {
    for (const el of elements) {
      addOverrides(`[data-id="${el.id}"]`, el.responsiveStyles);
      if (el.children.length > 0) walkElements(el.children);
    }
  };

  for (const sec of sections) {
    addOverrides(`[data-sec-id="${sec.id}"]`, sec.responsiveStyles);
    for (const row of sec.rows) {
      for (const col of row.columns) {
        walkElements(col.elements);
      }
    }
  }

  const out: string[] = [];
  if (tabletRules.length > 0) {
    out.push(`@media (max-width: 1024px) {\n${tabletRules.join('\n')}\n}`);
  }
  if (mobileRules.length > 0) {
    out.push(`@media (max-width: 768px) {\n${mobileRules.join('\n')}\n}`);
  }
  return out.join('\n');
}

/* ========== Live Editor Canvas CSS ========== */

export function generateCanvasLiveCSS(project: BuilderProject, page: PageData | null): string {
  const hoverRules: string[] = [];
  const walkHover = (elements: ElementNode[]) => {
    for (const el of elements) {
      const css = stylesToCSS(el.hoverStyles, true);
      if (css) {
        hoverRules.push(`[data-builder-id="${el.id}"]:hover > :first-child { ${css}; }`);
      }
      if (el.children.length > 0) walkHover(el.children);
    }
  };
  const liveSections = [...(page?.sections ?? []), project.footer];
  for (const sec of liveSections) {
    for (const row of sec.rows) {
      for (const col of row.columns) {
        walkHover(col.elements);
      }
    }
  }

  return `
/* Canvas Viewport Grid Responsiveness */
.wb-canvas-row {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  width: 100%;
}
[data-viewport="tablet"] .wb-canvas-row {
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
[data-viewport="tablet"] .wb-canvas-col[data-span="12"] {
  grid-column: span 2 !important;
}
[data-viewport="tablet"] .wb-canvas-col:not([data-span="12"]) {
  grid-column: span 1 !important;
}
[data-viewport="mobile"] .wb-canvas-row {
  grid-template-columns: 1fr !important;
  gap: 1rem;
}
[data-viewport="mobile"] .wb-canvas-col {
  grid-column: span 1 !important;
}

/* Widget styles on canvas */
${generateWidgetsCSS()}

/* Live hover preview */
${hoverRules.join('\n')}

/* Entrance keyframes */
${generateAnimationsCSS()}

/* User global CSS scoped inside canvas */
${project.settings.globalCSS || ''}
`;
}

/* ========== Shared Widgets & Animations CSS ========== */

export function generateAnimationsCSS(): string {
  return `
@keyframes wbFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes wbFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes wbFadeDown { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes wbFadeLeft { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
@keyframes wbFadeRight { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
@keyframes wbZoomIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
@keyframes wbBounceIn { 0% { opacity: 0; transform: scale(0.86); } 65% { opacity: 1; transform: scale(1.03); } 100% { opacity: 1; transform: scale(1); } }
@keyframes wbFlipUp { from { opacity: 0; transform: perspective(700px) rotateX(12deg) translateY(18px); } to { opacity: 1; transform: perspective(700px) rotateX(0deg) translateY(0); } }

.wb-anim { opacity: 0; }
.wb-anim.is-visible { animation-fill-mode: both; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }
.wb-anim-fadeIn.is-visible { animation-name: wbFadeIn; }
.wb-anim-fadeUp.is-visible { animation-name: wbFadeUp; }
.wb-anim-fadeDown.is-visible { animation-name: wbFadeDown; }
.wb-anim-fadeLeft.is-visible { animation-name: wbFadeLeft; }
.wb-anim-fadeRight.is-visible { animation-name: wbFadeRight; }
.wb-anim-zoomIn.is-visible { animation-name: wbZoomIn; }
.wb-anim-bounceIn.is-visible { animation-name: wbBounceIn; }
.wb-anim-flipUp.is-visible { animation-name: wbFlipUp; }
`;
}

export function generateWidgetsCSS(): string {
  return `
/* Badge */
.wb-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
}
.wb-badge-soft {
  background: color-mix(in srgb, var(--site-accent) 14%, transparent);
  color: var(--site-accent);
  border: 1px solid color-mix(in srgb, var(--site-accent) 26%, transparent);
}
.wb-badge-solid {
  background: var(--site-accent);
  color: #ffffff;
}
.wb-badge-outline {
  background: transparent;
  color: var(--site-text);
  border: 1px solid var(--site-border);
}

/* Card */
.wb-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.wb-card-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: calc(var(--radius, 10px) - 2px);
  margin-bottom: 1.15rem;
}
.wb-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--site-accent) 14%, transparent);
  color: var(--site-accent);
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.wb-card-title {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.wb-card-desc {
  font-size: 0.95rem;
  line-height: 1.65;
  opacity: 0.78;
  flex: 1;
}
.wb-card-cta {
  display: inline-block;
  margin-top: 1.1rem;
  color: var(--site-accent);
  font-weight: 600;
  font-size: 0.92rem;
}

/* Accordion */
.wb-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}
.wb-acc-item {
  border: 1px solid var(--site-border);
  border-radius: var(--radius, 10px);
  background: var(--site-surface);
  overflow: hidden;
  transition: border-color 0.2s ease;
}
.wb-acc-item.open {
  border-color: var(--site-accent);
}
.wb-acc-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  text-align: left;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 1rem;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: none;
}
.wb-acc-chevron {
  transition: transform 0.25s ease;
  opacity: 0.65;
  flex-shrink: 0;
}
.wb-acc-item.open .wb-acc-chevron {
  transform: rotate(180deg);
  color: var(--site-accent);
  opacity: 1;
}
.wb-acc-body {
  padding: 0 1.25rem 1.1rem;
  font-size: 0.95rem;
  line-height: 1.7;
  opacity: 0.8;
}

/* Tabs */
.wb-tabs { width: 100%; }
.wb-tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  border-bottom: 1px solid var(--site-border);
  margin-bottom: 1.25rem;
}
.wb-tabs.pills .wb-tabs-nav {
  border-bottom: none;
  background: var(--site-surface);
  padding: 0.3rem;
  border-radius: var(--radius, 10px);
  border: 1px solid var(--site-border);
  display: inline-flex;
}
.wb-tab-btn {
  padding: 0.65rem 1.15rem;
  font-weight: 600;
  font-size: 0.92rem;
  color: inherit;
  opacity: 0.65;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}
.wb-tab-btn.active {
  opacity: 1;
  color: var(--site-accent);
  border-bottom-color: var(--site-accent);
}
.wb-tabs.pills .wb-tab-btn {
  border-bottom: none;
  border-radius: calc(var(--radius, 10px) - 3px);
}
.wb-tabs.pills .wb-tab-btn.active {
  background: var(--site-accent);
  color: #ffffff;
}
.wb-tab-panel {
  font-size: 0.98rem;
  line-height: 1.7;
  opacity: 0.85;
}

/* Progress Bar */
.wb-progress-wrap { width: 100%; }
.wb-progress-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.45rem;
}
.wb-progress-track {
  width: 100%;
  height: 10px;
  border-radius: 9999px;
  background: var(--site-border);
  overflow: hidden;
}
.wb-progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.5s ease;
}

/* Alert Callout */
.wb-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  border-radius: var(--radius, 10px);
  border: 1px solid;
  text-align: left;
}
.wb-alert-info { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3); }
.wb-alert-info .wb-alert-icon { color: #3b82f6; }
.wb-alert-success { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); }
.wb-alert-success .wb-alert-icon { color: #22c55e; }
.wb-alert-warning { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); }
.wb-alert-warning .wb-alert-icon { color: #f59e0b; }
.wb-alert-danger { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); }
.wb-alert-danger .wb-alert-icon { color: #ef4444; }
.wb-alert-icon { font-size: 1.1rem; margin-top: 0.15rem; flex-shrink: 0; }
.wb-alert-title { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.2rem; }
.wb-alert-text { font-size: 0.9rem; line-height: 1.55; opacity: 0.88; }

/* Stat KPI */
.wb-stat-value {
  font-family: var(--font-heading);
  font-size: 2.35rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--site-accent);
  margin-bottom: 0.4rem;
}
.wb-stat-label {
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.72;
}
.wb-stat-delta {
  display: inline-block;
  margin-top: 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}
.wb-stat-delta.pos { background: rgba(34,197,94,0.14); color: #16a34a; }
.wb-stat-delta.neg { background: rgba(239,68,68,0.14); color: #dc2626; }

/* Table */
.wb-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  border: 1px solid var(--site-border);
  border-radius: var(--radius, 10px);
  overflow: hidden;
}
.wb-table th {
  background: var(--site-surface);
  font-family: var(--font-heading);
  font-weight: 600;
  text-align: left;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--site-border);
}
.wb-table td {
  padding: 0.8rem 1.1rem;
  border-bottom: 1px solid var(--site-border);
}
.wb-table.striped tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--site-surface) 60%, transparent);
}
.wb-table tr:last-child td { border-bottom: none; }

/* Avatar */
.wb-avatar { display: flex; align-items: center; gap: 0.875rem; }
.wb-avatar-img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.wb-avatar-name { font-weight: 700; font-size: 0.95rem; }
.wb-avatar-role { font-size: 0.83rem; opacity: 0.65; }
.wb-avatar-stars { color: #f59e0b; font-size: 0.75rem; margin-top: 0.2rem; display: flex; gap: 2px; }

/* Checklist & Code Copy */
.wb-checklist { list-style: none !important; padding-left: 0 !important; }
.wb-checklist li { position: relative; padding-left: 1.5rem; margin-bottom: 0.4rem; }
.wb-checklist li::before {
  content: '✓';
  position: absolute;
  left: 0;
  font-weight: 700;
  color: inherit;
}
.wb-code-wrap { position: relative; }
.wb-code-copy {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  background: rgba(255,255,255,0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  cursor: pointer;
}

/* Social Links variants */
.wb-social-links.circle a, .wb-social-links.filled a {
  width: 36px; height: 36px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--site-border);
  transition: all 0.2s ease;
}
.wb-social-links.filled a {
  background: var(--site-accent); color: #ffffff; border-color: transparent;
}
.wb-social-links.pill a {
  padding: 0.35rem 0.85rem; border-radius: 9999px;
  border: 1px solid var(--site-border); font-size: 0.85rem;
  display: inline-flex; align-items: center; gap: 0.4rem;
}

/* Section Shape Dividers */
.wb-section { position: relative; }
.wb-section-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.wb-section-inner { position: relative; z-index: 2; }
.wb-shape-divider {
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;
  pointer-events: none;
  z-index: 2;
}
.wb-shape-divider.top { top: -1px; }
.wb-shape-divider.bottom { bottom: -1px; }
.wb-shape-divider svg { width: 100%; height: 48px; display: block; }
`;
}

/* ========== Full Base CSS for Exported Sites ========== */

export function generateBaseCSS(theme: SiteTheme): string {
  return `/* Generated by Website Builder Pro */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  background: var(--site-bg);
  color: var(--site-text);
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; border: none; background: none; font: inherit; }
ul, ol { list-style-position: inside; }

${generateThemeCSS(theme)}

/* Header & Navigation */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--site-bg);
  border-bottom: 1px solid var(--site-border);
}
.site-header.header-glass {
  background: color-mix(in srgb, var(--site-bg) 82%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.wb-header-inner {
  max-width: var(--site-container, 1200px);
  margin: 0 auto;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.site-header.header-centered .wb-header-inner {
  flex-direction: column;
  gap: 0.75rem;
}
.wb-header-brand {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}
.wb-header-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.wb-nav-link {
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius, 8px);
  font-weight: 500;
  font-size: 0.92rem;
  opacity: 0.78;
  transition: all 0.15s ease;
}
.wb-nav-link:hover, .wb-nav-link.active {
  opacity: 1;
  background: color-mix(in srgb, var(--site-accent) 12%, transparent);
  color: var(--site-accent);
}
.wb-header-cta {
  padding: 0.5rem 1.15rem;
  background: var(--site-accent);
  color: #ffffff;
  border-radius: var(--radius, 8px);
  font-weight: 600;
  font-size: 0.88rem;
  white-space: nowrap;
  transition: opacity 0.2s;
}
.wb-header-cta:hover { opacity: 0.9; }
.wb-mobile-toggle {
  display: none;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--site-border);
  border-radius: var(--radius, 8px);
  color: inherit;
  font-size: 1.1rem;
}
.wb-mobile-drawer {
  display: none;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 1.5rem 1.25rem;
  border-top: 1px solid var(--site-border);
  background: var(--site-bg);
}
.wb-mobile-drawer.open { display: flex; }

.site-footer { background: var(--site-surface); }
.wb-section { width: 100%; }
.wb-section-inner {
  max-width: var(--site-container, 1200px);
  margin: 0 auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.wb-section.full-bleed .wb-section-inner {
  max-width: 100%;
  padding-left: 0;
  padding-right: 0;
}

/* Grid */
.wb-row {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.5rem;
  width: 100%;
}
.wb-col { min-width: 0; }
.wb-col-1 { grid-column: span 1; }
.wb-col-2 { grid-column: span 2; }
.wb-col-3 { grid-column: span 3; }
.wb-col-4 { grid-column: span 4; }
.wb-col-5 { grid-column: span 5; }
.wb-col-6 { grid-column: span 6; }
.wb-col-7 { grid-column: span 7; }
.wb-col-8 { grid-column: span 8; }
.wb-col-9 { grid-column: span 9; }
.wb-col-10 { grid-column: span 10; }
.wb-col-11 { grid-column: span 11; }
.wb-col-12 { grid-column: span 12; }

/* Base Elements */
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); line-height: 1.2; }
.wb-btn { display: inline-block; cursor: pointer; transition: all 0.2s ease; }
.wb-btn:hover { opacity: 0.9; }
.wb-icon { display: inline-block; }
.wb-video-wrapper { position: relative; width: 100%; }
.wb-video-wrapper iframe, .wb-map iframe, .wb-embed iframe { width: 100%; height: 100%; border: none; }
.wb-code { overflow-x: auto; }
.wb-social-links { display: flex; gap: 0.75rem; align-items: center; }
.wb-social-links a { transition: opacity 0.2s, transform 0.2s; }
.wb-social-links a:hover { opacity: 0.8; transform: translateY(-1px); }

/* Forms */
.wb-form input:not([type="checkbox"]),
.wb-form textarea,
.wb-form select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--site-border);
  border-radius: var(--radius);
  background: var(--site-bg);
  color: var(--site-text);
  font-family: var(--font-body);
  font-size: 1rem;
  transition: border-color 0.2s;
}
.wb-form input:focus, .wb-form textarea:focus, .wb-form select:focus {
  outline: none;
  border-color: var(--site-accent);
}
.wb-form label { display: block; margin-bottom: 0.375rem; font-weight: 500; font-size: 0.875rem; }
.wb-form .form-group { display: flex; flex-direction: column; }
.wb-form .form-check { display: flex; align-items: center; gap: 0.5rem; }
.wb-form .form-check label { margin-bottom: 0; }
.wb-form button[type="submit"] {
  padding: 0.75rem 2rem;
  background: var(--site-accent);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.wb-form button[type="submit"]:hover { opacity: 0.9; }
.wb-form-feedback {
  padding: 0.85rem 1rem;
  border-radius: var(--radius);
  background: rgba(34, 197, 94, 0.14);
  color: #16a34a;
  font-weight: 600;
  font-size: 0.92rem;
  display: none;
}
.wb-form-feedback.visible { display: block; }

${generateWidgetsCSS()}
${generateAnimationsCSS()}

/* Theme Toggle */
.theme-toggle {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--site-surface);
  border: 1px solid var(--site-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  z-index: 1000;
  transition: transform 0.2s;
  box-shadow: 0 4px 16px rgba(0,0,0,0.14);
}
.theme-toggle:hover { transform: scale(1.08); }

/* Responsive */
@media (max-width: 1024px) {
  .wb-row { grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
  .wb-col-12 { grid-column: span 2; }
  .wb-col-1, .wb-col-2, .wb-col-3, .wb-col-4, .wb-col-5, .wb-col-6,
  .wb-col-7, .wb-col-8, .wb-col-9, .wb-col-10, .wb-col-11 { grid-column: span 1; }
}
@media (max-width: 768px) {
  .wb-header-nav, .wb-header-cta { display: none; }
  .wb-mobile-toggle { display: inline-flex; align-items: center; justify-content: center; }
  .wb-row { grid-template-columns: 1fr; gap: 1rem; }
  .wb-col-1, .wb-col-2, .wb-col-3, .wb-col-4, .wb-col-5, .wb-col-6,
  .wb-col-7, .wb-col-8, .wb-col-9, .wb-col-10, .wb-col-11, .wb-col-12 { grid-column: span 1; }
  .wb-section-inner { padding-left: 1rem; padding-right: 1rem; }
  h1 { font-size: 2rem !important; }
  h2 { font-size: 1.5rem !important; }
}
`;
}
