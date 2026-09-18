import { Link } from 'react-router-dom';
import { CheckCircleIcon, CircleIcon } from '@/learn/icons';
import { renderInline } from '@/learn/features/Markdown/RenderInline';
import styles from '@/learn/features/CurriculumTree/CurriculumTree.module.css';

export interface CurriculumTreeLesson {
  id: string;
  title: string;
  /** Hashed lesson JSON filename, present on all server-provided entries. */
  dataFile?: string;
}

export interface CurriculumTreeModule {
  slug: string;
  title: string;
  lessons: CurriculumTreeLesson[];
  number?: number;
}

export type CurriculumTreeLessonState = 'completed' | 'current' | 'completed-current' | 'available';

interface Props {
  modules: CurriculumTreeModule[];
  variant: 'home' | 'drawer';
  lessonState?: (id: string) => CurriculumTreeLessonState;
  onLessonClick?: () => void;
  /** Ref attached to the current lesson's link, for scroll-into-view / focus management. */
  currentLessonRef?: React.RefObject<HTMLAnchorElement | null>;
}

export function CurriculumTree({
  modules,
  variant,
  lessonState,
  onLessonClick,
  currentLessonRef,
}: Props) {
  const stateFor = lessonState ?? (() => 'available' as const);
  const ModuleHeading = variant === 'home' ? 'h2' : 'h3';
  const variantClass = (suffix: string) => styles[`${variant}-${suffix}`];

  return (
    <ol className={variantClass('modules')}>
      {modules.map((module, moduleIndex) => (
        <li key={module.slug} className={variantClass('module')}>
          <ModuleHeading className={variantClass('module-title')}>
            <span>{module.number ?? moduleIndex + 1}.</span> {module.title}
          </ModuleHeading>
          <ol className={variantClass('lessons')}>
            {module.lessons.map((lesson) => {
              const state = stateFor(lesson.id);
              return (
                <li
                  key={lesson.id}
                  className={`${variantClass('lesson')} ${variant}-lesson`}
                  data-lesson-id={lesson.id}
                  data-state={state}
                >
                  <Link
                    to={`/learn/${lesson.id}`}
                    className={`${variantClass('lesson-row')} ${variant}-lesson-row`}
                    aria-current={isCurrentState(state) ? 'step' : undefined}
                    ref={isCurrentState(state) ? currentLessonRef : undefined}
                    onClick={onLessonClick}
                  >
                    <CheckCircleIcon
                      className={`${variantClass('marker-completed')} ${variant}-marker ${variant}-marker-completed`}
                    />
                    <CircleIcon
                      className={`${variantClass('marker-available')} ${variant}-marker ${variant}-marker-available`}
                    />{' '}
                    <span className={`sr-only ${variant}-status-completed`}>Completed</span>
                    <span className={`sr-only ${variant}-status-available`}>
                      Not completed
                    </span>{' '}
                    <span className={variantClass('lesson-title')}>
                      {renderInline(lesson.title)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function isCurrentState(state: CurriculumTreeLessonState): boolean {
  return state === 'current' || state === 'completed-current';
}
