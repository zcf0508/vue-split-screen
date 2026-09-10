import type { PropType, VNode } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { SplitRouteNode } from '../../model';
import type { SplitHistoryController } from '../../router';
import { defineComponent, h, KeepAlive } from 'vue';
import { ScreenProxy } from './ScreenProxy';

const InactivePage = defineComponent({
  name: 'InactiveSplitPage',
  setup: () => () => null,
});

export const PageHost = defineComponent({
  name: 'SplitPageHost',
  props: {
    active: {
      type: Boolean,
      required: true,
    },
    controller: {
      type: Object as PropType<SplitHistoryController>,
      required: true,
    },
    node: {
      type: Object as PropType<SplitRouteNode>,
      required: true,
    },
    renderPage: {
      type: Function as PropType<() => VNode[]>,
      required: true,
    },
    route: {
      type: Object as PropType<RouteLocationNormalizedLoaded>,
      required: true,
    },
  },
  setup(props) {
    return () => h(
      KeepAlive,
      { max: 2 },
      () => props.active
        ? h(
            ScreenProxy,
            {
              key: props.node.id,
              controller: props.controller,
              node: props.node,
              route: props.route,
            },
            props.renderPage,
          )
        : h(InactivePage, { key: 'inactive' }),
    );
  },
});
