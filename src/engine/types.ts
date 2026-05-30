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

export interface VariantModel {
  cells: Cell[];
  houses: House[];
  constraints: Constraint[];
  symbols: SymbolValue[];
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

export type BoardLayout = GridLayout;

export interface Variant {
  id: string;
  name: string;
  difficulty: Difficulty;
  layout: BoardLayout;
  symbols: SymbolValue[];
  constraintIds: string[];
}
