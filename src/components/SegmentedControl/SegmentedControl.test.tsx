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

  it('should move focus with the arrow keys without selecting, wrapping at the ends', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="expert" onChange={onChange} />
    );

    screen.getByRole('radio', { name: 'Expert' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Easy' })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should jump focus to the first and last option with Home and End, without selecting', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={onChange} />
    );

    screen.getByRole('radio', { name: 'Medium' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: 'Expert' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: 'Easy' })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should commit the focused option with Space or Enter, but not before', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={onChange} />
    );

    screen.getByRole('radio', { name: 'Medium' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith('expert');
  });

  it('should move the roving tabindex to the focused option, not just the checked one', async () => {
    const user = userEvent.setup();
    render(
      <SegmentedControl ariaLabel="Mode" options={OPTIONS} value="medium" onChange={() => {}} />
    );

    screen.getByRole('radio', { name: 'Medium' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Easy' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: 'Medium' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: 'Expert' })).toHaveAttribute('tabindex', '0');
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
