import { Route, Routes } from 'react-router-dom';
import { Gallery } from '@/gallery/Gallery';
import { GamePage } from '@/game/GamePage';
import { CourseLayout } from '@/learn/views/CourseLayout/CourseLayout';
import { LearnPage } from '@/learn/views/LearnPage/LearnPage';
import { LessonRoute } from '@/learn/views/LessonRoute/LessonRoute';

export function AppRoutes() {
  const showLearn = import.meta.env.SHOW_LEARN === 'true';

  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      {showLearn && (
        <>
          <Route
            path="/learn"
            element={
              <CourseLayout>
                <LearnPage />
              </CourseLayout>
            }
          />
          <Route
            path="/learn/:lessonId"
            element={
              <CourseLayout>
                <LessonRoute />
              </CourseLayout>
            }
          />
        </>
      )}
      <Route path="/:variantId" element={<GamePage />} />
    </Routes>
  );
}
