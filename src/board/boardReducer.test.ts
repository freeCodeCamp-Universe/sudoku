import { describe, expect, it } from 'vitest';
import type { Values } from '@/engine/types';
import { boardReducer, createBoardState } from './boardReducer';

const givens: Values = new Map([['r0c0', 1]]);

describe('boardReducer', () => {
  it('should enter a value and record history', () => {
    const initialState = createBoardState(givens);
    const nextState = boardReducer(
      initialState,
      { type: 'enterValue', cellId: 'r0c1', value: 2 },
      givens
    );

    expect(nextState.values.get('r0c1')).toBe(2);
    expect(nextState.history).toHaveLength(1);
    expect(initialState.values.has('r0c1')).toBe(false);
  });

  it('should erase a value and record history', () => {
    const initialState = boardReducer(
      createBoardState(givens),
      { type: 'enterValue', cellId: 'r0c1', value: 2 },
      givens
    );
    const nextState = boardReducer(initialState, { type: 'erase', cellId: 'r0c1' }, givens);

    expect(nextState.values.has('r0c1')).toBe(false);
    expect(nextState.history).toHaveLength(2);
  });

  it('should toggle candidates in sorted order', () => {
    const initialState = createBoardState(givens);
    const withThree = boardReducer(
      initialState,
      { type: 'toggleCandidate', cellId: 'r0c1', value: 3 },
      givens
    );
    const nextState = boardReducer(
      withThree,
      { type: 'toggleCandidate', cellId: 'r0c1', value: 2 },
      givens
    );

    expect(nextState.candidates.get('r0c1')).toEqual([2, 3]);
  });

  it('should undo the last value change', () => {
    const initialState = createBoardState(givens);
    const withValue = boardReducer(
      initialState,
      { type: 'enterValue', cellId: 'r0c1', value: 2 },
      givens
    );
    const nextState = boardReducer(withValue, { type: 'undo' }, givens);

    expect(nextState.values.has('r0c1')).toBe(false);
    expect(nextState.history).toHaveLength(0);
  });

  it('should clear entries and revealed cells while preserving givens', () => {
    const initialState = createBoardState(givens);
    const withValue = boardReducer(
      initialState,
      { type: 'enterValue', cellId: 'r0c1', value: 2 },
      givens
    );
    const withReveal = boardReducer(
      withValue,
      { type: 'reveal', cellId: 'r0c1', solutionValue: 2 },
      givens
    );
    const nextState = boardReducer(withReveal, { type: 'clearAll' }, givens);

    expect(nextState.values).toEqual(givens);
    expect(nextState.revealed.size).toBe(0);
    expect(nextState.history).toHaveLength(3);
  });

  it('should reveal a cell and clear its candidates', () => {
    const initialState = boardReducer(
      createBoardState(givens),
      { type: 'toggleCandidate', cellId: 'r0c1', value: 3 },
      givens
    );
    const nextState = boardReducer(
      initialState,
      { type: 'reveal', cellId: 'r0c1', solutionValue: 2 },
      givens
    );

    expect(nextState.values.get('r0c1')).toBe(2);
    expect(nextState.candidates.has('r0c1')).toBe(false);
    expect(nextState.revealed.has('r0c1')).toBe(true);
    expect(nextState.history).toHaveLength(1);
  });
});
