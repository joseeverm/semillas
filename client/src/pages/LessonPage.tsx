import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  Confetti,
  Lightning,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { findLesson } from "../data";
import { useProgress } from "../progress/ProgressContext";
import type { Lesson, Question } from "../types/content";
import QuestionRenderer from "../components/questions/QuestionRenderer";

export default function LessonPage() {
  const { worldId, lessonId } = useParams();
  const found =
    worldId && lessonId ? findLesson(worldId, lessonId) : undefined;
  if (!found) return <Navigate to="/" replace />;
  // key resets all lesson state when navigating between lessons.
  return (
    <LessonRunner
      key={found.lesson.id}
      worldId={found.world.id}
      lesson={found.lesson}
    />
  );
}

function LessonRunner({ worldId, lesson }: { worldId: string; lesson: Lesson }) {
  const { isLessonCompleted, completeLesson } = useProgress();
  const totalQuestions = lesson.questions.length;

  // Failed questions are re-queued at the end, Duolingo-style, so the queue
  // can grow beyond the original list. The lesson ends when the last question
  // in the queue is answered correctly.
  const [queue, setQueue] = useState<Question[]>(lesson.questions);
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [passedCount, setPassedCount] = useState(0);
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(new Set());
  const [finished, setFinished] = useState(false);
  // Set at finish time, before completeLesson flips isLessonCompleted.
  const [earnedXp, setEarnedXp] = useState(0);

  const question = queue[index];
  const progressPercent = (passedCount / totalQuestions) * 100;

  function handleCheck() {
    if (answerCorrect === null) return;
    setChecked(true);
    if (!answerCorrect) {
      setFailedIds((prev) => new Set(prev).add(question.id));
    }
  }

  function handleContinue() {
    const nextPassed = answerCorrect ? passedCount + 1 : passedCount;
    setPassedCount(nextPassed);
    if (!answerCorrect) {
      setQueue((prev) => [...prev, question]);
    }
    if (answerCorrect && index + 1 >= queue.length) {
      setEarnedXp(isLessonCompleted(lesson.id) ? 0 : lesson.xp);
      completeLesson(lesson.id, lesson.xp);
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setChecked(false);
    setAnswerCorrect(null);
  }

  if (finished) {
    const firstTryCorrect = totalQuestions - failedIds.size;
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-8 text-center">
        <Confetti
          size={80}
          weight="duotone"
          aria-hidden
          className="animate-bounce-once text-green-600 dark:text-green-300"
        />
        <h1 className="text-3xl font-extrabold text-green-800 dark:text-green-100">
          ¡Lección completada!
        </h1>
        <div className="flex w-full flex-col gap-3">
          <div className="animate-pop-in rounded-2xl border-2 border-amber-300 bg-amber-100 px-6 py-4 dark:border-amber-900 dark:bg-amber-950">
            <p className="flex items-center justify-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-300">
              <Lightning size={16} weight="fill" aria-hidden />
              XP ganado
            </p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-300">
              {earnedXp > 0 ? `+${earnedXp}` : "Repaso"}
            </p>
            {earnedXp === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                Esta lección ya te había dado su XP.
              </p>
            )}
          </div>
          <div
            className="animate-pop-in rounded-2xl border-2 border-green-300 bg-green-200/60 px-6 py-4 dark:border-green-800 dark:bg-green-900/50"
            style={{ animationDelay: "0.15s" }}
          >
            <p className="text-sm font-semibold text-green-700 dark:text-green-200">
              Aciertos
            </p>
            <p className="text-3xl font-extrabold text-green-700 dark:text-green-200">
              {firstTryCorrect}/{totalQuestions}
            </p>
            <p className="text-xs text-green-700 dark:text-green-200">
              a la primera
            </p>
          </div>
        </div>
        <Link
          to={`/mundo/${worldId}`}
          className="w-full rounded-2xl bg-green-600 px-6 py-4 text-lg font-bold text-white shadow-md transition-all duration-150 active:scale-[0.97] active:bg-green-700"
        >
          Volver al mundo
        </Link>
      </div>
    );
  }

  // App-like screen: fixed-height column, no page scroll. The question area
  // scrolls internally if needed and the footer is always visible; overflow
  // is clipped so the slide-in transform never widens the page (on mobile
  // that let the fixed footer drift off-viewport).
  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-4 px-5 py-4">
        <Link
          to={`/mundo/${worldId}`}
          aria-label="Salir de la lección"
          className="text-gray-400 transition-all duration-200 active:scale-90 dark:text-green-200/60"
        >
          <X size={28} weight="bold" aria-hidden />
        </Link>
        <div
          className="h-4 flex-1 overflow-hidden rounded-full bg-green-200 dark:bg-green-900"
          role="progressbar"
          aria-valuenow={passedCount}
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
        >
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-sm font-bold text-green-700 dark:text-green-300">
          {passedCount}/{totalQuestions}
        </span>
      </header>

      {/* key remounts the question (fresh state + slide-in) on every advance,
          including when a failed question comes back around. */}
      <main key={index} className="animate-slide-in flex-1 overflow-y-auto px-5 py-4">
        <h2 className="mb-6 text-xl font-bold text-green-950 dark:text-green-50">
          {question.prompt}
        </h2>
        <QuestionRenderer
          question={question}
          checked={checked}
          onResult={setAnswerCorrect}
        />
      </main>

      <footer className="shrink-0">
        {!checked ? (
            <div className="border-t border-green-200 bg-green-50 p-5 pb-8 dark:border-green-900 dark:bg-green-950">
              <button
                type="button"
                onClick={handleCheck}
                disabled={answerCorrect === null}
                className="w-full rounded-2xl bg-green-600 px-6 py-4 text-lg font-bold text-white shadow-md transition-all duration-150 active:scale-[0.97] active:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-green-900/40 dark:disabled:text-green-200/30"
              >
                Comprobar
              </button>
            </div>
          ) : (
            <div
              className={`animate-slide-up p-5 pb-8 ${
                answerCorrect
                  ? "bg-green-200 dark:bg-green-900"
                  : "bg-red-100 dark:bg-red-950"
              }`}
            >
              <div className={answerCorrect ? "" : "animate-shake"}>
                <p
                  className={`mb-1 flex items-center gap-2 text-lg font-extrabold ${
                    answerCorrect
                      ? "text-green-700 dark:text-green-200"
                      : "text-red-600 dark:text-red-300"
                  }`}
                >
                  {answerCorrect ? (
                    <CheckCircle
                      size={28}
                      weight="fill"
                      aria-hidden
                      className="animate-bounce-once"
                    />
                  ) : (
                    <XCircle
                      size={28}
                      weight="fill"
                      aria-hidden
                      className="animate-bounce-once"
                    />
                  )}
                  {answerCorrect ? "¡Muy bien!" : "No exactamente"}
                </p>
                <p
                  className={`mb-4 text-sm leading-relaxed ${
                    answerCorrect
                      ? "text-green-800 dark:text-green-100"
                      : "text-red-700 dark:text-red-200"
                  }`}
                >
                  {question.explanation}
                </p>
              </div>
              <button
                type="button"
                onClick={handleContinue}
                className={`w-full rounded-2xl px-6 py-4 text-lg font-bold text-white shadow-md transition-all duration-150 active:scale-[0.97] ${
                  answerCorrect
                    ? "bg-green-600 active:bg-green-700"
                    : "bg-red-500 active:bg-red-600"
                }`}
              >
                Continuar
              </button>
            </div>
          )}
      </footer>
    </div>
  );
}
