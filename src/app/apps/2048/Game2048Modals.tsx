"use client";

import { Award, BarChart3, Keyboard, Sparkles, Trophy, X } from "lucide-react";
import { ACHIEVEMENTS, recordKey } from "./lib/storage";
import type {
  AchievementId,
  BoardRecord,
  CareerStats,
  DailyRecord,
  GameVariant,
  GridSize,
} from "./lib/types";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  career: CareerStats;
  records: Record<string, BoardRecord>;
  dailyRecords: Record<string, DailyRecord>;
  achievements: AchievementId[];
  onResetStats: () => void;
}

const VARIANT_LABELS: { id: GameVariant; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "fibonacci", label: "Fibonacci" },
  { id: "zen", label: "Zen" },
  { id: "singularity", label: "Singularity" },
];

const GRID_SIZES: GridSize[] = [3, 4, 5, 6];

function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function StatsModal({
  open,
  onClose,
  career,
  records,
  dailyRecords,
  achievements,
  onResetStats,
}: StatsModalProps) {
  if (!open) return null;

  const ownedSet = new Set(achievements);
  const dailyList = Object.values(dailyRecords).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Career statistics and achievements"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-background/95 text-foreground border border-foreground/15 shadow-2xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-quantum/15 border border-quantum/30 flex items-center justify-center text-quantum">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Career Telemetry & Trophies</h3>
              <p className="text-xs text-foreground/55">
                {achievements.length} / {ACHIEVEMENTS.length} achievements unlocked
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close statistics"
            className="p-2 rounded-xl border border-foreground/12 hover:bg-foreground/8 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Career Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Games Played", value: career.totalGames.toLocaleString() },
            { label: "Total Wins", value: career.totalWins.toLocaleString() },
            { label: "Peak Tile", value: career.highestTileEver ? career.highestTileEver.toLocaleString() : "—" },
            { label: "Longest Combo", value: `${career.longestCombo}×` },
            { label: "Total Moves", value: career.totalMoves.toLocaleString() },
            { label: "Total Merges", value: career.totalMerges.toLocaleString() },
            { label: "Lifetime Score", value: career.totalScore.toLocaleString() },
            { label: "Daily Wins", value: career.dailyCompletedCount.toLocaleString() },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/50">
                {stat.label}
              </div>
              <div className="text-lg font-bold font-mono mt-0.5 tabular-nums">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/60 mb-3">
            <Award size={14} className="text-amber-400" />
            Achievements
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = ownedSet.has(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    unlocked
                      ? "border-amber-400/40 bg-amber-500/10"
                      : "border-foreground/10 bg-foreground/[0.02] opacity-55"
                  }`}
                >
                  <div className="text-xl leading-none mt-0.5">{ach.badge}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span>{ach.title}</span>
                      {unlocked && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/60 leading-snug mt-0.5">
                      {ach.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mode & Grid Best Records */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/60 mb-3">
            <Trophy size={14} className="text-quantum" />
            High Scores by Mode & Grid
          </div>
          <div className="overflow-x-auto rounded-xl border border-foreground/10">
            <table className="w-full text-xs text-left">
              <thead className="bg-foreground/[0.04] text-foreground/60 font-mono uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">Variant</th>
                  <th className="px-3 py-2">Grid</th>
                  <th className="px-3 py-2">Best Score</th>
                  <th className="px-3 py-2">Pure Score</th>
                  <th className="px-3 py-2">Best Tile</th>
                  <th className="px-3 py-2">Wins</th>
                  <th className="px-3 py-2">Fastest Win</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/8">
                {VARIANT_LABELS.flatMap((v) =>
                  GRID_SIZES.map((g) => {
                    const rec = records[recordKey(v.id, g)];
                    if (!rec || rec.gamesPlayed === 0) return null;
                    return (
                      <tr key={recordKey(v.id, g)} className="hover:bg-foreground/[0.02]">
                        <td className="px-3 py-2 font-medium">{v.label}</td>
                        <td className="px-3 py-2 font-mono">
                          {g}×{g}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold">
                          {rec.bestScore.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-foreground/70">
                          {rec.bestPureScore > 0
                            ? rec.bestPureScore.toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono">{rec.bestTile}</td>
                        <td className="px-3 py-2 font-mono">
                          {rec.wins}/{rec.gamesPlayed}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {formatDuration(rec.bestTimeSeconds)}
                        </td>
                      </tr>
                    );
                  })
                ).filter(Boolean)}
                {Object.values(records).every((r) => r.gamesPlayed === 0) && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-foreground/45"
                    >
                      Make your first move to start recording mode high scores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Daily Challenges */}
        {dailyList.length > 0 && (
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-foreground/60 mb-2">
              Recent Daily Challenges
            </div>
            <div className="flex flex-wrap gap-2">
              {dailyList.slice(0, 8).map((d) => (
                <div
                  key={d.date}
                  className="px-3 py-2 rounded-xl border border-foreground/10 bg-foreground/[0.03] text-xs font-mono"
                >
                  <span className="font-semibold">{d.date}</span> ·{" "}
                  <span>{d.bestScore.toLocaleString()} pts</span> ·{" "}
                  <span className={d.won ? "text-emerald-500" : "text-foreground/60"}>
                    {d.won ? `Won (${d.bestTile})` : `Peak ${d.bestTile}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-foreground/10">
          <button
            type="button"
            onClick={onResetStats}
            className="text-xs font-mono text-rose-500 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Clear All Saved Stats
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-quantum/15 border border-quantum/35 text-quantum text-xs font-semibold hover:bg-quantum/25 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="How to play and keyboard shortcuts"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-background/95 text-foreground border border-foreground/15 shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-nebula/15 border border-nebula/35 flex items-center justify-center text-nebula-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Modes, Rules & Shortcuts</h3>
              <p className="text-xs text-foreground/55">
                Master every variant and tactical tool
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            className="p-2 rounded-xl border border-foreground/12 hover:bg-foreground/8 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Game Variants */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-mono uppercase tracking-widest text-foreground/60">
            Game Variants
          </h4>
          <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
            {[
              {
                name: "Classic",
                desc: "Equal tiles merge (2+2=4). Reach 2048 on 4×4 or scale from 3×3 to 6×6.",
              },
              {
                name: "Fibonacci",
                desc: "Adjacent Fibonacci numbers merge (1+1=2, 1+2=3, 2+3=5, 3+5=8…). Target 2584 on 4×4!",
              },
              {
                name: "Zen",
                desc: "Relaxed sandbox with unlimited undos and extra Swap & Smash charges.",
              },
              {
                name: "Singularity",
                desc: "Immovable gravitational cores split slide lanes — route merges around them.",
              },
            ].map((v) => (
              <div
                key={v.name}
                className="p-3 rounded-xl border border-foreground/10 bg-foreground/[0.03]"
              >
                <div className="font-semibold text-foreground">{v.name}</div>
                <p className="text-foreground/65 mt-1 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Power-ups */}
        <div className="space-y-2 text-xs">
          <h4 className="text-xs font-mono uppercase tracking-widest text-foreground/60">
            Tactical Power-Ups & Purist Mode
          </h4>
          <p className="text-foreground/70 leading-relaxed">
            Earn extra <strong className="text-foreground">Swap</strong> and{" "}
            <strong className="text-foreground">Smash</strong> charges when you
            reach milestones at 512 and beyond. Runs without Undo, Swap, Smash,
            Hints, or Auto-AI qualify as a{" "}
            <strong className="text-cyan-500">Pure Run</strong>. Daily 4×4
            Challenges share the exact same deterministic spawn sequence worldwide
            with zero assists.
          </p>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-foreground/60">
            <Keyboard size={14} />
            Keyboard Shortcuts
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { keys: "Arrow Keys / WASD", action: "Slide all tiles" },
              { keys: "Z or Ctrl+Z", action: "Undo last move" },
              { keys: "H", action: "Show Expectimax AI hint" },
              { keys: "R", action: "Start / confirm new game" },
              { keys: "M", action: "Mute / unmute Web Audio SFX" },
              { keys: "Esc", action: "Cancel power-up / stop AI" },
            ].map((item) => (
              <div
                key={item.keys}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-foreground/10 bg-foreground/[0.03]"
              >
                <kbd className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-foreground/10">
                  {item.keys}
                </kbd>
                <span className="text-foreground/70 text-right">{item.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-quantum/15 border border-quantum/35 text-quantum text-xs font-semibold hover:bg-quantum/25 transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
