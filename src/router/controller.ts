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
const fallbackSessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

function defaultNodeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `split-route-${fallbackSessionId}-${++fallbackId}`;
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
  resolved: RouteLocationNormalizedLoaded,
  to: RouteLocationRaw,
  splitState: SplitHistoryState,
): RouteLocationRaw {
  const state = writeSplitHistoryState(
    typeof to === 'object' && to.state ? to.state : {},
    splitState,
  );

  return {
    path: resolved.path,
    query: resolved.query,
    hash: resolved.hash,
    ...(typeof to === 'object' ? { force: to.force, replace: to.replace } : {}),
    state,
  };
}

function finalizeState(state: SplitHistoryState, fullPath: string): SplitHistoryState {
  const currentNode = state.trail.at(-1)!;
  return currentNode.fullPath === fullPath
    ? state
    : {
        version: 1,
        trail: toSplitTrail([
          ...state.trail.slice(0, -1),
          { ...currentNode, fullPath },
        ]),
      };
}

export function createSplitHistoryController(
  router: Router,
  createId: NodeIdFactory = defaultNodeId,
): SplitHistoryController {
  const routerHistory = router.options.history;
  const restored = readSplitHistoryState(routerHistory.state);
  const candidateState = restored ?? initialState(router.currentRoute.value, createId);
  const startingState = finalizeState(candidateState, router.currentRoute.value.fullPath);
  const trail = shallowRef(startingState.trail);

  if (!restored || startingState !== candidateState) {
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
    const finalizedState = finalizeState(nextState, to.fullPath);

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
    const origin = trail.value.find(node => node.id === originId);
    if (!origin) {
      throw new RangeError(`Unknown split-route node: ${originId}`);
    }
    const originRoute = router.resolve(origin.fullPath) as RouteLocationNormalizedLoaded;
    const resolved = router.resolve(to, originRoute) as RouteLocationNormalizedLoaded;
    const effectiveMode: SplitNavigationMode = mode === 'replace'
      || (typeof to === 'object' && to.replace === true)
      ? 'replace'
      : 'push';
    const destination = createNode(resolved.fullPath, createId);
    const nextState: SplitHistoryState = {
      version: 1,
      trail: navigateTrail(trail.value, originId, destination, effectiveMode),
    };
    const target = withNavigationState(resolved, to, nextState);
    const result = await router[effectiveMode](target);
    return isNavigationFailure(result) ? result : undefined;
  }

  return {
    trail,
    navigate,
    dispose: removeAfterEach,
  };
}
