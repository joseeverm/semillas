import type { Lesson, World } from "../types/content";

// One JSON file per world in ./worlds; every file found is part of the app
// content, so adding a world is just dropping its JSON there. JSON imports
// widen literals (e.g. `type: string`), so cast through unknown.
const worldModules = import.meta.glob("./worlds/*.json", {
  eager: true,
  import: "default",
});

export const worlds: World[] = (
  Object.values(worldModules) as unknown as World[]
).sort((a, b) => a.order - b.order);

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
