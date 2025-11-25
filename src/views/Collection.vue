<template>
  <div class="collection-content">
    <!-- Top Navbar with Collection Name -->
    <div class="collection-navbar">
      <h1>{{ collectionName }}</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">Loading collection...</div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>Error loading collection: {{ error }}</p>
      <button @click="fetchCollectionDetails" class="btn-retry">Retry</button>
    </div>

    <!-- Collection Recipes -->
    <div v-else class="recipes-section">
      <div v-if="recipes.length > 0" class="recipes-grid">
        <RecipeDisplay
          v-for="recipe in recipes"
          :key="recipe._id"
          :recipe="recipe"
          @click="onRecipeClick"
        />
      </div>
      <p v-else class="empty-state">
        This collection doesn't have any recipes yet. Add some from the
        sidebar!
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import RecipeDisplay from "../components/RecipeDisplay.vue";
import {
  viewCollection,
  getMyCollections,
  addItemToCollection,
} from "../api/Collecting.js";
import {
  createRecipe,
  getAllMyRecipes,
  parseIngredients,
} from "../api/Recipe.js";
import { useAuth } from "../composables/useAuth.js";

const router = useRouter();
const route = useRoute();
const { token } = useAuth();

// Collection data
const collectionId = ref(route.params.id);
const collectionName = ref("");
const recipes = ref([]);
const members = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Helper function to get auth token
function getToken() {
  return token.value || "demo-token";
}

// Fetch collection details on mount
onMounted(async () => {
  await fetchCollectionDetails();
});

async function fetchCollectionDetails() {
  isLoading.value = true;
  error.value = null;

  try {
    const authToken = getToken();
    const data = await viewCollection(authToken, collectionId.value);

    // viewCollection returns { items: [...], members: [...] }
    // items are recipe IDs (strings), not full recipe objects
    const recipeIds = data.items || [];
    members.value = data.members || [];

    // Fetch all user's recipes
    const allRecipes = await getAllMyRecipes(authToken);

    // Filter to only show recipes that are in this collection
    recipes.value = allRecipes.filter((recipe) =>
      recipeIds.includes(recipe._id)
    );

    console.log("Collection recipe IDs:", recipeIds);
    console.log("Filtered recipes:", recipes.value);

    // Get collection name from route query or use a default
    collectionName.value = route.query.name || "Collection";
  } catch (err) {
    console.error("Failed to fetch collection details:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

function onRecipeClick(recipe) {
  console.log("Recipe clicked:", recipe);
  // Navigate to recipe detail page
  router.push({
    name: "Recipe",
    params: { id: recipe._id },
    query: { recipe: encodeURIComponent(JSON.stringify(recipe)) },
  });
}
</script>

<style scoped>
.collection-content {
  flex: 1;
  background: #f9fafb;
}

/* Top Navbar */
.collection-navbar {
  background: white;
  border-bottom: 2px solid var(--color-primary);
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.collection-navbar h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--color-primary);
  text-transform: lowercase;
}

/* Recipes Section */
.recipes-section {
  padding: 2rem;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 3rem 0;
}

.loading-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 3rem 2rem;
}

.error-state {
  text-align: center;
  padding: 2rem;
}

.error-state p {
  color: #dc2626;
  margin-bottom: 1rem;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: var(--color-primary-dark);
}
</style>
