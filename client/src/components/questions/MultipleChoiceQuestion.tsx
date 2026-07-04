import { useState } from "react";
import type { MultipleChoiceQuestion as MultipleChoiceQuestionData } from "../../types/content";
import type { QuestionProps } from "./QuestionProps";
import { optionStyles } from "./optionStyles";

export default function MultipleChoiceQuestion({
  question,
  checked,
  onResult,
}: QuestionProps<MultipleChoiceQuestionData>) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(index: number) {
    if (checked) return;
    setSelected(index);
    onResult(index === question.answer);
  }

  return (
    <div className="flex flex-col gap-3">
      {question.options.map((option, index) => {
        const isSelected = selected === index;
        let style = `active:scale-[0.98] ${optionStyles.idle}`;
        if (checked && index === question.answer) {
          style = optionStyles.correct;
        } else if (checked && isSelected) {
          style = optionStyles.wrong;
        } else if (isSelected) {
          style = optionStyles.selected;
        }
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(index)}
            disabled={checked}
            className={`min-h-14 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium shadow-sm transition-all duration-150 ${style}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
