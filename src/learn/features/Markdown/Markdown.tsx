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
  // Lesson markdown is author-controlled curriculum content loaded from this repository.
  return <div className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} />;
}
