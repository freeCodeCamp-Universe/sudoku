import { useEffect, useRef } from 'react';
import styles from '@/learn/features/Markdown/Markdown.module.css';

export interface MarkdownProps {
  /** Pre-rendered HTML from {@link renderMarkdown}. */
  html: string;
}

/**
 * Renders pre-built HTML inside a styled prose container. The HTML is produced
 * at build time by {@link renderMarkdown} in the prebuild script, so this
 * component does not import `marked` and adds zero parsing to the client
 * bundle.
 */
export function Markdown({ html }: MarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const buttons: HTMLButtonElement[] = [];
    for (const block of container.querySelectorAll<HTMLPreElement>('pre[data-copy]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.addEventListener('click', async () => {
        await navigator.clipboard?.writeText(block.textContent ?? '');
        button.textContent = 'Copied';
      });
      block.append(button);
      buttons.push(button);
    }

    return () => {
      buttons.forEach((button) => button.remove());
    };
  }, [html]);

  // Lesson markdown is author-controlled curriculum content loaded from this repository.
  return (
    <div ref={containerRef} className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
