import { onBeforeUnmount, onMounted } from 'vue';

export function useNavigationListener(onForward?: () => void, onBack?: () => void) {
  let historyPosition: number | null = null;

  function handleNavigation(event: PopStateEvent) {
    const nextPosition = typeof event.state?.position === 'number'
      ? event.state.position
      : null;

    if (historyPosition === null || nextPosition === null || nextPosition <= historyPosition) {
      onBack?.();
    }
    else {
      onForward?.();
    }
    historyPosition = nextPosition;
  }

  onMounted(() => {
    historyPosition = typeof window.history.state?.position === 'number'
      ? window.history.state.position
      : null;
    window.addEventListener('popstate', handleNavigation);
    // const currentState = { url: window.location.href };
    // history.replaceState(currentState, "");
    // history.pushState(currentState, "");
    history.replaceState(history.state, '', window.location.href);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('popstate', handleNavigation);
  });
}
