import { cloneDeep } from 'lodash-es';
import type { RouteLocation, RouteLocationMatched, RouteLocationNormalizedLoaded } from 'vue-router';

export function cloneRoute(route: RouteLocationNormalizedLoaded): RouteLocationNormalizedLoaded {
  return {
    fullPath: cloneDeep(route.fullPath),
    hash: cloneDeep(route.hash),
    matched: cloneMatched(route.matched),
    meta: cloneDeep(route.meta),
    name: cloneDeep(route.name),
    params: cloneDeep(route.params),
    path: cloneDeep(route.path),
    query: cloneDeep(route.query),
    redirectedFrom: cloneRedirectedFrom(route.redirectedFrom),
  } as RouteLocationNormalizedLoaded;
}

function cloneMatched(matched: RouteLocationMatched[]): RouteLocationMatched[] {
  return [
    ...matched.map((item) => {
      return {
        components: cloneDeep(item.components),
        // TODO: instances can't clone
        // instances: cloneDeep(item.instances),
        meta: cloneDeep(item.meta),
        name: cloneDeep(item.name),
        path: cloneDeep(item.path),
        props: cloneDeep(item.props),
      };
    }),
  ] as RouteLocationMatched[];
}

function cloneRedirectedFrom(redirectedFrom?: RouteLocation): RouteLocation | undefined {
  if (!redirectedFrom) {
    return undefined;
  }
  return {
    fullPath: cloneDeep(redirectedFrom.fullPath),
    hash: cloneDeep(redirectedFrom.hash),
    matched: cloneMatched(redirectedFrom.matched),
    meta: cloneDeep(redirectedFrom.meta),
    name: cloneDeep(redirectedFrom.name),
    params: cloneDeep(redirectedFrom.params),
    path: cloneDeep(redirectedFrom.path),
    query: cloneDeep(redirectedFrom.query),
    redirectedFrom: cloneRedirectedFrom(redirectedFrom.redirectedFrom),
  };
}
