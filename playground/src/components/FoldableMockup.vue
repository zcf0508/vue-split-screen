<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useFoldTransition } from '@/composables/useFoldTransition';
import { usePaneClone } from '@/composables/usePaneClone';

type FoldableLanguage = 'zh' | 'en';

const props = defineProps<{
  isOpen: boolean;
  language: FoldableLanguage;
}>();

const emit = defineEmits<{
  presentationChange: [isOpen: boolean];
}>();

const foldTiming = { duration: 1350, midpoint: 500 };
const fixedClone = ref<HTMLElement>();
const screenContent = ref<HTMLElement>();
const { clear, clonePane, clonePaneAfterRender } = usePaneClone(screenContent, fixedClone);
const { phase, presentationOpen, settledOpen } = useFoldTransition(toRef(props, 'isOpen'), foldTiming);

watch(presentationOpen, isOpen => emit('presentationChange', isOpen));
watch(phase, (currentPhase) => {
  if (currentPhase === 'closing-inner') {
    clonePane(1);
  }
  else if (currentPhase === 'opening-inner') {
    clonePaneAfterRender(1, () => phase.value === 'opening-inner');
  }
  else {
    clear();
  }
});

const copy = computed(() => ({
  en: {
    description: 'The real demo lives inside the device. Use the controls on either page, then open or close the phone to see the same history adapt to the available space.',
    eyebrow: 'foldable / split mode',
    openHint: 'two pages, one navigation trail',
    presentation: 'presentation',
    single: 'single view',
    singleHint: 'one page, one focus',
    split: 'split view',
    title: 'Fold the interface.',
  },
  zh: {
    description: '真正的演示就在设备屏幕里。直接操作任意页面，再打开或合上手机，看看同一条导航轨迹如何适应可用空间。',
    eyebrow: '折叠屏 / split mode',
    openHint: '一条导航轨迹，两个页面',
    presentation: '当前呈现',
    single: '单屏模式',
    singleHint: '一个页面，专注当前内容',
    split: '平铺双屏',
    title: '让界面随设备展开。',
  },
}[props.language]));
</script>

<template>
  <section
    class="foldable-preview"
    :class="{ 'is-open': isOpen, 'is-settled': settledOpen }"
    :data-fold-phase="phase"
    :style="{ '--fold-midpoint': `${foldTiming.midpoint}ms` }"
    aria-labelledby="foldable-preview-title"
  >
    <div class="foldable-copy">
      <p class="foldable-eyebrow">
        {{ copy.eyebrow }}
      </p>
      <h2 id="foldable-preview-title">
        {{ copy.title }}
      </h2>
      <p class="foldable-description">
        {{ copy.description }}
      </p>
      <div class="foldable-readout" aria-live="polite">
        <span>{{ copy.presentation }}</span>
        <strong>{{ isOpen ? copy.split : copy.single }}</strong>
        <small>{{ isOpen ? copy.openHint : copy.singleHint }}</small>
      </div>
    </div>

    <div class="foldable-visual">
      <div class="foldable-shadow" aria-hidden="true" />
      <div class="foldable-device">
        <div class="device-stage">
          <div class="fixed-half" aria-hidden="true">
            <div class="fixed-screen">
              <div class="device-camera" />
            </div>
            <div ref="fixedClone" class="foldable-content fixed-content-clone" data-fold-clone />
          </div>

          <div class="moving-half">
            <div class="moving-face outer-face" aria-hidden="true">
              <div class="outer-screen">
                <div class="cover-island" />
                <div class="cover-home-indicator" />
              </div>
            </div>

            <div class="moving-face inner-face" aria-hidden="true" />

            <div class="content-face">
              <div ref="screenContent" class="foldable-content">
                <slot />
              </div>
            </div>
          </div>

          <div class="foldable-hinge" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.foldable-preview {
  --device-height: clamp(457px, min(45.7vw, 58.6vh), 840px);
  --device-width: clamp(640px, min(64vw, 82vh), 1180px);
  position: relative;
  display: grid;
  grid-template-columns: minmax(280px, 0.7fr) minmax(560px, 1.3fr);
  align-items: center;
  min-width: 0;
  min-height: clamp(525px, max(calc(var(--device-height) + 68px), calc(100dvh - 175px)), 1260px);
  max-width: min(2200px, calc(100vw - 48px));
  margin: 0 auto 12px;
  padding: 34px 42px;
  overflow: hidden;
  color: oklch(91% 0.015 75deg);
  background:
    radial-gradient(circle at 78% 50%, color-mix(in srgb, oklch(67% 0.14 75deg) 14%, transparent), transparent 34%),
    oklch(18% 0.012 75deg);
  border: 1px solid oklch(31% 0.018 75deg);
  border-radius: 12px;
}

.foldable-preview::before {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(color-mix(in srgb, white 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, white 4%, transparent) 1px, transparent 1px);
  background-size: 34px 34px;
  content: '';
  mask-image: linear-gradient(90deg, transparent, black 48%, transparent);
  opacity: 0.22;
  pointer-events: none;
}

.foldable-copy {
  position: relative;
  z-index: 1;
  max-width: 400px;
}

.foldable-eyebrow {
  margin: 0 0 12px;
  color: oklch(71% 0.1 75deg);
  font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.foldable-copy h2 {
  margin: 0;
  color: oklch(96% 0.018 75deg);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1;
  text-wrap: balance;
}

.foldable-description {
  max-width: 330px;
  margin: 16px 0 0;
  color: oklch(69% 0.025 75deg);
  font-size: 13px;
  line-height: 1.65;
}

.foldable-readout {
  display: grid;
  gap: 4px;
  margin-top: 22px;
  padding-left: 12px;
  border-left: 2px solid oklch(73% 0.14 75deg);
}

.foldable-readout span,
.foldable-readout small {
  color: oklch(59% 0.025 75deg);
  font-size: 11px;
}

.foldable-readout span {
  text-transform: uppercase;
}

.foldable-readout strong {
  color: oklch(90% 0.06 75deg);
  font: 18px ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: -0.02em;
}

.foldable-visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: var(--device-height);
  perspective: 1500px;
  perspective-origin: 54% 46%;
}

.foldable-shadow {
  position: absolute;
  bottom: 9px;
  width: var(--device-width);
  height: 32px;
  background: oklch(5% 0.01 75deg / 58%);
  border-radius: 50%;
  filter: blur(15px);
  transform: translateX(0) scaleX(0.86);
  transition: transform 1350ms cubic-bezier(0.45, 0, 0.2, 1), opacity 1350ms cubic-bezier(0.45, 0, 0.2, 1);
}

.foldable-device {
  --content-scale: clamp(1, calc(var(--device-width) / 640px), 1.85);
  --content-safe-x: calc(clamp(15px, 1.6vw, 24px) * var(--content-scale));
  --content-safe-y: calc(clamp(18px, 1.8vw, 26px) * var(--content-scale));
  --device-radius: clamp(34px, 3vw, 52px);
  --screen-radius: clamp(27px, 2.5vw, 44px);
  position: relative;
  z-index: 1;
  width: var(--device-width);
  height: var(--device-height);
  transform: rotateX(5deg) rotateZ(-2deg);
  transform-style: preserve-3d;
}

.device-stage {
  position: absolute;
  inset: 0;
  transform: translateX(-25%);
  transform-style: preserve-3d;
  transition: transform 1350ms cubic-bezier(0.45, 0, 0.2, 1);
}

.is-open .device-stage {
  transform: translateX(0);
}

.fixed-half,
.moving-face {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  padding: 6px;
  background: linear-gradient(145deg, oklch(52% 0.025 75deg), oklch(21% 0.02 75deg) 27%, oklch(8% 0.012 75deg));
  border: 1px solid oklch(60% 0.025 75deg);
  box-shadow: 0 24px 34px oklch(5% 0.01 75deg / 48%), inset 0 0 0 1px oklch(82% 0.015 75deg / 24%);
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.fixed-half::before,
.moving-face::before {
  position: absolute;
  z-index: -1;
  inset: 5px -4px -5px;
  background: linear-gradient(145deg, oklch(62% 0.02 75deg), oklch(17% 0.015 75deg) 42%, oklch(7% 0.01 75deg));
  content: '';
  transform: translateZ(-7px);
}

.fixed-half {
  z-index: 1;
  right: 0;
  border-radius: 0 var(--device-radius) var(--device-radius) 0;
}

.fixed-half::before {
  border-radius: 0 calc(var(--device-radius) + 1px) calc(var(--device-radius) + 1px) 0;
}

.moving-half {
  position: absolute;
  z-index: 3;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  transform: rotateY(0deg);
  transform-origin: left center;
  transform-style: preserve-3d;
  transition: transform 1350ms cubic-bezier(0.45, 0, 0.2, 1);
  will-change: transform;
}

.is-open .moving-half {
  transform: rotateY(-180deg);
}

.moving-face {
  inset: 0;
  width: 100%;
  border-radius: 0 var(--device-radius) var(--device-radius) 0;
}

.moving-face::before {
  border-radius: 0 calc(var(--device-radius) + 1px) calc(var(--device-radius) + 1px) 0;
}

.outer-face {
  transform: translateZ(5px);
}

.inner-face {
  overflow: visible;
  border-radius: var(--device-radius) 0 0 var(--device-radius);
  transform: rotateY(180deg) translateZ(5px);
}

.inner-face::before {
  border-radius: calc(var(--device-radius) + 1px) 0 0 calc(var(--device-radius) + 1px);
}

.content-face {
  position: absolute;
  z-index: 5;
  inset: 0;
  backface-visibility: hidden;
  transform: translateZ(7px);
  transform-style: preserve-3d;
  transition: transform 0s var(--fold-midpoint);
}

.is-open .content-face {
  transform: rotateY(180deg) translateZ(7px);
}

.fixed-screen,
.outer-screen {
  position: relative;
  height: 100%;
  overflow: hidden;
  border: 1px solid oklch(76% 0.015 75deg / 20%);
}

.fixed-screen {
  background:
    radial-gradient(circle at 35% 32%, color-mix(in srgb, oklch(71% 0.14 75deg) 22%, transparent), transparent 44%),
    linear-gradient(145deg, oklch(23% 0.025 38deg), oklch(10% 0.012 75deg));
  border-radius: 0 var(--screen-radius) var(--screen-radius) 0;
}

.fixed-content-clone {
  position: absolute;
  z-index: 2;
  inset: 6px;
  overflow: hidden;
  background: oklch(11% 0.012 75deg);
  border-radius: 0 calc(var(--screen-radius) - 6px) calc(var(--screen-radius) - 6px) 0;
  pointer-events: none;
}

.foldable-preview:not(.is-open) .foldable-shadow {
  opacity: 0.72;
  transform: translateX(-25%) scaleX(0.48);
}

.outer-screen {
  background:
    radial-gradient(circle at 32% 70%, color-mix(in srgb, oklch(65% 0.1 215deg) 24%, transparent), transparent 46%),
    linear-gradient(145deg, oklch(20% 0.018 215deg), oklch(10% 0.012 75deg));
  border-radius: 0 var(--screen-radius) var(--screen-radius) 0;
}

.device-camera,
.cover-island {
  position: absolute;
  top: 8px;
  left: 50%;
  width: 48px;
  height: 11px;
  background: oklch(5% 0.01 75deg);
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px oklch(78% 0.015 75deg / 12%);
  pointer-events: none;
  transform: translateX(-50%);
}

.device-camera {
  opacity: 0.65;
}

.cover-island {
  top: 11px;
  width: 54px;
  height: 13px;
}

.foldable-content {
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 6px;
  overflow: hidden;
  background:
    radial-gradient(circle at 72% 30%, oklch(65% 0.1 65deg / 12%), transparent 42%),
    oklch(11% 0.012 75deg);
  border: 1px solid oklch(76% 0.015 75deg / 20%);
  border-radius: 0 var(--screen-radius) var(--screen-radius) 0;
  transform: translateZ(2px);
  transition: none;
}

.is-settled .foldable-content {
  width: 200%;
  border-radius: var(--screen-radius);
}

.foldable-preview:not(.is-settled) .content-face :deep([data-split-screen] > :nth-child(2)) {
  display: none;
}

.fixed-content-clone.fixed-content-clone {
  inset: 6px;
  width: auto;
  height: auto;
  padding: 0;
  border: 0;
  border-radius: 0 calc(var(--screen-radius) - 6px) calc(var(--screen-radius) - 6px) 0;
  transform: none;
  transition: none;
}

.fixed-content-clone::after {
  display: none;
}

.foldable-content::after {
  position: absolute;
  z-index: 8;
  top: 6px;
  bottom: 6px;
  left: 50%;
  width: 16px;
  background: linear-gradient(90deg, transparent, oklch(3% 0.01 75deg / 52%) 46%, oklch(92% 0.02 75deg / 9%) 54%, transparent);
  content: '';
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
}

.is-settled .foldable-content::after {
  opacity: 1;
}

.foldable-content :deep([data-split-screen]) {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  max-width: none !important;
  margin: 0 !important;
  gap: 0 !important;
  overflow: hidden;
}

.foldable-content :deep([data-split-route]) {
  width: 0 !important;
  height: 100% !important;
  min-width: 0 !important;
  flex: 1 1 0 !important;
  overflow: auto !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.fixed-content-clone :deep([data-fold-pane-clone]) {
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  flex: none !important;
}

.foldable-content :deep(.page) {
  min-height: 100% !important;
  padding: var(--content-safe-y) var(--content-safe-x) !important;
  color: oklch(88% 0.018 75deg);
  background: transparent !important;
}

.foldable-content :deep(.page-content) {
  width: calc(100% / var(--content-scale));
  transform: scale(var(--content-scale));
  transform-origin: top left;
}

.foldable-content :deep(.page-heading) {
  gap: 8px;
}

.foldable-content :deep(.page-heading > div) {
  min-width: 0;
}

.foldable-content :deep(.page-label),
.foldable-content :deep(.actions span) {
  font-size: 8px;
  letter-spacing: 0.08em;
}

.foldable-content :deep(.page h2) {
  margin-top: 4px;
  font-size: 22px;
  overflow-wrap: anywhere;
}

.foldable-content :deep(.page-badge) {
  max-width: 46%;
  padding: 4px 6px;
  overflow: hidden;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.foldable-content :deep(.page-facts) {
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  margin: 16px 0;
}

.foldable-content :deep(.page-facts div) {
  min-width: 0;
  padding: 7px;
}

.foldable-content :deep(.page-facts dt) {
  font-size: 8px;
}

.foldable-content :deep(.page-facts dd) {
  margin-top: 3px;
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
}

.foldable-content :deep(.state-field) {
  gap: 4px;
  font-size: 10px;
}

.foldable-content :deep(.state-field input) {
  min-width: 0;
  padding: 7px 8px;
  font-size: 10px;
}

.foldable-content :deep(.actions) {
  gap: 12px;
  margin-top: 16px;
}

.foldable-content :deep(.actions div) {
  gap: 4px;
}

.foldable-content :deep(.actions button) {
  min-width: 30px;
  min-height: 29px;
  padding: 5px 7px;
  font-size: 10px;
}

.foldable-content :deep(.contract-note) {
  display: none;
}

.foldable-hinge {
  position: absolute;
  z-index: 6;
  top: 10px;
  left: 50%;
  display: grid;
  align-content: space-evenly;
  width: 10px;
  height: calc(100% - 20px);
  padding: 25px 0;
  background: linear-gradient(90deg, oklch(8% 0.01 75deg), oklch(72% 0.025 75deg), oklch(12% 0.01 75deg));
  border-radius: 999px;
  box-shadow: 0 0 10px oklch(85% 0.02 75deg / 25%);
  pointer-events: none;
  opacity: 0.25;
  transform: translateX(-50%) translateZ(10px) scaleY(0.96);
  transition: opacity 600ms ease, transform 1350ms cubic-bezier(0.45, 0, 0.2, 1);
}

.is-open .foldable-hinge {
  opacity: 1;
  transform: translateX(-50%) translateZ(15px) scaleY(1);
}

.foldable-hinge i {
  display: block;
  width: 3px;
  height: 19px;
  margin: 0 auto;
  background: oklch(8% 0.01 75deg / 80%);
  border-radius: 999px;
}

.cover-home-indicator {
  position: absolute;
  bottom: 11px;
  left: 50%;
  width: 68px;
  height: 4px;
  background: oklch(90% 0.02 75deg / 46%);
  border-radius: 999px;
  transform: translateX(-50%);
}

@media (max-width: 1100px) {
  .foldable-preview {
    --device-height: 400px;
    --device-width: 560px;
    grid-template-columns: minmax(210px, 0.66fr) minmax(430px, 1.34fr);
    padding-inline: 24px;
  }

  .foldable-device {
    transform: scale(0.82) rotateX(5deg) rotateZ(-2deg);
  }
}

@media (max-width: 760px) {
  .foldable-preview {
    --device-height: clamp(223px, 57.14vw, 400px);
    --device-width: min(80vw, 560px);
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    min-height: 0;
    padding: 24px 20px 2px;
  }

  .foldable-copy {
    max-width: none;
    min-width: 0;
    width: 100%;
  }

  .foldable-description {
    max-width: none;
  }

  .foldable-readout {
    margin-top: 16px;
  }

  .foldable-visual {
    min-width: 0;
    width: 100%;
    min-height: var(--device-height);
  }

  .foldable-device {
    left: auto;
    margin-left: 0;
    transform: rotateX(5deg) rotateZ(-2deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .device-stage,
  .moving-half,
  .content-face,
  .foldable-shadow,
  .foldable-hinge,
  .foldable-content,
  .foldable-content::after {
    transition-duration: 1ms;
    transition-delay: 0ms;
  }
}
</style>
