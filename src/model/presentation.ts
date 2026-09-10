import type { SplitPresentation, SplitTrail } from './types';

export function presentTrail(trail: SplitTrail): SplitPresentation {
  const current = trail.at(-1)!;
  return {
    companion: trail.length > 1 ? trail.at(-2) : undefined,
    current,
  };
}
