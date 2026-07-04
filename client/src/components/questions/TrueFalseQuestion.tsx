import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "@phosphor-icons/react";
import type { TrueFalseQuestion as TrueFalseQuestionData } from "../../types/content";
import type { QuestionProps } from "./QuestionProps";
import { optionStyles } from "./optionStyles";

export default function TrueFalseQuestion({
  question,
  checked,
  onResult,
}: QuestionProps<TrueFalseQuestionData>) {
  const [selected, setSelected] = useState<boolean | null>(null);

  function handleSelect(value: boolean) {
    if (checked) return;
    setSelected(value);
    onResult(value === question.answer);
  }

  function styleFor(value: boolean): string {
    const isSelected = selected === value;
    if (checked && value === question.answer && isSelected) {
      return optionStyles.correct;
    }
    if (checked && isSelected) {
      return optionStyles.wrong;
    }
    if (checked) {
      return optionStyles.dimmed;
    }
    if (isSelected) {
      return optionStyles.selected;
    }
    return `active:scale-[0.97] ${optionStyles.idle}`;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => handleSelect(true)}
        disabled={checked}
        className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 text-lg font-bold shadow-sm transition-all duration-150 ${styleFor(true)}`}
      >
        <ThumbsUp
          size={32}
          weight={selected === true ? "fill" : "regular"}
          aria-hidden
        />
        Verdadero
      </button>
      <button
        type="button"
        onClick={() => handleSelect(false)}
        disabled={checked}
        className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 text-lg font-bold shadow-sm transition-all duration-150 ${styleFor(false)}`}
      >
        <ThumbsDown
          size={32}
          weight={selected === false ? "fill" : "regular"}
          aria-hidden
        />
        Falso
      </button>
    </div>
  );
}
