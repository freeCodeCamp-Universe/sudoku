import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'expert', label: 'Expert' },
] as const;

describe('SegmentedControl', () => {
  it('should render an accessible radiogroup with one radio per option', () => {
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={() => {}} />
    );

    expect(screen.getByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Easy' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Expert' })).toBeInTheDocument();
  });

  it('should mark only the current value as checked', () => {
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="expert" onChange={() => {}} />
    );

    expect(screen.getByRole('radio', { name: 'Easy' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Medium' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Expert' })).toBeChecked();
  });

  it('should call onChange with the clicked option value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={onChange} />
    );

    await user.click(screen.getByRole('radio', { name: 'Expert' }));

    expect(onChange).toHaveBeenCalledWith('expert');
  });

  it('should only put the checked option in the tab order', () => {
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={() => {}} />
    );

    expect(screen.getByRole('radio', { name: 'Easy' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: 'Medium' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Expert' })).toHaveAttribute('tabindex', '-1');
  });

  it('should move selection with the arrow keys, wrapping at the ends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="expert" onChange={onChange} />
    );

    screen.getByRole('radio', { name: 'Expert' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith('easy');
  });

  it('should jump to the first and last option with Home and End', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={onChange} />
    );

    screen.getByRole('radio', { name: 'Medium' }).focus();
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('expert');

    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('easy');
  });

  it('should not call onChange when clicking the already-selected option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={onChange} />
    );

    await user.click(screen.getByRole('radio', { name: 'Medium' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
