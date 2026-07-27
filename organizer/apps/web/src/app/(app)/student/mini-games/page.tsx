"use client";

import { useState } from "react";
import { Brain, Grid3x3, Eye, Puzzle, Languages, Sigma, Atom, Trophy } from "lucide-react";
import { MINI_GAMES, type MiniGameKey, type MiniGameScore } from "@organizer/shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MemoryGame } from "@/components/games/MemoryGame";
import { Sudoku } from "@/components/games/Sudoku";
import { useFetch } from "@/lib/hooks";
import { apiPost } from "@/lib/api";
import { formatDate, titleCase } from "@/lib/utils";

const GAME_META: Record<MiniGameKey, { title: string; icon: typeof Brain; playable: boolean; description: string }> = {
  memory_challenge: { title: "Memory Challenge", icon: Brain, playable: true, description: "Flip cards and match pairs as fast as you can." },
  sudoku: { title: "Sudoku", icon: Grid3x3, playable: true, description: "Classic logic puzzle — fill the grid, no repeats." },
  focus_challenge: { title: "Focus Challenge", icon: Eye, playable: false, description: "A concentration reaction-time game." },
  logic_puzzles: { title: "Logic Puzzles", icon: Puzzle, playable: false, description: "Bite-sized logic brainteasers." },
  vocabulary_games: { title: "Vocabulary Games", icon: Languages, playable: false, description: "Grow your word bank with playful rounds." },
  math_battle: { title: "Math Battle", icon: Sigma, playable: false, description: "Fast-paced arithmetic duels." },
  science_challenge: { title: "Science Challenge", icon: Atom, playable: false, description: "Quick-fire science trivia." },
};

export default function MiniGamesPage() {
  const { data: scores, loading, refetch } = useFetch<MiniGameScore[]>("/api/student/mini-game-scores");
  const [openGame, setOpenGame] = useState<MiniGameKey | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const recordScore = async (game: MiniGameKey, score: number) => {
    setLastScore(score);
    try {
      await apiPost<MiniGameScore>("/api/student/mini-game-scores", { game, score });
      refetch();
    } catch {
      // score still shown locally even if sync fails
    }
  };

  const bestByGame = new Map<string, number>();
  for (const s of scores ?? []) {
    bestByGame.set(s.game, Math.max(bestByGame.get(s.game) ?? 0, s.score));
  }

  return (
    <div>
      <PageHeader title="Mini-Games" subtitle="Take a brain break — sharpen focus and memory." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MINI_GAMES.map((game) => {
          const meta = GAME_META[game];
          const Icon = meta.icon;
          const best = bestByGame.get(game);
          return (
            <GlassCard
              key={game}
              hoverable={meta.playable}
              onClick={() => meta.playable && setOpenGame(game)}
              className={meta.playable ? "" : "opacity-80"}
            >
              <div className="mb-3 flex items-start justify-between">
                <Icon className="h-6 w-6 text-[var(--color-accent)]" />
                {!meta.playable && <Badge tone="neutral">Coming soon</Badge>}
                {meta.playable && best !== undefined && (
                  <Badge tone="accent">
                    <Trophy className="h-3 w-3" /> {best}
                  </Badge>
                )}
              </div>
              <p className="font-semibold text-[var(--color-text-primary)]">{meta.title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{meta.description}</p>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="mt-6">
        <h2 className="mb-3 font-semibold text-[var(--color-text-primary)]">Recent scores</h2>
        {loading ? (
          <LoadingSpinner />
        ) : (scores ?? []).length === 0 ? (
          <EmptyState title="No scores yet" description="Play a game above to log your first score." icon={Trophy} />
        ) : (
          <ul className="flex flex-col gap-2">
            {(scores ?? [])
              .slice()
              .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
              .slice(0, 8)
              .map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-primary)]">{GAME_META[s.game]?.title ?? titleCase(s.game)}</span>
                  <span className="text-[var(--color-text-secondary)]">
                    {s.score} pts · {formatDate(s.playedAt)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </GlassCard>

      <Modal open={!!openGame} onClose={() => setOpenGame(null)} title={openGame ? GAME_META[openGame].title : undefined} className="max-w-2xl">
        {openGame === "memory_challenge" && (
          <MemoryGame onComplete={(score) => recordScore("memory_challenge", score)} />
        )}
        {openGame === "sudoku" && <Sudoku onComplete={(score) => recordScore("sudoku", score)} />}
        {lastScore !== null && openGame && (
          <p className="mt-4 text-center text-sm font-medium text-emerald-500">Score {lastScore} saved to your profile!</p>
        )}
      </Modal>
    </div>
  );
}
