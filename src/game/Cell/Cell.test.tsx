import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cell } from './Cell';

const baseProps = {
  id: 'r0c0',
  value: undefined as number | undefined,
  candidates: [] as number[],
  symbols: [1, 2, 3, 4, 5, 6, 7, 8, 9] as number[],
  given: false,
  selected: false,
  conflict: false,
  onClick: () => {},
  renderSymbol: (value: number) => String(value),
};

describe('Cell', () => {
  it('should render empty when no value and no candidates', () => {
    render(<Cell {...baseProps} />);

    expect(screen.getByRole('gridcell')).toBeTruthy();
  });

  it('should render the value when provided', () => {
    render(<Cell {...baseProps} value={7} />);

    expect(screen.getByText('7')).toBeTruthy();
  });

  it('should apply the given modifier when given=true', () => {
    render(<Cell {...baseProps} value={3} given />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-given', 'true');
  });

  it('should apply the selected modifier when selected=true', () => {
    render(<Cell {...baseProps} selected />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-selected', 'true');
  });

  it('should apply the conflict modifier when conflict=true', () => {
    render(<Cell {...baseProps} value={5} conflict />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-conflict', 'true');
  });

  it('should apply the correct modifier when correct=true', () => {
    render(<Cell {...baseProps} value={5} correct />);

    const cell = screen.getByRole('gridcell');
    expect(cell).toHaveAttribute('data-correct', 'true');
    expect(cell).not.toHaveAttribute('data-incorrect');
  });

  it('should apply the incorrect modifier when correct=false', () => {
    render(<Cell {...baseProps} value={5} correct={false} />);

    const cell = screen.getByRole('gridcell');
    expect(cell).toHaveAttribute('data-incorrect', 'true');
    expect(cell).not.toHaveAttribute('data-correct');
  });

  it('should apply neither correctness modifier when correct is undefined', () => {
    render(<Cell {...baseProps} value={5} />);

    const cell = screen.getByRole('gridcell');
    expect(cell).not.toHaveAttribute('data-correct');
    expect(cell).not.toHaveAttribute('data-incorrect');
  });

  it('should apply the same-value modifier when sameValue=true', () => {
    render(<Cell {...baseProps} value={5} sameValue />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-same-value', 'true');
  });

  it('should not apply the same-value modifier by default', () => {
    render(<Cell {...baseProps} value={5} />);

    expect(screen.getByRole('gridcell')).not.toHaveAttribute('data-same-value');
  });

  it('should apply the peer modifier when peer=true', () => {
    render(<Cell {...baseProps} peer />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-peer', 'true');
  });

  it('should apply the even modifier when even=true', () => {
    render(<Cell {...baseProps} even />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-even', 'true');
  });

  it('should apply the odd modifier when odd=true', () => {
    render(<Cell {...baseProps} odd />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-odd', 'true');
  });

  it('should not apply the peer modifier by default', () => {
    render(<Cell {...baseProps} />);

    expect(screen.getByRole('gridcell')).not.toHaveAttribute('data-peer');
  });

  it('should render candidates as pencil marks when no value present', () => {
    render(<Cell {...baseProps} candidates={[1, 3, 7]} />);

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Cell {...baseProps} onClick={onClick} />);

    await user.click(screen.getByRole('gridcell'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should expose data-cell attribute with the cell id', () => {
    render(<Cell {...baseProps} id="r4c5" />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('data-cell', 'r4c5');
  });

  it('should not render any marker gap when markerEdges is absent', () => {
    render(<Cell {...baseProps} />);

    expect(screen.queryAllByTestId('marker-gap')).toHaveLength(0);
  });

  it('should render one marker gap per edge with the matching data-edge', () => {
    render(<Cell {...baseProps} markerEdges={['inline-end', 'block-start']} />);

    const gaps = screen.getAllByTestId('marker-gap');
    expect(gaps).toHaveLength(2);
    expect(gaps.map((gap) => gap.getAttribute('data-edge'))).toEqual(['inline-end', 'block-start']);
  });

  describe('Cell with symbolKind color', () => {
    const colorProps = {
      ...baseProps,
      value: 3 as number,
      renderSymbol: (_value: number) => '#d4a828',
      symbolKind: 'color' as const,
      colorblind: true,
      'aria-label': 'Yellow, row 1, column 1',
    };

    it('should render a color chip element when symbolKind is color', () => {
      render(<Cell {...colorProps} />);

      expect(screen.getByTestId('cell-color-chip')).toBeTruthy();
    });

    it('should render a visible numeric label alongside the color chip', () => {
      render(<Cell {...colorProps} />);

      expect(screen.getByText('3')).toBeTruthy();
    });

    it('should set the chip background to the color returned by renderSymbol', () => {
      render(<Cell {...colorProps} />);

      expect(screen.getByTestId('cell-color-chip')).toHaveStyle({ background: '#d4a828' });
    });

    it('should render a given dot when a color cell is given', () => {
      render(<Cell {...colorProps} given />);

      expect(screen.getByTestId('cell-given-dot')).toBeTruthy();
    });

    it('should not render a given dot when a color cell is not given', () => {
      render(<Cell {...colorProps} />);

      expect(screen.queryByTestId('cell-given-dot')).toBeNull();
    });

    it('should not render a color chip for symbolKind digit', () => {
      render(<Cell {...colorProps} symbolKind="digit" renderSymbol={(value) => String(value)} />);

      expect(screen.queryByTestId('cell-color-chip')).toBeNull();
    });
  });

  it('should render the warning icon when conflict is true', () => {
    render(<Cell {...baseProps} value={5} conflict />);

    expect(screen.getByRole('gridcell').querySelector('svg')).toBeTruthy();
  });

  it('should render the warning icon when correct is false', () => {
    render(<Cell {...baseProps} value={5} correct={false} />);

    expect(screen.getByRole('gridcell').querySelector('svg')).toBeTruthy();
  });

  it('should render only one warning icon when both conflict and correct are false', () => {
    render(<Cell {...baseProps} value={5} conflict correct={false} />);

    expect(screen.getByRole('gridcell').querySelectorAll('svg')).toHaveLength(1);
  });

  it('should not render a warning icon when there is no conflict and correct is undefined', () => {
    render(<Cell {...baseProps} value={5} />);

    expect(screen.getByRole('gridcell').querySelector('svg')).toBeNull();
  });

  it('should not render a warning icon when correct is true', () => {
    render(<Cell {...baseProps} value={5} correct />);

    expect(screen.getByRole('gridcell').querySelector('svg')).toBeNull();
  });

  it('should render all available candidate slots for a 4x4 board', () => {
    render(<Cell {...baseProps} symbols={[1, 2, 3, 4]} candidates={[1, 4]} />);

    expect(screen.getAllByTestId('candidate-mark')).toHaveLength(4);
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });
});
