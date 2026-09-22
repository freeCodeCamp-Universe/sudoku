import { useEffect, useRef } from 'react';
import { KbdCombo } from '@/components/KbdCombo';
import styles from '@/learn/CurriculumSearch/CurriculumSearch.module.css';

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
}

export function CurriculumSearch({ query, onQueryChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((!event.ctrlKey && !event.metaKey) || event.altKey || event.shiftKey) {
        return;
      }
      if (event.code !== 'KeyK') {
        return;
      }
      const input = inputRef.current;
      if (!input || document.activeElement === input) {
        return;
      }
      event.preventDefault();
      input.focus();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={styles.search}>
      <label className={styles.field}>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search lessons by title or ID"
          aria-label="Search lessons by title or ID"
          aria-keyshortcuts="Meta+K Control+K"
        />
        <span className={styles.hint} aria-hidden="true">
          <KbdCombo keys={['Cmd', 'K']} showSeparators={false} className={styles['hint-combo']} />
        </span>
      </label>
    </div>
  );
}
