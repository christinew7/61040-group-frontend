import { ref } from 'vue';

// Shared state (singleton)
const searchQuery = ref("");
const ingredientFilters = ref([]);

export function useAppSearch() {
  function setSearchQuery(query) {
    searchQuery.value = query;
  }

  function setIngredientFilters(filters) {
    ingredientFilters.value = filters;
  }

  return {
    searchQuery,
    ingredientFilters,
    setSearchQuery,
    setIngredientFilters
  };
}
