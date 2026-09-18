import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidePanel } from '@/learn/base/SidePanel/SidePanel';
import styles from '@/learn/base/SidePanel/SidePanel.module.css';

function renderSidePanel(overrides: Partial<Parameters<typeof SidePanel>[0]> = {}) {
  const props = {
    mode: 'sidebar' as const,
    open: true,
    onClose: vi.fn(),
    title: 'My Panel',
    id: 'my-panel',
    children: <p>Panel content</p>,
    ...overrides,
  };
  return { ...render(<SidePanel {...props} />), props };
}

describe('SidePanel', () => {
  describe('sidebar mode', () => {
    it('should render a nav landmark with children when open', () => {
      renderSidePanel({ mode: 'sidebar', open: true });

      expect(screen.getByRole('navigation', { name: 'My Panel' })).toBeInTheDocument();
      expect(screen.getByText('Panel content')).toBeInTheDocument();
    });

    it('should apply the open class when open is true', () => {
      renderSidePanel({ mode: 'sidebar', open: true });

      expect(screen.getByRole('navigation', { name: 'My Panel' })).toHaveClass(
        styles['sidebar-open']
      );
    });

    it('should not apply the open class when open is false', () => {
      renderSidePanel({ mode: 'sidebar', open: false });

      expect(screen.getByRole('navigation', { name: 'My Panel' })).not.toHaveClass(
        styles['sidebar-open']
      );
    });

    it('should use ariaLabel for the nav accessible name when provided', () => {
      renderSidePanel({ mode: 'sidebar', ariaLabel: 'Lesson outline' });

      expect(screen.getByRole('navigation', { name: 'Lesson outline' })).toBeInTheDocument();
    });

    it('should fall back to title for the nav accessible name when ariaLabel is not provided', () => {
      renderSidePanel({ mode: 'sidebar', ariaLabel: undefined });

      expect(screen.getByRole('navigation', { name: 'My Panel' })).toBeInTheDocument();
    });

    it('should not call onClose when an anchor inside the nav is clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderSidePanel({
        mode: 'sidebar',
        open: true,
        children: <a href="#section">Section link</a>,
      });

      await user.click(screen.getByRole('link', { name: 'Section link' }));

      expect(props.onClose).not.toHaveBeenCalled();
    });
  });

  describe('drawer mode', () => {
    it('should render a dialog with children when open', () => {
      renderSidePanel({ mode: 'drawer', open: true });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Panel content')).toBeInTheDocument();
    });

    it('should call onClose when an anchor inside the drawer body is clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderSidePanel({
        mode: 'drawer',
        open: true,
        children: <a href="#section">Section link</a>,
      });

      await user.click(screen.getByRole('link', { name: 'Section link' }));

      expect(props.onClose).toHaveBeenCalled();
    });

    it('should not call onClose when a non-anchor element inside the drawer body is clicked', async () => {
      const user = userEvent.setup();
      const { props } = renderSidePanel({
        mode: 'drawer',
        open: true,
        children: <span>Plain text</span>,
      });

      await user.click(screen.getByText('Plain text'));

      expect(props.onClose).not.toHaveBeenCalled();
    });
  });
});
