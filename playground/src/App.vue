<script setup lang="ts">
import type { SplitRouteNode } from 'vue-split-screen';
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { SplitScreen } from 'vue-split-screen';

interface StoredSplitState {
  trail: SplitRouteNode[];
}

type OnboardingLanguage = 'zh' | 'en';

const onboardingContent = {
  zh: {
    close: '关闭项目介绍',
    description: '在宽屏或折叠屏上，打开详情时不必丢掉当前页面。这个项目让 Vue Router 的导航轨迹自然地呈现为两个相邻的页面，适合列表 / 详情、父子页面等场景。',
    footer: '这是一个可交互的行为演示，不只是静态截图。',
    intro: '✦ 项目介绍',
    kicker: 'vue-split-screen / 快速介绍',
    label: '为宽屏和折叠屏而生的路由体验',
    language: '选择语言',
    start: '开始体验',
    steps: [
      { description: '继续使用熟悉的 Vue Router，不需要维护第二套路由；最后两个页面会自动组成 split view。', number: '01', title: '一个路由，两个视图' },
      { description: '从任意 pane 发起 push / replace，Back 和 Forward 也会恢复对应的页面轨迹。', number: '02', title: '保留你的浏览上下文' },
      { description: '关闭介绍后，点击页面里的 A / B / C / D，观察第二个 pane 出现，再试试顶部的 Back。', number: '03', title: '现在就试试' },
    ],
    title: '让页面并排，而不是互相覆盖',
  },
  en: {
    close: 'Close project introduction',
    description: 'On a wide or foldable screen, opening a detail page should not make the current page disappear. This project turns Vue Router’s navigation trail into two adjacent pages—useful for list/detail and parent/child flows.',
    footer: 'This is an interactive behavior demo—not just a static screenshot.',
    intro: '✦ About this project',
    kicker: 'vue-split-screen / quick tour',
    label: 'A routing experience for wide and foldable screens',
    language: 'Select language',
    start: 'Start exploring',
    steps: [
      { description: 'Keep using Vue Router without maintaining a second router; the last two pages automatically become a split view.', number: '01', title: 'One router, two views' },
      { description: 'Push or replace from any pane, then use Back and Forward to restore the exact navigation trail.', number: '02', title: 'Keep your context' },
      { description: 'Close this intro, click A / B / C / D, watch the second pane appear, then try Back in the toolbar.', number: '03', title: 'Try it now' },
    ],
    title: 'Put pages side by side, not on top of each other',
  },
} as const;

const route = useRoute();
const router = useRouter();
const split = ref(true);
const reverse = ref(false);
const maxInactivePages = ref(0);
const trail = ref<SplitRouteNode[]>([]);
const navigationStatus = ref('ready');
const onboardingOpen = ref(true);
const onboardingLanguage = ref<OnboardingLanguage>('zh');

const onboardingStorageKey = 'vue-split-screen-onboarding-seen';
const languageStorageKey = 'vue-split-screen-onboarding-language';

const visibleTrail = computed(() => trail.value.map(node => node.fullPath).join(' → ') || 'initializing');
const onboardingCopy = computed(() => onboardingContent[onboardingLanguage.value]);

function refreshTrail() {
  const state = router.options.history.state as { __vueSplitScreen?: StoredSplitState };
  trail.value = state.__vueSplitScreen?.trail ?? [];
}

const removeAfterEach = router.afterEach((to, _from, failure) => {
  navigationStatus.value = failure ? `blocked: ${to.fullPath}` : `committed: ${to.fullPath}`;
  void nextTick(refreshTrail);
});

function dismissOnboarding() {
  onboardingOpen.value = false;
  localStorage.setItem(onboardingStorageKey, 'true');
}

function openOnboarding() {
  onboardingOpen.value = true;
}

function setOnboardingLanguage(language: OnboardingLanguage) {
  onboardingLanguage.value = language;
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  localStorage.setItem(languageStorageKey, language);
}

onMounted(() => {
  onboardingOpen.value = localStorage.getItem(onboardingStorageKey) !== 'true';
  const storedLanguage = localStorage.getItem(languageStorageKey);
  onboardingLanguage.value = storedLanguage === 'zh' || storedLanguage === 'en'
    ? storedLanguage
    : navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  document.documentElement.lang = onboardingLanguage.value === 'zh' ? 'zh-CN' : 'en';
  refreshTrail();
});
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
        <button class="intro-button" data-testid="open-onboarding" @click="openOnboarding">
          {{ onboardingCopy.intro }}
        </button>
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

    <div
      v-if="onboardingOpen"
      class="onboarding-backdrop"
      role="presentation"
      tabindex="-1"
      @click.self="dismissOnboarding"
      @keydown.esc="dismissOnboarding"
    >
      <section
        class="onboarding-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <div class="onboarding-topline">
          <span class="onboarding-kicker">{{ onboardingCopy.kicker }}</span>
          <div class="onboarding-topline-actions">
            <div class="language-switch" role="group" :aria-label="onboardingCopy.language">
              <button
                :class="{ active: onboardingLanguage === 'zh' }"
                :aria-pressed="onboardingLanguage === 'zh'"
                @click="setOnboardingLanguage('zh')"
              >
                中
              </button>
              <button
                :class="{ active: onboardingLanguage === 'en' }"
                :aria-pressed="onboardingLanguage === 'en'"
                @click="setOnboardingLanguage('en')"
              >
                EN
              </button>
            </div>
            <button class="onboarding-close" :aria-label="onboardingCopy.close" @click="dismissOnboarding">
              ×
            </button>
          </div>
        </div>

        <div class="onboarding-hero">
          <div class="onboarding-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          <p class="onboarding-label">
            {{ onboardingCopy.label }}
          </p>
          <h2 id="onboarding-title">
            {{ onboardingCopy.title }}
          </h2>
          <p id="onboarding-description">
            {{ onboardingCopy.description }}
          </p>
        </div>

        <div class="onboarding-grid">
          <article v-for="step in onboardingCopy.steps" :key="step.number">
            <span class="onboarding-number">{{ step.number }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </article>
        </div>

        <footer class="onboarding-footer">
          <span>{{ onboardingCopy.footer }}</span>
          <button class="onboarding-start" data-testid="start-onboarding" @click="dismissOnboarding">
            {{ onboardingCopy.start }} <span aria-hidden="true">→</span>
          </button>
        </footer>
      </section>
    </div>
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

.intro-button {
  color: oklch(86% 0.1 75deg);
  background: color-mix(in srgb, oklch(64% 0.16 75deg) 12%, oklch(18% 0.01 75deg));
  border-color: color-mix(in srgb, oklch(64% 0.16 75deg) 42%, oklch(28% 0.012 75deg));
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

.onboarding-backdrop {
  position: fixed;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow-y: auto;
  background: color-mix(in srgb, oklch(8% 0.01 75deg) 78%, transparent);
  backdrop-filter: blur(8px);
}

.onboarding-dialog {
  width: min(100%, 780px);
  overflow: hidden;
  color: oklch(91% 0.015 75deg);
  background:
    radial-gradient(circle at 86% 0%, color-mix(in srgb, oklch(64% 0.16 75deg) 16%, transparent), transparent 32%),
    oklch(17% 0.01 75deg);
  border: 1px solid oklch(36% 0.025 75deg);
  border-radius: 18px;
  box-shadow: 0 24px 80px color-mix(in srgb, black 55%, transparent);
}

.onboarding-topline,
.onboarding-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
}

.onboarding-topline {
  border-bottom: 1px solid oklch(28% 0.015 75deg);
}

.onboarding-topline-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-switch {
  display: flex;
  padding: 2px;
  background: oklch(13% 0.008 75deg);
  border: 1px solid oklch(29% 0.015 75deg);
  border-radius: 7px;
}

.language-switch button {
  min-width: 34px;
  min-height: 28px;
  padding: 3px 7px;
  color: oklch(62% 0.02 75deg);
  background: transparent;
  border: 0;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 650;
}

.language-switch button.active {
  color: oklch(88% 0.08 75deg);
  background: oklch(31% 0.04 75deg);
}

.onboarding-kicker,
.onboarding-label,
.onboarding-number {
  color: oklch(70% 0.08 75deg);
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.onboarding-close {
  min-width: 32px;
  min-height: 32px;
  padding: 2px 8px;
  color: oklch(68% 0.02 75deg);
  background: transparent;
  border-color: transparent;
  font-size: 22px;
  line-height: 1;
}

.onboarding-hero {
  padding: 32px 48px 26px;
}

.onboarding-mark {
  display: flex;
  gap: 5px;
  margin-bottom: 22px;
}

.onboarding-mark span {
  display: block;
  width: 30px;
  height: 7px;
  background: oklch(73% 0.14 75deg);
  border-radius: 999px;
}

.onboarding-mark span:last-child {
  opacity: 0.42;
}

.onboarding-label {
  margin: 0 0 10px;
}

.onboarding-hero h2 {
  max-width: 620px;
  margin: 0;
  color: oklch(96% 0.018 75deg);
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1.05;
  text-wrap: balance;
}

.onboarding-hero p:last-child {
  max-width: 640px;
  margin: 18px 0 0;
  color: oklch(70% 0.025 75deg);
  font-size: 15px;
  line-height: 1.75;
}

.onboarding-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  margin: 0 24px;
  overflow: hidden;
  background: oklch(31% 0.015 75deg);
  border: 1px solid oklch(31% 0.015 75deg);
  border-radius: 10px;
}

.onboarding-grid article {
  min-height: 154px;
  padding: 18px;
  background: oklch(20% 0.012 75deg);
}

.onboarding-grid h3 {
  margin: 20px 0 8px;
  color: oklch(89% 0.018 75deg);
  font-size: 15px;
  font-weight: 600;
}

.onboarding-grid p {
  margin: 0;
  color: oklch(66% 0.024 75deg);
  font-size: 12px;
  line-height: 1.6;
}

.onboarding-footer {
  margin-top: 8px;
  color: oklch(61% 0.025 75deg);
  font-size: 12px;
}

.onboarding-start {
  min-width: auto;
  padding: 10px 14px;
  color: oklch(15% 0.01 75deg);
  background: oklch(77% 0.13 75deg);
  border-color: oklch(77% 0.13 75deg);
  font-weight: 650;
  white-space: nowrap;
}

.onboarding-start:hover {
  color: oklch(12% 0.01 75deg);
  background: oklch(83% 0.13 75deg);
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

  .onboarding-backdrop {
    align-items: start;
    padding: 12px;
  }

  .onboarding-hero {
    padding: 26px 24px 22px;
  }

  .onboarding-grid {
    grid-template-columns: 1fr;
  }

  .onboarding-grid article {
    min-height: auto;
  }

  .onboarding-footer {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 24px 24px;
  }
}
</style>
