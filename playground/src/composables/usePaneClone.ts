import type { Ref } from 'vue';
import { nextTick, onBeforeUnmount } from 'vue';

export function usePaneClone(sourceRoot: Ref<HTMLElement | undefined>, targetRoot: Ref<HTMLElement | undefined>) {
  let operation = 0;
  let renderTimer: ReturnType<typeof setTimeout> | undefined;

  function clear() {
    operation++;
    clearTimeout(renderTimer);
    targetRoot.value?.replaceChildren();
  }

  function clonePane(index: number) {
    clear();
    const source = sourceRoot.value?.querySelector('[data-split-screen]')?.children.item(index);
    if (!(source instanceof HTMLElement) || !targetRoot.value) {
      return;
    }

    const clone = source.cloneNode(true) as HTMLElement;
    clone.dataset.foldPaneClone = '';
    Object.assign(clone.style, {
      flex: 'none',
      height: '100%',
      minWidth: '0',
      width: '100%',
    });
    const sourceFields = source.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
    const cloneFields = clone.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
    sourceFields.forEach((field, fieldIndex) => {
      const cloneField = cloneFields[fieldIndex];
      if (cloneField) {
        cloneField.value = field.value;
      }
    });
    targetRoot.value.append(clone);
  }

  function clonePaneAfterRender(index: number, shouldClone: () => boolean) {
    const currentOperation = ++operation;
    clearTimeout(renderTimer);
    void nextTick(() => {
      renderTimer = setTimeout(() => {
        if (currentOperation === operation && shouldClone()) {
          clonePane(index);
        }
      });
    });
  }

  onBeforeUnmount(clear);

  return { clear, clonePane, clonePaneAfterRender };
}
