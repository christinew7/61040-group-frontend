import { ref } from "vue";

// Shared state (singleton)
const searchQuery = ref("");
const ingredientFilters = ref([]);

/**
 * Generate singular and plural variations of an ingredient name
 * @param {string} ingredient - The ingredient name
 * @returns {string[]} Array of variations to search for
 */
function generateIngredientVariations(ingredient) {
  const variations = [ingredient];
  const lower = ingredient.toLowerCase().trim();

  // Common plural patterns
  if (lower.endsWith("s") && lower.length > 2) {
    // Try removing 's' for plural -> singular
    variations.push(lower.slice(0, -1));

    // Handle -es endings (tomatoes -> tomato)
    if (lower.endsWith("es") && lower.length > 3) {
      variations.push(lower.slice(0, -2));
    }

    // Handle -ies endings (berries -> berry)
    if (lower.endsWith("ies") && lower.length > 4) {
      variations.push(lower.slice(0, -3) + "y");
    }
  } else {
    // Try adding 's' for singular -> plural
    variations.push(lower + "s");

    // Handle -y endings (berry -> berries)
    if (lower.endsWith("y") && lower.length > 2) {
      const beforeY = lower.charAt(lower.length - 2);
      // Only if consonant before y
      if (!"aeiou".includes(beforeY)) {
        variations.push(lower.slice(0, -1) + "ies");
      }
    }

    // Handle common -es plurals (tomato -> tomatoes, potato -> potatoes)
    if (
      lower.endsWith("o") ||
      lower.endsWith("ch") ||
      lower.endsWith("sh") ||
      lower.endsWith("x") ||
      lower.endsWith("z")
    ) {
      variations.push(lower + "es");
    }
  }

  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Check if an ingredient matches any variation of the filter
 * @param {string} ingredientName - The ingredient to check
 * @param {string} filterName - The filter to match against
 * @returns {boolean} True if there's a match
 */
function matchesIngredient(ingredientName, filterName) {
  const ingredientLower = ingredientName.toLowerCase();
  const filterLower = filterName.toLowerCase();

  // Direct match
  if (
    ingredientLower.includes(filterLower) ||
    filterLower.includes(ingredientLower)
  ) {
    return true;
  }

  // Check variations
  const filterVariations = generateIngredientVariations(filterLower);
  const ingredientVariations = generateIngredientVariations(ingredientLower);

  for (const filterVar of filterVariations) {
    for (const ingredientVar of ingredientVariations) {
      if (
        ingredientVar.includes(filterVar) ||
        filterVar.includes(ingredientVar)
      ) {
        return true;
      }
    }
  }

  return false;
}

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
    setIngredientFilters,
    matchesIngredient,
    generateIngredientVariations,
  };
}
