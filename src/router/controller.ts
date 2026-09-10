import type { ShallowRef } from 'vue';
import type {
  NavigationFailure,
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  Router,
} from 'vue-router';
import type { SplitHistoryState, SplitNavigationMode, SplitRouteNode, SplitTrail } from '../model';
import { shallowRef } from 'vue';
import { isNavigationFailure } from 'vue-router';
import { navigateTrail, toSplitTrail } from '../model';
import { readSplitHistoryState, writeSplitHistoryState } from './historyState';

export interface SplitHistoryController {
  readonly trail: ShallowRef<SplitTrail>;
  navigate: (
    originId: string,
    mode: SplitNavigationMode,
    to: RouteLocationRaw,
  ) => Promise<void | NavigationFailure>;
  dispose: () => void;
}

type NodeIdFactory = () => string;

let fallbackId = 0;

function defaultNodeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `split-route-${++fallbackId}`;
}

function createNode(fullPath: string, createId: NodeIdFactory): SplitRouteNode {
  return { id: createId(), fullPath };
}

function initialState(route: RouteLocationNormalizedLoaded, createId: NodeIdFactory): SplitHistoryState {
  return {
    version: 1,
    trail: [createNode(route.fullPath, createId)],
  };
}

function withNavigationState(
  router: Router,
  to: RouteLocationRaw,
  splitState: SplitHistoryState,
): RouteLocationRaw {
  const state = writeSplitHistoryState(
    typeof to === 'object' && to.state ? to.state : {},
    splitState,
  );

  if (typeof to === 'string') {
    const resolved = router.resolve(to);
    return {
      path: resolved.path,
      query: resolved.query,
      hash: resolved.hash,
      state,
    };
  }

  return { ...to, state };
}

export function createSplitHistoryController(
  router: Router,
  createId: NodeIdFactory = defaultNodeId,
): SplitHistoryController {
  const routerHistory = router.options.history;
  const restored = readSplitHistoryState(routerHistory.state);
  const startingState = restored ?? initialState(router.currentRoute.value, createId);
  const trail = shallowRef(startingState.trail);

  if (!restored) {
    routerHistory.replace(
      routerHistory.location,
      writeSplitHistoryState(routerHistory.state, startingState),
    );
  }

  const removeAfterEach = router.afterEach((to, _from, failure) => {
    if (failure) {
      return;
    }

    const historyState = readSplitHistoryState(routerHistory.state);
    const nextState = historyState ?? initialState(to, createId);
    const currentNode = nextState.trail.at(-1)!;
    const finalizedState: SplitHistoryState = currentNode.fullPath === to.fullPath
      ? nextState
      : {
          version: 1,
          trail: toSplitTrail([
            ...nextState.trail.slice(0, -1),
            { ...currentNode, fullPath: to.fullPath },
          ]),
        };

    trail.value = finalizedState.trail;
    if (!historyState || finalizedState !== nextState) {
      routerHistory.replace(
        routerHistory.location,
        writeSplitHistoryState(routerHistory.state, finalizedState),
      );
    }
  });

  async function navigate(
    originId: string,
    mode: SplitNavigationMode,
    to: RouteLocationRaw,
  ): Promise<void | NavigationFailure> {
    const destination = createNode(router.resolve(to).fullPath, createId);
    const nextState: SplitHistoryState = {
      version: 1,
      trail: navigateTrail(trail.value, originId, destination, mode),
    };
    const target = withNavigationState(router, to, nextState);
    const result = await router[mode](target);
    return isNavigationFailure(result) ? result : undefined;
  }

  return {
    trail,
    navigate,
    dispose: removeAfterEach,
  };
}
