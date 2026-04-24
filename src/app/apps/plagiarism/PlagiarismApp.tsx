"use client";

import { useState, useRef } from "react";
import { InputPanel } from "./InputPanel";
import { ResultsPanel } from "./ResultsPanel";
import { performScan, ScanReport } from "./lib/scanner";

type Phase = "idle" | "scanning" | "done" | "cancelled";

export function PlagiarismApp() {
  const [text, setText] = useState("");
  const [excludeUrls, setExcludeUrls] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  async function handleScan() {
    const wc = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
    if (wc < 10) {
      setError("Please enter at least 10 words.");
      return;
    }
    setError(null);
    setReport(null);
    setProgress(0);
    setProgressMessage("Initialising scan…");
    setPhase("scanning");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await performScan(
        text,
        excludeUrls,
        controller.signal,
        (pct, msg) => {
          setProgress(pct);
          setProgressMessage(msg);
        }
      );

      if (!controller.signal.aborted) {
        setReport(result);
        setPhase("done");
      }
    } catch (err) {
      if (
        (err as DOMException).name === "AbortError" ||
        (err as Error).message === "User Cancelled"
      ) {
        setPhase("cancelled");
      } else {
        setError(
          "Scan failed. Please ensure you have an internet connection and try again."
        );
        setPhase("idle");
      }
    } finally {
      abortControllerRef.current = null;
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-xl border border-crimson/30 bg-crimson/8 text-crimson text-sm">
          {error}
        </div>
      )}

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <InputPanel
          text={text}
          excludeUrls={excludeUrls}
          phase={phase}
          onTextChange={setText}
          onExcludeChange={setExcludeUrls}
          onScan={handleScan}
          onStop={handleStop}
          onError={setError}
        />
        <ResultsPanel
          phase={phase}
          progress={progress}
          progressMessage={progressMessage}
          report={report}
        />
      </div>
    </div>
  );
}
