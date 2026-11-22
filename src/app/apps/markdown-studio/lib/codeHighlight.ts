import { escapeHtml } from "./utils";

type LangFamily =
  | "js"
  | "py"
  | "rust"
  | "go"
  | "c"
  | "java"
  | "bash"
  | "json"
  | "yaml"
  | "html"
  | "css"
  | "sql"
  | "md"
  | "tex"
  | "diff"
  | "graphql"
  | "plain";

const LANG_ALIASES: Record<string, LangFamily> = {
  js: "js",
  javascript: "js",
  mjs: "js",
  cjs: "js",
  jsx: "js",
  ts: "js",
  typescript: "js",
  tsx: "js",
  py: "py",
  python: "py",
  rs: "rust",
  rust: "rust",
  go: "go",
  golang: "go",
  c: "c",
  cpp: "c",
  "c++": "c",
  cc: "c",
  h: "c",
  hpp: "c",
  java: "java",
  kt: "java",
  kotlin: "java",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  fish: "bash",
  ps1: "bash",
  powershell: "bash",
  json: "json",
  jsonc: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "yaml",
  ini: "yaml",
  env: "yaml",
  html: "html",
  xml: "html",
  svg: "html",
  css: "css",
  scss: "css",
  less: "css",
  sql: "sql",
  postgres: "sql",
  mysql: "sql",
  sqlite: "sql",
  md: "md",
  markdown: "md",
  mdx: "md",
  tex: "tex",
  latex: "tex",
  diff: "diff",
  patch: "diff",
  graphql: "graphql",
  gql: "graphql",
};

const KEYWORDS: Record<LangFamily, Set<string>> = {
  js: new Set([
    "async", "await", "break", "case", "catch", "class", "const", "continue",
    "debugger", "default", "delete", "do", "else", "enum", "export", "extends",
    "false", "finally", "for", "from", "function", "if", "implements", "import",
    "in", "instanceof", "interface", "let", "new", "null", "of", "package",
    "private", "protected", "public", "readonly", "return", "static", "super",
    "switch", "this", "throw", "true", "try", "type", "typeof", "undefined",
    "var", "void", "while", "with", "yield", "as", "satisfies", "infer",
  ]),
  py: new Set([
    "and", "as", "assert", "async", "await", "break", "class", "continue",
    "def", "del", "elif", "else", "except", "False", "finally", "for", "from",
    "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not",
    "or", "pass", "raise", "return", "True", "try", "while", "with", "yield",
    "match", "case", "self",
  ]),
  rust: new Set([
    "as", "async", "await", "break", "const", "continue", "crate", "dyn",
    "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let",
    "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self",
    "Self", "static", "struct", "super", "trait", "true", "type", "unsafe",
    "use", "where", "while", "Some", "None", "Ok", "Err",
  ]),
  go: new Set([
    "break", "case", "chan", "const", "continue", "default", "defer", "else",
    "fallthrough", "false", "for", "func", "go", "goto", "if", "import",
    "interface", "map", "nil", "package", "range", "return", "select",
    "struct", "switch", "true", "type", "var",
  ]),
  c: new Set([
    "auto", "break", "case", "char", "const", "continue", "default", "do",
    "double", "else", "enum", "extern", "false", "float", "for", "goto", "if",
    "inline", "int", "long", "namespace", "nullptr", "NULL", "public",
    "private", "protected", "return", "short", "signed", "sizeof", "static",
    "struct", "switch", "template", "this", "true", "typedef", "typename",
    "union", "unsigned", "using", "virtual", "void", "volatile", "while",
    "class", "constexpr", "include", "define",
  ]),
  java: new Set([
    "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
    "class", "const", "continue", "default", "do", "double", "else", "enum",
    "extends", "false", "final", "finally", "float", "for", "if", "implements",
    "import", "instanceof", "int", "interface", "long", "native", "new", "null",
    "package", "private", "protected", "public", "return", "short", "static",
    "super", "switch", "synchronized", "this", "throw", "throws", "transient",
    "true", "try", "val", "var", "void", "volatile", "while", "fun", "object",
  ]),
  bash: new Set([
    "if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done",
    "case", "esac", "in", "function", "return", "exit", "export", "local",
    "readonly", "echo", "cd", "pwd", "ls", "grep", "sed", "awk", "curl", "git",
    "npm", "npx", "node", "python", "sudo", "true", "false",
  ]),
  json: new Set(["true", "false", "null"]),
  yaml: new Set(["true", "false", "null", "yes", "no", "on", "off"]),
  html: new Set(),
  css: new Set(["important", "from", "to", "and", "or", "not", "only", "screen"]),
  sql: new Set([
    "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
    "DELETE", "CREATE", "TABLE", "INDEX", "VIEW", "DROP", "ALTER", "ADD",
    "JOIN", "INNER", "LEFT", "RIGHT", "OUTER", "ON", "AS", "AND", "OR", "NOT",
    "NULL", "IS", "IN", "LIKE", "BETWEEN", "ORDER", "BY", "GROUP", "HAVING",
    "LIMIT", "OFFSET", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX", "ASC",
    "DESC", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNION", "ALL", "CASE",
    "WHEN", "THEN", "ELSE", "END", "TRUE", "FALSE",
  ]),
  md: new Set(),
  tex: new Set(),
  diff: new Set(),
  graphql: new Set([
    "query", "mutation", "subscription", "fragment", "on", "type", "input",
    "enum", "interface", "union", "scalar", "schema", "extend", "implements",
    "true", "false", "null",
  ]),
  plain: new Set(),
};

export function parseHighlightLines(spec: string | undefined): Set<number> {
  const result = new Set<number>();
  if (!spec) return result;
  const cleaned = spec.replace(/[{}]/g, "").trim();
  if (!cleaned) return result;
  for (const part of cleaned.split(",")) {
    const seg = part.trim();
    const dash = seg.indexOf("-");
    if (dash !== -1) {
      const a = Number.parseInt(seg.slice(0, dash), 10);
      const b = Number.parseInt(seg.slice(dash + 1), 10);
      if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a && b - a <= 500) {
        for (let i = a; i <= b; i++) result.add(i);
      }
    } else {
      const n = Number.parseInt(seg, 10);
      if (!Number.isNaN(n)) result.add(n);
    }
  }
  return result;
}

function highlightLineTokens(line: string, family: LangFamily): string {
  if (family === "plain") return escapeHtml(line);

  if (family === "diff") {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      return `<span class="md-tok-add">${escapeHtml(line)}</span>`;
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      return `<span class="md-tok-del">${escapeHtml(line)}</span>`;
    }
    if (line.startsWith("@@") || line.startsWith("+++") || line.startsWith("---")) {
      return `<span class="md-tok-kw">${escapeHtml(line)}</span>`;
    }
    return escapeHtml(line);
  }

  if (family === "md") {
    if (/^\s*#{1,6}\s/.test(line)) {
      return `<span class="md-tok-kw">${escapeHtml(line)}</span>`;
    }
    if (/^\s*>/.test(line)) {
      return `<span class="md-tok-cmt">${escapeHtml(line)}</span>`;
    }
  }

  if (family === "tex") {
    return line
      .replace(/(\\[a-zA-Z]+|%.*$|\$\$?|\{|\})/g, (m) => {
        if (m.startsWith("%")) return `<span class="md-tok-cmt">${escapeHtml(m)}</span>`;
        if (m.startsWith("\\")) return `<span class="md-tok-kw">${escapeHtml(m)}</span>`;
        if (m === "$" || m === "$$") return `<span class="md-tok-str">${escapeHtml(m)}</span>`;
        return `<span class="md-tok-op">${escapeHtml(m)}</span>`;
      })
      .replace(/([^<]+)(?=<|$)/g, (txt) => txt);
  }

  let out = "";
  let i = 0;
  const n = line.length;
  const kwSet = KEYWORDS[family];

  while (i < n) {
    const ch = line[i];

    // Comments
    if (
      (ch === "/" && line[i + 1] === "/" && (family === "js" || family === "rust" || family === "go" || family === "c" || family === "java" || family === "css")) ||
      (ch === "#" && (family === "py" || family === "bash" || family === "yaml" || family === "graphql")) ||
      (ch === "-" && line[i + 1] === "-" && family === "sql")
    ) {
      out += `<span class="md-tok-cmt">${escapeHtml(line.slice(i))}</span>`;
      break;
    }

    if (ch === "/" && line[i + 1] === "*") {
      const end = line.indexOf("*/", i + 2);
      const slice = end === -1 ? line.slice(i) : line.slice(i, end + 2);
      out += `<span class="md-tok-cmt">${escapeHtml(slice)}</span>`;
      i += slice.length;
      continue;
    }

    // HTML/XML tags
    if (family === "html" && ch === "<") {
      if (line.startsWith("<!--", i)) {
        const end = line.indexOf("-->", i + 4);
        const slice = end === -1 ? line.slice(i) : line.slice(i, end + 3);
        out += `<span class="md-tok-cmt">${escapeHtml(slice)}</span>`;
        i += slice.length;
        continue;
      }
      const close = line.indexOf(">", i + 1);
      if (close !== -1) {
        const tagSlice = line.slice(i, close + 1);
        out += `<span class="md-tok-tag">${escapeHtml(tagSlice)}</span>`;
        i = close + 1;
        continue;
      }
    }

    // Strings
    if (ch === '"' || ch === "'" || (ch === "`" && (family === "js" || family === "go" || family === "sql" || family === "bash"))) {
      let j = i + 1;
      while (j < n) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === ch) {
          j++;
          break;
        }
        j++;
      }
      const strSlice = line.slice(i, j);
      // JSON / YAML property keys followed by colon
      if ((family === "json" || family === "yaml") && /^\s*:/.test(line.slice(j))) {
        out += `<span class="md-tok-prop">${escapeHtml(strSlice)}</span>`;
      } else {
        out += `<span class="md-tok-str">${escapeHtml(strSlice)}</span>`;
      }
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) && (i === 0 || !/[a-zA-Z0-9_$]/.test(line[i - 1]))) {
      let j = i;
      while (j < n && /[0-9a-fA-FxXoObB_.]/.test(line[j])) j++;
      if (family === "css" && /[a-z%]/i.test(line[j] ?? "")) {
        while (j < n && /[a-zA-Z%]/.test(line[j])) j++;
      }
      out += `<span class="md-tok-num">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    // Identifiers / Keywords / Function calls / Types / YAML keys
    if (/[a-zA-Z_$@]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_$-]/.test(line[j])) j++;
      const word = line.slice(i, j);

      if (family === "yaml" && /^\s*:/.test(line.slice(j))) {
        out += `<span class="md-tok-prop">${escapeHtml(word)}</span>`;
      } else if (family === "css" && ch === "@") {
        out += `<span class="md-tok-kw">${escapeHtml(word)}</span>`;
      } else if (family === "sql" && kwSet.has(word.toUpperCase())) {
        out += `<span class="md-tok-kw">${escapeHtml(word)}</span>`;
      } else if (kwSet.has(word)) {
        out += `<span class="md-tok-kw">${escapeHtml(word)}</span>`;
      } else if (line[j] === "(") {
        out += `<span class="md-tok-fn">${escapeHtml(word)}</span>`;
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        out += `<span class="md-tok-type">${escapeHtml(word)}</span>`;
      } else {
        out += escapeHtml(word);
      }
      i = j;
      continue;
    }

    // Operators & punctuation
    if (/[=+\-*/<>!&|^~?:;{}[\]().]/.test(ch)) {
      out += `<span class="md-tok-op">${escapeHtml(ch)}</span>`;
      i++;
      continue;
    }

    out += escapeHtml(ch);
    i++;
  }

  return out;
}

export function highlightFencedCode(
  code: string,
  lang: string,
  options?: { highlightLines?: Set<number>; showLineNumbers?: boolean },
): string {
  const family: LangFamily = LANG_ALIASES[lang.toLowerCase().trim()] ?? "plain";
  const lines = code.replace(/\r\n/g, "\n").split("\n");
  const hlSet = options?.highlightLines;
  const showNums = options?.showLineNumbers ?? true;

  if (!hlSet?.size && !showNums) {
    return lines.map((line) => highlightLineTokens(line, family)).join("\n");
  }

  return lines
    .map((line, idx) => {
      const lineNum = idx + 1;
      const isHighlighted = hlSet?.has(lineNum) ?? false;
      const numSpan = showNums
        ? `<span class="md-code-ln" aria-hidden="true">${lineNum}</span>`
        : "";
      const tokenHtml = highlightLineTokens(line, family) || " ";
      return `<span class="md-code-row${isHighlighted ? " is-highlighted" : ""}">${numSpan}<span class="md-code-tx">${tokenHtml}</span></span>`;
    })
    .join("");
}
