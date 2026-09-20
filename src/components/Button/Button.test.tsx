import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('should render a native button by default', () => {
    render(<Button>New Game</Button>);

    expect(screen.getByRole('button', { name: 'New Game' })).toHaveAttribute('type', 'button');
  });

  it('should render an internal link when href is provided', () => {
    render(
      <MemoryRouter>
        <Button href="/classic" variant="cta">
          Play a puzzle
        </Button>
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Play a puzzle' })).toHaveAttribute('href', '/classic');
  });

  it('should render a new-tab anchor when target_blank is provided', () => {
    render(
      <Button href="https://example.com" target_blank>
        Visit site
      </Button>
    );

    expect(screen.getByRole('link', { name: 'Visit site' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(screen.getByRole('link', { name: 'Visit site' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Visit site' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    );
  });
});
