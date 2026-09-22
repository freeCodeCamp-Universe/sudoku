import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingState } from '@/learn/LoadingState/LoadingState';

describe('LoadingState', () => {
  it('should expose the loading status with its accessible label', () => {
    render(<LoadingState label="Loading course" />);

    expect(screen.getByRole('status', { name: 'Loading course' })).toBeInTheDocument();
    expect(screen.getByText('Loading course...')).toHaveClass('sr-only');
  });
});
