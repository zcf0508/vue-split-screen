import type { Ref } from 'vue';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

export type FoldPhase = 'closed' | 'closing-cover' | 'closing-inner' | 'open' | 'opening-cover' | 'opening-inner';

interface FoldTransitionOptions {
  duration: number;
  midpoint: number;
  prefersReducedMotion?: () => boolean;
}

export function useFoldTransition(isOpen: Readonly<Ref<boolean>>, options: FoldTransitionOptions) {
  const prefersReducedMotion = options.prefersReducedMotion
    ?? (() => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const phase = ref<FoldPhase>(isOpen.value ? 'open' : 'closed');
  const presentationOpen = ref(isOpen.value);
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  let midpointTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimers() {
    clearTimeout(endTimer);
    clearTimeout(midpointTimer);
  }

  watch(isOpen, (open) => {
    clearTimers();
    if (prefersReducedMotion()) {
      presentationOpen.value = open;
      phase.value = open ? 'open' : 'closed';
      return;
    }

    phase.value = open ? 'opening-cover' : 'closing-inner';
    midpointTimer = setTimeout(() => {
      presentationOpen.value = open;
      phase.value = open ? 'opening-inner' : 'closing-cover';
    }, options.midpoint);
    endTimer = setTimeout(() => {
      phase.value = open ? 'open' : 'closed';
    }, options.duration);
  });

  onBeforeUnmount(clearTimers);

  return {
    phase,
    presentationOpen,
    settledOpen: computed(() => phase.value === 'open'),
  };
}
