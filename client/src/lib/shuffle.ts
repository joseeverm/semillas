/** Fisher–Yates. Returns a shuffled copy without mutating the original. */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Shuffle guaranteeing the result differs from the original order
 * (for ordering questions: an already-ordered list leaves nothing to do).
 */
export function shuffleAvoidingOriginal<T>(items: readonly T[]): T[] {
  if (items.length < 2) return [...items];
  for (let attempt = 0; attempt < 10; attempt++) {
    const result = shuffle(items);
    if (result.some((item, i) => item !== items[i])) return result;
  }
  return [...items].reverse();
}
