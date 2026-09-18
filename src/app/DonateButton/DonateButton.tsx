import { Button } from '@/app/Button';
import cfg from '../../../donation-config.json';
import styles from './DonateButton.module.css';

export function DonateButton() {
  return (
    <Button
      className={styles.donateButton}
      href={`https://donate.freecodecamp.org?source=${cfg.donationId}&campaign=test-2026&medium=web`}
      variant="cta"
      target_blank
      rel="noopener noreferrer"
    >
      Donate
    </Button>
  );
}
