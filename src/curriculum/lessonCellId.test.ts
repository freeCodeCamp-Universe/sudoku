import { describe, expect, it } from 'vitest';
import { buildModel } from '@/engine/buildModel';
import { cellIdToLessonCellId, lessonCellIdToCellId } from '@/curriculum/lessonCellId';
import { variantRegistry } from '@/variants/registry';

describe('lesson cell id conversion', () => {
  it('should convert 1-based lesson ids to 0-based engine ids', () => {
    expect(lessonCellIdToCellId('r1c1')).toBe('r0c0');
    expect(lessonCellIdToCellId('r10c12')).toBe('r9c11');
  });

  it('should convert 0-based engine ids to 1-based lesson ids', () => {
    expect(cellIdToLessonCellId('r0c0')).toBe('r1c1');
    expect(cellIdToLessonCellId('r9c11')).toBe('r10c12');
  });

  it('should round-trip cell ids in multigrid layouts', () => {
    const model = buildModel(variantRegistry.twodoku);
    const multigridCell = model.cells.find(({ row, col }) => row >= 9 || col >= 9);

    expect(multigridCell).toBeDefined();
    if (!multigridCell) throw new Error('Expected twodoku to contain a multigrid cell');
    expect(lessonCellIdToCellId(cellIdToLessonCellId(multigridCell.id))).toBe(multigridCell.id);
  });

  it('should reject malformed cell ids', () => {
    expect(() => lessonCellIdToCellId('r0c1')).toThrow('expected 1-based format r1c1');
    expect(() => cellIdToLessonCellId('r01c0')).toThrow('expected 0-based format r0c0');
  });
});
