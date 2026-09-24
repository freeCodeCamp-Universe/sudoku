import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, type Tab } from './Tabs';

const tabs: Tab[] = [
  { id: 'normal', label: 'Normal', panelId: 'panel-input' },
  { id: 'candidate', label: 'Candidate', panelId: 'panel-input' },
  { id: 'controls', label: 'Controls', panelId: 'panel-controls' },
];

function renderTabs(activeId = 'normal', onSelect: (id: string) => void = vi.fn()) {
  render(<Tabs tabs={tabs} activeId={activeId} onSelect={onSelect} ariaLabel="Controls" />);
}

describe('Tabs', () => {
  it('should expose a tablist with one selected tab', () => {
    renderTabs('candidate');

    expect(screen.getByRole('tablist', { name: 'Controls' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Candidate' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Normal' })).toHaveAttribute('aria-selected', 'false');
  });

  it('should point each tab at its controlled panel', () => {
    renderTabs();

    expect(screen.getByRole('tab', { name: 'Normal' })).toHaveAttribute(
      'aria-controls',
      'panel-input'
    );
    expect(screen.getByRole('tab', { name: 'Controls' })).toHaveAttribute(
      'aria-controls',
      'panel-controls'
    );
  });

  it('should give only the selected tab a tab stop (roving tabindex)', () => {
    renderTabs('controls');

    expect(screen.getByRole('tab', { name: 'Controls' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Normal' })).toHaveAttribute('tabindex', '-1');
  });

  it('should call onSelect when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTabs('normal', onSelect);

    await user.click(screen.getByRole('tab', { name: 'Controls' }));

    expect(onSelect).toHaveBeenCalledWith('controls');
  });

  it('should move focus with arrow keys and wrap around', async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole('tab', { name: 'Normal' }));
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Candidate' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Controls' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Normal' })).toHaveFocus();
  });

  it('should activate a tab automatically when focus moves to it', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderTabs('normal', onSelect);

    await user.click(screen.getByRole('tab', { name: 'Normal' }));
    onSelect.mockClear();

    await user.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenCalledWith('candidate');

    await user.keyboard('{End}');
    expect(onSelect).toHaveBeenCalledWith('controls');

    await user.keyboard('{Home}');
    expect(onSelect).toHaveBeenCalledWith('normal');
  });

  it('should jump to first and last tab with Home and End', async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole('tab', { name: 'Normal' }));
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Controls' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Normal' })).toHaveFocus();
  });
});
