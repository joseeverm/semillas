import { useMemo, useState } from "react";
import type { MatchingQuestion as MatchingQuestionData } from "../../types/content";
import type { QuestionProps } from "./QuestionProps";
import { shuffle } from "../../lib/shuffle";
import { optionStyles } from "./optionStyles";

type Side = "left" | "right";

export default function MatchingQuestion({
  question,
  checked,
  onResult,
}: QuestionProps<MatchingQuestionData>) {
  // Left column keeps content order; right column is shuffled once.
  // rightOrder[displayRow] = index of the pair whose `right` text shows there.
  const rightOrder = useMemo(
    () => shuffle(question.pairs.map((_, i) => i)),
    [question.pairs],
  );
  const [selected, setSelected] = useState<{ side: Side; row: number } | null>(
    null,
  );
  // matches[leftRow] = display row chosen in the right column.
  const [matches, setMatches] = useState<(number | null)[]>(() =>
    Array(question.pairs.length).fill(null),
  );

  function report(next: (number | null)[]) {
    if (next.some((m) => m === null)) {
      onResult(null);
      return;
    }
    const correct = next.every(
      (rightRow, leftRow) => rightOrder[rightRow as number] === leftRow,
    );
    onResult(correct);
  }

  function isLeftMatched(row: number) {
    return matches[row] !== null;
  }
  function isRightMatched(row: number) {
    return matches.includes(row);
  }

  function unmatchByLeft(leftRow: number) {
    const next = [...matches];
    next[leftRow] = null;
    setMatches(next);
    report(next);
  }

  function handleTap(side: Side, row: number) {
    if (checked) return;
    // Tapping a matched item undoes its pair.
    if (side === "left" && isLeftMatched(row)) {
      unmatchByLeft(row);
      setSelected(null);
      return;
    }
    if (side === "right" && isRightMatched(row)) {
      unmatchByLeft(matches.indexOf(row));
      setSelected(null);
      return;
    }
    if (selected === null || selected.side === side) {
      setSelected(selected?.row === row && selected.side === side ? null : { side, row });
      return;
    }
    // One item per side: form the pair.
    const leftRow = side === "left" ? row : selected.row;
    const rightRow = side === "right" ? row : selected.row;
    const next = [...matches];
    next[leftRow] = rightRow;
    setMatches(next);
    setSelected(null);
    report(next);
  }

  function styleFor(side: Side, row: number): string {
    const matched = side === "left" ? isLeftMatched(row) : isRightMatched(row);
    const isSelected = selected?.side === side && selected.row === row;
    if (checked && matched) {
      const leftRow = side === "left" ? row : matches.indexOf(row);
      const pairCorrect = rightOrder[matches[leftRow] as number] === leftRow;
      return pairCorrect ? optionStyles.correct : optionStyles.wrong;
    }
    if (matched) return optionStyles.selected;
    if (isSelected)
      return "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    return `active:scale-[0.97] ${optionStyles.idle}`;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {question.pairs.map((pair, row) => (
          <button
            key={row}
            type="button"
            onClick={() => handleTap("left", row)}
            disabled={checked}
            className={`min-h-16 rounded-2xl border-2 px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-150 ${styleFor("left", row)}`}
          >
            {pair.left}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {rightOrder.map((pairIndex, row) => (
          <button
            key={row}
            type="button"
            onClick={() => handleTap("right", row)}
            disabled={checked}
            className={`min-h-16 rounded-2xl border-2 px-3 py-2 text-sm font-medium shadow-sm transition-all duration-150 ${styleFor("right", row)}`}
          >
            {question.pairs[pairIndex].right}
          </button>
        ))}
      </div>
    </div>
  );
}
