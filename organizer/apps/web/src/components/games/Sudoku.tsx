"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type Grid = number[][]; // 0 = empty

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function isSafe(grid: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row]![i] === num || grid[i]![col] === num) return false;
  }
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[startRow + i]![startCol + j] === num) return false;
    }
  }
  return true;
}

function fillGrid(grid: Grid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row]![col] === 0) {
        for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isSafe(grid, row, col, num)) {
            grid[row]![col] = num;
            if (fillGrid(grid)) return true;
            grid[row]![col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generatePuzzle(cluesToKeep = 34): { puzzle: Grid; solution: Grid } {
  const solution: Grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(solution);
  const puzzle = solution.map((row) => [...row]);
  const cellsToRemove = 81 - cluesToKeep;
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i)).slice(0, cellsToRemove);
  for (const pos of positions) {
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    puzzle[row]![col] = 0;
  }
  return { puzzle, solution };
}

export function Sudoku({ onComplete }: { onComplete?: (score: number) => void }) {
  const [{ puzzle, solution }, setGame] = useState(() => generatePuzzle());
  const [board, setBoard] = useState<Grid>(() => puzzle.map((row) => [...row]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);

  const fixedCells = useMemo(() => new Set(puzzle.flatMap((row, r) => row.map((v, c) => (v !== 0 ? `${r}-${c}` : null)))), [puzzle]);

  const setNumber = (num: number) => {
    if (!selected || solved) return;
    const [row, col] = selected;
    if (fixedCells.has(`${row}-${col}`)) return;
    const next = board.map((r) => [...r]);
    next[row]![col] = num;
    setBoard(next);

    if (num !== 0 && num !== solution[row]![col]) {
      setMistakes((m) => m + 1);
    }

    const complete = next.every((r, ri) => r.every((v, ci) => v === solution[ri]![ci]));
    if (complete) {
      setSolved(true);
      const score = Math.max(50, 1000 - mistakes * 50);
      onComplete?.(score);
    }
  };

  const reset = () => {
    const next = generatePuzzle();
    setGame(next);
    setBoard(next.puzzle.map((row) => [...row]));
    setSelected(null);
    setMistakes(0);
    setSolved(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Badge tone={mistakes > 3 ? "danger" : "neutral"}>{mistakes} mistakes</Badge>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> New puzzle
        </Button>
      </div>

      {solved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500">
          <CheckCircle2 className="h-4 w-4" /> Solved with {mistakes} mistakes!
        </div>
      )}

      <div className="mx-auto grid w-full max-w-sm grid-cols-9 gap-0.5 rounded-xl border p-1" style={{ borderColor: "var(--color-border)" }}>
        {board.map((row, r) =>
          row.map((val, c) => {
            const isFixed = fixedCells.has(`${r}-${c}`);
            const isSelected = selected?.[0] === r && selected?.[1] === c;
            const wrong = val !== 0 && val !== solution[r]![c];
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => !isFixed && !solved && setSelected([r, c])}
                className={cn(
                  "flex aspect-square items-center justify-center text-sm font-medium",
                  isFixed ? "text-[var(--color-text-primary)]" : wrong ? "text-red-500" : "text-[var(--color-accent)]",
                  isSelected && "ring-2 ring-[var(--color-accent)]",
                  c % 3 === 2 && c !== 8 ? "border-r-2" : "border-r",
                  r % 3 === 2 && r !== 8 ? "border-b-2" : "border-b"
                )}
                style={{ borderColor: "var(--color-border)", background: isFixed ? "var(--color-surface-glass)" : "transparent" }}
                aria-label={`Row ${r + 1} Column ${c + 1}${val ? `, value ${val}` : ", empty"}`}
              >
                {val !== 0 ? val : ""}
              </button>
            );
          })
        )}
      </div>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-5 gap-2 sm:grid-cols-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
          <button
            key={n}
            onClick={() => setNumber(n)}
            className="rounded-lg border py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-glass)]"
            style={{ borderColor: "var(--color-border)" }}
          >
            {n === 0 ? "⌫" : n}
          </button>
        ))}
      </div>
    </div>
  );
}
