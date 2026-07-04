import type { Question } from "../../types/content";

/**
 * Contract every question component implements. Each component reads its
 * question from the content JSON, manages its own selection state and reports
 * the current outcome upward; the lesson screen owns the "Comprobar" button
 * and the feedback panel. Adding a new question type = new component with
 * these same props + a case in QuestionRenderer.
 */
export interface QuestionProps<Q extends Question = Question> {
  question: Q;
  /** True after "Comprobar": inputs lock and correctness is revealed. */
  checked: boolean;
  /**
   * Reports the current answer state: null while incomplete, otherwise
   * whether the answer is correct. Called from event handlers on every change.
   */
  onResult: (correct: boolean | null) => void;
}
