import { describe, expect, it } from 'vitest';
import { buildCurriculum, filterVisibleCurriculum } from '@/curriculum/loader';
import { lessonCellIdToCellId } from '@/curriculum/lessonCellId';
import type { OrderingModule } from '@/curriculum/orderingTypes';

const INTRO_ID = '64a2f3b1c7d8e9f0a1b2c3d4';
const LEARN_ID = '64a2f3b1c7d8e9f0a1b2c3d5';

const INTRO_MD = `---
id: ${INTRO_ID}
title: 'Intro Lesson'
type: intro
layoutType: article
---

# --instructions--

Hello world.
`;

const LEARN_MD = `---
id: ${LEARN_ID}
title: 'Learn Lesson'
type: learn
layoutType: interactive
---

# --instructions--

Do something.

# --files--

## starter.txt

\`\`\`txt
content
\`\`\`

# --config--

\`\`\`json
{
  "checklist": [
    { "label": "Do the thing", "test": { "done": true } }
  ]
}
\`\`\`
`;

const ORDERING: OrderingModule[] = [
  {
    module: 1,
    slug: 'basics',
    title: 'Basics',
    lessons: ['intro.md', 'learn.md'],
  },
];

const MAP = {
  './lessons/intro.md': INTRO_MD,
  './lessons/learn.md': LEARN_MD,
};

const MINI_SOLUTION = {
  r1c1: 1,
  r1c2: 2,
  r1c3: 3,
  r1c4: 4,
  r2c1: 3,
  r2c2: 4,
  r2c3: 1,
  r2c4: 2,
  r3c1: 2,
  r3c2: 1,
  r3c3: 4,
  r3c4: 3,
  r4c1: 4,
  r4c2: 3,
  r4c3: 2,
  r4c4: 1,
};

const MINI_BOARD = {
  variant: 'mini',
  givens: { r1c1: 1 },
  solution: MINI_SOLUTION,
  cellSelection: 'multiple',
  highlights: { peers: false, sameValue: true },
};

describe('buildCurriculum', () => {
  it('should build prose and interactive lessons', () => {
    const { lessons, modules } = buildCurriculum(ORDERING, MAP);

    expect(lessons).toHaveLength(2);
    expect(modules).toHaveLength(1);

    const intro = lessons.find((l) => l.id === INTRO_ID);
    expect(intro).toBeDefined();
    expect(intro?.config).toBeUndefined();

    const learn = lessons.find((l) => l.id === LEARN_ID);
    expect(learn).toBeDefined();
    expect(learn?.config?.checklist).toHaveLength(1);
  });
});

describe('filterVisibleCurriculum', () => {
  it('should pass through when showUpcoming is true', () => {
    const content = buildCurriculum(ORDERING, MAP);
    expect(filterVisibleCurriculum(content, true)).toBe(content);
  });

  it('should filter WIP modules when showUpcoming is false', () => {
    const wipOrdering: OrderingModule[] = [{ ...ORDERING[0], wip: true }];
    const content = buildCurriculum(wipOrdering, MAP);
    const filtered = filterVisibleCurriculum(content, false);
    expect(filtered.modules).toHaveLength(0);
    expect(filtered.lessons).toHaveLength(0);
  });
});

describe('buildCurriculum lesson parsing', () => {
  const lessonWith = (instructions: string, config: string) => `---
id: ${LEARN_ID}
title: 'Learn Lesson'
type: learn
layoutType: interactive
---

# --instructions--

${instructions}

# --config--

${config}
`;

  const build = (source: string) =>
    buildCurriculum([{ module: 1, slug: 'basics', title: 'Basics', lessons: ['learn.md'] }], {
      './lessons/learn.md': source,
    });

  it('should parse line and block comments in a json config block', () => {
    const config = [
      '```json',
      '{',
      '  // The learner sees this checklist.',
      '  /* Items appear in order. */',
      '  "checklist": [{ "label": "Look", "test": {} }]',
      '}',
      '```',
    ].join('\n');

    const [lesson] = build(lessonWith('Do something.', config)).lessons;

    expect(lesson.config?.checklist).toHaveLength(1);
  });

  it('should parse and normalize a valid board block and its checklist cell ids', () => {
    const config = [
      '```json',
      JSON.stringify({
        board: MINI_BOARD,
        checklist: [
          { label: 'Select the cells', test: { selected: ['r1c1', 'r1c2'] } },
          { label: 'Enter a value', test: { values: { r1c1: 1 } } },
          { label: 'Add candidates', test: { candidates: { r1c2: [2, 1] } } },
          { label: 'Solve the board', test: { solved: true } },
        ],
      }),
      '```',
    ].join('\n');

    const [lesson] = build(lessonWith('Do something.', config)).lessons;

    expect(lesson.config?.board).toEqual({
      variant: 'mini',
      givens: { r0c0: 1 },
      solution: Object.fromEntries(
        Object.entries(MINI_SOLUTION).map(([id, value]) => [lessonCellIdToCellId(id), value])
      ),
      cellSelection: 'multiple',
      highlights: { peers: false, sameValue: true },
    });
    expect(lesson.config?.checklist.map(({ test }) => test)).toEqual([
      { selected: ['r0c0', 'r0c1'] },
      { values: { r0c0: 1 } },
      { candidates: { r0c1: [2, 1] } },
      { solved: true },
    ]);
  });

  it.each([
    ['unknown variant', { ...MINI_BOARD, variant: 'missing' }, 'config.board.variant is unknown'],
    [
      'unknown board cell',
      { ...MINI_BOARD, givens: { r5c1: 1 } },
      'givens.r5c1 is not on the mini board',
    ],
    [
      'invalid symbol',
      { ...MINI_BOARD, givens: { r1c1: 9 } },
      'givens.r1c1 must be one of the mini symbols',
    ],
    [
      'missing solution cell',
      { ...MINI_BOARD, solution: Object.fromEntries(Object.entries(MINI_SOLUTION).slice(1)) },
      'solution is missing cell r1c1',
    ],
    [
      'given that differs from solution',
      { ...MINI_BOARD, givens: { r1c1: 2 } },
      'givens.r1c1 does not match solution',
    ],
    [
      'conflicting solution',
      { ...MINI_BOARD, solution: { ...MINI_SOLUTION, r1c2: 1 } },
      'solution has conflicts',
    ],
    [
      'unknown highlight option',
      { ...MINI_BOARD, highlights: { unknown: true } },
      'highlights.unknown is not supported',
    ],
    [
      'unsupported structure variant',
      { ...MINI_BOARD, variant: 'killer' },
      'variant killer needs a structure field',
    ],
  ])('should reject a board with %s', (_name, board, message) => {
    const config = ['```json', JSON.stringify({ board }), '```'].join('\n');
    expect(() => build(lessonWith('Do something.', config))).toThrow(message);
  });

  it('should reject an unknown cell id in a board checklist test', () => {
    const config = [
      '```json',
      JSON.stringify({
        board: MINI_BOARD,
        checklist: [{ label: 'Select a cell', test: { selected: ['r5c1'] } }],
      }),
      '```',
    ].join('\n');

    expect(() => build(lessonWith('Do something.', config))).toThrow(
      'checklist[0].test.selected cell "r5c1" is not on the board'
    );
  });

  it('should reject invalid board selection and highlight options', () => {
    const selectionConfig = [
      '```json',
      JSON.stringify({
        board: { ...MINI_BOARD, cellSelection: 'all' },
      }),
      '```',
    ].join('\n');
    const highlightConfig = [
      '```json',
      JSON.stringify({
        board: { ...MINI_BOARD, highlights: { peers: 'yes' } },
      }),
      '```',
    ].join('\n');

    expect(() => build(lessonWith('Do something.', selectionConfig))).toThrow(
      'cellSelection must be "single" or "multiple"'
    );
    expect(() => build(lessonWith('Do something.', highlightConfig))).toThrow(
      'highlights.peers must be a boolean'
    );
  });

  it('should reject a config block fenced as jsonc', () => {
    const config = ['```jsonc', '{ "checklist": [] }', '```'].join('\n');

    expect(() => build(lessonWith('Do something.', config))).toThrow(
      '# --config-- section must contain a json code block'
    );
  });

  it('should throw when an instruction <img> has no alt attribute', () => {
    const config = ['```json', '{ "checklist": [] }', '```'].join('\n');

    expect(() => build(lessonWith('<img src="/a.svg">', config))).toThrow(
      'is missing an alt attribute'
    );
  });
});
