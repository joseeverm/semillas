import { useMemo, useState } from "react";
import type { MatchingQuestion as MatchingQuestionData } from "../../types/content";
import type { QuestionProps } from "./QuestionProps";
import { shuffle } from "../../lib/shuffle";
import { matchPairStyles, optionStyles } from "./optionStyles";

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

  /** Left row of the formed pair this button belongs to, or null if unmatched. */
  function pairOf(side: Side, row: number): number | null {
    if (side === "left") return isLeftMatched(row) ? row : null;
    const leftRow = matches.indexOf(row);
    return leftRow === -1 ? null : leftRow;
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
    const pair = pairOf(side, row);
    const isSelected = selected?.side === side && selected.row === row;
    if (checked && pair !== null) {
      const pairCorrect = rightOrder[matches[pair] as number] === pair;
      return pairCorrect ? optionStyles.correct : optionStyles.wrong;
    }
    // Both halves of a pair share the same tint, so the link is visible.
    if (pair !== null) return matchPairStyles[pair % matchPairStyles.length].option;
    if (isSelected)
      return "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    return `active:scale-[0.97] ${optionStyles.idle}`;
  }

  /**
   * Numbered token shared by both halves of a pair; empty slot while unmatched.
   * Decorative (`aria-hidden`) so each button's accessible name stays its text.
   */
  function badgeFor(side: Side, row: number) {
    const pair = pairOf(side, row);
    if (pair === null)
      return (
        <span
          aria-hidden
          className="size-6 shrink-0 rounded-full border-2 border-dashed border-current opacity-30"
        />
      );
    return (
      <span
        aria-hidden
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${matchPairStyles[pair % matchPairStyles.length].badge}`}
      >
        {pair + 1}
      </span>
    );
  }

  const buttonClasses =
    "flex min-h-16 items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm shadow-sm transition-all duration-150";

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-3">
        {question.pairs.map((pair, row) => (
          <button
            key={row}
            type="button"
            onClick={() => handleTap("left", row)}
            disabled={checked}
            className={`${buttonClasses} font-semibold ${styleFor("left", row)}`}
          >
            <span className="grow">{pair.left}</span>
            {badgeFor("left", row)}
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
            className={`${buttonClasses} font-medium ${styleFor("right", row)}`}
          >
            {badgeFor("right", row)}
            <span className="grow">{question.pairs[pairIndex].right}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
