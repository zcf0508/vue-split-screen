<script setup lang="ts">
import { computed } from 'vue';

type FoldableLanguage = 'zh' | 'en';

const props = defineProps<{
  isOpen: boolean;
  language: FoldableLanguage;
}>();

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
    :class="{ 'is-open': isOpen }"
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
        <div class="device-cover" aria-hidden="true">
          <div class="cover-screen">
            <div class="cover-island" />
            <div class="cover-home-indicator" />
          </div>
        </div>

        <div class="device-panel device-panel-left" aria-hidden="true">
          <div class="device-screen">
            <div class="device-camera" />
          </div>
        </div>

        <div class="foldable-hinge" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        <div class="device-panel device-panel-right" aria-hidden="true">
          <div class="device-screen device-screen-current">
            <div class="device-camera" />
          </div>
        </div>

        <div class="foldable-content">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.foldable-preview {
  position: relative;
  display: grid;
  grid-template-columns: minmax(250px, 0.7fr) minmax(500px, 1.3fr);
  align-items: center;
  min-width: 0;
  min-height: 470px;
  max-width: 1440px;
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
  max-width: 360px;
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
  min-height: 430px;
  perspective: 1100px;
}

.foldable-shadow {
  position: absolute;
  bottom: 9px;
  width: 550px;
  height: 32px;
  background: oklch(5% 0.01 75deg / 58%);
  border-radius: 50%;
  filter: blur(15px);
  transform: scaleX(0.86);
  transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1), opacity 850ms cubic-bezier(0.16, 1, 0.3, 1);
}

.foldable-device {
  position: relative;
  z-index: 1;
  width: 560px;
  height: 400px;
  transform: rotateX(5deg) rotateZ(-2deg);
  transform-style: preserve-3d;
  transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1);
}

.device-panel,
.device-cover {
  position: absolute;
  top: 0;
  width: 270px;
  height: 400px;
  padding: 6px;
  background: linear-gradient(145deg, oklch(52% 0.025 75deg), oklch(21% 0.02 75deg) 27%, oklch(8% 0.012 75deg));
  border: 1px solid oklch(60% 0.025 75deg);
  border-radius: 34px;
  box-shadow: 0 24px 34px oklch(5% 0.01 75deg / 48%), inset 0 0 0 1px oklch(82% 0.015 75deg / 24%);
  transform-style: preserve-3d;
  transition: transform 850ms cubic-bezier(0.16, 1, 0.3, 1), opacity 850ms cubic-bezier(0.16, 1, 0.3, 1), filter 850ms cubic-bezier(0.16, 1, 0.3, 1);
}

.device-panel::before,
.device-cover::before {
  position: absolute;
  z-index: -1;
  inset: 5px -4px -5px;
  background: linear-gradient(145deg, oklch(62% 0.02 75deg), oklch(17% 0.015 75deg) 42%, oklch(7% 0.01 75deg));
  border-radius: 35px;
  content: '';
  transform: translateZ(-7px);
}

.device-panel-left {
  left: 10px;
  border-radius: 34px 0 0 34px;
  transform-origin: right center;
}

.device-panel-right {
  right: 10px;
  border-radius: 0 34px 34px 0;
  transform-origin: left center;
}

.device-panel-left::before {
  border-radius: 35px 0 0 35px;
}

.device-panel-right::before {
  border-radius: 0 35px 35px 0;
}

.device-cover {
  z-index: 3;
  left: 50%;
  padding: 6px;
  opacity: 0;
  border-radius: 0 34px 34px 0;
  transform: translateX(-50%) translateZ(18px) scale(0.88);
  transform-origin: center;
}

.device-cover::before {
  border-radius: 0 35px 35px 0;
}

.foldable-preview:not(.is-open) .device-panel-left {
  filter: brightness(0.72);
  transform: rotateY(78deg);
}

.foldable-preview:not(.is-open) .device-panel-right {
  filter: brightness(0.72);
  transform: rotateY(-78deg);
}

.foldable-preview:not(.is-open) .device-panel {
  opacity: 0;
}

.foldable-preview:not(.is-open) .device-cover {
  opacity: 1;
  transform: translateX(-50%) translateZ(18px) scale(1);
}

.foldable-preview:not(.is-open) .foldable-content {
  right: auto;
  left: calc(50% - 129px);
  width: 258px;
}

.foldable-preview:not(.is-open) .foldable-shadow {
  opacity: 0.72;
  transform: scaleX(0.5);
}

.device-screen,
.cover-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 15px 13px;
  overflow: hidden;
  color: oklch(92% 0.02 75deg);
  background:
    radial-gradient(circle at 70% 20%, color-mix(in srgb, oklch(70% 0.14 75deg) 18%, transparent), transparent 42%),
    linear-gradient(145deg, oklch(20% 0.02 250deg), oklch(11% 0.014 75deg));
  border: 1px solid oklch(76% 0.015 75deg / 20%);
  border-radius: 27px;
  backface-visibility: hidden;
}

.device-screen-current {
  background:
    radial-gradient(circle at 68% 32%, color-mix(in srgb, oklch(71% 0.14 75deg) 22%, transparent), transparent 44%),
    linear-gradient(145deg, oklch(23% 0.025 38deg), oklch(10% 0.012 75deg));
}

.device-panel-left .device-screen {
  border-radius: 27px 0 0 27px;
}

.device-panel-right .device-screen {
  border-radius: 0 27px 27px 0;
}

.cover-screen {
  background:
    radial-gradient(circle at 32% 70%, color-mix(in srgb, oklch(65% 0.1 215deg) 24%, transparent), transparent 46%),
    linear-gradient(145deg, oklch(20% 0.018 215deg), oklch(10% 0.012 75deg));
  border-radius: 0 27px 27px 0;
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
  z-index: 5;
  top: 6px;
  right: 16px;
  bottom: 6px;
  left: 16px;
  overflow: hidden;
  border-radius: 24px;
  pointer-events: auto;
  transform: translateZ(24px);
  transition: left 850ms cubic-bezier(0.16, 1, 0.3, 1), right 850ms cubic-bezier(0.16, 1, 0.3, 1), width 850ms cubic-bezier(0.16, 1, 0.3, 1);
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

.foldable-content :deep(.page) {
  min-height: 100% !important;
  padding: 18px 15px !important;
  color: oklch(88% 0.018 75deg);
  background: transparent !important;
  box-shadow: inset 0 1px var(--accent) !important;
}

.foldable-content :deep(.page-heading) {
  gap: 8px;
}

.foldable-content :deep(.page-label),
.foldable-content :deep(.actions span) {
  font-size: 8px;
  letter-spacing: 0.08em;
}

.foldable-content :deep(.page h2) {
  margin-top: 4px;
  font-size: 22px;
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
  transform: translateX(-50%) translateZ(32px);
  transition: opacity 250ms ease;
}

.foldable-preview:not(.is-open) .foldable-hinge {
  opacity: 0;
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

@media (max-width: 980px) {
  .foldable-preview {
    grid-template-columns: minmax(210px, 0.66fr) minmax(430px, 1.34fr);
    padding-inline: 24px;
  }

  .foldable-device {
    transform: scale(0.82) rotateX(5deg) rotateZ(-2deg);
  }
}

@media (max-width: 760px) {
  .foldable-preview {
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
    min-height: 330px;
  }

  .foldable-device {
    left: 50%;
    margin-left: -280px;
    transform: scale(0.52) rotateX(5deg) rotateZ(-2deg);
  }
}
</style>
