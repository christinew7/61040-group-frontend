<template>
  <div class="home-view">
    <h2>Home</h2>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">Loading recipes...</div>

    <!-- All Recipes Section -->
    <section v-else class="recipes-section">
      <h3>All Recipes</h3>
      <div v-if="allRecipes.length === 0" class="empty-state">
        No recipes found. Create one to get started!
      </div>
      <div v-else class="recipes-grid">
        <RecipeDisplay
          v-for="recipe in allRecipes"
          :key="recipe._id"
          :recipe="recipe"
          @click="onRecipeClick"
        />
      </div>
    </section>

    <!-- Debug output -->
    <section class="debug-section">
      <h3>Search & Filter State for Debugging</h3>
      <p><strong>Recipe Search:</strong> {{ searchQuery || "(none)" }}</p>
      <p>
        <strong>Ingredient Filters:</strong>
        {{
          ingredientFilters.length ? ingredientFilters.join(", ") : "(none)"
        }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import { useAppSearch } from "../composables/useAppSearch.js";
import RecipeDisplay from "../components/RecipeDisplay.vue";
import { getAllRecipesGlobal } from "../api/Recipe.js";

const router = useRouter();
const { init } = useAuth();
const { searchQuery, ingredientFilters } = useAppSearch();

// Recipes from API
const allRecipes = ref([]);
const isLoading = ref(false);

onMounted(async () => {
  await init();
  await fetchAllRecipes();
});

async function fetchAllRecipes() {
  isLoading.value = true;
  try {
    console.log("Calling getAllRecipesGlobal...");
    const recipes = await getAllRecipesGlobal();
    allRecipes.value = recipes || [];
    console.log("Fetched all recipes:", allRecipes.value);
    console.log("Number of recipes:", allRecipes.value.length);
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
    console.error("Error details:", error.message);
    // Set empty array on error so page still renders
    allRecipes.value = [];
  } finally {
    isLoading.value = false;
  }
}

function onRecipeClick(recipe) {
  console.log("Recipe clicked:", recipe);
  router.push({
    name: "Recipe",
    params: { id: recipe._id },
    query: {
      owner: recipe.owner,
      title: recipe.title,
    },
  });
}
</script>

<style scoped>
.home-view {
  flex: 1;
  max-width: 1200px;
  padding: 2rem;
}

.debug-section {
  margin-top: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.debug-section h3 {
  margin-top: 0;
  font-size: 1rem;
  color: var(--color-primary);
}

.debug-section p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 3rem 2rem;
}

.recipes-section {
  margin-top: 2rem;
}

.recipes-section h3 {
  font-size: 1.5rem;
  color: var(--color-text-dark, #0f172a);
  margin-bottom: 1.5rem;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 3rem 2rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
</style>
