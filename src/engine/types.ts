export type CellId = string;
export type SymbolValue = number;

export interface Cell {
  id: CellId;
  row: number;
  col: number;
  grid?: number;
}

export type Values = Map<CellId, SymbolValue>;

export interface House {
  id: string;
  cells: CellId[];
}

export interface Conflict {
  cells: CellId[];
  constraintId: string;
}

export interface HelpRule {
  term: string;
  text: string;
}

export interface HelpSection {
  label: string;
  tone: 'basic' | 'extra';
  rules: HelpRule[];
}

export interface VariantModel {
  cells: Cell[];
  houses: House[];
  constraints: Constraint[];
  symbols: SymbolValue[];
  structure?: unknown;
  peerHouseFilter?: (house: House) => boolean;
  generateSolution?: (model: VariantModel, rng?: () => number) => Solution;
  generateGivens?: (
    solution: Solution,
    model: VariantModel,
    difficulty: Difficulty,
    rng?: () => number
  ) => Values;
  minimumClues?: number;
}

export interface Constraint {
  id: string;
  conflicts(values: Values, model: VariantModel): Conflict[];
  permits?(values: Values, cellId: CellId, value: SymbolValue, model: VariantModel): boolean;
}

export type Solution = Values;
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GridLayout {
  kind: 'grid';
  size: number;
  box: { rows: number; cols: number };
}

export interface MultiGridLayout {
  kind: 'multigrid';
  subGridSize: number;
  box: { rows: number; cols: number };
  canvasRows: number;
  canvasCols: number;
  subGrids: { originRow: number; originCol: number }[];
}

export interface TriangularLayout {
  kind: 'triangular';
  size: number;
}

export type BoardLayout = GridLayout | MultiGridLayout | TriangularLayout;

export interface Variant {
  id: string;
  name: string;
  description: string;
  help?: HelpSection[];
  popularity: number;
  difficulty: Difficulty;
  layout: BoardLayout;
  symbols: SymbolValue[];
  symbolKind?: 'digit' | 'letter' | 'color';
  constraintIds: string[];
  buildHouses?: (layout: BoardLayout) => House[];
  extraHouses?: (layout: BoardLayout) => House[];
  overlayIds?: string[];
  annotatorIds?: string[];
  peerHouseFilter?: (house: House) => boolean;
  deriveStructure?: (solution: Solution, model: VariantModel) => unknown;
  deriveGutters?: (structure: unknown) => import('@/game/gameTypes').GutterSlots | undefined;
  renderSymbol?: (value: SymbolValue, structure?: unknown) => string;
  generateSolution?: (model: VariantModel, rng?: () => number) => Solution;
  generateGivens?: (
    solution: Solution,
    model: VariantModel,
    difficulty: Difficulty,
    rng?: () => number
  ) => Values;
  minimumClues?: number;
  solve?: (model: VariantModel, given: Values, opts?: { max?: number }) => Solution[];
}
