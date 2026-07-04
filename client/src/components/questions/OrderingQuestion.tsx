import { useMemo, useState } from "react";
import type { OrderingQuestion as OrderingQuestionData } from "../../types/content";
import type { QuestionProps } from "./QuestionProps";
import { shuffleAvoidingOriginal } from "../../lib/shuffle";
import { optionStyles } from "./optionStyles";

export default function OrderingQuestion({
  question,
  checked,
  onResult,
}: QuestionProps<OrderingQuestionData>) {
  const displayed = useMemo(
    () => shuffleAvoidingOriginal(question.items),
    [question.items],
  );
  // Indices into `displayed`, in the order the user tapped them.
  const [sequence, setSequence] = useState<number[]>([]);

  function report(next: number[]) {
    if (next.length < displayed.length) {
      onResult(null);
      return;
    }
    const correct = next.every((di, pos) => displayed[di] === question.items[pos]);
    onResult(correct);
  }

  function handleTap(index: number) {
    if (checked) return;
    const position = sequence.indexOf(index);
    // Tapping a numbered item removes it; the rest renumber automatically.
    const next =
      position === -1
        ? [...sequence, index]
        : sequence.filter((i) => i !== index);
    setSequence(next);
    report(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {displayed.map((item, index) => {
        const position = sequence.indexOf(index);
        const numbered = position !== -1;
        let style = `active:scale-[0.98] ${optionStyles.idle}`;
        if (checked && numbered) {
          style =
            displayed[index] === question.items[position]
              ? optionStyles.correct
              : optionStyles.wrong;
        } else if (numbered) {
          style = optionStyles.selected;
        }
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleTap(index)}
            disabled={checked}
            className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium shadow-sm transition-all duration-150 ${style}`}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                numbered
                  ? "bg-green-600 text-white animate-pop-in"
                  : "border-2 border-dashed border-green-300 text-transparent dark:border-green-800"
              }`}
            >
              {numbered ? position + 1 : "·"}
            </span>
            {item}
          </button>
        );
      })}
    </div>
  );
}
