import type { VNode } from 'vue';
import { computed, defineComponent, h, nextTick, onMounted, provide, reactive, ref, unref, watch } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { RouteRecordRaw, useRoute, useRouter } from 'vue-router';
import { useNavigationListener } from '../../hooks/useNavigationListener';
import { getRealRouteKey, routerCallbackKey, rowRouterPushKey, rowRouterReplaceKey } from '../constants';
import { SplitPlaceholder } from './SplitPlaceholder';
import { SplitScreenProxy } from './SplitScreenProxy';
import { ScreenProxy } from './ScreenProxy';
import { cloneRoute } from './utils';
import { createTimeline } from './timeline';

interface SplitSlot {
  key: string
  route: RouteLocationNormalizedLoaded
  slot?: VNode[]
};

type SplitSlots = [SplitSlot] | [SplitSlot, SplitSlot];

interface SlotQueueItem {
  routePath: string
  splitSlots: SplitSlots
};

export const SplitScreen = defineComponent({
  name: 'SplitScreen',
  props: {
    turnOn: {
      type: Boolean,
      default: () => true,
    },
    /**
     * By default, the left screen is the main screen and the right screen is the secondary screen.
     * Enabling this property will make the left screen the secondary screen and the right screen the main one.
     * This property is not enabled by default.
     */
    splitReverse: {
      type: Boolean,
      default: () => false,
    },
  },
  setup: (props, ctx) => {
    const timeline = createTimeline();

    const route = useRoute();
    const router = useRouter();

    const leftFlag = ref(false);
    const pushFlag = ref(true);
    const timelineTick = ref(0);

    function queuePush(left: boolean) {
      const s = timeline.createSlot(cloneRoute(route), ctx.slots.default?.());
      timeline.push(left, s);
      leftFlag.value = false;
      pushFlag.value = true;
      // perform GC to remove unused slots
      timeline.gc();
      timelineTick.value++;
    }

    function queueReplace(left: boolean) {
      const s = timeline.createSlot(cloneRoute(route), ctx.slots.default?.());
      timeline.replace(left, s);
      leftFlag.value = false;
      pushFlag.value = true;
      timeline.gc();
      timelineTick.value++;
    }

    const navigationFlag = ref(false);
    useNavigationListener(() => {
      timeline.forward();
      navigationFlag.value = true;
      timelineTick.value++;
    }, () => {
      timeline.back();
      navigationFlag.value = true;
      timelineTick.value++;
    });

    onMounted(() => {
      queuePush(true);
    });

    function routerPush(left: boolean) {
      leftFlag.value = left;
      pushFlag.value = true;
    }
    function routerReplace(left: boolean) {
      leftFlag.value = left;
      pushFlag.value = false;
    }

    provide(routerCallbackKey, {
      routerPush,
      routerReplace,
    });

    watch(() => route.path, () => {
      setTimeout(() => {
        if (!navigationFlag.value) {
          if (pushFlag.value) {
            queuePush(leftFlag.value);
          }
          else {
            queueReplace(leftFlag.value);
          }
        }
        navigationFlag.value = false;
      }, 0);
    });

    provide(getRealRouteKey, () => {
      return cloneRoute(route);
    });

    // timeline is an internal non-reactive structure; use a tick ref to trigger reactivity

    provide(rowRouterPushKey, router.push);
    provide(rowRouterReplaceKey, router.replace);

    const renderSlot = computed(() => {
      // depend on tick so computed re-evaluates when timeline changes
      void timelineTick.value;
      const current = timeline.getCurrentEntry();
      const all = timeline.getSlotsArray();

      // no-op debug removed

      if (!props.turnOn) {
        return () => [
          ...all.map((slot, index) => h(
            ScreenProxy,
            {
              key: slot.key,
              route: slot.route,
              left: all.length > 1 && index === 0,
              style: slot.key === (current?.rightId || current?.leftId)
                ? ''
                : 'display: none;',
            },
            () => slot.slot,
          )),
        ];
      }
      else {
        if (current && current.leftId && current.rightId) {
          return () => [
            ...all.map((slot, index) => h(
              ScreenProxy,
              {
                key: slot.key,
                route: slot.route,
                left: all.length > 1 && index === 0,
                style: [current.leftId, current.rightId].includes(slot.id)
                  ? ''
                  : 'display: none;',
              },
              () => slot.slot,
            )),
          ];
        }
        else {
          return () => [
            ...all.map((slot, index) => h(
              ScreenProxy,
              {
                key: slot.key,
                route: slot.route,
                left: all.length > 1 && index === 0,
                style:
                (slot.id === current?.leftId)
                || (!current && index === all.length - 1)
                  ? ''
                  : 'display: none;',
              },
              () => slot.slot,
            )),
            h(
              ScreenProxy,
              {
                key: 'placeholder',
              },
              ctx.slots.placeholder
                ? ctx.slots.placeholder
                : h(SplitPlaceholder),
            ),
          ];
        }
      }
    });

    return () => h(
      SplitScreenProxy,
      {
        splitReverse: props.splitReverse,
      },
      renderSlot.value,
    );
  },
});
