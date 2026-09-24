import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { InputModeTabs } from './InputModeTabs';

describe('InputModeTabs', () => {
  it('should switch between normal and candidate input modes', async () => {
    const user = userEvent.setup();
    function StatefulInputModeTabs() {
      const [activeId, setActiveId] = useState('normal');
      return <InputModeTabs activeId={activeId} onSelect={setActiveId} numberPad="Number pad" />;
    }
    render(<StatefulInputModeTabs />);

    await user.click(screen.getByRole('tab', { name: 'Candidate' }));

    expect(screen.getByRole('tab', { name: 'Candidate' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Candidate' })).toBeInTheDocument();
  });

  it('should move focus between tabs with arrow keys', async () => {
    const user = userEvent.setup();
    render(<InputModeTabs activeId="normal" onSelect={vi.fn()} numberPad="Number pad" />);

    await user.click(screen.getByRole('tab', { name: 'Normal' }));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Candidate' })).toHaveFocus();
  });

  it('should include extra tabs and render their associated panel', async () => {
    const user = userEvent.setup();
    function StatefulInputModeTabs() {
      const [activeId, setActiveId] = useState('normal');
      return (
        <InputModeTabs
          activeId={activeId}
          onSelect={setActiveId}
          numberPad="Number pad"
          extraTabs={[
            {
              tab: { id: 'controls', label: 'Controls', panelId: 'unused' },
              panel: 'Game controls',
            },
          ]}
        />
      );
    }
    render(<StatefulInputModeTabs />);

    await user.click(screen.getByRole('tab', { name: 'Controls' }));

    expect(screen.getByRole('tabpanel', { name: 'Controls' })).toHaveTextContent('Game controls');
  });

  it('should generate unique tab and panel ids for each instance', () => {
    render(
      <>
        <InputModeTabs activeId="normal" onSelect={vi.fn()} numberPad="First pad" />
        <InputModeTabs activeId="normal" onSelect={vi.fn()} numberPad="Second pad" />
      </>
    );

    const tabs = screen.getAllByRole('tab', { name: 'Normal' });
    const panels = screen.getAllByRole('tabpanel');
    expect(tabs[0].id).not.toBe(tabs[1].id);
    expect(tabs[0]).toHaveAttribute('aria-controls', panels[0].id);
    expect(tabs[1]).toHaveAttribute('aria-controls', panels[1].id);
  });
});
