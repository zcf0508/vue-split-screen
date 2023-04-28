import { onMounted, onBeforeUnmount } from "vue";

interface HistoryState {
  url: string;
}

let previousUrl = window.location.href;

export function useNavigationListener(onForward?: Function, onBack?: Function) {
  function handleNavigation(event: PopStateEvent) {
    if (event.state && event.state.url !== previousUrl) {
      previousUrl = event.state.url;
      onForward && onForward();
    } else {
      onBack && onBack();
    }
  }

  onMounted(() => {
    window.addEventListener("popstate", (event) => handleNavigation(event));
    const currentState = { url: window.location.href };
    history.replaceState(currentState, "");
    history.pushState(currentState, "");
  });

  onBeforeUnmount(() => {
    window.removeEventListener("popstate", (event) => handleNavigation(event));
  });
}
