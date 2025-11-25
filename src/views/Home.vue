<template>
  <div class="home-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">Loading recipes...</div>

    <!-- All Recipes Section -->
    <section v-else class="recipes-section">
      <h3>All Recipes ({{ filteredRecipes.length }})</h3>
      <div
        v-if="filteredRecipes.length === 0 && allRecipes.length === 0"
        class="empty-state"
      >
        No recipes found. Create one to get started!
      </div>
      <div v-else-if="filteredRecipes.length === 0" class="empty-state">
        No recipes match your search criteria.
      </div>
      <div v-else class="recipes-grid">
        <RecipeDisplay
          v-for="recipe in filteredRecipes"
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
        {{ ingredientFilters.length ? ingredientFilters.join(", ") : "(none)" }}
      </p>
    </section>

    <!-- Add Recipe Popup -->
    <AddRecipePopup
      :isOpen="isAddRecipePopupOpen"
      :collections="userCollections"
      @close="closeAddRecipePopup"
      @submit="handleRecipeSubmit"
    />

    <!-- Add Collection Popup -->
    <AddCollectionPopup
      :isOpen="isAddCollectionPopupOpen"
      :recipes="allRecipes"
      @close="closeAddCollectionPopup"
      @submit="handleCollectionSubmit"
    />
    <!-- Login Popup -->
    <LoginPopup
      :isOpen="showLogin"
      @close="showLogin = false"
      @success="onLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import { useAppSearch } from "../composables/useAppSearch.js";
import { useHeader } from "../composables/useHeader.js";
import RecipeDisplay from "../components/RecipeDisplay.vue";

const router = useRouter();
const { searchQuery, ingredientFilters } = useAppSearch();
const { setTitle, setBreadcrumbs, setActions } = useHeader();
import CollectionDisplay from "../components/CollectionDisplay.vue";
import AddRecipePopup from "../components/AddRecipePopup.vue";
import AddCollectionPopup from "../components/AddCollectionPopup.vue";
import { getMyCollections } from "../api/Collecting.js";
import {
  createRecipe,
  parseIngredients,
  setImage,
  getAllRecipesGlobal,
  searchRecipes,
} from "../api/Recipe.js";
import { addItemToCollection } from "../api/Collecting.js";

const { token, isLoggedIn, logout, init } = useAuth();
const showLogin = ref(false);

// Recipes from API
const allRecipes = ref([]);
const isLoading = ref(false);

// Computed filtered recipes
const filteredRecipes = computed(() => {
  let recipes = allRecipes.value;

  // Filter by search query (recipe title)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    recipes = recipes.filter((recipe) =>
      recipe.title?.toLowerCase().includes(query)
    );
  }

  // Filter by ingredients
  if (ingredientFilters.value.length > 0) {
    recipes = recipes.filter((recipe) => {
      // Check if recipe has all the filtered ingredients
      return ingredientFilters.value.every((filterIngredient) => {
        const filterLower = filterIngredient.toLowerCase();
        return recipe.ingredients?.some((ingredient) =>
          ingredient.name?.toLowerCase().includes(filterLower)
        );
      });
    });
  }

  return recipes;
});

onMounted(async () => {
  setTitle("home");
  setBreadcrumbs([]);
  setActions([]);
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

async function handleLogout() {
  await logout();
}

function onLoginSuccess() {
  console.log("Login successful!");
}

// Popup state
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);

// Collections data
const userCollections = ref([]);

async function fetchCollections() {
  if (!isLoggedIn.value) return;

  try {
    const response = await getMyCollections(token.value);
    userCollections.value = response;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
  }
}

function handleAddRecipe() {
  console.log("Add recipe clicked");
  isAddRecipePopupOpen.value = true;
}

function closeAddRecipePopup() {
  isAddRecipePopupOpen.value = false;
}

async function handleRecipeSubmit(recipeData) {
  if (!token.value) {
    alert("Please sign in to create a recipe");
    return;
  }

  try {
    // Create recipe
    const recipeId = await createRecipe(
      token.value,
      recipeData.name,
      recipeData.link?.trim() || undefined,
      recipeData.description?.trim() || undefined
    );
    console.log("Recipe created with ID:", recipeId);

    // Set image separately if provided
    if (recipeData.image?.trim()) {
      try {
        await setImage(token.value, recipeId, recipeData.image);
        console.log("Image set successfully");
      } catch (error) {
        console.error("Failed to set image:", error);
      }
    }

    // Add ingredients if provided
    if (recipeData.ingredientsText && recipeData.ingredientsText.trim()) {
      try {
        const ingredients = await parseIngredients(
          token.value,
          recipeId,
          recipeData.ingredientsText
        );
        console.log("Ingredients added:", ingredients);
      } catch (error) {
        console.error("Failed to add ingredients:", error);
      }
    }

    // Add to collection if selected
    if (recipeData.collection && recipeId) {
      try {
        await addItemToCollection(token.value, recipeData.collection, recipeId);
        console.log(`Added recipe to collection: ${recipeData.collection}`);
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert(`Recipe "${recipeData.name}" created successfully!`);

    // Refresh recipes list
    await fetchAllRecipes();
  } catch (error) {
    console.error("Failed to create recipe:", error);
    alert(`Failed to create recipe: ${error.message}`);
  }
}

function handleAddCollection() {
  console.log("Add collection clicked");
  isAddCollectionPopupOpen.value = true;
}

function closeAddCollectionPopup() {
  isAddCollectionPopupOpen.value = false;
}

function handleCollectionSubmit(collectionData) {
  console.log("Collection submitted:", collectionData);
  // Here you would typically send the data to your backend API
  alert(`Collection "${collectionData.name}" created successfully!`);
}

async function handleRecipeSearch(query) {
  console.log("Home - handleRecipeSearch received query:", query);
  console.log("Query type:", typeof query, "Query length:", query?.length);
  searchQuery.value = query;

  // If search query is empty or too short, fetch all recipes
  if (!query || !query.trim()) {
    console.log("Empty query, fetching all recipes");
    await fetchAllRecipes();
    return;
  }

  // Trim the query
  const trimmedQuery = query.trim();

  // Call API to search by title
  console.log("Calling searchRecipes API with:", trimmedQuery);
  isLoading.value = true;
  try {
    const recipes = await searchRecipes(trimmedQuery);
    allRecipes.value = recipes || [];
    console.log("Search results:", allRecipes.value.length, "recipes found");
  } catch (error) {
    console.error("Failed to search recipes:", error);
    // On error, show empty results instead of crashing
    allRecipes.value = [];
    alert(`Search failed: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
}

function handleIngredientFilter(ingredients) {
  console.log("Filter by ingredients:", ingredients);
  ingredientFilters.value = ingredients;
}

function handleProfileClick() {
  router.push("/profile");
}

function handleHomeClick() {
  router.push("/");
}

function onRecipeClick(recipe) {
  console.log("Recipe clicked:", recipe);
  router.push({
    name: "Recipe",
    params: { id: recipe._id },
    query: {
      owner: recipe.owner,
      title: recipe.title,
      recipe: JSON.stringify(recipe),
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
