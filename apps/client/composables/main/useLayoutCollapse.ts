import { ref } from "vue";

const isToolbarCollapsed = ref(false);
const isTipsCollapsed = ref(false);

export function useLayoutCollapse() {
  function toggleToolbar() {
    isToolbarCollapsed.value = !isToolbarCollapsed.value;
  }

  function toggleTips() {
    isTipsCollapsed.value = !isTipsCollapsed.value;
  }

  return {
    isToolbarCollapsed,
    isTipsCollapsed,
    toggleToolbar,
    toggleTips,
  };
}
