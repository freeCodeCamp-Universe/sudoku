import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '@/learn/features/Progress/Progress';

describe('Progress', () => {
  it('should provide visible and screen-reader completion text', () => {
    render(<Progress completed={3} total={12} />);

    expect(screen.getByText('3/12 lessons completed')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('3 out of 12 lessons completed')).toHaveClass('sr-only');
  });
});
