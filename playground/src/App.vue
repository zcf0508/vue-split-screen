<script setup lang="ts">
import type { SplitRouteNode } from 'vue-split-screen';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { SplitScreen } from 'vue-split-screen';

interface StoredSplitState {
  trail: SplitRouteNode[];
}

const route = useRoute();
const router = useRouter();
const split = ref(true);
const reverse = ref(false);
const maxInactivePages = ref(0);
const trail = ref<SplitRouteNode[]>([]);
const navigationStatus = ref('ready');

const visibleTrail = computed(() => trail.value.map(node => node.fullPath).join(' → ') || 'initializing');

function refreshTrail() {
  const state = router.options.history.state as { __vueSplitScreen?: StoredSplitState };
  trail.value = state.__vueSplitScreen?.trail ?? [];
}

const removeAfterEach = router.afterEach((to, _from, failure) => {
  navigationStatus.value = failure ? `blocked: ${to.fullPath}` : `committed: ${to.fullPath}`;
  void nextTick(refreshTrail);
});

onMounted(refreshTrail);
onBeforeUnmount(removeAfterEach);
</script>

<template>
  <main class="app-shell">
    <header class="toolbar">
      <div>
        <p class="eyebrow">
          vue-split-screen / deterministic history lab
        </p>
        <h1>Split history workbench</h1>
      </div>

      <div class="toolbar-actions">
        <button data-testid="back" @click="router.back()">
          ← Back
        </button>
        <button data-testid="forward" @click="router.forward()">
          Forward →
        </button>
        <label>
          <input v-model="split" type="checkbox">
          split
        </label>
        <label>
          <input v-model="reverse" type="checkbox">
          reverse
        </label>
        <label>
          retain
          <select v-model.number="maxInactivePages" data-testid="retention-limit">
            <option :value="0">0</option>
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="10">10</option>
          </select>
        </label>
      </div>
    </header>

    <section class="diagnostics" aria-label="Router diagnostics">
      <div><span>URL</span><code>{{ route.fullPath }}</code></div>
      <div><span>trail</span><code data-testid="trail">{{ visibleTrail }}</code></div>
      <div><span>result</span><code>{{ navigationStatus }}</code></div>
    </section>

    <RouterView v-slot="{ Component }">
      <SplitScreen
        class="split-stage"
        :turn-on="split"
        :split-reverse="reverse"
        :max-inactive-pages="maxInactivePages"
      >
        <component :is="Component" />
        <template #placeholder>
          <div class="placeholder">
            <span>Second pane</span>
            <strong>Push a route to begin</strong>
          </div>
        </template>
      </SplitScreen>
    </RouterView>
  </main>
</template>

<style>
:root {
  color: oklch(91% 0.015 75deg);
  background: oklch(14% 0.008 75deg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

button,
select,
input {
  font: inherit;
}

button,
select {
  color: oklch(91% 0.015 75deg);
  background: oklch(21% 0.012 75deg);
  border: 1px solid oklch(34% 0.014 75deg);
  border-radius: 8px;
}

button {
  min-width: 40px;
  min-height: 40px;
  padding: 8px 12px;
  cursor: pointer;
  touch-action: manipulation;
  transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

button:active {
  transform: scale(0.96);
}

button:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 2px solid oklch(78% 0.13 75deg);
  outline-offset: 2px;
}

@media (hover: hover) {
  button:hover {
    border-color: oklch(58% 0.025 75deg);
    background: oklch(25% 0.014 75deg);
  }
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  max-width: 1440px;
  margin: 0 auto 18px;
}

.eyebrow {
  margin: 0 0 6px;
  color: oklch(67% 0.035 75deg);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: oklch(94% 0.018 75deg);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(22px, 3vw, 36px);
  font-weight: 650;
  letter-spacing: -0.022em;
  text-wrap: balance;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  flex-wrap: wrap;
}

.toolbar-actions label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  min-height: 40px;
  color: oklch(76% 0.018 75deg);
  background: oklch(18% 0.01 75deg);
  border: 1px solid oklch(28% 0.012 75deg);
  border-radius: 8px;
  font-size: 13px;
}

.toolbar-actions select {
  padding: 2px 6px;
}

.diagnostics {
  display: grid;
  grid-template-columns: minmax(180px, 0.8fr) minmax(280px, 2fr) minmax(180px, 1fr);
  gap: 1px;
  max-width: 1440px;
  margin: 0 auto 12px;
  overflow: hidden;
  background: oklch(31% 0.012 75deg);
  border: 1px solid oklch(31% 0.012 75deg);
  border-radius: 8px;
}

.diagnostics div {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  background: oklch(18% 0.01 75deg);
}

.diagnostics span {
  color: oklch(62% 0.025 75deg);
  font-size: 11px;
  text-transform: uppercase;
}

.diagnostics code {
  overflow: hidden;
  color: oklch(86% 0.02 75deg);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.split-stage {
  min-height: 610px;
  max-width: 1440px;
  margin: 0 auto;
  gap: 12px;
}

[data-split-route] {
  overflow: hidden;
  border: 1px solid oklch(31% 0.012 75deg);
  border-radius: 12px;
}

.placeholder {
  display: grid;
  place-content: center;
  height: 100%;
  color: oklch(58% 0.025 75deg);
  background: oklch(17% 0.008 75deg);
  border: 1px dashed oklch(34% 0.014 75deg);
  border-radius: 12px;
  text-align: center;
}

.placeholder span {
  margin-bottom: 8px;
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.placeholder strong {
  color: oklch(74% 0.025 75deg);
  font-size: 18px;
}

@media (max-width: 760px) {
  .app-shell {
    padding: 16px;
  }

  .toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }

  .diagnostics {
    grid-template-columns: 1fr;
  }

  .split-stage {
    flex-direction: column !important;
  }

  .split-stage > [data-split-route],
  .split-stage > div {
    width: 100% !important;
    flex-basis: auto !important;
  }
}
</style>
