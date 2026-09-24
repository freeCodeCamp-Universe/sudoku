import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Values } from '@/engine/types';
import { useBoardInput } from './useBoardInput';

const selectedCellId = 'r0c1';
const solution: Values = new Map([[selectedCellId, 2]]);

function makeAnnouncements() {
  return {
    announceCellState: vi.fn(),
    announceErase: vi.fn(),
    announceCandidateToggle: vi.fn(),
  };
}

describe('useBoardInput', () => {
  it('should dispatch a value and announce the projected cell state', () => {
    const dispatch = vi.fn();
    const announcements = makeAnnouncements();
    const state = { values: new Map(), candidates: new Map() };
    const { result } = renderHook(() =>
      useBoardInput({
        state,
        solution,
        dispatch,
        candidateMode: false,
        checkEnabled: false,
      })
    );

    act(() => result.current.handleNumberEntry(4, selectedCellId, announcements));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'enterValue',
      cellId: selectedCellId,
      value: 4,
    });
    expect(announcements.announceCellState).toHaveBeenCalledWith(
      selectedCellId,
      new Map([[selectedCellId, 4]])
    );
  });

  it('should erase a value and announce the remaining candidates', () => {
    const dispatch = vi.fn();
    const announcements = makeAnnouncements();
    const state = {
      values: new Map([[selectedCellId, 4]]),
      candidates: new Map(),
    };
    const { result } = renderHook(() =>
      useBoardInput({
        state,
        solution,
        dispatch,
        candidateMode: false,
        checkEnabled: false,
      })
    );

    act(() => result.current.handleNumberEntry(0, selectedCellId, announcements));

    expect(dispatch).toHaveBeenCalledWith({ type: 'erase', cellId: selectedCellId });
    expect(announcements.announceErase).toHaveBeenCalledWith(selectedCellId, new Map());
  });

  it('should toggle a candidate and announce whether it was added', () => {
    const dispatch = vi.fn();
    const announcements = makeAnnouncements();
    const state = { values: new Map(), candidates: new Map() };
    const { result } = renderHook(() =>
      useBoardInput({
        state,
        solution,
        dispatch,
        candidateMode: true,
        checkEnabled: false,
      })
    );

    act(() => result.current.handleNumberEntry(3, selectedCellId, announcements));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'toggleCandidate',
      cellId: selectedCellId,
      value: 3,
    });
    expect(announcements.announceCandidateToggle).toHaveBeenCalledWith(selectedCellId, 3, true);
  });

  it('should ignore input when locked', () => {
    const dispatch = vi.fn();
    const announcements = makeAnnouncements();
    const state = { values: new Map(), candidates: new Map() };
    const { result } = renderHook(() =>
      useBoardInput({
        state,
        solution,
        dispatch,
        candidateMode: false,
        checkEnabled: false,
        inputLocked: true,
      })
    );

    act(() => {
      result.current.onEnterValue(selectedCellId, 4);
      result.current.onToggleCandidate(selectedCellId, 3);
      result.current.handleNumberEntry(4, selectedCellId, announcements);
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(announcements.announceCellState).not.toHaveBeenCalled();
    expect(announcements.announceErase).not.toHaveBeenCalled();
    expect(announcements.announceCandidateToggle).not.toHaveBeenCalled();
  });
});
