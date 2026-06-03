// ============================================================
// Website Builder Pro — Section & Page Templates
// ============================================================

import type { SectionNode, PageData } from './types';
import {
  createElement, createSection, createRow, createColumn, createPage, uid,
} from './defaults';

/* ========== Section Template Registry ========== */

export interface SectionTemplateDef {
  name: string;
  description: string;
  icon: string;
  create: () => SectionNode;
}

export const SECTION_TEMPLATES: Record<string, SectionTemplateDef> = {
  hero: {
    name: 'Hero',
    description: 'Full-width hero with heading, subtitle, and CTA buttons',
    icon: 'fas fa-rocket',
    create: () => {
      const sec = createSection('Hero');
      sec.styles = { paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' };
      sec.rows[0].columns[0].elements = [
        createElement('heading', {
          content: 'Build Something Amazing',
          headingLevel: 1,
          styles: { fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' },
        }),
        createElement('paragraph', {
          content: 'Create beautiful, responsive websites without writing a single line of code. Our intuitive builder makes it easy.',
          styles: { fontSize: '1.25rem', maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto', opacity: '0.7', marginBottom: '2.5rem' },
        }),
        createElement('button', { content: 'Get Started Free', styles: { display: 'inline-block', backgroundColor: 'var(--site-accent)', color: '#fff', paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px', borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem', marginRight: '1rem', cursor: 'pointer', transition: 'all 0.2s ease' } }),
        createElement('button', { content: 'Watch Demo', styles: { display: 'inline-block', backgroundColor: 'transparent', color: 'var(--site-text)', paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px', borderRadius: '10px', fontWeight: '600', fontSize: '1.05rem', borderWidth: '2px', borderStyle: 'solid', borderColor: 'var(--site-border)', cursor: 'pointer', transition: 'all 0.2s ease' } }),
      ];
      return sec;
    },
  },

  features: {
    name: 'Features',
    description: '3-column feature grid with icons',
    icon: 'fas fa-th-large',
    create: () => {
      const sec = createSection('Features');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Why Choose Us', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'Everything you need to build professional websites', styles: { textAlign: 'center', opacity: '0.6', marginBottom: '3rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' } }),
      ];
      const featureRow = createRow(3);
      const features = [
        { icon: 'fas fa-bolt', title: 'Lightning Fast', desc: 'Optimized for speed with lazy loading and efficient code output.' },
        { icon: 'fas fa-palette', title: 'Beautiful Design', desc: 'Stunning templates and a powerful style editor for pixel-perfect results.' },
        { icon: 'fas fa-mobile-alt', title: 'Fully Responsive', desc: 'Every site looks great on desktop, tablet, and mobile devices.' },
      ];
      features.forEach((f, i) => {
        featureRow.columns[i].elements = [
          createElement('icon', { content: f.icon, styles: { fontSize: '2.5rem', color: 'var(--site-accent)', marginBottom: '1rem' } }),
          createElement('heading', { content: f.title, headingLevel: 3, styles: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' } }),
          createElement('paragraph', { content: f.desc, styles: { fontSize: '0.95rem', opacity: '0.7', lineHeight: '1.7' } }),
        ];
        featureRow.columns[i].styles = { textAlign: 'center', paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' };
      });
      sec.rows = [headerRow, featureRow];
      return sec;
    },
  },

  testimonial: {
    name: 'Testimonial',
    description: 'Customer testimonial with quote and attribution',
    icon: 'fas fa-quote-left',
    create: () => {
      const sec = createSection('Testimonial');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'var(--site-surface)' };
      sec.rows[0].columns[0].styles = { textAlign: 'center', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' };
      sec.rows[0].columns[0].elements = [
        createElement('icon', { content: 'fas fa-quote-left', styles: { fontSize: '2rem', color: 'var(--site-accent)', marginBottom: '1.5rem' } }),
        createElement('blockquote', { content: '"This website builder transformed how we create our online presence. The intuitive interface and beautiful templates saved us countless hours."', styles: { fontSize: '1.25rem', lineHeight: '1.8', fontStyle: 'italic', borderLeft: 'none', paddingLeft: '0', marginBottom: '2rem', opacity: '0.9' } }),
        createElement('paragraph', { content: '— Sarah Johnson, CEO at TechStart', styles: { fontWeight: '600', fontSize: '0.95rem' } }),
      ];
      return sec;
    },
  },

  contact: {
    name: 'Contact',
    description: 'Contact section with form',
    icon: 'fas fa-envelope',
    create: () => {
      const sec = createSection('Contact');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      sec.rows = [createRow(2)];
      sec.rows[0].columns[0].span = 5;
      sec.rows[0].columns[1].span = 7;
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Get in Touch', headingLevel: 2, styles: { fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' } }),
        createElement('paragraph', { content: "We'd love to hear from you. Send us a message and we'll respond as soon as possible.", styles: { opacity: '0.7', marginBottom: '2rem', lineHeight: '1.7' } }),
        createElement('icon', { content: 'fas fa-envelope', styles: { fontSize: '1rem', color: 'var(--site-accent)', marginRight: '0.5rem', display: 'inline' } }),
        createElement('paragraph', { content: 'hello@example.com', styles: { marginBottom: '0.75rem', display: 'inline' } }),
      ];
      sec.rows[0].columns[1].elements = [
        createElement('form', { attributes: { action: '#', method: 'POST', submitText: 'Send Message' } }),
      ];
      return sec;
    },
  },

  gallery: {
    name: 'Gallery',
    description: '3-column image gallery',
    icon: 'fas fa-images',
    create: () => {
      const sec = createSection('Gallery');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Our Work', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const imgRow = createRow(3);
      const images = [
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80',
      ];
      images.forEach((src, i) => {
        imgRow.columns[i].elements = [
          createElement('image', { content: src, styles: { width: '100%', height: '250px', objectFit: 'cover', borderRadius: '12px' } }),
        ];
      });
      sec.rows = [headerRow, imgRow];
      return sec;
    },
  },

  cta: {
    name: 'Call to Action',
    description: 'Bold CTA section with accent background',
    icon: 'fas fa-bullhorn',
    create: () => {
      const sec = createSection('CTA');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'var(--site-accent)', textAlign: 'center' };
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Ready to Get Started?', headingLevel: 2, styles: { fontSize: '2.5rem', fontWeight: '700', color: '#ffffff', marginBottom: '1rem' } }),
        createElement('paragraph', { content: 'Join thousands of creators building amazing websites today.', styles: { fontSize: '1.15rem', color: 'rgba(255,255,255,0.85)', marginBottom: '2rem', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' } }),
        createElement('button', { content: 'Start Building', styles: { display: 'inline-block', backgroundColor: '#ffffff', color: 'var(--site-accent)', paddingTop: '14px', paddingRight: '32px', paddingBottom: '14px', paddingLeft: '32px', borderRadius: '10px', fontWeight: '700', fontSize: '1.05rem', cursor: 'pointer', transition: 'all 0.2s ease' } }),
      ];
      return sec;
    },
  },

  pricing: {
    name: 'Pricing',
    description: '3-tier pricing cards',
    icon: 'fas fa-tags',
    create: () => {
      const sec = createSection('Pricing');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Simple Pricing', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'Choose the plan that works for you', styles: { textAlign: 'center', opacity: '0.6', marginBottom: '3rem' } }),
      ];
      const pricingRow = createRow(3);
      const plans = [
        { name: 'Starter', price: '$9', period: '/month', features: '1 Website\n5 Pages\nBasic Support\nFree SSL', cta: 'Get Started', highlighted: false },
        { name: 'Pro', price: '$29', period: '/month', features: '10 Websites\nUnlimited Pages\nPriority Support\nCustom Domain\nAnalytics', cta: 'Start Free Trial', highlighted: true },
        { name: 'Enterprise', price: '$99', period: '/month', features: 'Unlimited Sites\nUnlimited Pages\n24/7 Support\nWhite Label\nAPI Access\nTeam Features', cta: 'Contact Sales', highlighted: false },
      ];
      plans.forEach((plan, i) => {
        const bgStyle = plan.highlighted
          ? { backgroundColor: 'var(--site-accent)', color: '#ffffff', paddingTop: '2.5rem', paddingBottom: '2.5rem', paddingLeft: '2rem', paddingRight: '2rem', borderRadius: '16px', textAlign: 'center' as const, transform: 'scale(1.05)' }
          : { backgroundColor: 'var(--site-surface)', paddingTop: '2.5rem', paddingBottom: '2.5rem', paddingLeft: '2rem', paddingRight: '2rem', borderRadius: '16px', textAlign: 'center' as const, borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)' };
        pricingRow.columns[i].styles = bgStyle;
        pricingRow.columns[i].elements = [
          createElement('heading', { content: plan.name, headingLevel: 3, styles: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: plan.highlighted ? '#ffffff' : undefined } }),
          createElement('heading', { content: plan.price, headingLevel: 2, styles: { fontSize: '3rem', fontWeight: '800', marginBottom: '0', color: plan.highlighted ? '#ffffff' : undefined } }),
          createElement('paragraph', { content: plan.period, styles: { opacity: '0.6', marginBottom: '1.5rem', color: plan.highlighted ? 'rgba(255,255,255,0.8)' : undefined } }),
          createElement('list', { content: plan.features.split('\n').map(f => `<li>${f}</li>`).join(''), styles: { textAlign: 'left', marginBottom: '2rem', listStyleType: 'none', paddingLeft: '0', fontSize: '0.95rem', lineHeight: '2', color: plan.highlighted ? 'rgba(255,255,255,0.9)' : undefined } }),
          createElement('button', {
            content: plan.cta,
            styles: {
              display: 'inline-block', width: '100%',
              backgroundColor: plan.highlighted ? '#ffffff' : 'var(--site-accent)',
              color: plan.highlighted ? 'var(--site-accent)' : '#ffffff',
              paddingTop: '12px', paddingBottom: '12px', borderRadius: '8px',
              fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
            },
          }),
        ];
      });
      sec.rows = [headerRow, pricingRow];
      return sec;
    },
  },

  stats: {
    name: 'Statistics',
    description: '4-column stats with big numbers',
    icon: 'fas fa-chart-bar',
    create: () => {
      const sec = createSection('Stats');
      sec.styles = { paddingTop: '4rem', paddingBottom: '4rem', backgroundColor: 'var(--site-surface)' };
      const row = createRow(4);
      const stats = [
        { number: '10K+', label: 'Users' },
        { number: '500+', label: 'Templates' },
        { number: '99.9%', label: 'Uptime' },
        { number: '24/7', label: 'Support' },
      ];
      stats.forEach((s, i) => {
        row.columns[i].span = 3;
        row.columns[i].styles = { textAlign: 'center' };
        row.columns[i].elements = [
          createElement('heading', { content: s.number, headingLevel: 2, styles: { fontSize: '2.5rem', fontWeight: '800', color: 'var(--site-accent)', marginBottom: '0.5rem' } }),
          createElement('paragraph', { content: s.label, styles: { fontSize: '1rem', opacity: '0.6', fontWeight: '500' } }),
        ];
      });
      sec.rows = [row];
      return sec;
    },
  },

  team: {
    name: 'Team',
    description: 'Team member cards with photos',
    icon: 'fas fa-users',
    create: () => {
      const sec = createSection('Team');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Meet Our Team', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const teamRow = createRow(3);
      const members = [
        { name: 'Alex Chen', role: 'CEO & Founder', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
        { name: 'Maria Garcia', role: 'Lead Designer', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80' },
        { name: 'James Wilson', role: 'CTO', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' },
      ];
      members.forEach((m, i) => {
        teamRow.columns[i].styles = { textAlign: 'center' };
        teamRow.columns[i].elements = [
          createElement('image', { content: m.img, styles: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' } }),
          createElement('heading', { content: m.name, headingLevel: 3, styles: { fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.25rem' } }),
          createElement('paragraph', { content: m.role, styles: { opacity: '0.6', fontSize: '0.95rem' } }),
        ];
      });
      sec.rows = [headerRow, teamRow];
      return sec;
    },
  },

  faq: {
    name: 'FAQ',
    description: 'Frequently asked questions',
    icon: 'fas fa-question-circle',
    create: () => {
      const sec = createSection('FAQ');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      sec.rows[0].columns[0].styles = { maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' };
      const faqs = [
        { q: 'How easy is it to get started?', a: 'Very easy! Just pick a template, customize it with our drag-and-drop builder, and publish. No coding required.' },
        { q: 'Can I use my own domain?', a: 'Yes! You can connect any custom domain to your website, or use our free subdomain.' },
        { q: 'Is there a free plan?', a: 'We offer a generous free tier with all core features. Upgrade for custom domains and advanced features.' },
        { q: 'Can I export my website?', a: 'Absolutely. Export your website as a clean HTML/CSS package and host it anywhere you like.' },
      ];
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Frequently Asked Questions', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
        ...faqs.flatMap(f => [
          createElement('heading', { content: f.q, headingLevel: 4, styles: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '1.5rem' } }),
          createElement('paragraph', { content: f.a, styles: { opacity: '0.7', lineHeight: '1.7', paddingBottom: '1.5rem', borderBottom: '1px solid var(--site-border)' } }),
        ]),
      ];
      return sec;
    },
  },

  portfolio: {
    name: 'Portfolio Grid',
    description: '3-column project showcase',
    icon: 'fas fa-briefcase',
    create: () => {
      const sec = createSection('Portfolio');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Our Projects', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const gridRow = createRow(3);
      const projects = [
        { title: 'E-Commerce Platform', img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80' },
        { title: 'Mobile Banking App', img: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=600&q=80' },
        { title: 'SaaS Dashboard', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' },
      ];
      projects.forEach((p, i) => {
        gridRow.columns[i].elements = [
          createElement('image', { content: p.img, styles: { width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem' } }),
          createElement('heading', { content: p.title, headingLevel: 3, styles: { fontSize: '1.15rem', fontWeight: '600' } }),
        ];
      });
      sec.rows = [headerRow, gridRow];
      return sec;
    },
  },

  blog: {
    name: 'Blog Cards',
    description: 'Blog post cards with images',
    icon: 'fas fa-newspaper',
    create: () => {
      const sec = createSection('Blog');
      sec.styles = { paddingTop: '5rem', paddingBottom: '5rem' };
      const headerRow = createRow(1);
      headerRow.columns[0].elements = [
        createElement('heading', { content: 'Latest Articles', headingLevel: 2, styles: { fontSize: '2.25rem', fontWeight: '700', textAlign: 'center', marginBottom: '3rem' } }),
      ];
      const cardRow = createRow(3);
      const posts = [
        { title: '10 Tips for Better Web Design', date: 'May 15, 2026', img: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=80' },
        { title: 'The Future of No-Code', date: 'May 10, 2026', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80' },
        { title: 'Responsive Design Best Practices', date: 'May 5, 2026', img: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&q=80' },
      ];
      posts.forEach((post, i) => {
        cardRow.columns[i].styles = { borderRadius: '12px', overflow: 'hidden', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--site-border)' };
        cardRow.columns[i].elements = [
          createElement('image', { content: post.img, styles: { width: '100%', height: '180px', objectFit: 'cover' } }),
          createElement('paragraph', { content: post.date, styles: { fontSize: '0.8rem', opacity: '0.5', paddingTop: '1rem', paddingLeft: '1.25rem', paddingRight: '1.25rem', marginBottom: '0.25rem' } }),
          createElement('heading', { content: post.title, headingLevel: 3, styles: { fontSize: '1.1rem', fontWeight: '600', paddingLeft: '1.25rem', paddingRight: '1.25rem', marginBottom: '0.75rem' } }),
          createElement('link', { content: 'Read more →', attributes: { href: '#' }, styles: { color: 'var(--site-accent)', fontSize: '0.9rem', fontWeight: '500', paddingLeft: '1.25rem', paddingBottom: '1.25rem', display: 'block' } }),
        ];
      });
      sec.rows = [headerRow, cardRow];
      return sec;
    },
  },

  newsletter: {
    name: 'Newsletter',
    description: 'Email signup section',
    icon: 'fas fa-paper-plane',
    create: () => {
      const sec = createSection('Newsletter');
      sec.styles = { paddingTop: '4rem', paddingBottom: '4rem', backgroundColor: 'var(--site-surface)', textAlign: 'center' };
      sec.rows[0].columns[0].styles = { maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' };
      sec.rows[0].columns[0].elements = [
        createElement('heading', { content: 'Stay Updated', headingLevel: 2, styles: { fontSize: '2rem', fontWeight: '700', marginBottom: '0.75rem' } }),
        createElement('paragraph', { content: 'Subscribe to our newsletter for the latest updates and tips.', styles: { opacity: '0.6', marginBottom: '1.5rem' } }),
        createElement('form', { attributes: { action: '#', method: 'POST', submitText: 'Subscribe' } }),
      ];
      return sec;
    },
  },

  logoCloud: {
    name: 'Logo Cloud',
    description: 'Partner/client logos',
    icon: 'fas fa-building',
    create: () => {
      const sec = createSection('Partners');
      sec.styles = { paddingTop: '3rem', paddingBottom: '3rem', backgroundColor: 'var(--site-surface)' };
      sec.rows[0].columns[0].elements = [
        createElement('paragraph', { content: 'Trusted by leading companies worldwide', styles: { textAlign: 'center', opacity: '0.5', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '500', marginBottom: '2rem' } }),
      ];
      const logoRow = createRow(4);
      for (let i = 0; i < 4; i++) {
        logoRow.columns[i].span = 3;
        logoRow.columns[i].styles = { display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '1rem', paddingBottom: '1rem' };
        logoRow.columns[i].elements = [
          createElement('heading', { content: `Brand ${i + 1}`, headingLevel: 4, styles: { fontSize: '1.25rem', fontWeight: '700', opacity: '0.35', textAlign: 'center' } }),
        ];
      }
      sec.rows.push(logoRow);
      return sec;
    },
  },
};

/* ========== Page Templates ========== */

export interface PageTemplateDef {
  name: string;
  description: string;
  create: () => PageData[];
}

export const PAGE_TEMPLATES: Record<string, PageTemplateDef> = {
  blank: {
    name: 'Blank Page',
    description: 'Start from scratch',
    create: () => [createPage('Untitled Page', 'page')],
  },

  landing: {
    name: 'Landing Page',
    description: 'Hero, Features, Stats, CTA, Testimonial, Pricing',
    create: () => {
      const page = createPage('Home', 'index');
      page.sections = [
        SECTION_TEMPLATES.hero.create(),
        SECTION_TEMPLATES.features.create(),
        SECTION_TEMPLATES.stats.create(),
        SECTION_TEMPLATES.testimonial.create(),
        SECTION_TEMPLATES.pricing.create(),
        SECTION_TEMPLATES.cta.create(),
      ];
      return [page];
    },
  },

  portfolio: {
    name: 'Portfolio',
    description: 'Hero, Portfolio, Team, Contact',
    create: () => {
      const page = createPage('Home', 'index');
      page.sections = [
        SECTION_TEMPLATES.hero.create(),
        SECTION_TEMPLATES.portfolio.create(),
        SECTION_TEMPLATES.team.create(),
        SECTION_TEMPLATES.contact.create(),
      ];
      return [page];
    },
  },

  business: {
    name: 'Business',
    description: 'Hero, Features, Stats, Team, CTA, Contact',
    create: () => {
      const page = createPage('Home', 'index');
      page.sections = [
        SECTION_TEMPLATES.hero.create(),
        SECTION_TEMPLATES.features.create(),
        SECTION_TEMPLATES.stats.create(),
        SECTION_TEMPLATES.team.create(),
        SECTION_TEMPLATES.testimonial.create(),
        SECTION_TEMPLATES.cta.create(),
      ];
      return [page];
    },
  },

  blog: {
    name: 'Blog',
    description: 'Hero and blog post cards',
    create: () => {
      const page = createPage('Home', 'index');
      page.sections = [
        SECTION_TEMPLATES.hero.create(),
        SECTION_TEMPLATES.blog.create(),
        SECTION_TEMPLATES.newsletter.create(),
      ];
      return [page];
    },
  },
};
