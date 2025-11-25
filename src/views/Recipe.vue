<template>
  <div class="recipe-layout">
    <Sidebar
      :showSearch="false"
      @add-recipe="handleAddRecipe"
      @add-collection="handleAddCollection"
      @profile-click="handleProfileClick"
      @home-click="handleHomeClick"
    />

    <!-- Main Content -->
    <div class="recipe-content">
      <!-- Top Navbar -->
      <Navbar title="recipe" />

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">Loading recipe...</div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>Error loading recipe: {{ error }}</p>
        <button @click="fetchRecipeDetails" class="btn-retry">Retry</button>
      </div>

      <!-- Recipe Details -->
      <div v-else class="recipe-details">
        <!-- Recipe Header with Image -->
        <div class="recipe-header">
          <div class="recipe-image-container">
            <img
              :src="recipe.image || defaultImage"
              :alt="recipe.title"
              class="recipe-image"
            />
          </div>
          <div class="recipe-title-section">
            <h1 class="recipe-title">{{ recipe.title }}</h1>
            <div v-if="recipe.link" class="recipe-link-container">
              <a
                :href="recipe.link"
                target="_blank"
                rel="noopener noreferrer"
                class="recipe-link"
              >
                🔗 View Original Recipe
              </a>
            </div>
          </div>
        </div>

        <!-- Recipe Description -->
        <section v-if="recipe.description" class="recipe-section">
          <h2>Description</h2>
          <p class="recipe-description">{{ recipe.description }}</p>
        </section>

        <!-- Ingredients List -->
        <section class="recipe-section">
          <h2>Ingredients</h2>
          <div v-if="recipe.ingredients && recipe.ingredients.length > 0">
            <ul class="ingredients-list">
              <li
                v-for="(ingredient, index) in recipe.ingredients"
                :key="index"
                class="ingredient-item"
              >
                <span v-if="ingredient.quantity" class="ingredient-quantity">
                  {{ ingredient.quantity }}
                </span>
                <span v-if="ingredient.unit" class="ingredient-unit">
                  {{ ingredient.unit }}
                </span>
                <span class="ingredient-name">
                  {{ ingredient.name }}
                </span>
              </li>
            </ul>
          </div>
          <p v-else class="empty-state">No ingredients listed yet.</p>
        </section>
      </div>
    </div>

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
      @close="closeAddCollectionPopup"
      @submit="handleCollectionSubmit"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import Sidebar from "../components/Sidebar.vue";
import Navbar from "../components/Navbar.vue";
import AddRecipePopup from "../components/AddRecipePopup.vue";
import AddCollectionPopup from "../components/AddCollectionPopup.vue";
import { getRecipe, createRecipe, parseIngredients } from "../api/Recipe.js";
import { getMyCollections, addItemToCollection } from "../api/Collecting.js";
import { useAuth } from "../composables/useAuth.js";

const router = useRouter();
const route = useRoute();
const { token } = useAuth();

// Recipe data
const recipe = ref({
  _id: "",
  title: "",
  description: "",
  link: "",
  image: "",
  ingredients: [],
});
const isLoading = ref(false);
const error = ref(null);

// Popup state
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);

// Collections data for recipe popup
const userCollections = ref([]);

const defaultImage = "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";

// Helper function to get auth token
function getToken() {
  return token.value || "demo-token";
}

// Fetch recipe details on mount
onMounted(async () => {
  await fetchRecipeDetails();
  await fetchCollections();
});

async function fetchCollections() {
  try {
    const authToken = getToken();
    const response = await getMyCollections(authToken);
    userCollections.value = response;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
  }
}

async function fetchRecipeDetails() {
  isLoading.value = true;
  error.value = null;

  try {
    const recipeId = route.params.id;

    console.log("Fetching recipe with ID:", recipeId);

    // First, try to get recipe from query params (most reliable since it's passed from the collection)
    if (route.query.recipe) {
      try {
        recipe.value = JSON.parse(decodeURIComponent(route.query.recipe));
        console.log("Recipe loaded from query params:", recipe.value);
        console.log("Recipe image field:", recipe.value.image);
        isLoading.value = false;
        return;
      } catch (parseErr) {
        console.error("Failed to parse recipe from query params:", parseErr);
        // Continue to API fallback
      }
    }

    // Fallback: Try to get recipe from API (requires owner and title, not just ID)
    // Since the backend doesn't support fetching by ID alone, this will likely fail
    // unless we update the backend or have owner/title info
    const authToken = getToken();
    console.log("Attempting API fetch (may not work without owner/title)");

    const data = await getRecipe(authToken, recipeId);
    recipe.value = data;
  } catch (err) {
    console.error("Failed to fetch recipe details:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
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
  try {
    const authToken = getToken();

    // Create the recipe - returns the recipe ID
    const recipeId = await createRecipe(
      authToken,
      recipeData.name,
      recipeData.link?.trim() || undefined,
      recipeData.description?.trim() || undefined,
      recipeData.image?.trim() || undefined
    );
    console.log("Recipe created with ID:", recipeId);

    // Add ingredients if provided
    if (recipeData.ingredientsText && recipeData.ingredientsText.trim()) {
      try {
        const ingredients = await parseIngredients(
          authToken,
          recipeId,
          recipeData.ingredientsText
        );
        console.log("Ingredients added:", ingredients);
      } catch (error) {
        console.error("Failed to add ingredients:", error);
      }
    }

    // Add the recipe to the selected collection if one was chosen
    if (recipeData.collection && recipeId) {
      try {
        await addItemToCollection(authToken, recipeData.collection, recipeId);
        console.log(`Added recipe to collection: ${recipeData.collection}`);
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert(`Recipe "${recipeData.name}" created successfully!`);
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
  alert(`Collection "${collectionData.name}" created successfully!`);
}

function handleProfileClick() {
  router.push("/profile");
}

function handleHomeClick() {
  router.push("/");
}
</script>

<style scoped>
.recipe-layout {
  display: flex;
  min-height: 100vh;
  align-items: stretch;
}

.recipe-content {
  flex: 1;
  background: #f9fafb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Recipe Details */
.recipe-details {
  padding: 2rem;
  flex: 1;
}

/* Recipe Header */
.recipe-header {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recipe-image-container {
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-title-section {
  padding: 2rem;
}

.recipe-title {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  color: var(--color-text-dark, #0f172a);
  text-transform: capitalize;
}

.recipe-link-container {
  margin-top: 1rem;
}

.recipe-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.2s;
}

.recipe-link:hover {
  background: var(--color-primary-dark);
}

/* Recipe Sections */
.recipe-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recipe-section h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 0.5rem;
}

.recipe-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: var(--color-text-dark, #0f172a);
  margin: 0;
}

/* Ingredients List */
.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow: visible;
  max-height: none;
}

.ingredient-item {
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  border-left: 3px solid var(--color-primary);
  font-size: 1.125rem;
  display: flex;
  gap: 0.375rem;
  align-items: baseline;
}

.ingredient-quantity {
  font-weight: 600;
  color: var(--color-primary);
  flex-shrink: 0;
}

.ingredient-unit {
  color: var(--color-text-dark, #0f172a);
  flex-shrink: 0;
}

.ingredient-name {
  color: var(--color-text-dark, #0f172a);
  flex: 1;
}

/* States */
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
  font-size: 1.125rem;
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

.empty-state {
  text-align: center;
  color: #6b7280;
  font-size: 1rem;
  padding: 2rem 0;
}
</style>
