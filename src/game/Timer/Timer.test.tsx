import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Timer } from './Timer';

describe('Timer', () => {
  it('should render 0:00 for zero elapsed seconds', () => {
    render(<Timer elapsedSeconds={0} running={false} visible />);

    expect(screen.getByText('0:00')).toBeTruthy();
  });

  it('should format minutes and seconds correctly', () => {
    render(<Timer elapsedSeconds={125} running={false} visible />);

    expect(screen.getByText('2:05')).toBeTruthy();
  });

  it('should be hidden when visible=false', () => {
    render(<Timer elapsedSeconds={0} running={false} visible={false} />);

    expect(screen.getByText('0:00')).toHaveAttribute('data-hidden', 'true');
  });

  it('should not render a pause button without an onTogglePause handler', () => {
    render(<Timer elapsedSeconds={0} running visible />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should render a Pause game button while running', () => {
    render(<Timer elapsedSeconds={0} running visible onTogglePause={() => {}} />);

    expect(screen.getByRole('button', { name: 'Pause game' })).toBeTruthy();
  });

  it('should render a Resume game button while paused', () => {
    render(<Timer elapsedSeconds={0} running={false} visible paused onTogglePause={() => {}} />);

    expect(screen.getByRole('button', { name: 'Resume game' })).toBeTruthy();
  });

  it('should call onTogglePause when the button is clicked', async () => {
    const user = userEvent.setup();
    const onTogglePause = vi.fn();
    render(<Timer elapsedSeconds={0} running visible onTogglePause={onTogglePause} />);

    await user.click(screen.getByRole('button', { name: 'Pause game' }));

    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });
});
