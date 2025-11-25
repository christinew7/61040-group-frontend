import { ref } from 'vue';

// Shared state (singleton)
const title = ref("");
const breadcrumbs = ref([]);

export function useHeader() {
  /**
   * Set the header title
   * @param {string} newTitle 
   */
  function setTitle(newTitle) {
    title.value = newTitle;
  }

  /**
   * Set breadcrumbs for navigation
   * @param {Array<{ label: string, route?: string | object }>} crumbs 
   */
  function setBreadcrumbs(crumbs) {
    breadcrumbs.value = crumbs;
  }

  /**
   * Clear header state
   */
  function resetHeader() {
    title.value = "";
    breadcrumbs.value = [];
  }

  return {
    title,
    breadcrumbs,
    setTitle,
    setBreadcrumbs,
    resetHeader
  };
}
