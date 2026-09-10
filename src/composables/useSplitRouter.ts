import type { ComputedRef } from 'vue';
import type { Router } from 'vue-router';
import type { SplitRouteNode } from '../model';
import { inject } from 'vue';
import { splitRouteNodeKey, splitRouterKey } from '../router';

export function useSplitRouter(): Router {
  const router = inject(splitRouterKey);
  if (!router) {
    throw new Error('useSplitRouter() must be called inside SplitScreen');
  }
  return router;
}

export function useSplitRouteNode(): ComputedRef<SplitRouteNode> {
  const node = inject(splitRouteNodeKey);
  if (!node) {
    throw new Error('useSplitRouteNode() must be called inside SplitScreen');
  }
  return node;
}
