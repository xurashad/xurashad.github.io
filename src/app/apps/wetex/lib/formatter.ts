import type { LineDiffRow } from "./types";

const VERBATIM_ENVS = new Set(["verbatim", "lstlisting", "minted", "comment"]);

export function formatLaTeX(source: string, tabSize = 2): string {
  const indentUnit = " ".repeat(Math.max(2, Math.min(8, tabSize)));
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let depth = 0;
  let rawEnv: string | null = null;

  for (const rawLine of lines) {
    if (rawEnv) {
      out.push(rawLine);
      if (rawLine.includes(`\\end{${rawEnv}}`)) {
        rawEnv = null;
      }
      continue;
    }

    const trimmed = rawLine.trim();
    if (!trimmed) {
      // Collapse excessive consecutive blank lines to max 1
      if (out.length === 0 || out[out.length - 1] !== "") {
        out.push("");
      }
      continue;
    }

    // \end{...} decreases indent before emitting
    const endMatch = trimmed.match(/^\\end\{([A-Za-z*]+)\}/);
    if (endMatch && endMatch[1] !== "document") {
      depth = Math.max(0, depth - 1);
    }

    out.push(`${indentUnit.repeat(depth)}${trimmed}`);

    const beginMatch = trimmed.match(/^\\begin\{([A-Za-z*]+)\}/);
    if (beginMatch) {
      const env = beginMatch[1];
      if (VERBATIM_ENVS.has(env) && !trimmed.includes(`\\end{${env}}`)) {
        rawEnv = env;
      } else if (
        env !== "document" &&
        !trimmed.includes(`\\end{${env}}`)
      ) {
        depth++;
      }
    }
  }

  return out.join("\n").replace(/\n+$/, "\n");
}

export function computeLineDiff(oldText: string, newText: string): LineDiffRow[] {
  const a = oldText.replace(/\r\n/g, "\n").split("\n");
  const b = newText.replace(/\r\n/g, "\n").split("\n");
  const n = a.length;
  const m = b.length;

  // Guard huge files with simple fallback
  if (n * m > 400000) {
    const rows: LineDiffRow[] = [];
    const maxLen = Math.max(n, m);
    for (let i = 0; i < maxLen; i++) {
      if (i < n && i < m && a[i] === b[i]) {
        rows.push({ type: "same", oldLineNo: i + 1, newLineNo: i + 1, text: a[i] });
      } else {
        if (i < n) rows.push({ type: "remove", oldLineNo: i + 1, text: a[i] });
        if (i < m) rows.push({ type: "add", newLineNo: i + 1, text: b[i] });
      }
    }
    return rows;
  }

  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows: LineDiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ type: "same", oldLineNo: i + 1, newLineNo: j + 1, text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: "remove", oldLineNo: i + 1, text: a[i] });
      i++;
    } else {
      rows.push({ type: "add", newLineNo: j + 1, text: b[j] });
      j++;
    }
  }
  while (i < n) {
    rows.push({ type: "remove", oldLineNo: i + 1, text: a[i] });
    i++;
  }
  while (j < m) {
    rows.push({ type: "add", newLineNo: j + 1, text: b[j] });
    j++;
  }
  return rows;
}
