import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
});
