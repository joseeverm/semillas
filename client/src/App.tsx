import { Navigate, Route, Routes } from "react-router-dom";
import WorldMapPage from "./pages/WorldMapPage";
import WorldPage from "./pages/WorldPage";
import LessonPage from "./pages/LessonPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WorldMapPage />} />
      <Route path="/mundo/:worldId" element={<WorldPage />} />
      <Route path="/mundo/:worldId/leccion/:lessonId" element={<LessonPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
