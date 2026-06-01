import type { Variant } from '@/engine/types';
import { Preview } from '@/gallery/previews';
import { Link } from 'react-router-dom';
import styles from './VariantCard.module.css';

const DIFFICULTY_LABEL: Record<Variant['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

interface VariantCardProps {
  variant: Variant;
}

export function VariantCard({ variant }: VariantCardProps) {
  return (
    <Link to={`/${variant.id}`} className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardName}>{variant.name}</span>
        <span className={`${styles.badge} ${styles[`badge${capitalize(variant.difficulty)}`]}`}>
          {DIFFICULTY_LABEL[variant.difficulty]}
        </span>
      </div>
      <div className={styles.preview}>
        <Preview variantId={variant.id} />
      </div>
      <p className={styles.cardDesc}>{variant.description}</p>
    </Link>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
