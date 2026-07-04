import type { Question } from "../../types/content";
import type { QuestionProps } from "./QuestionProps";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import TrueFalseQuestion from "./TrueFalseQuestion";
import FillBlankQuestion from "./FillBlankQuestion";
import MatchingQuestion from "./MatchingQuestion";
import OrderingQuestion from "./OrderingQuestion";

/** Picks the component for a question. New types plug in here. */
export default function QuestionRenderer({
  question,
  checked,
  onResult,
}: QuestionProps<Question>) {
  switch (question.type) {
    case "multiple_choice":
      return (
        <MultipleChoiceQuestion question={question} checked={checked} onResult={onResult} />
      );
    case "true_false":
      return (
        <TrueFalseQuestion question={question} checked={checked} onResult={onResult} />
      );
    case "fill_blank":
      return (
        <FillBlankQuestion question={question} checked={checked} onResult={onResult} />
      );
    case "matching":
      return (
        <MatchingQuestion question={question} checked={checked} onResult={onResult} />
      );
    case "ordering":
      return (
        <OrderingQuestion question={question} checked={checked} onResult={onResult} />
      );
  }
}
