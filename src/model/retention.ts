import type { SplitTrail } from './types';

export interface RetentionSelection {
  recency: readonly string[];
  retained: readonly string[];
}

export function selectRetainedPageIds(
  trail: SplitTrail,
  activeIds: readonly string[],
  previousRecency: readonly string[],
  maxInactivePages: number,
): RetentionSelection {
  const trailIds = trail.map(node => node.id);
  const validIds = new Set(trailIds);
  const active = new Set(activeIds);
  const recency = previousRecency.filter(id => validIds.has(id) && !active.has(id));
  const known = new Set(recency);

  for (const id of trailIds) {
    if (!known.has(id) && !active.has(id)) {
      recency.push(id);
      known.add(id);
    }
  }
  for (const id of activeIds) {
    if (validIds.has(id)) {
      recency.push(id);
    }
  }

  const limit = Math.max(0, Math.floor(maxInactivePages));
  const inactive = recency.filter(id => !active.has(id));
  return {
    recency,
    retained: limit === 0 ? [] : inactive.slice(-limit),
  };
}
