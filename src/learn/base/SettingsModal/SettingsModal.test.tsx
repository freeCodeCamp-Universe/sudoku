import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ANIMATIONS_STORAGE_KEY } from '@/learn/hooks/useAnimationsPreference';
import { SHORTCUTS_STORAGE_KEY } from '@/learn/hooks/useShortcutsPreference';
import { THEME_STORAGE_KEY } from '@/hooks/use-theme';
import { SettingsModal } from '@/learn/base/SettingsModal/SettingsModal';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-reduced-motion');
});

describe('SettingsModal', () => {
  it('should move focus into the modal when it opens', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <button type="button">settings trigger</button>
        <SettingsModal open={false} onClose={() => {}} />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'settings trigger' }));
    rerender(
      <>
        <button type="button">settings trigger</button>
        <SettingsModal open onClose={() => {}} />
      </>
    );

    const close = screen.getByRole('button', { name: 'close settings' });
    const toggle = screen.getByRole('switch', { name: 'Enable dark theme' });
    expect(close).toHaveFocus();

    await user.tab();
    expect(toggle).toHaveFocus();
  });

  it('should render the settings descriptions when open', () => {
    render(<SettingsModal open onClose={() => {}} />);

    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('When on, the dark theme is used.')).toBeInTheDocument();
    expect(screen.getByText('When on, keyboard shortcuts are active.')).toBeInTheDocument();
    expect(
      screen.getByText('When on, animations and transitions are applied.')
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('switch').map((toggle) => toggle.parentElement?.textContent)
    ).toEqual(['Enable dark theme', 'Enable keyboard shortcuts', 'Enable animations']);
  });

  it('should toggle and persist the dark theme preference', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open onClose={() => {}} />);

    const toggle = screen.getByRole('switch', { name: 'Enable dark theme' });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should toggle and persist the animations preference', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open onClose={() => {}} />);

    const toggle = screen.getByRole('switch', { name: 'Enable animations' });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(localStorage.getItem(ANIMATIONS_STORAGE_KEY)).toBe('false');
    expect(document.documentElement).toHaveAttribute('data-reduced-motion');
  });

  it('should toggle and persist the shortcuts preference', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open onClose={() => {}} />);

    const toggle = screen.getByRole('switch', { name: 'Enable keyboard shortcuts' });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(localStorage.getItem(SHORTCUTS_STORAGE_KEY)).toBe('false');
  });

  it('should close through the close button', async () => {
    const user = userEvent.setup();
    let open = true;
    const { rerender } = render(
      <SettingsModal
        open={open}
        onClose={() => {
          open = false;
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'close settings' }));
    rerender(<SettingsModal open={open} onClose={() => {}} />);

    expect(screen.queryByRole('dialog', { name: 'Settings' })).toBeNull();
  });
});
