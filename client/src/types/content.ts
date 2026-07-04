/**
 * Content model for Semillas.
 *
 * Question types form a discriminated union on `type`.
 * Planned future types (NOT implemented yet): "written" (typed answer) and
 * "image_identification" (photo + options). Adding one means defining its
 * interface, adding it to the `Question` union and creating its component.
 */

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "ordering";

interface QuestionBase {
  id: string;
  type: QuestionType;
  /** The prompt the camper reads. User-facing: Spanish. */
  prompt: string;
  /** Shown in the feedback panel, on both correct and incorrect answers. */
  explanation: string;
}

/** Multiple choice: tap the correct option. */
export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: string[];
  /** Index of the correct option within `options`. */
  answer: number;
}

/** True or false: two big buttons. */
export interface TrueFalseQuestion extends QuestionBase {
  type: "true_false";
  answer: boolean;
}

/** Fill in the blanks: sentence with `___` gaps + word bank filled by tap. */
export interface FillBlankQuestion extends QuestionBase {
  type: "fill_blank";
  /** Sentence with `___` marking each gap, in order. */
  text: string;
  /** Correct words, one per gap, same order as the gaps. */
  answers: string[];
  /** Full word bank (answers + distractors). */
  wordBank: string[];
}

/** Matching: two columns, tap one item on each side to form pairs. */
export interface MatchingQuestion extends QuestionBase {
  type: "matching";
  pairs: { left: string; right: string }[];
}

/** Ordering: tap items in order, they get numbered (no drag and drop). */
export interface OrderingQuestion extends QuestionBase {
  type: "ordering";
  /** Items in the correct order; displayed shuffled. */
  items: string[];
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | MatchingQuestion
  | OrderingQuestion;

export interface Lesson {
  id: string;
  title: string;
  xp: number;
  questions: Question[];
}

export interface World {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Content {
  worlds: World[];
}
