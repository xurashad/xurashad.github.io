// ============================================================
// Website Builder Pro — Section, Page & Starter Site Templates
// ============================================================

import type {
  SectionNode, PageData, BuilderProject, AccordionItem, TabItem, TableData,
} from './types';
import {
  createElement, createSection, createRow, createPage,
  createDefaultHeader, createDefaultFooter, DEFAULT_SETTINGS, THEME_PRESETS, uid,
} from './defaults';

/* ========== Section Template Registry (24 Templates) ========== */

export type SectionCategory = 'hero' | 'features' | 'proof' | 'conversion' | 'content' | 'media' | 'layout';

export interface SectionTemplateDef {
  category: SectionCategory;
  name: string;
  description: string;
  icon: string;
  create: () => SectionNode;
}

export const SECTION_TEMPLATES: Record<string, SectionTemplateDef> = {
  // ---- HEROES ----
  hero: {
    category: 'hero',
    name: 'Hero Centered',
    description: 'Bold centered hero with badge, gradient headline, and dual CTAs',
    icon: 'fas fa-rocket',
    create: () => {
      const sec = createSection('Hero');
      sec.anchorId = 'hero';
      sec.styles = { paddingTop: '6.5rem', paddingBottom: '6rem', textAlign: 'center' };
      sec.rows[0].columns[0].elements = [
        createElement('badge', {
          content: 'Version 2.0 Available Now',
          attributes: { icon: 'fas fa-wand-magic-sparkles', variant: 'soft' },
        }),
        createElement('heading', {
          content: 'Build Something Extraordinary',
          headingLevel: 1,
          styles: {
            fontSize: '3.75rem', fontWeight: '800', lineHeight: '1.08',
            letterSpacing: '-0.03em', marginBottom: '1.5rem',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto',
          },
          responsiveStyles: {
            tablet: { fontSize: '2.75rem' },
            mobile: { fontSize: '2.1rem' },
          },
        }),
        createElement('paragraph', {
          content: 'Create expressive, fast, responsive websites with visual controls and zero code bloat. Export clean HTML/CSS/JS anytime.',
          styles: {
            fontSize: '1.2rem', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto',
            opacity: '0.75', marginBottom: '2.25rem',
          },
        }),
        createElement('button', {
          content: 'Get Started Free',
          styles: {
            display: 'inline-block', backgroundColor: 'var(--site-accent)', color: '#ffffff',
            paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
            borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem',
            marginRight: '0.85rem', marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease',
          },
        }),
        createElement('button', {
          content: 'Explore Features',
          styles: {
            display: 'inline-block', backgroundColor: 'transparent', color: 'var(--site-text)',
            paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
            borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem',
            borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)',
            marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease',
          },
        }),
      ];
      return sec;
    },
  },

  heroSplit: {
    category: 'hero',
    name: 'Hero Split Media',
    description: '2-column editorial hero with text left and showcase image right',
    icon: 'fas fa-columns',
    create: () => {
      const sec = createSection('Split Hero');
      sec.styles = { paddingTop: '5.5rem', paddingBottom: '5.5rem' };
      const row = createRow(2);
      row.styles = { alignItems: 'center' };
      row.columns[0].span = 6;
      row.columns[1].span = 6;
      row.columns[0].elements = [
        createElement('badge', { content: 'Crafted for Speed', attributes: { icon: 'fas fa-bolt', variant: 'soft' } }),
        createElement('heading', {
          content: 'Turn Bold Concepts Into Live Products',
          headingLevel: 1,
          styles: { fontSize: '3.15rem', fontWeight: '800', lineHeight: '1.12', marginBottom: '1.25rem' },
          responsiveStyles: { mobile: { fontSize: '2.15rem' } },
        }),
        createElement('paragraph', {
          content: 'Collaborate effortlessly from wireframe to production export with built-in dark mode, design tokens, and responsive precision.',
          styles: { fontSize: '1.125rem', opacity: '0.75', lineHeight: '1.7', marginBottom: '2rem' },
        }),
        createElement('button', {
          content: 'Launch Workspace',
          styles: {
            display: 'inline-block', backgroundColor: 'var(--site-accent)', color: '#ffffff',
            paddingTop: '14px', paddingRight: '28px', paddingBottom: '14px', paddingLeft: '28px',
            borderRadius: '10px', fontWeight: '600', marginRight: '0.75rem', cursor: 'pointer',
          },
        }),
        createElement('link', {
          content: 'View case studies →',
          styles: { color: 'var(--site-accent)', fontWeight: '600', fontSize: '1rem' },
        }),
      ];
      row.columns[1].elements = [
        createElement('image', {
          content: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&q=80',
          attributes: { alt: 'Product interface showcase' },
          styles: { width: '100%', height: '420px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 24px 56px rgba(0,0,0,0.22)' },
        }),
      ];
      sec.rows = [row];
      return sec;
    },
  },

  heroMinimal: {
    category: 'hero',
    name: 'Hero Minimal Typographic',
    description: 'Editorial ultra-clean statement hero with subtle accent CTA',
    icon: 'fas fa-heading',
    create: () => {
      const sec = createSection('Minimal Hero');
      sec.styles = { paddingTop: '7rem', paddingBottom: '5.5rem' };
      sec.rows[0].columns[0].styles = { maxWidth: '880px' };
      sec.rows[0].columns[0].elements = [
        createElement('paragraph', {
          content: 'DIGITAL DESIGN STUDIO — EST. 2026',
          styles: { fontSize: '0.8rem', letterSpacing: '0.16em', fontWeight: '600', color: 'var(--site-accent)', marginBottom: '1.25rem' },
        }),
        createElement('heading', {
          content: 'We craft quiet, confident digital flagships for ambitious founders.',
          headingLevel: 1,
          styles: { fontSize: '3.5rem', fontWeight: '700', lineHeight: '1.12', marginBottom: '1.75rem' },
          responsiveStyles: { mobile: { fontSize: '2.15rem' } },
        }),
        createElement('button', {
          content: 'Start a Conversation →',
          styles: {
            display: 'inline-block', backgroundColor: 'var(--site-text)', color: 'var(--site-bg)',
            paddingTop: '14px', paddingRight: '28px', paddingBottom: '14px', paddingLeft: '28px',
            borderRadius: '9999px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
          },
        }),
      ];
      return sec;
    },
  },

  announcement: {
    category: 'hero',
    name: 'Announcement Strip',
    description: 'Compact top promo banner with highlight pill and link',
    icon: 'fas fa-bullhorn',
    create: () => {
      const sec = createSection('Announcement');
      sec.styles = {
        paddingTop: '0.75rem', paddingBottom: '0.75rem',
        backgroundColor: 'var(--site-accent)', color: '#ffffff', textAlign: 'center',
      };
      sec.rows[0].columns[0].styles = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' };
      sec.rows[0].columns[0].elements = [
        createElement('paragraph', {
          content: '✨ Studio 2.0 is live — explore 27 components & instant multi-page ZIP exports.',
          styles: { marginBottom: '0', fontSize: '0.875rem', fontWeight: '500', color: '#ffffff' },
        }),
        createElement('link', {
          content: 'Learn more →',
          styles: { color: '#ffffff', fontWeight: '700', fontSize: '0.875rem', textDecoration: 'underline' },
        }),
      ];
      return sec;
    },
  },

  // ---- FEATURES ----
  features: {
    category: 'features',
    name: 'Features Grid',
    description: '3-column feature cards with icons and subtle hover lift',
    icon: 'fas fa-th-large',
    create: () => {
      const sec = createSection('Features');
      sec.anchorId = 'features';
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Why Teams Choose Us', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'Everything you need to build, polish, and ship modern web experiences', styles: { textAlign: 'center', opacity: '0.68', marginBottom: '3rem', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' } }),
      ];
      const featureRow = createRow(3);
      const items = [
        { icon: 'fas fa-bolt', title: 'Lightning Fast Output', desc: 'Clean semantic HTML5 and variable-driven CSS with zero runtime bloat.' },
        { icon: 'fas fa-palette', title: 'Curated Design System', desc: 'Switch palettes, typography pairings, and hover transitions globally.' },
        { icon: 'fas fa-mobile-screen-button', title: 'Adaptive Breakpoints', desc: 'Craft custom layouts tailored for desktop, tablet, and mobile screens.' },
      ];
      items.forEach((f, i) => {
        featureRow.columns[i].elements = [
          createElement('card', {
            attributes: { title: f.title, description: f.desc, icon: f.icon, imageUrl: '', ctaText: '', ctaHref: '#', variant: 'elevated' },
          }),
        ];
      });
      sec.rows = [headerRow, featureRow];
      return sec;
    },
  },

  bentoGrid: {
    category: 'features',
    name: 'Bento Grid Showcase',
    description: 'Asymmetric 2-row bento grid combining wide spotlight & KPI cards',
    icon: 'fas fa-border-all',
    create: () => {
      const sec = createSection('Bento Grid');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const titleRow = createRow(1);
      titleRow.columns[0].elements = [
        createElement('heading', { content: 'Engineered for Every Detail', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '2.5rem' } }),
      ];
      const row1 = createRow(2);
      row1.columns[0].span = 8;
      row1.columns[1].span = 4;
      row1.columns[0].elements = [
        createElement('card', {
          attributes: {
            title: 'Real-Time Responsive Canvas',
            description: 'Inspect and adjust spacing, font scales, and column flows across Desktop, Tablet, and Mobile breakpoints instantaneously.',
            icon: 'fas fa-desktop',
            imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
            ctaText: 'Explore Canvas →',
            ctaHref: '#',
            variant: 'elevated',
          },
        }),
      ];
      row1.columns[1].elements = [
        createElement('stat', {
          attributes: { value: '100/100', label: 'Lighthouse Performance', delta: 'Clean HTML', deltaPositive: 'true' },
          styles: { marginBottom: '1rem' },
        }),
        createElement('card', {
          attributes: {
            title: 'Zero Vendor Lock-In',
            description: 'Own your exported code forever — host on GitHub Pages, Vercel, or Netlify.',
            icon: 'fas fa-code',
            imageUrl: '',
            ctaText: '',
            ctaHref: '#',
            variant: 'outlined',
          },
        }),
      ];
      sec.rows = [titleRow, row1];
      return sec;
    },
  },

  steps: {
    category: 'features',
    name: 'Process Steps',
    description: '3-step numbered workflow showing how things work',
    icon: 'fas fa-list-ol',
    create: () => {
      const sec = createSection('Process Steps');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'var(--site-surface)' };
      const hRow = createRow(1);
      hRow.columns[0].elements = [
        createElement('heading', { content: 'How It Works', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const sRow = createRow(3);
      const stepsData = [
        { num: '01', title: 'Choose a Foundation', desc: 'Start with a multi-page website kit or combine modular section templates.' },
        { num: '02', title: 'Customize Visually', desc: 'Edit text inline, fine-tune spacing, add interactive widgets, and preview devices.' },
        { num: '03', title: 'Export & Launch', desc: 'Run the built-in SEO & Accessibility audit, then export clean HTML/CSS/JS.' },
      ];
      stepsData.forEach((st, i) => {
        sRow.columns[i].styles = {
          backgroundColor: 'var(--site-bg)',
          paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1.75rem', paddingRight: '1.75rem',
          borderRadius: '14px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)',
        };
        sRow.columns[i].elements = [
          createElement('heading', { content: st.num, headingLevel: 3, styles: { fontSize: '2rem', fontWeight: '800', color: 'var(--site-accent)', marginBottom: '0.75rem' } }),
          createElement('heading', { content: st.title, headingLevel: 4, styles: { fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' } }),
          createElement('paragraph', { content: st.desc, styles: { fontSize: '0.95rem', opacity: '0.72', marginBottom: '0' } }),
        ];
      });
      sec.rows = [hRow, sRow];
      return sec;
    },
  },

  tabsShowcase: {
    category: 'features',
    name: 'Interactive Tabs Showcase',
    description: 'Tabbed feature spotlight paired with a preview visual',
    icon: 'fas fa-folder-open',
    create: () => {
      const sec = createSection('Tabs Showcase');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const row = createRow(2);
      row.styles = { alignItems: 'center' };
      row.columns[0].span = 6;
      row.columns[1].span = 6;
      const items: TabItem[] = [
        { id: 'ts1', label: 'Architecture', content: 'Organize multi-page projects with nested subpages, reusable headers, and sticky navigation.' },
        { id: 'ts2', label: 'Styling Engine', content: 'Fine-tune padding, margins, gradients, borders, shadows, and :hover transitions with zero guesswork.' },
        { id: 'ts3', label: 'Static Export', content: 'Generate standards-compliant HTML5, scoped CSS variables, sitemap.xml, and clean vanilla JS.' },
      ];
      row.columns[0].elements = [
        createElement('heading', { content: 'Built for Precision Workflows', headingLevel: 2, styles: { fontSize: '2.15rem', fontWeight: '700', marginBottom: '1.25rem' } }),
        createElement('tabs', { attributes: { items: JSON.stringify(items), variant: 'pills' } }),
      ];
      row.columns[1].elements = [
        createElement('image', {
          content: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=80',
          attributes: { alt: 'Team collaborating on design workflow' },
          styles: { width: '100%', height: '360px', objectFit: 'cover', borderRadius: '14px' },
        }),
      ];
      sec.rows = [row];
      return sec;
    },
  },

  // ---- SOCIAL PROOF ----
  stats: {
    category: 'proof',
    name: 'Statistics Bar',
    description: '4-column KPI metrics bar with growth deltas',
    icon: 'fas fa-chart-bar',
    create: () => {
      const sec = createSection('Stats');
      sec.styles = { paddingTop: '4rem', paddingBottom: '4rem', backgroundColor: 'var(--site-surface)' };
      const row = createRow(4);
      const metrics = [
        { value: '42K+', label: 'Sites Launched', delta: '+18% MoM', positive: 'true' },
        { value: '99.98%', label: 'Uptime SLA', delta: 'Verified', positive: 'true' },
        { value: '<1.1s', label: 'Median Load Time', delta: '-34% faster', positive: 'true' },
        { value: '4.9/5', label: 'Creator Rating', delta: '2.4k reviews', positive: 'true' },
      ];
      metrics.forEach((m, i) => {
        row.columns[i].span = 3;
        row.columns[i].elements = [
          createElement('stat', {
            attributes: { value: m.value, label: m.label, delta: m.delta, deltaPositive: m.positive },
          }),
        ];
      });
      sec.rows = [row];
      return sec;
    },
  },

  testimonialsGrid: {
    category: 'proof',
    name: 'Testimonials Grid',
    description: '3-column customer review cards with star ratings and avatars',
    icon: 'fas fa-star',
    create: () => {
      const sec = createSection('Testimonials');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const hRow = createRow(1);
      hRow.columns[0].elements = [
        createElement('heading', { content: 'Loved by Designers & Engineers', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const tRow = createRow(3);
      const reviews = [
        {
          quote: '"We migrated three marketing microsites in a single afternoon. The clean ZIP export dropped straight into our static hosting."',
          name: 'Sarah Johnson', role: 'VP Design at LinearFlow',
          img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80',
        },
        {
          quote: '"Having true mobile overrides alongside live HTML/CSS inspection gives us the speed of no-code with full developer confidence."',
          name: 'David Park', role: 'Staff Engineer at Nimbus',
          img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&q=80',
        },
        {
          quote: '"The theme presets and interactive accordions saved days of custom front-end work for our client launches."',
          name: 'Amira Haddad', role: 'Founder at Atelier North',
          img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&q=80',
        },
      ];
      reviews.forEach((r, i) => {
        tRow.columns[i].styles = {
          backgroundColor: 'var(--site-surface)', paddingTop: '1.75rem', paddingBottom: '1.75rem',
          paddingLeft: '1.75rem', paddingRight: '1.75rem', borderRadius: '14px',
          borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)',
        };
        tRow.columns[i].elements = [
          createElement('paragraph', { content: r.quote, styles: { fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1.5rem' } }),
          createElement('avatar', { attributes: { imageUrl: r.img, name: r.name, role: r.role, rating: '5' } }),
        ];
      });
      sec.rows = [hRow, tRow];
      return sec;
    },
  },

  testimonial: {
    category: 'proof',
    name: 'Featured Quote',
    description: 'Centered spotlight testimonial with large quote & author badge',
    icon: 'fas fa-quote-left',
    create: () => {
      const sec = createSection('Testimonial');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'var(--site-surface)' };
      sec.rows[0].columns[0].styles = { textAlign: 'center', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' };
      sec.rows[0].columns[0].elements = [
        createElement('icon', { content: 'fas fa-quote-left', styles: { fontSize: '2rem', color: 'var(--site-accent)', marginBottom: '1.5rem' } }),
        createElement('blockquote', {
          content: '"This studio transformed how our agency delivers landing pages. Every exported site scores 100 on performance out of the box."',
          styles: { fontSize: '1.35rem', lineHeight: '1.75', fontStyle: 'italic', borderLeft: 'none', paddingLeft: '0', marginBottom: '1.75rem' },
        }),
        createElement('paragraph', { content: '— Sarah Johnson, Creative Director at TechStart', styles: { fontWeight: '600', fontSize: '0.95rem', marginBottom: '0' } }),
      ];
      return sec;
    },
  },

  logoCloud: {
    category: 'proof',
    name: 'Logo Cloud',
    description: '4-column trusted partner & brand strip',
    icon: 'fas fa-building',
    create: () => {
      const sec = createSection('Partners');
      sec.styles = { paddingTop: '3.25rem', paddingBottom: '3.25rem', backgroundColor: 'var(--site-surface)' };
      sec.rows[0].columns[0].elements = [
        createElement('paragraph', {
          content: 'TRUSTED BY INNOVATIVE TEAMS WORLDWIDE',
          styles: { textAlign: 'center', opacity: '0.55', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: '600', marginBottom: '2rem' },
        }),
      ];
      const logoRow = createRow(4);
      const brands = ['Aether Labs', 'Vertex Cloud', 'Nordic Craft', 'Quantum Studio'];
      brands.forEach((b, i) => {
        logoRow.columns[i].span = 3;
        logoRow.columns[i].styles = { display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '0.75rem', paddingBottom: '0.75rem' };
        logoRow.columns[i].elements = [
          createElement('heading', { content: b, headingLevel: 4, styles: { fontSize: '1.15rem', fontWeight: '700', opacity: '0.45', textAlign: 'center', marginBottom: '0' } }),
        ];
      });
      sec.rows.push(logoRow);
      return sec;
    },
  },

  // ---- CONVERSION ----
  pricing: {
    category: 'conversion',
    name: 'Pricing Tiers',
    description: '3-tier pricing cards with highlighted Pro recommendation',
    icon: 'fas fa-tags',
    create: () => {
      const sec = createSection('Pricing');
      sec.anchorId = 'pricing';
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Simple, Transparent Pricing', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'Start free and upgrade when your audience grows', styles: { textAlign: 'center', opacity: '0.68', marginBottom: '3rem' } }),
      ];
      const pricingRow = createRow(3);
      const plans = [
        { name: 'Starter', price: '$9', period: '/month', features: '1 Website\n5 Custom Pages\nTheme Presets\nZIP HTML Export', cta: 'Get Started', highlighted: false },
        { name: 'Pro Studio', price: '$29', period: '/month', features: '10 Websites\nUnlimited Pages\nResponsive Overrides\nPriority Support\nAnalytics & SEO Audit', cta: 'Start Free Trial', highlighted: true },
        { name: 'Enterprise', price: '$99', period: '/month', features: 'Unlimited Sites\nTeam Workspaces\nCustom Components\nWhite Label Export\nDedicated SLA', cta: 'Contact Sales', highlighted: false },
      ];
      plans.forEach((plan, i) => {
        pricingRow.columns[i].styles = plan.highlighted
          ? {
              backgroundColor: 'var(--site-accent)', color: '#ffffff',
              paddingTop: '2.5rem', paddingBottom: '2.5rem', paddingLeft: '2rem', paddingRight: '2rem',
              borderRadius: '16px', textAlign: 'center', boxShadow: '0 20px 44px rgba(99,102,241,0.28)',
            }
          : {
              backgroundColor: 'var(--site-surface)',
              paddingTop: '2.5rem', paddingBottom: '2.5rem', paddingLeft: '2rem', paddingRight: '2rem',
              borderRadius: '16px', textAlign: 'center', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)',
            };
        pricingRow.columns[i].elements = [
          createElement('heading', { content: plan.name, headingLevel: 3, styles: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: plan.highlighted ? '#ffffff' : undefined } }),
          createElement('heading', { content: plan.price, headingLevel: 2, styles: { fontSize: '3rem', fontWeight: '800', marginBottom: '0', color: plan.highlighted ? '#ffffff' : undefined } }),
          createElement('paragraph', { content: plan.period, styles: { opacity: '0.75', marginBottom: '1.5rem', color: plan.highlighted ? 'rgba(255,255,255,0.85)' : undefined } }),
          createElement('list', {
            content: plan.features.split('\n').map(f => `<li>${f}</li>`).join(''),
            attributes: { listTag: 'checklist' },
            styles: { textAlign: 'left', marginBottom: '2rem', listStyleType: 'none', paddingLeft: '0', fontSize: '0.95rem', lineHeight: '2', color: plan.highlighted ? 'rgba(255,255,255,0.95)' : undefined },
          }),
          createElement('button', {
            content: plan.cta,
            styles: {
              display: 'inline-block', width: '100%',
              backgroundColor: plan.highlighted ? '#ffffff' : 'var(--site-accent)',
              color: plan.highlighted ? 'var(--site-accent)' : '#ffffff',
              paddingTop: '12px', paddingBottom: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
            },
          }),
        ];
      });
      sec.rows = [headerRow, pricingRow];
      return sec;
    },
  },

  comparisonTable: {
    category: 'conversion',
    name: 'Feature Comparison Table',
    description: 'Clean striped comparison table across plans',
    icon: 'fas fa-table',
    create: () => {
      const sec = createSection('Plan Comparison');
      sec.styles = { paddingTop: '4.5rem', paddingBottom: '4.5rem' };
      const tableData: TableData = {
        headers: ['Capability', 'Starter', 'Pro Studio', 'Enterprise'],
        rows: [
          ['Pages & Subpages', '5 pages', 'Unlimited', 'Unlimited'],
          ['Interactive Widgets', 'Included', 'Included', 'Included'],
          ['Responsive Breakpoints', 'Auto Stack', 'Full Overrides', 'Full Overrides'],
          ['SEO & A11y Site Audit', 'Basic', 'Full Report', 'Full Report'],
          ['Export Format', 'Single HTML / ZIP', 'Multi-Page ZIP', 'Multi-Page ZIP'],
        ],
        striped: true,
      };
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Compare Every Feature', headingLevel: 2, styles: { fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '2rem' } }),
        createElement('table', { attributes: { tableData: JSON.stringify(tableData) } }),
      ];
      return sec;
    },
  },

  cta: {
    category: 'conversion',
    name: 'Call to Action Banner',
    description: 'High-contrast accent CTA banner',
    icon: 'fas fa-wand-magic-sparkles',
    create: () => {
      const sec = createSection('CTA');
      sec.anchorId = 'cta';
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'var(--site-accent)', textAlign: 'center' };
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Ready to Build Something Great?', headingLevel: 2, styles: { fontSize: '2.5rem', fontWeight: '800', color: '#ffffff', marginBottom: '1rem' } }),
        createElement('paragraph', { content: 'Join thousands of creators shipping clean, responsive websites directly from the browser.', styles: { fontSize: '1.15rem', color: 'rgba(255,255,255,0.88)', marginBottom: '2rem', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' } }),
        createElement('button', {
          content: 'Start Building Free',
          styles: {
            display: 'inline-block', backgroundColor: '#ffffff', color: 'var(--site-accent)',
            paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px',
            borderRadius: '10px', fontWeight: '700', fontSize: '1.05rem', cursor: 'pointer',
          },
        }),
      ];
      return sec;
    },
  },

  newsletter: {
    category: 'conversion',
    name: 'Newsletter Signup',
    description: 'Focused email capture card with customizable form',
    icon: 'fas fa-paper-plane',
    create: () => {
      const sec = createSection('Newsletter');
      sec.styles = { paddingTop: '4.5rem', paddingBottom: '4.5rem', backgroundColor: 'var(--site-surface)', textAlign: 'center' };
      sec.rows[0].columns[0].styles = { maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' };
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Stay in the Loop', headingLevel: 2, styles: { fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'Monthly product notes, design templates, and front-end craft — no spam.', styles: { opacity: '0.7', marginBottom: '1.75rem' } }),
        createElement('form', {
          attributes: {
            action: '#',
            method: 'POST',
            submitText: 'Subscribe',
            successMessage: 'Welcome aboard! Check your inbox soon.',
            fields: JSON.stringify([
              { id: 'nl_email', type: 'email', label: 'Email Address', name: 'email', placeholder: 'you@domain.com', required: true },
            ]),
          },
          styles: { display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', textAlign: 'left' },
        }),
      ];
      return sec;
    },
  },

  // ---- CONTENT ----
  faqAccordion: {
    category: 'content',
    name: 'Interactive FAQ Accordion',
    description: 'Expandable FAQ section with smooth accordion toggles',
    icon: 'fas fa-question-circle',
    create: () => {
      const sec = createSection('FAQ');
      sec.anchorId = 'faq';
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      sec.rows[0].columns[0].styles = { maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto' };
      const items: AccordionItem[] = [
        { id: 'fq1', title: 'How does multi-page export work?', content: 'Every page you create in the Pages tab compiles into its own clean HTML file connected by an automatic navigation header and sitemap.xml.', openByDefault: true },
        { id: 'fq2', title: 'Can I customize tablet and mobile views separately?', content: 'Yes. Switch to Tablet or Mobile in the top bar and any Layout or Typography tweak applies specifically to that breakpoint.' },
        { id: 'fq3', title: 'Are the interactive elements self-contained?', content: 'Accordions, tabs, mobile navigation drawers, scroll animations, and form validation run on tiny zero-dependency vanilla JavaScript included in your export.' },
        { id: 'fq4', title: 'Where can I host the exported ZIP?', content: 'Anywhere! Upload directly to GitHub Pages, Netlify Drop, Cloudflare Pages, Vercel, or any traditional web server.' },
      ];
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Frequently Asked Questions', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'Answers to common questions about building and exporting your website', styles: { textAlign: 'center', opacity: '0.68', marginBottom: '2.5rem' } }),
        createElement('accordion', { attributes: { items: JSON.stringify(items), allowMultiple: 'false' } }),
      ];
      return sec;
    },
  },

  team: {
    category: 'content',
    name: 'Team Directory',
    description: '3-column team grid with portraits, titles & bios',
    icon: 'fas fa-users',
    create: () => {
      const sec = createSection('Team');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Meet the Leadership Team', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const teamRow = createRow(3);
      const members = [
        { name: 'Alex Chen', role: 'CEO & Co-Founder', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
        { name: 'Maria Garcia', role: 'Head of Design', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
        { name: 'James Wilson', role: 'Principal Architect', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' },
      ];
      members.forEach((m, i) => {
        teamRow.columns[i].styles = { textAlign: 'center' };
        teamRow.columns[i].elements = [
          createElement('image', { content: m.img, attributes: { alt: m.name }, styles: { width: '128px', height: '128px', borderRadius: '50%', objectFit: 'cover', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' } }),
          createElement('heading', { content: m.name, headingLevel: 3, styles: { fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem' } }),
          createElement('paragraph', { content: m.role, styles: { opacity: '0.68', fontSize: '0.95rem', marginBottom: '0.75rem' } }),
          createElement('social-links', { styles: { display: 'flex', justifyContent: 'center', gap: '0.65rem', fontSize: '0.95rem' } }),
        ];
      });
      sec.rows = [headerRow, teamRow];
      return sec;
    },
  },

  portfolio: {
    category: 'content',
    name: 'Portfolio Showcase',
    description: '3-column featured case study cards with imagery',
    icon: 'fas fa-briefcase',
    create: () => {
      const sec = createSection('Portfolio');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Selected Projects', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const gridRow = createRow(3);
      const projects = [
        { title: 'Nova Commerce Platform', desc: 'High-conversion storefront & design system', img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&q=80' },
        { title: 'Meridian FinTech App', desc: 'Mobile-first personal wealth experience', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=700&q=80' },
        { title: 'Telemetry Cloud Console', desc: 'Real-time observability dashboard suite', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&q=80' },
      ];
      projects.forEach((p, i) => {
        gridRow.columns[i].elements = [
          createElement('card', {
            attributes: { title: p.title, description: p.desc, icon: '', imageUrl: p.img, ctaText: 'View Case Study →', ctaHref: '#', variant: 'elevated' },
          }),
        ];
      });
      sec.rows = [headerRow, gridRow];
      return sec;
    },
  },

  blog: {
    category: 'content',
    name: 'Blog Articles Grid',
    description: '3-column editorial article cards with dates & links',
    icon: 'fas fa-newspaper',
    create: () => {
      const sec = createSection('Blog');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Latest from the Journal', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const cardRow = createRow(3);
      const posts = [
        { title: 'Designing High-Contrast Systems That Scale', date: 'Nov 12, 2026 · 5 min read', img: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=80' },
        { title: 'Why Static HTML Exports Are Winning Again', date: 'Nov 04, 2026 · 4 min read', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80' },
        { title: 'Fluid Typography & Breakpoint Craft', date: 'Oct 28, 2026 · 6 min read', img: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&q=80' },
      ];
      posts.forEach((post, i) => {
        cardRow.columns[i].styles = {
          borderRadius: '14px', overflow: 'hidden', borderWidth: '1px', borderStyle: 'solid',
          borderColor: 'var(--site-border)', backgroundColor: 'var(--site-surface)',
        };
        cardRow.columns[i].elements = [
          createElement('image', { content: post.img, attributes: { alt: post.title }, styles: { width: '100%', height: '190px', objectFit: 'cover', borderRadius: '0' } }),
          createElement('paragraph', { content: post.date, styles: { fontSize: '0.8rem', opacity: '0.6', paddingTop: '1rem', paddingLeft: '1.25rem', paddingRight: '1.25rem', marginBottom: '0.35rem' } }),
          createElement('heading', { content: post.title, headingLevel: 3, styles: { fontSize: '1.1rem', fontWeight: '700', paddingLeft: '1.25rem', paddingRight: '1.25rem', marginBottom: '0.85rem' } }),
          createElement('link', { content: 'Read article →', attributes: { href: '#' }, styles: { color: 'var(--site-accent)', fontSize: '0.9rem', fontWeight: '600', paddingLeft: '1.25rem', paddingBottom: '1.25rem', display: 'block' } }),
        ];
      });
      sec.rows = [headerRow, cardRow];
      return sec;
    },
  },

  contact: {
    category: 'content',
    name: 'Contact & Form',
    description: '2-column contact info & interactive message form',
    icon: 'fas fa-envelope',
    create: () => {
      const sec = createSection('Contact');
      sec.anchorId = 'contact';
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      sec.rows = [createRow(2)];
      sec.rows[0].columns[0].span = 5;
      sec.rows[0].columns[1].span = 7;
      sec.rows[0].columns[0].elements = [
        createElement('badge', { content: 'Contact Us', attributes: { icon: 'fas fa-envelope', variant: 'soft' } }),
        createElement('heading', { content: 'Let’s Build Together', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', marginBottom: '1rem' } }),
        createElement('paragraph', { content: "Have a project in mind or a question about our studio? Drop a message and we'll respond within 24 hours.", styles: { opacity: '0.75', marginBottom: '1.5rem', lineHeight: '1.7' } }),
        createElement('alert', {
          attributes: { variant: 'info', title: 'Direct Email: hello@studio.example', icon: 'fas fa-paper-plane' },
          content: 'Available Monday – Friday, 9:00 AM to 6:00 PM UTC.',
        }),
      ];
      sec.rows[0].columns[1].styles = {
        backgroundColor: 'var(--site-surface)',
        paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '2rem', paddingRight: '2rem',
        borderRadius: '16px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)',
      };
      sec.rows[0].columns[1].elements = [
        createElement('form', { attributes: { action: '#', method: 'POST', submitText: 'Send Message' } }),
      ];
      return sec;
    },
  },

  // ---- MEDIA & LAYOUT ----
  gallery: {
    category: 'media',
    name: 'Photo Gallery',
    description: '3-column curated photography grid',
    icon: 'fas fa-images',
    create: () => {
      const sec = createSection('Gallery');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Visual Gallery', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const imgRow = createRow(3);
      const images = [
        { src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80', alt: 'Developer workspace' },
        { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&q=80', alt: 'Analytics design' },
        { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=700&q=80', alt: 'Collaborative studio' },
      ];
      images.forEach((img, i) => {
        imgRow.columns[i].elements = [
          createElement('image', { content: img.src, attributes: { alt: img.alt }, styles: { width: '100%', height: '260px', objectFit: 'cover', borderRadius: '14px' } }),
        ];
      });
      sec.rows = [headerRow, imgRow];
      return sec;
    },
  },

  videoShowcase: {
    category: 'media',
    name: 'Video Spotlight',
    description: 'Centered widescreen video walkthrough section',
    icon: 'fas fa-play-circle',
    create: () => {
      const sec = createSection('Video Spotlight');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'var(--site-surface)' };
      sec.rows[0].columns[0].styles = { maxWidth: '880px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' };
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Watch It in Action', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'A quick 2-minute tour through visual layout editing, theming, and instant exports.', styles: { opacity: '0.72', marginBottom: '2rem' } }),
        createElement('video'),
      ];
      return sec;
    },
  },

  twoColBlank: {
    category: 'layout',
    name: '2-Column Blank Row',
    description: 'Clean 50/50 split layout container ready for custom content',
    icon: 'fas fa-table-columns',
    create: () => {
      const sec = createSection('2-Column Section');
      sec.rows = [createRow(2)];
      return sec;
    },
  },
};

/* ========== Single-Page Templates (for + Add Page) ========== */

export interface PageTemplateDef {
  name: string;
  description: string;
  create: () => PageData[];
}

export const SINGLE_PAGE_TEMPLATES: Record<string, PageTemplateDef> = {
  blank: {
    name: 'Blank Page',
    description: 'Minimal starting page with heading and paragraph',
    create: () => [createPage('Untitled Page', 'page')],
  },
  landing: {
    name: 'Landing Page',
    description: 'Hero, Features, Stats, Testimonials, Pricing, CTA',
    create: () => {
      const page = createPage('Landing', 'landing');
      page.sections = [
        SECTION_TEMPLATES.hero.create(),
        SECTION_TEMPLATES.logoCloud.create(),
        SECTION_TEMPLATES.features.create(),
        SECTION_TEMPLATES.stats.create(),
        SECTION_TEMPLATES.testimonialsGrid.create(),
        SECTION_TEMPLATES.pricing.create(),
        SECTION_TEMPLATES.cta.create(),
      ];
      return [page];
    },
  },
  about: {
    name: 'About Us',
    description: 'Minimal Hero, Process Steps, Team, Stats',
    create: () => {
      const page = createPage('About', 'about');
      page.sections = [
        SECTION_TEMPLATES.heroMinimal.create(),
        SECTION_TEMPLATES.stats.create(),
        SECTION_TEMPLATES.steps.create(),
        SECTION_TEMPLATES.team.create(),
      ];
      return [page];
    },
  },
  pricing: {
    name: 'Pricing Page',
    description: 'Pricing Tiers, Feature Comparison, FAQ',
    create: () => {
      const page = createPage('Pricing', 'pricing');
      page.sections = [
        SECTION_TEMPLATES.pricing.create(),
        SECTION_TEMPLATES.comparisonTable.create(),
        SECTION_TEMPLATES.faqAccordion.create(),
      ];
      return [page];
    },
  },
  contact: {
    name: 'Contact Page',
    description: 'Contact Form & FAQ Accordion',
    create: () => {
      const page = createPage('Contact', 'contact');
      page.sections = [
        SECTION_TEMPLATES.contact.create(),
        SECTION_TEMPLATES.faqAccordion.create(),
      ];
      return [page];
    },
  },
  blog: {
    name: 'Blog / Journal',
    description: 'Blog Article Grid & Newsletter Signup',
    create: () => {
      const page = createPage('Blog', 'blog');
      page.sections = [
        SECTION_TEMPLATES.blog.create(),
        SECTION_TEMPLATES.newsletter.create(),
      ];
      return [page];
    },
  },
};

export const PAGE_TEMPLATES = SINGLE_PAGE_TEMPLATES;

/* ========== Complete Multi-Page Starter Websites (7 Kits) ========== */

export interface SiteTemplateDef {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  pageNames: string[];
  accentColor: string;
  create: () => BuilderProject;
}

function buildStarterProject(
  name: string,
  presetId: string,
  pages: PageData[],
  ctaText = 'Get Started',
): BuilderProject {
  const preset = THEME_PRESETS.find(p => p.id === presetId) ?? THEME_PRESETS[0];
  const pagesMap: Record<string, PageData> = {};
  const pageOrder: string[] = [];
  pages.forEach((p, idx) => {
    p.order = idx;
    pagesMap[p.id] = p;
    pageOrder.push(p.id);
  });

  return {
    id: uid('proj'),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: pagesMap,
    pageOrder,
    header: createDefaultHeader(name),
    footer: createDefaultFooter(name),
    theme: JSON.parse(JSON.stringify(preset.theme)),
    assets: {},
    settings: {
      ...DEFAULT_SETTINGS,
      siteName: name,
      headerCtaEnabled: true,
      headerCtaText: ctaText,
      headerCtaHref: pages.length > 1 ? `page:${pages[pages.length - 1].id}` : '#contact',
    },
  };
}

export const SITE_TEMPLATES: SiteTemplateDef[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    tagline: 'Clean single page ready for your custom vision',
    icon: '📄',
    pageNames: ['Home'],
    accentColor: '#6366f1',
    create: () => {
      const home = createPage('Home', 'index');
      return buildStarterProject('Blank Website', 'indigo-studio', [home], 'Contact');
    },
  },
  {
    id: 'saas',
    name: 'SaaS Product',
    tagline: 'Multi-page software site with Bento features, pricing & FAQ',
    icon: '🚀',
    pageNames: ['Home', 'Pricing', 'Contact'],
    accentColor: '#6366f1',
    create: () => {
      const home = createPage('Home', 'index');
      home.sections = [
        SECTION_TEMPLATES.heroSplit.create(),
        SECTION_TEMPLATES.logoCloud.create(),
        SECTION_TEMPLATES.bentoGrid.create(),
        SECTION_TEMPLATES.tabsShowcase.create(),
        SECTION_TEMPLATES.testimonialsGrid.create(),
        SECTION_TEMPLATES.cta.create(),
      ];
      const pricing = createPage('Pricing', 'pricing');
      pricing.sections = [
        SECTION_TEMPLATES.pricing.create(),
        SECTION_TEMPLATES.comparisonTable.create(),
        SECTION_TEMPLATES.faqAccordion.create(),
      ];
      const contact = createPage('Contact', 'contact');
      contact.sections = [SECTION_TEMPLATES.contact.create()];
      return buildStarterProject('PulseCloud SaaS', 'indigo-studio', [home, pricing, contact], 'Start Free Trial');
    },
  },
  {
    id: 'portfolio',
    name: 'Creative Portfolio',
    tagline: 'Editorial showcase for designers, engineers & studios',
    icon: '💼',
    pageNames: ['Home', 'Projects', 'About'],
    accentColor: '#18181b',
    create: () => {
      const home = createPage('Home', 'index');
      home.sections = [
        SECTION_TEMPLATES.heroMinimal.create(),
        SECTION_TEMPLATES.portfolio.create(),
        SECTION_TEMPLATES.testimonial.create(),
        SECTION_TEMPLATES.contact.create(),
      ];
      const projects = createPage('Projects', 'projects');
      projects.sections = [
        SECTION_TEMPLATES.portfolio.create(),
        SECTION_TEMPLATES.gallery.create(),
      ];
      const about = createPage('About', 'about');
      about.sections = [
        SECTION_TEMPLATES.steps.create(),
        SECTION_TEMPLATES.team.create(),
      ];
      return buildStarterProject('Atelier Noir', 'editorial-noir', [home, projects, about], 'Hire Me');
    },
  },
  {
    id: 'agency',
    name: 'Digital Agency',
    tagline: 'Modern tech agency kit with workflow steps & team',
    icon: '🏢',
    pageNames: ['Home', 'Services', 'Contact'],
    accentColor: '#06b6d4',
    create: () => {
      const home = createPage('Home', 'index');
      home.sections = [
        SECTION_TEMPLATES.hero.create(),
        SECTION_TEMPLATES.stats.create(),
        SECTION_TEMPLATES.features.create(),
        SECTION_TEMPLATES.cta.create(),
      ];
      const services = createPage('Services', 'services');
      services.sections = [
        SECTION_TEMPLATES.steps.create(),
        SECTION_TEMPLATES.team.create(),
      ];
      const contact = createPage('Contact', 'contact');
      contact.sections = [SECTION_TEMPLATES.contact.create()];
      return buildStarterProject('CyberForge Studio', 'obsidian-cyber', [home, services, contact], 'Book Discovery');
    },
  },
  {
    id: 'restaurant',
    name: 'Bistro & Hospitality',
    tagline: 'Warm artisanal dining site with menu table & reservations',
    icon: '🍽️',
    pageNames: ['Home', 'Menu', 'Reservations'],
    accentColor: '#d95d39',
    create: () => {
      const home = createPage('Home', 'index');
      const heroSec = SECTION_TEMPLATES.heroSplit.create();
      heroSec.rows[0].columns[0].elements[0].content = 'Seasonal Wood-Fired Dining';
      heroSec.rows[0].columns[0].elements[1].content = 'Crafted Daily From Local Harvests';
      heroSec.rows[0].columns[0].elements[2].content = 'Experience hand-rolled pasta, hearth-baked bread, and natural cellar pairings in a warm neighborhood setting.';
      heroSec.rows[0].columns[1].elements[0].content = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80';
      home.sections = [heroSec, SECTION_TEMPLATES.gallery.create(), SECTION_TEMPLATES.testimonial.create()];

      const menu = createPage('Menu', 'menu');
      const menuSec = createSection('Seasonal Menu');
      const menuTable: TableData = {
        headers: ['Dish', 'Category', 'Price'],
        rows: [
          ['Wood-Roasted Heirloom Carrots', 'Starter', '$14'],
          ['Truffle Tagliatelle & Wild Mushroom', 'Main', '$28'],
          ['Charred Sea Bass with Meyer Lemon', 'Main', '$34'],
          ['Burnt Honey Panna Cotta', 'Dessert', '$13'],
        ],
        striped: true,
      };
      menuSec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Autumn Tasting Menu', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '2rem' } }),
        createElement('table', { attributes: { tableData: JSON.stringify(menuTable) } }),
      ];
      menu.sections = [menuSec];

      const res = createPage('Reservations', 'reservations');
      res.sections = [SECTION_TEMPLATES.contact.create()];

      return buildStarterProject('Saffron & Hearth', 'warm-terracotta', [home, menu, res], 'Reserve Table');
    },
  },
  {
    id: 'launch',
    name: 'Product Launch',
    tagline: 'Focused announcement, video tour, and interactive FAQ',
    icon: '✨',
    pageNames: ['Launch', 'FAQ'],
    accentColor: '#8b5cf6',
    create: () => {
      const launch = createPage('Launch', 'index');
      launch.sections = [
        SECTION_TEMPLATES.announcement.create(),
        SECTION_TEMPLATES.hero.create(),
        SECTION_TEMPLATES.videoShowcase.create(),
        SECTION_TEMPLATES.newsletter.create(),
      ];
      const faq = createPage('FAQ', 'faq');
      faq.sections = [SECTION_TEMPLATES.faqAccordion.create()];
      return buildStarterProject('Aurora Launchpad', 'solar-violet', [launch, faq], 'Join Waitlist');
    },
  },
  {
    id: 'blog',
    name: 'Editorial Publication',
    tagline: 'Content-first magazine & newsletter template',
    icon: '📰',
    pageNames: ['Home', 'About'],
    accentColor: '#10b981',
    create: () => {
      const home = createPage('Home', 'index');
      home.sections = [
        SECTION_TEMPLATES.heroMinimal.create(),
        SECTION_TEMPLATES.blog.create(),
        SECTION_TEMPLATES.newsletter.create(),
      ];
      const about = createPage('About', 'about');
      about.sections = [
        SECTION_TEMPLATES.team.create(),
        SECTION_TEMPLATES.contact.create(),
      ];
      return buildStarterProject('Verdant Journal', 'emerald-minimal', [home, about], 'Subscribe');
    },
  },
];
