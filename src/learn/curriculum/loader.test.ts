import { describe, expect, it } from 'vitest';
import { buildCurriculum, filterVisibleCurriculum } from '@/learn/curriculum/loader';
import type { OrderingModule } from '@/learn/curriculum/orderingTypes';

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
