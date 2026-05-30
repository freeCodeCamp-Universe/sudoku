import { Route, Routes } from 'react-router-dom';
import { Gallery } from '@/gallery/Gallery';
import { GamePage } from '@/game/GamePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Gallery />} />
      <Route path="/:variantId" element={<GamePage />} />
    </Routes>
  );
}
