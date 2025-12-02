<template>
  <div class="home-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">Loading recipes...</div>

    <!-- Public Recipes Section -->
    <!-- My Recipes (owner) -->
    <section v-if="isLoggedIn && !isLoading" class="recipes-section">
      <h3>My Recipes ({{ filteredMyRecipes.length }})</h3>
      <div v-if="myRecipes.length === 0 && !hasActiveFilters" class="empty-state">
        You haven't created any recipes yet. Add one from the sidebar!
      </div>
      <div v-else-if="filteredMyRecipes.length === 0" class="empty-state">
        No recipes match your search criteria.
      </div>
      <div v-else>
        <div v-if="viewMode === 'grid'" class="recipes-grid">
          <RecipeDisplay
            v-for="(recipe, index) in filteredMyRecipes"
            :key="`${recipe._id}-${index}`"
            :recipe="recipe"
            @click="onRecipeClick"
          />
        </div>
        <div v-else class="recipes-row">
          <div
            class="recipe-item"
            v-for="(recipe, index) in filteredMyRecipes"
            :key="`${recipe._id}-${index}`"
          >
            <RecipeDisplay :recipe="recipe" @click="onRecipeClick" />
          </div>
        </div>
      </div>
    </section>

    <!-- Recipes that are in the user's collections -->
    <section v-if="isLoggedIn && !isLoading" class="recipes-section">
      <h3>
        Recipes In My Collections ({{ filteredCollectionRecipes.length }})
      </h3>
      <div v-if="collectionRecipes.length === 0 && !hasActiveFilters" class="empty-state">
        You don't have any recipes in your collections yet.
      </div>
      <div
        v-else-if="filteredCollectionRecipes.length === 0"
        class="empty-state"
      >
        No recipes match your search criteria.
      </div>
      <div v-else>
        <div v-if="viewMode === 'grid'" class="recipes-grid">
          <RecipeDisplay
            v-for="(recipe, index) in filteredCollectionRecipes"
            :key="`${recipe._id}-${index}`"
            :recipe="recipe"
            @click="onRecipeClick"
          />
        </div>
        <div v-else class="recipes-row">
          <div
            class="recipe-item"
            v-for="(recipe, index) in filteredCollectionRecipes"
            :key="`${recipe._id}-${index}`"
          >
            <RecipeDisplay :recipe="recipe" @click="onRecipeClick" />
          </div>
        </div>
      </div>
    </section>

    <!-- Public Recipes Section -->
    <section v-if="!isLoading" class="recipes-section">
      <h3>Public Recipes ({{ filteredRecipes.length }})</h3>
      <div
        v-if="filteredRecipes.length === 0 && allRecipes.length === 0"
        class="empty-state"
      >
        No recipes found. Create one to get started!
      </div>
      <div v-else-if="filteredRecipes.length === 0" class="empty-state">
        No recipes match your search criteria.
      </div>
      <div v-else>
        <div v-if="viewMode === 'grid'" class="recipes-grid">
          <RecipeDisplay
            v-for="(recipe, index) in filteredRecipes"
            :key="`${recipe._id}-${index}`"
            :recipe="recipe"
            @click="onRecipeClick"
          />
        </div>
        <div v-else class="recipes-row">
          <div
            class="recipe-item"
            v-for="(recipe, index) in filteredRecipes"
            :key="`${recipe._id}-${index}`"
          >
            <RecipeDisplay :recipe="recipe" @click="onRecipeClick" />
          </div>
        </div>
      </div>
    </section>

    <!-- Global view toggle -->
    <div class="global-view-toggle">
      <button class="view-toggle" @click="toggleViewMode">
        {{ viewMode === "grid" ? "Horizontal" : "Grid" }}
      </button>
    </div>

    <!-- Debug output
    <section class="debug-section">
      <h3>Search & Filter State for Debugging</h3>
      <p><strong>Recipe Search:</strong> {{ searchQuery || "(none)" }}</p>
      <p>
        <strong>Ingredient Filters:</strong>
        {{ ingredientFilters.length ? ingredientFilters.join(", ") : "(none)" }}
      </p>
    </section> -->

    <!-- Add Recipe Popup -->
    <AddRecipePopup
      :isOpen="isAddRecipePopupOpen"
      :collections="userCollections"
      @close="closeAddRecipePopup"
      @submit="handleRecipeSubmit"
      @submitParsed="handleParsedRecipeSubmit"
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

    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="message success-message">
      ✓ {{ successMessage }}
    </div>

    <!-- Error Message -->
    <div v-if="showErrorMessage" class="message error-message">
      ✗ {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
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

import {
  createRecipe,
  parseIngredients,
  setImage,
  getAllRecipesGlobal,
  search,
  getAllMyRecipes,
  findRecipeByIngredient,
  filterIngredientAndSearch,
  findRecipeByIngredientWithinRecipes,
  searchWithinRecipes,
  filterIngredientAndSearchWithinRecipes,
} from "../api/Recipe.js";
import {
  getMyCollections,
  addItemToCollection,
  createCollection,
  addMemberToCollection,
} from "../api/Collecting.js";
import LoginPopup from "../components/LoginPopup.vue";

const { token, isLoggedIn, logout, init, user } = useAuth();
const showLogin = ref(false);

// Recipes from API
const allRecipes = ref([]); //global recipes
const myRecipes = ref([]);
const collectionRecipes = ref([]);
const isLoading = ref(false);

// Computed to check if there are active search/filter criteria
const hasActiveFilters = computed(() => {
  return (searchQuery.value?.trim() || ingredientFilters.value.length > 0);
});

// Watch for filter changes and fetch filtered results from backend
watch(
  [searchQuery, ingredientFilters],
  async ([newQuery, newFilters]) => {
    await fetchFilteredRecipes();
    if (isLoggedIn.value) {
      await fetchFilteredMyRecipes();
      await fetchFilteredCollectionRecipes();
    }
  },
  { deep: true }
);

async function fetchFilteredRecipes() {
  isLoading.value = true;
  try {
    const hasQuery = searchQuery.value?.trim();
    const hasFilters = ingredientFilters.value.length > 0;

    let recipes = [];

    // If searching/filtering, search across ALL recipes (including private ones)
    if (hasQuery && hasFilters) {
      console.log("Searching ALL recipes with both query and ingredients");
      recipes = await filterIngredientAndSearch(
        searchQuery.value.trim(),
        ingredientFilters.value
      );
    } else if (hasQuery) {
      console.log("Searching ALL recipes with query:", searchQuery.value);
      // Use the search() function which searches all recipes, not just public
      recipes = await search(searchQuery.value.trim());
    } else if (hasFilters) {
      console.log(
        "Filtering ALL recipes by ingredients:",
        ingredientFilters.value
      );
      recipes = await findRecipeByIngredient(ingredientFilters.value);
    } else {
      // No filters - just get public recipes
      console.log("Fetching public recipes (no filters)");
      recipes = await getAllRecipesGlobal();
    }

    // Preserve order from backend
    allRecipes.value = [...(recipes || [])];
    console.log("Total recipes found:", allRecipes.value.length);
  } catch (error) {
    console.error("Failed to fetch filtered recipes:", error);
    allRecipes.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function fetchFilteredMyRecipes() {
  if (!isLoggedIn.value) return;

  try {
    const hasQuery = searchQuery.value?.trim();
    const hasFilters = ingredientFilters.value.length > 0;

    // If searching/filtering, results come from the global search
    // Just filter to show only recipes owned by the user
    if (hasQuery || hasFilters) {
      const myOwnerId = user.value?.userId;
      const myOwnRecipes = allRecipes.value.filter(
        (r) => r.owner === myOwnerId
      );
      myRecipes.value = [...myOwnRecipes].reverse();
    } else {
      // No filters - fetch user's recipes normally
      const allMyRecipes = await getAllMyRecipes(token.value);
      myRecipes.value = [...(allMyRecipes || [])].reverse();
    }

    console.log("My recipes count:", myRecipes.value.length);
  } catch (error) {
    console.error("Failed to fetch filtered my recipes:", error);
    myRecipes.value = [];
  }
}

async function fetchFilteredCollectionRecipes() {
  if (!isLoggedIn.value) return;

  try {
    const hasQuery = searchQuery.value?.trim();
    const hasFilters = ingredientFilters.value.length > 0;

    // Get collections to know which recipes belong to user's collections
    const response = await getMyCollections(token.value);
    userCollections.value = response || [];

    // Build set of recipe IDs in user's collections
    const collectionRecipeIds = new Set();
    (userCollections.value || []).forEach((col) => {
      const items = col.items || col.recipes || [];
      if (!Array.isArray(items)) return;
      items.forEach((it) => {
        let candidate = it;
        if (candidate && candidate.recipe) candidate = candidate.recipe;
        const id =
          (candidate && (candidate._id || candidate.id)) ||
          (typeof candidate === "string" ? candidate : null);
        if (id) collectionRecipeIds.add(id);
      });
    });

    if (hasQuery || hasFilters) {
      // Filter from global search results
      const myOwnerId = user.value?.userId;
      const myRecipesSet = new Set((myRecipes.value || []).map((r) => r._id));

      const filtered = allRecipes.value.filter((r) => {
        // Must be in a collection
        if (!collectionRecipeIds.has(r._id)) return false;
        // Exclude if it's in my own recipes (to avoid duplication)
        if (myRecipesSet.has(r._id)) return false;
        return true;
      });

      collectionRecipes.value = [...filtered];
    } else {
      // No filters - aggregate from collections normally
      const aggregated = [];
      const seen = new Set();
      (userCollections.value || []).forEach((col) => {
        const items = col.items || col.recipes || [];
        if (!Array.isArray(items)) return;
        items.forEach((it) => {
          let candidate = it;
          if (candidate && candidate.recipe) candidate = candidate.recipe;
          const id =
            (candidate && (candidate._id || candidate.id)) ||
            (typeof candidate === "string" ? candidate : null);
          if (!id) return;
          if (seen.has(id)) return;
          seen.add(id);
          if (typeof candidate === "string") {
            const found =
              (allRecipes.value || []).find((r) => r._id === candidate) ||
              (myRecipes.value || []).find((r) => r._id === candidate);
            if (found) aggregated.push(found);
          } else {
            aggregated.push(candidate);
          }
        });
      });

      const myRecipesSet = new Set((myRecipes.value || []).map((r) => r._id));
      collectionRecipes.value = aggregated.filter(
        (r) => !myRecipesSet.has(r._id)
      );
    }

    console.log("Collection recipes count:", collectionRecipes.value.length);
  } catch (error) {
    console.error("Failed to fetch filtered collection recipes:", error);
    collectionRecipes.value = [];
  }
}

// Computed filtered global recipes - now just excludes user's own recipes
const filteredRecipes = computed(() => {
  let recipes = allRecipes.value;

  // Exclude recipes that belong to the current user (so they only appear in My Recipes)
  if (isLoggedIn.value) {
    const myRecipesSet = new Set((myRecipes.value || []).map((r) => r._id));
    const collectionRecipesSet = new Set(
      (collectionRecipes.value || []).map((r) => r._id)
    );
    const myOwnerId = user.value?.userId;
    recipes = recipes.filter((r) => {
      if (!r) return false;
      // Exclude recipes the user owns (shown in My Recipes)
      if (myRecipesSet.has(r._id)) return false;
      // Exclude recipes that are already in the user's collections
      if (collectionRecipesSet.has(r._id)) return false;
      if (myOwnerId && r.owner === myOwnerId) return false;
      return true;
    });
  }

  return recipes;
});

// Computed filtered my-recipes - already filtered by backend
const filteredMyRecipes = computed(() => {
  return myRecipes.value;
});

// Computed filtered collection recipes - already filtered by backend
const filteredCollectionRecipes = computed(() => {
  return collectionRecipes.value;
});

// Success/Error messages
const showSuccessMessage = ref(false);
const successMessage = ref("");
const showErrorMessage = ref(false);
const errorMessage = ref("");

function showSuccess(message) {
  successMessage.value = message;
  showSuccessMessage.value = true;
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 3000);
}

function showError(message) {
  errorMessage.value = message;
  showErrorMessage.value = true;
  setTimeout(() => {
    showErrorMessage.value = false;
  }, 5000);
}

onMounted(async () => {
  setTitle("home");
  setBreadcrumbs([]);
  setActions([]);
  await init();
  await fetchFilteredRecipes();
  if (isLoggedIn.value) {
    await fetchFilteredMyRecipes();
    await fetchFilteredCollectionRecipes();
  }
});

async function fetchMyRecipes() {
  // Deprecated - use fetchFilteredMyRecipes instead
  await fetchFilteredMyRecipes();
}

//Global recipes
async function fetchAllRecipes() {
  // Deprecated - use fetchFilteredRecipes instead
  await fetchFilteredRecipes();
}

async function fetchCollections() {
  // Deprecated - use fetchFilteredCollectionRecipes instead
  await fetchFilteredCollectionRecipes();
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

// Global view mode for all sections: 'grid' or 'horizontal'
const viewMode = ref("grid");

function toggleViewMode() {
  viewMode.value = viewMode.value === "grid" ? "horizontal" : "grid";
}

// Collections data
const userCollections = ref([]);

async function refreshAllData() {
  await fetchFilteredRecipes();
  if (isLoggedIn.value) {
    await fetchFilteredMyRecipes();
    await fetchFilteredCollectionRecipes();
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

    // Set isPublic flag separately if provided
    if (typeof recipeData.isPublic === "boolean") {
      try {
        // Assuming there's an API function to set the public flag
        await setRecipePublic(token.value, recipeId, recipeData.isPublic);
        console.log("Public flag set successfully");
      } catch (error) {
        console.error("Failed to set public flag:", error);
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
        // Refresh collections so the "Recipes In My Collections" section updates
        await fetchFilteredCollectionRecipes();
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert(`Recipe "${recipeData.name}" created successfully!`);

    // Refresh recipes list
    await refreshAllData();
  } catch (error) {
    console.error("Failed to create recipe:", error);
    alert(`Failed to create recipe: ${error.message}`);
  }
}

async function handleParsedRecipeSubmit(submissionData) {
  if (!token.value) {
    alert("Please sign in to create a recipe");
    return;
  }

  try {
    const { parsedRecipeId, image, collection } = submissionData;

    // Set image if provided
    if (image?.trim()) {
      try {
        await setImage(token.value, parsedRecipeId, image);
        console.log("Image set successfully");
      } catch (error) {
        console.error("Failed to set image:", error);
      }
    }

    // Add to collection if selected
    if (collection && parsedRecipeId) {
      try {
        await addItemToCollection(token.value, collection, parsedRecipeId);
        console.log(`Added recipe to collection: ${collection}`);
        // Refresh collections so the collection recipes list updates
        await fetchFilteredCollectionRecipes();
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert("Recipe created successfully from link!");

    // Refresh recipes list
    await refreshAllData();
  } catch (error) {
    console.error("Failed to update parsed recipe:", error);
    alert(`Failed to update recipe: ${error.message}`);
  }
}

function handleAddCollection() {
  console.log("Add collection clicked");
  isAddCollectionPopupOpen.value = true;
}

function closeAddCollectionPopup() {
  isAddCollectionPopupOpen.value = false;
}

async function handleCollectionSubmit(collectionData) {
  if (!token.value) {
    showError("Please sign in to create a collection");
    return;
  }

  try {
    const newCollection = await createCollection(
      token.value,
      collectionData.name
    );

    let collectionId;
    if (typeof newCollection === "string") {
      collectionId = newCollection;
    } else {
      collectionId = newCollection._id || newCollection.id;
    }

    if (!collectionId) {
      throw new Error("Collection was created but no ID was returned");
    }

    // Add shared users
    for (const email of collectionData.sharedUsers || []) {
      try {
        await addMemberToCollection(token.value, collectionId, email);
      } catch (error) {
        console.error(`Failed to add member ${email}:`, error);
      }
    }

    // Add recipes
    for (const recipeId of collectionData.recipes || []) {
      try {
        await addItemToCollection(token.value, collectionId, recipeId);
      } catch (error) {
        console.error(`Failed to add recipe ${recipeId}:`, error);
      }
    }

    await fetchFilteredCollectionRecipes();
    showSuccess(`Collection "${collectionData.name}" created successfully!`);
  } catch (error) {
    console.error("Failed to create collection:", error);
    showError(`Failed to create collection: ${error.message}`);
  }
}

async function handleRecipeSearch(query) {
  console.log("Home - handleRecipeSearch received query:", query);
  searchQuery.value = query;
  // Watch will trigger fetchFilteredRecipes automatically
}

function handleIngredientFilter(ingredients) {
  console.log("Filter by ingredients:", ingredients);
  ingredientFilters.value = ingredients;
  // Watch will trigger fetchFilteredRecipes automatically
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

/* Horizontal scroll layout */
.recipes-row {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
}

.recipe-item {
  flex: 0 0 320px; /* show ~3-4 items depending on container width */
  border: none;
  background: transparent;
}

.recipes-row::-webkit-scrollbar {
  height: 10px;
}
.recipes-row::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.15);
  border-radius: 8px;
}
.global-view-toggle {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  width: 100%;
}
.view-toggle {
  margin-left: 0.75rem;
  font-size: 0.85rem;
  padding: 0.25rem 0.5rem;
  /* border-radius: 6px; */
  border: none;
  background: transparent;
  color: lightgray;
  /* cursor: pointer; */
}
.view-toggle:hover {
  background: #f3f4f6;
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
/* success/error message */
.message {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
  z-index: 1000;
}

.success-message {
  background: #059669;
  color: white;
}

.error-message {
  background: #dc2626;
  color: white;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
