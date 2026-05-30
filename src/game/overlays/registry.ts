import type { OverlayComponent } from '@/game/gameTypes';
import { ArrowOverlay } from './ArrowOverlay';
import { ArgyleOverlay } from './ArgyleOverlay';
import { AsteriskOverlay } from './AsteriskOverlay';
import { CageOverlay } from './CageOverlay';
import { DiagonalOverlay } from './DiagonalOverlay';
import { EvenOddOverlay } from './EvenOddOverlay';
import { JigsawOverlay } from './JigsawOverlay';
import { WindokuOverlay } from './WindokuOverlay';

export const overlayRegistry: Record<string, OverlayComponent> = {
  arrow: ArrowOverlay,
  argyle: ArgyleOverlay,
  asterisk: AsteriskOverlay,
  cage: CageOverlay,
  diagonal: DiagonalOverlay,
  'evenOdd-shading': EvenOddOverlay,
  jigsaw: JigsawOverlay,
  windoku: WindokuOverlay,
};

export function resolveOverlays(ids: string[] = []): OverlayComponent[] {
  return ids.map((id) => {
    const overlay = overlayRegistry[id];

    if (!overlay) {
      throw new Error(`Unknown overlay: ${id}`);
    }

    return overlay;
  });
}
