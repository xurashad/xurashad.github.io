// ============================================================
// Website Builder Pro — Defaults, Factories & Presets
// ============================================================

import type {
  ElementNode, ElementType, HeadingLevel,
  SectionNode, RowNode, ColumnNode, PageData, PageSEO,
  BuilderProject, SiteTheme, ProjectSettings, ThemePreset,
  FontDef, GradientPreset, ShadowPreset, AnimationPreset,
  ColumnLayoutPreset, FormField, AccordionItem, TabItem, TableData,
} from './types';

/* ========== ID Generation ========== */

let _counter = 0;
export function uid(prefix = 'el'): string {
  return `${prefix}_${++_counter}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ========== Element Factories ========== */

const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: 'f_name', type: 'text', label: 'Name', name: 'name', placeholder: 'Your full name', required: true },
  { id: 'f_email', type: 'email', label: 'Email', name: 'email', placeholder: 'you@example.com', required: true },
  { id: 'f_msg', type: 'textarea', label: 'Message', name: 'message', placeholder: 'Tell us about your project...', required: true },
];

const DEFAULT_ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: 'acc_1',
    title: 'How quickly can I launch my website?',
    content: 'Pick any starter site or drag-and-drop pre-built sections, customize your colors and fonts, and export production-ready HTML/CSS/JS in minutes.',
    openByDefault: true,
  },
  {
    id: 'acc_2',
    title: 'Is the exported code clean and self-hosted?',
    content: 'Yes! Every export generates semantic HTML5, modern CSS with light/dark theme variables, and zero external framework dependencies.',
    openByDefault: false,
  },
  {
    id: 'acc_3',
    title: 'Can I customize tablet and mobile layouts?',
    content: 'Switch to Tablet or Mobile viewports at the top bar to preview responsive grids and customize per-breakpoint style overrides.',
    openByDefault: false,
  },
];

const DEFAULT_TAB_ITEMS: TabItem[] = [
  {
    id: 'tab_1',
    label: 'Visual Design',
    content: 'Craft responsive pages using our 12-column grid, visual box-model controls, curated color palettes, and 20+ Google Fonts.',
  },
  {
    id: 'tab_2',
    label: 'Interactive Widgets',
    content: 'Drop in accordions, tabs, custom forms, pricing comparison tables, stat counters, and entrance animations that work out of the box.',
  },
  {
    id: 'tab_3',
    label: 'Clean Export',
    content: 'Inspect live HTML, CSS, and JavaScript at any moment or download a complete multi-page ZIP bundle with sitemap.xml and assets.',
  },
];

const DEFAULT_TABLE_DATA: TableData = {
  headers: ['Feature', 'Starter', 'Studio Pro'],
  rows: [
    ['Custom Pages', 'Up to 5', 'Unlimited'],
    ['Responsive Controls', 'Included', 'Included'],
    ['Code & ZIP Export', 'Included', 'Included'],
    ['Priority Support', 'Community', '24/7 Direct'],
  ],
  striped: true,
};

export function createElement(
  type: ElementType,
  overrides?: Partial<ElementNode>,
): ElementNode {
  const defaults = ELEMENT_DEFAULTS[type] ?? {};
  const mergedStyles = {
    ...(defaults.styles ?? {}),
    ...(overrides?.styles ?? {}),
  };
  const mergedHoverStyles = {
    ...(defaults.hoverStyles ?? {}),
    ...(overrides?.hoverStyles ?? {}),
  };
  const mergedAttributes = {
    ...(defaults.attributes ?? {}),
    ...(overrides?.attributes ?? {}),
  };

  return {
    id: overrides?.id ?? uid(type),
    type,
    name: overrides?.name ?? defaults.name,
    content: overrides?.content ?? defaults.content ?? '',
    headingLevel: overrides?.headingLevel ?? defaults.headingLevel,
    styles: mergedStyles,
    hoverStyles: mergedHoverStyles,
    responsiveStyles: overrides?.responsiveStyles ?? (defaults.responsiveStyles ? { ...defaults.responsiveStyles } : undefined),
    animation: overrides?.animation ?? (defaults.animation ? { ...defaults.animation } : undefined),
    customClass: overrides?.customClass,
    customId: overrides?.customId,
    attributes: mergedAttributes,
    children: overrides?.children ?? (defaults.children ? [...defaults.children] : []),
    locked: overrides?.locked ?? false,
    hidden: overrides?.hidden ?? false,
  };
}

const ELEMENT_DEFAULTS: Record<ElementType, Partial<ElementNode>> = {
  heading: {
    content: 'Heading',
    headingLevel: 2 as HeadingLevel,
    styles: { fontSize: '2rem', fontWeight: '700', lineHeight: '1.2', marginBottom: '0.5rem' },
  },
  paragraph: {
    content: 'Craft compelling digital experiences with crisp typography, responsive layouts, and clean semantic code.',
    styles: { fontSize: '1rem', lineHeight: '1.7', marginBottom: '1rem', color: 'inherit' },
  },
  button: {
    content: 'Get Started',
    attributes: { href: '#', target: '' },
    styles: {
      display: 'inline-block',
      backgroundColor: 'var(--site-accent)',
      color: '#ffffff',
      paddingTop: '12px', paddingRight: '28px', paddingBottom: '12px', paddingLeft: '28px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '1rem',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
    },
    hoverStyles: {
      opacity: '0.9',
      transform: 'translateY(-1px)',
    },
  },
  link: {
    content: 'Learn more →',
    attributes: { href: '#', target: '' },
    styles: {
      color: 'var(--site-accent)',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s ease',
    },
    hoverStyles: { textDecoration: 'underline' },
  },
  image: {
    content: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    attributes: { alt: 'Scenic mountain landscape' },
    styles: { width: '100%', height: 'auto', borderRadius: '10px', objectFit: 'cover' },
  },
  video: {
    content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    styles: { width: '100%', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden' },
  },
  icon: {
    content: 'fas fa-star',
    styles: { fontSize: '2rem', color: 'var(--site-accent)', textAlign: 'center' },
  },
  list: {
    content: '<li>First item in the list</li><li>Second item with details</li><li>Third item to complete</li>',
    attributes: { listTag: 'ul' },
    styles: {
      fontSize: '1rem', lineHeight: '1.7', paddingLeft: '1.5rem',
      marginBottom: '1rem', listStyleType: 'disc',
    },
  },
  blockquote: {
    content: '"Design is not just what it looks like and feels like. Design is how it works."',
    styles: {
      fontSize: '1.125rem', lineHeight: '1.7', fontStyle: 'italic',
      borderLeft: '4px solid var(--site-accent)',
      paddingLeft: '1.5rem', paddingTop: '0.5rem', paddingBottom: '0.5rem',
      marginBottom: '1rem', color: 'inherit', opacity: '0.9',
    },
  },
  code: {
    content: 'const builder = createStudio({\n  theme: "aurora",\n  exportCleanHTML: true,\n});',
    attributes: { language: 'typescript', showCopy: 'true' },
    styles: {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '0.875rem', lineHeight: '1.6',
      backgroundColor: '#13131d', color: '#e2e8f0',
      paddingTop: '1rem', paddingRight: '1.25rem', paddingBottom: '1rem', paddingLeft: '1.25rem',
      borderRadius: '10px', overflow: 'auto', whiteSpace: 'pre',
    },
  },
  divider: {
    content: '',
    styles: {
      width: '100%', height: '1px', backgroundColor: 'var(--site-border)',
      marginTop: '1.5rem', marginBottom: '1.5rem',
    },
  },
  spacer: {
    content: '',
    styles: { width: '100%', height: '48px' },
  },
  form: {
    content: '',
    attributes: {
      action: '#',
      method: 'POST',
      submitText: 'Send Message',
      successMessage: 'Thanks! Your message has been received.',
      fields: JSON.stringify(DEFAULT_FORM_FIELDS),
    },
    styles: {
      display: 'flex', flexDirection: 'column', gap: '1rem',
      width: '100%', maxWidth: '520px',
    },
    children: [],
  },
  map: {
    content: 'https://maps.google.com/maps?q=New+York&t=&z=13&ie=UTF8&iwloc=&output=embed',
    attributes: { query: 'New York', zoom: '13' },
    styles: { width: '100%', height: '380px', borderRadius: '10px', overflow: 'hidden' },
  },
  embed: {
    content: '',
    attributes: { title: 'Embed' },
    styles: { width: '100%', height: '380px', borderRadius: '10px', overflow: 'hidden' },
  },
  'social-links': {
    content: '',
    attributes: {
      variant: 'circle',
      links: JSON.stringify([
        { platform: 'X / Twitter', url: '#', icon: 'fab fa-x-twitter' },
        { platform: 'GitHub', url: '#', icon: 'fab fa-github' },
        { platform: 'LinkedIn', url: '#', icon: 'fab fa-linkedin-in' },
        { platform: 'Instagram', url: '#', icon: 'fab fa-instagram' },
      ]),
    },
    styles: { display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '1.1rem' },
  },
  container: {
    content: '',
    styles: {
      paddingTop: '1.25rem', paddingRight: '1.25rem', paddingBottom: '1.25rem', paddingLeft: '1.25rem',
      borderRadius: '12px',
    },
    children: [],
  },
  badge: {
    content: 'New Release 2.0',
    attributes: { icon: 'fas fa-wand-magic-sparkles', variant: 'soft' },
    styles: {
      display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
      paddingTop: '6px', paddingRight: '14px', paddingBottom: '6px', paddingLeft: '14px',
      borderRadius: '9999px',
      fontSize: '0.8125rem',
      fontWeight: '600',
      marginBottom: '1rem',
    },
  },
  card: {
    content: '',
    attributes: {
      title: 'Feature Spotlight',
      description: 'Clean modular blocks with crisp spacing, adaptive surfaces, and subtle hover elevation.',
      icon: 'fas fa-bolt',
      imageUrl: '',
      ctaText: 'Explore feature →',
      ctaHref: '#',
      variant: 'elevated',
    },
    styles: {
      backgroundColor: 'var(--site-surface)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--site-border)',
      borderRadius: '14px',
      paddingTop: '1.75rem', paddingRight: '1.75rem', paddingBottom: '1.75rem', paddingLeft: '1.75rem',
      transition: 'all 0.25s ease',
    },
    hoverStyles: {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    },
  },
  accordion: {
    content: '',
    attributes: {
      items: JSON.stringify(DEFAULT_ACCORDION_ITEMS),
      allowMultiple: 'false',
    },
    styles: { width: '100%' },
  },
  tabs: {
    content: '',
    attributes: {
      items: JSON.stringify(DEFAULT_TAB_ITEMS),
      variant: 'underline',
    },
    styles: { width: '100%' },
  },
  progress: {
    content: '',
    attributes: {
      label: 'Design & Performance',
      value: '85',
      showValue: 'true',
      barColor: 'var(--site-accent)',
    },
    styles: { width: '100%', marginBottom: '0.75rem' },
  },
  alert: {
    content: 'Your multi-page site exports with clean semantic HTML, CSS variables, and interactive JavaScript.',
    attributes: {
      variant: 'info',
      title: 'Studio Tip',
      icon: 'fas fa-circle-info',
    },
    styles: {
      width: '100%',
      borderRadius: '10px',
      marginBottom: '1rem',
    },
  },
  stat: {
    content: '',
    attributes: {
      value: '99.9%',
      label: 'Uptime Guarantee',
      delta: '+4.2%',
      deltaPositive: 'true',
    },
    styles: {
      paddingTop: '1.5rem', paddingRight: '1.5rem', paddingBottom: '1.5rem', paddingLeft: '1.5rem',
      backgroundColor: 'var(--site-surface)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'var(--site-border)',
      borderRadius: '12px',
    },
  },
  table: {
    content: '',
    attributes: {
      tableData: JSON.stringify(DEFAULT_TABLE_DATA),
    },
    styles: { width: '100%', overflow: 'auto', borderRadius: '10px' },
  },
  avatar: {
    content: '',
    attributes: {
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80',
      name: 'Elena Vance',
      role: 'Principal Product Designer',
      rating: '5',
    },
    styles: { display: 'flex', alignItems: 'center', gap: '0.875rem' },
  },
  html: {
    content: '<div style="padding:1.5rem;border:1px dashed var(--site-border);border-radius:12px;text-align:center;">\n  <strong>Custom HTML / SVG Block</strong>\n  <p style="opacity:0.7;margin-top:0.25rem;font-size:0.9rem;">Double-click or edit in Settings → HTML Code</p>\n</div>',
    styles: { width: '100%' },
  },
};

/* ========== Layout Factories ========== */

export function createColumn(span = 12, elements: ElementNode[] = []): ColumnNode {
  return { id: uid('col'), span, elements, styles: {} };
}

export function createRow(columnCount = 1): RowNode {
  const span = Math.max(1, Math.floor(12 / columnCount));
  const columns = Array.from({ length: columnCount }, () => createColumn(span));
  return { id: uid('row'), columns, styles: {} };
}

export function createSection(name = 'Section', rows?: RowNode[]): SectionNode {
  return {
    id: uid('sec'),
    name,
    fullBleed: false,
    styles: {
      paddingTop: '4rem',
      paddingBottom: '4rem',
    },
    rows: rows ?? [createRow(1)],
  };
}

/* ========== Page Factory ========== */

export function createPageSEO(title: string): PageSEO {
  return { title, description: '', ogImage: '' };
}

export function createPage(title: string, slug: string, parentId: string | null = null): PageData {
  const section = createSection('Content');
  section.rows[0].columns[0].elements.push(
    createElement('heading', { content: title, headingLevel: 1, styles: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' } }),
    createElement('paragraph'),
  );
  return {
    id: uid('page'),
    title,
    slug,
    parentId,
    order: 0,
    hidden: false,
    sections: [section],
    seo: createPageSEO(title),
  };
}

/* ========== Default Header & Footer ========== */

export function createDefaultHeader(siteName: string): SectionNode {
  const row = createRow(2);
  row.columns[0].span = 4;
  row.columns[1].span = 8;
  row.columns[0].elements.push(
    createElement('heading', {
      content: siteName,
      headingLevel: 3,
      styles: { fontSize: '1.25rem', fontWeight: '800', marginBottom: '0', color: 'inherit' },
    }),
  );
  row.columns[1].elements.push(
    createElement('link', { content: 'Home', attributes: { href: '#', 'data-nav': 'true' }, styles: { color: 'inherit', textDecoration: 'none', fontWeight: '500', marginRight: '1.5rem' } }),
    createElement('link', { content: 'About', attributes: { href: '#', 'data-nav': 'true' }, styles: { color: 'inherit', textDecoration: 'none', fontWeight: '500', marginRight: '1.5rem' } }),
    createElement('link', { content: 'Contact', attributes: { href: '#', 'data-nav': 'true' }, styles: { color: 'inherit', textDecoration: 'none', fontWeight: '500' } }),
  );
  row.styles = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  row.columns[1].styles = { display: 'flex', justifyContent: 'flex-end', alignItems: 'center' };

  return {
    id: uid('header'),
    name: 'Header',
    fullBleed: false,
    styles: {
      paddingTop: '1rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--site-border)',
      position: 'sticky',
      top: '0',
      zIndex: '100',
      backgroundColor: 'var(--site-bg)',
    },
    rows: [row],
  };
}

export function createDefaultFooter(siteName: string): SectionNode {
  const row = createRow(3);
  row.columns[0].span = 4;
  row.columns[1].span = 4;
  row.columns[2].span = 4;

  row.columns[0].elements.push(
    createElement('heading', {
      content: siteName,
      headingLevel: 4,
      styles: { fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.75rem' },
    }),
    createElement('paragraph', {
      content: 'Crafted with Website Builder Pro. Clean code, responsive design, zero bloat.',
      styles: { fontSize: '0.875rem', opacity: '0.7', lineHeight: '1.6' },
    }),
  );

  row.columns[1].elements.push(
    createElement('heading', {
      content: 'Quick Links',
      headingLevel: 5,
      styles: { fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' },
    }),
    createElement('link', { content: 'Home', attributes: { href: '#', 'data-nav': 'true' }, styles: { display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'inherit', opacity: '0.7', textDecoration: 'none' } }),
    createElement('link', { content: 'Features', attributes: { href: '#features' }, styles: { display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'inherit', opacity: '0.7', textDecoration: 'none' } }),
    createElement('link', { content: 'Contact', attributes: { href: '#contact' }, styles: { display: 'block', fontSize: '0.875rem', color: 'inherit', opacity: '0.7', textDecoration: 'none' } }),
  );

  row.columns[2].elements.push(
    createElement('heading', {
      content: 'Connect',
      headingLevel: 5,
      styles: { fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' },
    }),
    createElement('social-links'),
  );

  const copyrightRow = createRow(1);
  copyrightRow.columns[0].elements.push(
    createElement('paragraph', {
      content: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
      styles: { fontSize: '0.8125rem', textAlign: 'center', opacity: '0.55', marginTop: '2rem', marginBottom: '0' },
    }),
  );

  return {
    id: uid('footer'),
    name: 'Footer',
    fullBleed: false,
    styles: {
      paddingTop: '3.5rem',
      paddingBottom: '2rem',
      borderTop: '1px solid var(--site-border)',
      backgroundColor: 'var(--site-surface)',
    },
    rows: [row, copyrightRow],
  };
}

/* ========== Default Theme & Curated Presets ========== */

export const DEFAULT_THEME: SiteTheme = {
  light: {
    bg: '#ffffff',
    text: '#111827',
    surface: '#f8fafc',
    border: '#e2e8f0',
  },
  dark: {
    bg: '#0b0c14',
    text: '#f1f5f9',
    surface: '#141624',
    border: '#25283d',
  },
  accent: '#6366f1',
  accentSecondary: '#a855f7',
  fonts: {
    heading: 'Plus Jakarta Sans',
    body: 'Inter',
  },
  borderRadius: '10px',
  containerMaxWidth: '1200px',
  presetId: 'indigo-studio',
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'indigo-studio',
    name: 'Indigo Studio',
    description: 'Clean SaaS indigo & violet pairing',
    defaultMode: 'light',
    theme: { ...DEFAULT_THEME, presetId: 'indigo-studio' },
  },
  {
    id: 'obsidian-cyber',
    name: 'Obsidian Cyber',
    description: 'Deep void dark mode with electric cyan',
    defaultMode: 'dark',
    theme: {
      light: { bg: '#f8fafc', text: '#0f172a', surface: '#ffffff', border: '#cbd5e1' },
      dark: { bg: '#050814', text: '#f0f9ff', surface: '#0c1326', border: '#1e293b' },
      accent: '#06b6d4',
      accentSecondary: '#3b82f6',
      fonts: { heading: 'Space Grotesk', body: 'Inter' },
      borderRadius: '10px',
      containerMaxWidth: '1200px',
      presetId: 'obsidian-cyber',
    },
  },
  {
    id: 'editorial-noir',
    name: 'Editorial Noir',
    description: 'High-contrast serif headings & crisp white',
    defaultMode: 'light',
    theme: {
      light: { bg: '#fafaf8', text: '#141414', surface: '#f1f0eb', border: '#dedbd2' },
      dark: { bg: '#121210', text: '#f4f3ee', surface: '#1c1c19', border: '#2e2e28' },
      accent: '#18181b',
      accentSecondary: '#71717a',
      fonts: { heading: 'Playfair Display', body: 'DM Sans' },
      borderRadius: '4px',
      containerMaxWidth: '1140px',
      presetId: 'editorial-noir',
    },
  },
  {
    id: 'emerald-minimal',
    name: 'Emerald Minimal',
    description: 'Fresh mint & emerald sustainability look',
    defaultMode: 'light',
    theme: {
      light: { bg: '#ffffff', text: '#062c22', surface: '#f0fdf7', border: '#d1fae5' },
      dark: { bg: '#051b14', text: '#ecfdf5', surface: '#0a2920', border: '#134e3a' },
      accent: '#10b981',
      accentSecondary: '#14b8a6',
      fonts: { heading: 'Outfit', body: 'Inter' },
      borderRadius: '12px',
      containerMaxWidth: '1200px',
      presetId: 'emerald-minimal',
    },
  },
  {
    id: 'warm-terracotta',
    name: 'Warm Terracotta',
    description: 'Artisanal cream canvas & warm terracotta',
    defaultMode: 'light',
    theme: {
      light: { bg: '#fffaf5', text: '#291d16', surface: '#fdf2e9', border: '#ebd8c8' },
      dark: { bg: '#1c1410', text: '#f8ede3', surface: '#281d17', border: '#3f2e24' },
      accent: '#d95d39',
      accentSecondary: '#f59e0b',
      fonts: { heading: 'Lora', body: 'Plus Jakarta Sans' },
      borderRadius: '10px',
      containerMaxWidth: '1160px',
      presetId: 'warm-terracotta',
    },
  },
  {
    id: 'rose-atelier',
    name: 'Rose Atelier',
    description: 'Creative studio pink & magenta gradient',
    defaultMode: 'light',
    theme: {
      light: { bg: '#ffffff', text: '#1f1224', surface: '#fdf2f8', border: '#fbcfe8' },
      dark: { bg: '#130916', text: '#fdf4ff', surface: '#1e0f24', border: '#3b1d45' },
      accent: '#ec4899',
      accentSecondary: '#8b5cf6',
      fonts: { heading: 'Poppins', body: 'DM Sans' },
      borderRadius: '14px',
      containerMaxWidth: '1200px',
      presetId: 'rose-atelier',
    },
  },
  {
    id: 'nordic-slate',
    name: 'Nordic Slate',
    description: 'Balanced cool slate & royal cobalt',
    defaultMode: 'light',
    theme: {
      light: { bg: '#f8fafc', text: '#0f172a', surface: '#ffffff', border: '#e2e8f0' },
      dark: { bg: '#0f172a', text: '#f1f5f9', surface: '#1e293b', border: '#334155' },
      accent: '#2563eb',
      accentSecondary: '#0ea5e9',
      fonts: { heading: 'Inter', body: 'Inter' },
      borderRadius: '8px',
      containerMaxWidth: '1240px',
      presetId: 'nordic-slate',
    },
  },
  {
    id: 'solar-violet',
    name: 'Solar Violet',
    description: 'Bold dark backdrop with electric violet & amber',
    defaultMode: 'dark',
    theme: {
      light: { bg: '#faf8ff', text: '#1a1033', surface: '#f3edff', border: '#ddd0ff' },
      dark: { bg: '#0c071a', text: '#f4f0ff', surface: '#160f2b', border: '#2a1f4d' },
      accent: '#8b5cf6',
      accentSecondary: '#f59e0b',
      fonts: { heading: 'Sora', body: 'Inter' },
      borderRadius: '12px',
      containerMaxWidth: '1200px',
      presetId: 'solar-violet',
    },
  },
];

/* ========== Default Settings ========== */

export const DEFAULT_SETTINGS: ProjectSettings = {
  siteName: 'Nova Studio',
  favicon: null,
  globalCSS: '',
  headerEnabled: true,
  footerEnabled: true,
  analyticsId: '',
  headerStyle: 'glass',
  headerCtaEnabled: true,
  headerCtaText: 'Get Started',
  headerCtaHref: '#contact',
  showThemeToggle: true,
  customHeadCode: '',
};

/* ========== Project Factory ========== */

export function createDefaultProject(name = 'Nova Studio'): BuilderProject {
  const homePage = createPage('Home', 'index');

  const heroSection = createSection('Hero');
  heroSection.anchorId = 'hero';
  heroSection.styles = {
    paddingTop: '6.5rem',
    paddingBottom: '5.5rem',
    textAlign: 'center',
  };
  heroSection.rows[0].columns[0].elements = [
    createElement('badge', {
      content: 'Introducing WebBuilder Studio 2.0',
      attributes: { icon: 'fas fa-wand-magic-sparkles', variant: 'soft' },
    }),
    createElement('heading', {
      content: 'Design & Ship Websites Faster Than Ever',
      headingLevel: 1,
      styles: {
        fontSize: '3.75rem',
        fontWeight: '800',
        lineHeight: '1.08',
        letterSpacing: '-0.03em',
        marginBottom: '1.5rem',
        maxWidth: '820px',
        marginLeft: 'auto',
        marginRight: 'auto',
        backgroundImage: 'linear-gradient(135deg, var(--site-accent), #a855f7)',
        backgroundClip: 'text',
        color: 'transparent',
      },
      responsiveStyles: {
        tablet: { fontSize: '2.75rem' },
        mobile: { fontSize: '2.125rem' },
      },
    }),
    createElement('paragraph', {
      content: 'Combine modular sections, responsive breakpoints, interactive widgets, and instant code inspection — export clean static HTML & CSS in one click.',
      styles: {
        fontSize: '1.2rem',
        maxWidth: '640px',
        marginLeft: 'auto',
        marginRight: 'auto',
        opacity: '0.75',
        marginBottom: '2.25rem',
      },
    }),
    createElement('button', {
      content: 'Start Building',
      attributes: { href: '#features', target: '' },
      styles: {
        display: 'inline-block',
        backgroundColor: 'var(--site-accent)',
        color: '#ffffff',
        paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
        borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem',
        cursor: 'pointer', transition: 'all 0.2s ease',
        marginRight: '0.85rem', marginBottom: '0.5rem',
      },
    }),
    createElement('button', {
      content: 'Live Showcase',
      attributes: { href: '#cta', target: '' },
      styles: {
        display: 'inline-block',
        backgroundColor: 'transparent',
        color: 'var(--site-text)',
        paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
        borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem',
        borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)',
        cursor: 'pointer', transition: 'all 0.2s ease',
        marginBottom: '0.5rem',
      },
    }),
  ];

  // 3-Column Feature Cards Section
  const featuresSection = createSection('Features');
  featuresSection.anchorId = 'features';
  featuresSection.styles = { paddingTop: '4.5rem', paddingBottom: '5rem' };
  const featHeaderRow = createRow(1);
  featHeaderRow.columns[0].elements = [
    createElement('heading', {
      content: 'Everything Built for Modern Web Teams',
      headingLevel: 2,
      styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.75rem' },
    }),
    createElement('paragraph', {
      content: 'Craft layouts visually with full control over typography, spacing, hover states, and breakpoints.',
      styles: { textAlign: 'center', opacity: '0.68', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '2.5rem' },
    }),
  ];
  const featRow = createRow(3);
  const featureCards = [
    {
      icon: 'fas fa-bolt',
      title: 'Instant Visual Editing',
      desc: 'Double-click any heading or paragraph to format inline, drag elements across columns, and fine-tune box spacing.',
    },
    {
      icon: 'fas fa-mobile-screen-button',
      title: 'True Responsive Control',
      desc: 'Preview desktop, tablet, and mobile viewports with per-device style overrides and adaptive CSS Grid rows.',
    },
    {
      icon: 'fas fa-file-code',
      title: 'Production-Ready Export',
      desc: 'Inspect HTML, CSS, and interactive JS live or download a multi-page ZIP complete with sitemap and assets.',
    },
  ];
  featureCards.forEach((f, idx) => {
    featRow.columns[idx].elements = [
      createElement('card', {
        attributes: {
          title: f.title,
          description: f.desc,
          icon: f.icon,
          imageUrl: '',
          ctaText: '',
          ctaHref: '#',
          variant: 'elevated',
        },
      }),
    ];
  });
  featuresSection.rows = [featHeaderRow, featRow];

  // CTA Banner Section
  const ctaSection = createSection('Call to Action');
  ctaSection.anchorId = 'cta';
  ctaSection.styles = {
    paddingTop: '5rem',
    paddingBottom: '5rem',
    backgroundColor: 'var(--site-accent)',
    textAlign: 'center',
  };
  ctaSection.rows[0].columns[0].elements = [
    createElement('heading', {
      content: 'Ready to Launch Your Next Idea?',
      headingLevel: 2,
      styles: { fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '1rem' },
    }),
    createElement('paragraph', {
      content: 'Customize this starter page, add more sections from the left panel, or explore curated website templates.',
      styles: { fontSize: '1.125rem', color: 'rgba(255,255,255,0.88)', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '2rem' },
    }),
    createElement('button', {
      content: 'Explore Templates',
      attributes: { href: '#', target: '' },
      styles: {
        display: 'inline-block',
        backgroundColor: '#ffffff',
        color: 'var(--site-accent)',
        paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
        borderRadius: '10px', fontWeight: '700', fontSize: '1rem',
        cursor: 'pointer', transition: 'all 0.2s ease',
      },
    }),
  ];

  homePage.sections = [heroSection, featuresSection, ctaSection];

  return {
    id: uid('proj'),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: { [homePage.id]: homePage },
    pageOrder: [homePage.id],
    header: createDefaultHeader(name),
    footer: createDefaultFooter(name),
    theme: { ...DEFAULT_THEME },
    assets: {},
    settings: { ...DEFAULT_SETTINGS, siteName: name },
  };
}

/* ========== Font List (20 Fonts) ========== */

export const FONT_LIST: FontDef[] = [
  { name: 'Inter', family: "'Inter', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900], googleUrl: 'Inter:wght@300;400;500;600;700;800;900' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700, 800], googleUrl: 'Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700], googleUrl: 'DM+Sans:wght@400;500;600;700' },
  { name: 'Outfit', family: "'Outfit', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800], googleUrl: 'Outfit:wght@300;400;500;600;700;800' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", category: 'display', weights: [400, 500, 600, 700], googleUrl: 'Space+Grotesk:wght@400;500;600;700' },
  { name: 'Sora', family: "'Sora', sans-serif", category: 'display', weights: [400, 500, 600, 700, 800], googleUrl: 'Sora:wght@400;500;600;700;800' },
  { name: 'Syne', family: "'Syne', sans-serif", category: 'display', weights: [500, 600, 700, 800], googleUrl: 'Syne:wght@500;600;700;800' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 600, 700], googleUrl: 'Poppins:wght@300;400;500;600;700' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700, 800], googleUrl: 'Montserrat:wght@400;500;600;700;800' },
  { name: 'Manrope', family: "'Manrope', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700, 800], googleUrl: 'Manrope:wght@400;500;600;700;800' },
  { name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 700], googleUrl: 'Roboto:wght@300;400;500;700' },
  { name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'sans-serif', weights: [300, 400, 600, 700], googleUrl: 'Open+Sans:wght@300;400;600;700' },
  { name: 'Lato', family: "'Lato', sans-serif", category: 'sans-serif', weights: [300, 400, 700], googleUrl: 'Lato:wght@300;400;700' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif', weights: [400, 500, 600, 700, 800], googleUrl: 'Playfair+Display:wght@400;500;600;700;800' },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'serif', weights: [300, 400, 700], googleUrl: 'Merriweather:wght@300;400;700' },
  { name: 'Lora', family: "'Lora', serif", category: 'serif', weights: [400, 500, 600, 700], googleUrl: 'Lora:wght@400;500;600;700' },
  { name: 'Georgia', family: "Georgia, serif", category: 'serif', weights: [400, 700] },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'monospace', weights: [400, 500, 700], googleUrl: 'JetBrains+Mono:wght@400;500;700' },
  { name: 'Fira Code', family: "'Fira Code', monospace", category: 'monospace', weights: [400, 500, 700], googleUrl: 'Fira+Code:wght@400;500;700' },
  { name: 'System UI', family: "system-ui, -apple-system, sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700] },
];

/* ========== Gradient Presets (16) ========== */

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'None', value: '' },
  { name: 'Indigo Dream', value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { name: 'Aurora Glow', value: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)' },
  { name: 'Sunset Flame', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Ocean Blue', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Emerald Mint', value: 'linear-gradient(135deg, #10b981 0%, #38bdf8 100%)' },
  { name: 'Solar Amber', value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { name: 'Night Cosmos', value: 'linear-gradient(135deg, #0c0c1d 0%, #1e1b4b 50%, #312e81 100%)' },
  { name: 'Rose Quartz', value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
  { name: 'Soft Mesh', value: 'radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 60%)' },
  { name: 'Purple Haze', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: 'Deep Space', value: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
  { name: 'Midnight Slate', value: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' },
  { name: 'Peach Blossom', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Forest Mist', value: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)' },
  { name: 'Crimson Velvet', value: 'linear-gradient(135deg, #9f1239 0%, #4c0519 100%)' },
];

/* ========== Shadow Presets (10) ========== */

export const SHADOW_PRESETS: ShadowPreset[] = [
  { name: 'None', value: 'none' },
  { name: 'Hairline', value: '0 1px 2px rgba(0,0,0,0.06)' },
  { name: 'Subtle', value: '0 2px 6px rgba(0,0,0,0.08)' },
  { name: 'Medium', value: '0 6px 18px rgba(0,0,0,0.12)' },
  { name: 'Elevated', value: '0 12px 32px rgba(0,0,0,0.15)' },
  { name: 'XL Float', value: '0 24px 56px rgba(0,0,0,0.22)' },
  { name: 'Inner', value: 'inset 0 2px 8px rgba(0,0,0,0.12)' },
  { name: 'Indigo Glow', value: '0 0 28px rgba(99,102,241,0.35)' },
  { name: 'Cyan Glow', value: '0 0 28px rgba(6,182,212,0.35)' },
  { name: 'Brutalist', value: '6px 6px 0 rgba(0,0,0,0.85)' },
];

/* ========== Animation Presets (9) ========== */

export const ANIMATION_PRESETS: AnimationPreset[] = [
  { name: 'none', nameLabel: 'None', description: 'Static render' },
  { name: 'fadeIn', nameLabel: 'Fade In', description: 'Smooth opacity reveal' },
  { name: 'fadeUp', nameLabel: 'Fade Up', description: 'Slide up while fading in' },
  { name: 'fadeDown', nameLabel: 'Fade Down', description: 'Drop in gently from above' },
  { name: 'fadeLeft', nameLabel: 'Slide Left', description: 'Enter from right edge' },
  { name: 'fadeRight', nameLabel: 'Slide Right', description: 'Enter from left edge' },
  { name: 'zoomIn', nameLabel: 'Zoom In', description: 'Scale up smoothly' },
  { name: 'bounceIn', nameLabel: 'Pop In', description: 'Spring overshoot entrance' },
  { name: 'flipUp', nameLabel: 'Flip Reveal', description: 'Crisp 3D perspective lift' },
];

/* ========== Column Layout Presets (9) ========== */

export const COLUMN_LAYOUT_PRESETS: ColumnLayoutPreset[] = [
  { label: '1 Col (12)', spans: [12] },
  { label: '2 Equal (6/6)', spans: [6, 6] },
  { label: '2 Sidebar L (4/8)', spans: [4, 8] },
  { label: '2 Sidebar R (8/4)', spans: [8, 4] },
  { label: '2 Split (5/7)', spans: [5, 7] },
  { label: '3 Equal (4/4/4)', spans: [4, 4, 4] },
  { label: '3 Focus (3/6/3)', spans: [3, 6, 3] },
  { label: '4 Equal (3×4)', spans: [3, 3, 3, 3] },
  { label: '6 Equal (2×6)', spans: [2, 2, 2, 2, 2, 2] },
];

/* ========== Element Category Definitions (27 Elements) ========== */

export interface ElementCategory {
  name: string;
  icon: string;
  items: { type: ElementType; label: string; icon: string }[];
}

export const ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    name: 'Basic',
    icon: 'fas fa-shapes',
    items: [
      { type: 'heading', label: 'Heading', icon: 'fas fa-heading' },
      { type: 'paragraph', label: 'Paragraph', icon: 'fas fa-paragraph' },
      { type: 'button', label: 'Button', icon: 'fas fa-square' },
      { type: 'link', label: 'Link', icon: 'fas fa-link' },
      { type: 'badge', label: 'Badge', icon: 'fas fa-tag' },
      { type: 'icon', label: 'Icon', icon: 'fas fa-star' },
    ],
  },
  {
    name: 'Content',
    icon: 'fas fa-file-alt',
    items: [
      { type: 'card', label: 'Card', icon: 'fas fa-id-card' },
      { type: 'list', label: 'List', icon: 'fas fa-list-ul' },
      { type: 'blockquote', label: 'Quote', icon: 'fas fa-quote-left' },
      { type: 'code', label: 'Code Block', icon: 'fas fa-code' },
      { type: 'alert', label: 'Alert', icon: 'fas fa-circle-info' },
      { type: 'avatar', label: 'Author / Avatar', icon: 'fas fa-user-circle' },
    ],
  },
  {
    name: 'Interactive',
    icon: 'fas fa-sliders',
    items: [
      { type: 'accordion', label: 'Accordion', icon: 'fas fa-bars-staggered' },
      { type: 'tabs', label: 'Tabs', icon: 'fas fa-folder-open' },
      { type: 'form', label: 'Form', icon: 'fas fa-envelope' },
    ],
  },
  {
    name: 'Data & Media',
    icon: 'fas fa-chart-pie',
    items: [
      { type: 'image', label: 'Image', icon: 'fas fa-image' },
      { type: 'video', label: 'Video', icon: 'fas fa-video' },
      { type: 'stat', label: 'Stat KPI', icon: 'fas fa-chart-line' },
      { type: 'progress', label: 'Progress Bar', icon: 'fas fa-tasks' },
      { type: 'table', label: 'Table', icon: 'fas fa-table' },
    ],
  },
  {
    name: 'Layout',
    icon: 'fas fa-columns',
    items: [
      { type: 'container', label: 'Container', icon: 'fas fa-box' },
      { type: 'divider', label: 'Divider', icon: 'fas fa-minus' },
      { type: 'spacer', label: 'Spacer', icon: 'fas fa-arrows-alt-v' },
      { type: 'html', label: 'Custom HTML', icon: 'fas fa-file-code' },
    ],
  },
  {
    name: 'Embed & Social',
    icon: 'fas fa-globe',
    items: [
      { type: 'map', label: 'Map', icon: 'fas fa-map-marker-alt' },
      { type: 'embed', label: 'Embed', icon: 'fas fa-window-maximize' },
      { type: 'social-links', label: 'Social Links', icon: 'fas fa-share-alt' },
    ],
  },
];

/* ========== Curated Icon Catalog (~120 FontAwesome 6 icons) ========== */

export interface IconCatalogCategory {
  category: string;
  icons: { cls: string; label: string }[];
}

export const ICON_CATALOG: IconCatalogCategory[] = [
  {
    category: 'UI & Actions',
    icons: [
      { cls: 'fas fa-bolt', label: 'Bolt' },
      { cls: 'fas fa-star', label: 'Star' },
      { cls: 'fas fa-wand-magic-sparkles', label: 'Sparkles / Magic' },
      { cls: 'fas fa-rocket', label: 'Rocket' },
      { cls: 'fas fa-check', label: 'Check' },
      { cls: 'fas fa-check-circle', label: 'Check Circle' },
      { cls: 'fas fa-shield-halved', label: 'Shield' },
      { cls: 'fas fa-lock', label: 'Lock' },
      { cls: 'fas fa-key', label: 'Key' },
      { cls: 'fas fa-gear', label: 'Gear' },
      { cls: 'fas fa-sliders', label: 'Sliders' },
      { cls: 'fas fa-magnifying-glass', label: 'Search' },
      { cls: 'fas fa-bell', label: 'Bell' },
      { cls: 'fas fa-bookmark', label: 'Bookmark' },
      { cls: 'fas fa-heart', label: 'Heart' },
      { cls: 'fas fa-fire', label: 'Fire' },
      { cls: 'fas fa-gem', label: 'Gem' },
      { cls: 'fas fa-crown', label: 'Crown' },
      { cls: 'fas fa-trophy', label: 'Trophy' },
    ],
  },
  {
    category: 'Development & Tech',
    icons: [
      { cls: 'fas fa-code', label: 'Code' },
      { cls: 'fas fa-terminal', label: 'Terminal' },
      { cls: 'fas fa-laptop-code', label: 'Laptop Code' },
      { cls: 'fas fa-server', label: 'Server' },
      { cls: 'fas fa-database', label: 'Database' },
      { cls: 'fas fa-cloud', label: 'Cloud' },
      { cls: 'fas fa-microchip', label: 'Chip' },
      { cls: 'fas fa-cubes', label: 'Cubes' },
      { cls: 'fas fa-layer-group', label: 'Layers' },
      { cls: 'fas fa-diagram-project', label: 'Project' },
      { cls: 'fas fa-bug', label: 'Bug' },
      { cls: 'fas fa-plug', label: 'Plug' },
      { cls: 'fas fa-mobile-screen-button', label: 'Mobile' },
      { cls: 'fas fa-desktop', label: 'Desktop' },
      { cls: 'fas fa-wifi', label: 'WiFi' },
      { cls: 'fas fa-robot', label: 'Robot' },
    ],
  },
  {
    category: 'Design & Media',
    icons: [
      { cls: 'fas fa-palette', label: 'Palette' },
      { cls: 'fas fa-pen-nib', label: 'Pen Nib' },
      { cls: 'fas fa-compass-drafting', label: 'Drafting' },
      { cls: 'fas fa-swatchbook', label: 'Swatch' },
      { cls: 'fas fa-image', label: 'Image' },
      { cls: 'fas fa-camera', label: 'Camera' },
      { cls: 'fas fa-video', label: 'Video' },
      { cls: 'fas fa-music', label: 'Music' },
      { cls: 'fas fa-headphones', label: 'Headphones' },
      { cls: 'fas fa-play', label: 'Play' },
      { cls: 'fas fa-eye', label: 'Eye' },
      { cls: 'fas fa-wand-sparkles', label: 'Wand' },
    ],
  },
  {
    category: 'Business & Commerce',
    icons: [
      { cls: 'fas fa-chart-line', label: 'Chart Line' },
      { cls: 'fas fa-chart-bar', label: 'Chart Bar' },
      { cls: 'fas fa-chart-pie', label: 'Chart Pie' },
      { cls: 'fas fa-briefcase', label: 'Briefcase' },
      { cls: 'fas fa-building', label: 'Building' },
      { cls: 'fas fa-cart-shopping', label: 'Cart' },
      { cls: 'fas fa-credit-card', label: 'Card' },
      { cls: 'fas fa-wallet', label: 'Wallet' },
      { cls: 'fas fa-tag', label: 'Tag' },
      { cls: 'fas fa-award', label: 'Award' },
      { cls: 'fas fa-handshake', label: 'Handshake' },
      { cls: 'fas fa-bullhorn', label: 'Bullhorn' },
    ],
  },
  {
    category: 'Communication & People',
    icons: [
      { cls: 'fas fa-envelope', label: 'Envelope' },
      { cls: 'fas fa-paper-plane', label: 'Send' },
      { cls: 'fas fa-comment-dots', label: 'Chat' },
      { cls: 'fas fa-phone', label: 'Phone' },
      { cls: 'fas fa-users', label: 'Users' },
      { cls: 'fas fa-user', label: 'User' },
      { cls: 'fas fa-globe', label: 'Globe' },
      { cls: 'fas fa-map-marker-alt', label: 'Pin' },
      { cls: 'fas fa-calendar', label: 'Calendar' },
      { cls: 'fas fa-clock', label: 'Clock' },
      { cls: 'fas fa-quote-left', label: 'Quote' },
      { cls: 'fas fa-circle-info', label: 'Info' },
    ],
  },
  {
    category: 'Arrows & Brands',
    icons: [
      { cls: 'fas fa-arrow-right', label: 'Arrow Right' },
      { cls: 'fas fa-arrow-up-right-from-square', label: 'External' },
      { cls: 'fas fa-chevron-right', label: 'Chevron' },
      { cls: 'fas fa-download', label: 'Download' },
      { cls: 'fab fa-github', label: 'GitHub' },
      { cls: 'fab fa-x-twitter', label: 'X' },
      { cls: 'fab fa-linkedin-in', label: 'LinkedIn' },
      { cls: 'fab fa-instagram', label: 'Instagram' },
      { cls: 'fab fa-youtube', label: 'YouTube' },
      { cls: 'fab fa-discord', label: 'Discord' },
      { cls: 'fab fa-dribbble', label: 'Dribbble' },
      { cls: 'fab fa-figma', label: 'Figma' },
    ],
  },
];

/* ========== Curated Stock Images ========== */

export interface StockImageItem {
  id: string;
  label: string;
  category: 'Workspace' | 'Abstract' | 'Nature' | 'Architecture' | 'People' | 'Culinary';
  url: string;
}

export const STOCK_IMAGES: StockImageItem[] = [
  { id: 'st_1', label: 'Minimal Desk Setup', category: 'Workspace', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&q=80' },
  { id: 'st_2', label: 'Analytics Dashboard', category: 'Workspace', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80' },
  { id: 'st_3', label: 'Creative Studio', category: 'Workspace', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&q=80' },
  { id: 'st_4', label: 'Liquid Gradient 3D', category: 'Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&q=80' },
  { id: 'st_5', label: 'Neon Waves', category: 'Abstract', url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1000&q=80' },
  { id: 'st_6', label: 'Mountain Peak', category: 'Nature', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000&q=80' },
  { id: 'st_7', label: 'Northern Horizon', category: 'Nature', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&q=80' },
  { id: 'st_8', label: 'Glass Architecture', category: 'Architecture', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=80' },
  { id: 'st_9', label: 'Portrait Male', category: 'People', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80' },
  { id: 'st_10', label: 'Portrait Female', category: 'People', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80' },
  { id: 'st_11', label: 'Artisan Plating', category: 'Culinary', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&q=80' },
  { id: 'st_12', label: 'Warm Bistro Dining', category: 'Culinary', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80' },
];
