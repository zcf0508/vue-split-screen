<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSplitRouteNode, useSplitRouter } from 'vue-split-screen';

defineProps<{
  accent: string;
  path: string;
  title: string;
}>();

const route = useRoute();
const router = useSplitRouter();
const node = useSplitRouteNode();
const draft = ref('');
const lifecycle = ref({ activated: 0, deactivated: 0, mounted: 0, unmounted: 0 });
const shortId = computed(() => node.value.id.slice(-8));

onActivated(() => lifecycle.value.activated++);
onDeactivated(() => lifecycle.value.deactivated++);
onMounted(() => lifecycle.value.mounted++);
onUnmounted(() => lifecycle.value.unmounted++);
</script>

<template>
  <article class="page" :style="{ '--accent': accent }">
    <div class="page-content">
      <div class="page-heading">
        <div>
          <span class="page-label">pane route</span>
          <h2>{{ title }}</h2>
        </div>
        <span class="page-badge">{{ route.fullPath }}</span>
      </div>

      <dl class="page-facts">
        <div>
          <dt>node</dt>
          <dd>{{ shortId }}</dd>
        </div>
        <div>
          <dt>mounted</dt>
          <dd>{{ lifecycle.mounted }}</dd>
        </div>
        <div>
          <dt>activated</dt>
          <dd>{{ lifecycle.activated }}</dd>
        </div>
        <div>
          <dt>deactivated</dt>
          <dd>{{ lifecycle.deactivated }}</dd>
        </div>
      </dl>

      <label class="state-field">
        Local component state
        <input v-model="draft" placeholder="Type, navigate, then go back">
      </label>

      <section class="actions">
        <div>
          <span>push from this pane</span>
          <button v-for="target in ['a', 'b', 'c', 'd']" :key="target" @click="router.push(`/${target}`)">
            {{ target.toUpperCase() }}
          </button>
        </div>
        <div>
          <span>other navigation</span>
          <button @click="router.replace('/d')">
            replace → D
          </button>
          <button @click="router.push('/redirect')">
            redirect → D
          </button>
          <button @click="router.push('/blocked')">
            blocked
          </button>
        </div>
      </section>

      <p class="contract-note">
        Every action here uses <code>useSplitRouter()</code>, so its origin is this node—not the address-bar route.
      </p>
    </div>
  </article>
</template>

<style scoped>
.page {
  min-height: 610px;
  padding: 28px;
  color: oklch(88% 0.018 75deg);
  background: oklch(18% 0.01 75deg);
}

.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-label,
.actions span {
  color: oklch(62% 0.025 75deg);
  font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h2 {
  margin: 5px 0 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 32px;
  letter-spacing: -0.022em;
}

.page-badge {
  padding: 6px 9px;
  color: color-mix(in srgb, var(--accent) 68%, white);
  background: color-mix(in srgb, var(--accent) 10%, oklch(18% 0.01 75deg));
  border: 1px solid color-mix(in srgb, var(--accent) 38%, oklch(31% 0.012 75deg));
  border-radius: 999px;
  font: 12px ui-monospace, SFMono-Regular, Menlo, monospace;
}

.page-facts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin: 28px 0;
  overflow: hidden;
  background: oklch(31% 0.012 75deg);
  border: 1px solid oklch(31% 0.012 75deg);
  border-radius: 8px;
}

.page-facts div {
  padding: 11px;
  background: oklch(21% 0.012 75deg);
}

.page-facts dt {
  color: oklch(61% 0.025 75deg);
  font-size: 10px;
  text-transform: uppercase;
}

.page-facts dd {
  margin: 5px 0 0;
  font: 13px ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
}

.state-field {
  display: grid;
  gap: 8px;
  color: oklch(72% 0.024 75deg);
  font-size: 12px;
}

.state-field input {
  width: 100%;
  padding: 11px 12px;
  color: oklch(94% 0.015 75deg);
  background: oklch(14% 0.008 75deg);
  border: 1px solid oklch(31% 0.012 75deg);
  border-radius: 8px;
  outline: none;
}

.state-field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
}

.actions {
  display: grid;
  gap: 18px;
  margin-top: 28px;
}

.actions div {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.actions span {
  width: 100%;
}

.actions button {
  padding: 8px 10px;
}

.contract-note {
  margin: 30px 0 0;
  padding: 13px;
  color: oklch(67% 0.025 75deg);
  background: color-mix(in srgb, var(--accent) 6%, oklch(15% 0.008 75deg));
  font-size: 12px;
  line-height: 1.6;
}

.contract-note code {
  color: color-mix(in srgb, var(--accent) 62%, white);
}

@media (max-width: 760px) {
  .page {
    min-height: 540px;
    padding: 20px;
  }

  .page-facts {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
