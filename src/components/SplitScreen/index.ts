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
    const allSlots = ref<SplitSlot[]>([]);

    const slotQueue = ref([] as SlotQueueItem[]);
    const queueIdx = ref(-1);

    const route = useRoute();
    const router = useRouter();

    const leftFlag = ref(false);
    const pushFlag = ref(true);

    function queuePush(left: boolean) {
      const slots = [] as unknown as SplitSlots;
      const current = unref(slotQueue.value[queueIdx.value]);
      if (current && current.splitSlots.length === 2) {
        if (left) {
          slots.push(current.splitSlots[0]);
        }
        else {
          slots.push(current.splitSlots[1]);
        }
      }
      else if (current) {
        slots.push(current.splitSlots[0]);
      }

      allSlots.value.push({
        key: new Date().getTime().toString(),
        route: cloneRoute(route),
        slot: ctx.slots.default?.(),
      });

      slots.push(allSlots.value[allSlots.value.length - 1]);

      slotQueue.value.splice(queueIdx.value + 1, slotQueue.value.length - queueIdx.value - 1, {
        routePath: route.path,
        splitSlots: slots,
      });

      queueIdx.value = slotQueue.value.length - 1;
      leftFlag.value = false;
      pushFlag.value = true;
    }

    function queueReplace(left: boolean) {
      const slots = [] as unknown as SplitSlots;
      const current = slotQueue.value[queueIdx.value];
      if (current) {
        if (!left) {
          slots.push(current.splitSlots[0]);
        }
      }
      allSlots.value.push({
        key: new Date().getTime().toString(),
        route: cloneRoute(route),
        slot: ctx.slots.default?.(),
      });

      slots.push(allSlots.value[allSlots.value.length - 1]);

      slotQueue.value.splice(queueIdx.value, slotQueue.value.length - queueIdx.value, {
        routePath: route.path,
        splitSlots: slots,
      });

      queueIdx.value = slotQueue.value.length - 1;
      leftFlag.value = false;
      pushFlag.value = true;
    }

    const navigationFlag = ref(false);
    useNavigationListener(() => {
      queueIdx.value += 1;
      navigationFlag.value = true;
      if (queueIdx.value >= slotQueue.value.length - 1) {
        queueIdx.value = slotQueue.value.length - 1;
      }
    }, () => {
      queueIdx.value -= 1;
      navigationFlag.value = true;
      if (queueIdx.value < 0) {
        queueIdx.value = 0;
      }
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

    watch(() => [slotQueue.value, queueIdx.value], (val) => {
      console.log(val);
    }, {
      deep: true,
    });

    provide(rowRouterPushKey, router.push);
    provide(rowRouterReplaceKey, router.replace);

    const renderSlot = computed(() => {
      const currentSlot = slotQueue.value[queueIdx.value];

      if (!props.turnOn) {
        return () => [
          ...allSlots.value.map((slot, index) => h(
            ScreenProxy,
            {
              key: slot.key,
              route: slot.route,
              left: allSlots.value.length > 1 && index === 0,
              style: slot.key === currentSlot.splitSlots[currentSlot.splitSlots.length - 1]?.key
                ? ''
                : 'display: none;',
            },
            () => slot.slot,
          )),
        ];
      }
      else {
        if (currentSlot && currentSlot.splitSlots.length === 2) {
          return () => [
            ...allSlots.value.map((slot, index) => h(
              ScreenProxy,
              {
                key: slot.key,
                route: slot.route,
                left: allSlots.value.length > 1 && index === 0,
                style: currentSlot.splitSlots.map(s => s.key).includes(slot.key)
                  ? ''
                  : 'display: none;',
              },
              () => slot.slot,
            )),
          ];
        }
        else {
          return () => [
            ...allSlots.value.map((slot, index) => h(
              ScreenProxy,
              {
                key: slot.key,
                route: slot.route,
                left: allSlots.value.length > 1 && index === 0,
                style:
                (slot.key === currentSlot?.splitSlots[0].key)
                || (!currentSlot && index === allSlots.value.length - 1)
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
