import type { SplitNavigationMode, SplitRouteNode, SplitTrail } from './types';

export function navigateTrail(
  trail: SplitTrail,
  originId: string,
  destination: SplitRouteNode,
  mode: SplitNavigationMode,
): SplitTrail {
  const originIndex = trail.findIndex(node => node.id === originId);
  if (originIndex < 0) {
    throw new RangeError(`Unknown split-route node: ${originId}`);
  }

  const retainedLength = mode === 'push' ? originIndex + 1 : originIndex;
  return [...trail.slice(0, retainedLength), destination] as unknown as SplitTrail;
}
