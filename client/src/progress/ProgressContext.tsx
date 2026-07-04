import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * User progress, persisted in localStorage with schema versioning.
 * To change the shape: bump CURRENT_VERSION, add a migration case in
 * `migrate` and adjust the `Progress` type.
 */

const STORAGE_KEY = "semillas-progress";
const CURRENT_VERSION = 1;

interface Progress {
  version: number;
  /** Total accumulated XP. */
  xp: number;
  /** Ids of lessons completed at least once. */
  completedLessons: string[];
}

const INITIAL_PROGRESS: Progress = {
  version: CURRENT_VERSION,
  xp: 0,
  completedLessons: [],
};

function migrate(data: unknown): Progress {
  if (
    typeof data !== "object" ||
    data === null ||
    !("version" in data) ||
    typeof data.version !== "number"
  ) {
    return INITIAL_PROGRESS;
  }
  switch (data.version) {
    case 1:
      return data as Progress;
    // Future migrations: case 2 transforms v1 → v2, etc.
    default:
      // Unknown version (newer schema or corrupted): start fresh.
      return INITIAL_PROGRESS;
  }
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    return migrate(JSON.parse(raw));
  } catch {
    return INITIAL_PROGRESS;
  }
}

function save(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable (full quota, private mode, etc.): the app still
    // works, progress just won't survive a reload.
  }
}

interface ProgressContextValue {
  totalXp: number;
  isLessonCompleted: (lessonId: string) => boolean;
  /**
   * Marks the lesson as completed. XP is awarded only the first time;
   * check `isLessonCompleted` beforehand to know if this run earns XP.
   */
  completeLesson: (lessonId: string, xp: number) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(load);

  const completeLesson = useCallback((lessonId: string, xp: number) => {
    setProgress((prev) => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      const next: Progress = {
        ...prev,
        xp: prev.xp + xp,
        completedLessons: [...prev.completedLessons, lessonId],
      };
      save(next);
      return next;
    });
  }, []);

  const value = useMemo<ProgressContextValue>(() => {
    const completed = new Set(progress.completedLessons);
    return {
      totalXp: progress.xp,
      isLessonCompleted: (lessonId) => completed.has(lessonId),
      completeLesson,
    };
  }, [progress, completeLesson]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used inside <ProgressProvider>");
  }
  return ctx;
}
