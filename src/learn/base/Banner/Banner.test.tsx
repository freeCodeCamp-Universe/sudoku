import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Banner } from '@/learn/base/Banner/Banner';

describe('Banner', () => {
  it('should render children', () => {
    render(<Banner>Important notice</Banner>);
    expect(screen.getByText('Important notice')).toBeDefined();
  });

  it('should render with the "Notice" accessible label', () => {
    render(<Banner>Notice</Banner>);
    expect(screen.getByRole('complementary', { name: 'Notice' })).toBeDefined();
  });

  it('should render a dismiss button by default', () => {
    render(<Banner onDismiss={() => {}}>Notice</Banner>);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDefined();
  });

  it('should not render a dismiss button when dismissible is false', () => {
    render(<Banner dismissible={false}>Notice</Banner>);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();
  });

  it('should call onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<Banner onDismiss={onDismiss}>Notice</Banner>);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
