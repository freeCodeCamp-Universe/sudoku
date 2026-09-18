import { useRef } from 'react';
import { useCodeBlockCopy } from '@/learn/features/CodeBlockCopy';
import styles from '@/learn/features/Markdown/Markdown.module.css';

export interface MarkdownProps {
  /** Pre-rendered HTML from {@link renderMarkdown}. */
  html: string;
}

/**
 * Renders pre-built HTML inside a styled prose container. The HTML is produced
 * at build time by {@link renderMarkdown} in the prebuild script, so this
 * component does not import `marked` and adds zero parsing to the client
 * bundle. The only client-side behavior is the copy-to-clipboard button for
 * fenced code blocks.
 */
export function Markdown({ html }: MarkdownProps) {
  const proseRef = useRef<HTMLDivElement>(null);
  useCodeBlockCopy(proseRef);

  // Lesson markdown is author-controlled curriculum content loaded from this repository.
  return <div ref={proseRef} className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />;
}
