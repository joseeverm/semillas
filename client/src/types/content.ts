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

/**
 * Editorial provenance against the official booklets. The app never uses or
 * renders it; it exists so content editors can trace every question.
 */
export interface QuestionSource {
  booklet: string;
  page: number;
  topic: string;
}

interface QuestionBase {
  type: QuestionType;
  /** The statement the camper reads. User-facing: Spanish. */
  statement: string;
  /** Shown in the feedback panel, on both correct and incorrect answers. */
  explanation: string;
  source: QuestionSource;
}

/** Multiple choice: tap the correct option. Options are shuffled for display. */
export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: string[];
  /** Index of the correct option within `options` (content order, not display order). */
  answer: number;
}

/** True or false: two big buttons. */
export interface TrueFalseQuestion extends QuestionBase {
  type: "true_false";
  answer: boolean;
}

/** Fill in the blanks: statement with `{blank}` gaps + word bank filled by tap. */
export interface FillBlankQuestion extends QuestionBase {
  type: "fill_blank";
  /** Full word bank (answers + distractors), shuffled for display. */
  options: string[];
  /** Correct words, one per `{blank}` in `statement`, same order as the gaps. */
  answer: string[];
}

/** Matching: two columns, tap one item on each side to form pairs. */
export interface MatchingQuestion extends QuestionBase {
  type: "matching";
  pairs: { left: string; right: string }[];
}

/** Ordering: tap items in order, they get numbered (no drag and drop). */
export interface OrderingQuestion extends QuestionBase {
  type: "ordering";
  /** The items to order; their order here is irrelevant (displayed shuffled). */
  items: string[];
  /** The items in the correct order; must be a permutation of `items`. */
  answer: string[];
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
  /**
   * Id of the unit (booklet) the lesson belongs to. Resolved at assembly time
   * in `src/data/index.ts` from the unit file that carries the lesson; the
   * lesson JSON itself does not store it.
   */
  unit: string;
}

/** One booklet ("cartilla") within a world. User-facing `title`: Spanish. */
export interface UnitMeta {
  id: string;
  title: string;
}

/**
 * One world per program level, stored as one folder in `src/data/worlds/`
 * (`meta.json` + one JSON per unit) and assembled in `src/data/index.ts`.
 */
export interface World {
  id: string;
  title: string;
  description: string;
  order: number;
  /** Units in display order; lessons are grouped by unit in this order. */
  units: UnitMeta[];
  lessons: Lesson[];
}
