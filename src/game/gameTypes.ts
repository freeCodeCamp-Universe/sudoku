import type React from 'react';
import type { Cell, CellId, SymbolValue, Values, Variant, VariantModel } from '@/engine/types';

export type Rect = { x: number; y: number; w: number; h: number };
export type Size = { w: number; h: number };

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GutterCell {
  id: string;
  row?: number;
  col?: number;
  label: string;
  description?: string;
}

export interface GutterSlots {
  top?: GutterCell[];
  bottom?: GutterCell[];
  start?: GutterCell[];
  end?: GutterCell[];
}

export interface Cage {
  cells: CellId[];
  sum: number;
}

export interface Arrow {
  bulb: CellId;
  path: CellId[];
}

export interface EdgeClues {
  top: number[];
  bottom: number[];
  start: number[];
  end: number[];
}

export interface LayoutStrategy {
  baseCellSize(variant: Variant): number;
  cellRects(variant: Variant, cellSizeOverride?: number): Map<CellId, Rect>;
  canvasSize(variant: Variant, cellSizeOverride?: number): Size;
  gutters?(variant: Variant): GutterSlots;
}

export interface CellState {
  value?: SymbolValue;
  candidates: SymbolValue[];
  given: boolean;
  revealed?: boolean;
  selected: boolean;
  conflict: boolean;
  correct?: boolean;
  sameValue?: boolean;
  peer?: boolean;
}

export interface GridInteraction {
  cellState(id: CellId): CellState;
  cellProps(id: CellId): React.HTMLAttributes<HTMLDivElement> & { 'data-cell': CellId };
  describeCell(id: CellId): string;
  announcerRef: React.RefObject<HTMLDivElement | null>;
  announce: (message: string) => void;
  announceCellState: (id: CellId, nextValues: Values) => void;
  announceCandidateToggle: (id: CellId, value: SymbolValue, adding: boolean) => void;
  moveSelection(direction: Direction): void;
}

/**
 * A cell edge that carries an inter-cell marker (e.g. a greater-than triangle).
 * Cells with a marker edge paint a background-matched gap there so the grid
 * border appears to stop for the marker. Named in logical terms so the gap
 * tracks the column/row geometry under both writing directions.
 */
export type MarkerEdge = 'inline-start' | 'inline-end' | 'block-start' | 'block-end';

export interface BoardViewportState {
  active: boolean;
  transform: { scale: number; translateX: number; translateY: number };
  // Ease to the transform (programmatic moves) instead of jumping (gestures).
  animated: boolean;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown(e: React.PointerEvent): void;
  onPointerMove(e: React.PointerEvent): void;
  onPointerUp(e: React.PointerEvent): void;
}

export interface BoardProps {
  variant: Variant;
  cells: Cell[];
  rects: Map<CellId, Rect>;
  size: Size;
  gutters?: GutterSlots;
  overlays?: React.ReactNode[];
  grid: GridInteraction;
  renderSymbol: (value: SymbolValue) => string;
  // Order candidate slots are laid out in; defaults to variant.symbols.
  // Letter variants pass a shuffled order shared with the number pad so
  // candidate placement matches the pad without spelling the hidden word.
  displaySymbols?: SymbolValue[];
  markerGaps?: Map<CellId, MarkerEdge[]>;
  wordCells?: Set<CellId>;
  parityMap?: Map<CellId, 0 | 1>;
  viewport?: BoardViewportState;
  checkEnabled?: boolean;
  showColorLabel?: boolean;
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
