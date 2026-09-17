import { Button } from '@/app/Button';
import cfg from '../../../donation-config.json';

export function DonateButton() {
  return (
    <Button
      href={`https://donate.freecodecamp.org?source=${cfg.donationId}&campaign=test-2026&medium=web`}
      variant="cta"
      target_blank
      rel="noopener noreferrer"
    >
      Donate
    </Button>
  );
}
