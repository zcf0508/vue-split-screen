import { onMounted, onBeforeUnmount, watch, ComputedRef } from "vue";

// last history position
let historyPosition: number | null = null

export function useNavigationListener(onForward?: Function, onBack?: Function) {
  function handleNavigation(event: PopStateEvent) {
    if (historyPosition === null || event.state?.position <= historyPosition) {
      onBack?.()
    } else {
      onForward?.()
    }
    historyPosition = event.state?.position ?? null
  }


  onMounted(() => {
    window.addEventListener("popstate", (event) => handleNavigation(event));
    // const currentState = { url: window.location.href };
    // history.replaceState(currentState, "");
    // history.pushState(currentState, "");
    history.replaceState(history.state, "", window.location.href);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("popstate", (event) => handleNavigation(event));
  });
}
