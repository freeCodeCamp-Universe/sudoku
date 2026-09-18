import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderInline } from '@/learn/features/Markdown/RenderInline';

function Wrapper({ text }: { text: string }) {
  return <span>{renderInline(text)}</span>;
}

describe('renderInline', () => {
  it('should render plain text unchanged', () => {
    render(<Wrapper text="hello world" />);
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('should render single-backtick spans as code', () => {
    render(<Wrapper text="Press `Esc` to exit" />);
    expect(screen.getByText('Esc').tagName).toBe('CODE');
  });

  it('should render double-backtick spans as code', () => {
    render(<Wrapper text="Type ``(`$`)`` in normal mode" />);
    expect(screen.getByText('(`$`)').tagName).toBe('CODE');
  });

  it('should render double-backtick spans that contain inner single backticks as code', () => {
    render(<Wrapper text="Use ``a`b`` as an example" />);
    expect(screen.getByText('a`b').tagName).toBe('CODE');
  });

  it('should render bold text', () => {
    render(<Wrapper text="Press **Enter** to confirm" />);
    expect(screen.getByText('Enter').tagName).toBe('STRONG');
  });

  it('should render italic text', () => {
    render(<Wrapper text="This is _important_" />);
    expect(screen.getByText('important').tagName).toBe('EM');
  });

  it('should render keyboard key tags', () => {
    render(<Wrapper text="Press <kbd>Enter</kbd> to confirm" />);
    expect(screen.getByText('Enter').tagName).toBe('KBD');
  });

  it('should render mixed inline markup in one string', () => {
    render(<Wrapper text="Press **Esc** then type `:wq` or ``ZZ``" />);
    expect(screen.getByText('Esc').tagName).toBe('STRONG');
    expect(screen.getByText(':wq').tagName).toBe('CODE');
    expect(screen.getByText('ZZ').tagName).toBe('CODE');
  });
});
