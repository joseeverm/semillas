import type { Content, Lesson, World } from "../types/content";
import contentJson from "./content.json";

// JSON imports widen literals (e.g. `type: string`), so cast through unknown.
const content = contentJson as unknown as Content;

export const worlds: World[] = [...content.worlds].sort(
  (a, b) => a.order - b.order,
);

export function findWorld(worldId: string): World | undefined {
  return worlds.find((w) => w.id === worldId);
}

export function findLesson(
  worldId: string,
  lessonId: string,
): { world: World; lesson: Lesson } | undefined {
  const world = findWorld(worldId);
  const lesson = world?.lessons.find((l) => l.id === lessonId);
  return world && lesson ? { world, lesson } : undefined;
}
