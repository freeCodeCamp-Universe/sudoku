import type { Variant } from '@/engine/types';
import { Preview } from '@/gallery/previews';
import { StarIcon } from '@/gallery/StarIcon';
import { Link } from 'react-router-dom';
import styles from './VariantCard.module.css';

const DIFFICULTY_LABEL: Record<Variant['difficulty'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

interface VariantCardProps {
  variant: Variant;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

// The whole card stays clickable via the title link's stretched ::after
// overlay; the favorite button is a sibling of the link (never nested inside
// it) and floats above the overlay on its own z-index.
export function VariantCard({ variant, isFavorite, onToggleFavorite }: VariantCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardName}>
          <Link to={`/${variant.id}`} className={styles.cardLink}>
            {variant.name}
          </Link>
        </h3>
        <button
          type="button"
          className={styles.favoriteButton}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remove ${variant.name} from favorites`
              : `Add ${variant.name} to favorites`
          }
          onClick={() => onToggleFavorite(variant.id)}
        >
          <StarIcon className={styles.star} filled={isFavorite} />
        </button>
        <span className={`${styles.badge} ${styles[`badge${capitalize(variant.difficulty)}`]}`}>
          {DIFFICULTY_LABEL[variant.difficulty]}
        </span>
      </div>
      <div className={styles.preview}>
        <Preview variantId={variant.id} />
      </div>
      <p className={styles.cardDesc}>{variant.description}</p>
    </article>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
