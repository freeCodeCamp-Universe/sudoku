import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from '@/learn/features/Markdown/Markdown';
import { renderMarkdown } from '@/learn/features/Markdown/renderMarkdown';

describe('Markdown', () => {
  it('should render headings at their markdown level', () => {
    render(<Markdown html={renderMarkdown('## Modes\n\n### Insert')} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Modes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Insert' })).toBeInTheDocument();
  });

  it('should add slug IDs to H2 and H3 headings', () => {
    render(<Markdown html={renderMarkdown('## Hello World\n\n### The `x` Command')} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'hello-world');
    expect(screen.getByRole('heading', { level: 3 })).toHaveAttribute('id', 'the-x-command');
  });

  it('should render an unordered list as list items', () => {
    render(<Markdown html={renderMarkdown('- first\n- second')} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('first');
    expect(items[1]).toHaveTextContent('second');
  });

  it('should render inline bold and code spans', () => {
    render(<Markdown html={renderMarkdown('Press **Esc** then type `:w`')} />);

    expect(screen.getByText('Esc').tagName).toBe('STRONG');
    expect(screen.getByText(':w').tagName).toBe('CODE');
  });

  it('should keep a fenced code block intact across its blank lines', () => {
    render(<Markdown html={renderMarkdown('```\nline one\n\nline two\n```')} />);

    expect(screen.getByText(/line one/)).toBeInTheDocument();
    expect(screen.getByText(/line two/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Copy code to clipboard' })
    ).not.toBeInTheDocument();
  });

  it('should render a copy button only when the fence uses the copy marker', () => {
    render(<Markdown html={renderMarkdown('```js copy\nconst value = 1;\n```')} />);

    expect(screen.getByRole('button', { name: 'Copy code to clipboard' })).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access -- language class has no semantic query equivalent
    expect(document.querySelector('code.language-js')).toBeInTheDocument();
  });

  it('should preserve no-copy as an ordinary annotation without enabling copying', () => {
    render(<Markdown html={renderMarkdown('```txt no-copy\nNo button.\n```')} />);

    expect(
      screen.queryByRole('button', { name: 'Copy code to clipboard' })
    ).not.toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-node-access -- language class has no semantic query equivalent
    expect(document.querySelector('code.language-txt')).toBeInTheDocument();
  });

  it('should render links with target blank and nofollow attributes', () => {
    render(<Markdown html={renderMarkdown('[Course docs](https://example.com/docs)')} />);

    const link = screen.getByRole('link', { name: 'Course docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'nofollow noopener noreferrer');
  });

  it('should render links with a title attribute when one is provided', () => {
    render(
      <Markdown
        html={renderMarkdown('[Course docs](https://example.com/docs "Course reference")')}
      />
    );

    const link = screen.getByRole('link', { name: 'Course docs' });
    expect(link).toHaveAttribute('title', 'Course reference');
  });

  it('should render table headers and cells', () => {
    render(
      <Markdown html={renderMarkdown('| Command | Mode |\n| --- | --- |\n| `i` | Insert |')} />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Command' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Mode' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Insert' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'i' })).toBeInTheDocument();
  });
});
