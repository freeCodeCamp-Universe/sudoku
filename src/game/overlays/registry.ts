import type { OverlayComponent } from '@/game/gameTypes';
import { ArrowOverlay } from './ArrowOverlay';
import { ArgyleOverlay } from './ArgyleOverlay';
import { AsteriskOverlay } from './AsteriskOverlay';
import { CenterDotOverlay } from './CenterDotOverlay';
import { CageOverlay } from './CageOverlay';
import { ChainOverlay } from './ChainOverlay';
import { ConsecutiveOverlay } from './ConsecutiveOverlay';
import { KropkiOverlay } from './KropkiOverlay';
import { InequalityOverlay } from './InequalityOverlay';
import { JigsawOverlay } from './JigsawOverlay';

export const overlayRegistry: Record<string, OverlayComponent> = {
  arrow: ArrowOverlay,
  argyle: ArgyleOverlay,
  asterisk: AsteriskOverlay,
  'center-dot': CenterDotOverlay,
  cage: CageOverlay,
  'chain-overlay': ChainOverlay,
  'consecutive-dots': ConsecutiveOverlay,
  'kropki-dots': KropkiOverlay,
  inequality: InequalityOverlay,
  jigsaw: JigsawOverlay,
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
