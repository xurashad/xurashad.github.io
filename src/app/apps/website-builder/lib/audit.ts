// ============================================================
// Website Builder Pro — Site Audit (SEO, A11y, Performance)
// ============================================================

import type { BuilderProject, ElementNode, SelectionTarget } from './types';

export type AuditSeverity = 'error' | 'warning' | 'info';
export type AuditCategory = 'seo' | 'accessibility' | 'structure' | 'performance';

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  detail: string;
  pageId?: string;
  pageTitle?: string;
  targetId?: string;
  targetType?: SelectionTarget;
}

export interface AuditReport {
  score: number;
  counts: { error: number; warning: number; info: number };
  issues: AuditIssue[];
}

export function auditProject(project: BuilderProject): AuditReport {
  const issues: AuditIssue[] = [];
  let seq = 0;
  const push = (issue: Omit<AuditIssue, 'id'>) => {
    issues.push({ id: `audit_${++seq}`, ...issue });
  };

  if (!project.settings.favicon) {
    push({
      severity: 'info',
      category: 'seo',
      title: 'No Favicon Set',
      detail: 'Add a favicon in the Assets tab so browser tabs and bookmarks display your brand icon.',
    });
  }

  for (const asset of Object.values(project.assets)) {
    if (asset.size > 500 * 1024) {
      push({
        severity: 'warning',
        category: 'performance',
        title: `Large Asset: ${asset.name}`,
        detail: `File size is ${(asset.size / 1024).toFixed(0)} KB. Compressing below 500 KB keeps page loads snappy.`,
      });
    }
  }

  const pages = project.pageOrder.map(id => project.pages[id]).filter(Boolean);

  for (const page of pages) {
    // SEO checks
    if (!page.seo.title?.trim()) {
      push({
        severity: 'warning',
        category: 'seo',
        title: `Missing SEO Title on "${page.title}"`,
        detail: 'Set an explicit SEO title in the Pages tab for stronger search snippets.',
        pageId: page.id,
        pageTitle: page.title,
      });
    }
    if (!page.seo.description?.trim()) {
      push({
        severity: 'warning',
        category: 'seo',
        title: `Missing Meta Description on "${page.title}"`,
        detail: 'Add a 120–160 character summary so search engines and social cards display context.',
        pageId: page.id,
        pageTitle: page.title,
      });
    } else if (page.seo.description.length > 160) {
      push({
        severity: 'info',
        category: 'seo',
        title: `Long Meta Description on "${page.title}" (${page.seo.description.length} chars)`,
        detail: 'Keep meta descriptions under 160 characters to prevent search result truncation.',
        pageId: page.id,
        pageTitle: page.title,
      });
    }
    if (!page.seo.ogImage?.trim()) {
      push({
        severity: 'info',
        category: 'seo',
        title: `Missing OG Share Image on "${page.title}"`,
        detail: 'Specify an Open Graph image URL for rich link previews on social platforms.',
        pageId: page.id,
        pageTitle: page.title,
      });
    }

    if (page.sections.length === 0) {
      push({
        severity: 'error',
        category: 'structure',
        title: `Empty Page: "${page.title}"`,
        detail: 'This page has zero sections. Add content or hide it from navigation.',
        pageId: page.id,
        pageTitle: page.title,
      });
      continue;
    }

    let h1Count = 0;

    const inspectElements = (elements: ElementNode[]) => {
      for (const el of elements) {
        if (el.hidden) continue;

        if (el.type === 'heading' && (el.headingLevel ?? 2) === 1) {
          h1Count++;
        }

        if (el.type === 'image') {
          if (!el.attributes.alt || !el.attributes.alt.trim()) {
            push({
              severity: 'error',
              category: 'accessibility',
              title: 'Image Missing Alt Text',
              detail: 'Screen readers and search engines rely on descriptive alt attributes.',
              pageId: page.id,
              pageTitle: page.title,
              targetId: el.id,
              targetType: 'element',
            });
          }
          if (el.content.startsWith('data:') && el.content.length > 650_000) {
            push({
              severity: 'warning',
              category: 'performance',
              title: 'Heavy Embedded Image',
              detail: 'Consider optimizing or hosting large inline images externally.',
              pageId: page.id,
              pageTitle: page.title,
              targetId: el.id,
              targetType: 'element',
            });
          }
        }

        if (el.type === 'button' || el.type === 'link') {
          const text = el.content.replace(/<[^>]*>/g, '').trim();
          if (!text) {
            push({
              severity: 'error',
              category: 'accessibility',
              title: `Empty ${el.type === 'button' ? 'Button' : 'Link'} Label`,
              detail: 'Interactive controls need visible text for usability and screen readers.',
              pageId: page.id,
              pageTitle: page.title,
              targetId: el.id,
              targetType: 'element',
            });
          }
          if (!el.attributes.href || el.attributes.href.trim() === '#') {
            push({
              severity: 'info',
              category: 'structure',
              title: `Placeholder "#" Link on "${text || el.type}"`,
              detail: 'Point this CTA to a page, section anchor (#features), or external URL before publishing.',
              pageId: page.id,
              pageTitle: page.title,
              targetId: el.id,
              targetType: 'element',
            });
          }
        }

        if (el.children.length > 0) inspectElements(el.children);
      }
    };

    for (const sec of page.sections) {
      if (sec.hidden) continue;
      let secHasElements = false;
      for (const row of sec.rows) {
        for (const col of row.columns) {
          if (col.elements.length === 0) {
            push({
              severity: 'info',
              category: 'structure',
              title: `Empty Column in "${sec.name}"`,
              detail: 'Drop an element into this column or remove unused columns.',
              pageId: page.id,
              pageTitle: page.title,
              targetId: col.id,
              targetType: 'column',
            });
          } else {
            secHasElements = true;
            inspectElements(col.elements);
          }
        }
      }
      if (!secHasElements) {
        push({
          severity: 'warning',
          category: 'structure',
          title: `Empty Section "${sec.name}"`,
          detail: 'This section contains no visible elements.',
          pageId: page.id,
          pageTitle: page.title,
          targetId: sec.id,
          targetType: 'section',
        });
      }
    }

    if (h1Count === 0) {
      push({
        severity: 'warning',
        category: 'accessibility',
        title: `Missing H1 Heading on "${page.title}"`,
        detail: 'Include one primary H1 heading per page for clear document hierarchy.',
        pageId: page.id,
        pageTitle: page.title,
      });
    } else if (h1Count > 1) {
      push({
        severity: 'warning',
        category: 'accessibility',
        title: `Multiple H1 Headings (${h1Count}) on "${page.title}"`,
        detail: 'Use a single H1 for the main page title and H2–H6 for subheadings.',
        pageId: page.id,
        pageTitle: page.title,
      });
    }
  }

  const counts = {
    error: issues.filter(i => i.severity === 'error').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  };

  const penalty = counts.error * 14 + counts.warning * 6 + counts.info * 2;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return { score, counts, issues };
}
