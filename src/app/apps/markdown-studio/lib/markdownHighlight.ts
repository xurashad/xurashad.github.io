import type { MarkdownFileKind } from "./types";
import { escapeHtml } from "./utils";

function highlightMarkdownInline(line: string): string {
  // Tokenize line preserving exact characters so <pre> and <textarea> stay 1:1 aligned
  let out = "";
  let i = 0;
  const n = line.length;

  while (i < n) {
    const ch = line[i];

    // Escaped character
    if (ch === "\\" && i + 1 < n) {
      out += `<span class="md-hl-comment">${escapeHtml(line.slice(i, i + 2))}</span>`;
      i += 2;
      continue;
    }

    // Inline code `...`
    if (ch === "`") {
      let ticks = 1;
      while (i + ticks < n && line[i + ticks] === "`") ticks++;
      const closeIdx = line.indexOf("`".repeat(ticks), i + ticks);
      if (closeIdx !== -1) {
        const end = closeIdx + ticks;
        out += `<span class="md-hl-code">${escapeHtml(line.slice(i, end))}</span>`;
        i = end;
        continue;
      }
    }

    // Display $$...$$ or inline $...$
    if (ch === "$") {
      if (line[i + 1] === "$") {
        const close = line.indexOf("$$", i + 2);
        if (close !== -1) {
          out += `<span class="md-hl-math">${escapeHtml(line.slice(i, close + 2))}</span>`;
          i = close + 2;
          continue;
        }
      } else if (i + 1 < n && line[i + 1] !== " ") {
        let j = i + 1;
        while (j < n && line[j] !== "$") {
          if (line[j] === "\\") j += 2;
          else j++;
        }
        if (j < n && line[j] === "$" && line[j - 1] !== " ") {
          out += `<span class="md-hl-math">${escapeHtml(line.slice(i, j + 1))}</span>`;
          i = j + 1;
          continue;
        }
      }
    }

    // Wiki link [[...]]
    if (ch === "[" && line[i + 1] === "[") {
      const close = line.indexOf("]]", i + 2);
      if (close !== -1) {
        out += `<span class="md-hl-link">${escapeHtml(line.slice(i, close + 2))}</span>`;
        i = close + 2;
        continue;
      }
    }

    // Footnote [^id]
    if (ch === "[" && line[i + 1] === "^") {
      const close = line.indexOf("]", i + 2);
      if (close !== -1) {
        out += `<span class="md-hl-meta">${escapeHtml(line.slice(i, close + 1))}</span>`;
        i = close + 1;
        continue;
      }
    }

    // Image ![alt](url) or Link [text](url)
    if ((ch === "!" && line[i + 1] === "[") || ch === "[") {
      const bracketStart = ch === "!" ? i + 1 : i;
      const closeBracket = line.indexOf("]", bracketStart + 1);
      if (closeBracket !== -1 && line[closeBracket + 1] === "(") {
        const closeParen = line.indexOf(")", closeBracket + 2);
        if (closeParen !== -1) {
          const textPart = line.slice(i, closeBracket + 1);
          const urlPart = line.slice(closeBracket + 1, closeParen + 1);
          out += `<span class="md-hl-link">${escapeHtml(textPart)}</span><span class="md-hl-meta">${escapeHtml(urlPart)}</span>`;
          i = closeParen + 1;
          continue;
        }
      }
    }

    // Bold **...** or __...__
    if ((ch === "*" && line[i + 1] === "*") || (ch === "_" && line[i + 1] === "_")) {
      const marker = line.slice(i, i + 2);
      const close = line.indexOf(marker, i + 2);
      if (close !== -1 && close > i + 2) {
        out += `<span class="md-hl-bold">${escapeHtml(line.slice(i, close + 2))}</span>`;
        i = close + 2;
        continue;
      }
    }

    // Strikethrough ~~...~~ or Highlight ==...==
    if ((ch === "~" && line[i + 1] === "~") || (ch === "=" && line[i + 1] === "=")) {
      const marker = line.slice(i, i + 2);
      const close = line.indexOf(marker, i + 2);
      if (close !== -1 && close > i + 2) {
        const cls = ch === "=" ? "md-hl-callout" : "md-hl-comment";
        out += `<span class="${cls}">${escapeHtml(line.slice(i, close + 2))}</span>`;
        i = close + 2;
        continue;
      }
    }

    // Italic *...* or _..._
    if ((ch === "*" || ch === "_") && line[i + 1] && line[i + 1] !== " ") {
      const close = line.indexOf(ch, i + 1);
      if (close !== -1 && close > i + 1 && line[close - 1] !== " ") {
        out += `<span class="md-hl-italic">${escapeHtml(line.slice(i, close + 1))}</span>`;
        i = close + 1;
        continue;
      }
    }

    // Emoji shortcode :word:
    if (ch === ":") {
      const m = line.slice(i).match(/^:[a-z0-9_+-]+:/i);
      if (m) {
        out += `<span class="md-hl-meta">${escapeHtml(m[0])}</span>`;
        i += m[0].length;
        continue;
      }
    }

    // HTML comments & tags
    if (ch === "<") {
      if (line.startsWith("<!--", i)) {
        const end = line.indexOf("-->", i + 4);
        const slice = end === -1 ? line.slice(i) : line.slice(i, end + 3);
        out += `<span class="md-hl-comment">${escapeHtml(slice)}</span>`;
        i += slice.length;
        continue;
      }
      const tagEnd = line.indexOf(">", i + 1);
      if (tagEnd !== -1 && /^<\/?[a-zA-Z]/.test(line.slice(i))) {
        out += `<span class="md-hl-tag">${escapeHtml(line.slice(i, tagEnd + 1))}</span>`;
        i = tagEnd + 1;
        continue;
      }
    }

    out += escapeHtml(ch);
    i++;
  }

  return out;
}

function highlightMarkdown(content: string): string {
  const lines = content.split("\n");
  const rendered: string[] = [];

  let inFrontmatter = false;
  let fmDelim = "---";
  let inFence = false;
  let fenceChar = "`";
  let fenceLen = 3;
  let inMathBlock = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Frontmatter start on line 0
    if (idx === 0 && (line.trim() === "---" || line.trim() === "+++")) {
      inFrontmatter = true;
      fmDelim = line.trim();
      rendered.push(`<span class="md-hl-meta">${escapeHtml(line)}</span>`);
      continue;
    }

    if (inFrontmatter) {
      if (line.trim() === fmDelim) {
        inFrontmatter = false;
        rendered.push(`<span class="md-hl-meta">${escapeHtml(line)}</span>`);
      } else {
        const colon = line.indexOf(":");
        if (colon !== -1 && !line.trimStart().startsWith("-")) {
          rendered.push(
            `<span class="md-hl-meta">${escapeHtml(line.slice(0, colon + 1))}</span>${escapeHtml(line.slice(colon + 1))}`,
          );
        } else {
          rendered.push(`<span class="md-hl-italic">${escapeHtml(line)}</span>`);
        }
      }
      continue;
    }

    // Fenced code blocks
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (!inMathBlock && fenceMatch) {
      const fChar = fenceMatch[2][0];
      const fLen = fenceMatch[2].length;
      if (!inFence) {
        inFence = true;
        fenceChar = fChar;
        fenceLen = fLen;
        rendered.push(`<span class="md-hl-code">${escapeHtml(line)}</span>`);
        continue;
      } else if (fChar === fenceChar && fLen >= fenceLen && fenceMatch[3].trim() === "") {
        inFence = false;
        rendered.push(`<span class="md-hl-code">${escapeHtml(line)}</span>`);
        continue;
      }
    }

    if (inFence) {
      rendered.push(`<span class="md-hl-code">${escapeHtml(line)}</span>`);
      continue;
    }

    // Display math block $$
    if (line.trim() === "$$") {
      inMathBlock = !inMathBlock;
      rendered.push(`<span class="md-hl-math">${escapeHtml(line)}</span>`);
      continue;
    }
    if (inMathBlock) {
      rendered.push(`<span class="md-hl-math">${escapeHtml(line)}</span>`);
      continue;
    }

    // ATX Heading
    const headingMatch = line.match(/^(\s*#{1,6}\s+)(.*)$/);
    if (headingMatch) {
      rendered.push(
        `<span class="md-hl-heading">${escapeHtml(headingMatch[1])}${highlightMarkdownInline(headingMatch[2])}</span>`,
      );
      continue;
    }

    // Horizontal rule
    if (/^\s*(?:---+|\*\*\*+|___+)\s*$/.test(line)) {
      rendered.push(`<span class="md-hl-meta">${escapeHtml(line)}</span>`);
      continue;
    }

    // Callout / Blockquote
    const calloutMatch = line.match(/^(\s*>+\s*)(\[![A-Za-z]+\][+-]?)(.*)$/);
    if (calloutMatch) {
      rendered.push(
        `<span class="md-hl-quote">${escapeHtml(calloutMatch[1])}</span><span class="md-hl-callout">${escapeHtml(calloutMatch[2])}</span><span class="md-hl-bold">${escapeHtml(calloutMatch[3])}</span>`,
      );
      continue;
    }
    const quoteMatch = line.match(/^(\s*>+\s?)(.*)$/);
    if (quoteMatch) {
      rendered.push(
        `<span class="md-hl-quote">${escapeHtml(quoteMatch[1])}${highlightMarkdownInline(quoteMatch[2])}</span>`,
      );
      continue;
    }

    // Task list & Lists
    const taskMatch = line.match(/^(\s*[-*+]\s+)(\[[ xX]\])(\s+.*)$/);
    if (taskMatch) {
      rendered.push(
        `<span class="md-hl-list">${escapeHtml(taskMatch[1])}</span><span class="md-hl-callout">${escapeHtml(taskMatch[2])}</span>${highlightMarkdownInline(taskMatch[3])}`,
      );
      continue;
    }
    const listMatch = line.match(/^(\s*(?:[-*+]|\d+[.)])\s+)(.*)$/);
    if (listMatch) {
      rendered.push(
        `<span class="md-hl-list">${escapeHtml(listMatch[1])}</span>${highlightMarkdownInline(listMatch[2])}`,
      );
      continue;
    }

    // Table row with pipes
    if (line.trimStart().startsWith("|") && line.includes("|", line.indexOf("|") + 1)) {
      const highlightedPipes = line
        .split("|")
        .map((cell) => highlightMarkdownInline(cell))
        .join(`<span class="md-hl-table">|</span>`);
      rendered.push(highlightedPipes);
      continue;
    }

    // Footnote definition [^id]:
    const fnMatch = line.match(/^(\[\^[^\]]+\]:)(.*)$/);
    if (fnMatch) {
      rendered.push(
        `<span class="md-hl-meta">${escapeHtml(fnMatch[1])}</span>${highlightMarkdownInline(fnMatch[2])}`,
      );
      continue;
    }

    rendered.push(highlightMarkdownInline(line));
  }

  return rendered.join("\n");
}

function highlightConfigSource(content: string, kind: MarkdownFileKind): string {
  return content
    .split("\n")
    .map((line) => {
      if (kind === "yaml" && line.trimStart().startsWith("#")) {
        return `<span class="md-hl-comment">${escapeHtml(line)}</span>`;
      }
      if (kind === "json") {
        return escapeHtml(line).replace(
          /(&quot;[^&]*?&quot;)(\s*:)?/g,
          (_m, str: string, colon: string | undefined) =>
            colon
              ? `<span class="md-hl-meta">${str}</span>${colon}`
              : `<span class="md-hl-code">${str}</span>`,
        );
      }
      if (kind === "yaml") {
        const colon = line.indexOf(":");
        if (colon !== -1 && !line.trimStart().startsWith("-")) {
          return `<span class="md-hl-meta">${escapeHtml(line.slice(0, colon + 1))}</span>${escapeHtml(line.slice(colon + 1))}`;
        }
      }
      return escapeHtml(line);
    })
    .join("\n");
}

export function highlightSource(content: string, kind: MarkdownFileKind): string {
  if (kind === "md") return highlightMarkdown(content);
  if (kind === "json" || kind === "yaml" || kind === "css") {
    return highlightConfigSource(content, kind);
  }
  return escapeHtml(content);
}
