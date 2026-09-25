/**
 * Shared color states for tappable options, with their dark variants.
 * Components add their own layout/scale classes on top.
 * Light theme is deliberately muted (green-tinted surfaces, no pure white).
 */
export const optionStyles = {
  /** Untouched, tappable. */
  idle: "border-green-200 bg-green-50 active:bg-green-100 dark:border-green-800 dark:bg-green-900/40 dark:active:bg-green-900/70",
  /** Chosen by the user, before checking. */
  selected:
    "border-green-600 bg-green-200 text-green-900 dark:border-green-500 dark:bg-green-900 dark:text-green-100",
  /** Revealed as correct after checking. */
  correct:
    "border-green-600 bg-green-200 text-green-900 dark:border-green-500 dark:bg-green-900 dark:text-green-100",
  /** Revealed as wrong after checking. */
  wrong:
    "border-red-400 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300",
  /** Locked and irrelevant after checking. */
  dimmed:
    "border-green-200 bg-green-50 opacity-60 dark:border-green-900 dark:bg-green-900/30",
} as const;

/**
 * One tint per pair of a matching question: both halves of a formed pair share
 * a color and a number, so it is visible at a glance what got matched with what.
 * Indexed by the pair's row in the left column; six is headroom over the four
 * pairs the content uses at most.
 */
export const matchPairStyles = [
  {
    option:
      "border-sky-600 bg-sky-100 text-sky-900 dark:border-sky-400 dark:bg-sky-950 dark:text-sky-100",
    badge: "bg-sky-600 text-sky-50 dark:bg-sky-400 dark:text-sky-950",
  },
  {
    option:
      "border-violet-600 bg-violet-100 text-violet-900 dark:border-violet-400 dark:bg-violet-950 dark:text-violet-100",
    badge: "bg-violet-600 text-violet-50 dark:bg-violet-400 dark:text-violet-950",
  },
  {
    option:
      "border-fuchsia-600 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-400 dark:bg-fuchsia-950 dark:text-fuchsia-100",
    badge:
      "bg-fuchsia-600 text-fuchsia-50 dark:bg-fuchsia-400 dark:text-fuchsia-950",
  },
  {
    option:
      "border-teal-600 bg-teal-100 text-teal-900 dark:border-teal-400 dark:bg-teal-950 dark:text-teal-100",
    badge: "bg-teal-600 text-teal-50 dark:bg-teal-400 dark:text-teal-950",
  },
  {
    option:
      "border-indigo-600 bg-indigo-100 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-100",
    badge: "bg-indigo-600 text-indigo-50 dark:bg-indigo-400 dark:text-indigo-950",
  },
  {
    option:
      "border-orange-600 bg-orange-100 text-orange-900 dark:border-orange-400 dark:bg-orange-950 dark:text-orange-100",
    badge: "bg-orange-600 text-orange-50 dark:bg-orange-400 dark:text-orange-950",
  },
] as const;
