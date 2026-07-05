import { Fragment } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Lightning, Plant } from "@phosphor-icons/react";
import { findWorld } from "../data";
import { useProgress } from "../progress/ProgressContext";
import ProgressIcon from "../components/ProgressIcon";

export default function WorldPage() {
  const { worldId } = useParams();
  const world = worldId ? findWorld(worldId) : undefined;
  const { isLessonCompleted } = useProgress();

  if (!world) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-10 border-b border-green-200 bg-green-100/90 px-5 py-4 backdrop-blur dark:border-green-900 dark:bg-green-950/90">
        <Link
          to="/"
          className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-green-700 transition-all duration-200 active:scale-90 dark:text-green-300"
        >
          <ArrowLeft size={24} aria-hidden />
          Mapa
        </Link>
        <h1 className="text-2xl font-extrabold text-green-800 dark:text-green-100">
          {world.title}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-green-200/60">
          {world.description}
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-5 py-6">
        {world.lessons.map((lesson, index) => {
          const completed = isLessonCompleted(lesson.id);
          const startsUnit = world.lessons[index - 1]?.unit !== lesson.unit;
          const unitTitle = world.units.find((u) => u.id === lesson.unit)?.title;
          return (
            <Fragment key={lesson.id}>
              {startsUnit && unitTitle && (
                <h2 className="mt-2 flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-green-700 first:mt-0 dark:text-green-300">
                  {unitTitle}
                  <span
                    className="h-0.5 flex-1 rounded-full bg-green-200 dark:bg-green-900"
                    aria-hidden
                  />
                </h2>
              )}
              <Link
                to={`/mundo/${world.id}/leccion/${lesson.id}`}
                className={`flex items-center gap-4 rounded-3xl border-2 p-4 shadow-sm transition-all duration-150 active:scale-[0.98] ${
                  completed
                    ? "border-green-400 bg-green-200/60 active:bg-green-200 dark:border-green-700 dark:bg-green-900/60 dark:active:bg-green-900"
                    : "border-green-200 bg-green-50 active:bg-green-100 dark:border-green-800 dark:bg-green-900/40 dark:active:bg-green-900/70"
                }`}
              >
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                    completed
                      ? "bg-green-500 text-white"
                      : "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300"
                  }`}
                >
                  <ProgressIcon icon={Plant} completed={completed} size={26} />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-bold text-green-900 dark:text-green-100">
                    {lesson.title}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-green-200/60">
                    {completed ? "Completada · toca para repasar" : "Disponible"}
                  </span>
                </span>
                <span className="flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Lightning size={12} weight="fill" aria-hidden />
                  +{lesson.xp} XP
                </span>
              </Link>
            </Fragment>
          );
        })}
      </main>
    </div>
  );
}
