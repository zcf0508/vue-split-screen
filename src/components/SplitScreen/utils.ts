import { cloneDeep } from "lodash-es";
import { RouteLocationNormalizedLoaded, RouteLocationMatched } from "vue-router"

export function cloneRoute(route: RouteLocationNormalizedLoaded):RouteLocationNormalizedLoaded {
  return {
    fullPath: cloneDeep(route.fullPath),
    hash: cloneDeep(route.hash),
    matched: cloneMatched(route.matched),
    meta: cloneDeep(route.meta),
    name: cloneDeep(route.name),
    params: cloneDeep(route.params),
    path: cloneDeep(route.path),
    query: cloneDeep(route.query),
    redirectedFrom: cloneDeep(route.redirectedFrom),
  } as RouteLocationNormalizedLoaded
}


function cloneMatched(matched: RouteLocationMatched[]) {
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
      }
    }),
  ]
}

