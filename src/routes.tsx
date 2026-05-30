import { Route, Routes } from 'react-router-dom';
import { GamePage } from '@/game/GamePage';
import styles from './App.module.css';

function GalleryPlaceholder() {
  return (
    <main>
      <p className={styles.galleryPlaceholder}>Gallery - coming in a later plan.</p>
    </main>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<GalleryPlaceholder />} />
      <Route path="/:variantId" element={<GamePage />} />
    </Routes>
  );
}
