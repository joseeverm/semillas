import type { Lesson, UnitMeta, World } from "../types/content";

/**
 * One folder per world in ./worlds: `meta.json` (world data + ordered units)
 * plus one JSON per unit (booklet) with its lessons. Every folder found is
 * part of the app content, so adding a world or a unit is just dropping its
 * JSON there. JSON imports widen literals (e.g. `type: string`), so cast
 * through unknown.
 */
interface WorldMeta {
  id: string;
  title: string;
  description: string;
  order: number;
  units: UnitMeta[];
}

/** Shape of a unit file on disk: its lessons don't carry `unit` yet. */
interface UnitFile {
  unit: string;
  lessons: Omit<Lesson, "unit">[];
}

const metaModules = import.meta.glob("./worlds/*/meta.json", {
  eager: true,
  import: "default",
});
const unitModules = import.meta.glob(
  ["./worlds/*/*.json", "!./worlds/*/meta.json"],
  { eager: true, import: "default" },
);

function assembleWorld(metaPath: string, meta: WorldMeta): World {
  const worldDir = metaPath.slice(0, -"meta.json".length);
  const unitFiles = Object.entries(unitModules)
    .filter(([path]) => path.startsWith(worldDir))
    .map(([, file]) => file as unknown as UnitFile);
  // Lessons grouped by unit following meta's unit order, keeping each file's
  // own lesson order; `unit` is resolved onto every lesson here, in memory.
  const lessons: Lesson[] = meta.units.flatMap((unit) =>
    unitFiles
      .filter((file) => file.unit === unit.id)
      .flatMap((file) => file.lessons.map((l) => ({ ...l, unit: unit.id }))),
  );
  return { ...meta, lessons };
}

export const worlds: World[] = Object.entries(metaModules)
  .map(([path, meta]) => assembleWorld(path, meta as unknown as WorldMeta))
  .sort((a, b) => a.order - b.order);

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
