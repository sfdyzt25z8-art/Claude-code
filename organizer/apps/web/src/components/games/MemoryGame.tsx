"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const ICONS = ["🌟", "🚀", "🎯", "📚", "🎨", "🧠", "⚡", "🍀"];

interface CardState {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(): CardState[] {
  const pairs = [...ICONS, ...ICONS];
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j]!, pairs[i]!];
  }
  return pairs.map((icon, id) => ({ id, icon, flipped: false, matched: false }));
}

export function MemoryGame({ onComplete }: { onComplete?: (score: number, elapsedSeconds: number) => void }) {
  const [deck, setDeck] = useState<CardState[]>(() => buildDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime, finished]);

  const allMatched = useMemo(() => deck.every((c) => c.matched), [deck]);

  useEffect(() => {
    if (allMatched && !finished) {
      setFinished(true);
      const score = Math.max(10, 1000 - moves * 20 - elapsed * 2);
      onComplete?.(score, elapsed);
    }
  }, [allMatched, finished, moves, elapsed, onComplete]);

  const handleFlip = (id: number) => {
    if (finished || selected.length === 2) return;
    const card = deck.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const nextDeck = deck.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setDeck(nextDeck);
    const nextSelected = [...selected, id];
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = nextSelected;
      const first = nextDeck.find((c) => c.id === firstId)!;
      const second = nextDeck.find((c) => c.id === secondId)!;
      if (first.icon === second.icon) {
        setTimeout(() => {
          setDeck((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, matched: true } : c)));
          setSelected([]);
        }, 350);
      } else {
        setTimeout(() => {
          setDeck((prev) => prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c)));
          setSelected([]);
        }, 700);
      }
    }
  };

  const reset = () => {
    setDeck(buildDeck());
    setSelected([]);
    setMoves(0);
    setStartTime(Date.now());
    setElapsed(0);
    setFinished(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Badge tone="neutral">{moves} moves</Badge>
          <Badge tone="accent">{elapsed}s</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Restart
        </Button>
      </div>

      {finished && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500">
          <Sparkles className="h-4 w-4" /> Solved in {moves} moves and {elapsed}s!
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {deck.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            aria-label={card.flipped || card.matched ? `Card showing ${card.icon}` : "Hidden card"}
            className={cn(
              "flex aspect-square items-center justify-center rounded-xl border text-2xl transition-all",
              card.matched ? "opacity-50" : ""
            )}
            style={{ borderColor: "var(--color-border)" }}
          >
            <motion.div
              initial={false}
              animate={{ rotateY: card.flipped || card.matched ? 0 : 180 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full items-center justify-center"
            >
              {card.flipped || card.matched ? card.icon : <span className="text-[var(--color-accent)]">?</span>}
            </motion.div>
          </button>
        ))}
      </div>
    </div>
  );
}
