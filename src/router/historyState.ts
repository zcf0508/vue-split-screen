import type { HistoryState } from 'vue-router';
import type { SplitHistoryState, SplitRouteNode } from '../model';
import { toSplitTrail } from '../model';

export const splitHistoryStateKey = '__vueSplitScreen';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRouteNode(value: unknown): value is SplitRouteNode {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.fullPath === 'string';
}

export function readSplitHistoryState(value: unknown): SplitHistoryState | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const candidate = value[splitHistoryStateKey];
  const trail = isRecord(candidate) && Array.isArray(candidate.trail)
    ? candidate.trail
    : [];
  if (!isRecord(candidate)
    || candidate.version !== 1
    || trail.length === 0
    || !trail.every(isRouteNode)
    || new Set(trail.map(node => node.id)).size !== trail.length) {
    return undefined;
  }

  return {
    version: 1,
    trail: toSplitTrail(trail.map(({ id, fullPath }) => ({ id, fullPath }))),
  };
}

export function writeSplitHistoryState(
  historyState: HistoryState,
  splitState: SplitHistoryState,
): HistoryState {
  return {
    ...historyState,
    [splitHistoryStateKey]: splitState,
  } as unknown as HistoryState;
}
