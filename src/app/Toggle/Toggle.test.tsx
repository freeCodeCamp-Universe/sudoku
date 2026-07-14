import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('should render an accessible switch with the provided label', () => {
    render(<Toggle label="Show numbers" checked={false} onChange={() => {}} />);

    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeTruthy();
  });

  it('should reflect the checked state', () => {
    render(<Toggle label="Show numbers" checked={true} onChange={() => {}} />);

    expect(screen.getByRole('switch', { name: 'Show numbers' })).toBeChecked();
  });

  it('should call onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Toggle label="Show numbers" checked={false} onChange={onChange} />);

    await user.click(screen.getByRole('switch', { name: 'Show numbers' }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
