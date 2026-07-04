import { useMemo, useState } from "react";
import type { FillBlankQuestion as FillBlankQuestionData } from "../../types/content";
import type { QuestionProps } from "./QuestionProps";
import { shuffle } from "../../lib/shuffle";
import { optionStyles } from "./optionStyles";

export default function FillBlankQuestion({
  question,
  checked,
  onResult,
}: QuestionProps<FillBlankQuestionData>) {
  const segments = question.text.split("___");
  const blankCount = segments.length - 1;
  const bank = useMemo(() => shuffle(question.wordBank), [question.wordBank]);
  // Each gap holds an index into `bank` (not the word itself) so duplicate
  // words in the bank are tracked independently.
  const [placed, setPlaced] = useState<(number | null)[]>(() =>
    Array(blankCount).fill(null),
  );

  function report(next: (number | null)[]) {
    if (next.some((slot) => slot === null)) {
      onResult(null);
      return;
    }
    const correct = next.every(
      (slot, i) => bank[slot as number] === question.answers[i],
    );
    onResult(correct);
  }

  function handleBankTap(bankIndex: number) {
    if (checked || placed.includes(bankIndex)) return;
    const firstEmpty = placed.indexOf(null);
    if (firstEmpty === -1) return;
    const next = [...placed];
    next[firstEmpty] = bankIndex;
    setPlaced(next);
    report(next);
  }

  function handleBlankTap(blankIndex: number) {
    if (checked || placed[blankIndex] === null) return;
    const next = [...placed];
    next[blankIndex] = null;
    setPlaced(next);
    report(next);
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-lg leading-loose">
        {segments.map((segment, i) => (
          <span key={i}>
            {segment}
            {i < blankCount && (
              <button
                type="button"
                onClick={() => handleBlankTap(i)}
                disabled={checked}
                className={`mx-1 inline-block min-w-24 rounded-xl border-2 px-3 py-1 align-middle text-base font-semibold transition-all duration-150 ${
                  placed[i] === null
                    ? "border-dashed border-green-300 bg-green-50 text-transparent dark:border-green-800 dark:bg-green-900/40"
                    : checked
                      ? bank[placed[i] as number] === question.answers[i]
                        ? optionStyles.correct
                        : optionStyles.wrong
                      : `active:scale-95 ${optionStyles.selected}`
                }`}
              >
                {placed[i] === null ? "•" : bank[placed[i] as number]}
              </button>
            )}
          </span>
        ))}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {bank.map((word, index) => {
          const used = placed.includes(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleBankTap(index)}
              disabled={checked || used}
              className={`min-h-12 rounded-xl border-2 px-4 py-2 text-base font-semibold shadow-sm transition-all duration-150 ${
                used
                  ? "border-green-200 bg-green-100 text-green-800/25 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200/20"
                  : `active:scale-90 ${optionStyles.idle}`
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
