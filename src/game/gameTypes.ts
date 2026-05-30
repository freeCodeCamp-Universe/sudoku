import type React from 'react';
import type { Cell, CellId, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';

export type Rect = { x: number; y: number; w: number; h: number };
export type Size = { w: number; h: number };

export interface GutterCell {
  id: string;
  row?: number;
  col?: number;
  label: string;
}

export interface GutterSlots {
  top?: GutterCell[];
  bottom?: GutterCell[];
  start?: GutterCell[];
  end?: GutterCell[];
}

export interface LayoutStrategy {
  cellRects(variant: Variant): Map<CellId, Rect>;
  canvasSize(variant: Variant): Size;
  gutters?(variant: Variant): GutterSlots;
}

export interface CellState {
  value?: SymbolValue;
  candidates: SymbolValue[];
  given: boolean;
  selected: boolean;
  conflict: boolean;
}

export interface GridInteraction {
  cellState(id: CellId): CellState;
  cellProps(id: CellId): React.HTMLAttributes<HTMLDivElement> & { 'data-cell': CellId };
  announcerRef: React.RefObject<HTMLDivElement | null>;
}

export interface BoardProps {
  cells: Cell[];
  rects: Map<CellId, Rect>;
  size: Size;
  gutters?: GutterSlots;
  overlays?: React.ReactNode[];
  grid: GridInteraction;
  renderSymbol: (value: SymbolValue) => string;
}

export interface AnnotatorContext {
  values: Values;
  model: VariantModel;
  cellState(id: CellId): CellState;
}

export interface CellAnnotator {
  id: string;
  describe(cellId: CellId, ctx: AnnotatorContext): string | null;
}

export type GameEvent =
  | { type: 'houseComplete'; cells: CellId[]; message?: string }
  | { type: 'conflict'; cells: CellId[]; message?: string }
  | { type: 'solved'; cells?: CellId[]; message?: string }
  | { type: string & {}; cells?: CellId[]; message?: string };

export type OverlayComponent = (props: {
  rects: Map<CellId, Rect>;
  structure: unknown;
}) => React.ReactNode;
