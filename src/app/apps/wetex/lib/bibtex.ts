import type { BibEntry, BibliographyStyle } from "./types";
import { decodeLatexAccents, escapeHtml, stripOuterBraces } from "./utils";

function cleanBibValue(raw: string, stringDefs: Record<string, string>): string {
  const trimmed = raw.trim();
  if (stringDefs[trimmed]) return stringDefs[trimmed];
  const unbraced = stripOuterBraces(trimmed);
  // Collapse internal whitespace/newlines
  const collapsed = unbraced.replace(/\s+/g, " ").trim();
  return decodeLatexAccents(collapsed).replace(/[{}]/g, "");
}

export function parseBibTeX(content: string, file = "references.bib"): BibEntry[] {
  const entries: BibEntry[] = [];
  const stringDefs: Record<string, string> = {
    jan: "January",
    feb: "February",
    mar: "March",
    apr: "April",
    may: "May",
    jun: "June",
    jul: "July",
    aug: "August",
    sep: "September",
    oct: "October",
    nov: "November",
    dec: "December",
  };

  let i = 0;
  const len = content.length;

  const lineAt = (idx: number): number => {
    let ln = 1;
    for (let k = 0; k < idx && k < len; k++) {
      if (content[k] === "\n") ln++;
    }
    return ln;
  };

  while (i < len) {
    const atIdx = content.indexOf("@", i);
    if (atIdx === -1) break;

    const line = lineAt(atIdx);
    let cursor = atIdx + 1;
    while (cursor < len && /[A-Za-z]/.test(content[cursor])) cursor++;
    const type = content.slice(atIdx + 1, cursor).toLowerCase();

    while (cursor < len && /\s/.test(content[cursor])) cursor++;
    const openChar = content[cursor];
    if (openChar !== "{" && openChar !== "(") {
      i = cursor + 1;
      continue;
    }
    const closeChar = openChar === "{" ? "}" : ")";

    if (type === "comment") {
      i = cursor + 1;
      continue;
    }

    // Read balanced body of entry
    let depth = 0;
    const bodyStart = cursor + 1;
    let bodyEnd = len;
    for (let j = cursor; j < len; j++) {
      const ch = content[j];
      if (ch === "\\" && j + 1 < len) {
        j++;
        continue;
      }
      if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) {
          bodyEnd = j;
          cursor = j + 1;
          break;
        }
      }
    }

    const raw = content.slice(atIdx, cursor);
    const body = content.slice(bodyStart, bodyEnd);
    i = cursor;

    if (type === "preamble") continue;

    if (type === "string") {
      const eqIdx = body.indexOf("=");
      if (eqIdx > 0) {
        const name = body.slice(0, eqIdx).trim();
        const val = cleanBibValue(body.slice(eqIdx + 1), stringDefs);
        stringDefs[name] = val;
      }
      continue;
    }

    // Parse cite key up to first top-level comma
    const firstComma = body.indexOf(",");
    if (firstComma === -1) continue;
    const key = body.slice(0, firstComma).trim();
    if (!key) continue;

    const fieldsStr = body.slice(firstComma + 1);
    const fields: Record<string, string> = {};

    let p = 0;
    while (p < fieldsStr.length) {
      while (p < fieldsStr.length && /[\s,]/.test(fieldsStr[p])) p++;
      if (p >= fieldsStr.length) break;

      const eqIdx = fieldsStr.indexOf("=", p);
      if (eqIdx === -1) break;
      const fieldName = fieldsStr.slice(p, eqIdx).trim().toLowerCase();
      p = eqIdx + 1;
      while (p < fieldsStr.length && /\s/.test(fieldsStr[p])) p++;
      if (p >= fieldsStr.length) break;

      // Read value across concat `#` or until top-level `,` or end
      let bDepth = 0;
      let inQuotes = false;
      const valStart = p;
      while (p < fieldsStr.length) {
        const c = fieldsStr[p];
        if (c === "\\" && p + 1 < fieldsStr.length) {
          p += 2;
          continue;
        }
        if (c === '"' && bDepth === 0) {
          inQuotes = !inQuotes;
        } else if (!inQuotes) {
          if (c === "{") bDepth++;
          else if (c === "}") bDepth = Math.max(0, bDepth - 1);
          else if (c === "," && bDepth === 0) break;
        }
        p++;
      }

      const rawVal = fieldsStr.slice(valStart, p).trim();
      if (fieldName) {
        // Handle # concatenation if present at top level
        if (rawVal.includes("#") && !rawVal.startsWith("{")) {
          const parts = rawVal.split("#").map((s) => cleanBibValue(s, stringDefs));
          fields[fieldName] = parts.join("");
        } else {
          fields[fieldName] = cleanBibValue(rawVal, stringDefs);
        }
      }
      p++;
    }

    entries.push({ key, type, fields, file, line, raw });
  }

  return entries;
}

function splitAuthors(authorStr: string): string[] {
  return authorStr
    .split(/\s+and\s+/i)
    .map((a) => a.trim())
    .filter(Boolean);
}

function lastNameOf(author: string): string {
  if (author.includes(",")) {
    return author.split(",")[0].trim();
  }
  const parts = author.split(/\s+/);
  return parts[parts.length - 1] ?? author;
}

export function formatAuthorList(authorStr?: string, maxShort = false): string {
  if (!authorStr) return "Unknown Author";
  const authors = splitAuthors(authorStr);
  if (authors.length === 0) return "Unknown Author";
  if (maxShort) {
    if (authors.length === 1) return lastNameOf(authors[0]);
    if (authors.length === 2) return `${lastNameOf(authors[0])} & ${lastNameOf(authors[1])}`;
    return `${lastNameOf(authors[0])} et al.`;
  }
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

export function computeAlphaTag(entry: BibEntry): string {
  const authors = splitAuthors(entry.fields.author || entry.fields.editor || "");
  const year = (entry.fields.year || "00").slice(-2);
  if (authors.length === 0) return `${entry.key.slice(0, 3)}${year}`;
  if (authors.length === 1) {
    const ln = lastNameOf(authors[0]).replace(/[^A-Za-z]/g, "");
    return `${ln.slice(0, 3)}${year}`;
  }
  const initials = authors
    .slice(0, 4)
    .map((a) => lastNameOf(a).replace(/[^A-Za-z]/g, "")[0] || "")
    .join("");
  return `${initials}${authors.length > 4 ? "+" : ""}${year}`;
}

export function sortCitationKeys(
  citedKeys: string[],
  bibMap: Record<string, BibEntry>,
  style: BibliographyStyle,
): string[] {
  const validKeys = citedKeys.filter((k) => Boolean(bibMap[k]));
  if (style === "unsrt" || style === "ieee") return validKeys;
  return [...validKeys].sort((a, b) => {
    const ea = bibMap[a];
    const eb = bibMap[b];
    const aa = lastNameOf(splitAuthors(ea.fields.author || ea.fields.editor || ea.key)[0] || "");
    const ab = lastNameOf(splitAuthors(eb.fields.author || eb.fields.editor || eb.key)[0] || "");
    const cmp = aa.localeCompare(ab);
    if (cmp !== 0) return cmp;
    return (ea.fields.year || "").localeCompare(eb.fields.year || "");
  });
}

export function getReferenceLabel(
  key: string,
  orderedKeys: string[],
  bibMap: Record<string, BibEntry>,
  style: BibliographyStyle,
): string {
  const entry = bibMap[key];
  if (!entry) return "?";
  const idx = orderedKeys.indexOf(key);
  if (style === "alpha") return computeAlphaTag(entry);
  if (style === "apalike") {
    const shortAuth = formatAuthorList(entry.fields.author || entry.fields.editor, true);
    const yr = entry.fields.year || "n.d.";
    return `${shortAuth}, ${yr}`;
  }
  return idx >= 0 ? String(idx + 1) : "?";
}

export function formatInlineCitationHtml(
  keys: string[],
  orderedKeys: string[],
  bibMap: Record<string, BibEntry>,
  style: BibliographyStyle,
  mode: "cite" | "citep" | "citet" | "citeauthor" | "citeyear" = "cite",
): string {
  const parts = keys.map((key) => {
    const entry = bibMap[key];
    if (!entry) {
      return `<span class="wt-cite-missing" title="Undefined citation key: ${escapeHtml(key)}">?</span>`;
    }
    const label = getReferenceLabel(key, orderedKeys, bibMap, style);
    let text = label;
    if (mode === "citeauthor") {
      text = formatAuthorList(entry.fields.author || entry.fields.editor, true);
    } else if (mode === "citeyear") {
      text = entry.fields.year || "n.d.";
    } else if (mode === "citet") {
      const shortAuth = formatAuthorList(entry.fields.author || entry.fields.editor, true);
      text =
        style === "apalike"
          ? `${shortAuth} (${entry.fields.year || "n.d."})`
          : `${shortAuth} [${label}]`;
    }
    return `<a href="#bib-${escapeHtml(key)}" class="wt-cite-link" data-bib-key="${escapeHtml(key)}">${escapeHtml(text)}</a>`;
  });

  if (mode === "citet" || mode === "citeauthor" || mode === "citeyear") {
    return parts.join(", ");
  }
  if (style === "apalike") {
    return `(${parts.join("; ")})`;
  }
  return `[${parts.join(", ")}]`;
}

export function renderBibliographyHtml(
  orderedKeys: string[],
  bibMap: Record<string, BibEntry>,
  style: BibliographyStyle,
  headingTitle = "References",
): string {
  if (orderedKeys.length === 0) return "";

  const itemsHtml = orderedKeys
    .map((key) => {
      const entry = bibMap[key];
      if (!entry) return "";
      const f = entry.fields;
      const tag = getReferenceLabel(key, orderedKeys, bibMap, style);
      const authors = escapeHtml(formatAuthorList(f.author || f.editor));
      const title = f.title ? escapeHtml(f.title) : "Untitled";
      const year = f.year ? escapeHtml(f.year) : "";
      const venueParts: string[] = [];

      if (f.journal) venueParts.push(`<em>${escapeHtml(f.journal)}</em>`);
      else if (f.booktitle) venueParts.push(`In <em>${escapeHtml(f.booktitle)}</em>`);
      else if (f.publisher) venueParts.push(escapeHtml(f.publisher));
      else if (f.school) venueParts.push(escapeHtml(f.school));
      else if (f.howpublished) venueParts.push(escapeHtml(f.howpublished));

      if (f.volume) venueParts.push(`vol. ${escapeHtml(f.volume)}`);
      if (f.number) venueParts.push(`no. ${escapeHtml(f.number)}`);
      if (f.pages) venueParts.push(`pp. ${escapeHtml(f.pages)}`);
      if (year) venueParts.push(`(${year})`);

      const links: string[] = [];
      if (f.doi) {
        const cleanDoi = f.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
        links.push(
          `<a href="https://doi.org/${escapeHtml(cleanDoi)}" target="_blank" rel="noopener noreferrer" class="wt-link">doi:${escapeHtml(cleanDoi)}</a>`,
        );
      }
      if (f.eprint || f.arxiv) {
        const ax = f.eprint || f.arxiv;
        links.push(
          `<a href="https://arxiv.org/abs/${escapeHtml(ax)}" target="_blank" rel="noopener noreferrer" class="wt-link">arXiv:${escapeHtml(ax)}</a>`,
        );
      }
      if (f.url && !f.doi) {
        links.push(
          `<a href="${escapeHtml(f.url)}" target="_blank" rel="noopener noreferrer" class="wt-link">${escapeHtml(f.url)}</a>`,
        );
      }

      const formattedTitle =
        entry.type === "book" ? `<em>${title}</em>` : `&ldquo;${title}&rdquo;`;

      const prefix =
        style === "apalike" ? "" : `<span class="wt-bib-tag">[${escapeHtml(tag)}]</span> `;

      return `<li id="bib-${escapeHtml(key)}" class="wt-bib-item" data-source-file="${escapeHtml(entry.file)}" data-source-line="${entry.line}">
        ${prefix}<span class="wt-bib-body">${authors}, ${formattedTitle}${venueParts.length ? `, ${venueParts.join(", ")}` : ""}.${links.length ? ` ${links.join(" · ")}` : ""}</span>
      </li>`;
    })
    .join("\n");

  return `<section class="wt-bibliography">
    <h2 class="wt-section-h2">${escapeHtml(headingTitle)}</h2>
    <ol class="wt-bib-list">${itemsHtml}</ol>
  </section>`;
}
