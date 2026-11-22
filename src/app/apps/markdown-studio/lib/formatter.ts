function splitPipeCells(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|") && !trimmed.endsWith("\\|")) {
    trimmed = trimmed.slice(0, -1);
  }
  const cells: string[] = [];
  let cur = "";
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "\\" && trimmed[i + 1] === "|") {
      cur += "\\|";
      i++;
    } else if (trimmed[i] === "|") {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += trimmed[i];
    }
  }
  cells.push(cur.trim());
  return cells;
}

function isDelimiterRow(line: string): boolean {
  if (!line.includes("|") && !/^[\s:|-]+$/.test(line)) return false;
  const cells = splitPipeCells(line);
  return cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c));
}

function formatTableBlock(rows: string[]): string[] {
  const parsed = rows.map(splitPipeCells);
  const colCount = Math.max(...parsed.map((r) => r.length));
  const widths = new Array<number>(colCount).fill(3);

  for (let r = 0; r < parsed.length; r++) {
    if (r === 1) continue; // skip delimiter width contribution
    for (let c = 0; c < colCount; c++) {
      const len = (parsed[r][c] ?? "").length;
      if (len > widths[c]) widths[c] = len;
    }
  }

  return parsed.map((row, rIdx) => {
    const padded: string[] = [];
    for (let c = 0; c < colCount; c++) {
      const cell = row[c] ?? "";
      const w = widths[c];
      if (rIdx === 1) {
        const leftColon = cell.startsWith(":");
        const rightColon = cell.endsWith(":");
        const dashCount = Math.max(1, w - (leftColon ? 1 : 0) - (rightColon ? 1 : 0));
        padded.push(`${leftColon ? ":" : ""}${"-".repeat(dashCount)}${rightColon ? ":" : ""}`);
      } else {
        padded.push(cell.padEnd(w, " "));
      }
    }
    return `| ${padded.join(" | ")} |`;
  });
}

export function formatMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];

  let i = 0;
  // Preserve leading frontmatter verbatim
  if (lines.length >= 3 && (lines[0].trim() === "---" || lines[0].trim() === "+++")) {
    const delim = lines[0].trim();
    let endIdx = -1;
    for (let k = 1; k < lines.length; k++) {
      if (lines[k].trim() === delim) {
        endIdx = k;
        break;
      }
    }
    if (endIdx !== -1) {
      for (let k = 0; k <= endIdx; k++) out.push(lines[k]);
      i = endIdx + 1;
    }
  }

  let inFence = false;
  let fenceChar = "`";
  let fenceLen = 3;

  while (i < lines.length) {
    const line = lines[i];
    const fenceM = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceM) {
      const fChar = fenceM[2][0];
      const fLen = fenceM[2].length;
      if (!inFence) {
        inFence = true;
        fenceChar = fChar;
        fenceLen = fLen;
        out.push(line);
        i++;
        continue;
      } else if (fChar === fenceChar && fLen >= fenceLen && fenceM[3].trim() === "") {
        inFence = false;
        out.push(line);
        i++;
        continue;
      }
    }

    if (inFence) {
      out.push(line);
      i++;
      continue;
    }

    // Format GFM tables
    if (i + 1 < lines.length && line.includes("|") && isDelimiterRow(lines[i + 1])) {
      const tableLines: string[] = [line, lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && lines[j].trim() !== "" && lines[j].includes("|")) {
        tableLines.push(lines[j]);
        j++;
      }
      out.push(...formatTableBlock(tableLines));
      i = j;
      continue;
    }

    // Ensure space after ATX heading #
    const headingM = line.match(/^(\s{0,3})(#{1,6})([^\s#].*)$/);
    if (headingM) {
      out.push(`${headingM[1]}${headingM[2]} ${headingM[3].trim()}`);
      i++;
      continue;
    }

    // Normalize horizontal rule (don't touch setext underline)
    if (/^\s{0,3}(?:---+|___+|\*\*\*+)\s*$/.test(line) && (i === 0 || !lines[i - 1].trim() || line.trim().startsWith("*") || line.trim().startsWith("_"))) {
      out.push("---");
      i++;
      continue;
    }

    // Normalize unordered bullet * or + to - (while preserving indentation)
    const bulletM = line.match(/^(\s*)[*+](\s+.*)$/);
    if (bulletM) {
      out.push(`${bulletM[1]}-${bulletM[2]}`);
      i++;
      continue;
    }

    // Trim trailing spaces unless deliberate 2-space hard line break
    const hasHardBreak = / {2}$/.test(line) && line.trim().length > 0;
    const cleaned = hasHardBreak ? `${line.replace(/\s+$/, "")}  ` : line.replace(/\s+$/, "");
    out.push(cleaned);
    i++;
  }

  // Collapse consecutive blank lines (>2 -> 1 blank line)
  const collapsed: string[] = [];
  let blankRun = 0;
  for (const l of out) {
    if (l.trim() === "") {
      blankRun++;
      if (blankRun <= 1) collapsed.push("");
    } else {
      blankRun = 0;
      collapsed.push(l);
    }
  }

  return `${collapsed.join("\n").replace(/\n+$/, "")}\n`;
}

function convertNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const childrenMd = () => Array.from(el.childNodes).map(convertNodeToMarkdown).join("");

  switch (tag) {
    case "script":
    case "style":
    case "noscript":
      return "";
    case "h1":
      return `\n# ${childrenMd().trim()}\n\n`;
    case "h2":
      return `\n## ${childrenMd().trim()}\n\n`;
    case "h3":
      return `\n### ${childrenMd().trim()}\n\n`;
    case "h4":
      return `\n#### ${childrenMd().trim()}\n\n`;
    case "h5":
      return `\n##### ${childrenMd().trim()}\n\n`;
    case "h6":
      return `\n###### ${childrenMd().trim()}\n\n`;
    case "p":
      return `${childrenMd().trim()}\n\n`;
    case "br":
      return "  \n";
    case "hr":
      return "\n---\n\n";
    case "strong":
    case "b": {
      const inner = childrenMd().trim();
      return inner ? `**${inner}**` : "";
    }
    case "em":
    case "i": {
      const inner = childrenMd().trim();
      return inner ? `*${inner}*` : "";
    }
    case "del":
    case "s": {
      const inner = childrenMd().trim();
      return inner ? `~~${inner}~~` : "";
    }
    case "mark": {
      const inner = childrenMd().trim();
      return inner ? `==${inner}==` : "";
    }
    case "sup":
      return `^${childrenMd().trim()}^`;
    case "sub":
      return `~${childrenMd().trim()}~`;
    case "kbd":
      return `<kbd>${childrenMd().trim()}</kbd>`;
    case "code": {
      if (el.parentElement?.tagName.toLowerCase() === "pre") {
        return el.textContent ?? "";
      }
      return `\`${(el.textContent ?? "").trim()}\``;
    }
    case "pre": {
      const codeEl = el.querySelector("code");
      const cls = codeEl?.className ?? el.className ?? "";
      const langM = cls.match(/language-([a-zA-Z0-9_-]+)/);
      const lang = langM?.[1] ?? "";
      const text = (codeEl?.textContent ?? el.textContent ?? "").replace(/\n+$/, "");
      return `\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
    }
    case "blockquote": {
      const body = childrenMd().trim().split("\n").map((l) => `> ${l}`).join("\n");
      return `\n${body}\n\n`;
    }
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const text = childrenMd().trim() || href;
      return href ? `[${text}](${href})` : text;
    }
    case "img": {
      const src = el.getAttribute("src") ?? "";
      const alt = el.getAttribute("alt") ?? "";
      const title = el.getAttribute("title");
      return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
    }
    case "ul":
    case "ol": {
      const ordered = tag === "ol";
      let idx = 1;
      const lines: string[] = [];
      for (const child of Array.from(el.children)) {
        if (child.tagName.toLowerCase() !== "li") continue;
        const checkbox = child.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        const rawText = convertNodeToMarkdown(child).trim().replace(/\n+/g, "\n  ");
        if (checkbox) {
          const mark = checkbox.checked ? "x" : " ";
          lines.push(`- [${mark}] ${rawText}`);
        } else if (ordered) {
          lines.push(`${idx}. ${rawText}`);
          idx++;
        } else {
          lines.push(`- ${rawText}`);
        }
      }
      return `\n${lines.join("\n")}\n\n`;
    }
    case "li": {
      const parts = Array.from(el.childNodes)
        .filter((n) => !(n.nodeType === Node.ELEMENT_NODE && (n as HTMLElement).tagName.toLowerCase() === "input"))
        .map(convertNodeToMarkdown)
        .join("");
      return parts.trim();
    }
    case "table": {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (rows.length === 0) return "";
      const matrix = rows.map((tr) =>
        Array.from(tr.querySelectorAll("th, td")).map((cell) =>
          convertNodeToMarkdown(cell).trim().replace(/\|/g, "\\|").replace(/\n/g, " "),
        ),
      );
      const colCount = Math.max(...matrix.map((r) => r.length));
      if (colCount === 0) return "";
      const padRow = (r: string[]) =>
        `| ${Array.from({ length: colCount }, (_u, c) => r[c] ?? "").join(" | ")} |`;
      const header = padRow(matrix[0]);
      const delim = `| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`;
      const body = matrix.slice(1).map(padRow);
      return `\n${[header, delim, ...body].join("\n")}\n\n`;
    }
    case "details": {
      const summaryEl = el.querySelector("summary");
      const summary = summaryEl ? summaryEl.textContent?.trim() ?? "Details" : "Details";
      const bodyParts = Array.from(el.childNodes)
        .filter((c) => c !== summaryEl)
        .map(convertNodeToMarkdown)
        .join("")
        .trim();
      return `\n<details>\n<summary>${summary}</summary>\n\n${bodyParts}\n\n</details>\n\n`;
    }
    default:
      return childrenMd();
  }
}

export function htmlToMarkdown(html: string): string {
  if (typeof DOMParser === "undefined") {
    return html.replace(/<[^>]+>/g, "").trim();
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const md = convertNodeToMarkdown(doc.body)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return md ? `${md}\n` : "";
}
