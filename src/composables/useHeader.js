import { ref } from 'vue';

// Shared state (singleton)
const title = ref("");
const breadcrumbs = ref([]);
const headerActions = ref([]);

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
   * Set header actions (buttons)
   * @param {Array<{ label: string, onClick: Function, variant?: string, title?: string }>} actions 
   */
  function setActions(actions) {
    headerActions.value = actions;
  }

  /**
   * Clear header state
   */
  function resetHeader() {
    title.value = "";
    breadcrumbs.value = [];
    headerActions.value = [];
  }

  return {
    title,
    breadcrumbs,
    headerActions,
    setTitle,
    setBreadcrumbs,
    setActions,
    resetHeader
  };
}
