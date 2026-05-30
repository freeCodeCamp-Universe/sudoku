import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  it('should render an aria-live polite region', () => {
    render(<LiveRegion ref={createRef()} />);
    const element = screen.getByRole('status');

    expect(element).toBeTruthy();
    expect(element).toHaveAttribute('aria-atomic', 'true');
  });

  it('should be visually hidden', () => {
    render(<LiveRegion ref={createRef()} />);
    const element = screen.getByRole('status');

    expect(element.className).toContain('srOnly');
  });

  it('should forward the ref to the DOM element', () => {
    const ref = createRef<HTMLDivElement>();

    render(<LiveRegion ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
