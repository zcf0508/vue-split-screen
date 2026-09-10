import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useFoldTransition } from '../../playground/src/composables/useFoldTransition';

afterEach(() => vi.useRealTimers());

describe('fold transition phases', () => {
  it('changes presentation only at the physical midpoint', async () => {
    vi.useFakeTimers();
    const scope = effectScope();
    const open = ref(false);
    const state = scope.run(() => useFoldTransition(open, {
      duration: 1350,
      midpoint: 500,
      prefersReducedMotion: () => false,
    }))!;

    open.value = true;
    await nextTick();
    expect(state.phase.value).toBe('opening-cover');
    expect(state.presentationOpen.value).toBe(false);

    await vi.advanceTimersByTimeAsync(499);
    expect(state.presentationOpen.value).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(state.phase.value).toBe('opening-inner');
    expect(state.presentationOpen.value).toBe(true);

    await vi.advanceTimersByTimeAsync(850);
    expect(state.phase.value).toBe('open');
    expect(state.settledOpen.value).toBe(true);

    open.value = false;
    await nextTick();
    expect(state.phase.value).toBe('closing-inner');
    expect(state.presentationOpen.value).toBe(true);
    expect(state.settledOpen.value).toBe(false);

    await vi.advanceTimersByTimeAsync(500);
    expect(state.phase.value).toBe('closing-cover');
    expect(state.presentationOpen.value).toBe(false);

    await vi.advanceTimersByTimeAsync(850);
    expect(state.phase.value).toBe('closed');
    scope.stop();
  });

  it('settles immediately when reduced motion is requested', async () => {
    const scope = effectScope();
    const open = ref(true);
    const state = scope.run(() => useFoldTransition(open, {
      duration: 1350,
      midpoint: 500,
      prefersReducedMotion: () => true,
    }))!;

    open.value = false;
    await nextTick();
    expect(state.phase.value).toBe('closed');
    expect(state.presentationOpen.value).toBe(false);
    scope.stop();
  });
});
