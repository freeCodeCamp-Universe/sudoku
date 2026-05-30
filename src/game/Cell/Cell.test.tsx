import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cell } from './Cell';

const baseProps = {
  id: 'r0c0',
  value: undefined as number | undefined,
  candidates: [] as number[],
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
});
