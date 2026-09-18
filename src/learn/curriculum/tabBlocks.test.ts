import { describe, expect, it } from 'vitest';
import { parseInstructionSegments, hasTabBlocks } from '@/learn/curriculum/tabBlocks';

const PATH = './test/lesson.md';

describe('parseInstructionSegments', () => {
  it('should return a single markdown segment when no tab blocks exist', () => {
    const source = 'Some **markdown** content.\n\nAnother paragraph.';
    const result = parseInstructionSegments(source, PATH);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      kind: 'markdown',
      content: 'Some **markdown** content.\n\nAnother paragraph.',
    });
  });

  it('should parse a single tab group with two tabs', () => {
    const source = [
      'Intro paragraph.',
      '',
      ':::tabs',
      '## config.json',
      '',
      '```json',
      '{ "key": "value" }',
      '```',
      '',
      '## styles.css',
      '',
      '```css',
      'body { color: red; }',
      '```',
      ':::',
      '',
      'Closing paragraph.',
    ].join('\n');

    const result = parseInstructionSegments(source, PATH);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ kind: 'markdown', content: 'Intro paragraph.' });
    expect(result[1]).toEqual({
      kind: 'tabGroup',
      tabs: [
        { name: 'config.json', language: 'json', content: '{ "key": "value" }' },
        { name: 'styles.css', language: 'css', content: 'body { color: red; }' },
      ],
    });
    expect(result[2]).toEqual({ kind: 'markdown', content: 'Closing paragraph.' });
  });

  it('should accept any heading level inside tabs', () => {
    const source = [':::tabs', '#### deep-heading.txt', '', '```', 'content', '```', ':::'].join(
      '\n'
    );

    const result = parseInstructionSegments(source, PATH);

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('tabGroup');
    if (result[0].kind !== 'tabGroup') {
      throw new Error('Expected a tab group');
    }
    expect(result[0].tabs[0].name).toBe('deep-heading.txt');
  });

  it('should handle tabs with no language tag', () => {
    const source = [':::tabs', '## notes.txt', '', '```', 'plain text', '```', ':::'].join('\n');

    const result = parseInstructionSegments(source, PATH);

    if (result[0].kind !== 'tabGroup') {
      throw new Error('Expected a tab group');
    }
    expect(result[0].tabs[0].language).toBe('');
    expect(result[0].tabs[0].content).toBe('plain text');
  });

  it('should parse multiple tab groups in one instructions block', () => {
    const source = [
      '## Section 1',
      '',
      ':::tabs',
      '### a.txt',
      '',
      '```',
      'alpha',
      '```',
      ':::',
      '',
      '## Section 2',
      '',
      ':::tabs',
      '### b.txt',
      '',
      '```',
      'bravo',
      '```',
      ':::',
    ].join('\n');

    const result = parseInstructionSegments(source, PATH);

    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ kind: 'markdown', content: '## Section 1' });
    expect(result[1].kind).toBe('tabGroup');
    expect(result[2]).toEqual({ kind: 'markdown', content: '## Section 2' });
    expect(result[3].kind).toBe('tabGroup');
  });

  it('should handle multi-line content in fenced blocks', () => {
    const source = [
      ':::tabs',
      '## script.js',
      '',
      '```js',
      'function greet() {',
      '  console.log("hello");',
      '}',
      '```',
      ':::',
    ].join('\n');

    const result = parseInstructionSegments(source, PATH);

    if (result[0].kind !== 'tabGroup') {
      throw new Error('Expected a tab group');
    }
    expect(result[0].tabs[0].content).toBe('function greet() {\n  console.log("hello");\n}');
  });

  it('should throw on unterminated :::tabs block', () => {
    const source = [':::tabs', '## a.txt', '', '```', 'content', '```'].join('\n');

    expect(() => parseInstructionSegments(source, PATH)).toThrow(/Unterminated :::tabs block/);
  });

  it('should throw on empty :::tabs block', () => {
    const source = [':::tabs', ':::'].join('\n');

    expect(() => parseInstructionSegments(source, PATH)).toThrow(/Empty :::tabs block/);
  });

  it('should throw when a tab entry has no fenced block', () => {
    const source = [':::tabs', '## a.txt', '', 'just text, no fence', ':::'].join('\n');

    expect(() => parseInstructionSegments(source, PATH)).toThrow(
      /Expected a fenced code block after "a.txt"/
    );
  });

  it('should throw on unterminated fenced block inside tabs', () => {
    const source = [':::tabs', '## a.txt', '', '```', 'no closing fence', ':::'].join('\n');

    expect(() => parseInstructionSegments(source, PATH)).toThrow(
      /Unterminated fenced block for "a.txt"/
    );
  });

  it('should handle tab group at the start with no preceding markdown', () => {
    const source = [
      ':::tabs',
      '## first.txt',
      '',
      '```',
      'content',
      '```',
      ':::',
      '',
      'After the tabs.',
    ].join('\n');

    const result = parseInstructionSegments(source, PATH);

    expect(result).toHaveLength(2);
    expect(result[0].kind).toBe('tabGroup');
    expect(result[1]).toEqual({ kind: 'markdown', content: 'After the tabs.' });
  });

  it('should handle tab group at the end with no trailing markdown', () => {
    const source = [
      'Before the tabs.',
      '',
      ':::tabs',
      '## last.txt',
      '',
      '```',
      'content',
      '```',
      ':::',
    ].join('\n');

    const result = parseInstructionSegments(source, PATH);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ kind: 'markdown', content: 'Before the tabs.' });
    expect(result[1].kind).toBe('tabGroup');
  });
});

describe('hasTabBlocks', () => {
  it('should return true when :::tabs is present', () => {
    expect(hasTabBlocks('some text\n:::tabs\nmore')).toBe(true);
  });

  it('should return false when no :::tabs is present', () => {
    expect(hasTabBlocks('some text\nno tab blocks here')).toBe(false);
  });

  it('should not match :::tabs embedded in a line', () => {
    expect(hasTabBlocks('the string :::tabs is inline')).toBe(false);
  });
});
