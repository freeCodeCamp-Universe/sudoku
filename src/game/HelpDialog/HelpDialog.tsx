import { useEffect, useId, useMemo, useRef } from 'react';
import type { HelpSection } from '@/engine/types';
import styles from './HelpDialog.module.css';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
  help?: HelpSection[];
  description: string;
}

export function HelpDialog({ open, onClose, help, description }: HelpDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const sections = useMemo<HelpSection[]>(
    () =>
      help && help.length > 0
        ? help
        : [
            {
              label: 'Basic Rules',
              tone: 'basic',
              rules: [{ term: '', text: description }],
            },
          ],
    [description, help]
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (typeof dialog.showModal !== 'function') {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className={styles.content}>
        <h2 id={titleId} className={styles.title}>
          How to Play
        </h2>

        {sections.map((section) => (
          <div key={`${section.tone}-${section.label}`} className={styles.sectionGroup}>
            <h3 className={`${styles.badge} ${styles[section.tone]}`}>{section.label}</h3>
            <ul className={styles.rules}>
              {section.rules.map((rule) => (
                <li key={`${rule.term}-${rule.text}`}>
                  {rule.term ? (
                    <>
                      <strong>{rule.term}:</strong> {rule.text}
                    </>
                  ) : (
                    rule.text
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Got it
        </button>
      </div>
    </dialog>
  );
}
