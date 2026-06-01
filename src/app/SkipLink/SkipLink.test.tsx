import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('should render a link to the main content', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });

    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('should apply the skip link class', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });

    expect(link.className).toContain('skipLink');
  });
});
