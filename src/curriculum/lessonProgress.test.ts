import { describe, expect, it } from 'vitest';
import { initChecklist } from '@/curriculum/lessonProgress';
import type { ChecklistRequirement } from '@/curriculum/types';

const REQUIREMENTS: ChecklistRequirement[] = [
  { label: 'Step one', hint: 'You can do this.', test: {} },
  { label: 'Step two', test: {} },
];

describe('initChecklist', () => {
  it('should create one item per requirement', () => {
    const items = initChecklist(REQUIREMENTS);
    expect(items).toHaveLength(2);
  });

  it('should start every item as not-done', () => {
    const items = initChecklist(REQUIREMENTS);
    for (const item of items) {
      expect(item.status).toBe('not-done');
      expect(item.showHint).toBe(false);
    }
  });

  it('should carry over label and hint', () => {
    const items = initChecklist(REQUIREMENTS);
    expect(items[0].label).toBe('Step one');
    expect(items[0].hint).toBe('You can do this.');
    expect(items[1].hint).toBeUndefined();
  });
});
