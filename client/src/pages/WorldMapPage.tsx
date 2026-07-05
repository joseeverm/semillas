import { Link } from "react-router-dom";
import {
  Acorn,
  Carrot,
  CheckCircle,
  Flower,
  Grains,
  Leaf,
  Lightning,
  Moon,
  Orange,
  Plant,
  Sun,
  Tent,
  type Icon,
} from "@phosphor-icons/react";
import { worlds } from "../data";
import { useProgress } from "../progress/ProgressContext";
import { useTheme } from "../theme/theme";
import ProgressIcon from "../components/ProgressIcon";

/**
 * Growth stages of the path, one per program level in order:
 * Aspirante, Semilla, Raíz, Tallo, Hoja, Flor, Fruto.
 * Real worlds (src/data/worlds/) consume this list from the start; the
 * upcoming-level placeholders below consume the rest.
 */
const LEVEL_ICONS: Icon[] = [Acorn, Plant, Carrot, Grains, Leaf, Flower, Orange];

/**
 * Levels without content yet, shown as non-interactive preview cards at the
 * end of the path. When a level gets real content, add its JSON to
 * src/data/worlds/ and remove it from here.
 */
const UPCOMING_LEVELS: { title: string; description: string }[] = [
  { title: "Semilla", description: "Germinar como campista: los primeros conocimientos propios." },
  { title: "Raíz", description: "Firmeza y arraigo: afianza lo aprendido." },
  { title: "Tallo", description: "Sostén del grupo: técnicas para sostener a otros." },
  { title: "Hoja", description: "Crecer hacia la luz: liderazgo en la vida de campamento." },
  { title: "Flor", description: "Florecer para la comunidad: mística y servicio." },
  { title: "Fruto", description: "Dar de sí: acompañar y formar a nuevos campistas." },
];

export default function WorldMapPage() {
  const { totalXp, isLessonCompleted } = useProgress();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-green-200 bg-green-100/90 px-5 py-4 backdrop-blur dark:border-green-900 dark:bg-green-950/90">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-green-800 dark:text-green-100">
          <Plant
            size={28}
            weight="fill"
            aria-hidden
            className="text-green-600 dark:text-green-400"
          />
          Semillas
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
            }
            className="flex size-9 items-center justify-center rounded-full bg-green-200 text-green-800 shadow-sm transition-all duration-200 active:scale-90 dark:bg-green-900 dark:text-green-100"
          >
            {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <div className="flex items-center gap-1 rounded-full bg-amber-200 px-4 py-1.5 text-sm font-bold text-amber-800 shadow-sm dark:bg-amber-950 dark:text-amber-300">
            <Lightning size={16} weight="fill" aria-hidden />
            {totalXp} XP
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <ol className="relative flex flex-col gap-10">
          {/* Path connecting the worlds, like a growing stem. */}
          <div
            aria-hidden
            className="absolute top-6 bottom-6 left-10 w-1 rounded-full border-l-4 border-dashed border-green-300 dark:border-green-800"
          />
          {worlds.map((world, index) => {
            const total = world.lessons.length;
            const done = world.lessons.filter((l) =>
              isLessonCompleted(l.id),
            ).length;
            const complete = done === total;
            return (
              <li key={world.id} className="relative">
                <Link
                  to={`/mundo/${world.id}`}
                  className="flex items-center gap-4 rounded-3xl border-2 border-green-200 bg-green-50 p-4 shadow-sm transition-all duration-150 active:scale-[0.98] active:bg-green-100 dark:border-green-800 dark:bg-green-900/40 dark:active:bg-green-900/70"
                >
                  <span
                    className={`flex size-16 shrink-0 items-center justify-center rounded-full shadow-inner ${
                      complete
                        ? "bg-green-500 text-white ring-4 ring-green-300 dark:ring-green-800"
                        : "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    <ProgressIcon
                      icon={LEVEL_ICONS[index % LEVEL_ICONS.length]}
                      completed={complete}
                      size={32}
                    />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-green-900 dark:text-green-100">
                      {world.title}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-green-200/60">
                      {world.description}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-300">
                      {done}/{total} lecciones
                      {complete && (
                        <CheckCircle size={16} weight="fill" aria-hidden />
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}

          {/* Preview of the levels still without content: not tappable. */}
          {UPCOMING_LEVELS.map((level, index) => {
            const LevelIcon =
              LEVEL_ICONS[(worlds.length + index) % LEVEL_ICONS.length];
            return (
              <li key={level.title} className="relative">
                <div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-green-300 bg-green-100/60 p-4 dark:border-green-800 dark:bg-green-900/20">
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-green-200/60 text-green-700/60 dark:bg-green-900/60 dark:text-green-300/50">
                    <LevelIcon size={32} aria-hidden />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-green-900/60 dark:text-green-100/50">
                      {level.title}
                    </span>
                    <span className="text-sm text-gray-600/70 dark:text-green-200/40">
                      {level.description}
                    </span>
                    <span className="self-start rounded-full bg-green-200/80 px-2.5 py-0.5 text-xs font-semibold text-green-800/70 dark:bg-green-900/60 dark:text-green-200/50">
                      Próximamente
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </main>

      <footer className="flex items-center justify-center gap-1.5 px-6 pb-8 text-center text-xs text-gray-500 dark:text-green-200/40">
        Aquí se repasa; los niveles se ganan en el campamento.
        <Tent size={14} aria-hidden />
      </footer>
    </div>
  );
}
