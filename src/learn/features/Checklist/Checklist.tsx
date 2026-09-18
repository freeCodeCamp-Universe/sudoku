import { useEffect, useRef, useState } from 'react';
import type { ChecklistItem, ChecklistStatus } from '@/learn/curriculum/lessonProgress';
import { CheckCircleIcon, CircleIcon, XCircleIcon } from '@/learn/icons';
import { renderInline } from '@/learn/features/Markdown/RenderInline';
import styles from '@/learn/features/Checklist/Checklist.module.css';

export interface ChecklistProps {
  /** One entry per lesson requirement, in order. */
  items: readonly ChecklistItem[];
  /** Accessible name for the list region. */
  label?: string;
  /**
   * When true, skip the polite announcement for this render but still track
   * the diff baseline so the next render announces normally. Use this when a
   * higher-level summary (the validation feedback message) already covers the
   * batch transition and individual per-item announcements would be redundant.
   */
  muteAnnouncement?: boolean;
}

const STATUS_TEXT: Record<ChecklistStatus, string> = {
  'not-done': 'not done',
  completed: 'done',
  error: 'not yet',
};

/** What was on screen for one item last render, to diff against this one. */
interface ItemSnapshot {
  status: ChecklistStatus;
  showHint: boolean;
  count?: number;
}

function snapshot(items: readonly ChecklistItem[]): ItemSnapshot[] {
  return items.map((item) => ({
    status: item.status,
    showHint: item.showHint,
    count: item.count,
  }));
}

/**
 * Builds the polite announcement for the items that changed since the last
 * render. Two kinds of change are voiced: a transition into `completed` or
 * `error`, and a hint appearing. A run with no change returns an empty string so
 * the live region stays quiet.
 *
 * Hints are announced from here rather than by marking the hint paragraph itself
 * a live region: that element only mounts at the moment its text appears, and a
 * region inserted together with its content is unreliably announced. This region
 * is in the DOM from first render, so the text lands in an established one.
 */
function announceChanges(prev: ItemSnapshot[], next: readonly ChecklistItem[]): string {
  const changed = next.flatMap((item, index) => {
    const before = prev[index];
    const messages: string[] = [];

    if (before?.status !== item.status && item.status !== 'not-done') {
      messages.push(`${item.label}: ${STATUS_TEXT[item.status]}`);
    }

    if (
      item.count !== undefined &&
      before?.count !== undefined &&
      item.count !== before.count &&
      before.status === item.status
    ) {
      messages.push(`${item.label}`);
    }

    if (item.showHint && item.hint && !before?.showHint) {
      messages.push(`Hint for ${item.label}: ${item.hint}`);
    }

    return messages;
  });

  return changed.join('. ');
}

/**
 * The lesson checklist. Renders a semantic list whose items convey state by icon
 * plus text (never color alone): `circle` for not-done, `check-circle` for
 * completed, `x-circle` for error. A polite, de-duplicated live region announces
 * each state change and each revealed hint once; the checkmark transition is
 * instant under `prefers-reduced-motion`.
 */
export function Checklist({
  items,
  label = 'task checklist',
  muteAnnouncement = false,
}: ChecklistProps) {
  const prevItems = useRef<ItemSnapshot[]>(snapshot(items));
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const message = announceChanges(prevItems.current, items);
    prevItems.current = snapshot(items);
    if (muteAnnouncement) {
      return;
    }
    if (message) {
      setAnnouncement(message);
    }
  }, [items, muteAnnouncement]);

  return (
    <section className={styles.checklist}>
      <hr />
      <ul className={styles.list} aria-label={label}>
        {items.map((item, index) => (
          <li key={index} className={styles.item} data-status={item.status}>
            <span className={styles.icon}>
              <StatusIcon status={item.status} />
            </span>
            <div className={styles.body}>
              <span className="sr-only">{`(${STATUS_TEXT[item.status]})`}</span>{' '}
              <span className={styles.label}>{renderInline(item.label)}</span>
              {item.showHint && item.hint ? (
                <p className={styles.hint}>{renderInline(item.hint)}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="checklist-announcement"
      >
        {announcement}
      </div>
    </section>
  );
}

function StatusIcon({ status }: { status: ChecklistStatus }) {
  if (status === 'completed') {
    return <CheckCircleIcon />;
  }
  if (status === 'error') {
    return <XCircleIcon />;
  }
  return <CircleIcon />;
}
