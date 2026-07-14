import { Button } from '@/game/Button';
import styles from './ZoomControls.module.css';

interface ZoomControlsProps {
  onZoomIn(): void;
  onZoomOut(): void;
  onFit(): void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div className={styles.controls}>
      <Button aria-label="Zoom out" onClick={onZoomOut}>
        −
      </Button>
      <Button aria-label="Zoom in" onClick={onZoomIn}>
        +
      </Button>
      <Button className={styles.fit} aria-label="Fit whole board" onClick={onFit}>
        Fit
      </Button>
    </div>
  );
}
