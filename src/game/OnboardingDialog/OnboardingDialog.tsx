import { Dialog } from '@/game/Dialog';
import styles from './OnboardingDialog.module.css';

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Hint: it's customizable!">
      <p className={styles.intro}>
        Use the gear icon in the top right corner to adjust these settings any time:
      </p>
      <dl className={styles.settings}>
        <div className={styles.settingRow}>
          <dt>Check answers</dt>
          <dd>
            On by default. Highlights digits that don&apos;t match the solution. Turn it off for a
            purer challenge.
          </dd>
        </div>
        <div className={styles.settingRow}>
          <dt>Timer</dt>
          <dd>Shows how long you have been playing.</dd>
        </div>
        <div className={styles.settingRow}>
          <dt>Highlight peers</dt>
          <dd>Dims the cells in the same row, column, and box as the selected cell.</dd>
        </div>
      </dl>
      <button type="button" className={styles.closeBtn} onClick={onClose}>
        Got it
      </button>
    </Dialog>
  );
}
