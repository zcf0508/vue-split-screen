export interface SplitRouteNode {
  id: string;
  fullPath: string;
}

export type SplitTrail = readonly [SplitRouteNode, ...SplitRouteNode[]];

export type SplitNavigationMode = 'push' | 'replace';

export interface SplitHistoryState {
  version: 1;
  trail: SplitTrail;
}

export interface SplitPresentation {
  companion: SplitRouteNode | undefined;
  current: SplitRouteNode;
}
