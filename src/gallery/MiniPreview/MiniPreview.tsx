import { useRef } from 'react';
import type { CellId } from '@/engine/types';
import { Board } from '@/game/Board';
import type { CellState, GridInteraction } from '@/game/gameTypes';
import { resolveOverlays } from '@/game/overlays/registry';
import { getPreview } from './previewCache';
import styles from './MiniPreview.module.css';

interface MiniPreviewProps {
  variantId: string;
}

const MAX_PREVIEW_WIDTH = 220;
const MAX_PREVIEW_HEIGHT = 120;
// `size` is the cell area only; the board's `.grid` adds a 3px border outside it
// (see Board.module.css). Include that border on every side so the scaled board's
// full footprint fits inside the clip region instead of being cut off.
const BOARD_BORDER = 3;

function getPreviewScale(width: number, height: number): number {
  return Math.min(1, MAX_PREVIEW_WIDTH / width, MAX_PREVIEW_HEIGHT / height);
}

export function MiniPreview({ variantId }: MiniPreviewProps) {
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const preview = getPreview(variantId);
  const footprintWidth = preview.size.w + BOARD_BORDER * 2;
  const footprintHeight = preview.size.h + BOARD_BORDER * 2;
  const scale = getPreviewScale(footprintWidth, footprintHeight);
  const overlays = resolveOverlays(preview.variant.overlayIds ?? []).map((Overlay, index) => (
    <Overlay
      key={`${preview.variant.id}-preview-overlay-${index}`}
      rects={preview.rects}
      structure={preview.structure}
    />
  ));
  const grid: GridInteraction = {
    cellState(id: CellId): CellState {
      return {
        value: preview.givens.get(id),
        candidates: [],
        given: preview.givens.has(id),
        selected: false,
        conflict: false,
      };
    },
    cellProps(id: CellId) {
      return { 'data-cell': id };
    },
    announcerRef,
  };

  return (
    <div className={styles.previewClip} aria-hidden="true">
      <div
        className={styles.previewViewport}
        style={{
          width: footprintWidth * scale,
          height: footprintHeight * scale,
        }}
      >
        <div
          className={styles.previewScale}
          style={{
            width: footprintWidth,
            height: footprintHeight,
            transform: `scale(${scale})`,
          }}
        >
          <Board
            variant={preview.variant}
            cells={preview.cells}
            rects={preview.rects}
            size={preview.size}
            gutters={preview.gutters}
            overlays={overlays}
            grid={grid}
            renderSymbol={preview.renderSymbol}
          />
        </div>
      </div>
    </div>
  );
}
