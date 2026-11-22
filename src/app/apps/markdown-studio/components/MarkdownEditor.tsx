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
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  CheckSquare,
  ChevronDown,
  Code,
  Copy,
  FileCode2,
  FileText,
  GitBranch,
  Heading,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Replace,
  Search,
  Sigma,
  Sparkles,
  Strikethrough,
  Table,
  Tag,
  X,
} from "lucide-react";
import { EMOJI_LIST } from "../lib/emojis";
import { highlightSource } from "../lib/markdownHighlight";
import { SLASH_COMMANDS } from "../lib/snippets";
import type {
  EditorSettings,
  MarkdownDiagnostic,
  MarkdownFile,
  SlashCommandItem,
} from "../lib/types";
import { escapeRegex, formatBytes } from "../lib/utils";

export interface MarkdownEditorHandle {
  insertSnippet: (text: string, cursorOffset?: number) => void;
  wrapSelection: (before: string, after: string, placeholder: string) => void;
  prefixLines: (prefix: string) => void;
  jumpToLine: (line: number) => void;
  openFind: () => void;
  scrollToRatio: (ratio: number) => void;
}

export interface MarkdownEditorProps {
  file: MarkdownFile;
  openTabs: string[];
  unsavedPaths: Set<string>;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  settings: EditorSettings;
  diagnostics: MarkdownDiagnostic[];
  projectFiles: MarkdownFile[];
  footnoteIds: string[];
  onChangeContent: (newContent: string) => void;
  onCursorChange: (line: number, col: number) => void;
  onPasteImage: (filename: string, dataUrl: string) => string;
  onInsertIntoMain: (snippet: string) => void;
  onFormat: () => void;
  onSave: () => void;
  onOpenTableWizard: () => void;
  onOpenMermaidBuilder: () => void;
  onOpenMathBuilder: () => void;
  onOpenFrontmatter: () => void;
  onOpenCalloutBadge: () => void;
  onEditorScrollRatio: (ratio: number) => void;
}

interface AcOption {
  id: string;
  label: string;
  detail: string;
  insertText: string;
  cursorOffset?: number;
  modalAction?: SlashCommandItem["modalAction"];
}

const WRAP_CHARS: Record<string, string> = {
  "*": "*",
  _: "_",
  "`": "`",
  "~": "~",
  $: "$",
  "[": "]",
  "(": ")",
  "{": "}",
  '"': '"',
};

function extractMathAtCursor(text: string, pos: number): string | null {
  const prevDD = text.lastIndexOf("$$", pos - 1);
  if (prevDD !== -1) {
    const endDD = text.indexOf("$$", prevDD + 2);
    if (endDD !== -1 && pos <= endDD + 2) {
      return text.slice(prevDD + 2, endDD).trim() || null;
    }
  }
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

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  function MarkdownEditor(props, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    const ignoringScrollRef = useRef(false);

    const [activeLine, setActiveLine] = useState(1);
    const [scrollTop, setScrollTop] = useState(0);
    const [wrappedHeights, setWrappedHeights] = useState<number[]>([]);
    const [copiedPath, setCopiedPath] = useState(false);
    const [activeFormula, setActiveFormula] = useState<string | null>(null);
    const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
    const [calloutMenuOpen, setCalloutMenuOpen] = useState(false);

    // Find & Replace
    const [findOpen, setFindOpen] = useState(false);
    const [findQuery, setFindQuery] = useState("");
    const [replaceQuery, setReplaceQuery] = useState("");
    const [matchCase, setMatchCase] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [activeMatchIdx, setActiveMatchIdx] = useState(0);

    // Autocomplete
    const [acOptions, setAcOptions] = useState<AcOption[]>([]);
    const [acIndex, setAcIndex] = useState(0);
    const [acRange, setAcRange] = useState<{ start: number; end: number } | null>(null);
    const [acPos, setAcPos] = useState<{ top: number; left: number }>({ top: 36, left: 40 });

    const lines = useMemo(() => props.file.content.split("\n"), [props.file.content]);
    const highlightedHtml = useMemo(
      () => highlightSource(props.file.content, props.file.kind),
      [props.file.content, props.file.kind],
    );

    const diagByLine = useMemo(() => {
      const map: Record<number, MarkdownDiagnostic> = {};
      for (const d of props.diagnostics) {
        if (!map[d.line] || d.severity === "error") {
          map[d.line] = d;
        }
      }
      return map;
    }, [props.diagnostics]);

    const liveFormulaHtml = useMemo(() => {
      if (!props.settings.liveMathBar || !activeFormula) return null;
      return katex.renderToString(activeFormula, {
        displayMode: false,
        throwOnError: false,
        macros: {
          "\\ket": "|#1\\rangle",
          "\\bra": "\\langle#1|",
          "\\braket": "\\langle#1|#2\\rangle",
        },
      });
    }, [activeFormula, props.settings.liveMathBar]);

    const measureWrapped = useCallback(() => {
      if (!props.settings.wordWrap || !mirrorRef.current) return;
      const children = Array.from(mirrorRef.current.children) as HTMLElement[];
      if (children.length === 0) return;
      setWrappedHeights(children.map((c) => c.getBoundingClientRect().height));
    }, [props.settings.wordWrap]);

    useEffect(() => {
      if (!props.settings.wordWrap || !mirrorRef.current) return;
      const el = mirrorRef.current;
      const ro = new ResizeObserver(measureWrapped);
      ro.observe(el);
      const raf = requestAnimationFrame(measureWrapped);
      return () => {
        ro.disconnect();
        cancelAnimationFrame(raf);
      };
    }, [
      props.settings.wordWrap,
      props.file.content,
      props.settings.fontSize,
      props.settings.editorFontFamily,
      measureWrapped,
    ]);

    const syncScrollLayers = () => {
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
      if (!ignoringScrollRef.current && props.settings.scrollSync) {
        const max = ta.scrollHeight - ta.clientHeight;
        if (max > 0) props.onEditorScrollRatio(ta.scrollTop / max);
      }
    };

    const setTextareaSelection = useCallback(
      (nextText: string, selStart: number, selEnd = selStart) => {
        props.onChangeContent(nextText);
        requestAnimationFrame(() => {
          const ta = textareaRef.current;
          if (!ta) return;
          ta.focus();
          ta.setSelectionRange(selStart, selEnd);
        });
      },
      [props],
    );

    const insertAtCursor = useCallback(
      (snippet: string, cursorOffset?: number) => {
        const ta = textareaRef.current;
        if (!ta) {
          props.onChangeContent(`${props.file.content}\n${snippet}`);
          return;
        }
        const start = ta.selectionStart ?? props.file.content.length;
        const end = ta.selectionEnd ?? start;
        const next =
          props.file.content.slice(0, start) + snippet + props.file.content.slice(end);
        const targetPos =
          cursorOffset !== undefined
            ? start + snippet.length + cursorOffset
            : start + snippet.length;
        setTextareaSelection(next, targetPos, targetPos);
      },
      [props, setTextareaSelection],
    );

    const wrapSelectionText = useCallback(
      (before: string, after: string, placeholder: string) => {
        const ta = textareaRef.current;
        if (!ta) {
          insertAtCursor(`${before}${placeholder}${after}`);
          return;
        }
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? start;
        const selected = props.file.content.slice(start, end);
        const body = selected || placeholder;
        const next =
          props.file.content.slice(0, start) +
          before +
          body +
          after +
          props.file.content.slice(end);
        setTextareaSelection(
          next,
          start + before.length,
          start + before.length + body.length,
        );
      },
      [props.file.content, insertAtCursor, setTextareaSelection],
    );

    const prefixSelectedLines = useCallback(
      (prefix: string) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const content = props.file.content;
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? start;
        const blockStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const blockEndRaw = content.indexOf("\n", end);
        const blockEnd = blockEndRaw === -1 ? content.length : blockEndRaw;
        const chunk = content.slice(blockStart, blockEnd);
        const updated = chunk
          .split("\n")
          .map((l) => (l.startsWith(prefix) ? l.slice(prefix.length) : `${prefix}${l}`))
          .join("\n");
        const next = content.slice(0, blockStart) + updated + content.slice(blockEnd);
        setTextareaSelection(next, blockStart, blockStart + updated.length);
      },
      [props.file.content, setTextareaSelection],
    );

    const setLineHeadingLevel = useCallback(
      (level: number) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const content = props.file.content;
        const pos = ta.selectionStart ?? 0;
        const lineStart = content.lastIndexOf("\n", Math.max(0, pos - 1)) + 1;
        const lineEndRaw = content.indexOf("\n", pos);
        const lineEnd = lineEndRaw === -1 ? content.length : lineEndRaw;
        const rawLine = content.slice(lineStart, lineEnd);
        const stripped = rawLine.replace(/^\s*#{1,6}\s+/, "");
        const prefix = `${"#".repeat(level)} `;
        const nextLine = `${prefix}${stripped}`;
        const next = content.slice(0, lineStart) + nextLine + content.slice(lineEnd);
        setTextareaSelection(next, lineStart + nextLine.length);
      },
      [props.file.content, setTextareaSelection],
    );

    useImperativeHandle(
      ref,
      () => ({
        insertSnippet: insertAtCursor,
        wrapSelection: wrapSelectionText,
        prefixLines: prefixSelectedLines,
        openFind: () => setFindOpen(true),
        jumpToLine: (line: number) => {
          const ta = textareaRef.current;
          if (!ta) return;
          const allLines = props.file.content.split("\n");
          const clamped = Math.max(1, Math.min(allLines.length, line));
          let offset = 0;
          for (let i = 0; i < clamped - 1; i++) {
            offset += allLines[i].length + 1;
          }
          ta.focus();
          ta.setSelectionRange(offset, offset + (allLines[clamped - 1]?.length ?? 0));
          const lineH = props.settings.fontSize * 1.65;
          const targetTop = Math.max(0, (clamped - 4) * lineH);
          ta.scrollTop = targetTop;
          syncScrollLayers();
          setActiveLine(clamped);
        },
        scrollToRatio: (ratio: number) => {
          const ta = textareaRef.current;
          if (!ta) return;
          const max = ta.scrollHeight - ta.clientHeight;
          if (max <= 0) return;
          ignoringScrollRef.current = true;
          ta.scrollTop = ratio * max;
          if (preRef.current) preRef.current.scrollTop = ta.scrollTop;
          if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
          setScrollTop(ta.scrollTop);
          requestAnimationFrame(() => {
            ignoringScrollRef.current = false;
          });
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [insertAtCursor, wrapSelectionText, prefixSelectedLines, props.file.content, props.settings.fontSize],
    );

    const updateCaretMetrics = useCallback(
      (text: string, pos: number) => {
        const before = text.slice(0, pos);
        const line = before.split("\n").length;
        const lastNl = before.lastIndexOf("\n");
        const col = pos - lastNl;
        setActiveLine(line);
        props.onCursorChange(line, col);
        setActiveFormula(extractMathAtCursor(text, pos));

        // Typewriter mode keeps cursor near vertical middle
        if (props.settings.typewriterMode && textareaRef.current) {
          const ta = textareaRef.current;
          const lineH = props.settings.fontSize * 1.65;
          const approxY = (line - 1) * lineH;
          ta.scrollTop = Math.max(0, approxY - ta.clientHeight * 0.42);
        }

        // Inline autocomplete checks
        const linePrefix = text.slice(lastNl + 1, pos);
        const calcAcPos = () => {
          const ta = textareaRef.current;
          const top = Math.max(
            24,
            Math.min(
              320,
              line * props.settings.fontSize * 1.65 - (ta?.scrollTop ?? 0) + 18,
            ),
          );
          const left = Math.max(24, Math.min(340, col * 8));
          setAcPos({ top, left });
        };

        // 1. Slash command `/`
        const slashM = linePrefix.match(/(?:^|\s)(\/[a-z0-9_-]*)$/i);
        if (slashM && props.file.kind === "md") {
          const query = slashM[1].toLowerCase();
          const matches = SLASH_COMMANDS.filter(
            (c) =>
              c.trigger.startsWith(query) ||
              c.label.toLowerCase().includes(query.slice(1)),
          ).slice(0, 8);
          if (matches.length > 0) {
            setAcOptions(
              matches.map((c) => ({
                id: c.id,
                label: `${c.trigger} — ${c.label}`,
                detail: c.description,
                insertText: c.snippet,
                cursorOffset: c.cursorOffset,
                modalAction: c.modalAction,
              })),
            );
            setAcRange({ start: pos - slashM[1].length, end: pos });
            setAcIndex(0);
            calcAcPos();
            return;
          }
        }

        // 2. Emoji shortcode `:word`
        const emojiM = linePrefix.match(/:([a-z0-9_+-]{1,20})$/i);
        if (emojiM && props.settings.enableEmoji && props.file.kind === "md") {
          const q = emojiM[1].toLowerCase();
          const matches = EMOJI_LIST.filter(
            (e) => e.shortcode.includes(q) || e.keywords.includes(q),
          ).slice(0, 8);
          if (matches.length > 0) {
            setAcOptions(
              matches.map((e) => ({
                id: `em-${e.shortcode}`,
                label: `${e.emoji} :${e.shortcode}:`,
                detail: e.category,
                insertText: `:${e.shortcode}: `,
              })),
            );
            setAcRange({ start: pos - emojiM[0].length, end: pos });
            setAcIndex(0);
            calcAcPos();
            return;
          }
        }

        // 3. Wiki link `[[path`
        const wikiM = linePrefix.match(/\[\[([^\]|\n]*)$/);
        if (wikiM) {
          const q = wikiM[1].toLowerCase();
          const matches = props.projectFiles
            .filter((f) => f.kind === "md" && f.path.toLowerCase().includes(q))
            .slice(0, 8);
          if (matches.length > 0) {
            setAcOptions(
              matches.map((f) => ({
                id: `wiki-${f.id}`,
                label: `[[${f.path.replace(/\.md$/i, "")}]]`,
                detail: "Workspace page",
                insertText: `[[${f.path.replace(/\.md$/i, "")}]]`,
              })),
            );
            setAcRange({ start: pos - wikiM[0].length, end: pos });
            setAcIndex(0);
            calcAcPos();
            return;
          }
        }

        // 4. Footnote `[^id`
        const fnM = linePrefix.match(/\[\^([A-Za-z0-9_-]*)$/);
        if (fnM && props.footnoteIds.length > 0) {
          const q = fnM[1].toLowerCase();
          const matches = props.footnoteIds
            .filter((id) => id.toLowerCase().includes(q))
            .slice(0, 8);
          if (matches.length > 0) {
            setAcOptions(
              matches.map((id) => ({
                id: `fn-${id}`,
                label: `[^${id}]`,
                detail: "Existing footnote",
                insertText: `[^${id}]`,
              })),
            );
            setAcRange({ start: pos - fnM[0].length, end: pos });
            setAcIndex(0);
            calcAcPos();
            return;
          }
        }

        setAcOptions([]);
        setAcRange(null);
      },
      [props],
    );

    const applyAutocomplete = (opt: AcOption) => {
      if (!acRange) return;
      const content = props.file.content;
      const before = content.slice(0, acRange.start);
      const after = content.slice(acRange.end);
      setAcOptions([]);
      setAcRange(null);

      if (opt.modalAction) {
        props.onChangeContent(before + after);
        requestAnimationFrame(() => {
          textareaRef.current?.setSelectionRange(acRange.start, acRange.start);
          if (opt.modalAction === "table") props.onOpenTableWizard();
          else if (opt.modalAction === "mermaid") props.onOpenMermaidBuilder();
          else if (opt.modalAction === "math") props.onOpenMathBuilder();
          else if (opt.modalAction === "frontmatter") props.onOpenFrontmatter();
          else if (opt.modalAction === "callout") props.onOpenCalloutBadge();
        });
        return;
      }

      const next = before + opt.insertText + after;
      const nextCursor =
        opt.cursorOffset !== undefined
          ? acRange.start + opt.insertText.length + opt.cursorOffset
          : acRange.start + opt.insertText.length;
      setTextareaSelection(next, nextCursor, nextCursor);
    };

    // Find & Replace matching indices
    const findMatches = useMemo(() => {
      if (!findOpen || !findQuery) return [];
      const results: Array<{ start: number; end: number }> = [];
      try {
        const flags = matchCase ? "g" : "gi";
        const pattern = useRegex ? findQuery : escapeRegex(findQuery);
        const re = new RegExp(pattern, flags);
        let m: RegExpExecArray | null;
        while ((m = re.exec(props.file.content)) !== null) {
          if (m[0].length === 0) break;
          results.push({ start: m.index, end: m.index + m[0].length });
          if (results.length > 2000) break;
        }
      } catch {
        return [];
      }
      return results;
    }, [findOpen, findQuery, matchCase, useRegex, props.file.content]);

    const jumpToMatch = (idx: number) => {
      if (findMatches.length === 0) return;
      const wrapped = ((idx % findMatches.length) + findMatches.length) % findMatches.length;
      setActiveMatchIdx(wrapped);
      const match = findMatches[wrapped];
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(match.start, match.end);
      const lineNum = props.file.content.slice(0, match.start).split("\n").length;
      const lineH = props.settings.fontSize * 1.65;
      ta.scrollTop = Math.max(0, (lineNum - 4) * lineH);
      syncScrollLayers();
    };

    const handleReplaceOne = () => {
      if (findMatches.length === 0) return;
      const clampedIdx = activeMatchIdx % findMatches.length;
      const match = findMatches[clampedIdx];
      const next =
        props.file.content.slice(0, match.start) +
        replaceQuery +
        props.file.content.slice(match.end);
      setTextareaSelection(
        next,
        match.start + replaceQuery.length,
        match.start + replaceQuery.length,
      );
    };

    const handleReplaceAll = () => {
      if (!findQuery) return;
      try {
        const flags = matchCase ? "g" : "gi";
        const pattern = useRegex ? findQuery : escapeRegex(findQuery);
        const re = new RegExp(pattern, flags);
        props.onChangeContent(props.file.content.replace(re, replaceQuery));
      } catch {
        // Ignore invalid regex
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      const mod = e.ctrlKey || e.metaKey;

      // Autocomplete keyboard navigation
      if (acOptions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAcIndex((i) => (i + 1) % acOptions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setAcIndex((i) => (i - 1 + acOptions.length) % acOptions.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          applyAutocomplete(acOptions[acIndex] ?? acOptions[0]);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setAcOptions([]);
          setAcRange(null);
          return;
        }
      }

      // Formatting shortcuts
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        wrapSelectionText("**", "**", "bold text");
        return;
      }
      if (mod && e.key.toLowerCase() === "i") {
        e.preventDefault();
        wrapSelectionText("*", "*", "italic text");
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "x") {
        e.preventDefault();
        wrapSelectionText("~~", "~~", "strikethrough");
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        wrapSelectionText("==", "==", "highlighted");
        return;
      }
      if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        wrapSelectionText("`", "`", "code");
        return;
      }
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const sel = props.file.content.slice(ta.selectionStart, ta.selectionEnd) || "link text";
        const snippet = `[${sel}](https://)`;
        const start = ta.selectionStart;
        const next =
          props.file.content.slice(0, start) +
          snippet +
          props.file.content.slice(ta.selectionEnd);
        setTextareaSelection(next, start + sel.length + 3, start + snippet.length - 1);
        return;
      }
      if (mod && e.altKey && /^[1-6]$/.test(e.key)) {
        e.preventDefault();
        setLineHeadingLevel(Number.parseInt(e.key, 10));
        return;
      }
      if (mod && (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "h")) {
        e.preventDefault();
        setFindOpen(true);
        return;
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        props.onFormat();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        props.onSave();
        return;
      }

      // Smart Enter for lists & blockquotes
      if (e.key === "Enter" && !mod && !e.shiftKey) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start === end) {
          const lineStart = props.file.content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
          const lineText = props.file.content.slice(lineStart, start);

          const taskM = lineText.match(/^(\s*)([-*+]\s+\[[ xX]\]\s+)(.*)$/);
          const ulM = lineText.match(/^(\s*)([-*+]\s+)(.*)$/);
          const olM = lineText.match(/^(\s*)(\d+)([.)]\s+)(.*)$/);
          const quoteM = lineText.match(/^(\s*>+\s?)(.*)$/);

          if (taskM) {
            e.preventDefault();
            if (!taskM[3].trim()) {
              const next =
                props.file.content.slice(0, lineStart) + props.file.content.slice(start);
              setTextareaSelection(next, lineStart);
            } else {
              insertAtCursor(`\n${taskM[1]}- [ ] `);
            }
            return;
          }
          if (ulM) {
            e.preventDefault();
            if (!ulM[3].trim()) {
              const next =
                props.file.content.slice(0, lineStart) + props.file.content.slice(start);
              setTextareaSelection(next, lineStart);
            } else {
              insertAtCursor(`\n${ulM[1]}${ulM[2]}`);
            }
            return;
          }
          if (olM) {
            e.preventDefault();
            if (!olM[4].trim()) {
              const next =
                props.file.content.slice(0, lineStart) + props.file.content.slice(start);
              setTextareaSelection(next, lineStart);
            } else {
              const nextNum = Number.parseInt(olM[2], 10) + 1;
              insertAtCursor(`\n${olM[1]}${nextNum}${olM[3]}`);
            }
            return;
          }
          if (quoteM && quoteM[2].trim()) {
            e.preventDefault();
            insertAtCursor(`\n${quoteM[1]}`);
            return;
          }
        }
      }

      // Smart Tab / Shift+Tab indent
      if (e.key === "Tab") {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const indent = " ".repeat(props.settings.tabSize);
        if (start === end && !e.shiftKey) {
          insertAtCursor(indent);
          return;
        }
        const blockStart =
          props.file.content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const blockEndRaw = props.file.content.indexOf("\n", end);
        const blockEnd = blockEndRaw === -1 ? props.file.content.length : blockEndRaw;
        const block = props.file.content.slice(blockStart, blockEnd);
        const updated = block
          .split("\n")
          .map((l) => {
            if (e.shiftKey) {
              const spaces = l.match(/^ {1,4}/)?.[0].length ?? 0;
              return l.slice(Math.min(spaces, props.settings.tabSize));
            }
            return indent + l;
          })
          .join("\n");
        const next =
          props.file.content.slice(0, blockStart) +
          updated +
          props.file.content.slice(blockEnd);
        setTextareaSelection(next, blockStart, blockStart + updated.length);
        return;
      }

      // Wrap selection on typing wrapper char when selection non-empty
      if (WRAP_CHARS[e.key] && ta.selectionStart !== ta.selectionEnd) {
        e.preventDefault();
        wrapSelectionText(e.key, WRAP_CHARS[e.key], "");
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (!blob) continue;
          e.preventDefault();
          const ext = item.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "png";
          const filename = `pasted-${Date.now()}.${ext}`;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || "");
            if (dataUrl) {
              const savedPath = props.onPasteImage(filename, dataUrl);
              insertAtCursor(`![Pasted image](${savedPath})`);
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
    };

    const lineHeightPx = props.settings.fontSize * 1.65;
    const fontFamilyCls =
      props.settings.editorFontFamily === "sans"
        ? "md-font-sans"
        : props.settings.editorFontFamily === "serif"
          ? "md-font-serif"
          : "md-font-mono";

    return (
      <section className="h-full flex flex-col overflow-hidden bg-[#070815]">
        {/* Open Tabs Strip */}
        <div className="flex items-center justify-between gap-2 px-2 py-1 border-b border-slate-700/60 bg-[#0b0d1e]/95 overflow-x-auto md-scroll select-none">
          <div className="flex items-center gap-1 min-w-0">
            {props.openTabs.map((tabPath) => {
              const active = tabPath === props.file.path;
              const dirty = props.unsavedPaths.has(tabPath);
              const label = tabPath.split("/").pop() ?? tabPath;
              return (
                <div
                  key={tabPath}
                  className={`group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-mono border shrink-0 transition-colors ${
                    active
                      ? "bg-violet-500/20 border-cyan-400/40 text-white"
                      : "border-transparent text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => props.onSelectTab(tabPath)}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={11} className={active ? "text-cyan-300" : "text-slate-500"} />
                    <span>{label}</span>
                    {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                  {props.openTabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => props.onCloseTab(tabPath)}
                      className="p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-white/10 cursor-pointer"
                      title="Close tab"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(props.file.path).catch(() => {});
              setCopiedPath(true);
              setTimeout(() => setCopiedPath(false), 1200);
            }}
            title="Copy file path"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-cyan-300 shrink-0 cursor-pointer"
          >
            {copiedPath ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span className="hidden sm:inline">{props.file.path}</span>
          </button>
        </div>

        {/* Image Preview View when active file is an image */}
        {props.file.kind === "image" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 text-center overflow-y-auto">
            <div className="max-w-lg rounded-2xl border border-slate-700/60 bg-black/40 p-4 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={props.file.content}
                alt={props.file.path}
                className="max-h-72 mx-auto rounded-lg object-contain"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-mono text-white">{props.file.path}</div>
              <div className="text-xs font-mono text-slate-400">
                Image Asset · {formatBytes(props.file.content.length)}
              </div>
              <button
                type="button"
                onClick={() =>
                  props.onInsertIntoMain(`![${props.file.path.split("/").pop()}](${props.file.path})\n`)
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white md-primary-pill cursor-pointer"
              >
                <ImageIcon size={14} />
                <span>Insert into Primary Document</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Markdown Formatting Toolbar */}
            <div className="px-2 py-1 border-b border-slate-800/90 bg-[#090b1b] flex items-center gap-0.5 flex-wrap select-none relative">
              {/* Heading Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setHeadingMenuOpen((v) => !v);
                    setCalloutMenuOpen(false);
                  }}
                  title="Headings (Ctrl+Alt+1..4)"
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs text-slate-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                >
                  <Heading size={13} />
                  <ChevronDown size={10} />
                </button>
                {headingMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 w-32 rounded-lg border border-slate-700 bg-[#0b0d1f] shadow-xl p-1 z-40">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setHeadingMenuOpen(false);
                          setLineHeadingLevel(lvl);
                        }}
                        className="w-full text-left px-2 py-1 rounded text-xs text-slate-200 hover:bg-violet-500/20 cursor-pointer"
                      >
                        Heading {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => wrapSelectionText("**", "**", "bold")}
                title="Bold (Ctrl+B)"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <Bold size={13} />
              </button>
              <button
                type="button"
                onClick={() => wrapSelectionText("*", "*", "italic")}
                title="Italic (Ctrl+I)"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <Italic size={13} />
              </button>
              <button
                type="button"
                onClick={() => wrapSelectionText("~~", "~~", "strikethrough")}
                title="Strikethrough (Ctrl+Shift+X)"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <Strikethrough size={13} />
              </button>
              <button
                type="button"
                onClick={() => wrapSelectionText("==", "==", "highlighted")}
                title="Highlight ==mark== (Ctrl+Shift+H)"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-amber-300 cursor-pointer"
              >
                <Highlighter size={13} />
              </button>

              <span className="w-px h-4 bg-slate-800 mx-0.5" />

              <button
                type="button"
                onClick={() => wrapSelectionText("`", "`", "code")}
                title="Inline Code (Ctrl+E)"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-emerald-300 cursor-pointer"
              >
                <Code size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor("```typescript\n// code\n```\n", -5)}
                title="Fenced Code Block"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-emerald-300 cursor-pointer"
              >
                <FileCode2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => wrapSelectionText("[", "](https://)", "link text")}
                title="Link (Ctrl+K)"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-cyan-300 cursor-pointer"
              >
                <LinkIcon size={13} />
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor("![alt text](https://)", -1)}
                title="Image"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-pink-300 cursor-pointer"
              >
                <ImageIcon size={13} />
              </button>

              <span className="w-px h-4 bg-slate-800 mx-0.5" />

              <button
                type="button"
                onClick={() => prefixSelectedLines("- ")}
                title="Bullet List"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => prefixSelectedLines("1. ")}
                title="Numbered List"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <ListOrdered size={13} />
              </button>
              <button
                type="button"
                onClick={() => prefixSelectedLines("- [ ] ")}
                title="Task Checklist"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-emerald-300 cursor-pointer"
              >
                <CheckSquare size={13} />
              </button>
              <button
                type="button"
                onClick={() => prefixSelectedLines("> ")}
                title="Blockquote"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              >
                <Quote size={13} />
              </button>

              {/* Callout Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCalloutMenuOpen((v) => !v);
                    setHeadingMenuOpen(false);
                  }}
                  title="Insert Callout Block"
                  className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-xs text-slate-300 hover:bg-white/[0.08] hover:text-amber-300 cursor-pointer"
                >
                  <AlertTriangle size={12} />
                  <ChevronDown size={10} />
                </button>
                {calloutMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 w-40 rounded-lg border border-slate-700 bg-[#0b0d1f] shadow-xl p-1 z-40">
                    {["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION", "ABSTRACT"].map(
                      (kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => {
                            setCalloutMenuOpen(false);
                            insertAtCursor(
                              `> [!${kind}] ${kind.charAt(0) + kind.slice(1).toLowerCase()}\n> Callout details.\n\n`,
                            );
                          }}
                          className="w-full text-left px-2 py-1 rounded text-xs font-mono text-slate-200 hover:bg-violet-500/20 cursor-pointer"
                        >
                          [!{kind}]
                        </button>
                      ),
                    )}
                    <div className="my-1 border-t border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setCalloutMenuOpen(false);
                        props.onOpenCalloutBadge();
                      }}
                      className="w-full text-left px-2 py-1 rounded text-xs text-cyan-300 hover:bg-cyan-500/15 cursor-pointer"
                    >
                      Custom Wizard…
                    </button>
                  </div>
                )}
              </div>

              <span className="w-px h-4 bg-slate-800 mx-0.5" />

              <button
                type="button"
                onClick={props.onOpenTableWizard}
                title="Visual Table Builder"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-cyan-300 cursor-pointer"
              >
                <Table size={13} />
              </button>
              <button
                type="button"
                onClick={props.onOpenMathBuilder}
                title="KaTeX Math Builder"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-pink-300 cursor-pointer"
              >
                <Sigma size={13} />
              </button>
              <button
                type="button"
                onClick={props.onOpenMermaidBuilder}
                title="Mermaid & Chart Builder"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-emerald-300 cursor-pointer"
              >
                <GitBranch size={13} />
              </button>
              <button
                type="button"
                onClick={props.onOpenFrontmatter}
                title="Frontmatter Metadata Editor"
                className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-violet-300 cursor-pointer"
              >
                <Tag size={13} />
              </button>

              <div className="ml-auto flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setFindOpen((v) => !v)}
                  title="Find & Replace (Ctrl+F)"
                  className={`p-1.5 rounded-md cursor-pointer ${
                    findOpen
                      ? "bg-cyan-500/20 text-cyan-200"
                      : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  <Search size={13} />
                </button>
                <button
                  type="button"
                  onClick={props.onFormat}
                  title="Prettify Markdown & Tables (Alt+Shift+F)"
                  className="p-1.5 rounded-md text-slate-300 hover:bg-white/[0.08] hover:text-cyan-300 cursor-pointer"
                >
                  <Sparkles size={13} />
                </button>
              </div>
            </div>

            {/* Find & Replace Drawer */}
            {findOpen && (
              <div className="px-3 py-2 border-b border-slate-800 bg-[#0b0e20] flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 flex-1 min-w-[180px]">
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
                    className="flex-1 px-2 py-1 rounded bg-black/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400/60"
                  />
                  <button
                    type="button"
                    onClick={() => setMatchCase((v) => !v)}
                    title="Match Case"
                    className={`px-1.5 py-1 rounded border font-mono text-[10px] cursor-pointer ${
                      matchCase
                        ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                        : "border-slate-700 text-slate-400"
                    }`}
                  >
                    Aa
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseRegex((v) => !v)}
                    title="Regular Expression"
                    className={`px-1.5 py-1 rounded border font-mono text-[10px] cursor-pointer ${
                      useRegex
                        ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                        : "border-slate-700 text-slate-400"
                    }`}
                  >
                    .*
                  </button>
                  <span className="font-mono text-[11px] text-slate-400 px-1">
                    {findMatches.length > 0
                      ? `${(activeMatchIdx % findMatches.length) + 1}/${findMatches.length}`
                      : "0"}
                  </span>
                  <button
                    type="button"
                    onClick={() => jumpToMatch(activeMatchIdx - 1)}
                    className="p-1 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => jumpToMatch(activeMatchIdx + 1)}
                    className="p-1 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-1 flex-1 min-w-[180px]">
                  <input
                    type="text"
                    placeholder="Replace with…"
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    className="flex-1 px-2 py-1 rounded bg-black/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400/60"
                  />
                  <button
                    type="button"
                    onClick={handleReplaceOne}
                    className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Replace size={11} /> One
                  </button>
                  <button
                    type="button"
                    onClick={handleReplaceAll}
                    className="px-2 py-1 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFindOpen(false)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Main Editor Surface */}
            <div
              className={`md-editor-surface md-theme-${props.settings.editorTheme} ${
                props.settings.focusMode ? "md-focus-dim" : ""
              } flex-1 flex overflow-hidden relative`}
            >
              {/* Line Numbers Gutter */}
              {props.settings.lineNumbers && (
                <div
                  ref={gutterRef}
                  aria-hidden="true"
                  className="shrink-0 overflow-hidden select-none border-r border-slate-700/35 text-right font-mono text-slate-500/75"
                  style={{
                    backgroundColor: "var(--md-ed-gutter)",
                    paddingTop: "16px",
                    paddingBottom: "48px",
                    width: lines.length >= 1000 ? "56px" : "46px",
                    fontSize: `${Math.max(11, props.settings.fontSize - 1)}px`,
                    lineHeight: `${lineHeightPx}px`,
                  }}
                >
                  {lines.map((_l, idx) => {
                    const lineNo = idx + 1;
                    const diag = diagByLine[lineNo];
                    const h = props.settings.wordWrap
                      ? wrappedHeights[idx] || lineHeightPx
                      : lineHeightPx;
                    return (
                      <div
                        key={lineNo}
                        title={diag ? `${diag.rule}: ${diag.message}` : undefined}
                        style={{ height: `${h}px`, lineHeight: `${lineHeightPx}px` }}
                        className={`pr-2 pl-1 flex items-start justify-end gap-1 ${
                          lineNo === activeLine ? "text-cyan-300 font-semibold" : ""
                        }`}
                      >
                        {diag && (
                          <span
                            className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                              diag.severity === "error"
                                ? "bg-rose-400"
                                : diag.severity === "warning"
                                  ? "bg-amber-400"
                                  : "bg-cyan-400"
                            }`}
                          />
                        )}
                        <span>{lineNo}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Layered <pre> + <textarea> */}
              <div className="relative flex-1 overflow-hidden">
                {/* Active line indicator bar */}
                {!props.settings.wordWrap && (
                  <div
                    className="md-active-line-bar"
                    style={{
                      top: `${16 + (activeLine - 1) * lineHeightPx - scrollTop}px`,
                      height: `${lineHeightPx}px`,
                    }}
                  />
                )}

                {/* Hidden Mirror for Wrapped Gutter Heights */}
                {props.settings.wordWrap && (
                  <div
                    ref={mirrorRef}
                    aria-hidden="true"
                    className={`md-editor-layer ${fontFamilyCls} pointer-events-none absolute inset-x-0 top-0 opacity-0 -z-10`}
                    style={{
                      fontSize: `${props.settings.fontSize}px`,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                  >
                    {lines.map((ln, idx) => (
                      <div key={idx}>{ln || " "}</div>
                    ))}
                  </div>
                )}

                {/* Highlighted Pre Overlay */}
                <pre
                  ref={preRef}
                  aria-hidden="true"
                  className={`md-editor-layer md-editor-pre ${fontFamilyCls} absolute inset-0 overflow-hidden m-0`}
                  style={{
                    fontSize: `${props.settings.fontSize}px`,
                    lineHeight: 1.65,
                    whiteSpace: props.settings.wordWrap ? "pre-wrap" : "pre",
                    wordBreak: props.settings.wordWrap ? "break-word" : "normal",
                    paddingBottom: props.settings.typewriterMode ? "45vh" : "48px",
                  }}
                  dangerouslySetInnerHTML={{ __html: `${highlightedHtml}\n` }}
                />

                {/* Editable Textarea */}
                <textarea
                  ref={textareaRef}
                  value={props.file.content}
                  spellCheck={props.settings.spellCheck}
                  onChange={(e) => {
                    props.onChangeContent(e.target.value);
                    updateCaretMetrics(e.target.value, e.target.selectionStart ?? 0);
                  }}
                  onClick={(e) =>
                    updateCaretMetrics(
                      e.currentTarget.value,
                      e.currentTarget.selectionStart ?? 0,
                    )
                  }
                  onKeyUp={(e) =>
                    updateCaretMetrics(
                      e.currentTarget.value,
                      e.currentTarget.selectionStart ?? 0,
                    )
                  }
                  onScroll={syncScrollLayers}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  aria-label={`Markdown editor for ${props.file.path}`}
                  className={`md-editor-layer md-editor-textarea ${fontFamilyCls} absolute inset-0 w-full h-full md-scroll`}
                  style={{
                    fontSize: `${props.settings.fontSize}px`,
                    lineHeight: 1.65,
                    whiteSpace: props.settings.wordWrap ? "pre-wrap" : "pre",
                    wordBreak: props.settings.wordWrap ? "break-word" : "normal",
                    overflowX: props.settings.wordWrap ? "hidden" : "auto",
                    paddingBottom: props.settings.typewriterMode ? "45vh" : "48px",
                  }}
                />

                {/* Inline Autocomplete Popup */}
                {acOptions.length > 0 && (
                  <div
                    style={{ top: `${acPos.top}px`, left: `${acPos.left}px` }}
                    className="absolute z-40 w-72 max-w-[90%] rounded-xl border border-cyan-400/40 bg-[#0b0e22]/98 backdrop-blur-xl shadow-2xl p-1.5 text-xs"
                  >
                    {acOptions.map((opt, idx) => (
                      <button
                        key={opt.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyAutocomplete(opt);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex flex-col cursor-pointer ${
                          idx === acIndex
                            ? "bg-violet-500/30 text-white"
                            : "text-slate-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span className="font-mono text-[11.5px] font-semibold">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-400">{opt.detail}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live KaTeX Math Preview Bar */}
            {liveFormulaHtml && (
              <div className="md-live-math-bar px-3 py-1.5 flex items-center gap-3 overflow-x-auto text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-pink-300 shrink-0">
                  Live Math
                </span>
                <div
                  className="text-slate-100"
                  dangerouslySetInnerHTML={{ __html: liveFormulaHtml }}
                />
              </div>
            )}
          </>
        )}
      </section>
    );
  },
);
