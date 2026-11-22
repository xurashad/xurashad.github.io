import type {
  DocumentAnalytics,
  MarkdownDiagnostic,
  MarkdownFile,
  RenderResult,
} from "./types";

const STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "for", "from", "are", "was", "were",
  "have", "has", "had", "not", "but", "you", "your", "can", "will", "into",
  "they", "their", "them", "been", "being", "about", "which", "when", "where",
  "what", "there", "these", "those", "also", "more", "some", "such", "than",
  "then", "only", "very", "just", "over", "each", "other", "both", "any",
  "all", "one", "two", "use", "used", "using", "its", "out", "she", "him",
  "her", "his", "our", "how", "why", "who", "may", "might", "could", "should",
  "would", "does", "did", "doing", "make", "made",
]);

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length <= 3) return 1;
  const trimmed = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const matches = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches ? matches.length : 1);
}

function stripSyntaxForProse(source: string): string {
  let body = source.replace(/\r\n/g, "\n");
  // Strip frontmatter
  body = body.replace(/^(?:---|\+\+\+)\n[\s\S]*?\n(?:---|\+\+\+)\n?/, "");
  // Strip fenced code blocks
  body = body.replace(/^(`{3,}|~{3,})[\s\S]*?^\1\s*$/gm, "");
  // Strip display math
  body = body.replace(/\$\$[\s\S]*?\$\$/g, " equation ");
  // Strip inline code and images/links URLs
  body = body.replace(/`[^`\n]+`/g, " code ");
  body = body.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  body = body.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Strip markdown punctuation
  body = body.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  body = body.replace(/^\s{0,3}>\s?/gm, "");
  body = body.replace(/<[^>]+>/g, " ");
  return body;
}

function fleschGradeLabel(score: number): string {
  if (score >= 90) return "Very Easy (5th Grade)";
  if (score >= 80) return "Easy (6th Grade)";
  if (score >= 70) return "Fairly Easy (7th Grade)";
  if (score >= 60) return "Standard (8th–9th Grade)";
  if (score >= 50) return "Fairly Difficult (10th–12th)";
  if (score >= 30) return "Difficult (College)";
  return "Academic / Graduate";
}

export function analyzeAndLintMarkdown(
  source: string,
  rendered: RenderResult,
  files: MarkdownFile[],
): { diagnostics: MarkdownDiagnostic[]; analytics: DocumentAnalytics } {
  const diagnostics: MarkdownDiagnostic[] = [];
  let diagCounter = 0;
  const pushDiag = (
    severity: MarkdownDiagnostic["severity"],
    line: number,
    rule: string,
    message: string,
  ) => {
    diagCounter++;
    diagnostics.push({
      id: `md-diag-${diagCounter}-${line}`,
      severity,
      line,
      rule,
      message,
    });
  };

  // 1. Unclosed fences or display math
  if (rendered.unclosedFenceLine !== null) {
    pushDiag(
      "error",
      rendered.unclosedFenceLine,
      "unclosed-fence",
      "Fenced code block is missing its closing ``` or ~~~ delimiter.",
    );
  }
  if (rendered.unclosedMathLine !== null) {
    pushDiag(
      "error",
      rendered.unclosedMathLine,
      "unclosed-math",
      "Display math block is missing its closing $$ or \\] delimiter.",
    );
  }

  // 2. Headings hierarchy & duplicates
  let prevLevel = 0;
  const seenHeadingTexts = new Map<string, number>();
  for (const h of rendered.outline) {
    if (prevLevel > 0 && h.level > prevLevel + 1) {
      pushDiag(
        "warning",
        h.line,
        "heading-increment",
        `Heading level skipped from H${prevLevel} to H${h.level} ("${h.text}").`,
      );
    }
    prevLevel = h.level;

    const norm = h.text.toLowerCase();
    if (seenHeadingTexts.has(norm)) {
      pushDiag(
        "info",
        h.line,
        "duplicate-heading",
        `Duplicate heading "${h.text}" (first seen on line ${seenHeadingTexts.get(norm)}).`,
      );
    } else {
      seenHeadingTexts.set(norm, h.line);
    }
  }

  // 3. Links (empty URLs, broken #anchors, broken [[wiki-links]])
  const headingSlugs = new Set(rendered.outline.map((h) => h.slug));
  for (const link of rendered.links) {
    if (link.isWiki) {
      const norm = link.url.trim().toLowerCase().replace(/\.md$/, "");
      const found = files.some((f) => {
        const p = f.path.toLowerCase();
        const noExt = p.replace(/\.(md|markdown|mdx)$/, "");
        const base = noExt.split("/").pop() ?? noExt;
        return p === norm || noExt === norm || base === norm;
      });
      if (!found) {
        pushDiag(
          "warning",
          link.line,
          "broken-wiki-link",
          `Wiki link [[${link.url}]] does not match any file in the current workspace.`,
        );
      }
      continue;
    }

    if (!link.url.trim()) {
      pushDiag(
        "error",
        link.line,
        "empty-link",
        `Link "${link.text}" has an empty URL target.`,
      );
      continue;
    }

    if (link.isAnchor) {
      const targetSlug = link.url.slice(1).trim();
      if (
        targetSlug &&
        !targetSlug.startsWith("fn-") &&
        !targetSlug.startsWith("fnref-") &&
        !headingSlugs.has(targetSlug)
      ) {
        pushDiag(
          "warning",
          link.line,
          "broken-anchor",
          `Anchor link "#${targetSlug}" does not match any heading slug in this document.`,
        );
      }
    }
  }

  // 4. Images (missing alt text & missing local assets)
  for (const img of rendered.images) {
    if (!img.alt.trim()) {
      pushDiag(
        "info",
        img.line,
        "missing-alt-text",
        `Image "${img.src}" is missing descriptive alt text for accessibility.`,
      );
    }
    const cleanSrc = img.src.trim();
    if (
      cleanSrc &&
      !/^(https?:|data:|blob:|\/)/i.test(cleanSrc)
    ) {
      const rel = cleanSrc.replace(/^\.\//, "");
      const exists = files.some(
        (f) =>
          f.kind === "image" &&
          (f.path === rel ||
            f.path.toLowerCase() === rel.toLowerCase() ||
            f.path.endsWith(`/${rel}`)),
      );
      if (!exists) {
        pushDiag(
          "warning",
          img.line,
          "broken-local-image",
          `Local image "${cleanSrc}" was not found in workspace files.`,
        );
      }
    }
  }

  // 5. Table column mismatches
  for (const tm of rendered.tableMismatches) {
    pushDiag(
      "warning",
      tm.line,
      "table-column-mismatch",
      `Table row has ${tm.rowCols} cell(s), expected ${tm.headerCols} to match header.`,
    );
  }

  // 6. Footnotes
  for (const ufn of rendered.undefinedFootnotes) {
    pushDiag(
      "error",
      ufn.line,
      "undefined-footnote",
      `Footnote reference [^${ufn.id}] has no matching [^${ufn.id}]: definition.`,
    );
  }
  for (const fn of rendered.footnotes) {
    if (!fn.referenced) {
      pushDiag(
        "info",
        fn.line,
        "unused-footnote",
        `Footnote definition [^${fn.id}] is never referenced in the text.`,
      );
    }
  }

  // Analytics calculation
  const normalized = source.replace(/\r\n/g, "\n");
  const lines = normalized ? normalized.split("\n").length : 0;
  const chars = normalized.length;
  const charsNoSpaces = normalized.replace(/\s+/g, "").length;

  const prose = stripSyntaxForProse(normalized);
  const wordMatches = prose.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
  const words = wordMatches.length;

  const sentencesRaw = prose
    .split(/[.!?]+(?:\s|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentences = Math.max(words > 0 ? 1 : 0, sentencesRaw.length);

  const paragraphs = prose
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0).length;

  let syllables = 0;
  const freq = new Map<string, number>();
  const uniqueWords = new Set<string>();

  for (const w of wordMatches) {
    syllables += countSyllables(w);
    const lw = w.toLowerCase();
    uniqueWords.add(lw);
    if (lw.length >= 3 && !STOPWORDS.has(lw) && !/^\d+$/.test(lw)) {
      freq.set(lw, (freq.get(lw) ?? 0) + 1);
    }
  }

  const fleschRaw =
    words > 0 && sentences > 0
      ? 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
      : 100;
  const fleschScore = Math.max(0, Math.min(100, Math.round(fleschRaw)));
  const lexicalDiversity =
    words > 0 ? Math.round((uniqueWords.size / words) * 100) : 0;

  const topKeywords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  return {
    diagnostics: diagnostics.sort((a, b) => a.line - b.line),
    analytics: {
      words,
      chars,
      charsNoSpaces,
      lines,
      paragraphs,
      sentences,
      readingTimeMin: words === 0 ? 0 : Math.max(1, Math.ceil(words / 225)),
      speakingTimeMin: words === 0 ? 0 : Math.max(1, Math.ceil(words / 135)),
      fleschScore,
      fleschGrade: words === 0 ? "No text yet" : fleschGradeLabel(fleschScore),
      lexicalDiversity,
      topKeywords,
      headingsCount: rendered.outline.length,
      codeBlocksCount: rendered.codeBlocksCount,
      mathCount: rendered.mathCount,
      tablesCount: rendered.tablesCount,
      imagesCount: rendered.images.length,
      linksCount: rendered.links.length,
      tasksTotal: rendered.tasksTotal,
      tasksDone: rendered.tasksDone,
      footnotesCount: rendered.footnotes.length,
    },
  };
}
