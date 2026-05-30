import type { OverlayComponent } from '@/game/gameTypes';

export const overlayRegistry: Record<string, OverlayComponent> = {};

export function resolveOverlays(ids: string[] = []): OverlayComponent[] {
  return ids.map((id) => {
    const overlay = overlayRegistry[id];

    if (!overlay) {
      throw new Error(`Unknown overlay: ${id}`);
    }

    return overlay;
  });
}
