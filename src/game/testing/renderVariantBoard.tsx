import { render, screen } from '@testing-library/react';
import type { CellId, SymbolValue, Variant, VariantModel } from '@/engine/types';
import type { CellState } from '@/game/gameTypes';
import { Board } from '@/game/Board';
import { makeFixture, type Fixture } from './makeFixture';

interface CellRenderState {
  value?: SymbolValue;
  candidates: SymbolValue[];
  given: boolean;
  selected: boolean;
  conflict: boolean;
  correct?: boolean;
  sameValue?: boolean;
  peer?: boolean;
  revealed?: boolean;
}

export interface RenderVariantBoardOptions {
  fixture?: Fixture;
  cellState?: (id: CellId) => Partial<CellRenderState>;
  renderSymbol?: (value: SymbolValue) => string;
  parityMap?: Map<CellId, 0 | 1>;
  structure?: unknown;
  colorblindMode?: boolean;
}

function defaultCellState(): CellState {
  return {
    candidates: [],
    given: false,
    selected: false,
    conflict: false,
  };
}

export function renderVariantBoard(
  variant: Variant,
  options: RenderVariantBoardOptions = {}
): { model: VariantModel; getCell: (id: CellId) => HTMLElement } {
  const fixture = options.fixture ?? makeFixture(variant);
  const structure = options.structure ?? fixture.structure;
  const renderSymbol =
    options.renderSymbol ??
    ((value: SymbolValue) =>
      variant.renderSymbol ? variant.renderSymbol(value, structure) : String(value));

  render(
    <Board
      variant={variant}
      cells={fixture.model.cells}
      rects={fixture.rects}
      size={fixture.size}
      grid={{
        cellState: (id: CellId) => ({ ...defaultCellState(), ...options.cellState?.(id) }),
        cellProps: (id: CellId) => ({ 'data-cell': id, onClick: () => {} }),
        announcerRef: { current: null },
        announce: () => {},
      }}
      renderSymbol={renderSymbol}
      parityMap={options.parityMap ?? fixture.parityMap}
      colorblindMode={options.colorblindMode ?? false}
    />
  );

  function getCell(id: CellId): HTMLElement {
    const cell = screen
      .getAllByRole('gridcell')
      .find((node) => node.getAttribute('data-cell') === id);

    if (!cell) {
      throw new Error(`No gridcell with data-cell="${id}"`);
    }

    return cell;
  }

  return {
    model: fixture.model,
    getCell,
  };
}
