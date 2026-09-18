import { useEffect, useState } from 'react';
import type { Heading } from '@/learn/utils/extractHeadings';
import { SidePanel } from '@/learn/base/SidePanel/SidePanel';
import styles from '@/learn/features/Outline/Outline.module.css';

export interface OutlineProps {
  /** Must match the aria-controls value on the outline trigger button. */
  id: string;
  headings: Heading[];
  mode: 'sidebar' | 'drawer';
  /** Whether the outline is open. Controls the sidebar and the Drawer. */
  open: boolean;
  /** Called when the outline should close. */
  onClose: () => void;
  /** Element to restore focus to when the Drawer closes. */
  triggerElement?: HTMLElement | null;
}

/**
 * Tracks which heading is currently most prominent in the viewport. Uses
 * IntersectionObserver scoped to the top portion of the viewport so that the
 * active link follows the reader's position in the prose content.
 *
 * Returns a tuple of [activeId, setActiveId] so callers can also set the
 * active heading immediately on link click without waiting for scroll events.
 */
function useActiveHeading(headings: Heading[]): [string | null, (id: string) => void] {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!headings.length) {
      return;
    }

    const intersecting = new Map<Element, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            intersecting.set(entry.target, entry);
          } else {
            intersecting.delete(entry.target);
          }
        }

        const visible = [...intersecting.values()].sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      // Detection zone: from 15% down from the top to 50% up from the bottom.
      // The wider top margin excludes headings that have just barely scrolled
      // above the content area, preventing the parent h2 from staying "active"
      // after the reader has scrolled to a child h3.
      { rootMargin: '-15% 0px -50% 0px' }
    );

    for (const { id } of headings) {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  return [activeId, setActiveId];
}

export function Outline({ id, headings, mode, open, onClose, triggerElement }: OutlineProps) {
  const [activeId, setActiveId] = useActiveHeading(headings);

  if (!headings.length) {
    return null;
  }

  return (
    <SidePanel
      mode={mode}
      id={id}
      open={open}
      onClose={onClose}
      title="Outline"
      ariaLabel="Outline"
      triggerElement={triggerElement}
    >
      <ol className={styles.list}>
        {headings.map(({ level, text, id: hId }) => (
          <li key={hId} className={level === 3 ? styles['item-h3'] : styles['item-h2']}>
            <a
              href={`#${hId}`}
              className={`${styles.link}${activeId === hId ? ` ${styles['link-active']}` : ''}`}
              aria-current={activeId === hId ? 'location' : undefined}
              onClick={() => setActiveId(hId)}
            >
              {text}
            </a>
          </li>
        ))}
      </ol>
    </SidePanel>
  );
}
