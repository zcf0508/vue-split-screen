import { describe, expect, it } from 'vitest';
import { readSplitHistoryState, splitHistoryStateKey, writeSplitHistoryState } from '../../src/router';

const splitState = {
  version: 1 as const,
  trail: [{ id: 'A', fullPath: '/a' }] as const,
};

describe('split history state serialization', () => {
  it('preserves Vue Router and user state', () => {
    expect(writeSplitHistoryState({ position: 3, user: 'value' }, splitState)).toEqual({
      position: 3,
      user: 'value',
      [splitHistoryStateKey]: splitState,
    });
  });

  it('reads a valid trail without sharing mutable node objects', () => {
    const storedNode = { id: 'A', fullPath: '/a' };
    const restored = readSplitHistoryState({
      [splitHistoryStateKey]: { version: 1, trail: [storedNode] },
    });

    expect(restored).toEqual(splitState);
    expect(restored?.trail[0]).not.toBe(storedNode);
  });

  it.each([
    undefined,
    {},
    { [splitHistoryStateKey]: { version: 2, trail: [{ id: 'A', fullPath: '/a' }] } },
    { [splitHistoryStateKey]: { version: 1, trail: [] } },
    { [splitHistoryStateKey]: { version: 1, trail: [{ id: 'A' }] } },
  ])('rejects malformed state %#', (state) => {
    expect(readSplitHistoryState(state)).toBeUndefined();
  });
});
