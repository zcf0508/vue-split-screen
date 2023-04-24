import { onMounted, onBeforeUnmount } from "vue";

interface HistoryState {
  url: string;
}

let previousUrl = window.location.href;

function handleNavigation(event: PopStateEvent, onForward?: Function, onBack?: Function) {
  const state = event.state as HistoryState;
  const currentUrl = window.location.href;
  if (currentUrl !== previousUrl) {
    const direction = currentUrl > previousUrl ? "forward" : "back";
    if (direction === "forward") {
      onForward && onForward(state.url);
    } else {
      onBack && onBack(state.url);
    }
    previousUrl = currentUrl;
  }
}

export function useNavigationListener(onForward?: Function, onBack?: Function) {
  onMounted(() => {
    window.addEventListener("popstate", (event) => handleNavigation(event, onForward, onBack));
    const currentState = { url: window.location.href };
    history.replaceState(currentState, "");
    history.pushState(currentState, "");
  });

  onBeforeUnmount(() => {
    window.removeEventListener("popstate", (event) => handleNavigation(event, onForward, onBack));
  });
}
