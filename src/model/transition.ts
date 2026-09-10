import type { SplitNavigationMode, SplitRouteNode, SplitTrail } from './types';

export function toSplitTrail(nodes: readonly SplitRouteNode[]): SplitTrail {
  const [first, ...rest] = nodes;
  if (!first) {
    throw new RangeError('A split trail must contain at least one node');
  }
  return [first, ...rest];
}

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
  return toSplitTrail([...trail.slice(0, retainedLength), destination]);
}
