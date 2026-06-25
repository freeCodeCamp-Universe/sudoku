import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingDialog } from './OnboardingDialog';

describe('OnboardingDialog', () => {
  it('should render the title and settings when open', () => {
    render(<OnboardingDialog open onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: "Hint: it's customizable", level: 2 })).toBeTruthy();
    expect(screen.getByText(/gear icon/)).toBeTruthy();
    expect(screen.getByText('Check answers')).toBeTruthy();
    expect(screen.getByText('Timer')).toBeTruthy();
    expect(screen.getByText('Highlight peers')).toBeTruthy();
  });

  it('should call onClose when Got it is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<OnboardingDialog open onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Got it' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should expose an accessible dialog name through aria-labelledby', () => {
    render(<OnboardingDialog open onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog', { name: "Hint: it's customizable" });
    const labelledBy = dialog.getAttribute('aria-labelledby');
    const title = screen.getByRole('heading', { name: "Hint: it's customizable", level: 2 });

    expect(dialog).toHaveAccessibleName("Hint: it's customizable");
    expect(labelledBy).toBeTruthy();
    expect(title.id).toBe(labelledBy);
  });
});
