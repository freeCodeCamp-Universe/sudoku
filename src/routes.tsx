import { Route, Routes } from 'react-router-dom';
import { Gallery } from '@/gallery/Gallery';
import { GamePage } from '@/game/GamePage';
import { LearnPage } from '@/learn/views/LearnPage/LearnPage';
import { LessonRoute } from '@/learn/views/LessonRoute/LessonRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/learn" element={<LearnPage />} />
      <Route path="/learn/:lessonId" element={<LessonRoute />} />
      <Route path="/:variantId" element={<GamePage />} />
    </Routes>
  );
}
