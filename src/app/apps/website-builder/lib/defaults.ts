// ============================================================
// Website Builder Pro — Defaults, Factories & Presets
// ============================================================

import type {
  ElementNode, ElementType, ElementStyles, HeadingLevel,
  SectionNode, RowNode, ColumnNode, PageData, PageSEO,
  BuilderProject, SiteTheme, ProjectSettings,
  FontDef, GradientPreset, ShadowPreset,
} from './types';

/* ========== ID Generation ========== */

let _counter = 0;
export function uid(prefix = 'el'): string {
  return `${prefix}_${++_counter}_${Math.random().toString(36).slice(2, 7)}`;
}

/* ========== Element Factories ========== */

export function createElement(
  type: ElementType,
  overrides?: Partial<ElementNode>,
): ElementNode {
  const base: ElementNode = {
    id: uid(type),
    type,
    content: '',
    styles: {},
    hoverStyles: {},
    attributes: {},
    children: [],
    locked: false,
    hidden: false,
  };

  const defaults = ELEMENT_DEFAULTS[type];
  return { ...base, ...defaults, ...overrides, id: overrides?.id ?? base.id };
}

const ELEMENT_DEFAULTS: Record<ElementType, Partial<ElementNode>> = {
  heading: {
    content: 'Heading',
    headingLevel: 2 as HeadingLevel,
    styles: { fontSize: '2rem', fontWeight: '700', lineHeight: '1.2', marginBottom: '0.5rem' },
  },
  paragraph: {
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
    attributes: { alt: 'Image description' },
    styles: { width: '100%', height: 'auto', borderRadius: '8px', objectFit: 'cover' },
  },
  video: {
    content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    styles: { width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden' },
  },
  icon: {
    content: 'fas fa-star',
    styles: { fontSize: '2rem', color: 'var(--site-accent)', textAlign: 'center' },
  },
  list: {
    content: '<li>First item in the list</li><li>Second item with details</li><li>Third item to complete</li>',
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
    content: 'const greeting = "Hello, World!";\nconsole.log(greeting);',
    styles: {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '0.875rem', lineHeight: '1.6',
      backgroundColor: '#1e1e2e', color: '#cdd6f4',
      paddingTop: '1rem', paddingRight: '1.25rem', paddingBottom: '1rem', paddingLeft: '1.25rem',
      borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre',
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
    attributes: { action: '#', method: 'POST', submitText: 'Send Message' },
    styles: {
      display: 'flex', flexDirection: 'column', gap: '1rem',
      width: '100%', maxWidth: '500px',
    },
    children: [], // form inputs are rendered specially
  },
  map: {
    content: 'https://maps.google.com/maps?q=New+York&t=&z=13&ie=UTF8&iwloc=&output=embed',
    styles: { width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' },
  },
  embed: {
    content: '',
    attributes: { title: 'Embed' },
    styles: { width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' },
  },
  'social-links': {
    content: '',
    attributes: {
      links: JSON.stringify([
        { platform: 'twitter', url: '#', icon: 'fab fa-x-twitter' },
        { platform: 'github', url: '#', icon: 'fab fa-github' },
        { platform: 'linkedin', url: '#', icon: 'fab fa-linkedin-in' },
        { platform: 'instagram', url: '#', icon: 'fab fa-instagram' },
      ]),
    },
    styles: { display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '1.25rem' },
  },
  container: {
    content: '',
    styles: {
      paddingTop: '1rem', paddingRight: '1rem', paddingBottom: '1rem', paddingLeft: '1rem',
    },
    children: [],
  },
};

/* ========== Layout Factories ========== */

export function createColumn(span = 12, elements: ElementNode[] = []): ColumnNode {
  return { id: uid('col'), span, elements, styles: {} };
}

export function createRow(columnCount = 1): RowNode {
  const span = Math.floor(12 / columnCount);
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
  // Navigation links placeholder — auto-generated on export
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
      content: 'Building amazing websites with ease.',
      styles: { fontSize: '0.875rem', opacity: '0.7', lineHeight: '1.6' },
    }),
  );

  row.columns[1].elements.push(
    createElement('heading', {
      content: 'Quick Links',
      headingLevel: 5,
      styles: { fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' },
    }),
    createElement('link', { content: 'Home', attributes: { href: '#' }, styles: { display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'inherit', opacity: '0.7', textDecoration: 'none' } }),
    createElement('link', { content: 'About', attributes: { href: '#' }, styles: { display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'inherit', opacity: '0.7', textDecoration: 'none' } }),
    createElement('link', { content: 'Contact', attributes: { href: '#' }, styles: { display: 'block', fontSize: '0.875rem', color: 'inherit', opacity: '0.7', textDecoration: 'none' } }),
  );

  row.columns[2].elements.push(
    createElement('heading', {
      content: 'Connect',
      headingLevel: 5,
      styles: { fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' },
    }),
    createElement('social-links'),
  );

  return {
    id: uid('footer'),
    name: 'Footer',
    fullBleed: false,
    styles: {
      paddingTop: '3rem',
      paddingBottom: '2rem',
      borderTop: '1px solid var(--site-border)',
      backgroundColor: 'var(--site-surface)',
    },
    rows: [
      row,
      (() => {
        const copyrightRow = createRow(1);
        copyrightRow.columns[0].elements.push(
          createElement('paragraph', {
            content: `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`,
            styles: { fontSize: '0.8125rem', textAlign: 'center', opacity: '0.5', marginTop: '2rem', marginBottom: '0' },
          }),
        );
        return copyrightRow;
      })(),
    ],
  };
}

/* ========== Default Theme ========== */

export const DEFAULT_THEME: SiteTheme = {
  light: {
    bg: '#ffffff',
    text: '#1a1a2e',
    surface: '#f8f9fa',
    border: '#e2e8f0',
  },
  dark: {
    bg: '#0f0f17',
    text: '#e4e4e7',
    surface: '#1a1a24',
    border: '#2a2a35',
  },
  accent: '#6366f1',
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  borderRadius: '8px',
};

/* ========== Default Settings ========== */

export const DEFAULT_SETTINGS: ProjectSettings = {
  siteName: 'My Website',
  favicon: null,
  globalCSS: '',
  headerEnabled: true,
  footerEnabled: true,
  analyticsId: '',
};

/* ========== Project Factory ========== */

export function createDefaultProject(name = 'My Website'): BuilderProject {
  const homePage = createPage('Home', 'index');

  // Make the home page more interesting
  const heroSection = createSection('Hero');
  heroSection.styles = {
    paddingTop: '6rem', paddingBottom: '6rem',
    textAlign: 'center',
  };
  heroSection.rows[0].columns[0].elements = [
    createElement('heading', {
      content: 'Build Something Amazing',
      headingLevel: 1,
      styles: {
        fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1',
        marginBottom: '1.5rem',
        backgroundImage: 'linear-gradient(135deg, var(--site-accent), #a855f7)',
        backgroundClip: 'text',
        color: 'transparent',
      },
    }),
    createElement('paragraph', {
      content: 'Create stunning websites with our intuitive drag-and-drop builder. No coding required.',
      styles: { fontSize: '1.25rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', opacity: '0.7', marginBottom: '2rem' },
    }),
    createElement('button', {
      content: 'Get Started',
      styles: {
        display: 'inline-block',
        backgroundColor: 'var(--site-accent)', color: '#ffffff',
        paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
        borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem',
        cursor: 'pointer', transition: 'all 0.2s ease',
        marginRight: '1rem',
      },
    }),
    createElement('button', {
      content: 'Learn More',
      styles: {
        display: 'inline-block',
        backgroundColor: 'transparent',
        color: 'var(--site-text)',
        paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
        borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem',
        borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--site-border)',
        cursor: 'pointer', transition: 'all 0.2s ease',
      },
    }),
  ];

  homePage.sections = [heroSection];

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

/* ========== Font List ========== */

export const FONT_LIST: FontDef[] = [
  { name: 'Inter', family: "'Inter', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800, 900], googleUrl: 'Inter:wght@300;400;500;600;700;800;900' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700], googleUrl: 'DM+Sans:wght@400;500;600;700' },
  { name: 'Outfit', family: "'Outfit', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 600, 700, 800], googleUrl: 'Outfit:wght@300;400;500;600;700;800' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700, 800], googleUrl: 'Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  { name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 600, 700], googleUrl: 'Poppins:wght@300;400;500;600;700' },
  { name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans-serif', weights: [300, 400, 500, 700], googleUrl: 'Roboto:wght@300;400;500;700' },
  { name: 'Open Sans', family: "'Open Sans', sans-serif", category: 'sans-serif', weights: [300, 400, 600, 700], googleUrl: 'Open+Sans:wght@300;400;600;700' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700, 800], googleUrl: 'Montserrat:wght@400;500;600;700;800' },
  { name: 'Lato', family: "'Lato', sans-serif", category: 'sans-serif', weights: [300, 400, 700], googleUrl: 'Lato:wght@300;400;700' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700], googleUrl: 'Space+Grotesk:wght@400;500;600;700' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'serif', weights: [400, 500, 600, 700, 800], googleUrl: 'Playfair+Display:wght@400;500;600;700;800' },
  { name: 'Merriweather', family: "'Merriweather', serif", category: 'serif', weights: [300, 400, 700], googleUrl: 'Merriweather:wght@300;400;700' },
  { name: 'Georgia', family: "Georgia, serif", category: 'serif', weights: [400, 700] },
  { name: 'Lora', family: "'Lora', serif", category: 'serif', weights: [400, 500, 600, 700], googleUrl: 'Lora:wght@400;500;600;700' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", category: 'monospace', weights: [400, 500, 700], googleUrl: 'JetBrains+Mono:wght@400;500;700' },
  { name: 'Fira Code', family: "'Fira Code', monospace", category: 'monospace', weights: [400, 500, 700], googleUrl: 'Fira+Code:wght@400;500;700' },
  { name: 'System UI', family: "system-ui, -apple-system, sans-serif", category: 'sans-serif', weights: [400, 500, 600, 700] },
];

/* ========== Gradient Presets ========== */

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'None', value: '' },
  { name: 'Indigo Dream', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Ocean Blue', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Emerald', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Warm Flame', value: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)' },
  { name: 'Night Sky', value: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d1b69 100%)' },
  { name: 'Rose Quartz', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Cool Gray', value: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 50%, #9e9e9e 100%)' },
  { name: 'Purple Haze', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: 'Deep Space', value: 'linear-gradient(135deg, #000428 0%, #004e92 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
];

/* ========== Shadow Presets ========== */

export const SHADOW_PRESETS: ShadowPreset[] = [
  { name: 'None', value: 'none' },
  { name: 'Subtle', value: '0 1px 3px rgba(0,0,0,0.08)' },
  { name: 'Small', value: '0 2px 8px rgba(0,0,0,0.1)' },
  { name: 'Medium', value: '0 4px 16px rgba(0,0,0,0.12)' },
  { name: 'Large', value: '0 8px 32px rgba(0,0,0,0.15)' },
  { name: 'XL', value: '0 16px 48px rgba(0,0,0,0.18)' },
  { name: 'Inner', value: 'inset 0 2px 8px rgba(0,0,0,0.1)' },
  { name: 'Glow', value: '0 0 20px rgba(99,102,241,0.3)' },
  { name: 'Sharp', value: '4px 4px 0 rgba(0,0,0,0.15)' },
];

/* ========== Element Category Definitions (for LeftSidebar) ========== */

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
      { type: 'image', label: 'Image', icon: 'fas fa-image' },
      { type: 'video', label: 'Video', icon: 'fas fa-video' },
      { type: 'icon', label: 'Icon', icon: 'fas fa-star' },
    ],
  },
  {
    name: 'Content',
    icon: 'fas fa-file-alt',
    items: [
      { type: 'list', label: 'List', icon: 'fas fa-list-ul' },
      { type: 'blockquote', label: 'Quote', icon: 'fas fa-quote-left' },
      { type: 'code', label: 'Code Block', icon: 'fas fa-code' },
      { type: 'form', label: 'Form', icon: 'fas fa-envelope' },
    ],
  },
  {
    name: 'Layout',
    icon: 'fas fa-columns',
    items: [
      { type: 'container', label: 'Container', icon: 'fas fa-box' },
      { type: 'divider', label: 'Divider', icon: 'fas fa-minus' },
      { type: 'spacer', label: 'Spacer', icon: 'fas fa-arrows-alt-v' },
    ],
  },
  {
    name: 'Embed & Social',
    icon: 'fas fa-globe',
    items: [
      { type: 'map', label: 'Map', icon: 'fas fa-map-marker-alt' },
      { type: 'embed', label: 'Embed', icon: 'fas fa-code' },
      { type: 'social-links', label: 'Social Links', icon: 'fas fa-share-alt' },
    ],
  },
];
