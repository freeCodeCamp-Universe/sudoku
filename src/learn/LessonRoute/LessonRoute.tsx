import { useParams } from 'react-router-dom';
import { LessonPage } from '@/learn/LessonPage/LessonPage';
import { PlaceholderPanel } from '@/learn/PlaceholderPanel/PlaceholderPanel';
import { BoardPanel } from '@/learn/BoardPanel/BoardPanel';
import { isInteractiveLesson } from '@/curriculum/types';
import { useLessonData } from '@/learn/hooks/useLessonData';
import { LoadingState } from '@/learn/LoadingState/LoadingState';

export function LessonRoute() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { data, loading, error } = useLessonData(lessonId ?? '');

  if (loading) {
    return <LoadingState label="Loading lesson" />;
  }

  if (error || !data) {
    return (
      <main id="main-content" tabIndex={-1}>
        <p>Lesson not found.</p>
      </main>
    );
  }

  const InteractivePanel =
    isInteractiveLesson(data.lesson) && data.lesson.config.board ? BoardPanel : PlaceholderPanel;

  return (
    <LessonPage
      key={data.lesson.id}
      lesson={data.lesson}
      nextLessonId={data.nextLessonId}
      isLastLesson={data.isLastLesson}
      instructionsHtml={data.instructionsHtml}
      segmentHtmls={data.segmentHtmls}
      headings={data.headings}
      InteractivePanel={InteractivePanel}
    />
  );
}
