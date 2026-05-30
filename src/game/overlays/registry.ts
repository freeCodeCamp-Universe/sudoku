import type { OverlayComponent } from '@/game/gameTypes';
import { ArgyleOverlay } from './ArgyleOverlay';
import { AsteriskOverlay } from './AsteriskOverlay';
import { DiagonalOverlay } from './DiagonalOverlay';
import { JigsawOverlay } from './JigsawOverlay';
import { WindokuOverlay } from './WindokuOverlay';

export const overlayRegistry: Record<string, OverlayComponent> = {
  argyle: ArgyleOverlay,
  asterisk: AsteriskOverlay,
  diagonal: DiagonalOverlay,
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
