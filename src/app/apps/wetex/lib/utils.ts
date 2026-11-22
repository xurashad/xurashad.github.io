export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ACCENT_MAP: Record<string, Record<string, string>> = {
  '"': { a: "ä", e: "ë", i: "ï", o: "ö", u: "ü", y: "ÿ", A: "Ä", E: "Ë", I: "Ï", O: "Ö", U: "Ü", Y: "Ÿ" },
  "'": { a: "á", e: "é", i: "í", o: "ó", u: "ú", y: "ý", c: "ć", n: "ń", s: "ś", z: "ź", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú", Y: "Ý" },
  "`": { a: "à", e: "è", i: "ì", o: "ò", u: "ù", A: "À", E: "È", I: "Ì", O: "Ò", U: "Ù" },
  "^": { a: "â", e: "ê", i: "î", o: "ô", u: "û", A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û" },
  "~": { a: "ã", n: "ñ", o: "õ", A: "Ã", N: "Ñ", O: "Õ" },
  c: { c: "ç", C: "Ç", s: "ş", S: "Ş" },
  v: { c: "č", s: "š", z: "ž", r: "ř", C: "Č", S: "Š", Z: "Ž" },
  u: { a: "ă", g: "ğ", A: "Ă", G: "Ğ" },
  H: { o: "ő", u: "ű", O: "Ő", U: "Ű" },
  ".": { z: "ż", Z: "Ż", I: "İ" },
  "=": { a: "ā", e: "ē", i: "ī", o: "ō", u: "ū" },
};

export function decodeLatexAccents(input: string): string {
  let out = input;
  // {\ss}, {\o}, {\O}, {\ae}, {\AE}, {\aa}, {\AA}, {\l}, {\L}
  out = out
    .replace(/\{\\ss\}|\\ss\b/g, "ß")
    .replace(/\{\\o\}|\\o\b/g, "ø")
    .replace(/\{\\O\}|\\O\b/g, "Ø")
    .replace(/\{\\ae\}|\\ae\b/g, "æ")
    .replace(/\{\\AE\}|\\AE\b/g, "Æ")
    .replace(/\{\\aa\}|\\aa\b/g, "å")
    .replace(/\{\\AA\}|\\AA\b/g, "Å")
    .replace(/\{\\l\}|\\l\b/g, "ł")
    .replace(/\{\\L\}|\\L\b/g, "Ł")
    .replace(/\{\\i\}|\\i\b/g, "ı")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/\\\$/g, "$")
    .replace(/---/g, "\u2014")
    .replace(/--/g, "\u2013")
    .replace(/~/g, " ");

  // {\"o}, \"{o}, \"o, {\'e}, \'{e}, \'e, {\c{c}}
  out = out.replace(
    /\{?\\(["'`^~=.])\{?([A-Za-z])\}?\}?/g,
    (m, acc: string, ch: string) => ACCENT_MAP[acc]?.[ch] ?? m,
  );
  out = out.replace(
    /\{?\\([cvuH])\s*\{([A-Za-z])\}\}?/g,
    (m, acc: string, ch: string) => ACCENT_MAP[acc]?.[ch] ?? m,
  );
  return out;
}

export function stripOuterBraces(val: string): string {
  let s = val.trim();
  while (
    (s.startsWith("{") && s.endsWith("}")) ||
    (s.startsWith('"') && s.endsWith('"'))
  ) {
    if (s.startsWith("{")) {
      let depth = 0;
      let wrapsWhole = true;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "{") depth++;
        else if (s[i] === "}") depth--;
        if (depth === 0 && i < s.length - 1) {
          wrapsWhole = false;
          break;
        }
      }
      if (!wrapsWhole) break;
    }
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function extractBalancedArg(
  source: string,
  startIdx: number,
  openCh = "{",
  closeCh = "}",
): { content: string; endIdx: number } | null {
  let i = startIdx;
  while (i < source.length && /\s/.test(source[i])) i++;
  if (source[i] !== openCh) return null;
  let depth = 0;
  const contentStart = i + 1;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\\" && i + 1 < source.length) {
      i++;
      continue;
    }
    if (ch === openCh) depth++;
    else if (ch === closeCh) {
      depth--;
      if (depth === 0) {
        return { content: source.slice(contentStart, i), endIdx: i + 1 };
      }
    }
  }
  return null;
}
