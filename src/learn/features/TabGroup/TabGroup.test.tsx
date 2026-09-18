import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabGroup } from '@/learn/features/TabGroup/TabGroup';
import type { Tab } from '@/learn/features/TabGroup/TabGroup';

const tabs: Tab[] = [
  { name: 'config.json', language: 'json', content: '{ "key": "value" }' },
  { name: 'styles.css', language: 'css', content: 'body { color: red; }' },
  { name: 'index.html', language: 'html', content: '<h1>Hello</h1>' },
];

describe('TabGroup', () => {
  it('should render all tab buttons in a tablist', () => {
    render(<TabGroup tabs={tabs} />);

    const tablist = screen.getByRole('tablist', { name: 'File tabs' });
    expect(tablist).toBeTruthy();

    const tabButtons = screen.getAllByRole('tab');
    expect(tabButtons).toHaveLength(3);
    expect(tabButtons[0]).toHaveTextContent('config.json');
    expect(tabButtons[1]).toHaveTextContent('styles.css');
    expect(tabButtons[2]).toHaveTextContent('index.html');
  });

  it('should show the first tab panel by default', () => {
    render(<TabGroup tabs={tabs} />);

    const panels = screen.getAllByRole('tabpanel');
    expect(panels).toHaveLength(1);
    expect(panels[0]).toHaveTextContent('{ "key": "value" }');
  });

  it('should mark the first tab as selected', () => {
    render(<TabGroup tabs={tabs} />);

    const tabButtons = screen.getAllByRole('tab');
    expect(tabButtons[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabButtons[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('should switch panels on tab click', async () => {
    const user = userEvent.setup();
    render(<TabGroup tabs={tabs} />);

    await user.click(screen.getByRole('tab', { name: 'styles.css' }));

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('body { color: red; }');
    expect(screen.getByRole('tab', { name: 'styles.css' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('should navigate tabs with ArrowRight', async () => {
    const user = userEvent.setup();
    render(<TabGroup tabs={tabs} />);

    screen.getByRole('tab', { name: 'config.json' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'styles.css' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('body { color: red; }');
  });

  it('should navigate tabs with ArrowLeft and wrap around', async () => {
    const user = userEvent.setup();
    render(<TabGroup tabs={tabs} />);

    screen.getByRole('tab', { name: 'config.json' }).focus();
    await user.keyboard('{ArrowLeft}');

    expect(screen.getByRole('tab', { name: 'index.html' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('<h1>Hello</h1>');
  });

  it('should navigate to first tab on Home', async () => {
    const user = userEvent.setup();
    render(<TabGroup tabs={tabs} />);

    await user.click(screen.getByRole('tab', { name: 'index.html' }));
    await user.keyboard('{Home}');

    expect(screen.getByRole('tab', { name: 'config.json' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('{ "key": "value" }');
  });

  it('should navigate to last tab on End', async () => {
    const user = userEvent.setup();
    render(<TabGroup tabs={tabs} />);

    screen.getByRole('tab', { name: 'config.json' }).focus();
    await user.keyboard('{End}');

    expect(screen.getByRole('tab', { name: 'index.html' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('<h1>Hello</h1>');
  });

  it('should set aria-controls linking tab to its panel', () => {
    render(<TabGroup tabs={tabs} />);

    const activeTab = screen.getByRole('tab', { name: 'config.json' });
    const panel = screen.getByRole('tabpanel');

    expect(activeTab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(activeTab.id);
  });

  it('should render content in a pre > code element', () => {
    render(<TabGroup tabs={tabs} />);

    const panel = screen.getByRole('tabpanel');
    const code = within(panel).getByText('{ "key": "value" }');

    expect(code.tagName).toBe('CODE');
    expect(code.parentElement?.tagName).toBe('PRE');
  });
});
