import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KbdCombo } from '@/app/KbdCombo/KbdCombo';

describe('KbdCombo', () => {
  it('should render each key as a kbd chip', () => {
    render(<KbdCombo keys={['Alt', 'K']} />);

    // On non-Mac (test env), Alt stays 'Alt'.
    expect(screen.getByText('Alt', { selector: 'kbd' })).toBeInTheDocument();
    expect(screen.getByText('K', { selector: 'kbd' })).toBeInTheDocument();
  });

  it('should render a + separator between ASCII keys', () => {
    render(<KbdCombo keys={['Alt', 'K']} />);

    // On non-Mac (test env), Alt stays 'Alt' — an ASCII word, so + is shown.
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('should resolve Alt to the platform alt label', () => {
    render(<KbdCombo keys={['Alt']} />);

    expect(screen.getByText(/^(Alt|⌥)$/, { selector: 'kbd' })).toBeInTheDocument();
  });

  it('should resolve Cmd to the platform modifier label', () => {
    render(<KbdCombo keys={['Cmd']} />);

    expect(screen.getByText(/^(⌘|Ctrl)$/, { selector: 'kbd' })).toBeInTheDocument();
  });

  it('should pass through unresolved keys unchanged', () => {
    render(<KbdCombo keys={['Enter']} />);

    expect(screen.getByText('Enter', { selector: 'kbd' })).toBeInTheDocument();
  });

  it('should suppress the + separator when the preceding key is a non-ASCII symbol by default', () => {
    // ⌥ is a single non-ASCII char; the separator is intentionally omitted so
    // it runs into the next key following macOS convention.
    render(<KbdCombo keys={['⌥', 'K']} />);

    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('should apply kbd-square to a single-character key', () => {
    render(<KbdCombo keys={['/']} />);

    expect(screen.getByText('/', { selector: 'kbd' }).className).toContain('kbd-square');
  });

  it('should not apply kbd-square to a multi-character key', () => {
    render(<KbdCombo keys={['Alt']} />);

    expect(screen.getByText('Alt', { selector: 'kbd' }).className).not.toContain('kbd-square');
  });

  it('should always render the + separator when separateAll is true', () => {
    render(<KbdCombo keys={['⌥', 'K']} separateAll />);

    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('should render a custom separator', () => {
    render(<KbdCombo keys={['Backspace', 'Delete']} separator="or" />);

    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('should omit separators when requested', () => {
    render(<KbdCombo keys={['↑', '↓']} showSeparators={false} />);

    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });
});
