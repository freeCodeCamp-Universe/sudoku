import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModeSwitcher } from './ModeSwitcher';

describe('ModeSwitcher', () => {
  it('should expose pressed states for Normal mode', () => {
    render(<ModeSwitcher candidateMode={false} onToggle={() => {}} />);

    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Candidate' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('should expose pressed states for Candidate mode', () => {
    render(<ModeSwitcher candidateMode onToggle={() => {}} />);

    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Candidate' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('should call onToggle when Candidate is clicked from Normal mode', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<ModeSwitcher candidateMode={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Candidate' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should not call onToggle when Normal is clicked from Normal mode', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<ModeSwitcher candidateMode={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Normal' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should call onToggle when Normal is clicked from Candidate mode', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<ModeSwitcher candidateMode onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Normal' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should not call onToggle when Candidate is clicked from Candidate mode', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<ModeSwitcher candidateMode onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Candidate' }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should expose the switcher as an Input mode group', () => {
    render(<ModeSwitcher candidateMode={false} onToggle={() => {}} />);

    expect(screen.getByRole('group', { name: 'Input mode' })).toBeTruthy();
  });
});
