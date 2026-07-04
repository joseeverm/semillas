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
