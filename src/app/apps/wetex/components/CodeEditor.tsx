"use client";

import katex from "katex";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Bold,
  BookOpen,
  Calculator,
  Check,
  Code,
  Copy,
  Divide,
  FileCode2,
  FileText,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  MessageSquareCode,
  Replace,
  Search,
  Sigma,
  Table,
  Tag,
  Underline,
  Wand2,
  X,
} from "lucide-react";
import { highlightCode } from "../lib/latexHighlight";
import { AUTOCOMPLETE_COMMANDS, AUTOCOMPLETE_ENVIRONMENTS } from "../lib/symbols";
import type {
  AutocompleteItem,
  CompilerDiagnostic,
  EditorSettings,
  ProjectFile,
} from "../lib/types";

export interface CodeEditorHandle {
  insertSnippet: (text: string, cursorOffset?: number) => void;
  jumpToLine: (line: number) => void;
  openFind: () => void;
}

export interface CodeEditorProps {
  file: ProjectFile;
  openTabs: string[];
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  settings: EditorSettings;
  diagnostics: CompilerDiagnostic[];
  labels: string[];
  bibKeys: string[];
  projectFiles: string[];
  onChangeContent: (newContent: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFormat: () => void;
  onOpenTableWizard: () => void;
  onOpenEquationBuilder: () => void;
  onOpenBibWizard: () => void;
  onInsertIntoMain: (snippet: string) => void;
  onRecompile: () => void;
  onSave?: () => void;
  onSyncToPreview: (file: string, line: number) => void;
}

const BRACKET_PAIRS: Record<string, string> = {
  "{": "}",
  "[": "]",
  "(": ")",
  $: "$",
};

const CLOSE_CHARS = new Set(["}", "]", ")", "$"]);

function extractMathAtCursor(text: string, pos: number): string | null {
  // Check display $$...$$
  const prevDD = text.lastIndexOf("$$", pos - 1);
  if (prevDD !== -1) {
    const endDD = text.indexOf("$$", prevDD + 2);
    if (endDD !== -1 && pos <= endDD + 2) {
      return text.slice(prevDD + 2, endDD).trim() || null;
    }
  }
  // Check \[...\]
  const prevBr = text.lastIndexOf("\\[", pos - 1);
  if (prevBr !== -1) {
    const endBr = text.indexOf("\\]", prevBr + 2);
    if (endBr !== -1 && pos <= endBr + 2) {
      return text.slice(prevBr + 2, endBr).trim() || null;
    }
  }
  // Check equation / align / gather environment
  for (const env of ["equation", "equation*", "align", "align*", "gather", "gather*"]) {
    const openTok = `\\begin{${env}}`;
    const closeTok = `\\end{${env}}`;
    const openIdx = text.lastIndexOf(openTok, pos);
    if (openIdx !== -1) {
      const closeIdx = text.indexOf(closeTok, openIdx + openTok.length);
      if (closeIdx !== -1 && pos <= closeIdx + closeTok.length) {
        const inner = text
          .slice(openIdx + openTok.length, closeIdx)
          .replace(/\\label\{[^}]+\}/g, "")
          .replace(/\\tag\*?\{[^}]+\}/g, "")
          .replace(/\\(nonumber|notag)\b/g, "")
          .trim();
        if (!inner) return null;
        if (env.startsWith("align")) return `\\begin{aligned}${inner}\\end{aligned}`;
        if (env.startsWith("gather")) return `\\begin{gathered}${inner}\\end{gathered}`;
        return inner;
      }
    }
  }
  // Check inline $...$ on current line
  const lineStart = text.lastIndexOf("\n", Math.max(0, pos - 1)) + 1;
  const lineEndRaw = text.indexOf("\n", pos);
  const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
  const lineStr = text.slice(lineStart, lineEnd);
  const relPos = pos - lineStart;
  let dollarOpen = -1;
  for (let i = 0; i < lineStr.length; i++) {
    if (lineStr[i] === "\\" && i + 1 < lineStr.length) {
      i++;
      continue;
    }
    if (lineStr[i] === "$") {
      if (lineStr[i + 1] === "$") {
        i++;
        continue;
      }
      if (dollarOpen === -1) {
        dollarOpen = i;
      } else {
        if (relPos >= dollarOpen && relPos <= i + 1) {
          return lineStr.slice(dollarOpen + 1, i).trim() || null;
        }
        dollarOpen = -1;
      }
    }
  }
  return null;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(props, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);

    const [activeLine, setActiveLine] = useState(1);
    const [cursorCol, setCursorCol] = useState(1);
    const [scrollTop, setScrollTop] = useState(0);
    const [wrappedLineHeights, setWrappedLineHeights] = useState<number[]>([]);
    const [copiedPath, setCopiedPath] = useState(false);
    const [activeFormula, setActiveFormula] = useState<string | null>(null);

    // Find & Replace state
    const [findOpen, setFindOpen] = useState(false);
    const [findQuery, setFindQuery] = useState("");
    const [replaceQuery, setReplaceQuery] = useState("");
    const [matchCase, setMatchCase] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [activeMatchIdx, setActiveMatchIdx] = useState(0);

    // Autocomplete state
    const [acItems, setAcItems] = useState<AutocompleteItem[]>([]);
    const [acIndex, setAcIndex] = useState(0);
    const [acRange, setAcRange] = useState<{ start: number; end: number } | null>(null);
    const [acPos, setAcPos] = useState<{ top: number; left: number }>({ top: 36, left: 40 });

    const lines = useMemo(() => props.file.content.split("\n"), [props.file.content]);
    const highlightedHtml = useMemo(
      () => highlightCode(props.file.content, props.file.kind),
      [props.file.content, props.file.kind],
    );

    const diagByLine = useMemo(() => {
      const map: Record<number, CompilerDiagnostic> = {};
      for (const d of props.diagnostics) {
        if (d.file === props.file.path) {
          if (!map[d.line] || d.severity === "error") {
            map[d.line] = d;
          }
        }
      }
      return map;
    }, [props.diagnostics, props.file.path]);

    const liveFormulaHtml = useMemo(() => {
      if (!props.settings.liveMathBar || !activeFormula) return null;
      return katex.renderToString(activeFormula, {
        displayMode: false,
        throwOnError: false,
        macros: {
          "\\ket": "|#1\\rangle",
          "\\bra": "\\langle#1|",
          "\\braket": "\\langle#1|#2\\rangle",
          "\\pdv": "\\frac{\\partial #1}{\\partial #2}",
          "\\dv": "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}",
        },
      });
    }, [activeFormula, props.settings.liveMathBar]);

    const measureWrappedLines = useCallback(() => {
      if (!props.settings.wordWrap || !mirrorRef.current) return;
      const children = Array.from(mirrorRef.current.children) as HTMLElement[];
      if (children.length === 0) return;
      const heights = children.map((c) => c.getBoundingClientRect().height);
      setWrappedLineHeights(heights);
    }, [props.settings.wordWrap]);

    useEffect(() => {
      if (!props.settings.wordWrap || !mirrorRef.current) return;
      const el = mirrorRef.current;
      const ro = new ResizeObserver(() => {
        measureWrappedLines();
      });
      ro.observe(el);
      const raf = requestAnimationFrame(measureWrappedLines);
      return () => {
        ro.disconnect();
        cancelAnimationFrame(raf);
      };
    }, [props.settings.wordWrap, props.file.content, props.settings.fontSize, measureWrappedLines]);

    const syncScroll = () => {
      const ta = textareaRef.current;
      if (!ta) return;
      setScrollTop(ta.scrollTop);
      if (preRef.current) {
        preRef.current.scrollTop = ta.scrollTop;
        preRef.current.scrollLeft = ta.scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = ta.scrollTop;
      }
    };

    const updateCursorInfo = useCallback((ta: HTMLTextAreaElement) => {
      const pos = ta.selectionStart ?? 0;
      const before = ta.value.slice(0, pos);
      const split = before.split("\n");
      const ln = split.length;
      const col = (split[split.length - 1]?.length ?? 0) + 1;
      setActiveLine(ln);
      setCursorCol(col);

      if (props.settings.liveMathBar && props.file.kind === "tex") {
        setActiveFormula(extractMathAtCursor(ta.value, pos));
      } else {
        setActiveFormula(null);
      }

      const currentLineText = split[split.length - 1] ?? "";
      const refM = currentLineText.match(/\\(?:eq|auto|page|c)?ref\{([^}]*)$/);
      const citeM = currentLineText.match(/\\cite[a-z]*\{(?:[^}]*,)?([^},]*)$/);
      const beginM = currentLineText.match(/\\begin\{([A-Za-z*]*)$/);
      const fileM = currentLineText.match(/\\(?:input|include|includegraphics(?:\[[^\]]*\])?)\{([^}]*)$/);
      const cmdM = currentLineText.match(/(\\[A-Za-z*]*)$/);

      let candidates: AutocompleteItem[] = [];
      let replaceLen = 0;

      if (refM) {
        const q = refM[1].toLowerCase();
        replaceLen = refM[1].length;
        candidates = props.labels
          .filter((l) => l.toLowerCase().includes(q))
          .slice(0, 12)
          .map((l) => ({ label: l, insert: l, detail: "Label", kind: "label" }));
      } else if (citeM) {
        const q = citeM[1].trim().toLowerCase();
        replaceLen = citeM[1].length;
        candidates = props.bibKeys
          .filter((k) => k.toLowerCase().includes(q))
          .slice(0, 12)
          .map((k) => ({ label: k, insert: k, detail: "BibTeX key", kind: "cite" }));
      } else if (beginM) {
        const q = beginM[1].toLowerCase();
        replaceLen = beginM[1].length;
        candidates = AUTOCOMPLETE_ENVIRONMENTS.filter((e) =>
          e.label.toLowerCase().startsWith(q),
        ).slice(0, 10);
      } else if (fileM) {
        const q = fileM[1].toLowerCase();
        replaceLen = fileM[1].length;
        candidates = props.projectFiles
          .filter((p) => p.toLowerCase().includes(q))
          .slice(0, 10)
          .map((p) => ({ label: p, insert: p, detail: "Project file", kind: "file" }));
      } else if (cmdM && cmdM[1].length >= 2 && props.file.kind === "tex") {
        const q = cmdM[1].toLowerCase();
        replaceLen = cmdM[1].length;
        candidates = AUTOCOMPLETE_COMMANDS.filter((c) =>
          c.label.toLowerCase().startsWith(q),
        ).slice(0, 10);
      }

      if (candidates.length > 0) {
        setAcItems(candidates);
        setAcIndex(0);
        setAcRange({ start: pos - replaceLen, end: pos });
        const lineH = props.settings.fontSize * 1.65;
        const approxTop = Math.min(260, Math.max(24, ln * lineH - ta.scrollTop + 22));
        const approxLeft = Math.min(340, Math.max(20, col * (props.settings.fontSize * 0.56)));
        setAcPos({ top: approxTop, left: approxLeft });
      } else {
        setAcItems([]);
        setAcRange(null);
      }
    }, [props.labels, props.bibKeys, props.projectFiles, props.file.kind, props.settings.fontSize, props.settings.liveMathBar]);

    const applyEdit = useCallback(
      (nextValue: string, selStart: number, selEnd = selStart) => {
        props.onChangeContent(nextValue);
        requestAnimationFrame(() => {
          const ta = textareaRef.current;
          if (!ta) return;
          ta.focus();
          ta.setSelectionRange(selStart, selEnd);
          updateCursorInfo(ta);
        });
      },
      [props, updateCursorInfo],
    );

    const wrapSelection = useCallback(
      (before: string, after: string, fallbackInner = "") => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? start;
        const val = ta.value;
        const selected = val.slice(start, end) || fallbackInner;
        const next = val.slice(0, start) + before + selected + after + val.slice(end);
        const cursorStart = start + before.length;
        const cursorEnd = cursorStart + selected.length;
        applyEdit(next, cursorStart, cursorEnd);
      },
      [applyEdit],
    );

    const insertSnippetAtCursor = useCallback(
      (snippet: string, cursorOffset?: number) => {
        const ta = textareaRef.current;
        if (!ta) {
          props.onChangeContent(`${props.file.content}\n${snippet}`);
          return;
        }
        const start = ta.selectionStart ?? ta.value.length;
        const end = ta.selectionEnd ?? start;
        const val = ta.value;
        const next = val.slice(0, start) + snippet + val.slice(end);
        const pos =
          cursorOffset !== undefined
            ? start + snippet.length + cursorOffset
            : start + snippet.length;
        applyEdit(next, Math.max(0, pos), Math.max(0, pos));
      },
      [applyEdit, props],
    );

    const toggleCommentSelection = useCallback(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const val = ta.value;
      const start = ta.selectionStart ?? 0;
      const end = ta.selectionEnd ?? start;
      const lineStart = val.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const lineEndIdx = val.indexOf("\n", end);
      const lineEnd = lineEndIdx === -1 ? val.length : lineEndIdx;
      const block = val.slice(lineStart, lineEnd);
      const blockLines = block.split("\n");
      const allCommented = blockLines.every((l) => l.trimStart().startsWith("%"));
      const transformed = blockLines
        .map((l) =>
          allCommented
            ? l.replace(/^(\s*)%\s?/, "$1")
            : l.replace(/^(\s*)/, "$1% "),
        )
        .join("\n");
      const next = val.slice(0, lineStart) + transformed + val.slice(lineEnd);
      applyEdit(next, lineStart, lineStart + transformed.length);
    }, [applyEdit]);

    useImperativeHandle(
      ref,
      () => ({
        insertSnippet: insertSnippetAtCursor,
        jumpToLine: (line: number) => {
          const ta = textareaRef.current;
          if (!ta) return;
          const fileLines = ta.value.split("\n");
          const clamped = Math.max(1, Math.min(fileLines.length, line));
          let charIdx = 0;
          for (let i = 0; i < clamped - 1; i++) {
            charIdx += fileLines[i].length + 1;
          }
          ta.focus();
          ta.setSelectionRange(charIdx, charIdx);
          const lineH = props.settings.fontSize * 1.65;
          ta.scrollTop = Math.max(0, (clamped - 5) * lineH);
          syncScroll();
          setActiveLine(clamped);
        },
        openFind: () => setFindOpen(true),
      }),
      [insertSnippetAtCursor, props.settings.fontSize],
    );

    const acceptAutocomplete = (item: AutocompleteItem) => {
      const ta = textareaRef.current;
      if (!ta || !acRange) return;
      const val = ta.value;
      const next = val.slice(0, acRange.start) + item.insert + val.slice(acRange.end);
      const offset = item.cursorOffset ?? 0;
      const caret = acRange.start + item.insert.length + offset;
      setAcItems([]);
      setAcRange(null);
      applyEdit(next, caret, caret);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;

      if (acItems.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAcIndex((i) => (i + 1) % acItems.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setAcIndex((i) => (i - 1 + acItems.length) % acItems.length);
          return;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          e.preventDefault();
          acceptAutocomplete(acItems[acIndex]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setAcItems([]);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        props.onRecompile();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (props.onSave) props.onSave();
        else props.onRecompile();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) props.onRedo();
        else props.onUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        props.onRedo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFindOpen(true);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapSelection("\\textbf{", "}", "text");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapSelection("\\textit{", "}", "text");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        wrapSelection("$", "$", "x");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        toggleCommentSelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const val = ta.value;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? start;
        const lineStart = val.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const lineEndIdx = val.indexOf("\n", end);
        const lineEnd = lineEndIdx === -1 ? val.length : lineEndIdx;
        const block = val.slice(lineStart, lineEnd);
        const next = `${val.slice(0, lineEnd)}\n${block}${val.slice(lineEnd)}`;
        const caret = lineEnd + 1 + Math.max(0, start - lineStart);
        applyEdit(next, caret, caret);
        return;
      }
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const val = ta.value;
        const start = ta.selectionStart ?? 0;
        const lines = val.split("\n");
        const before = val.slice(0, start);
        const lineIdx = before.split("\n").length - 1;
        const col = start - (val.lastIndexOf("\n", Math.max(0, start - 1)) + 1);
        const targetIdx = e.key === "ArrowUp" ? lineIdx - 1 : lineIdx + 1;
        if (targetIdx < 0 || targetIdx >= lines.length) return;
        const curLine = lines[lineIdx];
        lines[lineIdx] = lines[targetIdx];
        lines[targetIdx] = curLine;
        const nextVal = lines.join("\n");
        let newLineStart = 0;
        for (let k = 0; k < targetIdx; k++) {
          newLineStart += lines[k].length + 1;
        }
        const caret = newLineStart + Math.min(col, lines[targetIdx].length);
        applyEdit(nextVal, caret, caret);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        props.onFormat();
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const indent = " ".repeat(props.settings.tabSize);
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? start;
        if (start === end && !e.shiftKey) {
          insertSnippetAtCursor(indent);
        } else {
          const val = ta.value;
          const lineStart = val.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
          const lineEndIdx = val.indexOf("\n", end);
          const lineEnd = lineEndIdx === -1 ? val.length : lineEndIdx;
          const blockLines = val.slice(lineStart, lineEnd).split("\n");
          const updated = blockLines
            .map((l) =>
              e.shiftKey
                ? l.replace(new RegExp(`^ {1,${props.settings.tabSize}}`), "")
                : `${indent}${l}`,
            )
            .join("\n");
          const next = val.slice(0, lineStart) + updated + val.slice(lineEnd);
          applyEdit(next, lineStart, lineStart + updated.length);
        }
        return;
      }

      if (e.key === "Enter") {
        const start = ta.selectionStart ?? 0;
        const val = ta.value;
        const lineStart = val.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const currentLineBefore = val.slice(lineStart, start);
        const indentMatch = currentLineBefore.match(/^(\s*)/);
        const baseIndent = indentMatch ? indentMatch[1] : "";
        const beginMatch = currentLineBefore.match(/\\begin\{([A-Za-z*]+)\}(?:\[[^\]]*\])?(?:\{[^}]*\})?\s*$/);

        if (beginMatch && beginMatch[1] !== "document") {
          const env = beginMatch[1];
          const restOfDoc = val.slice(start);
          if (!restOfDoc.trimStart().startsWith(`\\end{${env}}`)) {
            e.preventDefault();
            const innerIndent = baseIndent + " ".repeat(props.settings.tabSize);
            const insertion = `\n${innerIndent}\n${baseIndent}\\end{${env}}`;
            const next = val.slice(0, start) + insertion + val.slice(ta.selectionEnd ?? start);
            const caret = start + 1 + innerIndent.length;
            applyEdit(next, caret, caret);
            return;
          }
        }

        if (baseIndent) {
          e.preventDefault();
          insertSnippetAtCursor(`\n${baseIndent}`);
          return;
        }
      }

      if (props.settings.autoCloseBrackets && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? start;
        const val = ta.value;
        if (CLOSE_CHARS.has(e.key) && start === end && val[start] === e.key) {
          e.preventDefault();
          applyEdit(val, start + 1, start + 1);
          return;
        }
        if (BRACKET_PAIRS[e.key]) {
          const close = BRACKET_PAIRS[e.key];
          e.preventDefault();
          if (start !== end) {
            wrapSelection(e.key, close);
          } else {
            const next = val.slice(0, start) + e.key + close + val.slice(end);
            applyEdit(next, start + 1, start + 1);
          }
        }
      }
    };

    const matches = useMemo(() => {
      if (!findOpen || !findQuery) return [];
      const out: Array<{ start: number; end: number }> = [];
      try {
        const flags = matchCase ? "g" : "gi";
        const pattern = useRegex
          ? findQuery
          : findQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(pattern, flags);
        let m: RegExpExecArray | null;
        while ((m = re.exec(props.file.content)) !== null) {
          if (m[0].length === 0) {
            re.lastIndex++;
            continue;
          }
          out.push({ start: m.index, end: m.index + m[0].length });
          if (out.length >= 500) break;
        }
      } catch {
        // Ignore malformed regex
      }
      return out;
    }, [findOpen, findQuery, matchCase, useRegex, props.file.content]);

    const jumpToMatch = (idx: number) => {
      if (matches.length === 0 || !textareaRef.current) return;
      const safeIdx = ((idx % matches.length) + matches.length) % matches.length;
      setActiveMatchIdx(safeIdx);
      const m = matches[safeIdx];
      const ta = textareaRef.current;
      ta.focus();
      ta.setSelectionRange(m.start, m.end);
      const lineNum = ta.value.slice(0, m.start).split("\n").length;
      ta.scrollTop = Math.max(0, (lineNum - 4) * props.settings.fontSize * 1.65);
      syncScroll();
    };

    const replaceCurrent = () => {
      if (matches.length === 0) return;
      const safeIdx = ((activeMatchIdx % matches.length) + matches.length) % matches.length;
      const m = matches[safeIdx];
      const val = props.file.content;
      const next = val.slice(0, m.start) + replaceQuery + val.slice(m.end);
      applyEdit(next, m.start + replaceQuery.length, m.start + replaceQuery.length);
    };

    const replaceAllMatches = () => {
      if (!findQuery) return;
      try {
        const flags = matchCase ? "g" : "gi";
        const pattern = useRegex
          ? findQuery
          : findQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(pattern, flags);
        const next = props.file.content.replace(re, replaceQuery);
        applyEdit(next, 0, 0);
      } catch {
        // Ignore malformed regex
      }
    };

    const lineHeightPx = props.settings.fontSize * 1.65;
    let activeLineTopPx = (activeLine - 1) * lineHeightPx;
    let activeLineHeightPx = lineHeightPx;
    if (props.settings.wordWrap && wrappedLineHeights.length >= activeLine) {
      let acc = 0;
      for (let k = 0; k < activeLine - 1; k++) acc += wrappedLineHeights[k] ?? lineHeightPx;
      activeLineTopPx = acc;
      activeLineHeightPx = wrappedLineHeights[activeLine - 1] ?? lineHeightPx;
    }

    const tabsStrip = props.openTabs.length > 0 && (
      <div className="flex items-center gap-0.5 px-2 pt-1.5 bg-[#070814] border-b border-slate-800/80 overflow-x-auto wt-scroll">
        {props.openTabs.map((tabPath) => {
          const active = tabPath === props.file.path;
          const shortName = tabPath.split("/").pop() || tabPath;
          return (
            <div
              key={tabPath}
              onClick={() => props.onSelectTab(tabPath)}
              className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-t-lg text-[11px] font-mono border-t border-x cursor-pointer shrink-0 transition-colors ${
                active
                  ? "bg-[#0d1024] border-slate-700/70 text-cyan-200"
                  : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <FileCode2 size={11} className={active ? "text-cyan-400" : "text-slate-500"} />
              <span>{shortName}</span>
              {props.openTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onCloseTab(tabPath);
                  }}
                  className="opacity-60 hover:opacity-100 hover:text-rose-300 rounded p-0.5 cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );

    if (props.file.kind === "image") {
      return (
        <div className="h-full flex flex-col bg-[#080a18] text-slate-200">
          {tabsStrip}
          <div className="flex-1 flex p-6 items-center justify-center overflow-auto">
            <div className="max-w-lg w-full rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 text-center shadow-2xl space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-300 uppercase tracking-wider">
                <ImageIcon size={14} /> Asset Preview · {props.file.path}
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-black/50 p-4 flex items-center justify-center min-h-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={props.file.content}
                  alt={props.file.path}
                  className="max-h-72 max-w-full object-contain rounded"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    props.onInsertIntoMain(
                      `\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.7\\textwidth]{${props.file.path}}\n  \\caption{Figure caption.}\n  \\label{fig:${props.file.path.split("/").pop()?.replace(/\.[^.]+$/, "") || "image"}}\n\\end{figure}\n`,
                    )
                  }
                  className="px-3.5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  Insert Figure into Main .tex
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(props.file.path);
                    setCopiedPath(true);
                    setTimeout(() => setCopiedPath(false), 1500);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-slate-600/40 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedPath ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copiedPath ? "Copied Path" : "Copy Path"}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`h-full flex flex-col min-w-0 wt-theme-${props.settings.editorTheme}`}>
        {tabsStrip}

        {/* Rich Formatting Toolbar */}
        <div className="px-2 py-1.5 border-b border-slate-700/50 bg-[#0b0d1e]/95 flex items-center gap-1 flex-wrap text-slate-300">
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-700/60">
            <button type="button" onClick={() => wrapSelection("\\textbf{", "}", "bold")} title="Bold (Ctrl+B)" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <Bold size={13} />
            </button>
            <button type="button" onClick={() => wrapSelection("\\textit{", "}", "italic")} title="Italic (Ctrl+I)" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <Italic size={13} />
            </button>
            <button type="button" onClick={() => wrapSelection("\\underline{", "}", "text")} title="Underline" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <Underline size={13} />
            </button>
            <button type="button" onClick={() => wrapSelection("\\texttt{", "}", "code")} title="Monospace" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <Code size={13} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-700/60">
            <button type="button" onClick={() => wrapSelection("\\section{", "}", "Section Title")} title="Section" className="px-1.5 py-1 rounded hover:bg-white/10 hover:text-white text-[11px] font-mono cursor-pointer">
              §
            </button>
            <button type="button" onClick={() => wrapSelection("$", "$", "x")} title="Inline Math (Ctrl+M)" className="px-1.5 py-1 rounded hover:bg-white/10 hover:text-cyan-300 text-[11px] font-mono cursor-pointer">
              $x$
            </button>
            <button type="button" onClick={() => insertSnippetAtCursor("\\begin{equation}\\label{eq:}\n  \n\\end{equation}", -16)} title="Display Equation" className="p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 cursor-pointer">
              <Sigma size={13} />
            </button>
            <button type="button" onClick={() => insertSnippetAtCursor("\\frac{}{}", -3)} title="Fraction" className="p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 cursor-pointer">
              <Divide size={13} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-700/60">
            <button type="button" onClick={() => insertSnippetAtCursor("\\begin{itemize}\n  \\item \n\\end{itemize}", -15)} title="Bullet List" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <List size={13} />
            </button>
            <button type="button" onClick={() => insertSnippetAtCursor("\\begin{enumerate}\n  \\item \n\\end{enumerate}", -17)} title="Numbered List" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <ListOrdered size={13} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-700/60">
            <button type="button" onClick={props.onOpenTableWizard} title="Visual Table Generator" className="px-2 py-1 rounded hover:bg-indigo-500/20 text-[11px] flex items-center gap-1 text-cyan-300 cursor-pointer">
              <Table size={12} /> <span className="hidden xl:inline">Table</span>
            </button>
            <button type="button" onClick={props.onOpenEquationBuilder} title="Equation & Matrix Builder" className="px-2 py-1 rounded hover:bg-indigo-500/20 text-[11px] flex items-center gap-1 text-violet-300 cursor-pointer">
              <Calculator size={12} /> <span className="hidden xl:inline">Math</span>
            </button>
            <button type="button" onClick={props.onOpenBibWizard} title="BibTeX / DOI Citation Wizard" className="px-2 py-1 rounded hover:bg-indigo-500/20 text-[11px] flex items-center gap-1 text-emerald-300 cursor-pointer">
              <BookOpen size={12} /> <span className="hidden xl:inline">Cite</span>
            </button>
            <button type="button" onClick={() => insertSnippetAtCursor("\\ref{}", -1)} title="Insert Cross-Reference \\ref{}" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <Tag size={12} />
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button type="button" onClick={toggleCommentSelection} title="Toggle Comment (Ctrl+/)" className="p-1.5 rounded hover:bg-white/10 hover:text-white cursor-pointer">
              <MessageSquareCode size={13} />
            </button>
            <button type="button" onClick={props.onFormat} title="Format LaTeX (Alt+F)" className="p-1.5 rounded hover:bg-white/10 hover:text-cyan-300 cursor-pointer">
              <Wand2 size={13} />
            </button>
            <button type="button" onClick={() => props.onSyncToPreview(props.file.path, activeLine)} title="Sync Cursor Line to Instant Preview" className="px-2 py-1 rounded hover:bg-cyan-500/20 text-[11px] flex items-center gap-1 text-cyan-200 cursor-pointer">
              <ArrowLeftRight size={12} /> <span className="hidden lg:inline">Sync</span>
            </button>
            <button type="button" onClick={() => setFindOpen((v) => !v)} title="Find & Replace (Ctrl+F)" className={`p-1.5 rounded cursor-pointer ${findOpen ? "bg-indigo-500/30 text-white" : "hover:bg-white/10"}`}>
              <Search size={13} />
            </button>
          </div>

          <div className="flex-1" />

          <div className="hidden sm:flex items-center gap-2 text-[10.5px] font-mono text-slate-400 pr-1">
            <FileText size={11} className="text-cyan-400" />
            <span>{props.file.path}</span>
            <span className="text-slate-600">·</span>
            <span>Ln {activeLine}, Col {cursorCol}</span>
          </div>
        </div>

        {/* Find & Replace Drawer */}
        {findOpen && (
          <div className="px-3 py-2 border-b border-slate-700/60 bg-[#0d1022] flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 flex-1 min-w-[180px]">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Find…"
                value={findQuery}
                onChange={(e) => {
                  setFindQuery(e.target.value);
                  setActiveMatchIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") jumpToMatch(e.shiftKey ? activeMatchIdx - 1 : activeMatchIdx + 1);
                  if (e.key === "Escape") setFindOpen(false);
                }}
                className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => setMatchCase((v) => !v)}
                title="Match Case"
                className={`px-1.5 py-1 rounded font-mono text-[10px] border cursor-pointer ${
                  matchCase ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "border-slate-700 text-slate-400"
                }`}
              >
                Aa
              </button>
              <button
                type="button"
                onClick={() => setUseRegex((v) => !v)}
                title="Regular Expression"
                className={`px-1.5 py-1 rounded font-mono text-[10px] border cursor-pointer ${
                  useRegex ? "bg-cyan-500/20 border-cyan-400 text-cyan-200" : "border-slate-700 text-slate-400"
                }`}
              >
                .*
              </button>
              <span className="text-[10.5px] font-mono text-slate-400 min-w-[46px] text-center">
                {matches.length > 0 ? `${(activeMatchIdx % matches.length) + 1}/${matches.length}` : "0/0"}
              </span>
              <button type="button" onClick={() => jumpToMatch(activeMatchIdx - 1)} className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer">
                <ArrowUp size={13} />
              </button>
              <button type="button" onClick={() => jumpToMatch(activeMatchIdx + 1)} className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer">
                <ArrowDown size={13} />
              </button>
            </div>

            <div className="flex items-center gap-1 flex-1 min-w-[180px]">
              <Replace size={13} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Replace…"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
              />
              <button type="button" onClick={replaceCurrent} className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] border border-slate-600/40 text-slate-200 cursor-pointer">
                Replace
              </button>
              <button type="button" onClick={replaceAllMatches} className="px-2 py-1 rounded bg-indigo-500/30 hover:bg-indigo-500/45 border border-indigo-400/40 text-white cursor-pointer">
                All
              </button>
              <button type="button" onClick={() => setFindOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Layered Editor Surface */}
        <div className="wt-editor-surface flex-1 flex min-h-0 relative overflow-hidden">
          {props.settings.lineNumbers && (
            <div
              ref={gutterRef}
              style={{
                background: "var(--wt-ed-gutter)",
                fontSize: `${props.settings.fontSize}px`,
                lineHeight: 1.65,
                paddingTop: "14px",
                paddingBottom: "28px",
              }}
              className="w-12 shrink-0 overflow-hidden select-none border-r border-slate-800/70 text-right font-mono text-slate-500"
            >
              {lines.map((_, idx) => {
                const lineNo = idx + 1;
                const diag = diagByLine[lineNo];
                const isCur = props.settings.highlightActiveLine && activeLine === lineNo;
                const h =
                  props.settings.wordWrap && wrappedLineHeights[idx]
                    ? `${wrappedLineHeights[idx]}px`
                    : `${lineHeightPx}px`;
                return (
                  <div
                    key={lineNo}
                    style={{ height: h }}
                    onClick={() => props.onSyncToPreview(props.file.path, lineNo)}
                    title={diag ? diag.message : `Line ${lineNo} (click to sync preview)`}
                    className={`px-2 flex items-start justify-end gap-1 cursor-pointer ${
                      isCur ? "text-cyan-300 font-semibold bg-white/[0.05]" : ""
                    }`}
                  >
                    {diag && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                          diag.severity === "error" ? "bg-rose-500" : "bg-amber-400"
                        }`}
                      />
                    )}
                    <span>{lineNo}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Code Layer + Textarea */}
          <div className="flex-1 min-w-0 relative overflow-hidden">
            {props.settings.highlightActiveLine && (
              <div
                aria-hidden="true"
                style={{
                  top: `${14 + activeLineTopPx - scrollTop}px`,
                  height: `${activeLineHeightPx}px`,
                }}
                className="wt-active-line-bar"
              />
            )}

            {props.settings.wordWrap && (
              <div
                ref={mirrorRef}
                aria-hidden="true"
                style={{
                  fontSize: `${props.settings.fontSize}px`,
                  padding: "0 16px",
                }}
                className="wt-editor-layer absolute inset-x-0 top-0 invisible pointer-events-none whitespace-pre-wrap break-words"
              >
                {lines.map((ln, idx) => (
                  <div key={idx}>{ln || "\u200b"}</div>
                ))}
              </div>
            )}

            <pre
              ref={preRef}
              aria-hidden="true"
              style={{
                fontSize: `${props.settings.fontSize}px`,
                tabSize: props.settings.tabSize,
              }}
              className={`wt-editor-layer wt-editor-pre absolute inset-0 overflow-hidden m-0 ${
                props.settings.wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
              }`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />

            <textarea
              ref={textareaRef}
              value={props.file.content}
              spellCheck={props.settings.spellCheck}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              wrap={props.settings.wordWrap ? "soft" : "off"}
              onChange={(e) => {
                props.onChangeContent(e.target.value);
                updateCursorInfo(e.target);
              }}
              onScroll={syncScroll}
              onClick={(e) => updateCursorInfo(e.currentTarget)}
              onKeyUp={(e) => updateCursorInfo(e.currentTarget)}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: `${props.settings.fontSize}px`,
                tabSize: props.settings.tabSize,
              }}
              className={`wt-editor-layer wt-editor-textarea wt-scroll absolute inset-0 w-full h-full overflow-auto ${
                props.settings.wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
              }`}
            />

            {acItems.length > 0 && (
              <div
                style={{ top: `${acPos.top}px`, left: `${acPos.left}px` }}
                className="absolute z-40 w-72 max-h-56 overflow-y-auto wt-scroll rounded-xl bg-[#0d1025]/95 backdrop-blur-xl border border-indigo-400/40 shadow-2xl p-1"
              >
                {acItems.map((item, idx) => (
                  <button
                    key={`${item.kind}-${item.label}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      acceptAutocomplete(item);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 cursor-pointer ${
                      idx === acIndex
                        ? "bg-indigo-500/35 text-white"
                        : "text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="font-mono text-cyan-200 truncate">{item.label}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.detail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Inline Math Preview Strip */}
        {liveFormulaHtml && (
          <div className="wt-live-math-bar px-3 py-1.5 flex items-center justify-between gap-3 text-slate-100 overflow-x-auto wt-scroll">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/25 text-violet-200 border border-violet-400/30 shrink-0">
                Live Math
              </span>
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: liveFormulaHtml }}
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveFormula(null)}
              className="text-slate-400 hover:text-white p-0.5 shrink-0 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    );
  },
);
