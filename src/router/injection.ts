import type { ComputedRef, InjectionKey } from 'vue';
import type { Router } from 'vue-router';
import type { SplitRouteNode } from '../model';

export const splitRouterKey: InjectionKey<Router> = Symbol('splitRouter');
export const splitRouteNodeKey: InjectionKey<ComputedRef<SplitRouteNode>> = Symbol('splitRouteNode');
