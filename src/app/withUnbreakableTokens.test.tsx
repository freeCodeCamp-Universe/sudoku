import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { withUnbreakableTokens } from './withUnbreakableTokens';

function renderTokens(text: string) {
  return render(<p data-testid="text">{withUnbreakableTokens(text)}</p>);
}

describe('withUnbreakableTokens', () => {
  it('should wrap digit ranges with an en dash in a no-wrap span', () => {
    renderTokens('Fill with each of the digits 1–9.');

    expect(screen.getByText('1–9').tagName).toBe('SPAN');
  });

  it('should wrap dimension tokens in a no-wrap span', () => {
    renderTokens('A 9×9 grid split into 3×3 boxes.');

    expect(screen.getByText('9×9').tagName).toBe('SPAN');
    expect(screen.getByText('3×3').tagName).toBe('SPAN');
  });

  it('should wrap letter ranges in a no-wrap span', () => {
    renderTokens('Uses digits 1–9 and letters A–G.');

    expect(screen.getByText('A–G').tagName).toBe('SPAN');
  });

  it('should wrap multi-digit dimensions in a no-wrap span', () => {
    renderTokens('A butterfly shape on a 12×12 board.');

    expect(screen.getByText('12×12').tagName).toBe('SPAN');
  });

  it('should leave hyphenated words to wrap normally', () => {
    renderTokens('A pinwheel-shaped extra region.');

    expect(screen.queryByText('pinwheel-shaped')).toBeNull();
    expect(screen.getByTestId('text')).toHaveTextContent('A pinwheel-shaped extra region.');
  });

  it('should preserve the full text content', () => {
    renderTokens('The classic 9×9 puzzle with digits 1–9.');

    expect(screen.getByTestId('text')).toHaveTextContent('The classic 9×9 puzzle with digits 1–9.');
  });
});
