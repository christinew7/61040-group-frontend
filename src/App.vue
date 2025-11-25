<template>
  <div id="app" class="app-root">
    <div class="app-layout">
      <!-- Global Sidebar -->
      <Sidebar
        :showSearch="shouldShowSearch"
        @add-recipe="handleAddRecipe"
        @add-collection="handleAddCollection"
        @recipe-search="handleRecipeSearch"
        @ingredient-filter-change="handleIngredientFilter"
        @profile-click="handleProfileClick"
        @sign-in="showLogin = true"
        @logout="handleLogout"
        @home-click="handleHomeClick"
      />

      <!-- Main Content Area -->
      <div class="main-content">
        <Header v-if="shouldShowHeader" @sign-in="showLogin = true" />
        <router-view />
      </div>
    </div>

    <!-- Global Popups -->
    <AddRecipePopup
      :isOpen="isAddRecipePopupOpen"
      :collections="userCollections"
      @close="closeAddRecipePopup"
      @submit="handleRecipeSubmit"
    />

    <AddCollectionPopup
      :isOpen="isAddCollectionPopupOpen"
      :recipes="userRecipes"
      @close="closeAddCollectionPopup"
      @submit="handleCollectionSubmit"
    />

    <LoginPopup
      :isOpen="showLogin"
      @close="showLogin = false"
      @success="onLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "./composables/useAuth.js";
import { useAppSearch } from "./composables/useAppSearch.js";
import Sidebar from "./components/Sidebar.vue";
import Header from "./components/Header.vue";
import LoginPopup from "./components/LoginPopup.vue";
import AddRecipePopup from "./components/AddRecipePopup.vue";
import AddCollectionPopup from "./components/AddCollectionPopup.vue";
import { getMyCollections, createCollection, addMemberToCollection, addItemToCollection } from "./api/Collecting.js";
import { createRecipe, parseIngredients, setImage, getAllMyRecipes } from "./api/Recipe.js";
import "./utils/app.css";

const router = useRouter();
const route = useRoute();
const { token, isLoggedIn, logout, init } = useAuth();
const { setSearchQuery, setIngredientFilters } = useAppSearch();

// Global state
const showLogin = ref(false);
const isAddRecipePopupOpen = ref(false);
const isAddCollectionPopupOpen = ref(false);
const userCollections = ref([]);
const userRecipes = ref([]);

// Show search only on Home page
const shouldShowSearch = computed(() => route.name === 'Home');

// Hide header on pages that have their own navbar
const shouldShowHeader = computed(() => {
  return !['Collection', 'Recipe', 'Profile'].includes(route.name);
});

onMounted(async () => {
  await init();
  if (isLoggedIn.value) {
    await fetchCollections();
    await fetchRecipes();
  }
});

// Helper function to get auth token
function getToken() {
  return token.value || "demo-token";
}

async function fetchCollections() {
  if (!isLoggedIn.value) return;
  try {
    const authToken = getToken();
    const response = await getMyCollections(authToken);
    userCollections.value = response;
  } catch (error) {
    console.error("Failed to fetch collections:", error);
  }
}

async function fetchRecipes() {
  if (!isLoggedIn.value) return;
  try {
    const authToken = getToken();
    const response = await getAllMyRecipes(authToken);
    userRecipes.value = response;
  } catch (error) {
    console.error("Failed to fetch recipes:", error);
  }
}

// Navigation Handlers
function handleProfileClick() {
  router.push("/profile");
}

function handleHomeClick() {
  router.push("/");
}

async function handleLogout() {
  await logout();
  router.push("/");
}

function onLoginSuccess() {
  showLogin.value = false;
  fetchCollections();
}

// Popup Handlers
function handleAddRecipe() {
  isAddRecipePopupOpen.value = true;
}

function closeAddRecipePopup() {
  isAddRecipePopupOpen.value = false;
}

function handleAddCollection() {
  isAddCollectionPopupOpen.value = true;
}

function closeAddCollectionPopup() {
  isAddCollectionPopupOpen.value = false;
}

// Search Handlers
function handleRecipeSearch(query) {
  setSearchQuery(query);
}

function handleIngredientFilter(filters) {
  setIngredientFilters(filters);
}

// Recipe/Collection Submission Handlers (moved from views)
async function handleRecipeSubmit(recipeData) {
  try {
    const authToken = getToken();
    
    const recipeId = await createRecipe(
      authToken,
      recipeData.name,
      recipeData.link?.trim() || undefined,
      recipeData.description?.trim() || undefined,
      recipeData.image?.trim() || undefined
    );

    // Set image if provided
    if (recipeData.image?.trim()) {
      try {
        await setImage(authToken, recipeId, recipeData.image);
      } catch (error) {
        console.error("Failed to set image:", error);
      }
    }

    if (recipeData.ingredientsText && recipeData.ingredientsText.trim()) {
      try {
        await parseIngredients(authToken, recipeId, recipeData.ingredientsText);
      } catch (error) {
        console.error("Failed to add ingredients:", error);
      }
    }

    if (recipeData.collection && recipeId) {
      try {
        await addItemToCollection(authToken, recipeData.collection, recipeId);
        await fetchCollections();
      } catch (error) {
        console.error("Failed to add recipe to collection:", error);
      }
    }

    alert(`Recipe "${recipeData.name}" created successfully!`);
    
    // If on a collection or home page, we might want to refresh the view
    // For now, just navigating to the new recipe or staying put is fine
  } catch (error) {
    console.error("Failed to create recipe:", error);
    alert(`Failed to create recipe: ${error.message}`);
  }
}

async function handleCollectionSubmit(collectionData) {
  try {
    const authToken = getToken();
    const newCollection = await createCollection(authToken, collectionData.name);

    if (collectionData.sharedUsers?.length > 0) {
      for (const email of collectionData.sharedUsers) {
        try {
          await addMemberToCollection(authToken, newCollection._id, email);
        } catch (e) { console.error(e); }
      }
    }

    if (collectionData.recipes?.length > 0) {
      for (const recipeId of collectionData.recipes) {
        try {
          await addItemToCollection(authToken, newCollection._id, recipeId);
        } catch (e) { console.error(e); }
      }
    }

    await fetchCollections();
    alert(`Collection "${collectionData.name}" created successfully!`);
  } catch (error) {
    console.error("Failed to create collection:", error);
    alert(`Failed to create collection: ${error.message}`);
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  /* Ensure proper sizing */
  width: 0; 
  background: #f9fafb;
}
</style>
